import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';
import { SecureCredentials } from '../services/secure-storage.service';
import { prisma } from '../lib/prisma';
import { CredentialCacheService } from '../services/credential-cache.service';
import { UserExchangeAccountService } from '../services/userExchangeAccount.service';

// Create Redis connection
const redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');

// Create credential cache service
const credentialCache = new CredentialCacheService(redis);

// Create UserExchangeAccountService instance
const userExchangeAccountService = new UserExchangeAccountService(prisma);

// Function to get user's active exchange account credentials
async function getUserCredentials(userId: string, accountId?: string): Promise<{ credentials: SecureCredentials; account: any } | null> {
  try {
    console.log(`🔍 AUTOMATION EXECUTOR - Getting credentials for user ${userId}${accountId ? ` and account ${accountId}` : ''}`);
    
    let activeAccount;
    
    if (accountId) {
      // Get specific account
      activeAccount = await userExchangeAccountService.getUserExchangeAccount(accountId, userId);
      if (!activeAccount) {
        console.warn(`❌ AUTOMATION EXECUTOR - Account ${accountId} not found for user ${userId}`);
        return null;
      }
    } else {
      // Get all user accounts and find the active one
      const userAccounts = await userExchangeAccountService.getUserExchangeAccounts(userId);
      activeAccount = userAccounts.find(account => account.is_active);
      if (!activeAccount) {
        console.warn(`❌ AUTOMATION EXECUTOR - No active account found for user ${userId}`);
        return null;
      }
    }

    console.log(`✅ AUTOMATION EXECUTOR - Found account: ${activeAccount.account_name} (${activeAccount.exchange.name})`);

    // Check if account has credentials
    if (!activeAccount.credentials || Object.keys(activeAccount.credentials).length === 0) {
      console.warn(`❌ AUTOMATION EXECUTOR - Account ${activeAccount.account_name} has no credentials`);
      return null;
    }

    // Validate credentials are not empty
    const hasValidCredentials = Object.values(activeAccount.credentials).some(value =>
      value && typeof value === 'string' && value.trim() !== ''
    );

    if (!hasValidCredentials) {
      console.warn(`❌ AUTOMATION EXECUTOR - Account ${activeAccount.account_name} has empty credentials`);
      return null;
    }

    // Try to get from cache first (using account-specific key)
    const cacheKey = `${userId}-${activeAccount.id}`;
    let credentials = await credentialCache.get(cacheKey);
    
    if (credentials) {
      console.log(`✅ AUTOMATION EXECUTOR - Credentials found in cache for account ${activeAccount.account_name}`);
      return { credentials, account: activeAccount };
    }

    console.log(`🔍 AUTOMATION EXECUTOR - Credentials not in cache, using account credentials for ${activeAccount.account_name}`);
    
    // Use credentials from the account (already decrypted by UserExchangeAccountService)
    credentials = activeAccount.credentials as SecureCredentials;
    
    // Cache the credentials for future use
    await credentialCache.set(cacheKey, credentials);
    console.log(`✅ AUTOMATION EXECUTOR - Credentials cached for account ${activeAccount.account_name}`);
    
    return { credentials, account: activeAccount };
  } catch (error) {
    console.error(`❌ AUTOMATION EXECUTOR - Failed to get credentials for user ${userId}:`, error);
    return null;
  }
}

// Function to get automation configuration with account data
async function getAutomationConfig(automationId: string) {
  try {
    console.log(`🔍 AUTOMATION EXECUTOR - Getting automation config for ${automationId}`);
    
    const automation = await prisma.automation.findUnique({
      where: { id: automationId },
      include: {
        user_exchange_account: {
          include: {
            exchange: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    if (!automation) {
      console.warn(`❌ AUTOMATION EXECUTOR - Automation ${automationId} not found`);
      return null;
    }

    console.log(`✅ AUTOMATION EXECUTOR - Found automation: ${automation.type} for account ${automation.user_exchange_account?.account_name}`);
    
    return automation;
  } catch (error) {
    console.error(`❌ AUTOMATION EXECUTOR - Failed to get automation config for ${automationId}:`, error);
    return null;
  }
}

// Function to execute Margin Guard action
async function executeMarginGuardAction(
  lnMarkets: LNMarketsAPIService,
  automationConfig: any,
  userId: string,
  accountName: string,
  tradeId?: string
) {
  try {
    console.log(`🎯 AUTOMATION EXECUTOR - Executing Margin Guard action for user ${userId} on account ${accountName}`);
    console.log(`📋 AUTOMATION EXECUTOR - Action: ${automationConfig.action}`);

    switch (automationConfig.action) {
      case 'close_position':
        if (!tradeId) {
          throw new Error('Trade ID required for close_position action');
        }
        console.log(`🛑 AUTOMATION EXECUTOR - Closing position ${tradeId} for user ${userId} on account ${accountName}`);
        await lnMarkets.closePosition(tradeId);
        console.log(`✅ AUTOMATION EXECUTOR - Successfully closed position ${tradeId} on account ${accountName}`);

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
        console.log(`📉 AUTOMATION EXECUTOR - Reducing position ${tradeId} by ${automationConfig.reduce_percentage}% (${reduceAmount} contracts) for user ${userId} on account ${accountName}`);

        await lnMarkets.reducePosition(tradeId, reduceAmount);
        console.log(`✅ AUTOMATION EXECUTOR - Successfully reduced position ${tradeId} on account ${accountName}`);

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

        console.log(`💰 AUTOMATION EXECUTOR - Adding ${automationConfig.add_margin_amount} sats margin to position ${tradeId} for user ${userId} on account ${accountName}`);
        await lnMarkets.addMargin(tradeId, automationConfig.add_margin_amount);
        console.log(`✅ AUTOMATION EXECUTOR - Successfully added margin to position ${tradeId} on account ${accountName}`);

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
    console.error(`❌ AUTOMATION EXECUTOR - Failed to execute Margin Guard action for account ${accountName}:`, error);

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
  lnMarkets: LNMarketsAPIService,
  automationConfig: any,
  userId: string,
  accountName: string
) {
  try {
    console.log(`🎯 AUTOMATION EXECUTOR - Executing Auto Entry action for user ${userId} on account ${accountName}`);

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
      const currentPrice = await lnMarkets.getMarketPrice();
      const shouldTrigger = side === 'b'
        ? currentPrice <= trigger_price
        : currentPrice >= trigger_price;

      if (!shouldTrigger) {
        console.log(`⏳ AUTOMATION EXECUTOR - Auto entry not triggered for account ${accountName}. Current price: ${currentPrice}, Trigger: ${trigger_price}`);
        return {
          status: 'pending',
          reason: 'price_not_triggered',
          currentPrice,
          triggerPrice: trigger_price,
        };
      }
    }

    console.log(`📈 AUTOMATION EXECUTOR - Creating ${side === 'b' ? 'LONG' : 'SHORT'} position: ${quantity} contracts at ${leverage}x leverage for account ${accountName}`);

    // Create the trade
    const tradeResult = await lnMarkets.createTrade({
      side,
      leverage,
      quantity,
      stoploss,
      takeprofit,
    });

    console.log(`✅ AUTOMATION EXECUTOR - Auto entry executed successfully for account ${accountName}. Trade ID: ${tradeResult.id}`);

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
    console.error(`❌ AUTOMATION EXECUTOR - Failed to execute Auto Entry action for account ${accountName}:`, error);

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
  lnMarkets: LNMarketsAPIService,
  automationConfig: any,
  userId: string,
  accountName: string,
  tradeId?: string
) {
  try {
    console.log(`💰 AUTOMATION EXECUTOR - Executing TP/SL action for user ${userId} on account ${accountName}`);

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

    console.log(`🎯 AUTOMATION EXECUTOR - ${action} for trade ${targetTradeId} on account ${accountName}`);

    let result;

    switch (action) {
      case 'update_tp':
        if (!new_takeprofit) {
          throw new Error('New take profit price required');
        }
        console.log(`📈 AUTOMATION EXECUTOR - Updating TP to ${new_takeprofit} for trade ${targetTradeId} on account ${accountName}`);
        result = await lnMarkets.updateTakeProfit(targetTradeId, new_takeprofit);
        break;

      case 'update_sl':
        if (!new_stoploss) {
          throw new Error('New stop loss price required');
        }
        console.log(`📉 AUTOMATION EXECUTOR - Updating SL to ${new_stoploss} for trade ${targetTradeId} on account ${accountName}`);
        result = await lnMarkets.updateStopLoss(targetTradeId, new_stoploss);
        break;

      case 'close_tp':
        console.log(`🎯 AUTOMATION EXECUTOR - Closing position at take profit for trade ${targetTradeId} on account ${accountName}`);
        result = await lnMarkets.closePosition(targetTradeId);
        break;

      case 'close_sl':
        console.log(`🛑 AUTOMATION EXECUTOR - Closing position at stop loss for trade ${targetTradeId} on account ${accountName}`);
        result = await lnMarkets.closePosition(targetTradeId);
        break;

      default:
        throw new Error(`Unknown TP/SL action: ${action}`);
    }

    console.log(`✅ AUTOMATION EXECUTOR - TP/SL action executed successfully for trade ${targetTradeId} on account ${accountName}`);

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
    console.error(`❌ AUTOMATION EXECUTOR - Failed to execute TP/SL action for account ${accountName}:`, error);

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
    console.log('🤖 AUTOMATION EXECUTOR - Job received:', job.data);

    const { userId, automationId, action, tradeId } = job.data;

    try {
      console.log(`🔄 AUTOMATION EXECUTOR - Executing automation ${automationId} for user ${userId}`);

      // Get automation configuration with account data
      const automation = await getAutomationConfig(automationId);
      if (!automation) {
        throw new Error(`Automation ${automationId} not found`);
      }

      // Get account ID from automation
      const accountId = automation.user_exchange_account_id;
      if (!accountId) {
        throw new Error(`Automation ${automationId} has no associated account`);
      }

      console.log(`🔗 AUTOMATION EXECUTOR - Using account: ${automation.user_exchange_account?.account_name} (${automation.user_exchange_account?.exchange.name})`);

      // Get user credentials for the specific account
      const credentialsData = await getUserCredentials(userId, accountId);
      if (!credentialsData) {
        throw new Error(`Credentials not found for user ${userId} and account ${accountId}`);
      }

      const { credentials, account } = credentialsData;
      console.log(`✅ AUTOMATION EXECUTOR - Using credentials for account: ${account.account_name}`);

      // Create LN Markets service instance
      const lnMarkets = new LNMarketsAPIv2({
        credentials: credentials,
        logger: console as any
      });

      // Execute based on automation type
      const accountName = automation.user_exchange_account?.account_name || 'Unknown Account';
      
      switch (automation.type) {
        case 'margin_guard':
          await executeMarginGuardAction(lnMarkets, automation.config, userId, accountName, tradeId);
          return {
            status: 'completed',
            action: action,
            timestamp: new Date().toISOString(),
            automationId,
            userId,
            accountId,
            accountName,
            tradeId
          };

        case 'tp_sl':
          await executeTpSlAction(lnMarkets, automation.config, userId, accountName, tradeId);
          return {
            status: 'completed',
            action: 'tp_sl_executed',
            timestamp: new Date().toISOString(),
            automationId,
            userId,
            accountId,
            accountName,
            tradeId
          };

        case 'auto_entry':
          const entryResult = await executeAutoEntryAction(lnMarkets, automation.config, userId, accountName);
          return {
            status: entryResult.status,
            action: 'auto_entry_executed',
            timestamp: new Date().toISOString(),
            automationId,
            userId,
            accountId,
            accountName,
            tradeId: entryResult.tradeId,
            result: entryResult
          };

        default:
          console.log(`⚠️ AUTOMATION EXECUTOR - Unknown automation type: ${automation.type} for account ${accountName}`);
          return {
            status: 'error',
            error: `Unknown automation type: ${automation.type}`,
            timestamp: new Date().toISOString(),
            automationId,
            userId,
            accountId,
            accountName
          };
      }
    } catch (error) {
      console.error(`❌ AUTOMATION EXECUTOR - Automation execution failed:`, error);
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
  console.log(`✅ AUTOMATION EXECUTOR - Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ AUTOMATION EXECUTOR - Job ${job?.id} failed:`, err);
});

console.log('🚀 AUTOMATION EXECUTOR - Multi-account automation executor worker started');

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
