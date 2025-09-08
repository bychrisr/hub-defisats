import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { createLNMarketsService, LNMarketsService } from '../services/lnmarkets.service';

// Create Redis connection
const redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');

// In-memory storage for user credentials (in production, this would come from database)
const userCredentials: { [userId: string]: { apiKey: string; apiSecret: string } } = {};

// Store LN Markets service instances
const lnMarketsServices: { [userId: string]: LNMarketsService } = {};

// Margin Guard configuration
interface MarginGuardConfig {
  userId: string;
  enabled: boolean;
  threshold: number; // Margin level threshold (e.g., 20 for 20%)
  autoClose: boolean; // Whether to automatically close positions
  notificationEnabled: boolean;
}

// Create worker
const worker = new Worker('margin-monitor', async (job) => {
  const { userId, config } = job.data as { userId: string; config: MarginGuardConfig };

  console.log(`🔍 Monitoring margin for user ${userId}`);

  try {
    // Get user credentials (in production, fetch from database)
    const credentials = userCredentials[userId];
    if (!credentials) {
      console.warn(`No credentials found for user ${userId}`);
      return { status: 'skipped', reason: 'no_credentials' };
    }

    // Get or create LN Markets service
    let lnMarkets = lnMarketsServices[userId];
    if (!lnMarkets) {
      lnMarkets = createLNMarketsService(credentials);
      lnMarketsServices[userId] = lnMarkets;
    }

    // Fetch margin information
    const marginInfo = await lnMarkets.getMarginInfo();
    const positions = await lnMarkets.getPositions();

    console.log(`📊 User ${userId} margin level: ${marginInfo.marginLevel?.toFixed(2)}%`);

    // Calculate liquidation risk
    const risk = lnMarkets.calculateLiquidationRisk(marginInfo, positions);

    // Check if action is needed
    if (risk.atRisk && config.enabled) {
      console.log(`⚠️  ${risk.message}`);

      // Send notification if enabled
      if (config.notificationEnabled) {
        // TODO: Send notification via notification worker
        console.log(`📱 Sending notification to user ${userId}: ${risk.message}`);
      }

      // Auto-close positions if enabled and risk is critical/high
      if (config.autoClose && (risk.riskLevel === 'critical' || risk.riskLevel === 'high')) {
        console.log(`🚨 Auto-closing positions for user ${userId}`);

        // Close positions automatically
        for (const position of positions) {
          try {
            await lnMarkets.closePosition(position.id);
            console.log(`✅ Closed position ${position.id} for user ${userId}`);
          } catch (error) {
            console.error(`❌ Failed to close position ${position.id}:`, error);
          }
        }
      }
    } else {
      console.log(`✅ User ${userId} margin healthy: ${risk.message}`);
    }

    return {
      status: 'processed',
      marginLevel: marginInfo.marginLevel,
      riskLevel: risk.riskLevel,
      atRisk: risk.atRisk,
      positionsCount: positions.length
    };

  } catch (error) {
    console.error(`❌ Error monitoring margin for user ${userId}:`, error);
    return { status: 'error', error: (error as Error).message };
  }
}, {
  connection: redis,
  concurrency: 5, // Process up to 5 users simultaneously
  limiter: {
    max: 10, // Max 10 jobs per duration
    duration: 1000, // Per second
  }
});

// Event handlers
worker.on('completed', (job) => {
  console.log(`✅ Margin monitor job ${job.id} completed for user ${job.data.userId}`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Margin monitor job ${job?.id} failed for user ${job?.data?.userId}:`, err);
});

// Helper function to add user credentials (called when user registers/logs in)
export function addUserCredentials(userId: string, apiKey: string, apiSecret: string) {
  userCredentials[userId] = { apiKey, apiSecret };
  console.log(`🔑 Added credentials for user ${userId}`);
}

// Helper function to remove user credentials (called when user logs out or deletes account)
export function removeUserCredentials(userId: string) {
  delete userCredentials[userId];
  delete lnMarketsServices[userId];
  console.log(`🗑️  Removed credentials for user ${userId}`);
}

// Helper function to simulate margin monitoring (for testing)
export async function simulateMarginMonitoring(userId: string, config: MarginGuardConfig) {
  console.log(`🎯 Simulating margin monitoring for user ${userId}`);

  try {
    // Get user credentials
    const credentials = userCredentials[userId];
    if (!credentials) {
      console.warn(`No credentials found for user ${userId}`);
      return;
    }

    // Create LN Markets service
    const lnMarkets = createLNMarketsService(credentials);

    // Simulate margin monitoring
    const marginInfo = await lnMarkets.getMarginInfo();
    const positions = await lnMarkets.getPositions();

    console.log(`📊 Simulated margin check for ${userId}: ${marginInfo.marginLevel?.toFixed(2)}%`);

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

console.log('🚀 Margin monitor worker started');

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down margin monitor worker...');
  await worker.close();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down margin monitor worker...');
  await worker.close();
  await redis.disconnect();
  process.exit(0);
});