import { Worker, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import {
  createLNMarketsService,
  LNMarketsService,
} from '../services/lnmarkets.service';
import {
  secureStorage,
  SecureCredentials,
} from '../services/secure-storage.service';

// Create Redis connection
const redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');

// Create queue for margin monitoring jobs
const marginCheckQueue = new Queue('margin-check', {
  connection: redis,
  defaultJobOptions: {
    priority: 10, // High priority
    removeOnComplete: 50,
    removeOnFail: 50,
  },
});

// Secure storage for user credentials (encrypted)
const userCredentials: { [userId: string]: string } = {};

// Store LN Markets service instances
const lnMarketsServices: { [userId: string]: LNMarketsService } = {};

// Margin Guard configuration
interface MarginGuardConfig {
  userId: string;
  enabled: boolean;
  threshold: number; // Margin ratio threshold (e.g., 0.8 for 80%)
  autoClose: boolean; // Whether to automatically close positions
  notificationEnabled: boolean;
}

// Create worker
const worker = new Worker(
  'margin-check',
  async job => {
    const { userId, config } = job.data as {
      userId: string;
      config: MarginGuardConfig;
    };

    console.log(`🔍 Monitoring margin for user ${userId}`);

    try {
      // Get encrypted user credentials
      const encryptedCredentials = userCredentials[userId];
      if (!encryptedCredentials) {
        console.warn(`No credentials found for user ${userId}`);
        return { status: 'skipped', reason: 'no_credentials' };
      }

      // Decrypt credentials
      let credentials: SecureCredentials;
      try {
        credentials =
          await secureStorage.decryptCredentials(encryptedCredentials);
      } catch (error) {
        console.error(
          `Failed to decrypt credentials for user ${userId}:`,
          error
        );
        return { status: 'error', reason: 'decryption_failed' };
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

        let level: 'safe' | 'warning' | 'critical' = 'safe';
        if (marginRatio > 0.9) {
          level = 'critical';
        } else if (marginRatio > 0.8) {
          level = 'warning';
        }

        console.log(
          `📈 Trade ${trade.id}: Margin Ratio ${marginRatio.toFixed(4)} (${level})`
        );

        if (level !== 'safe') {
          const message = `⚠️ Margin ${level.toUpperCase()}: Trade ${trade.id} ratio ${marginRatio.toFixed(4)}`;
          alerts.push({
            tradeId: trade.id,
            marginRatio,
            level,
            message,
          });

          // Send notification if enabled
          if (config.notificationEnabled) {
            console.log(
              `📱 Sending notification to user ${userId}: ${message}`
            );
            // TODO: Integrate with notification worker
          }

          // Auto-close if enabled and critical
          if (config.autoClose && level === 'critical') {
            console.log(`🚨 Auto-closing trade ${trade.id} for user ${userId}`);
            try {
              await lnMarkets.closePosition(trade.id);
              console.log(`✅ Closed trade ${trade.id} for user ${userId}`);
            } catch (error) {
              console.error(`❌ Failed to close trade ${trade.id}:`, error);
            }
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

// Helper function to add user credentials (called when user registers/logs in)
export async function addUserCredentials(
  userId: string,
  apiKey: string,
  apiSecret: string,
  passphrase: string
) {
  try {
    const credentials: SecureCredentials = { apiKey, apiSecret, passphrase };
    const encryptedCredentials =
      await secureStorage.encryptCredentials(credentials);
    userCredentials[userId] = encryptedCredentials;
    console.log(`🔑 Added encrypted credentials for user ${userId}`);
  } catch (error) {
    console.error(`Failed to encrypt credentials for user ${userId}:`, error);
    throw new Error('Failed to store credentials securely');
  }
}

// Helper function to remove user credentials (called when user logs out or deletes account)
export function removeUserCredentials(userId: string) {
  delete userCredentials[userId];
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
    // Get encrypted user credentials
    const encryptedCredentials = userCredentials[userId];
    if (!encryptedCredentials) {
      console.warn(`No credentials found for user ${userId}`);
      return;
    }

    // Decrypt credentials
    let credentials: SecureCredentials;
    try {
      credentials =
        await secureStorage.decryptCredentials(encryptedCredentials);
    } catch (error) {
      console.error(`Failed to decrypt credentials for user ${userId}:`, error);
      return;
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

  console.log('📅 Starting periodic margin monitoring every 5 seconds');

  monitoringInterval = setInterval(async () => {
    try {
      // Get all user IDs with credentials
      const userIds = Object.keys(userCredentials);

      if (userIds.length === 0) {
        console.log('ℹ️  No users to monitor');
        return;
      }

      console.log(`🔄 Monitoring ${userIds.length} users`);

      // Add monitoring jobs for each user
      for (const userId of userIds) {
        const config: MarginGuardConfig = {
          userId,
          enabled: true, // Default enabled
          threshold: 0.8, // Default warning threshold
          autoClose: false, // Default no auto-close
          notificationEnabled: true, // Default notifications enabled
        };

        await marginCheckQueue.add(
          'monitor-margin',
          {
            userId,
            config,
          },
          {
            priority: 10,
            delay: 0,
            removeOnComplete: 50,
            removeOnFail: 50,
          }
        );
      }
    } catch (error) {
      console.error('❌ Error in periodic monitoring:', error);
    }
  }, 5000); // Every 5 seconds
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
