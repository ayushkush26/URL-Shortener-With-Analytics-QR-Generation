import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { nanoid } from 'nanoid';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const REFRESH_TOKEN_SECRET =
    process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (
    password: string,
    hash: string
): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

/**
 * Hash a token using SHA256 (for storing in DB)
 */
export const hashToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate JWT access token
 */
export const generateAccessToken = (userId: string, roles: string[] = ['user']): string => {
    const token = jwt.sign(
        {
            userId,
            roles,
            type: 'access',
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRY,
            issuer: 'linkify-pro',
            subject: userId,
        } as any
    );
    return token;
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string): string => {
    const token = jwt.sign(
        {
            userId,
            type: 'refresh',
        },
        REFRESH_TOKEN_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRY,
            issuer: 'linkify-pro',
            subject: userId,
        } as any
    );
    return token;
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): { userId: string; roles: string[] } => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as {
            userId: string;
            roles: string[];
            type: string;
        };
        if (decoded.type !== 'access') {
            throw new Error('Invalid token type');
        }
        return { userId: decoded.userId, roles: decoded.roles };
    } catch (error) {
        throw new Error(`Invalid token: ${(error as Error).message}`);
    }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string } => {
    try {
        const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as {
            userId: string;
            type: string;
        };
        if (decoded.type !== 'refresh') {
            throw new Error('Invalid token type');
        }
        return { userId: decoded.userId };
    } catch (error) {
        throw new Error(`Invalid token: ${(error as Error).message}`);
    }
};

/**
 * Generate API key
 */
export const generateApiKey = (): {
    keyId: string;
    secret: string;
    apiKey: string;
} => {
    const keyId = `key_${nanoid(16)}`;
    const secret = nanoid(32);
    const apiKey = `${keyId}.${secret}`;
    return { keyId, secret, apiKey };
};

/**
 * Generate unique slug
 */
export const generateSlug = (length: number = 6): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let slug = '';
    for (let i = 0; i < length; i++) {
        slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return slug;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
};

/**
 * Validate URL format
 */
export const validateUrl = (url: string): boolean => {
    try {
        new URL(url);
        return url.startsWith('http://') || url.startsWith('https://');
    } catch {
        return false;
    }
};

/**
 * Extract IP address from request
 */
export const extractIpAddress = (req: any): string => {
    return (
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        (req.headers['x-real-ip'] as string) ||
        req.connection.remoteAddress ||
        'unknown'
    );
};

/**
 * Extract country from IP (simple implementation)
 */
export const extractCountryFromIp = (ip: string): string => {
    // TODO: Integrate with GeoIP database
    return 'unknown';
};

/**
 * Extract browser from user agent
 */
export const extractBrowserFromUserAgent = (userAgent: string): string => {
    if (!userAgent) return 'Unknown';

    const browsers = [
        { name: 'Chrome', pattern: /chrome/i },
        { name: 'Firefox', pattern: /firefox/i },
        { name: 'Safari', pattern: /safari/i },
        { name: 'Edge', pattern: /edg/i },
        { name: 'Opera', pattern: /opera/i },
    ];

    for (const browser of browsers) {
        if (browser.pattern.test(userAgent)) {
            return browser.name;
        }
    }

    return 'Other';
};
