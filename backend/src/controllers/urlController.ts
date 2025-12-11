import { Request, Response } from 'express';
import { ShortUrl } from '../models/ShortUrl';
import { redis } from '../config/redis';
import { analyticsQueue } from '../services/queue';
import { nanoid } from 'nanoid';
import { generateQRCode } from '../services/qrService';
import { getDailyAnalytics, getHourlyAnalytics } from '../services/analyticsService';
import { extractIpAddress, validateUrl } from '../utils/auth';
import { User } from '../models/User';
import { Click } from '../models/Click';

const MAX_RETRIES = 3;
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

/**
 * Create a new short URL
 */
export const createShortUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { originalUrl, slug, type = 'redirect', settings, links } = req.body;
    const userId = req.userId;

    // Validation
    if (!originalUrl || typeof originalUrl !== 'string' || originalUrl.trim().length === 0) {
      res.status(400).json({ error: 'Invalid URL provided.' });
      return;
    }

    if (!validateUrl(originalUrl)) {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    // Check user plan limits if authenticated
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        const urlCount = await ShortUrl.countDocuments({ ownerId: userId });
        if (urlCount >= user.plan?.limits.shortUrls) {
          res.status(403).json({ error: 'URL limit reached for your plan' });
          return;
        }
      }
    }

    // Generate short code
    let shortCode = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < MAX_RETRIES) {
      attempts++;
      shortCode = nanoid(7);
      const existing = await ShortUrl.exists({ shortCode });
      if (!existing) {
        isUnique = true;
      }
    }

    if (!isUnique) {
      throw new Error('Collision loop exceeded. System busy.');
    }

    // Check slug uniqueness if provided
    if (slug) {
      const existingSlug = await ShortUrl.exists({ slug });
      if (existingSlug) {
        res.status(409).json({ error: 'Slug already exists' });
        return;
      }
    }

    // Create short URL
    const newUrl = await ShortUrl.create({
      ownerId: userId || new ShortUrl()._id, // Use a placeholder if not authenticated
      shortCode,
      slug,
      type,
      defaultRedirectUrl: originalUrl.trim(),
      settings: settings || {},
      links: links || [],
    });

    // Cache in Redis
    const cacheKey = `url:${shortCode}`;
    await redis.set(cacheKey, newUrl.defaultRedirectUrl, 'EX', 3600);

    // Generate QR code asynchronously
    generateQRCode(newUrl._id.toString(), shortCode, BASE_URL).catch(console.error);

    res.status(201).json({
      shortCode: newUrl.shortCode,
      slug: newUrl.slug,
      originalUrl: newUrl.defaultRedirectUrl,
      shortUrl: `${BASE_URL}/${shortCode}`,
      qrCode: `${BASE_URL}/api/url/qr/${shortCode}`,
    });
  } catch (error) {
    console.error('❌ Create Logic Failed:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

/**
 * Get URL analytics
 */
export const getUrlAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shortCode } = req.params;
    const userId = req.userId;

    const urlDoc = await ShortUrl.findOne({ shortCode });

    if (!urlDoc) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }

    // Check ownership if authenticated
    if (userId && urlDoc.ownerId.toString() !== userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    // Get daily analytics (pre-aggregated)
    const dailyAnalytics = await getDailyAnalytics(urlDoc._id);

    // Get hourly analytics
    const hourlyAnalytics = await getHourlyAnalytics(urlDoc._id);

    // Get recent clicks for detailed view
    const recentClicks = await Click.find({
      shortUrlId: urlDoc._id,
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .select('timestamp geo device referrer utm')
      .lean();

    res.json({
      shortCode: urlDoc.shortCode,
      totalClicks: urlDoc.clicksCount,
      dailyAnalytics,
      hourlyAnalytics,
      recentClicks,
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

/**
 * Redirect to original URL
 */
export const redirectLink = async (req: Request, res: Response): Promise<void> => {
  const { shortCode } = req.params;
  const cacheKey = `url:${shortCode}`;

  try {
    // Check password if required
    const password = req.query.password as string;
    const urlDoc = await ShortUrl.findOne({ shortCode });

    if (!urlDoc) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }

    // Check expiration
    if (urlDoc.settings?.expiresAt && new Date() > urlDoc.settings.expiresAt) {
      res.status(410).json({ error: 'This link has expired' });
      return;
    }

    // Check max clicks
    if (urlDoc.settings?.maxClicks && urlDoc.clicksCount >= urlDoc.settings.maxClicks) {
      res.status(410).json({ error: 'This link has reached its click limit' });
      return;
    }

    // Check password
    if (urlDoc.settings?.password) {
      if (!password) {
        res.status(401).json({ error: 'Password required' });
        return;
      }
      // Simple comparison (in production, use bcrypt)
      if (password !== urlDoc.settings.password) {
        res.status(401).json({ error: 'Invalid password' });
        return;
      }
    }

    // Get redirect URL
    let redirectUrl = urlDoc.defaultRedirectUrl;

    // Handle bio link type
    if (urlDoc.type === 'bio link' && urlDoc.links.length > 0) {
      // For bio links, redirect to a bio page (or return links as JSON)
      // This is a simplified version - you might want a dedicated bio page
      redirectUrl = urlDoc.defaultRedirectUrl;
    }

    // Fast path: Check Redis cache
    const cachedUrl = await redis.get(cacheKey);
    if (cachedUrl) {
      await analyticsQueue.add('click', {
        shortCode,
        shortUrlId: urlDoc._id.toString(),
        ip: extractIpAddress(req),
        userAgent: req.get('User-Agent') || 'Unknown',
        referrer: req.get('Referer') || req.get('Referrer') || undefined,
        url: req.url,
      });
      return res.redirect(302, cachedUrl);
    }

    // Cache for next time
    await redis.set(cacheKey, redirectUrl, 'EX', 3600);

    // Queue analytics
    await analyticsQueue.add('click', {
      shortCode,
      shortUrlId: urlDoc._id.toString(),
      ip: extractIpAddress(req),
      userAgent: req.get('User-Agent') || 'Unknown',
      referrer: req.get('Referer') || req.get('Referrer') || undefined,
      url: req.url,
    });

    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('Redirect Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

/**
 * Get QR code for a short URL
 */
export const getQRCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shortCode } = req.params;

    const urlDoc = await ShortUrl.findOne({ shortCode });
    if (!urlDoc) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }

    const { getQRCode: getQRCodeService } = await import('../services/qrService');
    const qrCodeUrl = await getQRCodeService(urlDoc._id.toString());

    if (!qrCodeUrl) {
      // Generate if doesn't exist
      const { generateQRCode } = await import('../services/qrService');
      const newQRCode = await generateQRCode(
        urlDoc._id.toString(),
        shortCode,
        BASE_URL
      );
      return res.json({ qrCode: newQRCode });
    }

    res.json({ qrCode: qrCodeUrl });
  } catch (error) {
    console.error('QR Code Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

/**
 * Get user's URLs
 */
export const getUserUrls = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const urls = await ShortUrl.find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .select('shortCode slug type defaultRedirectUrl clicksCount createdAt')
      .lean();

    res.json({ urls });
  } catch (error) {
    console.error('Get User URLs Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

/**
 * Delete a short URL
 */
export const deleteShortUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shortCode } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const urlDoc = await ShortUrl.findOne({ shortCode });
    if (!urlDoc) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }

    if (urlDoc.ownerId.toString() !== userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    await ShortUrl.deleteOne({ _id: urlDoc._id });

    // Clear cache
    const cacheKey = `url:${shortCode}`;
    await redis.del(cacheKey);

    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error('Delete URL Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};
