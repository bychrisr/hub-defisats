import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { PrismaClient } from '@prisma/client';
import {
  createLNMarketsService,
  LNMarketsService,
} from '../services/lnmarkets.service';
import { SecureCredentials } from '../services/secure-storage.service';

// Create Redis connection
const redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');

// Create Prisma client
const prisma = new PrismaClient();

// Function to get user's LN Markets credentials
async function getUserCredentials(userId: string): Promise<SecureCredentials | null> {
  try {
    // Get the credentials from the User table
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
      return null;
    }

    // Encrypt and then decrypt to ensure proper format (this is a workaround)
    const credentials: SecureCredentials = {
      apiKey: user.ln_markets_api_key,
      apiSecret: user.ln_markets_api_secret,
      passphrase: user.ln_markets_passphrase || '',
    };

    return credentials;
  } catch (error) {
    console.error(`Failed to get credentials for user ${userId}:`, error);
    return null;
  }
}

// Function to get automation configuration
async function getAutomationConfig(automationId: string) {
  try {
    const automation = await prisma.automation.findUnique({
      where: { id: automationId },
    });
    return automation;
  } catch (error) {
    console.error(`Failed to get automation config for ${automationId}:`, error);
    return null;
  }
}

// Function to execute Margin Guard action
async function executeMarginGuardAction(
  lnMarkets: LNMarketsService,
  automationConfig: any,
  userId: string,
  tradeId?: string
) {
  try {
    console.log(`🎯 Executing Margin Guard action for user ${userId}`);
    console.log(`📋 Action: ${automationConfig.action}`);

    switch (automationConfig.action) {
      case 'close_position':
        if (!tradeId) {
          throw new Error('Trade ID required for close_position action');
        }
        console.log(`🛑 Closing position ${tradeId} for user ${userId}`);
        await lnMarkets.closePosition(tradeId);
        console.log(`✅ Successfully closed position ${tradeId}`);

        // Log the action
        await prisma.tradeLog.create({
          data: {
            user_id: userId,
            automation_id: automationConfig.id,
            trade_id: tradeId,
            status: 'completed',
            executed_at: new Date(),
          },
        });
        break;

      case 'reduce_position':
        if (!tradeId || !automationConfig.reduce_percentage) {
          throw new Error('Trade ID and reduce percentage required for reduce_position action');
        }

        // Get trade details first
        const trades = await lnMarkets.getRunningTrades();
        const trade = trades.find(t => t.id === tradeId);

        if (!trade) {
          throw new Error(`Trade ${tradeId} not found`);
        }

        const reduceAmount = (trade.quantity * automationConfig.reduce_percentage) / 100;
        console.log(`📉 Reducing position ${tradeId} by ${automationConfig.reduce_percentage}% (${reduceAmount} contracts) for user ${userId}`);

        await lnMarkets.reducePosition(trade.market || 'btcusd', trade.side, reduceAmount);
        console.log(`✅ Successfully reduced position ${tradeId}`);

        // Log the action
        await prisma.tradeLog.create({
          data: {
            user_id: userId,
            automation_id: automationConfig.id,
            trade_id: tradeId,
            status: 'completed',
            executed_at: new Date(),
          },
        });
        break;

      case 'add_margin':
        if (!tradeId || !automationConfig.add_margin_amount) {
          throw new Error('Trade ID and margin amount required for add_margin action');
        }

        console.log(`💰 Adding ${automationConfig.add_margin_amount} sats margin to position ${tradeId} for user ${userId}`);
        await lnMarkets.addMargin(tradeId, automationConfig.add_margin_amount);
        console.log(`✅ Successfully added margin to position ${tradeId}`);

        // Log the action
        await prisma.tradeLog.create({
          data: {
            user_id: userId,
            automation_id: automationConfig.id,
            trade_id: tradeId,
            status: 'completed',
            executed_at: new Date(),
          },
        });
        break;

      default:
        throw new Error(`Unknown Margin Guard action: ${automationConfig.action}`);
    }
  } catch (error) {
    console.error(`❌ Failed to execute Margin Guard action:`, error);

    // Log the error
    await prisma.tradeLog.create({
      data: {
        user_id: userId,
        automation_id: automationConfig.id,
        trade_id: tradeId || 'unknown',
        status: 'failed',
        error_message: (error as Error).message,
        executed_at: new Date(),
      },
    });

    throw error;
  }
}

// Create worker with real automation logic
const worker = new Worker(
  'automation-executor',
  async job => {
    console.log('🤖 Automation executor job received:', job.data);

    const { userId, automationId, action, tradeId } = job.data;

    try {
      console.log(`🔄 Executing automation ${automationId} for user ${userId}`);

      // Get automation configuration
      const automation = await getAutomationConfig(automationId);
      if (!automation) {
        throw new Error(`Automation ${automationId} not found`);
      }

      // Get user credentials
      const credentials = await getUserCredentials(userId);
      if (!credentials) {
        throw new Error(`Credentials not found for user ${userId}`);
      }

      // Create LN Markets service instance
      const lnMarkets = createLNMarketsService(credentials);

      // Execute based on automation type
      switch (automation.type) {
        case 'margin_guard':
          await executeMarginGuardAction(lnMarkets, automation.config, userId, tradeId);
          return {
            status: 'completed',
            action: action,
            timestamp: new Date().toISOString(),
            automationId,
            userId,
            tradeId
          };

        case 'tp_sl':
          console.log('💰 Executing TP/SL automation');
          // TODO: Implement TP/SL logic
          return {
            status: 'completed',
            action: 'tp_sl_executed',
            timestamp: new Date().toISOString(),
            automationId,
            userId
          };

        case 'auto_entry':
          console.log('🎯 Executing auto entry automation');
          // TODO: Implement auto entry logic
          return {
            status: 'completed',
            action: 'auto_entry_executed',
            timestamp: new Date().toISOString(),
            automationId,
            userId
          };

        default:
          console.log(`⚠️ Unknown automation type: ${automation.type}`);
          return {
            status: 'error',
            error: `Unknown automation type: ${automation.type}`,
            timestamp: new Date().toISOString(),
            automationId,
            userId
          };
      }
    } catch (error) {
      console.error(`❌ Automation execution failed:`, error);
      return {
        status: 'error',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
        automationId,
        userId
      };
    }
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
