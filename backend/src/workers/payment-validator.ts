import { Worker } from 'bullmq';
import { Redis } from 'ioredis';

// Create Redis connection
const redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');

// Create worker (minimal stub for now)
const worker = new Worker('payment-validator', async (job) => {
  console.log('Payment validator job received:', job.data);
  // TODO: Implement payment validation logic
  return { status: 'processed' };
}, { connection: redis });

worker.on('completed', (job) => {
  console.log(`Payment validator job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Payment validator job ${job?.id} failed:`, err);
});

console.log('Payment validator worker started');

process.on('SIGTERM', async () => {
  console.log('Shutting down payment validator worker...');
  await worker.close();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down payment validator worker...');
  await worker.close();
  await redis.disconnect();
  process.exit(0);
});