import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  setup2FA,
  enable2FA,
} from '../controllers/authController';
import { authLimiter } from '../middlewares/rateLimiter';
import { validateEmailBody } from '../middlewares/validation';
import { authenticateJWT } from '../middlewares/auth';

const router = express.Router();

router.post('/register', authLimiter, validateEmailBody, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticateJWT, logout);
router.post('/2fa/setup', authenticateJWT, setup2FA);
router.post('/2fa/enable', authenticateJWT, enable2FA);

export default router;

