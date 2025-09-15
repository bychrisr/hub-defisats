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

// Function to execute Auto Entry automation
async function executeAutoEntryAction(
  lnMarkets: LNMarketsService,
  automationConfig: any,
  userId: string
) {
  try {
    console.log(`🎯 Executing Auto Entry action for user ${userId}`);

    const {
      market = 'btcusd',
      side, // 'b' for buy, 's' for sell
      leverage = 10,
      quantity,
      stoploss,
      takeprofit,
      trigger_price, // Optional price trigger
      trigger_type = 'market', // 'market' or 'limit'
    } = automationConfig;

    // Validate required parameters
    if (!side || !quantity) {
      throw new Error('Side and quantity are required for auto entry');
    }

    // Check if we should trigger based on price (if trigger_price is set)
    if (trigger_price) {
      const currentPrice = await lnMarkets.getMarketPrice(market);
      const shouldTrigger = side === 'b'
        ? currentPrice <= trigger_price
        : currentPrice >= trigger_price;

      if (!shouldTrigger) {
        console.log(`⏳ Auto entry not triggered. Current price: ${currentPrice}, Trigger: ${trigger_price}`);
        return {
          status: 'pending',
          reason: 'price_not_triggered',
          currentPrice,
          triggerPrice: trigger_price,
        };
      }
    }

    console.log(`📈 Creating ${side === 'b' ? 'LONG' : 'SHORT'} position: ${quantity} contracts at ${leverage}x leverage`);

    // Create the trade
    const tradeResult = await lnMarkets.createTrade({
      type: 'm', // market order
      side,
      market,
      leverage,
      quantity,
      stoploss,
      takeprofit,
    });

    console.log(`✅ Auto entry executed successfully. Trade ID: ${tradeResult.id}`);

    // Log the action
    await prisma.tradeLog.create({
      data: {
        user_id: userId,
        automation_id: automationConfig.id,
        trade_id: tradeResult.id,
        status: 'completed',
        executed_at: new Date(),
      },
    });

    return {
      status: 'completed',
      tradeId: tradeResult.id,
      side,
      quantity,
      leverage,
      market,
    };

  } catch (error) {
    console.error(`❌ Failed to execute Auto Entry action:`, error);

    // Log the error
    await prisma.tradeLog.create({
      data: {
        user_id: userId,
        automation_id: automationConfig.id,
        trade_id: 'auto_entry_failed',
        status: 'failed',
        error_message: (error as Error).message,
        executed_at: new Date(),
      },
    });

    throw error;
  }
}

// Function to execute Take Profit/Stop Loss automation
async function executeTpSlAction(
  lnMarkets: LNMarketsService,
  automationConfig: any,
  userId: string,
  tradeId?: string
) {
  try {
    console.log(`💰 Executing TP/SL action for user ${userId}`);

    const {
      action, // 'update_tp', 'update_sl', 'close_tp', 'close_sl'
      new_takeprofit,
      new_stoploss,
      trigger_pnl_percentage, // Optional: trigger when P&L reaches X%
      trigger_price, // Optional: trigger at specific price
    } = automationConfig;

    // If tradeId is not provided, we need to find the relevant trade
    let targetTradeId = tradeId;
    if (!targetTradeId) {
      // Get all running trades and find the most suitable one
      const runningTrades = await lnMarkets.getRunningTrades();
      if (runningTrades.length === 0) {
        throw new Error('No running trades found for TP/SL action');
      }

      // For now, use the first running trade (could be enhanced with more logic)
      targetTradeId = runningTrades[0].id;
    }

    console.log(`🎯 ${action} for trade ${targetTradeId}`);

    let result;

    switch (action) {
      case 'update_tp':
        if (!new_takeprofit) {
          throw new Error('New take profit price required');
        }
        console.log(`📈 Updating TP to ${new_takeprofit} for trade ${targetTradeId}`);
        result = await lnMarkets.updateTakeProfit(targetTradeId, new_takeprofit);
        break;

      case 'update_sl':
        if (!new_stoploss) {
          throw new Error('New stop loss price required');
        }
        console.log(`📉 Updating SL to ${new_stoploss} for trade ${targetTradeId}`);
        result = await lnMarkets.updateStopLoss(targetTradeId, new_stoploss);
        break;

      case 'close_tp':
        console.log(`🎯 Closing position at take profit for trade ${targetTradeId}`);
        result = await lnMarkets.closePosition(targetTradeId);
        break;

      case 'close_sl':
        console.log(`🛑 Closing position at stop loss for trade ${targetTradeId}`);
        result = await lnMarkets.closePosition(targetTradeId);
        break;

      default:
        throw new Error(`Unknown TP/SL action: ${action}`);
    }

    console.log(`✅ TP/SL action executed successfully for trade ${targetTradeId}`);

    // Log the action
    await prisma.tradeLog.create({
      data: {
        user_id: userId,
        automation_id: automationConfig.id,
        trade_id: targetTradeId,
        status: 'completed',
        executed_at: new Date(),
      },
    });

    return {
      status: 'completed',
      action,
      tradeId: targetTradeId,
      result,
    };

  } catch (error) {
    console.error(`❌ Failed to execute TP/SL action:`, error);

    // Log the error
    await prisma.tradeLog.create({
      data: {
        user_id: userId,
        automation_id: automationConfig.id,
        trade_id: tradeId || 'tpsl_failed',
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
          await executeTpSlAction(lnMarkets, automation.config, userId, tradeId);
          return {
            status: 'completed',
            action: 'tp_sl_executed',
            timestamp: new Date().toISOString(),
            automationId,
            userId,
            tradeId
          };

        case 'auto_entry':
          const entryResult = await executeAutoEntryAction(lnMarkets, automation.config, userId);
          return {
            status: entryResult.status,
            action: 'auto_entry_executed',
            timestamp: new Date().toISOString(),
            automationId,
            userId,
            tradeId: entryResult.tradeId,
            result: entryResult
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
