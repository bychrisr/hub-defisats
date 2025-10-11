/**
 * Automation Scheduler - Multi-Account System
 * 
 * Scheduler responsável por agendar execuções de automações no sistema multi-account.
 * Integra com UserExchangeAccountService para agendar automações por conta ativa
 * e gerencia timeouts e retry logic específicos por conta.
 */

import { Queue, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { UserExchangeAccountService } from '../services/userExchangeAccount.service';
import { AutomationService } from '../services/automation.service';
import { prisma } from '../lib/prisma';
import { AutomationLoggerService } from '../services/automation-logger.service';

// Create Redis connection with BullMQ compatible options
const redis = new Redis(process.env['REDIS_URL'] || 'redis://redis:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

// Create services
const userExchangeAccountService = new UserExchangeAccountService(prisma);
const automationService = new AutomationService(prisma);
const automationLogger = new AutomationLoggerService(prisma);

// Create queue for automation scheduling
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

// Store active automation schedules by user and account
const activeSchedules: Map<string, Map<string, NodeJS.Timeout>> = new Map();
const automationTimeouts: Map<string, NodeJS.Timeout> = new Map();

// Configuration for different automation types
const AUTOMATION_CONFIGS = {
  margin_guard: {
    interval: 30000, // 30 seconds
    timeout: 60000, // 1 minute
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
  },
  tp_sl: {
    interval: 15000, // 15 seconds
    timeout: 30000, // 30 seconds
    retryAttempts: 2,
    retryDelay: 3000, // 3 seconds
  },
  auto_entry: {
    interval: 10000, // 10 seconds
    timeout: 20000, // 20 seconds
    retryAttempts: 2,
    retryDelay: 2000, // 2 seconds
  },
};

// Interface for automation schedule data
interface AutomationScheduleData {
  userId: string;
  automationId: string;
  accountId: string;
  accountName: string;
  automationType: string;
  config: any;
  isActive: boolean;
  lastExecution?: Date;
  nextExecution?: Date;
  executionCount: number;
  errorCount: number;
}

// Function to get user's active account
async function getActiveAccount(userId: string): Promise<any> {
  try {
    console.log(`🔍 AUTOMATION SCHEDULER - Getting active account for user ${userId}`);
    
    const userAccounts = await userExchangeAccountService.getUserExchangeAccounts(userId);
    const activeAccount = userAccounts.find(account => account.is_active);
    
    if (!activeAccount) {
      console.warn(`❌ AUTOMATION SCHEDULER - No active account found for user ${userId}`);
      return null;
    }
    
    console.log(`✅ AUTOMATION SCHEDULER - Found active account: ${activeAccount.account_name} (${activeAccount.exchange.name})`);
    return activeAccount;
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to get active account for user ${userId}:`, error);
    return null;
  }
}

// Function to get user's automations for active account
async function getUserAutomations(userId: string, accountId: string): Promise<any[]> {
  try {
    console.log(`🔍 AUTOMATION SCHEDULER - Getting automations for user ${userId} and account ${accountId}`);
    
    const automations = await automationService.getUserAutomations({
      userId,
      activeAccountOnly: true,
      isActive: true,
    });
    
    console.log(`✅ AUTOMATION SCHEDULER - Found ${automations.length} active automations for account ${accountId}`);
    return automations;
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to get automations for user ${userId}:`, error);
    return [];
  }
}

// Function to schedule automation execution
async function scheduleAutomationExecution(
  userId: string,
  automationId: string,
  accountId: string,
  accountName: string,
  automationType: string,
  config: any
): Promise<void> {
  try {
    console.log(`📅 AUTOMATION SCHEDULER - Scheduling automation ${automationId} for user ${userId} on account ${accountName}`);
    
    const automationConfig = AUTOMATION_CONFIGS[automationType as keyof typeof AUTOMATION_CONFIGS];
    if (!automationConfig) {
      console.error(`❌ AUTOMATION SCHEDULER - Unknown automation type: ${automationType}`);
      return;
    }
    
    // Create job data
    const jobData = {
      userId,
      automationId,
      accountId,
      accountName,
      automationType,
      config,
      scheduledAt: new Date().toISOString(),
    };
    
    // Add job to queue
    const job = await automationQueue.add(
      `automation-${automationType}`,
      jobData,
      {
        priority: automationConfig.retryAttempts,
        delay: 0, // Execute immediately
        attempts: automationConfig.retryAttempts,
        backoff: {
          type: 'exponential',
          delay: automationConfig.retryDelay,
        },
      }
    );
    
    console.log(`✅ AUTOMATION SCHEDULER - Automation ${automationId} scheduled with job ID ${job.id}`);
    
    // Log the scheduling
    await automationLogger.logStateChange(
      automationId,
      'automation_scheduled',
      `Automation scheduled for account ${accountName}`,
      { accountId, accountName, automationType, jobId: job.id }
    );
    
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to schedule automation ${automationId}:`, error);
    
    // Log the error
    await automationLogger.logStateChange(
      automationId,
      'automation_schedule_error',
      `Failed to schedule automation: ${error.message}`,
      { accountId, accountName, automationType, error: error.message }
    );
  }
}

// Function to create recurring schedule for automation
function createRecurringSchedule(
  userId: string,
  automationId: string,
  accountId: string,
  accountName: string,
  automationType: string,
  config: any
): void {
  try {
    console.log(`🔄 AUTOMATION SCHEDULER - Creating recurring schedule for automation ${automationId} on account ${accountName}`);
    
    const automationConfig = AUTOMATION_CONFIGS[automationType as keyof typeof AUTOMATION_CONFIGS];
    if (!automationConfig) {
      console.error(`❌ AUTOMATION SCHEDULER - Unknown automation type: ${automationType}`);
      return;
    }
    
    // Create schedule key
    const scheduleKey = `${userId}-${accountId}-${automationId}`;
    
    // Clear existing schedule if any
    clearSchedule(userId, accountId, automationId);
    
    // Create new recurring schedule
    const interval = setInterval(async () => {
      try {
        console.log(`⏰ AUTOMATION SCHEDULER - Executing recurring automation ${automationId} on account ${accountName}`);
        
        // Check if automation is still active
        const automation = await prisma.automation.findUnique({
          where: { id: automationId },
          include: { user_exchange_account: true }
        });
        
        if (!automation || !automation.is_active) {
          console.log(`⏹️ AUTOMATION SCHEDULER - Automation ${automationId} is no longer active, stopping schedule`);
          clearSchedule(userId, accountId, automationId);
          return;
        }
        
        // Check if account is still active
        if (automation.user_exchange_account_id !== accountId) {
          console.log(`⏹️ AUTOMATION SCHEDULER - Account changed for automation ${automationId}, stopping schedule`);
          clearSchedule(userId, accountId, automationId);
          return;
        }
        
        // Schedule execution
        await scheduleAutomationExecution(
          userId,
          automationId,
          accountId,
          accountName,
          automationType,
          config
        );
        
      } catch (error) {
        console.error(`❌ AUTOMATION SCHEDULER - Error in recurring schedule for automation ${automationId}:`, error);
      }
    }, automationConfig.interval);
    
    // Store the schedule
    if (!activeSchedules.has(userId)) {
      activeSchedules.set(userId, new Map());
    }
    activeSchedules.get(userId)!.set(scheduleKey, interval);
    
    console.log(`✅ AUTOMATION SCHEDULER - Recurring schedule created for automation ${automationId} (interval: ${automationConfig.interval}ms)`);
    
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to create recurring schedule for automation ${automationId}:`, error);
  }
}

// Function to clear automation schedule
function clearSchedule(userId: string, accountId: string, automationId: string): void {
  try {
    console.log(`🧹 AUTOMATION SCHEDULER - Clearing schedule for automation ${automationId} on account ${accountId}`);
    
    const scheduleKey = `${userId}-${accountId}-${automationId}`;
    
    if (activeSchedules.has(userId)) {
      const userSchedules = activeSchedules.get(userId)!;
      if (userSchedules.has(scheduleKey)) {
        clearInterval(userSchedules.get(scheduleKey)!);
        userSchedules.delete(scheduleKey);
        console.log(`✅ AUTOMATION SCHEDULER - Schedule cleared for automation ${automationId}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to clear schedule for automation ${automationId}:`, error);
  }
}

// Function to clear all schedules for a user
function clearAllUserSchedules(userId: string): void {
  try {
    console.log(`🧹 AUTOMATION SCHEDULER - Clearing all schedules for user ${userId}`);
    
    if (activeSchedules.has(userId)) {
      const userSchedules = activeSchedules.get(userId)!;
      for (const [scheduleKey, interval] of userSchedules) {
        clearInterval(interval);
        console.log(`✅ AUTOMATION SCHEDULER - Cleared schedule: ${scheduleKey}`);
      }
      userSchedules.clear();
    }
    
    console.log(`✅ AUTOMATION SCHEDULER - All schedules cleared for user ${userId}`);
    
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to clear all schedules for user ${userId}:`, error);
  }
}

// Function to start automation scheduling for a user
export async function startUserAutomationScheduling(userId: string): Promise<void> {
  try {
    console.log(`🚀 AUTOMATION SCHEDULER - Starting automation scheduling for user ${userId}`);
    
    // Get active account
    const activeAccount = await getActiveAccount(userId);
    if (!activeAccount) {
      console.warn(`❌ AUTOMATION SCHEDULER - No active account found for user ${userId}, skipping scheduling`);
      return;
    }
    
    // Get user's automations
    const automations = await getUserAutomations(userId, activeAccount.id);
    if (automations.length === 0) {
      console.log(`ℹ️ AUTOMATION SCHEDULER - No active automations found for user ${userId}`);
      return;
    }
    
    // Clear existing schedules
    clearAllUserSchedules(userId);
    
    // Create schedules for each automation
    for (const automation of automations) {
      console.log(`📅 AUTOMATION SCHEDULER - Creating schedule for automation ${automation.id} (${automation.type})`);
      
      createRecurringSchedule(
        userId,
        automation.id,
        activeAccount.id,
        activeAccount.account_name,
        automation.type,
        automation.config
      );
    }
    
    console.log(`✅ AUTOMATION SCHEDULER - Automation scheduling started for user ${userId} with ${automations.length} automations`);
    
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to start automation scheduling for user ${userId}:`, error);
  }
}

// Function to stop automation scheduling for a user
export async function stopUserAutomationScheduling(userId: string): Promise<void> {
  try {
    console.log(`⏹️ AUTOMATION SCHEDULER - Stopping automation scheduling for user ${userId}`);
    
    clearAllUserSchedules(userId);
    
    console.log(`✅ AUTOMATION SCHEDULER - Automation scheduling stopped for user ${userId}`);
    
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to stop automation scheduling for user ${userId}:`, error);
  }
}

// Function to update automation schedule when account changes
export async function updateAutomationScheduleForAccountChange(
  userId: string,
  oldAccountId: string,
  newAccountId: string
): Promise<void> {
  try {
    console.log(`🔄 AUTOMATION SCHEDULER - Updating schedules for account change: ${oldAccountId} -> ${newAccountId}`);
    
    // Stop old schedules
    clearAllUserSchedules(userId);
    
    // Start new schedules with new account
    await startUserAutomationScheduling(userId);
    
    console.log(`✅ AUTOMATION SCHEDULER - Schedules updated for account change`);
    
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to update schedules for account change:`, error);
  }
}

// Function to get automation schedule status
export async function getAutomationScheduleStatus(userId: string): Promise<{
  isActive: boolean;
  activeSchedules: number;
  automations: any[];
}> {
  try {
    console.log(`📊 AUTOMATION SCHEDULER - Getting schedule status for user ${userId}`);
    
    const userSchedules = activeSchedules.get(userId);
    const activeSchedulesCount = userSchedules ? userSchedules.size : 0;
    
    // Get active account and automations
    const activeAccount = await getActiveAccount(userId);
    const automations = activeAccount ? await getUserAutomations(userId, activeAccount.id) : [];
    
    return {
      isActive: activeSchedulesCount > 0,
      activeSchedules: activeSchedulesCount,
      automations,
    };
    
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to get schedule status for user ${userId}:`, error);
    return {
      isActive: false,
      activeSchedules: 0,
      automations: [],
    };
  }
}

// Function to handle automation execution timeout
export function handleAutomationTimeout(
  userId: string,
  automationId: string,
  accountName: string,
  timeoutMs: number
): void {
  try {
    console.log(`⏰ AUTOMATION SCHEDULER - Setting timeout for automation ${automationId} on account ${accountName} (${timeoutMs}ms)`);
    
    const timeoutKey = `${userId}-${automationId}`;
    
    // Clear existing timeout if any
    if (automationTimeouts.has(timeoutKey)) {
      clearTimeout(automationTimeouts.get(timeoutKey)!);
    }
    
    // Set new timeout
    const timeout = setTimeout(async () => {
      console.log(`⏰ AUTOMATION SCHEDULER - Timeout reached for automation ${automationId} on account ${accountName}`);
      
      // Log timeout
      await automationLogger.logStateChange(
        automationId,
        'automation_timeout',
        `Automation execution timeout on account ${accountName}`,
        { accountName, timeoutMs }
      );
      
      // Remove from timeouts map
      automationTimeouts.delete(timeoutKey);
      
    }, timeoutMs);
    
    automationTimeouts.set(timeoutKey, timeout);
    
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to set timeout for automation ${automationId}:`, error);
  }
}

// Function to clear automation timeout
export function clearAutomationTimeout(userId: string, automationId: string): void {
  try {
    console.log(`🧹 AUTOMATION SCHEDULER - Clearing timeout for automation ${automationId}`);
    
    const timeoutKey = `${userId}-${automationId}`;
    
    if (automationTimeouts.has(timeoutKey)) {
      clearTimeout(automationTimeouts.get(timeoutKey)!);
      automationTimeouts.delete(timeoutKey);
      console.log(`✅ AUTOMATION SCHEDULER - Timeout cleared for automation ${automationId}`);
    }
    
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Failed to clear timeout for automation ${automationId}:`, error);
  }
}

// Cleanup function for expired schedules
setInterval(() => {
  try {
    console.log(`🧹 AUTOMATION SCHEDULER - Running cleanup for expired schedules`);
    
    // Clean up inactive users (users with no active schedules)
    for (const [userId, userSchedules] of activeSchedules) {
      if (userSchedules.size === 0) {
        activeSchedules.delete(userId);
        console.log(`🧹 AUTOMATION SCHEDULER - Cleaned up inactive user: ${userId}`);
      }
    }
    
  } catch (error) {
    console.error(`❌ AUTOMATION SCHEDULER - Error during cleanup:`, error);
  }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

console.log('🚀 AUTOMATION SCHEDULER - Multi-account automation scheduler started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 AUTOMATION SCHEDULER - Shutting down automation scheduler...');
  
  // Clear all schedules
  for (const [userId] of activeSchedules) {
    clearAllUserSchedules(userId);
  }
  
  await redis.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 AUTOMATION SCHEDULER - Shutting down automation scheduler...');
  
  // Clear all schedules
  for (const [userId] of activeSchedules) {
    clearAllUserSchedules(userId);
  }
  
  await redis.disconnect();
  process.exit(0);
});

export { automationQueue };
