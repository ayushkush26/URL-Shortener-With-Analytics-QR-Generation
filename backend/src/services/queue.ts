import {Queue} from 'bullmq';
import{redis} from '../config/redis';
export const QUEUE_NAME = 'analytics-queue'; 
// 🛠️ The Queue Definition
// This represents the "Mailbox" where we drop our click events.
export const analyticsQueue = new Queue(QUEUE_NAME, {
  connection: redis.options, // 🧠 Share the connection settings!
  defaultJobOptions: {
    removeOnComplete: true, // 🧹 Clean up successful jobs (Don't fill RAM)
    removeOnFail: 5000,     // Keep failed jobs for a bit so we can debug
    attempts: 3,            // 🛡️ Retry Logic: If worker fails, try 3 times
    backoff: {
      type: 'exponential',
      delay: 1000,          // Wait 1s, then 2s, then 4s
    }
  }
});

// 🕵️ Event Listener for the Producer
analyticsQueue.on('error', (err) => {
  console.error('❌ Queue Producer Error:', err.message);
});