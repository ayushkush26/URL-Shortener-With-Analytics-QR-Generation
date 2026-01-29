import express from 'express';
import {
  register,
  login,
  refreshToken,
  logout,
  setup2FA,
  enable2FA,
  disable2FA,

  updateProfile,
  getProfile,
  changePassword,
  getLinkHubLinks,
  updateLinkHubLinks,
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
router.post('/2fa/disable', authenticateJWT, disable2FA);
router.put('/profile', authenticateJWT, updateProfile);
router.get('/profile', authenticateJWT, getProfile);
router.post('/change-password', authenticateJWT, changePassword);
router.get('/linkhub/links', authenticateJWT, getLinkHubLinks);
router.put('/linkhub/links', authenticateJWT, updateLinkHubLinks);

export default router;

