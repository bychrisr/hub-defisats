import { Logger } from 'winston';
import { EventEmitter } from 'events';

export interface WorkerTask<T = any, R = any> {
  id: string;
  type: string;
  data: T;
  priority: number;
  createdAt: Date;
  retries: number;
  maxRetries: number;
  timeout: number;
  metadata?: Record<string, any>;
}

export interface WorkerPoolConfig {
  minWorkers: number;
  maxWorkers: number;
  idleTimeout: number; // milliseconds
  taskTimeout: number; // milliseconds
  retryDelay: number; // milliseconds
  maxRetries: number;
}

export interface WorkerStats {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  queuedTasks: number;
  averageTaskTime: number;
  uptime: number;
}

export class WorkerPoolService extends EventEmitter {
  private logger: Logger;
  private config: WorkerPoolConfig;
  private workers: Map<string, Worker> = new Map();
  private taskQueue: WorkerTask[] = [];
  private completedTasks: Map<string, any> = new Map();
  private failedTasks: Map<string, any> = new Map();
  private taskHandlers: Map<string, (data: any) => Promise<any>> = new Map();
  private isRunning = false;
  private startTime: number;
  private stats = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    totalTaskTime: 0
  };

  constructor(logger: Logger, config: Partial<WorkerPoolConfig> = {}) {
    super();
    this.logger = logger;
    this.config = {
      minWorkers: 2,
      maxWorkers: 10,
      idleTimeout: 300000, // 5 minutes
      taskTimeout: 30000, // 30 seconds
      retryDelay: 1000, // 1 second
      maxRetries: 3,
      ...config
    };
    this.startTime = Date.now();
  }

  /**
   * Start the worker pool
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.logger.info('Starting worker pool', { config: this.config });

    // Start with minimum workers
    for (let i = 0; i < this.config.minWorkers; i++) {
      this.createWorker();
    }

    // Start task processing loop
    this.processTaskQueue();

    this.emit('started');
    this.logger.info('Worker pool started successfully');
  }

  /**
   * Stop the worker pool
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.logger.info('Stopping worker pool');

    // Stop all workers
    const stopPromises = Array.from(this.workers.values()).map(worker => worker.stop());
    await Promise.all(stopPromises);

    this.workers.clear();
    this.taskQueue = [];
    this.completedTasks.clear();
    this.failedTasks.clear();

    this.emit('stopped');
    this.logger.info('Worker pool stopped successfully');
  }

  /**
   * Register a task handler
   */
  registerHandler(taskType: string, handler: (data: any) => Promise<any>): void {
    this.taskHandlers.set(taskType, handler);
    this.logger.info('Task handler registered', { taskType });
  }

  /**
   * Submit a task to the worker pool
   */
  submitTask<T, R>(
    taskType: string,
    data: T,
    options: {
      priority?: number;
      timeout?: number;
      maxRetries?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask<T, R> = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: taskType,
        data,
        priority: options.priority || 0,
        createdAt: new Date(),
        retries: 0,
        maxRetries: options.maxRetries || this.config.maxRetries,
        timeout: options.timeout || this.config.taskTimeout,
        metadata: options.metadata
      };

      // Add to queue
      this.taskQueue.push(task);
      this.taskQueue.sort((a, b) => b.priority - a.priority); // Higher priority first

      this.stats.totalTasks++;

      // Set up task completion handlers
      const onComplete = (taskId: string, result: R) => {
        if (taskId === task.id) {
          this.removeAllListeners(`task:${task.id}:complete`);
          this.removeAllListeners(`task:${task.id}:error`);
          resolve(result);
        }
      };

      const onError = (taskId: string, error: any) => {
        if (taskId === task.id) {
          this.removeAllListeners(`task:${task.id}:complete`);
          this.removeAllListeners(`task:${task.id}:error`);
          reject(error);
        }
      };

      this.once(`task:${task.id}:complete`, onComplete);
      this.once(`task:${task.id}:error`, onError);

      this.logger.debug('Task submitted', { taskId: task.id, taskType, priority: task.priority });
      this.emit('taskSubmitted', task);
    });
  }

  /**
   * Get worker pool statistics
   */
  getStats(): WorkerStats {
    const activeWorkers = Array.from(this.workers.values()).filter(w => w.isBusy).length;
    const idleWorkers = this.workers.size - activeWorkers;
    const averageTaskTime = this.stats.completedTasks > 0 
      ? this.stats.totalTaskTime / this.stats.completedTasks 
      : 0;

    return {
      totalWorkers: this.workers.size,
      activeWorkers,
      idleWorkers,
      totalTasks: this.stats.totalTasks,
      completedTasks: this.stats.completedTasks,
      failedTasks: this.stats.failedTasks,
      queuedTasks: this.taskQueue.length,
      averageTaskTime,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): WorkerTask | undefined {
    return this.taskQueue.find(task => task.id === taskId) ||
           Array.from(this.completedTasks.keys()).includes(taskId) ? 
           { id: taskId } as WorkerTask : undefined;
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): boolean {
    const taskIndex = this.taskQueue.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
      this.taskQueue.splice(taskIndex, 1);
      this.emit(`task:${taskId}:cancelled`);
      this.logger.info('Task cancelled', { taskId });
      return true;
    }
    return false;
  }

  /**
   * Create a new worker
   */
  private createWorker(): Worker {
    const workerId = `worker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const worker = new Worker(workerId, this.logger, this.config, this.taskHandlers);
    
    worker.on('taskComplete', (taskId: string, result: any, duration: number) => {
      this.handleTaskComplete(taskId, result, duration);
    });

    worker.on('taskError', (taskId: string, error: any) => {
      this.handleTaskError(taskId, error);
    });

    worker.on('idle', () => {
      this.handleWorkerIdle(workerId);
    });

    this.workers.set(workerId, worker);
    this.logger.debug('Worker created', { workerId });
    
    return worker;
  }

  /**
   * Process the task queue
   */
  private processTaskQueue(): void {
    if (!this.isRunning) return;

    // Find idle workers
    const idleWorkers = Array.from(this.workers.values()).filter(w => !w.isBusy);
    
    // Assign tasks to idle workers
    while (this.taskQueue.length > 0 && idleWorkers.length > 0) {
      const task = this.taskQueue.shift()!;
      const worker = idleWorkers.shift()!;
      
      worker.assignTask(task);
    }

    // Scale up if needed
    if (this.taskQueue.length > 0 && this.workers.size < this.config.maxWorkers) {
      const worker = this.createWorker();
      if (this.taskQueue.length > 0) {
        const task = this.taskQueue.shift()!;
        worker.assignTask(task);
      }
    }

    // Schedule next processing cycle
    setTimeout(() => this.processTaskQueue(), 100);
  }

  /**
   * Handle task completion
   */
  private handleTaskComplete(taskId: string, result: any, duration: number): void {
    this.completedTasks.set(taskId, result);
    this.stats.completedTasks++;
    this.stats.totalTaskTime += duration;
    
    this.emit(`task:${taskId}:complete`, taskId, result);
    this.emit('taskComplete', taskId, result, duration);
    
    this.logger.debug('Task completed', { taskId, duration });
  }

  /**
   * Handle task error
   */
  private handleTaskError(taskId: string, error: any): void {
    this.failedTasks.set(taskId, error);
    this.stats.failedTasks++;
    
    this.emit(`task:${taskId}:error`, taskId, error);
    this.emit('taskError', taskId, error);
    
    this.logger.error('Task failed', { taskId, error: error.message });
  }

  /**
   * Handle worker idle
   */
  private handleWorkerIdle(workerId: string): void {
    // Check if we need to scale down
    if (this.workers.size > this.config.minWorkers && 
        this.taskQueue.length === 0 && 
        this.workers.size > 1) {
      
      const worker = this.workers.get(workerId);
      if (worker) {
        worker.stop();
        this.workers.delete(workerId);
        this.logger.debug('Worker removed due to idle timeout', { workerId });
      }
    }
  }
}

/**
 * Individual worker class
 */
class Worker extends EventEmitter {
  public isBusy = false;
  private id: string;
  private logger: Logger;
  private config: WorkerPoolConfig;
  private taskHandlers: Map<string, (data: any) => Promise<any>>;
  private currentTask: WorkerTask | null = null;
  private idleTimer: NodeJS.Timeout | null = null;

  constructor(
    id: string,
    logger: Logger,
    config: WorkerPoolConfig,
    taskHandlers: Map<string, (data: any) => Promise<any>>
  ) {
    super();
    this.id = id;
    this.logger = logger;
    this.config = config;
    this.taskHandlers = taskHandlers;
  }

  /**
   * Assign a task to this worker
   */
  assignTask(task: WorkerTask): void {
    if (this.isBusy) {
      throw new Error('Worker is already busy');
    }

    this.isBusy = true;
    this.currentTask = task;
    this.clearIdleTimer();

    this.logger.debug('Worker assigned task', { workerId: this.id, taskId: task.id });

    // Execute the task
    this.executeTask(task);
  }

  /**
   * Execute a task
   */
  private async executeTask(task: WorkerTask): Promise<void> {
    const startTime = Date.now();
    
    try {
      const handler = this.taskHandlers.get(task.type);
      if (!handler) {
        throw new Error(`No handler found for task type: ${task.type}`);
      }

      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), task.timeout);
      });

      // Execute task with timeout
      const result = await Promise.race([
        handler(task.data),
        timeoutPromise
      ]);

      const duration = Date.now() - startTime;
      this.emit('taskComplete', task.id, result, duration);
      
    } catch (error) {
      // Handle retries
      if (task.retries < task.maxRetries) {
        task.retries++;
        this.logger.warn('Task failed, retrying', { 
          workerId: this.id, 
          taskId: task.id, 
          retry: task.retries,
          error: (error as Error).message 
        });
        
        // Retry after delay
        setTimeout(() => {
          this.executeTask(task);
        }, this.config.retryDelay * task.retries);
        
        return;
      }

      // Max retries exceeded
      this.emit('taskError', task.id, error);
    } finally {
      this.isBusy = false;
      this.currentTask = null;
      this.setIdleTimer();
    }
  }

  /**
   * Set idle timer
   */
  private setIdleTimer(): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      this.emit('idle');
    }, this.config.idleTimeout);
  }

  /**
   * Clear idle timer
   */
  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  /**
   * Stop the worker
   */
  stop(): void {
    this.clearIdleTimer();
    this.isBusy = false;
    this.currentTask = null;
    this.removeAllListeners();
  }
}