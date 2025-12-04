import express from 'express';
import { createShortUrl, redirectLink } from '../controllers/urlController';
import { getUrlAnalytics } from '../controllers/urlController';
const router = express.Router();

router.post('/shorten', createShortUrl);

// 🧠 THE REDIRECT ROUTE
// This usually goes in app.ts or a root router because it's at the root level (linkify.pro/abc)
// But for now, let's keep it here and mount it correctly.
router.get('/:shortCode', redirectLink);
router.get('/analytics/:shortCode', getUrlAnalytics);

export default router;