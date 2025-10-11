/**
 * Automation Worker - Multi-Account System
 * 
 * Worker responsável por executar automações de trading no sistema multi-account.
 * Integra com UserExchangeAccountService para buscar credenciais da conta ativa
 * e executar automações com as credenciais corretas.
 */

import { Worker, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';
import { LNMarketsWebSocketService, LNMarketsWebSocketCredentials } from '../services/lnmarkets-websocket.service';
import { WebSocketManagerService } from '../services/websocket-manager.service';
import { UserExchangeAccountService } from '../services/userExchangeAccount.service';
import { CredentialCacheService } from '../services/credential-cache.service';
import { AutomationLoggerService } from '../services/automation-logger.service';
import { prisma } from '../lib/prisma';

// Create Redis connection with BullMQ compatible options
const redis = new Redis(process.env['REDIS_URL'] || 'redis://redis:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

// Create credential cache service
const credentialCache = new CredentialCacheService(redis);

// Create UserExchangeAccountService instance
const userExchangeAccountService = new UserExchangeAccountService(prisma);

// Create automation logger service
const automationLogger = new AutomationLoggerService(prisma);

// Create WebSocket manager for real-time data
const webSocketManager = new WebSocketManagerService();

// Create queue for automation jobs
const automationQueue = new Queue('automation-execute', {
  connection: redis,
  defaultJobOptions: {
    priority: 8, // High priority for automation execution
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Function to create or get LN Markets WebSocket connection
async function getOrCreateLNMarketsWebSocket(userId: string, credentials: any): Promise<LNMarketsWebSocketService> {
  try {
    console.log(`🔌 AUTOMATION WORKER - Getting WebSocket connection for user ${userId}`);
    
    // Convert credentials to WebSocket format
    const wsCredentials: LNMarketsWebSocketCredentials = {
      apiKey: credentials.apiKey,
      apiSecret: credentials.apiSecret,
      passphrase: credentials.passphrase,
      isTestnet: credentials.isTestnet || false
    };
    
    // Get or create WebSocket connection via manager
    const wsService = await webSocketManager.createConnection(userId, wsCredentials);
    
    console.log(`✅ AUTOMATION WORKER - WebSocket connection established for user ${userId}`);
    return wsService;
    
  } catch (error) {
    console.error(`❌ AUTOMATION WORKER - Failed to create WebSocket connection for user ${userId}:`, error);
    
    // Fallback to HTTP service
    console.log(`🔄 AUTOMATION WORKER - Falling back to HTTP service for user ${userId}`);
    const httpService = new LNMarketsAPIv2({
      credentials: credentials,
      logger: console as any
    });
    return httpService as any; // Type assertion for compatibility
  }
}

// Function to get user's active exchange account credentials
async function getUserCredentials(userId: string, accountId?: string): Promise<{ credentials: any; account: any } | null> {
  try {
    console.log(`🔍 AUTOMATION WORKER - Getting credentials for user ${userId}${accountId ? ` and account ${accountId}` : ''}`);
    
    let activeAccount;
    
    if (accountId) {
      // Get specific account
      activeAccount = await userExchangeAccountService.getUserExchangeAccount(accountId, userId);
      if (!activeAccount) {
        console.warn(`❌ AUTOMATION WORKER - Account ${accountId} not found for user ${userId}`);
        return null;
      }
    } else {
      // Get all user accounts and find the active one
      const userAccounts = await userExchangeAccountService.getUserExchangeAccounts(userId);
      activeAccount = userAccounts.find(account => account.is_active);
      if (!activeAccount) {
        console.warn(`❌ AUTOMATION WORKER - No active account found for user ${userId}`);
        return null;
      }
    }

    console.log(`✅ AUTOMATION WORKER - Found account: ${activeAccount.account_name} (${activeAccount.exchange.name})`);

    // Check if account has credentials
    if (!activeAccount.credentials || Object.keys(activeAccount.credentials).length === 0) {
      console.warn(`❌ AUTOMATION WORKER - Account ${activeAccount.account_name} has no credentials`);
      return null;
    }

    // Validate credentials are not empty
    const hasValidCredentials = Object.values(activeAccount.credentials).some(value =>
      value && typeof value === 'string' && value.trim() !== ''
    );

    if (!hasValidCredentials) {
      console.warn(`❌ AUTOMATION WORKER - Account ${activeAccount.account_name} has empty credentials`);
      return null;
    }

    // Try to get from cache first (using account-specific key)
    const cacheKey = `${userId}-${activeAccount.id}`;
    let credentials = await credentialCache.get(cacheKey);
    
    if (credentials) {
      console.log(`✅ AUTOMATION WORKER - Credentials found in cache for account ${activeAccount.account_name}`);
      return { credentials, account: activeAccount };
    }

    console.log(`🔍 AUTOMATION WORKER - Credentials not in cache, using account credentials for ${activeAccount.account_name}`);
    
    // Use credentials from the account (already decrypted by UserExchangeAccountService)
    credentials = activeAccount.credentials;
    
    // Cache the credentials for future use
    await credentialCache.set(cacheKey, credentials);
    console.log(`✅ AUTOMATION WORKER - Credentials cached for account ${activeAccount.account_name}`);
    
    return { credentials, account: activeAccount };
  } catch (error) {
    console.error(`❌ AUTOMATION WORKER - Failed to get credentials for user ${userId}:`, error);
    return null;
  }
}

// Function to get automation configuration with account data
async function getAutomationConfig(automationId: string) {
  try {
    console.log(`🔍 AUTOMATION WORKER - Getting automation config for ${automationId}`);
    
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
      console.warn(`❌ AUTOMATION WORKER - Automation ${automationId} not found`);
      return null;
    }

    console.log(`✅ AUTOMATION WORKER - Found automation: ${automation.type} for account ${automation.user_exchange_account?.account_name}`);
    
    return automation;
  } catch (error) {
    console.error(`❌ AUTOMATION WORKER - Failed to get automation config for ${automationId}:`, error);
    return null;
  }
}

// Function to execute Margin Guard automation
async function executeMarginGuard(
  lnMarkets: LNMarketsAPIService,
  automation: any,
  userId: string,
  accountName: string
) {
  try {
    console.log(`🎯 AUTOMATION WORKER - Executing Margin Guard for user ${userId} on account ${accountName}`);
    
    const { action, margin_threshold, reduce_percentage, add_margin_amount } = automation.config;
    
    // Get current positions
    const positions = await lnMarkets.getRunningTrades();
    console.log(`📊 AUTOMATION WORKER - Found ${positions.length} positions for account ${accountName}`);
    
    for (const position of positions) {
      const marginRatio = position.margin_ratio || 0;
      console.log(`📊 AUTOMATION WORKER - Position ${position.id} margin ratio: ${marginRatio} for account ${accountName}`);
      
      if (marginRatio >= margin_threshold) {
        console.log(`⚠️ AUTOMATION WORKER - Margin threshold reached for position ${position.id} on account ${accountName}`);
        
        switch (action) {
          case 'close_position':
            console.log(`🛑 AUTOMATION WORKER - Closing position ${position.id} for account ${accountName}`);
            await lnMarkets.closePosition(position.id);
            break;
            
          case 'reduce_position':
            const reduceAmount = (position.quantity * reduce_percentage) / 100;
            console.log(`📉 AUTOMATION WORKER - Reducing position ${position.id} by ${reduce_percentage}% for account ${accountName}`);
            await lnMarkets.reducePosition(position.id, reduceAmount);
            break;
            
          case 'add_margin':
            console.log(`💰 AUTOMATION WORKER - Adding ${add_margin_amount} sats margin to position ${position.id} for account ${accountName}`);
            await lnMarkets.addMargin(position.id, add_margin_amount);
            break;
        }
        
        // Log the action
        await automationLogger.logStateChange(
          automation.id,
          'margin_guard_executed',
          `Margin Guard executed: ${action} for position ${position.id}`,
          { positionId: position.id, marginRatio, action }
        );
      }
    }
    
    console.log(`✅ AUTOMATION WORKER - Margin Guard execution completed for account ${accountName}`);
    
  } catch (error) {
    console.error(`❌ AUTOMATION WORKER - Failed to execute Margin Guard for account ${accountName}:`, error);
    throw error;
  }
}

// Function to execute Take Profit / Stop Loss automation
async function executeTpSl(
  lnMarkets: LNMarketsAPIService,
  automation: any,
  userId: string,
  accountName: string
) {
  try {
    console.log(`💰 AUTOMATION WORKER - Executing TP/SL for user ${userId} on account ${accountName}`);
    
    const { action, new_takeprofit, new_stoploss, trigger_pnl_percentage } = automation.config;
    
    // Get current positions
    const positions = await lnMarkets.getRunningTrades();
    console.log(`📊 AUTOMATION WORKER - Found ${positions.length} positions for TP/SL on account ${accountName}`);
    
    for (const position of positions) {
      const pnl = position.pnl || 0;
      const pnlPercentage = (pnl / position.quantity) * 100;
      
      console.log(`📊 AUTOMATION WORKER - Position ${position.id} PnL: ${pnl} (${pnlPercentage}%) for account ${accountName}`);
      
      // Check if trigger condition is met
      if (trigger_pnl_percentage && Math.abs(pnlPercentage) >= trigger_pnl_percentage) {
        console.log(`🎯 AUTOMATION WORKER - TP/SL trigger condition met for position ${position.id} on account ${accountName}`);
        
        switch (action) {
          case 'update_tp':
            if (new_takeprofit) {
              console.log(`📈 AUTOMATION WORKER - Updating TP to ${new_takeprofit} for position ${position.id} on account ${accountName}`);
              await lnMarkets.updateTakeProfit(position.id, new_takeprofit);
            }
            break;
            
          case 'update_sl':
            if (new_stoploss) {
              console.log(`📉 AUTOMATION WORKER - Updating SL to ${new_stoploss} for position ${position.id} on account ${accountName}`);
              await lnMarkets.updateStopLoss(position.id, new_stoploss);
            }
            break;
            
          case 'close_tp':
            console.log(`🎯 AUTOMATION WORKER - Closing position at TP for ${position.id} on account ${accountName}`);
            await lnMarkets.closePosition(position.id);
            break;
            
          case 'close_sl':
            console.log(`🛑 AUTOMATION WORKER - Closing position at SL for ${position.id} on account ${accountName}`);
            await lnMarkets.closePosition(position.id);
            break;
        }
        
        // Log the action
        await automationLogger.logStateChange(
          automation.id,
          'tp_sl_executed',
          `TP/SL executed: ${action} for position ${position.id}`,
          { positionId: position.id, pnl, pnlPercentage, action }
        );
      }
    }
    
    console.log(`✅ AUTOMATION WORKER - TP/SL execution completed for account ${accountName}`);
    
  } catch (error) {
    console.error(`❌ AUTOMATION WORKER - Failed to execute TP/SL for account ${accountName}:`, error);
    throw error;
  }
}

// Function to execute Auto Entry automation
async function executeAutoEntry(
  lnMarkets: LNMarketsAPIService,
  automation: any,
  userId: string,
  accountName: string
) {
  try {
    console.log(`🎯 AUTOMATION WORKER - Executing Auto Entry for user ${userId} on account ${accountName}`);
    
    const {
      market = 'btcusd',
      side,
      leverage = 10,
      quantity,
      stoploss,
      takeprofit,
      trigger_price,
      trigger_type = 'market'
    } = automation.config;
    
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
        console.log(`⏳ AUTOMATION WORKER - Auto entry not triggered for account ${accountName}. Current price: ${currentPrice}, Trigger: ${trigger_price}`);
        return {
          status: 'pending',
          reason: 'price_not_triggered',
          currentPrice,
          triggerPrice: trigger_price,
        };
      }
    }
    
    console.log(`📈 AUTOMATION WORKER - Creating ${side === 'b' ? 'LONG' : 'SHORT'} position: ${quantity} contracts at ${leverage}x leverage for account ${accountName}`);
    
    // Create the trade
    const tradeResult = await lnMarkets.createTrade({
      side,
      leverage,
      quantity,
      stoploss,
      takeprofit,
    });
    
    console.log(`✅ AUTOMATION WORKER - Auto entry executed successfully for account ${accountName}. Trade ID: ${tradeResult.id}`);
    
    // Log the action
    await automationLogger.logStateChange(
      automation.id,
      'auto_entry_executed',
      `Auto Entry executed: ${side} ${quantity} contracts`,
      { tradeId: tradeResult.id, side, quantity, leverage, market }
    );
    
    return {
      status: 'completed',
      tradeId: tradeResult.id,
      side,
      quantity,
      leverage,
      market,
    };
    
  } catch (error) {
    console.error(`❌ AUTOMATION WORKER - Failed to execute Auto Entry for account ${accountName}:`, error);
    throw error;
  }
}

// Create worker for automation execution
const worker = new Worker(
  'automation-execute',
  async job => {
    console.log('🤖 AUTOMATION WORKER - Job received:', job.data);
    
    const { userId, automationId, action, tradeId } = job.data;
    
    try {
      console.log(`🔄 AUTOMATION WORKER - Executing automation ${automationId} for user ${userId}`);
      
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
      
      console.log(`🔗 AUTOMATION WORKER - Using account: ${automation.user_exchange_account?.account_name} (${automation.user_exchange_account?.exchange.name})`);
      
      // Get user credentials for the specific account
      const credentialsData = await getUserCredentials(userId, accountId);
      if (!credentialsData) {
        throw new Error(`Credentials not found for user ${userId} and account ${accountId}`);
      }
      
      const { credentials, account } = credentialsData;
      console.log(`✅ AUTOMATION WORKER - Using credentials for account: ${account.account_name}`);
      
      // Create LN Markets WebSocket connection
      const lnMarkets = await getOrCreateLNMarketsWebSocket(userId, credentials);
      
      // Execute based on automation type
      const accountName = automation.user_exchange_account?.account_name || 'Unknown Account';
      
      switch (automation.type) {
        case 'margin_guard':
          await executeMarginGuard(lnMarkets, automation, userId, accountName);
          return {
            status: 'completed',
            action: 'margin_guard_executed',
            timestamp: new Date().toISOString(),
            automationId,
            userId,
            accountId,
            accountName
          };
          
        case 'tp_sl':
          await executeTpSl(lnMarkets, automation, userId, accountName);
          return {
            status: 'completed',
            action: 'tp_sl_executed',
            timestamp: new Date().toISOString(),
            automationId,
            userId,
            accountId,
            accountName
          };
          
        case 'auto_entry':
          const entryResult = await executeAutoEntry(lnMarkets, automation, userId, accountName);
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
          console.log(`⚠️ AUTOMATION WORKER - Unknown automation type: ${automation.type} for account ${accountName}`);
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
      console.error(`❌ AUTOMATION WORKER - Automation execution failed:`, error);
      return {
        status: 'error',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
        automationId,
        userId
      };
    }
  },
  { 
    connection: redis,
    concurrency: 5, // Process up to 5 automations concurrently
  }
);

// Worker event handlers
worker.on('completed', job => {
  console.log(`✅ AUTOMATION WORKER - Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ AUTOMATION WORKER - Job ${job?.id} failed:`, err);
});

worker.on('stalled', jobId => {
  console.warn(`⚠️ AUTOMATION WORKER - Job ${jobId} stalled`);
});

// WebSocket manager handles cleanup automatically
// No need for manual cleanup as WebSocketManagerService handles it

console.log('🚀 AUTOMATION WORKER - Multi-account automation worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 AUTOMATION WORKER - Shutting down automation worker...');
  await worker.close();
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 AUTOMATION WORKER - Shutting down automation worker...');
  await worker.close();
  await redis.disconnect();
  process.exit(0);
});

export { automationQueue };
