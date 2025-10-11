import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

// Create Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');

// Notification queue configuration
export const notificationQueue = new Queue('notification', {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 50,    // Keep last 50 completed jobs
    removeOnFail: 100,       // Keep last 100 failed jobs
    attempts: 3,             // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000,           // Initial delay: 5 seconds
    },
  },
});

// Clean up old jobs periodically
setInterval(async () => {
  try {
    // Clean completed jobs older than 1 hour
    await notificationQueue.clean(60 * 60 * 1000, 50, 'completed');

    // Clean failed jobs older than 24 hours
    await notificationQueue.clean(24 * 60 * 60 * 1000, 100, 'failed');

    console.log('🧹 Notification queue cleaned');
  } catch (error) {
    console.error('Error cleaning notification queue:', error);
  }
}, 60 * 60 * 1000); // Clean every hour

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down notification queue...');
  await notificationQueue.close();
  await redis.disconnect();
});

process.on('SIGINT', async () => {
  console.log('Shutting down notification queue...');
  await notificationQueue.close();
  await redis.disconnect();
});

console.log('📧 Notification queue initialized');

