import { Worker, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import {
  createLNMarketsService,
  LNMarketsService,
} from '../services/lnmarkets.service';
// Import notification queue
import { notificationQueue } from '../queues/notification.queue';
import { prisma } from '../lib/prisma';
import { CredentialCacheService } from '../services/credential-cache.service';

// Create Redis connection
const redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');

// Create credential cache service
const credentialCache = new CredentialCacheService(redis);

// Notification queue is imported from shared module

// Create queue for margin monitoring jobs
const marginCheckQueue = new Queue('margin-check', {
  connection: redis,
  defaultJobOptions: {
    priority: 10, // High priority
    removeOnComplete: 50,
    removeOnFail: 50,
  },
});

// Note: Credentials are now fetched from database and decrypted on-demand

// Store LN Markets service instances
const lnMarketsServices: { [userId: string]: LNMarketsService } = {};

// Margin Guard configuration from database
interface MarginGuardConfig {
  userId: string;
  enabled: boolean;
  margin_threshold: number; // Margin threshold percentage (e.g., 20 for 20%)
  action: 'close_position' | 'reduce_position' | 'add_margin';
  reduce_percentage?: number; // For reduce_position action
  add_margin_amount?: number; // For add_margin action
}

// Function to execute Margin Guard action based on configuration
async function executeMarginGuardAction(
  lnMarkets: LNMarketsService,
  trade: any,
  config: MarginGuardConfig,
  userId: string
): Promise<void> {
  try {
    console.log(`🎯 Executing Margin Guard action for user ${userId}, trade ${trade.id}`);
    console.log(`📋 Action: ${config.action}`);

    switch (config.action) {
      case 'close_position':
        console.log(`🛑 Closing position ${trade.id} for user ${userId}`);
        await lnMarkets.closePosition(trade.id);
        console.log(`✅ Successfully closed position ${trade.id}`);

        // Queue automation execution notification
        await marginCheckQueue.add(
          'automation-execution',
          {
            userId,
            automationId: 'margin-guard-auto', // This should be the actual automation ID
            action: 'margin_guard_close',
            tradeId: trade.id,
          },
          {
            priority: 10,
            removeOnComplete: 50,
            removeOnFail: 50,
          }
        );
        break;

      case 'reduce_position':
        if (config.reduce_percentage) {
          const reduceAmount = (trade.quantity * config.reduce_percentage) / 100;
          console.log(`📉 Reducing position ${trade.id} by ${config.reduce_percentage}% (${reduceAmount} contracts) for user ${userId}`);
          await lnMarkets.reducePosition(trade.market || 'btcusd', trade.side, reduceAmount);
          console.log(`✅ Successfully reduced position ${trade.id}`);
        } else {
          console.warn(`⚠️ Reduce percentage not configured for user ${userId}`);
        }
        break;

      case 'add_margin':
        if (config.add_margin_amount) {
          console.log(`💰 Adding ${config.add_margin_amount} sats margin to position ${trade.id} for user ${userId}`);
          await lnMarkets.addMargin(trade.id, config.add_margin_amount);
          console.log(`✅ Successfully added margin to position ${trade.id}`);
        } else {
          console.warn(`⚠️ Add margin amount not configured for user ${userId}`);
        }
        break;

      default:
        console.warn(`⚠️ Unknown Margin Guard action: ${config.action}`);
    }
  } catch (error) {
    console.error(`❌ Failed to execute Margin Guard action for user ${userId}, trade ${trade.id}:`, error);

    // Queue error notification
    await marginCheckQueue.add(
      'automation-execution',
      {
        userId,
        automationId: 'margin-guard-error',
        action: 'margin_guard_error',
        tradeId: trade.id,
        error: (error as Error).message,
      },
      {
        priority: 5, // Lower priority for errors
        removeOnComplete: 50,
        removeOnFail: 50,
      }
    );
  }
}

// Function to send margin alert notifications
async function sendMarginAlert(
  userId: string,
  alert: { tradeId: string; marginRatio: number; level: string; message: string }
) {
  try {
    console.log(`📱 Sending margin alert to user ${userId}: ${alert.message}`);

    // Get user notification preferences
    const notifications = await prisma.notification.findMany({
      where: {
        user_id: userId,
        is_enabled: true,
      },
    });

    if (notifications.length === 0) {
      console.log(`ℹ️  No notifications enabled for user ${userId}`);
      return;
    }

    // Send notifications for each enabled channel
    for (const notification of notifications) {
      const channelConfig = notification.channel_config as any;

      await notificationQueue.add(
        'notification',
        {
          userId,
          type: 'margin_alert',
          channel: notification.type,
          message: alert.message,
          metadata: {
            marginRatio: alert.marginRatio,
            level: alert.level,
            pnl: 0, // Will be calculated later
            price: 0, // Will be fetched from market data
            tradeId: alert.tradeId,
          },
        },
        {
          priority: 5,
          delay: 0,
          removeOnComplete: 50,
          removeOnFail: 50,
        }
      );

      console.log(`✅ Queued ${notification.type} notification for user ${userId}`);
    }
  } catch (error) {
    console.error(`❌ Failed to send margin alert to user ${userId}:`, error);
  }
}

// Function to get Margin Guard configuration from database
async function getMarginGuardConfig(userId: string): Promise<MarginGuardConfig | null> {
  try {
    const automation = await prisma.automation.findFirst({
      where: {
        user_id: userId,
        type: 'margin_guard',
        is_active: true,
      },
    });

    if (!automation) {
      console.log(`ℹ️  No active Margin Guard found for user ${userId}`);
      return null;
    }

    const config = automation.config as any;

    return {
      userId,
      enabled: config.enabled !== false, // Default to true if not specified
      margin_threshold: config.margin_threshold || 20, // Default to 20%
      action: config.action || 'close_position', // Default action
      reduce_percentage: config.reduce_percentage,
      add_margin_amount: config.add_margin_amount,
    };
  } catch (error) {
    console.error(`❌ Failed to get Margin Guard config for user ${userId}:`, error);
    return null;
  }
}

// Create worker
const worker = new Worker(
  'margin-check',
  async job => {
    const { userId } = job.data as {
      userId: string;
    };

    console.log(`🔍 Monitoring margin for user ${userId}`);

    try {
      // Get Margin Guard configuration from database
      const config = await getMarginGuardConfig(userId);
      if (!config) {
        console.log(`ℹ️  No Margin Guard configuration found for user ${userId}`);
        return { status: 'skipped', reason: 'no_config' };
      }

      if (!config.enabled) {
        console.log(`ℹ️  Margin Guard disabled for user ${userId}`);
        return { status: 'skipped', reason: 'disabled' };
      }

      // Try to get credentials from cache first
      let credentials = await credentialCache.get(userId);
      if (!credentials) {
        console.log(`🔍 Credentials not in cache, fetching from database for user ${userId}`);
        
        // Get user credentials from database
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            ln_markets_api_key: true,
            ln_markets_api_secret: true,
            ln_markets_passphrase: true,
          },
        });

        if (!user?.ln_markets_api_key || !user?.ln_markets_api_secret) {
          console.warn(`No LN Markets credentials found for user ${userId}`);
          return { status: 'skipped', reason: 'no_credentials' };
        }

        // Import secure storage service
        const { secureStorage } = await import('../services/secure-storage.service');
        
        // Decrypt credentials using SecureStorageService
        try {
          credentials = await secureStorage.decryptCredentials(user.ln_markets_api_key);
          
          // Cache the credentials for future use
          await credentialCache.set(userId, credentials);
          console.log(`✅ Credentials cached for user ${userId}`);
        } catch (error) {
          console.error(
            `Failed to decrypt credentials for user ${userId}:`,
            error
          );
          return { status: 'error', reason: 'decryption_failed' };
        }
      } else {
        console.log(`✅ Credentials found in cache for user ${userId}`);
      }

      // Get or create LN Markets service
      let lnMarkets = lnMarketsServices[userId];
      if (!lnMarkets) {
        lnMarkets = createLNMarketsService(credentials);
        lnMarketsServices[userId] = lnMarkets;
      }

      // Fetch running trades
      const runningTrades = await lnMarkets.getRunningTrades();

      if (runningTrades.length === 0) {
        console.log(`ℹ️  User ${userId} has no running trades`);
        return { status: 'processed', tradesCount: 0, alerts: [] };
      }

      console.log(
        `📊 User ${userId} has ${runningTrades.length} running trades`
      );

      const alerts: Array<{
        tradeId: string;
        marginRatio: number;
        level: string;
        message: string;
      }> = [];

      // Calculate margin ratio for each trade
      for (const trade of runningTrades) {
        const maintenanceMargin = trade.maintenance_margin || 0;
        const margin = trade.margin || 0;
        const pl = trade.pl || 0;

        if (maintenanceMargin === 0) {
          console.warn(`⚠️  Trade ${trade.id} has zero maintenance margin`);
          continue;
        }

        const marginRatio = maintenanceMargin / (margin + pl);

        // Use user's configured threshold (convert percentage to decimal)
        const thresholdDecimal = config.margin_threshold / 100;
        const warningThreshold = thresholdDecimal * 0.8; // Warning at 80% of critical threshold

        let level: 'safe' | 'warning' | 'critical' = 'safe';
        if (marginRatio >= thresholdDecimal) {
          level = 'critical';
        } else if (marginRatio >= warningThreshold) {
          level = 'warning';
        }

        console.log(
          `📈 Trade ${trade.id}: Margin Ratio ${marginRatio.toFixed(4)} (${level})`
        );

        if (level !== 'safe') {
          const message = `⚠️ Margin ${level.toUpperCase()}: Trade ${trade.id} ratio ${marginRatio.toFixed(4)} (threshold: ${thresholdDecimal.toFixed(4)})`;
          alerts.push({
            tradeId: trade.id,
            marginRatio,
            level,
            message,
          });

          console.log(`🚨 Margin ${level.toUpperCase()} detected for trade ${trade.id}: ${marginRatio.toFixed(4)} >= ${thresholdDecimal.toFixed(4)}`);

          // Send notification for all alerts (warning and critical)
          await sendMarginAlert(userId, {
            tradeId: trade.id,
            marginRatio,
            level,
            message,
          });

          // Execute action based on user's configuration and margin level
          if (level === 'critical') {
            await executeMarginGuardAction(lnMarkets, trade, config, userId);
          }
        }
      }

      return {
        status: 'processed',
        tradesCount: runningTrades.length,
        alertsCount: alerts.length,
        alerts,
      };
    } catch (error) {
      console.error(`❌ Error monitoring margin for user ${userId}:`, error);
      return { status: 'error', error: (error as Error).message };
    }
  },
  {
    connection: redis,
    concurrency: 5, // Process up to 5 users simultaneously
    limiter: {
      max: 10, // Max 10 jobs per duration
      duration: 1000, // Per second
    },
  }
);

// Event handlers
worker.on('completed', job => {
  console.log(
    `✅ Margin monitor job ${job.id} completed for user ${job.data.userId}`
  );
});

worker.on('failed', (job, err) => {
  console.error(
    `❌ Margin monitor job ${job?.id} failed for user ${job?.data?.userId}:`,
    err
  );
});

// Helper function to remove user credentials (called when user logs out or deletes account)
export function removeUserCredentials(userId: string) {
  delete lnMarketsServices[userId];
  console.log(`🗑️  Removed credentials for user ${userId}`);
}

// Helper function to simulate margin monitoring (for testing)
export async function simulateMarginMonitoring(
  userId: string,
  _config: MarginGuardConfig
) {
  console.log(`🎯 Simulating margin monitoring for user ${userId}`);

  try {
    // Try to get credentials from cache first
    let credentials = await credentialCache.get(userId);
    if (!credentials) {
      console.log(`🔍 Credentials not in cache, fetching from database for user ${userId}`);
      
      // Get user credentials from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true,
        },
      });

      if (!user?.ln_markets_api_key || !user?.ln_markets_api_secret) {
        console.warn(`No LN Markets credentials found for user ${userId}`);
        return;
      }

      // Import secure storage service
      const { secureStorage } = await import('../services/secure-storage.service');
      
      // Decrypt credentials using SecureStorageService
      try {
        credentials = await secureStorage.decryptCredentials(user.ln_markets_api_key);
        
        // Cache the credentials for future use
        await credentialCache.set(userId, credentials);
        console.log(`✅ Credentials cached for user ${userId}`);
      } catch (error) {
        console.error(`Failed to decrypt credentials for user ${userId}:`, error);
        return;
      }
    } else {
      console.log(`✅ Credentials found in cache for user ${userId}`);
    }

    // Create LN Markets service
    const lnMarkets = createLNMarketsService(credentials);

    // Simulate margin monitoring
    const marginInfo = await lnMarkets.getMarginInfo();
    const positions = await lnMarkets.getPositions();

    console.log(
      `📊 Simulated margin check for ${userId}: ${marginInfo.marginLevel?.toFixed(2)}%`
    );

    const risk = lnMarkets.calculateLiquidationRisk(marginInfo, positions);

    if (risk.atRisk) {
      console.log(`⚠️  ${risk.message}`);
    } else {
      console.log(`✅ ${risk.message}`);
    }
  } catch (error) {
    console.error(`❌ Simulation failed for user ${userId}:`, error);
  }
}

// Periodic monitoring scheduler
let monitoringInterval: NodeJS.Timeout | null = null;

export function startPeriodicMonitoring() {
  if (monitoringInterval) {
    console.log('📅 Periodic monitoring already running');
    return;
  }

  console.log('📅 Starting periodic margin monitoring every 30 seconds');

  monitoringInterval = setInterval(async () => {
    try {
      // Get all users with active Margin Guard configurations
      const usersWithMarginGuard = await prisma.automation.findMany({
        where: {
          type: 'margin_guard',
          is_active: true,
        },
        select: {
          user_id: true,
        },
        distinct: ['user_id'],
      });

      if (usersWithMarginGuard.length === 0) {
        console.log('ℹ️  No users with active Margin Guard to monitor');
        return;
      }

      console.log(`🔄 Monitoring ${usersWithMarginGuard.length} users with Margin Guard`);

      // Add monitoring jobs for each user
      for (const { user_id: userId } of usersWithMarginGuard) {
        try {
          // Check if user has Margin Guard configured and enabled
          const config = await getMarginGuardConfig(userId);
          if (config && config.enabled) {
            await marginCheckQueue.add(
              'monitor-margin',
              {
                userId,
              },
              {
                priority: 10,
                delay: 0,
                removeOnComplete: 50,
                removeOnFail: 50,
              }
            );
            console.log(`✅ Scheduled margin monitoring for user ${userId}`);
          } else {
            console.log(`⏭️  Skipping user ${userId} - no active Margin Guard`);
          }
        } catch (error) {
          console.error(`❌ Failed to check Margin Guard config for user ${userId}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error in periodic monitoring:', error);
    }
  }, 30000); // Every 30 seconds (more reasonable for production)
}

export function stopPeriodicMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log('🛑 Stopped periodic margin monitoring');
  }
}

console.log('🚀 Margin monitor worker started');

// Start periodic monitoring by default
startPeriodicMonitoring();

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down margin monitor worker...');
  stopPeriodicMonitoring();
  await worker.close();
  await marginCheckQueue.close();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down margin monitor worker...');
  stopPeriodicMonitoring();
  await worker.close();
  await marginCheckQueue.close();
  await redis.disconnect();
  process.exit(0);
});
