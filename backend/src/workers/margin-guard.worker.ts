import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { MarginGuardExecutorService } from '../services/margin-guard-executor.service';
import { UserExchangeAccountService } from '../services/userExchangeAccount.service';
import { AutomationLoggerService } from '../services/automation-logger.service';

export interface MarginGuardJobData {
  automationId: string;
  userId: string;
  userExchangeAccountId: string;
  config: any;
  planType: string;
  positions: any[];
  currentPrices: Record<string, number>;
}

export class MarginGuardWorker {
  private worker: Worker;
  private prisma: PrismaClient;
  private marginGuardExecutor: MarginGuardExecutorService;
  private userExchangeAccountService: UserExchangeAccountService;
  private automationLogger: AutomationLoggerService;

  constructor(redisConnection: any) {
    this.prisma = new PrismaClient();
    this.marginGuardExecutor = new MarginGuardExecutorService(this.prisma);
    this.userExchangeAccountService = new UserExchangeAccountService(this.prisma);
    this.automationLogger = new AutomationLoggerService(this.prisma);

    this.worker = new Worker(
      'margin-guard-queue',
      this.processJob.bind(this),
      {
        connection: redisConnection,
        concurrency: 5, // Process up to 5 jobs concurrently
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
      }
    );

    this.setupEventHandlers();
  }

  /**
   * Process Margin Guard job
   */
  private async processJob(job: Job<MarginGuardJobData>): Promise<any> {
    const { automationId, userId, userExchangeAccountId, config, planType, positions, currentPrices } = job.data;

    console.log('🛡️ MARGIN GUARD WORKER - Processing job:', {
      jobId: job.id,
      automationId,
      userId,
      planType,
      positionsCount: positions.length
    });

    try {
      // Validate automation is still active
      const automation = await this.prisma.automation.findUnique({
        where: { id: automationId },
        include: {
          user_exchange_account: {
            include: {
              exchange: true
            }
          }
        }
      });

      if (!automation || !automation.is_active) {
        console.log('⏭️ MARGIN GUARD WORKER - Automation not active, skipping');
        return { success: false, reason: 'Automation not active' };
      }

      // Get current positions from LN Markets API
      const currentPositions = await this.getCurrentPositions(userId, userExchangeAccountId);
      
      if (currentPositions.length === 0) {
        console.log('⏭️ MARGIN GUARD WORKER - No positions found, skipping');
        return { success: false, reason: 'No positions found' };
      }

      // Execute Margin Guard
      const executionData = {
        userId,
        automationId,
        userExchangeAccountId,
        config,
        planType,
        positions: currentPositions,
        currentPrices
      };

      const result = await this.marginGuardExecutor.executeMarginGuard(executionData);

      console.log('✅ MARGIN GUARD WORKER - Job completed:', {
        jobId: job.id,
        success: result.success,
        actions: result.actions.length,
        notifications: result.notifications.length,
        errors: result.errors.length
      });

      return result;

    } catch (error) {
      console.error('❌ MARGIN GUARD WORKER - Job failed:', {
        jobId: job.id,
        error: error.message,
        stack: error.stack
      });

      // Log error
      await this.automationLogger.logExecution(
        automationId,
        'margin_guard_worker_error',
        'error',
        `Margin Guard worker failed: ${error.message}`,
        { error: error.message, stack: error.stack }
      );

      throw error;
    }
  }

  /**
   * Get current positions from LN Markets API
   */
  private async getCurrentPositions(userId: string, userExchangeAccountId: string): Promise<any[]> {
    try {
      // Get user exchange account
      const account = await this.userExchangeAccountService.getUserExchangeAccount(userExchangeAccountId);
      
      if (!account) {
        throw new Error('User exchange account not found');
      }

      // TODO: Implement actual LN Markets API call to get positions
      // For now, return mock data for testing
      const mockPositions = [
        {
          id: 'pos_1',
          symbol: 'BTCUSD',
          side: 'long',
          size: 1000,
          margin: 100,
          liquidation_price: 40000,
          current_price: 45000,
          pnl: 500,
          created_at: new Date()
        },
        {
          id: 'pos_2',
          symbol: 'BTCUSD',
          side: 'short',
          size: 500,
          margin: 50,
          liquidation_price: 50000,
          current_price: 45000,
          pnl: 250,
          created_at: new Date()
        }
      ];

      console.log('🔍 MARGIN GUARD WORKER - Retrieved positions:', mockPositions.length);
      return mockPositions;

    } catch (error) {
      console.error('❌ MARGIN GUARD WORKER - Failed to get positions:', error);
      return [];
    }
  }

  /**
   * Setup event handlers for the worker
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job, result) => {
      console.log('✅ MARGIN GUARD WORKER - Job completed:', {
        jobId: job.id,
        success: result.success,
        actions: result.actions?.length || 0
      });
    });

    this.worker.on('failed', (job, err) => {
      console.error('❌ MARGIN GUARD WORKER - Job failed:', {
        jobId: job.id,
        error: err.message,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts
      });
    });

    this.worker.on('stalled', (jobId) => {
      console.warn('⚠️ MARGIN GUARD WORKER - Job stalled:', jobId);
    });

    this.worker.on('error', (err) => {
      console.error('❌ MARGIN GUARD WORKER - Worker error:', err);
    });
  }

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    console.log('🚀 MARGIN GUARD WORKER - Starting worker...');
    // Worker is automatically started when created
  }

  /**
   * Stop the worker
   */
  async stop(): Promise<void> {
    console.log('🛑 MARGIN GUARD WORKER - Stopping worker...');
    await this.worker.close();
  }

  /**
   * Get worker status
   */
  getStatus(): { isRunning: boolean; concurrency: number } {
    return {
      isRunning: this.worker.isRunning(),
      concurrency: this.worker.opts.concurrency || 1
    };
  }
}
