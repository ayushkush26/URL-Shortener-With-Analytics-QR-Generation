import { Request, Response, NextFunction } from 'express';
import { validateUrl } from '../utils/auth';

/**
 * Validate URL in request body
 */
export const validateUrlBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { originalUrl } = req.body;

  if (!originalUrl || typeof originalUrl !== 'string') {
    res.status(400).json({ error: 'URL is required' });
    return;
  }

  if (!validateUrl(originalUrl)) {
    res.status(400).json({ error: 'Invalid URL format' });
    return;
  }

  next();
};

/**
 * Validate short code format
 */
export const validateShortCode = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { shortCode } = req.params;

  if (!shortCode || typeof shortCode !== 'string') {
    res.status(400).json({ error: 'Short code is required' });
    return;
  }

  // Allow alphanumeric, hyphens, and underscores, 3-20 characters
  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(shortCode)) {
    res.status(400).json({ error: 'Invalid short code format' });
    return;
  }

  next();
};

/**
 * Validate email in request body
 */
export const validateEmailBody = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { email } = req.body;

  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email is required' });
    return;
  }

  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  next();
};

