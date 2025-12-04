import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { QUEUE_NAME } from './queue';
import { ShortUrl } from '../models/ShortUrl';
import { Click } from '../models/Click';
import geoip from 'geoip-lite';

// 🧠 The Logic: What to do with the "Letter" in the Mailbox
const processJob = async (job: any) => {
  const { shortCode, ip, userAgent } = job.data;
  
  console.log(`⚙️ Processing click for: ${shortCode}`);

  // 1. Find the ID (Database Read)
  const urlDoc = await ShortUrl.findOne({ shortCode });
  if (!urlDoc) return;

  // 2. Enrich Data (CPU Work)
  const geo = geoip.lookup(ip);
  const country = geo?.country || 'Unknown';

  // 3. Write to DB (Database Write)
  await Promise.all([
    ShortUrl.updateOne({ _id: urlDoc._id }, { $inc: { clicksCount: 1 } }),
    Click.create({
      shortUrlId: urlDoc._id,
      ip,
      country,
      device: userAgent // In a real app, use a library to parse "iPhone" vs "Desktop"
    })
  ]);
};

// 🛠️ The Worker Definition
export const initWorker = () => {
  const worker = new Worker(QUEUE_NAME, processJob, {
    connection: redis.options,
    concurrency: 5 // 🧠 Parallelism: Process 5 clicks at once
  });

  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed!`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed: ${err.message}`);
  });

  console.log('👷 Analytics Worker Started...');
};