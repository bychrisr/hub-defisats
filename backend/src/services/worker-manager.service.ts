import { EventEmitter } from 'events';
import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { loadBalancer, WorkerNode } from './load-balancer.service';

export interface WorkerProcess {
  id: string;
  pid: number;
  status: 'starting' | 'running' | 'stopping' | 'stopped';
  startTime: Date;
  lastHeartbeat: Date;
  cpuUsage: number;
  memoryUsage: number;
  activeJobs: number;
  maxJobs: number;
  capabilities: string[];
}

export interface WorkerConfig {
  maxJobs: number;
  capabilities: string[];
  healthCheckInterval: number;
  heartbeatInterval: number;
  gracefulShutdownTimeout: number;
}

export class WorkerManagerService extends EventEmitter {
  private redis: Redis;
  private workers: Map<string, WorkerProcess> = new Map();
  private workerInstances: Map<string, Worker> = new Map();
  private config: WorkerConfig;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(config: Partial<WorkerConfig> = {}) {
    super();
    
    this.config = {
      maxJobs: 10,
      capabilities: ['margin-check', 'automation-executor', 'simulation', 'notification', 'payment-validator'],
      healthCheckInterval: 30000, // 30 seconds
      heartbeatInterval: 10000, // 10 seconds
      gracefulShutdownTimeout: 30000, // 30 seconds
      ...config,
    };

    this.redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379');
  }

  /**
   * Start the worker manager
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Worker manager already running');
      return;
    }

    console.log('🚀 Starting Worker Manager Service...');
    
    this.isRunning = true;
    
    // Start heartbeat and health check
    this.startHeartbeat();
    this.startHealthCheck();
    
    // Register with load balancer
    await this.registerWithLoadBalancer();
    
    console.log('✅ Worker Manager Service started successfully');
    this.emit('started');
  }

  /**
   * Stop the worker manager
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping Worker Manager Service...');
    
    this.isRunning = false;
    
    // Stop intervals
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Gracefully shutdown all workers
    await this.shutdownAllWorkers();
    
    // Unregister from load balancer
    await this.unregisterFromLoadBalancer();
    
    // Close Redis connection
    await this.redis.quit();
    
    console.log('✅ Worker Manager Service stopped');
    this.emit('stopped');
  }

  /**
   * Create a new worker
   */
  async createWorker(workerId: string, queueName: string): Promise<WorkerProcess> {
    const workerProcess: WorkerProcess = {
      id: workerId,
      pid: process.pid,
      status: 'starting',
      startTime: new Date(),
      lastHeartbeat: new Date(),
      cpuUsage: 0,
      memoryUsage: 0,
      activeJobs: 0,
      maxJobs: this.config.maxJobs,
      capabilities: this.config.capabilities,
    };

    this.workers.set(workerId, workerProcess);
    
    // Create BullMQ worker instance
    const worker = new Worker(
      queueName,
      async job => {
        await this.handleJob(job, workerId);
      },
      {
        connection: this.redis,
        concurrency: this.config.maxJobs,
      }
    );

    this.workerInstances.set(workerId, worker);
    
    // Set up worker event handlers
    this.setupWorkerEventHandlers(worker, workerId);
    
    // Update status to running
    workerProcess.status = 'running';
    this.workers.set(workerId, workerProcess);
    
    console.log(`✅ Worker ${workerId} created and started`);
    this.emit('workerCreated', workerProcess);
    
    return workerProcess;
  }

  /**
   * Remove a worker
   */
  async removeWorker(workerId: string): Promise<void> {
    const workerProcess = this.workers.get(workerId);
    const workerInstance = this.workerInstances.get(workerId);
    
    if (!workerProcess || !workerInstance) {
      return;
    }

    console.log(`🔄 Stopping worker: ${workerId}`);
    
    workerProcess.status = 'stopping';
    this.workers.set(workerId, workerProcess);
    
    // Gracefully close the worker
    await workerInstance.close();
    
    // Remove from maps
    this.workers.delete(workerId);
    this.workerInstances.delete(workerId);
    
    console.log(`✅ Worker ${workerId} removed`);
    this.emit('workerRemoved', workerProcess);
  }

  /**
   * Handle job execution
   */
  private async handleJob(job: any, workerId: string): Promise<any> {
    const workerProcess = this.workers.get(workerId);
    if (!workerProcess) {
      throw new Error(`Worker ${workerId} not found`);
    }

    // Update active jobs count
    workerProcess.activeJobs++;
    this.workers.set(workerId, workerProcess);
    
    try {
      console.log(`🔄 Worker ${workerId} processing job ${job.id}`);
      
      // Simulate job processing
      const result = await this.processJob(job);
      
      // Update active jobs count
      workerProcess.activeJobs = Math.max(0, workerProcess.activeJobs - 1);
      this.workers.set(workerId, workerProcess);
      
      console.log(`✅ Worker ${workerId} completed job ${job.id}`);
      return result;
      
    } catch (error) {
      // Update active jobs count
      workerProcess.activeJobs = Math.max(0, workerProcess.activeJobs - 1);
      this.workers.set(workerId, workerProcess);
      
      console.error(`❌ Worker ${workerId} failed job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Process a job (placeholder implementation)
   */
  private async processJob(job: any): Promise<any> {
    // Simulate job processing time
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    return {
      jobId: job.id,
      processedAt: new Date().toISOString(),
      result: 'success',
    };
  }

  /**
   * Set up worker event handlers
   */
  private setupWorkerEventHandlers(worker: Worker, workerId: string): void {
    worker.on('completed', (job) => {
      console.log(`✅ Worker ${workerId} completed job ${job.id}`);
      this.emit('jobCompleted', { workerId, job });
    });

    worker.on('failed', (job, err) => {
      console.error(`❌ Worker ${workerId} failed job ${job?.id}:`, err);
      this.emit('jobFailed', { workerId, job, error: err });
    });

    worker.on('error', (err) => {
      console.error(`❌ Worker ${workerId} error:`, err);
      this.emit('workerError', { workerId, error: err });
    });
  }

  /**
   * Register with load balancer
   */
  private async registerWithLoadBalancer(): Promise<void> {
    const workerId = `worker-manager-${process.pid}`;
    const host = process.env.WORKER_HOST || 'localhost';
    const port = parseInt(process.env.WORKER_PORT || '3001');
    
    await loadBalancer.registerWorker({
      id: workerId,
      host,
      port,
      status: 'active',
      cpuUsage: 0,
      memoryUsage: 0,
      activeJobs: 0,
      maxJobs: this.config.maxJobs,
      capabilities: this.config.capabilities,
    });
  }

  /**
   * Unregister from load balancer
   */
  private async unregisterFromLoadBalancer(): Promise<void> {
    const workerId = `worker-manager-${process.pid}`;
    await loadBalancer.unregisterWorker(workerId);
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(async () => {
      await this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  /**
   * Send heartbeat to load balancer
   */
  private async sendHeartbeat(): Promise<void> {
    const workerId = `worker-manager-${process.pid}`;
    const cpuUsage = await this.getCpuUsage();
    const memoryUsage = await this.getMemoryUsage();
    const activeJobs = this.getTotalActiveJobs();
    
    await loadBalancer.updateWorkerStatus(workerId, {
      cpuUsage,
      memoryUsage,
      activeJobs,
      status: 'active',
    });
  }

  /**
   * Start health check
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    for (const [workerId, workerProcess] of this.workers) {
      const now = new Date();
      const timeSinceHeartbeat = now.getTime() - workerProcess.lastHeartbeat.getTime();
      
      if (timeSinceHeartbeat > this.config.healthCheckInterval * 2) {
        console.log(`⚠️ Worker ${workerId} is unhealthy, restarting...`);
        await this.restartWorker(workerId);
      }
    }
  }

  /**
   * Restart a worker
   */
  private async restartWorker(workerId: string): Promise<void> {
    const workerProcess = this.workers.get(workerId);
    if (!workerProcess) {
      return;
    }

    console.log(`🔄 Restarting worker: ${workerId}`);
    
    // Remove old worker
    await this.removeWorker(workerId);
    
    // Create new worker
    await this.createWorker(workerId, 'default');
  }

  /**
   * Shutdown all workers gracefully
   */
  private async shutdownAllWorkers(): Promise<void> {
    const shutdownPromises = Array.from(this.workers.keys()).map(workerId => 
      this.removeWorker(workerId)
    );
    
    await Promise.all(shutdownPromises);
  }

  /**
   * Get CPU usage
   */
  private async getCpuUsage(): Promise<number> {
    // Simplified CPU usage calculation
    return Math.random() * 100;
  }

  /**
   * Get memory usage
   */
  private async getMemoryUsage(): Promise<number> {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    return (memUsage.heapUsed / totalMem) * 100;
  }

  /**
   * Get total active jobs across all workers
   */
  private getTotalActiveJobs(): number {
    return Array.from(this.workers.values())
      .reduce((total, worker) => total + worker.activeJobs, 0);
  }

  /**
   * Get worker statistics
   */
  async getStats(): Promise<any> {
    const workers = Array.from(this.workers.values());
    
    return {
      totalWorkers: workers.length,
      activeWorkers: workers.filter(w => w.status === 'running').length,
      totalActiveJobs: this.getTotalActiveJobs(),
      avgCpuUsage: workers.length > 0 ? 
        workers.reduce((sum, w) => sum + w.cpuUsage, 0) / workers.length : 0,
      avgMemoryUsage: workers.length > 0 ? 
        workers.reduce((sum, w) => sum + w.memoryUsage, 0) / workers.length : 0,
      workers: workers,
    };
  }

  /**
   * Get worker by ID
   */
  getWorker(workerId: string): WorkerProcess | undefined {
    return this.workers.get(workerId);
  }

  /**
   * Get all workers
   */
  getAllWorkers(): WorkerProcess[] {
    return Array.from(this.workers.values());
  }

  /**
   * Check if worker manager is running
   */
  isWorkerManagerRunning(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
export const workerManager = new WorkerManagerService();
