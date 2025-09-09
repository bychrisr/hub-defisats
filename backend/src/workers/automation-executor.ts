import { Worker } from 'bullmq';
import { Redis } from 'ioredis';

// Create Redis connection
const redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');

// Create worker (minimal stub for now)
const worker = new Worker(
  'automation-executor',
  async job => {
    console.log('Automation executor job received:', job.data);
    // TODO: Implement automation execution logic
    return { status: 'processed' };
  },
  { connection: redis }
);

worker.on('completed', job => {
  console.log(`Automation executor job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Automation executor job ${job?.id} failed:`, err);
});

console.log('Automation executor worker started');

process.on('SIGTERM', async () => {
  console.log('Shutting down automation executor worker...');
  await worker.close();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down automation executor worker...');
  await worker.close();
  await redis.disconnect();
  process.exit(0);
});
