import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { lightningPaymentService } from '../services/lightning-payment.service';

// Create Redis connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Create Prisma client
const prisma = new PrismaClient();

// Create worker for payment validation
const worker = new Worker(
  'payment-validator',
  async job => {
    console.log('💰 Payment validation job started');

    try {
      // Find pending payments that haven't expired
      const pendingPayments = await prisma.payment.findMany({
        where: {
          status: 'pending',
          expires_at: {
            gt: new Date(),
          },
        },
        take: 50, // Process in batches
      });

      console.log(`📋 Found ${pendingPayments.length} pending payments to validate`);

      let validatedCount = 0;
      let confirmedCount = 0;

      for (const payment of pendingPayments) {
        try {
          console.log(`🔍 Validating payment ${payment.id} (${payment.payment_hash})`);

          const isPaid = await lightningPaymentService.checkPayment(payment.id);

          if (isPaid) {
            console.log(`✅ Payment ${payment.id} confirmed!`);
            confirmedCount++;

            // Send notification to user
            try {
              const { notificationQueue } = await import('../queues/notification.queue');
              await notificationQueue.add('notification', {
                userId: payment.user_id,
                type: 'system_alert',
                channel: 'telegram', // Default to telegram, user can configure others
                message: `🎉 Pagamento confirmado! Seu plano ${payment.plan_type} foi ativado com sucesso.`,
                metadata: {
                  paymentId: payment.id,
                  planType: payment.plan_type,
                  amount: payment.amount_sats,
                },
              });
            } catch (notificationError) {
              console.error('Error sending payment confirmation notification:', notificationError);
            }
          }

          validatedCount++;
        } catch (error) {
          console.error(`❌ Error validating payment ${payment.id}:`, error);
        }
      }

      console.log(`📊 Validation complete: ${validatedCount} validated, ${confirmedCount} confirmed`);

      return {
        status: 'completed',
        validated: validatedCount,
        confirmed: confirmedCount,
        timestamp: new Date().toISOString(),
      };

    } catch (error: any) {
      console.error('❌ Payment validation job failed:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  },
  {
    connection: redis,
    concurrency: 1, // Process one batch at a time
    limiter: {
      max: 1, // Max 1 job per duration
      duration: 30000, // Per 30 seconds (don't spam payment providers)
    },
  }
);

// Clean up expired payments
const cleanupWorker = new Worker(
  'payment-cleanup',
  async job => {
    console.log('🧹 Payment cleanup job started');

    try {
      const expiredPayments = await prisma.payment.updateMany({
        where: {
          status: 'pending',
          expires_at: {
            lt: new Date(),
          },
        },
        data: {
          status: 'expired',
          updated_at: new Date(),
        },
      });

      console.log(`🗑️ Marked ${expiredPayments.count} payments as expired`);

      // Send notifications for expired payments
      if (expiredPayments.count > 0) {
        const expiredPaymentList = await prisma.payment.findMany({
          where: {
            status: 'expired',
            updated_at: {
              gte: new Date(Date.now() - 60000), // Updated in last minute
            },
          },
        });

        for (const payment of expiredPaymentList) {
          try {
            const { notificationQueue } = await import('../queues/notification.queue');
            await notificationQueue.add('notification', {
              userId: payment.user_id,
              type: 'system_alert',
              channel: 'telegram',
              message: `⏰ Seu pagamento expirou. Para ativar o plano ${payment.plan_type}, crie uma nova invoice.`,
              metadata: {
                paymentId: payment.id,
                planType: payment.plan_type,
                expired: true,
              },
            });
          } catch (notificationError) {
            console.error('Error sending expiry notification:', notificationError);
          }
        }
      }

      return {
        status: 'completed',
        expired_count: expiredPayments.count,
        timestamp: new Date().toISOString(),
      };

    } catch (error: any) {
      console.error('❌ Payment cleanup job failed:', error);
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  },
  { connection: redis }
);

// Event handlers
worker.on('completed', job => {
  console.log(`✅ Payment validation job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Payment validation job ${job?.id} failed:`, err);
});

cleanupWorker.on('completed', job => {
  console.log(`✅ Payment cleanup job ${job.id} completed`);
});

cleanupWorker.on('failed', (job, err) => {
  console.error(`❌ Payment cleanup job ${job?.id} failed:`, err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down payment workers...');
  await worker.close();
  await cleanupWorker.close();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down payment workers...');
  await worker.close();
  await cleanupWorker.close();
  await redis.disconnect();
  process.exit(0);
});

console.log('💰 Payment validation and cleanup workers started');