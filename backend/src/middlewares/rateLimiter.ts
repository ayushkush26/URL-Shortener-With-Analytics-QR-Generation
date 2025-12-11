import { Request, Response, NextFunction } from 'express';
import { RateLimit } from '../models/RateLimit';
import { extractIpAddress } from '../utils/auth';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  message?: string;
}

/**
 * Rate limiting middleware using MongoDB
 */
export const rateLimiter = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => {
      // Default: use IP address + route
      return `${extractIpAddress(req)}:${req.path}`;
    },
    message = 'Too many requests, please try again later.',
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = keyGenerator(req);
      const now = new Date();
      const resetAt = new Date(now.getTime() + windowMs);

      // Find or create rate limit record
      let rateLimit = await RateLimit.findOne({ key });

      if (!rateLimit) {
        // Create new record
        rateLimit = await RateLimit.create({
          key,
          count: 1,
          resetAt,
        });
        return next();
      }

      // Check if window has expired
      if (now > rateLimit.resetAt) {
        // Reset counter
        rateLimit.count = 1;
        rateLimit.resetAt = resetAt;
        await rateLimit.save();
        return next();
      }

      // Check if limit exceeded
      if (rateLimit.count >= maxRequests) {
        const retryAfter = Math.ceil((rateLimit.resetAt.getTime() - now.getTime()) / 1000);
        res.status(429).json({
          error: message,
          retryAfter,
        });
        return;
      }

      // Increment counter
      rateLimit.count += 1;
      await rateLimit.save();

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - rateLimit.count).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimit.resetAt.getTime() / 1000).toString());

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow request (fail open)
      next();
    }
  };
};

/**
 * Pre-configured rate limiters
 */
export const createShortUrlLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  keyGenerator: (req) => {
    const userId = req.userId || extractIpAddress(req);
    return `create:${userId}`;
  },
  message: 'Too many URL creation requests. Please wait before creating more.',
});

export const apiLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60,
  message: 'API rate limit exceeded. Please slow down.',
});

export const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,
  keyGenerator: (req) => {
    return `auth:${extractIpAddress(req)}`;
  },
  message: 'Too many authentication attempts. Please try again later.',
});

