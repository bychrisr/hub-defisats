import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';

export interface MarginGuardSchedulerJobData {
  userId: string;
  automationId: string;
  userExchangeAccountId: string;
  config: any;
  planType: string;
  scheduleInterval: number; // in minutes
}

export class MarginGuardSchedulerWorker {
  private worker: Worker;
  private prisma: PrismaClient;
  private marginGuardQueue: Queue;

  constructor(redisConnection: any) {
    this.prisma = new PrismaClient();
    this.marginGuardQueue = new Queue('margin-guard-queue', { connection: redisConnection });

    this.worker = new Worker(
      'margin-guard-scheduler-queue',
      this.processJob.bind(this),
      {
        connection: redisConnection,
        concurrency: 3,
        removeOnComplete: 50,
        removeOnFail: 25,
      }
    );

    this.setupEventHandlers();
  }

  /**
   * Process Margin Guard scheduler job
   */
  private async processJob(job: Job<MarginGuardSchedulerJobData>): Promise<any> {
    const { userId, automationId, userExchangeAccountId, config, planType, scheduleInterval } = job.data;

    console.log('⏰ MARGIN GUARD SCHEDULER - Processing job:', {
      jobId: job.id,
      automationId,
      userId,
      planType,
      scheduleInterval
    });

    try {
      // Check if automation is still active
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
        console.log('⏭️ MARGIN GUARD SCHEDULER - Automation not active, skipping');
        return { success: false, reason: 'Automation not active' };
      }

      // Get current market prices
      const currentPrices = await this.getCurrentMarketPrices();

      // Add job to Margin Guard execution queue
      const executionJob = await this.marginGuardQueue.add(
        'execute-margin-guard',
        {
          automationId,
          userId,
          userExchangeAccountId,
          config,
          planType,
          positions: [], // Will be fetched by the executor
          currentPrices
        },
        {
          priority: this.getJobPriority(planType),
          delay: 0,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }
      );

      console.log('✅ MARGIN GUARD SCHEDULER - Job scheduled for execution:', {
        jobId: job.id,
        executionJobId: executionJob.id,
        priority: this.getJobPriority(planType)
      });

      // Schedule next execution
      await this.scheduleNextExecution(job.data);

      return {
        success: true,
        executionJobId: executionJob.id,
        nextExecution: new Date(Date.now() + scheduleInterval * 60 * 1000)
      };

    } catch (error) {
      console.error('❌ MARGIN GUARD SCHEDULER - Job failed:', {
        jobId: job.id,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Get current market prices
   */
  private async getCurrentMarketPrices(): Promise<Record<string, number>> {
    try {
      // TODO: Implement actual market data API call
      // For now, return mock prices
      const mockPrices = {
        'BTCUSD': 45000,
        'ETHUSD': 3000,
        'LTCUSD': 150
      };

      console.log('📊 MARGIN GUARD SCHEDULER - Retrieved market prices:', Object.keys(mockPrices).length);
      return mockPrices;

    } catch (error) {
      console.error('❌ MARGIN GUARD SCHEDULER - Failed to get market prices:', error);
      return {};
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
   * Schedule next execution
   */
  private async scheduleNextExecution(data: MarginGuardSchedulerJobData): Promise<void> {
    const nextExecutionTime = Date.now() + (data.scheduleInterval * 60 * 1000);

    await this.marginGuardQueue.add(
      'schedule-margin-guard',
      data,
      {
        delay: data.scheduleInterval * 60 * 1000,
        priority: this.getJobPriority(data.planType),
        attempts: 1,
      }
    );

    console.log('⏰ MARGIN GUARD SCHEDULER - Next execution scheduled:', {
      automationId: data.automationId,
      nextExecution: new Date(nextExecutionTime)
    });
  }

  /**
   * Setup event handlers for the scheduler
   */
  private setupEventHandlers(): void {
    this.worker.on('completed', (job, result) => {
      console.log('✅ MARGIN GUARD SCHEDULER - Job completed:', {
        jobId: job.id,
        success: result.success,
        executionJobId: result.executionJobId
      });
    });

    this.worker.on('failed', (job, err) => {
      console.error('❌ MARGIN GUARD SCHEDULER - Job failed:', {
        jobId: job.id,
        error: err.message,
        attempts: job.attemptsMade
      });
    });

    this.worker.on('stalled', (jobId) => {
      console.warn('⚠️ MARGIN GUARD SCHEDULER - Job stalled:', jobId);
    });

    this.worker.on('error', (err) => {
      console.error('❌ MARGIN GUARD SCHEDULER - Scheduler error:', err);
    });
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    console.log('🚀 MARGIN GUARD SCHEDULER - Starting scheduler...');
    // Worker is automatically started when created
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    console.log('🛑 MARGIN GUARD SCHEDULER - Stopping scheduler...');
    await this.worker.close();
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; concurrency: number } {
    return {
      isRunning: this.worker.isRunning(),
      concurrency: this.worker.opts.concurrency || 1
    };
  }
}
