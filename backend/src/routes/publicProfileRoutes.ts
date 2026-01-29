import express from 'express';
import { getPublicProfile, getProfileQRCode } from '../controllers/publicProfileController';
import { apiLimiter } from '../middlewares/rateLimiter';
import { asyncHandler } from '../middlewares/errorHandler';

const router = express.Router();

// Public profile routes (no authentication required)
router.get('/u/:username', apiLimiter, asyncHandler(getPublicProfile));
router.get('/u/:username/qr', apiLimiter, asyncHandler(getProfileQRCode));

export default router;


