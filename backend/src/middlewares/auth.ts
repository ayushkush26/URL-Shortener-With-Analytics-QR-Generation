import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, hashToken } from '../utils/auth';
import { ApiKey } from '../models/ApiKey';

// Extend Express Request to include auth data
declare global {
    namespace Express {
        interface Request {
            userId?: string;
            roles?: string[];
            apiKey?: any;
        }
    }
}

/**
 * JWT Authentication Middleware
 */
export const authenticateJWT = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing or invalid authorization header',
            });
            return;
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix
        const { userId, roles } = verifyAccessToken(token);

        req.userId = userId;
        req.roles = roles;

        next();
    } catch (error) {
        res.status(401).json({
            error: 'Unauthorized',
            message: (error as Error).message,
        });
    }
};

/**
 * API Key Authentication Middleware
 */
export const authenticateApiKey = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const apiKeyHeader = req.headers['x-api-key'];

        if (!apiKeyHeader || typeof apiKeyHeader !== 'string') {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing API key',
            });
            return;
        }

        const [keyId, secret] = apiKeyHeader.split('.');

        if (!keyId || !secret) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid API key format',
            });
            return;
        }

        const apiKey = await ApiKey.findOne({ keyId }).select('+secretHash');

        if (!apiKey || apiKey.revokedAt) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid or revoked API key',
            });
            return;
        }

        if (new Date() > apiKey.expiresAt) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'API key expired',
            });
            return;
        }

        // Verify secret (simple comparison, in production use constant-time comparison)
        const secretHash = hashToken(secret);
        if (secretHash !== apiKey.secretHash) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid API key',
            });
            return;
        }

        // Update last used
        apiKey.lastUsedAt = new Date();
        await apiKey.save();

        req.userId = apiKey.userId.toString();
        req.apiKey = apiKey;

        next();
    } catch (error) {
        res.status(401).json({
            error: 'Unauthorized',
            message: (error as Error).message,
        });
    }
};

/**
 * Role-based Authorization Middleware
 */
export const authorize = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.roles) {
            res.status(403).json({
                error: 'Forbidden',
                message: 'No roles assigned',
            });
            return;
        }

        const hasRole = req.roles.some((role) => allowedRoles.includes(role));

        if (!hasRole) {
            res.status(403).json({
                error: 'Forbidden',
                message: `Requires one of these roles: ${allowedRoles.join(', ')}`,
            });
            return;
        }

        next();
    };
};

/**
 * Optional JWT Middleware (doesn't fail if no token)
 */
export const optionalJWT = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const { userId, roles } = verifyAccessToken(token);
            req.userId = userId;
            req.roles = roles;
        }

        next();
    } catch {
        // If token is invalid, just continue without auth
        next();
    }
};
