import { Request, Response } from 'express';
import { ShortUrl } from '../models/ShortUrl';
import { redis } from '../config/redis';
import { analyticsQueue } from '../services/queue';
import { generateQRCode, deleteQRCode } from '../services/qrService';
import { getDailyAnalytics, getHourlyAnalytics } from '../services/analyticsService';
import { extractIpAddress, validateUrl } from '../utils/auth';
import { User } from '../models/User';
import { Click } from '../models/Click';


const MAX_RETRIES = 3;
const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';



const generateShortCode = async (): Promise<string> => {
  const { nanoid } = await import('nanoid');
  return nanoid(7);
};

/**
 * Create a new short URL
 */
export const createShortUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { originalUrl, slug, type = 'redirect', settings, links, isPublic = false } = req.body;

    console.log('Creating URL:', { originalUrl, slug, type, userId: req.userId });

    const userId = req.userId;

    if (!originalUrl || typeof originalUrl !== 'string' || !validateUrl(originalUrl)) {
      res.status(400).json({ error: 'Invalid URL provided' });
      return;
    }

    // Safe plan limit check
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        const urlCount = await ShortUrl.countDocuments({ ownerId: userId });
        const shortUrlLimit = user.plan?.limits?.shortUrls ?? Infinity;

        if (urlCount >= shortUrlLimit) {
          res.status(403).json({ error: 'URL limit reached for your plan' });
          return;
        }
      }
    }

    let shortCode = '';

    // FIXED LOGIC: Use Slug OR Generate ID (Don't do both)
    if (slug && slug.trim() !== "") {
      shortCode = slug.trim();
      const slugExists = await ShortUrl.exists({ shortCode });
      if (slugExists) {
        res.status(409).json({ error: 'Slug/Short code already exists' });
        return;
      }
    } else {
      // Only runs if no slug is provided
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < MAX_RETRIES) {
        attempts++;
        shortCode = await generateShortCode();
        const exists = await ShortUrl.exists({ shortCode });
        if (!exists) isUnique = true;
      }

      if (!isUnique) {
        throw new Error('Short code collision');
      }
    }


    const newUrl = await ShortUrl.create({
      ownerId: userId ?? new ShortUrl()._id,
      shortCode,
      slug,
      type,
      defaultRedirectUrl: originalUrl.trim(),
      isPublic: isPublic || false,
      settings: settings || {},
      links: links || [],
    });

    await redis.set(`url:${shortCode}`, newUrl.defaultRedirectUrl, 'EX', 3600);

    // Generate QR asynchronously
    generateQRCode(newUrl._id.toString(), shortCode, BASE_URL).catch(console.error);

    // 1. Build the clickable redirect link
    const finalShortUrl = `${BASE_URL}/${shortCode}`;
    // 2. Build the QR code link
    const qrCodeUrl = `${BASE_URL}/api/url/qr/${shortCode}`;

    res.status(201).json({
      shortCode,
      slug,
      originalUrl: newUrl.defaultRedirectUrl,
      shortUrl: finalShortUrl,
      qrCode: qrCodeUrl,
      isPublic: newUrl.isPublic,
    });
  } catch (error) {
    console.error('Create URL Error:', error);
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

    if (userId && urlDoc.ownerId.toString() !== userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const dailyAnalytics = await getDailyAnalytics(urlDoc._id);
    const hourlyAnalytics = await getHourlyAnalytics(urlDoc._id);

    const recentClicks = await Click.find({ shortUrlId: urlDoc._id })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    res.json({
      shortCode,
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
 * Redirect handler
 */
export const redirectLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shortCode } = req.params;
    const cacheKey = `url:${shortCode}`;

    const urlDoc = await ShortUrl.findOne({ shortCode });
    if (!urlDoc) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }

    if (urlDoc.settings?.expiresAt && new Date() > urlDoc.settings.expiresAt) {
      res.status(410).json({ error: 'Link expired' });
      return;
    }

    const cached = await redis.get(cacheKey);
    const redirectUrl = cached || urlDoc.defaultRedirectUrl;

    await redis.set(cacheKey, redirectUrl, 'EX', 3600);

    await analyticsQueue.add('click', {
      shortCode,
      shortUrlId: urlDoc._id.toString(),
      ip: extractIpAddress(req),
      userAgent: req.get('User-Agent') || 'Unknown',
      referrer: req.get('Referer') || undefined,
      url: req.url,
    });


    // CHECK Type: if 'bio link', redirect to frontend viewer
    if (urlDoc.type === 'bio link') {
      const viewerUrl = `${CLIENT_URL}/view/${shortCode}`;
      res.redirect(302, viewerUrl);
      return;
    }

    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('Redirect Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

/**
 * Get QR code
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
    let qrCodeUrl = await getQRCodeService(urlDoc._id.toString());

    if (!qrCodeUrl) {
      qrCodeUrl = await generateQRCode(
        urlDoc._id.toString(),
        shortCode,
        BASE_URL
      );
    }

    res.json({ qrCode: qrCodeUrl });
  } catch (error) {
    console.error('QR Code Error Breakdown:', JSON.stringify(error, null, 2));
    console.error('QR Code Error Stack:', (error as Error).stack);
    res.status(500).json({ error: 'Server Error', details: (error as Error).message });
  }
};

/**
 * Get user's URLs
 */
export const getUserUrls = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const urls = await ShortUrl.find({ ownerId: req.userId })
      .sort({ createdAt: -1 })
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
    await deleteQRCode(urlDoc._id.toString());
    await redis.del(`url:${shortCode}`);

    res.json({ message: 'URL deleted successfully' });
  } catch (error) {
    console.error('Delete URL Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

/**
 * Toggle link visibility (public/private)
 */
export const toggleLinkVisibility = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shortCode } = req.params;
    const { isPublic } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (typeof isPublic !== 'boolean') {
      res.status(400).json({ error: 'isPublic must be a boolean' });
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

    urlDoc.isPublic = isPublic;
    await urlDoc.save();

    res.json({
      message: 'Link visibility updated successfully',
      shortCode,
      isPublic: urlDoc.isPublic,
    });
  } catch (error) {
    console.error('Toggle Visibility Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};


/**
 * Get public URL info (for Bio Link viewer)
 */
export const getPublicUrlInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { shortCode } = req.params;

    const urlDoc = await ShortUrl.findOne({ shortCode })
      .populate('ownerId', 'username profile.firstName profile.lastName profile.avatar profile.bio profile.jobTitle profile.company')
      .lean();

    if (!urlDoc) {
      res.status(404).json({ error: 'URL not found' });
      return;
    }

    // If it's not a bio link, we might still want to return basic info, but primarily for bio links
    if (urlDoc.type !== 'bio link') {
      // Optional: decide if we want to allow viewing info for standard redirects
    }

    // Check expiration
    if (urlDoc.settings?.expiresAt && new Date() > urlDoc.settings.expiresAt) {
      res.status(410).json({ error: 'Link expired' });
      return;
    }

    res.json(urlDoc);
  } catch (error) {
    console.error('Get Public URL Info Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};
