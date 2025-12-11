import express from 'express';
import {
  createShortUrl,
  getUrlAnalytics,
  getQRCode,
  getUserUrls,
  deleteShortUrl,
} from '../controllers/urlController';
import { createShortUrlLimiter, apiLimiter } from '../middlewares/rateLimiter';
import { validateUrlBody, validateShortCode } from '../middlewares/validation';
import { authenticateJWT, optionalJWT } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = express.Router();

// Create short URL (rate limited)
router.post(
  '/shorten',
  optionalJWT,
  createShortUrlLimiter,
  validateUrlBody,
  asyncHandler(createShortUrl)
);

// Get analytics (requires auth for owned URLs)
router.get(
  '/analytics/:shortCode',
  optionalJWT,
  validateShortCode,
  asyncHandler(getUrlAnalytics)
);

// Get QR code
router.get('/qr/:shortCode', validateShortCode, asyncHandler(getQRCode));

// Get user's URLs (requires auth)
router.get('/my-urls', authenticateJWT, asyncHandler(getUserUrls));

// Delete URL (requires auth)
router.delete(
  '/:shortCode',
  authenticateJWT,
  validateShortCode,
  asyncHandler(deleteShortUrl)
);

export default router;