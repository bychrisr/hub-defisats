import { Worker } from 'bullmq';
import { Redis } from 'ioredis';

// Create Redis connection
const redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');

// Create worker (minimal stub for now)
const worker = new Worker('margin-monitor', async (job) => {
  console.log('Margin monitor job received:', job.data);
  // TODO: Implement margin monitoring logic
  return { status: 'processed' };
}, { connection: redis });

worker.on('completed', (job) => {
  console.log(`Margin monitor job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Margin monitor job ${job?.id} failed:`, err);
});

console.log('Margin monitor worker started');

process.on('SIGTERM', async () => {
  console.log('Shutting down margin monitor worker...');
  await worker.close();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down margin monitor worker...');
  await worker.close();
  await redis.disconnect();
  process.exit(0);
});