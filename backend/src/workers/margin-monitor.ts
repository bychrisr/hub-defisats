import { Worker, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';
// Import notification queue
import { notificationQueue } from '../queues/notification.queue';
import { PrismaClient } from '@prisma/client';
import { CredentialCacheService } from '../services/credential-cache.service';
import { AutomationLoggerService } from '../services/automation-logger.service';

// Create Redis connection with BullMQ compatible options
const redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

// Create credential cache service
const credentialCache = new CredentialCacheService(redis);

// Global Prisma instance - will be set by startPeriodicMonitoring
let globalPrismaInstance: PrismaClient | null = null;

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

// Store LN Markets service instances with connection pooling
const lnMarketsServices: { [userId: string]: LNMarketsAPIv2 } = {};
const serviceCreationTimes: { [userId: string]: number } = {};
const SERVICE_TTL = 10 * 60 * 1000; // 10 minutes TTL for services

// Function to create or get LN Markets service with connection pooling
function getOrCreateLNMarketsService(userId: string, credentials: any): LNMarketsAPIv2 {
  const now = Date.now();
  const serviceCreationTime = serviceCreationTimes[userId];
  
  // Check if service exists and is not expired
  if (lnMarketsServices[userId] && serviceCreationTime && (now - serviceCreationTime) < SERVICE_TTL) {
    console.log(`♻️  MARGIN GUARD - Reusing existing LN Markets service for user ${userId}`);
    return lnMarketsServices[userId];
  }
  
  // Create new service
  console.log(`🆕 MARGIN GUARD - Creating new LN Markets service for user ${userId}`);
  const service = new LNMarketsAPIv2({
    credentials: credentials,
    logger: console as any
  });
  lnMarketsServices[userId] = service;
  serviceCreationTimes[userId] = now;
  
  return service;
}

// Function to cleanup expired services
function cleanupExpiredServices(): void {
  const now = Date.now();
  const expiredUsers = Object.keys(serviceCreationTimes).filter(
    userId => (now - serviceCreationTimes[userId]) >= SERVICE_TTL
  );
  
  expiredUsers.forEach(userId => {
    console.log(`🧹 MARGIN GUARD - Cleaning up expired service for user ${userId}`);
    delete lnMarketsServices[userId];
    delete serviceCreationTimes[userId];
  });
  
  if (expiredUsers.length > 0) {
    console.log(`🧹 MARGIN GUARD - Cleaned up ${expiredUsers.length} expired services`);
  }
}

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
  const actionStartTime = Date.now();
  
  try {
    console.log(`🎯 MARGIN GUARD - Executing action for user ${userId}, trade ${trade.id}:`, {
      action: config.action,
      trade_id: trade.id,
      market: trade.market,
      side: trade.side,
      size: trade.size
    });

    switch (config.action) {
      case 'close_position':
        console.log(`🛑 MARGIN GUARD - Closing position ${trade.id} for user ${userId}`);
        try {
          await lnMarkets.closePosition(trade.id);
          console.log(`✅ MARGIN GUARD - Successfully closed position ${trade.id} for user ${userId}`);
        } catch (error: any) {
          console.error(`❌ MARGIN GUARD - Failed to close position ${trade.id} for user ${userId}:`, {
            error: error.message,
            status: error.response?.status,
            trade_id: trade.id
          });
          throw error; // Re-throw to be caught by outer try-catch
        }

        // Queue automation execution notification
        try {
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
          console.log(`✅ MARGIN GUARD - Notification queued for position ${trade.id} close`);
        } catch (error: any) {
          console.error(`❌ MARGIN GUARD - Failed to queue notification for position ${trade.id}:`, error);
          // Don't throw here, as the main action succeeded
        }
        break;

      case 'reduce_position':
        if (config.reduce_percentage) {
          const reduceAmount = (trade.quantity * config.reduce_percentage) / 100;
          console.log(`📉 MARGIN GUARD - Reducing position ${trade.id} by ${config.reduce_percentage}% (${reduceAmount} contracts) for user ${userId}`);
          try {
            await lnMarkets.reducePosition(trade.market || 'btcusd', trade.side, reduceAmount);
            console.log(`✅ MARGIN GUARD - Successfully reduced position ${trade.id} for user ${userId}`);
          } catch (error: any) {
            console.error(`❌ MARGIN GUARD - Failed to reduce position ${trade.id} for user ${userId}:`, {
              error: error.message,
              status: error.response?.status,
              reduce_amount: reduceAmount,
              trade_id: trade.id
            });
            throw error;
          }
        } else {
          console.warn(`⚠️  MARGIN GUARD - Reduce percentage not configured for user ${userId}`);
          throw new Error('Reduce percentage not configured');
        }
        break;

      case 'add_margin':
        // Calculate amount to add based on percentage of current margin
        const currentMargin = trade.margin || 0;
        const marginIncreasePercentage = config.reduce_percentage || 20; // Use reduce_percentage as margin increase percentage
        const amountToAdd = Math.floor(currentMargin * (marginIncreasePercentage / 100));
        
        // Get trigger data for logging
        const entryPrice = trade.entry_price || 0;
        const liquidationPrice = trade.liquidation_price || 0;
        const distanceToLiquidation = Math.abs(entryPrice - liquidationPrice);
        const activationDistance = distanceToLiquidation * (1 - config.margin_threshold / 100);
        const triggerPrice = trade.side === 'b' 
          ? liquidationPrice + activationDistance
          : liquidationPrice - activationDistance;
        
        // Get current BTC price for logging
        let currentPrice = 0;
        try {
          currentPrice = await lnMarkets.getMarketPrice('btcusd');
        } catch (error) {
          console.warn('⚠️ MARGIN GUARD - Failed to get current price for logging');
        }
        
        if (amountToAdd > 0) {
          console.log(`💰 MARGIN GUARD - Adding ${amountToAdd} sats (${marginIncreasePercentage}% of ${currentMargin} sats) to position ${trade.id} for user ${userId}`);
          try {
            const addMarginResponse = await lnMarkets.addMargin(trade.id, amountToAdd);
            console.log(`✅ MARGIN GUARD - Successfully added ${amountToAdd} sats margin to position ${trade.id} for user ${userId}`);
            
            // Log execution details
            if (globalPrismaInstance) {
              try {
                const automationLogger = new AutomationLoggerService(globalPrismaInstance);
                await automationLogger.logExecution({
                  userId,
                  automationId: 'margin-guard-auto', // This should be the actual automation ID
                  automationType: 'margin_guard',
                  tradeId: trade.id,
                  action: 'add_margin',
                  status: 'success',
                  triggerData: {
                    currentPrice,
                    triggerPrice,
                    distanceToLiquidation,
                    marginThreshold: config.margin_threshold,
                    positionSide: trade.side,
                    entryPrice,
                    liquidationPrice,
                    currentMargin
                  },
                  executionResult: {
                    marginAdded: amountToAdd,
                    newMarginAmount: currentMargin + amountToAdd,
                    apiResponse: addMarginResponse
                  },
                  executionTime: Date.now() - actionStartTime
                });
              } catch (logError) {
                console.error('❌ MARGIN GUARD - Failed to log execution:', logError);
              }
            }
            
            // Queue success notification
            try {
              await marginCheckQueue.add(
                'automation-execution',
                {
                  userId,
                  automationId: 'margin-guard-auto',
                  action: 'margin_guard_add_margin',
                  tradeId: trade.id,
                  amountAdded: amountToAdd,
                  marginIncreasePercentage: marginIncreasePercentage,
                },
                {
                  priority: 10,
                  removeOnComplete: 50,
                  removeOnFail: 50,
                }
              );
              console.log(`✅ MARGIN GUARD - Notification queued for margin addition to position ${trade.id}`);
            } catch (error: any) {
              console.error(`❌ MARGIN GUARD - Failed to queue notification for margin addition to position ${trade.id}:`, error);
            }
          } catch (error: any) {
            console.error(`❌ MARGIN GUARD - Failed to add margin to position ${trade.id} for user ${userId}:`, {
              error: error.message,
              status: error.response?.status,
              margin_amount: amountToAdd,
              trade_id: trade.id,
              current_margin: currentMargin,
              increase_percentage: marginIncreasePercentage
            });
            
            // Log execution error
            if (globalPrismaInstance) {
              try {
                const automationLogger = new AutomationLoggerService(globalPrismaInstance);
                await automationLogger.logExecution({
                  userId,
                  automationId: 'margin-guard-auto',
                  automationType: 'margin_guard',
                  tradeId: trade.id,
                  action: 'add_margin',
                  status: 'error',
                  triggerData: {
                    currentPrice,
                    triggerPrice,
                    distanceToLiquidation,
                    marginThreshold: config.margin_threshold,
                    positionSide: trade.side,
                    entryPrice,
                    liquidationPrice,
                    currentMargin
                  },
                  errorMessage: error.message,
                  executionTime: Date.now() - actionStartTime
                });
              } catch (logError) {
                console.error('❌ MARGIN GUARD - Failed to log execution error:', logError);
              }
            }
            
            throw error;
          }
        } else {
          console.warn(`⚠️  MARGIN GUARD - Calculated amount to add is 0 or negative for user ${userId} (current margin: ${currentMargin}, percentage: ${marginIncreasePercentage}%)`);
          throw new Error('Calculated margin amount is invalid');
        }
        break;

      default:
        console.warn(`⚠️ Unknown Margin Guard action: ${config.action}`);
    }
  } catch (error: any) {
    const actionEndTime = Date.now();
    const actionDuration = actionEndTime - actionStartTime;
    
    console.error(`❌ MARGIN GUARD - Failed to execute action for user ${userId}, trade ${trade.id}:`, {
      error: error.message,
      stack: error.stack,
      action: config.action,
      trade_id: trade.id,
      duration_ms: actionDuration,
      status: error.response?.status
    });

    // Queue error notification with retry logic
    try {
      await marginCheckQueue.add(
        'automation-execution',
        {
          userId,
          automationId: 'margin-guard-error',
          action: 'margin_guard_error',
          tradeId: trade.id,
          error: error.message,
          action_type: config.action,
          duration_ms: actionDuration
        },
        {
          priority: 5, // Lower priority for errors
          removeOnComplete: 50,
          removeOnFail: 50,
          delay: 5000, // Delay error notification by 5 seconds
        }
      );
      console.log(`✅ MARGIN GUARD - Error notification queued for user ${userId}, trade ${trade.id}`);
    } catch (notificationError: any) {
      console.error(`❌ MARGIN GUARD - Failed to queue error notification for user ${userId}:`, notificationError);
    }
    
    // Re-throw the error to be handled by the calling function
    throw error;
  }
}

// Function to send margin alert notifications
async function sendMarginAlert(
  prismaInstance: PrismaClient,
  userId: string,
  alert: { tradeId: string; marginRatio: number; level: string; message: string }
) {
  try {
    console.log(`📱 Sending margin alert to user ${userId}: ${alert.message}`);

    // Get user notification preferences
    const notifications = await globalPrismaInstance.notification.findMany({
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
async function getMarginGuardConfig(prismaInstance: PrismaClient, userId: string): Promise<MarginGuardConfig | null> {
  try {
    const automation = await globalPrismaInstance.automation.findFirst({
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

    console.log(`🔍 MARGIN GUARD - Monitoring margin for user ${userId}`);
    const startTime = Date.now();

    // Check if Prisma instance is available with retry logic
    let attempts = 0;
    const maxAttempts = 5;
    let delay = 500; // ms

    while (!globalPrismaInstance && attempts < maxAttempts) {
      console.warn(`⚠️ Worker: globalPrismaInstance não está definido (tentativa ${attempts + 1}). Aguardando...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempts++;
    }

    if (!globalPrismaInstance) {
      console.error('❌ Worker: globalPrismaInstance não está definido após múltiplas tentativas!');
      console.error('❌ MARGIN GUARD - Prisma instance not available in worker');
      throw new Error("Prisma Client não está inicializado no worker após retry.");
    }

    try {
      // Get Margin Guard configuration from database
      const config = await getMarginGuardConfig(globalPrismaInstance, userId);
      if (!config) {
        console.log(`ℹ️  MARGIN GUARD - No configuration found for user ${userId}`);
        return { status: 'skipped', reason: 'no_config' };
      }

      console.log(`📊 MARGIN GUARD - Config loaded for user ${userId}:`, {
        enabled: config.enabled,
        margin_threshold: config.margin_threshold,
        action: config.action,
        reduce_percentage: config.reduce_percentage,
        add_margin_amount: config.add_margin_amount
      });

      if (!config.enabled) {
        console.log(`ℹ️  MARGIN GUARD - Disabled for user ${userId}`);
        return { status: 'skipped', reason: 'disabled' };
      }

      // Try to get credentials from cache first
      let credentials = await credentialCache.get(userId);
      if (!credentials) {
        console.log(`🔍 Credentials not in cache, fetching from database for user ${userId}`);
        
        // Get user credentials from database
        const user = await globalPrismaInstance.user.findUnique({
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

        // Import auth service for decryption
        const { AuthService } = await import('../services/auth.service');
        const authService = new AuthService(globalPrismaInstance, {} as any);
        
        // Decrypt credentials using AuthService with retry logic
        let decryptionRetries = 0;
        const maxDecryptionRetries = 2;
        
        while (decryptionRetries < maxDecryptionRetries) {
          try {
            const apiKey = authService.decryptData(user.ln_markets_api_key);
            const apiSecret = authService.decryptData(user.ln_markets_api_secret);
            const passphrase = authService.decryptData(user.ln_markets_passphrase);
            
            credentials = {
              apiKey,
              apiSecret,
              passphrase,
            };
            
            // Cache the credentials for future use
            await credentialCache.set(userId, credentials);
            console.log(`✅ MARGIN GUARD - Credentials cached for user ${userId}`);
            break; // Success, exit retry loop
          } catch (error: any) {
            decryptionRetries++;
            console.error(`❌ MARGIN GUARD - Decryption failed (attempt ${decryptionRetries}/${maxDecryptionRetries}) for user ${userId}:`, {
              error: error.message,
              stack: error.stack
            });
            
            if (decryptionRetries >= maxDecryptionRetries) {
              console.error(`❌ MARGIN GUARD - Max decryption retries exceeded for user ${userId}`);
              return { status: 'error', reason: 'decryption_failed' };
            }
            
            // Wait before retry
            const delay = 1000 * decryptionRetries; // 1s, 2s
            console.log(`⏳ MARGIN GUARD - Waiting ${delay}ms before decryption retry for user ${userId}`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      } else {
        console.log(`✅ Credentials found in cache for user ${userId}`);
      }

      // Get or create LN Markets service using connection pooling
      const lnMarkets = getOrCreateLNMarketsService(userId, credentials);

      // Fetch running trades with retry logic
      console.log(`🔍 MARGIN GUARD - Fetching running trades for user ${userId}`);
      let runningTrades: any[] = [];
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          runningTrades = await lnMarkets.getRunningTrades();
          break; // Success, exit retry loop
        } catch (error: any) {
          retryCount++;
          console.warn(`⚠️  MARGIN GUARD - API call failed (attempt ${retryCount}/${maxRetries}) for user ${userId}:`, {
            error: error.message,
            status: error.response?.status,
            url: error.config?.url
          });
          
          if (retryCount >= maxRetries) {
            console.error(`❌ MARGIN GUARD - Max retries exceeded for user ${userId}, returning empty array`);
            runningTrades = [];
            break;
          }
          
          // Wait before retry (exponential backoff)
          const delay = Math.pow(2, retryCount) * 1000; // 2s, 4s, 8s
          console.log(`⏳ MARGIN GUARD - Waiting ${delay}ms before retry for user ${userId}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      if (runningTrades.length === 0) {
        console.log(`ℹ️  MARGIN GUARD - User ${userId} has no running trades`);
        return { status: 'processed', tradesCount: 0, alerts: [] };
      }

      console.log(`📊 MARGIN GUARD - User ${userId} has ${runningTrades.length} running trades`);
      console.log(`📊 MARGIN GUARD - Trades details:`, runningTrades.map(trade => ({
        id: trade.id,
        market: trade.market,
        side: trade.side,
        size: trade.size,
        entry_price: trade.entry_price,
        liquidation_price: trade.liquidation_price,
        margin: trade.margin,
        pl: trade.pl
      })));

      const alerts: Array<{
        tradeId: string;
        marginRatio: number;
        level: string;
        message: string;
      }> = [];

      // Get current BTC price for distance calculation
      console.log(`🔍 MARGIN GUARD - Fetching current BTC price for user ${userId}`);
      let currentPrice: number;
      try {
        currentPrice = await lnMarkets.getMarketPrice('btcusd');
        console.log(`📊 MARGIN GUARD - Current BTC price: $${currentPrice}`);
      } catch (error: any) {
        console.error(`❌ MARGIN GUARD - Failed to get current price for user ${userId}:`, error);
        return { status: 'error', reason: 'price_fetch_failed' };
      }

      // Calculate liquidation distance for each trade
      console.log(`🔍 MARGIN GUARD - Calculating liquidation distances for user ${userId}`);
      for (const trade of runningTrades) {
        const entryPrice = trade.entry_price || 0;
        const liquidationPrice = trade.liquidation_price || 0;
        const margin = trade.margin || 0;

        console.log(`📊 MARGIN GUARD - Trade ${trade.id} data:`, {
          entry_price: entryPrice,
          liquidation_price: liquidationPrice,
          current_price: currentPrice,
          margin: margin,
          side: trade.side
        });

        if (entryPrice === 0 || liquidationPrice === 0) {
          console.warn(`⚠️  MARGIN GUARD - Trade ${trade.id} has invalid prices`);
          continue;
        }

        // Calculate total distance to liquidation
        const distanceToLiquidation = Math.abs(entryPrice - liquidationPrice);
        
        // Calculate activation distance based on user's margin_threshold
        const activationDistance = distanceToLiquidation * (1 - config.margin_threshold / 100);
        
        // Calculate trigger price based on position side
        let triggerPrice: number;
        if (trade.side === 'b') { // Long position
          triggerPrice = liquidationPrice + activationDistance;
        } else { // Short position
          triggerPrice = liquidationPrice - activationDistance;
        }

        // Check if current price has crossed the trigger threshold
        const shouldTrigger = trade.side === 'b'
          ? currentPrice <= triggerPrice
          : currentPrice >= triggerPrice;

        console.log(`📊 MARGIN GUARD - Trade ${trade.id} calculations:`, {
          distance_to_liquidation: distanceToLiquidation.toFixed(2),
          activation_distance: activationDistance.toFixed(2),
          trigger_price: triggerPrice.toFixed(2),
          current_price: currentPrice.toFixed(2),
          should_trigger: shouldTrigger,
          margin_threshold_percent: config.margin_threshold
        });

        if (shouldTrigger) {
          const message = `🚨 Margin Guard triggered: Trade ${trade.id} - Price $${currentPrice.toFixed(2)} crossed trigger $${triggerPrice.toFixed(2)}`;
          alerts.push({
            tradeId: trade.id,
            marginRatio: 0, // Not used in new logic
            level: 'critical',
            message,
          });

          console.log(`🚨 MARGIN GUARD TRIGGERED for trade ${trade.id}: Price $${currentPrice.toFixed(2)} crossed trigger $${triggerPrice.toFixed(2)}`);

          // Send notification
          await sendMarginAlert(globalPrismaInstance, userId, {
            tradeId: trade.id,
            marginRatio: 0,
            level: 'critical',
            message,
          });

          // Execute Margin Guard action
            await executeMarginGuardAction(lnMarkets, trade, config, userId);
        }
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      console.log(`✅ MARGIN GUARD - Monitoring completed for user ${userId}:`, {
        processing_time_ms: processingTime,
        trades_processed: runningTrades.length,
        alerts_generated: alerts.length,
        alerts: alerts.map(alert => ({
          trade_id: alert.tradeId,
          level: alert.level,
          margin_ratio: alert.marginRatio
        }))
      });

      return {
        status: 'processed',
        tradesCount: runningTrades.length,
        alertsCount: alerts.length,
        alerts,
        processingTimeMs: processingTime
      };
    } catch (error) {
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      console.error(`❌ MARGIN GUARD - Error monitoring margin for user ${userId}:`, {
        error: (error as Error).message,
        processing_time_ms: processingTime,
        stack: (error as Error).stack
      });
      
      return { 
        status: 'error', 
        error: (error as Error).message,
        processingTimeMs: processingTime
      };
    }
  },
  {
    connection: redis,
    concurrency: 8, // Increased concurrency for better performance
    limiter: {
      max: 20, // Increased max jobs per duration
      duration: 1000, // Per second
    },
  }
);

// Event handlers
worker.on('completed', job => {
  const result = job.returnvalue;
  console.log(`✅ MARGIN GUARD - Job ${job.id} completed for user ${job.data.userId}:`, {
    status: result?.status,
    trades_processed: result?.tradesCount,
    alerts_generated: result?.alertsCount,
    processing_time_ms: result?.processingTimeMs
  });
});

worker.on('failed', (job, err) => {
  console.error(`❌ MARGIN GUARD - Job ${job?.id} failed for user ${job?.data?.userId}:`, {
    error: err.message,
    stack: err.stack,
    job_data: job?.data
  });
});

worker.on('stalled', jobId => {
  console.warn(`⚠️  MARGIN GUARD - Job ${jobId} stalled`);
});

worker.on('progress', (job, progress) => {
  console.log(`📊 MARGIN GUARD - Job ${job.id} progress: ${progress}%`);
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
      
      // Get user credentials from database with retry logic
      let attempts = 0;
      const maxAttempts = 5;
      let delay = 500; // ms

      while (!globalPrismaInstance && attempts < maxAttempts) {
        console.warn(`⚠️ SIMULATION: globalPrismaInstance não está definido (tentativa ${attempts + 1}). Aguardando...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempts++;
      }

      if (!globalPrismaInstance) {
        console.error('❌ SIMULATION: globalPrismaInstance não está definido após múltiplas tentativas!');
        console.error('❌ SIMULATION - Prisma instance not available');
        throw new Error("Prisma Client não está inicializado no worker após retry.");
      }
      const user = await globalPrismaInstance.user.findUnique({
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
    const lnMarkets = new LNMarketsAPIv2({
      credentials: credentials,
      logger: console as any
    });

    // Get margin info and positions
    const user = await lnMarkets.user.getUser();
    const positions = await lnMarkets.futures.getRunningPositions();

    console.log(
      `📊 Simulated margin check for ${userId}: Balance ${user.balance} sats, ${positions.length} positions`
    );

    // Calculate risk based on user balance and positions
    const totalPL = positions.reduce((sum, pos) => sum + (pos.pl || 0), 0);
    const totalMargin = positions.reduce((sum, pos) => sum + (pos.margin || 0), 0);
    const risk = {
      atRisk: totalMargin > user.balance * 0.8, // 80% of balance
      message: `High margin usage: ${totalMargin} sats of ${user.balance} balance`
    };

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

export function startPeriodicMonitoring(prismaInstance: PrismaClient) {
  if (monitoringInterval) {
    console.log('📅 Periodic monitoring already running');
    return;
  }

  // Set global Prisma instance for worker use
  globalPrismaInstance = prismaInstance;
  console.log('🔍 Worker: Iniciando monitoramento periódico com a instância fornecida.');
  console.log('📅 MARGIN GUARD - Starting periodic monitoring every 20 seconds');

  monitoringInterval = setInterval(async () => {
    // Check if Prisma instance is available with retry logic
    if (!globalPrismaInstance) {
      console.warn('⚠️ Periodic monitoring: globalPrismaInstance não está definido ainda. Aguardando...');
      return;
    }

    // Cleanup expired services first
    cleanupExpiredServices();
    try {
      // Get all users with active Margin Guard configurations
      const usersWithMarginGuard = await globalPrismaInstance.automation.findMany({
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

      console.log(`🔄 MARGIN GUARD - Monitoring ${usersWithMarginGuard.length} users with Margin Guard`);

      let scheduledCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      // Batch process users for better performance
      const batchSize = 10; // Process 10 users at a time
      const batches = [];
      
      for (let i = 0; i < usersWithMarginGuard.length; i += batchSize) {
        batches.push(usersWithMarginGuard.slice(i, i + batchSize));
      }
      
      console.log(`📦 MARGIN GUARD - Processing ${usersWithMarginGuard.length} users in ${batches.length} batches of ${batchSize}`);
      
      // Process each batch in parallel
      for (const batch of batches) {
        const batchPromises = batch.map(async ({ user_id: userId }) => {
          try {
            // Check if user has Margin Guard configured and enabled
            const config = await getMarginGuardConfig(prismaInstance, userId);
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
              console.log(`✅ MARGIN GUARD - Scheduled monitoring for user ${userId} (threshold: ${config.margin_threshold}%)`);
              return { status: 'scheduled', userId };
            } else {
              console.log(`⏭️  MARGIN GUARD - Skipping user ${userId} - no active Margin Guard`);
              return { status: 'skipped', userId };
            }
          } catch (error) {
            console.error(`❌ MARGIN GUARD - Failed to check config for user ${userId}:`, error);
            return { status: 'error', userId, error: error.message };
          }
        });
        
        // Wait for batch to complete
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Count results
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            if (result.value.status === 'scheduled') scheduledCount++;
            else if (result.value.status === 'skipped') skippedCount++;
            else if (result.value.status === 'error') errorCount++;
          } else {
            errorCount++;
          }
        });
        
        // Small delay between batches to prevent overwhelming the system
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`📊 MARGIN GUARD - Scheduling summary:`, {
        total_users: usersWithMarginGuard.length,
        scheduled: scheduledCount,
        skipped: skippedCount,
        errors: errorCount
      });
    } catch (error) {
      console.error('❌ Error in periodic monitoring:', error);
    }
  }, 20000); // Every 20 seconds (optimized for better responsiveness)
}

export function stopPeriodicMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log('🛑 Stopped periodic margin monitoring');
  }
}

console.log('🚀 Margin monitor worker started');

// Note: startPeriodicMonitoring requires a PrismaClient instance
// It should be called from the main application with: startPeriodicMonitoring(prismaInstance)
// startPeriodicMonitoring(); // Commented out - requires prismaInstance parameter

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
