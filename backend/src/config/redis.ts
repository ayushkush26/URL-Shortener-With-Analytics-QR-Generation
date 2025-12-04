import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// 🧠 SENIOR OBSERVATION: 
// We use a "Lazy Singleton" pattern. 
// This code runs once when the app starts.
// All other files import this SAME instance.

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('❌ FATAL: REDIS_URL is not defined in .env');
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

