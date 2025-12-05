import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// 🧠 SENIOR OBSERVATION: 
// We use a "Lazy Singleton" pattern. 
// This code runs once when the app starts.
// All other files import this SAME instance.

// Fallback to a local Redis for development when REDIS_URL isn't provided
const DEFAULT_REDIS = 'redis://127.0.0.1:6379';
const redisUrl = process.env.REDIS_URL || DEFAULT_REDIS;

if (!process.env.REDIS_URL) {
  console.warn('⚠️ REDIS_URL not set; falling back to', DEFAULT_REDIS);
}

// 🛠️ The Connection
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // 🧠 Critical for BullMQ (The Queue needs this!)
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay; // Reconnect with exponential backoff
  }
});

// 🕵️ MONITORING (The Eyes)
redis.on('connect', () => console.log('🔌 Redis: Initiating connection...'));
redis.on('ready', () => console.log('✅ Redis: Ready for commands'));
redis.on('error', (err) => console.error('❌ Redis Error:', err.message));

