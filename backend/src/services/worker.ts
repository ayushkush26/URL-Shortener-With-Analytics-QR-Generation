import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { QUEUE_NAME } from './queue';
import { ShortUrl } from '../models/ShortUrl';
import { Click } from '../models/Click';
import geoip from 'geoip-lite';
import useragent from 'useragent';
import { processClickAnalytics } from './analyticsService';
import crypto from 'crypto';

/**
 * Hash IP address for privacy
 */
const hashIP = (ip: string): string => {
  return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
};

/**
 * Detect if user agent is a bot
 */
const isBot = (userAgent: string): boolean => {
  if (!userAgent) return true;
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /googlebot/i,
    /bingbot/i,
  ];
  return botPatterns.some((pattern) => pattern.test(userAgent));
};

/**
 * Parse UTM parameters from referrer URL
 */
const parseUTM = (referrer?: string, url?: string): any => {
  if (!url) return {};
  try {
    const urlObj = new URL(url, 'http://localhost');
    const utm: any = {};
    ['source', 'medium', 'campaign', 'term', 'content'].forEach((param) => {
      const value = urlObj.searchParams.get(`utm_${param}`);
      if (value) utm[param] = value;
    });
    return Object.keys(utm).length > 0 ? utm : undefined;
  } catch {
    return {};
  }
};

/**
 * Process click analytics job
 */
const processJob = async (job: any) => {
  const { shortCode, shortUrlId, ip, userAgent, referrer, url } = job.data;

  console.log(`⚙️ Processing click for: ${shortCode}`);

  try {
    // Find the short URL
    const urlDoc = await ShortUrl.findOne({ shortCode });
    if (!urlDoc) {
      console.warn(`Short URL not found: ${shortCode}`);
      return;
    }

    // Check if bots are allowed
    const userAgentStr = userAgent || 'Unknown';
    const botCheck = isBot(userAgentStr);
    if (!urlDoc.settings?.allowBots && botCheck) {
      console.log(`Bot detected and blocked: ${shortCode}`);
      return;
    }

    // Enrich geo data
    const geoData = geoip.lookup(ip);
    const geo = geoData
      ? {
          country: geoData.country || 'Unknown',
          region: geoData.region || undefined,
          city: geoData.city || undefined,
          lat: geoData.ll?.[0] || undefined,
          lon: geoData.ll?.[1] || undefined,
        }
      : { country: 'Unknown' };

    // Parse device info from user agent
    const agent = useragent.parse(userAgentStr);
    const device = {
      type: agent.device.family === 'Other' ? 'desktop' : agent.device.family.toLowerCase(),
      os: agent.os.family,
      browser: agent.family,
      userAgent: userAgentStr,
    };

    // Parse UTM parameters
    const utm = parseUTM(referrer, url);

    // Hash IP for privacy
    const hashedIP = hashIP(ip);

    // Create click record
    const click = await Click.create({
      shortUrlId: urlDoc._id,
      shortCode,
      timestamp: new Date(),
      ip: hashedIP,
      geo,
      device,
      referrer: referrer || undefined,
      utm,
      isBot: botCheck,
    });

    // Update click count atomically
    await ShortUrl.updateOne({ _id: urlDoc._id }, { $inc: { clicksCount: 1 } });

    // Process analytics aggregation (async, don't wait)
    processClickAnalytics(urlDoc._id.toString(), new Date()).catch((err) => {
      console.error('Analytics aggregation error:', err);
    });

    console.log(`✅ Click processed: ${shortCode}`);
  } catch (error) {
    console.error(`❌ Error processing click for ${shortCode}:`, error);
    throw error; // Re-throw to trigger retry
  }
};

/**
 * Initialize the analytics worker
 */
export const initWorker = () => {
  const worker = new Worker(QUEUE_NAME, processJob, {
    connection: redis.options,
    concurrency: 10, // Process 10 clicks concurrently
    limiter: {
      max: 100, // Max 100 jobs
      duration: 1000, // Per second
    },
  });

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed for ${job.data.shortCode}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed: ${err.message}`);
  });

  worker.on('error', (err) => {
    console.error('❌ Worker error:', err);
  });

  console.log('👷 Analytics Worker Started...');
  return worker;
};
