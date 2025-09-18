import { Logger } from 'winston';

export interface LoadBalancerConfig {
  algorithm: 'round_robin' | 'least_connections' | 'weighted_round_robin' | 'ip_hash';
  healthCheckInterval: number; // milliseconds
  healthCheckTimeout: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
}

export interface ServiceInstance {
  id: string;
  url: string;
  weight: number;
  isHealthy: boolean;
  activeConnections: number;
  lastHealthCheck: Date;
  responseTime: number;
  metadata?: Record<string, any>;
}

export interface LoadBalancerStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  healthyInstances: number;
  totalInstances: number;
  uptime: number;
}

export class LoadBalancerService {
  private logger: Logger;
  private config: LoadBalancerConfig;
  private instances: Map<string, ServiceInstance> = new Map();
  private currentIndex = 0;
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalResponseTime: 0,
    startTime: Date.now()
  };
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(logger: Logger, config: Partial<LoadBalancerConfig> = {}) {
    this.logger = logger;
    this.config = {
      algorithm: 'round_robin',
      healthCheckInterval: 30000, // 30 seconds
      healthCheckTimeout: 5000, // 5 seconds
      maxRetries: 3,
      retryDelay: 1000, // 1 second
      ...config
    };
  }

  /**
   * Add a service instance
   */
  addInstance(instance: Omit<ServiceInstance, 'isHealthy' | 'activeConnections' | 'lastHealthCheck' | 'responseTime'>): void {
    const serviceInstance: ServiceInstance = {
      ...instance,
      isHealthy: true,
      activeConnections: 0,
      lastHealthCheck: new Date(),
      responseTime: 0
    };

    this.instances.set(instance.id, serviceInstance);
    this.logger.info('Service instance added', { 
      instanceId: instance.id, 
      url: instance.url,
      weight: instance.weight 
    });
  }

  /**
   * Remove a service instance
   */
  removeInstance(instanceId: string): boolean {
    const removed = this.instances.delete(instanceId);
    if (removed) {
      this.logger.info('Service instance removed', { instanceId });
    }
    return removed;
  }

  /**
   * Get all service instances
   */
  getInstances(): ServiceInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get healthy service instances
   */
  getHealthyInstances(): ServiceInstance[] {
    return Array.from(this.instances.values()).filter(instance => instance.isHealthy);
  }

  /**
   * Select the next instance based on the load balancing algorithm
   */
  selectInstance(): ServiceInstance | null {
    const healthyInstances = this.getHealthyInstances();
    
    if (healthyInstances.length === 0) {
      this.logger.warn('No healthy instances available');
      return null;
    }

    switch (this.config.algorithm) {
      case 'round_robin':
        return this.selectRoundRobin(healthyInstances);
      case 'least_connections':
        return this.selectLeastConnections(healthyInstances);
      case 'weighted_round_robin':
        return this.selectWeightedRoundRobin(healthyInstances);
      case 'ip_hash':
        return this.selectIpHash(healthyInstances);
      default:
        return this.selectRoundRobin(healthyInstances);
    }
  }

  /**
   * Round robin selection
   */
  private selectRoundRobin(instances: ServiceInstance[]): ServiceInstance {
    const instance = instances[this.currentIndex % instances.length];
    this.currentIndex++;
    return instance;
  }

  /**
   * Least connections selection
   */
  private selectLeastConnections(instances: ServiceInstance[]): ServiceInstance {
    return instances.reduce((min, current) => 
      current.activeConnections < min.activeConnections ? current : min
    );
  }

  /**
   * Weighted round robin selection
   */
  private selectWeightedRoundRobin(instances: ServiceInstance[]): ServiceInstance {
    // Simple weighted round robin implementation
    const totalWeight = instances.reduce((sum, instance) => sum + instance.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const instance of instances) {
      random -= instance.weight;
      if (random <= 0) {
        return instance;
      }
    }
    
    return instances[0]; // Fallback
  }

  /**
   * IP hash selection
   */
  private selectIpHash(instances: ServiceInstance[]): ServiceInstance {
    // This would typically use the client's IP address
    // For now, we'll use a simple hash of the current time
    const hash = this.simpleHash(Date.now().toString());
    return instances[hash % instances.length];
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Execute a request through the load balancer
   */
  async executeRequest<T>(
    requestFn: (instance: ServiceInstance) => Promise<T>,
    options: {
      retries?: number;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const retries = options.retries || this.config.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const instance = this.selectInstance();
      
      if (!instance) {
        throw new Error('No healthy instances available');
      }

      try {
        this.stats.totalRequests++;
        instance.activeConnections++;

        const startTime = Date.now();
        const result = await this.executeWithTimeout(
          requestFn(instance),
          options.timeout || 30000
        );
        
        const responseTime = Date.now() - startTime;
        instance.responseTime = responseTime;
        this.stats.totalResponseTime += responseTime;
        this.stats.successfulRequests++;

        this.logger.debug('Request successful', {
          instanceId: instance.id,
          attempt: attempt + 1,
          responseTime
        });

        return result;

      } catch (error) {
        lastError = error as Error;
        this.stats.failedRequests++;

        this.logger.warn('Request failed', {
          instanceId: instance.id,
          attempt: attempt + 1,
          error: lastError.message
        });

        // Mark instance as unhealthy if it fails multiple times
        if (attempt >= 2) {
          instance.isHealthy = false;
          this.logger.warn('Instance marked as unhealthy', { instanceId: instance.id });
        }

        // Wait before retry
        if (attempt < retries) {
          await this.delay(this.config.retryDelay);
        }

      } finally {
        instance.activeConnections = Math.max(0, instance.activeConnections - 1);
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  /**
   * Execute a function with timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeout: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Start health checking
   */
  startHealthChecking(): void {
    if (this.healthCheckInterval) return;

    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);

    this.logger.info('Health checking started', { 
      interval: this.config.healthCheckInterval 
    });
  }

  /**
   * Stop health checking
   */
  stopHealthChecking(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      this.logger.info('Health checking stopped');
    }
  }

  /**
   * Perform health checks on all instances
   */
  private async performHealthChecks(): Promise<void> {
    const instances = Array.from(this.instances.values());
    
    const healthCheckPromises = instances.map(instance => 
      this.checkInstanceHealth(instance)
    );

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * Check health of a specific instance
   */
  private async checkInstanceHealth(instance: ServiceInstance): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Simple health check - try to connect to the instance
      const response = await fetch(`${instance.url}/health`, {
        method: 'GET',
        timeout: this.config.healthCheckTimeout
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        instance.isHealthy = true;
        instance.responseTime = responseTime;
        instance.lastHealthCheck = new Date();
        
        this.logger.debug('Instance health check passed', {
          instanceId: instance.id,
          responseTime
        });
      } else {
        instance.isHealthy = false;
        this.logger.warn('Instance health check failed', {
          instanceId: instance.id,
          status: response.status
        });
      }

    } catch (error) {
      instance.isHealthy = false;
      this.logger.warn('Instance health check error', {
        instanceId: instance.id,
        error: (error as Error).message
      });
    }
  }

  /**
   * Get load balancer statistics
   */
  getStats(): LoadBalancerStats {
    const healthyInstances = this.getHealthyInstances().length;
    const averageResponseTime = this.stats.successfulRequests > 0 
      ? this.stats.totalResponseTime / this.stats.successfulRequests 
      : 0;

    return {
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      averageResponseTime,
      healthyInstances,
      totalInstances: this.instances.size,
      uptime: Date.now() - this.stats.startTime
    };
  }

  /**
   * Update instance weight
   */
  updateInstanceWeight(instanceId: string, weight: number): boolean {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.weight = weight;
      this.logger.info('Instance weight updated', { instanceId, weight });
      return true;
    }
    return false;
  }

  /**
   * Get instance by ID
   */
  getInstance(instanceId: string): ServiceInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Clear all instances
   */
  clearInstances(): void {
    this.instances.clear();
    this.currentIndex = 0;
    this.logger.info('All instances cleared');
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}