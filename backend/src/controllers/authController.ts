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

    // Create user
    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email,
      passwordHash,
      profile: {
        firstName,
        lastName,
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

    // Find user with password hash
    const user = await User.findOne({ email }).select('+passwordHash');
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
        res.status(401).json({ error: '2FA code required' });
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
        roles: user.roles,
        profile: user.profile,
        plan: user.plan,
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
      name: `Linkify Pro (${user.email})`,
      issuer: 'Linkify Pro',
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

