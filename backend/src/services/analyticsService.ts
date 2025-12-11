import { Click } from '../models/Click';
import { AnalyticsDaily } from '../models/AnalyticsDaily';
import { AnalyticsHourly } from '../models/AnalyticsHourly';
import { ShortUrl } from '../models/ShortUrl';

/**
 * Aggregate daily analytics for a short URL
 */
export const aggregateDailyAnalytics = async (
  shortUrlId: string,
  date: Date = new Date()
): Promise<void> => {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Get all clicks for this day
  const clicks = await Click.find({
    shortUrlId,
    timestamp: { $gte: startOfDay, $lte: endOfDay },
    isBot: false, // Exclude bots
  });

  if (clicks.length === 0) {
    return; // No data to aggregate
  }

  // Calculate unique clicks (by IP)
  const uniqueIPs = new Set(clicks.map((c) => c.ip));
  const uniqueClicks = uniqueIPs.size;

  // Aggregate by country
  const countryMap = new Map<string, number>();
  clicks.forEach((click) => {
    const country = click.geo?.country || 'Unknown';
    countryMap.set(country, (countryMap.get(country) || 0) + 1);
  });
  const topCountries = Array.from(countryMap.entries())
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Aggregate by browser
  const browserMap = new Map<string, number>();
  clicks.forEach((click) => {
    const browser = click.device?.browser || 'Unknown';
    browserMap.set(browser, (browserMap.get(browser) || 0) + 1);
  });
  const topBrowsers = Array.from(browserMap.entries())
    .map(([browser, count]) => ({ browser, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Aggregate by device type
  const deviceMap = new Map<string, number>();
  clicks.forEach((click) => {
    const device = click.device?.type || 'Unknown';
    deviceMap.set(device, (deviceMap.get(device) || 0) + 1);
  });
  const topDevices = Array.from(deviceMap.entries())
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Aggregate by hour
  const hourMap = new Map<number, number>();
  clicks.forEach((click) => {
    const hour = new Date(click.timestamp).getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });
  const clicksByHour = Array.from(hourMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);

  // Upsert daily analytics
  await AnalyticsDaily.findOneAndUpdate(
    { shortUrlId, date: dateStr },
    {
      shortUrlId,
      date: dateStr,
      totalClicks: clicks.length,
      uniqueClicks,
      topCountries,
      topBrowsers,
      topDevices,
      clicksByHour,
    },
    { upsert: true, new: true }
  );
};

/**
 * Aggregate hourly analytics for a short URL
 */
export const aggregateHourlyAnalytics = async (
  shortUrlId: string,
  hour: Date = new Date()
): Promise<void> => {
  const hourStr = hour.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  const startOfHour = new Date(hour);
  startOfHour.setMinutes(0, 0, 0);
  const endOfHour = new Date(hour);
  endOfHour.setMinutes(59, 59, 999);

  // Count clicks for this hour
  const clickCount = await Click.countDocuments({
    shortUrlId,
    timestamp: { $gte: startOfHour, $lte: endOfHour },
    isBot: false,
  });

  if (clickCount === 0) {
    return;
  }

  // Upsert hourly analytics
  await AnalyticsHourly.findOneAndUpdate(
    { shortUrlId, hour: hourStr },
    {
      shortUrlId,
      hour: hourStr,
      totalClicks: clickCount,
    },
    { upsert: true, new: true }
  );
};

/**
 * Process analytics aggregation for a click
 * This should be called asynchronously after a click is recorded
 */
export const processClickAnalytics = async (
  shortUrlId: string,
  timestamp: Date = new Date()
): Promise<void> => {
  // Aggregate for the hour
  await aggregateHourlyAnalytics(shortUrlId, timestamp);

  // Aggregate for the day
  await aggregateDailyAnalytics(shortUrlId, timestamp);
};

/**
 * Get daily analytics for a short URL
 */
export const getDailyAnalytics = async (
  shortUrlId: string,
  startDate?: Date,
  endDate?: Date
): Promise<any[]> => {
  const query: any = { shortUrlId };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = startDate.toISOString().split('T')[0];
    }
    if (endDate) {
      query.date.$lte = endDate.toISOString().split('T')[0];
    }
  }

  return AnalyticsDaily.find(query).sort({ date: 1 });
};

/**
 * Get hourly analytics for a short URL
 */
export const getHourlyAnalytics = async (
  shortUrlId: string,
  startHour?: Date,
  endHour?: Date
): Promise<any[]> => {
  const query: any = { shortUrlId };

  if (startHour || endHour) {
    query.hour = {};
    if (startHour) {
      query.hour.$gte = startHour.toISOString().slice(0, 13);
    }
    if (endHour) {
      query.hour.$lte = endHour.toISOString().slice(0, 13);
    }
  }

  return AnalyticsHourly.find(query).sort({ hour: 1 });
};

