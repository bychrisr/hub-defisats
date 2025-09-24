import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { Worker, Queue } from 'bullmq';
import { strategicCache } from './strategic-cache.service';

export interface WorkerNode {
  id: string;
  host: string;
  port: number;
  status: 'active' | 'inactive' | 'overloaded';
  cpuUsage: number;
  memoryUsage: number;
  activeJobs: number;
  maxJobs: number;
  lastHeartbeat: Date;
  capabilities: string[];
}

export interface LoadBalancerConfig {
  maxWorkers: number;
  minWorkers: number;
  healthCheckInterval: number;
  overloadThreshold: number;
  underloadThreshold: number;
  scalingCooldown: number;
  queuePriorities: Record<string, number>;
}

export interface JobDistribution {
  workerId: string;
  queueName: string;
  jobCount: number;
  estimatedLoad: number;
}

export class LoadBalancerService extends EventEmitter {
  private redis: Redis;
  private workers: Map<string, WorkerNode> = new Map();
  private queues: Map<string, Queue> = new Map();
  private config: LoadBalancerConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastScalingTime: number = 0;
  private isRunning: boolean = false;

  constructor(config: Partial<LoadBalancerConfig> = {}) {
    super();
    
    this.config = {
      maxWorkers: 10,
      minWorkers: 2,
      healthCheckInterval: 30000, // 30 seconds
      overloadThreshold: 80, // 80% CPU or memory
      underloadThreshold: 30, // 30% CPU or memory
      scalingCooldown: 60000, // 1 minute
      queuePriorities: {
        'margin-check': 10,
        'automation-executor': 8,
        'simulation': 6,
        'notification': 4,
        'payment-validator': 7,
      },
      ...config,
    };

    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.initializeQueues();
  }

  /**
   * Initialize BullMQ queues
   */
  private initializeQueues(): void {
    const queueNames = Object.keys(this.config.queuePriorities);
    
    queueNames.forEach(queueName => {
      const queue = new Queue(queueName, {
        connection: this.redis,
        defaultJobOptions: {
          priority: this.config.queuePriorities[queueName],
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      });
      
      this.queues.set(queueName, queue);
    });
  }

  /**
   * Start the load balancer
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Load balancer already running');
      return;
    }

    console.log('🚀 Starting Load Balancer Service...');
    
    this.isRunning = true;
    
    // Start health check monitoring
    this.startHealthCheck();
    
    // Initialize with minimum workers
    await this.scaleWorkers(this.config.minWorkers);
    
    console.log('✅ Load Balancer Service started successfully');
    this.emit('started');
  }

  /**
   * Stop the load balancer
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping Load Balancer Service...');
    
    this.isRunning = false;
    
    // Stop health check
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Scale down to 0 workers
    await this.scaleWorkers(0);
    
    // Close Redis connection
    await this.redis.quit();
    
    console.log('✅ Load Balancer Service stopped');
    this.emit('stopped');
  }

  /**
   * Register a worker node
   */
  async registerWorker(workerNode: Omit<WorkerNode, 'lastHeartbeat'>): Promise<void> {
    const node: WorkerNode = {
      ...workerNode,
      lastHeartbeat: new Date(),
    };

    this.workers.set(node.id, node);
    
    // Cache worker info
    await strategicCache.set('config', `worker:${node.id}`, node);
    
    console.log(`📝 Registered worker: ${node.id} (${node.host}:${node.port})`);
    this.emit('workerRegistered', node);
  }

  /**
   * Unregister a worker node
   */
  async unregisterWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return;
    }

    this.workers.delete(workerId);
    await strategicCache.delete('config', `worker:${workerId}`);
    
    console.log(`🗑️ Unregistered worker: ${workerId}`);
    this.emit('workerUnregistered', worker);
  }

  /**
   * Update worker status
   */
  async updateWorkerStatus(workerId: string, status: Partial<WorkerNode>): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return;
    }

    const updatedWorker = {
      ...worker,
      ...status,
      lastHeartbeat: new Date(),
    };

    this.workers.set(workerId, updatedWorker);
    await strategicCache.set('config', `worker:${workerId}`, updatedWorker);
    
    this.emit('workerStatusUpdated', updatedWorker);
  }

  /**
   * Get optimal worker for a job
   */
  async getOptimalWorker(queueName: string, jobData?: any): Promise<WorkerNode | null> {
    const availableWorkers = Array.from(this.workers.values())
      .filter(worker => 
        worker.status === 'active' && 
        worker.activeJobs < worker.maxJobs &&
        worker.capabilities.includes(queueName)
      );

    if (availableWorkers.length === 0) {
      return null;
    }

    // Calculate load score for each worker
    const workersWithScore = availableWorkers.map(worker => {
      const cpuScore = worker.cpuUsage / 100;
      const memoryScore = worker.memoryUsage / 100;
      const jobScore = worker.activeJobs / worker.maxJobs;
      
      const loadScore = (cpuScore + memoryScore + jobScore) / 3;
      
      return {
        worker,
        loadScore,
      };
    });

    // Sort by load score (lowest first)
    workersWithScore.sort((a, b) => a.loadScore - b.loadScore);
    
    return workersWithScore[0].worker;
  }

  /**
   * Distribute jobs across workers
   */
  async distributeJobs(): Promise<JobDistribution[]> {
    const distributions: JobDistribution[] = [];
    
    for (const [queueName, queue] of this.queues) {
      const waitingJobs = await queue.getWaiting();
      const activeJobs = await queue.getActive();
      const totalJobs = waitingJobs.length + activeJobs.length;
      
      if (totalJobs === 0) {
        continue;
      }

      const availableWorkers = Array.from(this.workers.values())
        .filter(worker => 
          worker.status === 'active' && 
          worker.capabilities.includes(queueName)
        );

      if (availableWorkers.length === 0) {
        continue;
      }

      // Distribute jobs based on worker capacity
      const totalCapacity = availableWorkers.reduce((sum, worker) => sum + worker.maxJobs, 0);
      
      for (const worker of availableWorkers) {
        const workerCapacity = worker.maxJobs;
        const distributionRatio = workerCapacity / totalCapacity;
        const assignedJobs = Math.floor(totalJobs * distributionRatio);
        
        distributions.push({
          workerId: worker.id,
          queueName,
          jobCount: assignedJobs,
          estimatedLoad: (worker.activeJobs + assignedJobs) / worker.maxJobs * 100,
        });
      }
    }
    
    return distributions;
  }

  /**
   * Scale workers based on load
   */
  async scaleWorkers(targetCount: number): Promise<void> {
    const currentCount = this.workers.size;
    
    if (targetCount === currentCount) {
      return;
    }

    const now = Date.now();
    if (now - this.lastScalingTime < this.config.scalingCooldown) {
      console.log('⏳ Scaling cooldown active, skipping scaling');
      return;
    }

    this.lastScalingTime = now;

    if (targetCount > currentCount) {
      // Scale up
      const workersToAdd = targetCount - currentCount;
      console.log(`📈 Scaling up: adding ${workersToAdd} workers`);
      
      for (let i = 0; i < workersToAdd; i++) {
        await this.createWorker();
      }
    } else {
      // Scale down
      const workersToRemove = currentCount - targetCount;
      console.log(`📉 Scaling down: removing ${workersToRemove} workers`);
      
      const workersToRemoveList = Array.from(this.workers.values())
        .sort((a, b) => a.activeJobs - b.activeJobs)
        .slice(0, workersToRemove);
      
      for (const worker of workersToRemoveList) {
        await this.removeWorker(worker.id);
      }
    }
  }

  /**
   * Create a new worker
   */
  private async createWorker(): Promise<void> {
    const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const host = process.env.WORKER_HOST || 'localhost';
    const port = parseInt(process.env.WORKER_PORT || '3001') + this.workers.size;
    
    const worker: WorkerNode = {
      id: workerId,
      host,
      port,
      status: 'active',
      cpuUsage: 0,
      memoryUsage: 0,
      activeJobs: 0,
      maxJobs: 10,
      lastHeartbeat: new Date(),
      capabilities: Object.keys(this.config.queuePriorities),
    };

    await this.registerWorker(worker);
    
    // Start actual worker process (in real implementation, this would spawn a new process)
    await this.startWorkerProcess(worker);
  }

  /**
   * Start worker process
   */
  private async startWorkerProcess(worker: WorkerNode): Promise<void> {
    console.log(`🔄 Starting worker process: ${worker.id}`);
    
    // In a real implementation, this would spawn a new Node.js process
    // For now, we'll simulate the worker startup
    setTimeout(() => {
      console.log(`✅ Worker process started: ${worker.id}`);
      this.emit('workerProcessStarted', worker);
    }, 1000);
  }

  /**
   * Remove a worker
   */
  private async removeWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (!worker) {
      return;
    }

    console.log(`🔄 Stopping worker process: ${workerId}`);
    
    // In a real implementation, this would terminate the worker process
    await this.unregisterWorker(workerId);
    
    console.log(`✅ Worker process stopped: ${workerId}`);
    this.emit('workerProcessStopped', worker);
  }

  /**
   * Start health check monitoring
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health check on all workers
   */
  private async performHealthCheck(): Promise<void> {
    const now = new Date();
    const staleThreshold = 60000; // 1 minute
    
    for (const [workerId, worker] of this.workers) {
      const timeSinceHeartbeat = now.getTime() - worker.lastHeartbeat.getTime();
      
      if (timeSinceHeartbeat > staleThreshold) {
        console.log(`⚠️ Worker ${workerId} is stale, marking as inactive`);
        await this.updateWorkerStatus(workerId, { status: 'inactive' });
      }
      
      // Check for overloaded workers
      if (worker.cpuUsage > this.config.overloadThreshold || 
          worker.memoryUsage > this.config.overloadThreshold) {
        await this.updateWorkerStatus(workerId, { status: 'overloaded' });
      }
    }
    
    // Auto-scaling based on load
    await this.performAutoScaling();
  }

  /**
   * Perform auto-scaling based on current load
   */
  private async performAutoScaling(): Promise<void> {
    const activeWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status === 'active');
    
    if (activeWorkers.length === 0) {
      return;
    }

    const avgCpuUsage = activeWorkers.reduce((sum, worker) => sum + worker.cpuUsage, 0) / activeWorkers.length;
    const avgMemoryUsage = activeWorkers.reduce((sum, worker) => sum + worker.memoryUsage, 0) / activeWorkers.length;
    const avgLoad = (avgCpuUsage + avgMemoryUsage) / 2;

    // Scale up if overloaded
    if (avgLoad > this.config.overloadThreshold && activeWorkers.length < this.config.maxWorkers) {
      console.log(`📈 Auto-scaling up: avg load ${avgLoad.toFixed(1)}% > ${this.config.overloadThreshold}%`);
      await this.scaleWorkers(activeWorkers.length + 1);
    }
    
    // Scale down if underloaded
    if (avgLoad < this.config.underloadThreshold && activeWorkers.length > this.config.minWorkers) {
      console.log(`📉 Auto-scaling down: avg load ${avgLoad.toFixed(1)}% < ${this.config.underloadThreshold}%`);
      await this.scaleWorkers(activeWorkers.length - 1);
    }
  }

  /**
   * Get load balancer statistics
   */
  async getStats(): Promise<any> {
    const activeWorkers = Array.from(this.workers.values())
      .filter(worker => worker.status === 'active');
    
    const totalJobs = await this.getTotalJobs();
    
    return {
      totalWorkers: this.workers.size,
      activeWorkers: activeWorkers.length,
      inactiveWorkers: this.workers.size - activeWorkers.length,
      totalJobs,
      avgCpuUsage: activeWorkers.length > 0 ? 
        activeWorkers.reduce((sum, worker) => sum + worker.cpuUsage, 0) / activeWorkers.length : 0,
      avgMemoryUsage: activeWorkers.length > 0 ? 
        activeWorkers.reduce((sum, worker) => sum + worker.memoryUsage, 0) / activeWorkers.length : 0,
      workers: Array.from(this.workers.values()),
      distributions: await this.distributeJobs(),
    };
  }

  /**
   * Get total jobs across all queues
   */
  private async getTotalJobs(): Promise<number> {
    let totalJobs = 0;
    
    for (const [_, queue] of this.queues) {
      const waiting = await queue.getWaiting();
      const active = await queue.getActive();
      totalJobs += waiting.length + active.length;
    }
    
    return totalJobs;
  }

  /**
   * Get worker by ID
   */
  getWorker(workerId: string): WorkerNode | undefined {
    return this.workers.get(workerId);
  }

  /**
   * Get all workers
   */
  getAllWorkers(): WorkerNode[] {
    return Array.from(this.workers.values());
  }

  /**
   * Check if load balancer is running
   */
  isLoadBalancerRunning(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
export const loadBalancer = new LoadBalancerService();
