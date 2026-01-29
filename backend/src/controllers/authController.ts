
import { Request, Response } from 'express';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { RefreshToken } from '../models/RefreshToken';
import { AuditLog } from '../models/AuditLog';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  validateEmail,
  extractIpAddress,
} from '../utils/auth';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (!validateEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: 'User already exists' });
      return;
    }

    // Generate username from email
    let baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');
    let username = baseUsername;
    let counter = 1;

    // Ensure username is unique
    while (await User.exists({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email,
      passwordHash,
      username,
      profile: {
        firstName,
        lastName,
        isPublic: true,
      },
      plan: {
        name: 'free',
        limits: {
          shortUrls: 100,
          clicksPerMonth: 10000,
          customDomains: 0,
        },
      },
    });

    // Audit log
    await AuditLog.create({
      action: 'register',
      userId: user._id,
      targetCollection: 'users',
      targetId: user._id,
      meta: {
        ip: extractIpAddress(req),
        userAgent: req.get('User-Agent'),
      },
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        roles: user.roles,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, twoFACode } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user with password hash and 2FA secret (if needed)
    const user = await User.findOne({ email }).select('+passwordHash +twoFA.secret');
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check 2FA if enabled
    if (user.twoFA?.enabled) {
      if (!twoFACode) {
        // Return 200 so axios doesn't throw, letting frontend handle the next step
        res.status(200).json({ requires2FA: true, message: 'Please enter your 2FA code' });
        return;
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFA.secret,
        encoding: 'base32',
        token: twoFACode,
        window: 2,
      });

      if (!verified) {
        res.status(401).json({ error: 'Invalid 2FA code' });
        return;
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.roles);
    const refreshToken = generateRefreshToken(user._id.toString());
    const refreshTokenHash = hashToken(refreshToken);

    // Save session and refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await Promise.all([
      Session.create({
        userId: user._id,
        refreshTokenHash,
        deviceInfo: {
          userAgent: req.get('User-Agent'),
          ip: extractIpAddress(req),
        },
        expiresAt,
      }),
      RefreshToken.create({
        userId: user._id,
        refreshTokenHash,
        expiresAt,
      }),
    ]);

    // Audit log
    await AuditLog.create({
      action: 'login',
      userId: user._id,
      targetCollection: 'users',
      targetId: user._id,
      meta: {
        ip: extractIpAddress(req),
        userAgent: req.get('User-Agent'),
      },
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        roles: user.roles,
        profile: user.profile,
        plan: user.plan,
        twoFA: { enabled: !!user.twoFA?.enabled },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Refresh access token
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    // Verify token
    const { userId } = verifyRefreshToken(token);
    const refreshTokenHash = hashToken(token);

    // Check if token exists and is valid
    const refreshTokenDoc = await RefreshToken.findOne({
      userId,
      refreshTokenHash,
      revoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!refreshTokenDoc) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id.toString(), user.roles);

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

/**
 * Logout user
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    const userId = req.userId;

    if (token && userId) {
      const refreshTokenHash = hashToken(token);
      await RefreshToken.updateOne(
        { userId, refreshTokenHash },
        { revoked: true }
      );
    }

    // Audit log
    if (userId) {
      await AuditLog.create({
        action: 'logout',
        userId: userId as any,
        targetCollection: 'users',
        meta: {
          ip: extractIpAddress(req),
          userAgent: req.get('User-Agent'),
        },
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Setup 2FA
 */
export const setup2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `URL-Shorterner Pro (${user.email})`,
      issuer: 'URL-Shorterner Pro',
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Save secret (but don't enable yet)
    user.twoFA = {
      secret: secret.base32!,
      enabled: false,
      backupCodes: backupCodes.map((code) => hashToken(code)),
    };
    await user.save();

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes, // Only show once!
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Enable 2FA
 */
export const enable2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { code } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!code) {
      res.status(400).json({ error: '2FA code is required' });
      return;
    }

    const user = await User.findById(userId).select('+twoFA.secret');
    if (!user || !user.twoFA?.secret) {
      res.status(400).json({ error: '2FA not set up' });
      return;
    }

    // Verify code
    const verified = speakeasy.totp.verify({
      secret: user.twoFA.secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      res.status(400).json({ error: 'Invalid 2FA code' });
      return;
    }

    // Enable 2FA
    user.twoFA.enabled = true;
    await user.save();

    // Audit log
    await AuditLog.create({
      action: '2fa_enable',
      userId: user._id,
      targetCollection: 'users',
      targetId: user._id,
      meta: {
        ip: extractIpAddress(req),
        userAgent: req.get('User-Agent'),
      },
    });

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Disable 2FA
 */
export const disable2FA = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { password } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Password is required to disable 2FA' });
      return;
    }

    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (!user.twoFA?.enabled) {
      res.status(400).json({ error: '2FA is not enabled' });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }

    // Disable 2FA
    user.twoFA.enabled = false;
    await user.save();

    // Audit log
    await AuditLog.create({
      action: '2fa_disable',
      userId: user._id,
      targetCollection: 'users',
      targetId: user._id,
      meta: {
        ip: extractIpAddress(req),
        userAgent: req.get('User-Agent'),
      },
    });

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const {
      firstName,
      lastName,
      bio,
      phone,
      jobTitle,
      company,
      location,
      username,
      isPublic
    } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Handle username update with validation
    if (username && username !== user.username) {
      // Validate username format
      const usernameRegex = /^[a-z0-9_-]+$/;
      if (!usernameRegex.test(username.toLowerCase())) {
        res.status(400).json({
          error: 'Username can only contain lowercase letters, numbers, hyphens, and underscores'
        });
        return;
      }

      if (username.length < 3 || username.length > 30) {
        res.status(400).json({
          error: 'Username must be between 3 and 30 characters'
        });
        return;
      }

      // Check if username is already taken
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }

      user.username = username.toLowerCase();
    }

    if (!user.profile) {
      user.profile = {};
    }

    if (firstName) user.profile.firstName = firstName;
    if (lastName) user.profile.lastName = lastName;
    if (bio !== undefined) user.profile.bio = bio;
    if (phone !== undefined) user.profile.phone = phone;
    if (jobTitle !== undefined) user.profile.jobTitle = jobTitle;
    if (company !== undefined) user.profile.company = company;
    if (location !== undefined) user.profile.location = location;
    if (isPublic !== undefined) user.profile.isPublic = isPublic;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        roles: user.roles,
        profile: user.profile,
        plan: user.plan,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user profile
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        roles: user.roles,
        profile: user.profile,
        plan: user.plan,
        twoFA: { enabled: !!user.twoFA?.enabled },
        linkhubLinks: user.linkhubLinks || [],
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


/**
 * Change password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password are required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters' });
      return;
    }

    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid current password' });
      return;
    }

    // Update password
    user.passwordHash = await hashPassword(newPassword);

    // Fix for missing username: if username is missing, generate one from email
    if (!user.username) {
      console.warn(`User ${user._id} missing username, generating one...`);
      let baseUsername = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');

      // Fallback if regex removed everything (e.g. email was "!!!@...com") or too short
      if (!baseUsername || baseUsername.length < 3) {
        baseUsername = `user_${Date.now()}`;
      }

      let username = baseUsername;
      let counter = 1;

      // Ensure unique (basic check)
      while (await User.exists({ username, _id: { $ne: user._id } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      user.username = username;
    }

    try {
      await user.save();
    } catch (saveError) {
      console.error('User save error during password change:', saveError);
      res.status(500).json({ error: 'Failed to save user data: ' + (saveError instanceof Error ? saveError.message : String(saveError)) });
      return;
    }

    // Audit log
    await AuditLog.create({
      action: 'change_password',
      userId: user._id,
      targetCollection: 'users',
      targetId: user._id,
      meta: {
        ip: extractIpAddress(req),
        userAgent: req.get('User-Agent'),
      },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get linkhub links
 */
export const getLinkHubLinks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId).select('linkhubLinks');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const links = (user.linkhubLinks || []).sort((a, b) => a.position - b.position);
    res.json({ links });
  } catch (error) {
    console.error('Get linkhub links error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update linkhub links (replace entire array)
 */
export const updateLinkHubLinks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { links } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!Array.isArray(links)) {
      res.status(400).json({ error: 'Links must be an array' });
      return;
    }

    // Validate each link
    for (const link of links) {
      if (!link.title || !link.url) {
        res.status(400).json({ error: 'Each link must have a title and url' });
        return;
      }
      if (typeof link.position !== 'number') {
        res.status(400).json({ error: 'Each link must have a numeric position' });
        return;
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update links with proper structure
    user.linkhubLinks = links.map((link, index) => ({
      title: link.title,
      url: link.url,
      position: link.position !== undefined ? link.position : index,
      visible: link.visible !== undefined ? link.visible : true,
      icon: link.icon || undefined,
    }));

    await user.save();

    // Audit log
    await AuditLog.create({
      action: 'update_linkhub_links',
      userId: user._id,
      targetCollection: 'users',
      targetId: user._id,
      meta: {
        linksCount: links.length,
        ip: extractIpAddress(req),
        userAgent: req.get('User-Agent'),
      },
    });

    res.json({ 
      message: 'LinkHub links updated successfully',
      links: user.linkhubLinks.sort((a, b) => a.position - b.position)
    });
  } catch (error) {
    console.error('Update linkhub links error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
