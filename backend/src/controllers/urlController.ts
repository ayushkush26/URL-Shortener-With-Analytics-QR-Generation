import { Request, Response } from 'express';
import { ShortUrl } from '../models/ShortUrl';
import { redis } from '../config/redis'; // We need to create this file next!
import { analyticsQueue } from '../services/queue';
import { Click } from '../models/Click'; // Import the Click Model // We need to create this too!
// / 🧠 CONSTANT: How many times do we roll the dice before giving up?
import { nanoid } from 'nanoid';
const MAX_RETRIES = 3;

export const createShortUrl = async (req: Request, res: Response) => {
  // 1. SANITIZATION (The Shield)
  // We don't trust the user. We clean the input.
  const { originalUrl } = req.body;

  if (!originalUrl || typeof originalUrl !== 'string' || originalUrl.trim().length === 0) {
    return res.status(400).json({ error: 'Invalid URL provided.' });
  }

  try {
    let shortCode = '';
    let isUnique = false;
    let attempts = 0;

    // 2. THE RETRY LOOP (The Engine)
    // We enter the "Reality Distortion Field". We refuse to accept failure.
    while (!isUnique && attempts < MAX_RETRIES) {
      attempts++;
      
      // Generate a candidate (7 chars is 3.5 trillion combinations)
      shortCode = nanoid(7);      

      // 🧠 PRO CHECK: Ask the database "Does this exist?"
      // This is fast because of our Index.
      const existing = await ShortUrl.exists({ shortCode });
      
      if (!existing) {
        isUnique = true; // Success! We found a gap in reality.
      }
    }

    // 3. THE FAIL-SAFE
    // If we failed 3 times, the universe is broken (or we are full).
    if (!isUnique) {
      throw new Error('Collision loop exceeded. System busy.');
    }

    // 4. THE COMMIT
    // We verified uniqueness. Now we save.
    const newUrl = await ShortUrl.create({
      originalUrl: originalUrl.trim(),
      shortCode,
    });

    // 5. THE HANDOFF
    // Return the result so the frontend can display it.
    res.status(201).json({
      shortCode: newUrl.shortCode,
      originalUrl: newUrl.originalUrl,
      shortUrl: `${process.env.BASE_URL}/${newUrl.shortCode}`
    });

  } catch (error) {
    console.error('❌ Create Logic Failed:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};
// ... createShortLink function is above ...


export const getUrlAnalytics = async (req: Request, res: Response) => {
  const { shortCode } = req.params;

  try {
    // 1. Resolve the Code to an ID
    // We only need the _id, so we use .select('_id') to be lightweight
    const urlDoc = await ShortUrl.findOne({ shortCode }).select('_id');

    if (!urlDoc) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // 2. THE GOD MODE PIPELINE 🚀
    // We ask MongoDB to process the data for us.
    const analytics = await Click.aggregate([
      {
        $match: {
          shortUrlId: urlDoc._id // Only look at clicks for THIS link
        }
      },
      {
        $group: {
          _id: { 
            // 🧠 BUCKETING STRATEGY
            // We strip the time, keeping only the YYYY-MM-DD
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          count: { $sum: 1 } // Increment counter
        }
      },
      {
        $sort: { "_id.date": 1 } // Sort chronologically (Oldest to Newest)
      }
    ]);

    // 3. THE TRANSFORMER
    // MongoDB returns objects like { _id: { date: '...' }, count: 5 }
    // Frontend prefers Clean Arrays: [{ date: '...', clicks: 5 }]
    const formattedData = analytics.map(item => ({
      date: item._id.date,
      clicks: item.count
    }));

    res.json(formattedData);

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};

export const redirectLink = async (req: Request, res: Response) => {
  const { shortCode } = req.params;
  const cacheKey = `url:${shortCode}`;

  try {
    // 1. FAST PATH: Check Redis
    const cachedUrl = await redis.get(cacheKey);

    if (cachedUrl) {
      // ⚡ Event: Async Analytics
      await analyticsQueue.add('click', {
        shortCode,
        ip: req.ip,
        userAgent: req.get('User-Agent') || 'Unknown'
      });
      return res.redirect(cachedUrl);
    }

    // 2. SLOW PATH: Check MongoDB
    const urlDoc = await ShortUrl.findOne({ shortCode }).select('originalUrl');

    if (!urlDoc) {
      return res.status(404).json({ error: 'URL not found' });
    }

    // 3. READ REPAIR: Save to Redis for next time (1 hour TTL)
    await redis.set(cacheKey, urlDoc.originalUrl, 'EX', 3600);

    // ⚡ Event: Async Analytics
    await analyticsQueue.add('click', {
      shortCode,
      ip: req.ip,
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    return res.redirect(urlDoc.originalUrl);

  } catch (error) {
    console.error('Redirect Error:', error);
    res.status(500).json({ error: 'Server Error' });
  }
};