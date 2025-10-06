import { PrismaClient } from '@prisma/client';
import { MarginGuardExecutorService } from './margin-guard-executor.service';
import { MarginGuardNotificationService } from './margin-guard-notification.service';
import { MarginGuardPlanService } from './margin-guard-plan.service';
import { AutomationService } from './automation.service';
import { UserExchangeAccountService } from './userExchangeAccount.service';
import { AutomationLoggerService } from './automation-logger.service';
import { Queue } from 'bullmq';

export interface MarginGuardIntegrationConfig {
  redisConnection: any;
  enableWorkers: boolean;
  enableScheduler: boolean;
  enableNotifications: boolean;
}

export class MarginGuardIntegrationService {
  private prisma: PrismaClient;
  private marginGuardExecutor: MarginGuardExecutorService;
  private marginGuardNotification: MarginGuardNotificationService;
  private marginGuardPlanService: MarginGuardPlanService;
  private automationService: AutomationService;
  private userExchangeAccountService: UserExchangeAccountService;
  private automationLogger: AutomationLoggerService;
  
  private marginGuardQueue: Queue;
  private schedulerQueue: Queue;
  private isInitialized: boolean = false;

  constructor(config: MarginGuardIntegrationConfig) {
    this.prisma = new PrismaClient();
    this.marginGuardExecutor = new MarginGuardExecutorService(this.prisma);
    this.marginGuardNotification = new MarginGuardNotificationService(this.prisma);
    this.marginGuardPlanService = new MarginGuardPlanService(this.prisma);
    this.automationService = new AutomationService(this.prisma);
    this.userExchangeAccountService = new UserExchangeAccountService(this.prisma);
    this.automationLogger = new AutomationLoggerService(this.prisma);

    // Initialize queues
    this.marginGuardQueue = new Queue('margin-guard-queue', {
      connection: config.redisConnection
    });
    
    this.schedulerQueue = new Queue('margin-guard-scheduler-queue', {
      connection: config.redisConnection
    });
  }

  /**
   * Initialize the Margin Guard system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚠️ MARGIN GUARD INTEGRATION - Already initialized');
      return;
    }

    console.log('🚀 MARGIN GUARD INTEGRATION - Initializing system...');

    try {
      // Test database connection
      await this.prisma.$connect();
      console.log('✅ MARGIN GUARD INTEGRATION - Database connected');

      // Test Redis connection
      await this.marginGuardQueue.isPaused();
      console.log('✅ MARGIN GUARD INTEGRATION - Redis connected');

      // Initialize plan configurations
      await this.initializePlanConfigurations();
      console.log('✅ MARGIN GUARD INTEGRATION - Plan configurations initialized');

      // Start workers if enabled
      if (this.enableWorkers) {
        await this.startWorkers();
        console.log('✅ MARGIN GUARD INTEGRATION - Workers started');
      }

      // Start scheduler if enabled
      if (this.enableScheduler) {
        await this.startScheduler();
        console.log('✅ MARGIN GUARD INTEGRATION - Scheduler started');
      }

      this.isInitialized = true;
      console.log('🎉 MARGIN GUARD INTEGRATION - System fully initialized');

    } catch (error) {
      console.error('❌ MARGIN GUARD INTEGRATION - Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize plan configurations
   */
  private async initializePlanConfigurations(): Promise<void> {
    const planTypes = ['free', 'basic', 'advanced', 'pro', 'lifetime'];
    
    for (const planType of planTypes) {
      const features = this.marginGuardPlanService.getPlanFeatures(planType as any);
      const limitations = this.marginGuardPlanService.getPlanLimitations(planType as any);
      const defaultConfig = this.marginGuardPlanService.createDefaultConfig(planType as any);

      console.log(`🔧 MARGIN GUARD INTEGRATION - Initialized ${planType} plan:`, {
        features: Object.keys(features).length,
        limitations: Object.keys(limitations).length,
        defaultConfig: Object.keys(defaultConfig).length
      });
    }
  }

  /**
   * Start Margin Guard workers
   */
  private async startWorkers(): Promise<void> {
    // Import workers dynamically to avoid circular dependencies
    const { MarginGuardWorker } = await import('../workers/margin-guard.worker');
    const { MarginGuardSchedulerWorker } = await import('../workers/margin-guard-scheduler.worker');

    // Start Margin Guard executor worker
    const executorWorker = new MarginGuardWorker(this.marginGuardQueue.opts.connection);
    await executorWorker.start();

    // Start Margin Guard scheduler worker
    const schedulerWorker = new MarginGuardSchedulerWorker(this.schedulerQueue.opts.connection);
    await schedulerWorker.start();

    console.log('🛡️ MARGIN GUARD INTEGRATION - Workers started successfully');
  }

  /**
   * Start Margin Guard scheduler
   */
  private async startScheduler(): Promise<void> {
    // Schedule periodic checks for all active Margin Guard automations
    await this.scheduleAllActiveAutomations();
    
    console.log('⏰ MARGIN GUARD INTEGRATION - Scheduler started successfully');
  }

  /**
   * Schedule all active Margin Guard automations
   */
  private async scheduleAllActiveAutomations(): Promise<void> {
    try {
      const activeAutomations = await this.prisma.automation.findMany({
        where: {
          type: 'margin_guard',
          is_active: true
        },
        include: {
          user_exchange_account: {
            include: {
              exchange: true
            }
          }
        }
      });

      console.log(`🔍 MARGIN GUARD INTEGRATION - Found ${activeAutomations.length} active automations`);

      for (const automation of activeAutomations) {
        await this.scheduleAutomation(automation);
      }

    } catch (error) {
      console.error('❌ MARGIN GUARD INTEGRATION - Failed to schedule automations:', error);
    }
  }

  /**
   * Schedule a specific automation
   */
  async scheduleAutomation(automation: any): Promise<void> {
    try {
      const scheduleInterval = this.getScheduleInterval(automation.config);
      
      await this.schedulerQueue.add(
        'schedule-margin-guard',
        {
          userId: automation.user_id,
          automationId: automation.id,
          userExchangeAccountId: automation.user_exchange_account_id,
          config: automation.config,
          planType: automation.config.plan_type || 'basic',
          scheduleInterval
        },
        {
          repeat: { every: scheduleInterval * 60 * 1000 }, // Convert to milliseconds
          priority: this.getJobPriority(automation.config.plan_type || 'basic')
        }
      );

      console.log(`⏰ MARGIN GUARD INTEGRATION - Scheduled automation ${automation.id}:`, {
        interval: scheduleInterval,
        planType: automation.config.plan_type
      });

    } catch (error) {
      console.error(`❌ MARGIN GUARD INTEGRATION - Failed to schedule automation ${automation.id}:`, error);
    }
  }

  /**
   * Get schedule interval based on plan type
   */
  private getScheduleInterval(config: any): number {
    // Different plans have different monitoring frequencies
    switch (config.plan_type) {
      case 'free': return 15; // 15 minutes
      case 'basic': return 10; // 10 minutes
      case 'advanced': return 5; // 5 minutes
      case 'pro': return 2; // 2 minutes
      case 'lifetime': return 1; // 1 minute
      default: return 10; // Default 10 minutes
    }
  }

  /**
   * Get job priority based on plan type
   */
  private getJobPriority(planType: string): number {
    switch (planType) {
      case 'lifetime': return 1; // Highest priority
      case 'pro': return 2;
      case 'advanced': return 3;
      case 'basic': return 4;
      case 'free': return 5; // Lowest priority
      default: return 5;
    }
  }

  /**
   * Execute Margin Guard for a specific user
   */
  async executeMarginGuardForUser(userId: string): Promise<any> {
    try {
      console.log(`🛡️ MARGIN GUARD INTEGRATION - Executing for user ${userId}`);

      // Get user's active Margin Guard automations
      const automations = await this.prisma.automation.findMany({
        where: {
          user_id: userId,
          type: 'margin_guard',
          is_active: true
        },
        include: {
          user_exchange_account: {
            include: {
              exchange: true
            }
          }
        }
      });

      if (automations.length === 0) {
        console.log(`⏭️ MARGIN GUARD INTEGRATION - No active automations for user ${userId}`);
        return { success: true, message: 'No active automations' };
      }

      const results = [];

      for (const automation of automations) {
        // Get current positions for this user's exchange account
        const positions = await this.getCurrentPositions(userId, automation.user_exchange_account_id);
        
        if (positions.length === 0) {
          console.log(`⏭️ MARGIN GUARD INTEGRATION - No positions for automation ${automation.id}`);
          continue;
        }

        // Get current market prices
        const currentPrices = await this.getCurrentMarketPrices();

        // Execute Margin Guard
        const executionData = {
          userId,
          automationId: automation.id,
          userExchangeAccountId: automation.user_exchange_account_id,
          config: automation.config,
          planType: automation.config.plan_type || 'basic',
          positions,
          currentPrices
        };

        const result = await this.marginGuardExecutor.executeMarginGuard(executionData);
        results.push(result);

        // Send notifications if enabled
        if (this.enableNotifications && result.success && result.actions.length > 0) {
          const notificationData = {
            userId,
            automationId: automation.id,
            planType: automation.config.plan_type || 'basic',
            actions: result.actions,
            positions,
            executionTime: new Date()
          };

          await this.marginGuardNotification.sendNotifications(notificationData);
        }
      }

      console.log(`✅ MARGIN GUARD INTEGRATION - Execution completed for user ${userId}:`, {
        automations: automations.length,
        results: results.length
      });

      return { success: true, results };

    } catch (error) {
      console.error(`❌ MARGIN GUARD INTEGRATION - Execution failed for user ${userId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current positions for a user's exchange account
   */
  private async getCurrentPositions(userId: string, userExchangeAccountId: string): Promise<any[]> {
    try {
      // TODO: Implement actual LN Markets API call
      // For now, return mock data
      const mockPositions = [
        {
          id: 'pos_1',
          symbol: 'BTCUSD',
          side: 'long',
          size: 1000,
          margin: 100,
          liquidation_price: 40000,
          current_price: 45000,
          pnl: 500
        },
        {
          id: 'pos_2',
          symbol: 'BTCUSD',
          side: 'short',
          size: 500,
          margin: 50,
          liquidation_price: 50000,
          current_price: 45000,
          pnl: 250
        }
      ];

      return mockPositions;

    } catch (error) {
      console.error('❌ MARGIN GUARD INTEGRATION - Failed to get positions:', error);
      return [];
    }
  }

  /**
   * Get current market prices
   */
  private async getCurrentMarketPrices(): Promise<Record<string, number>> {
    try {
      // TODO: Implement actual market data API call
      // For now, return mock prices
      return {
        'BTCUSD': 45000,
        'ETHUSD': 3000,
        'LTCUSD': 150
      };

    } catch (error) {
      console.error('❌ MARGIN GUARD INTEGRATION - Failed to get market prices:', error);
      return {};
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<any> {
    try {
      const activeAutomations = await this.prisma.automation.count({
        where: { type: 'margin_guard', is_active: true }
      });

      const totalUsers = await this.prisma.user.count();
      
      const queueStats = {
        marginGuardQueue: await this.marginGuardQueue.getWaiting(),
        schedulerQueue: await this.schedulerQueue.getWaiting()
      };

      return {
        isInitialized: this.isInitialized,
        activeAutomations,
        totalUsers,
        queueStats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ MARGIN GUARD INTEGRATION - Failed to get system status:', error);
      return { error: error.message };
    }
  }

  /**
   * Shutdown the system
   */
  async shutdown(): Promise<void> {
    console.log('🛑 MARGIN GUARD INTEGRATION - Shutting down system...');

    try {
      // Close queues
      await this.marginGuardQueue.close();
      await this.schedulerQueue.close();

      // Close database connection
      await this.prisma.$disconnect();

      this.isInitialized = false;
      console.log('✅ MARGIN GUARD INTEGRATION - System shutdown complete');

    } catch (error) {
      console.error('❌ MARGIN GUARD INTEGRATION - Shutdown failed:', error);
    }
  }
}
