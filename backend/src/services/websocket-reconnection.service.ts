/**
 * WebSocket Reconnection Service
 * 
 * Manages intelligent reconnection with exponential backoff
 * and connection health monitoring
 */

import { EventEmitter } from 'events';

export interface ReconnectionConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean; // add random jitter to prevent thundering herd
  healthCheckInterval: number; // milliseconds
}

export interface ReconnectionStats {
  attempts: number;
  successfulReconnections: number;
  failedReconnections: number;
  lastAttemptTime: number;
  lastSuccessTime: number;
  currentDelay: number;
  isReconnecting: boolean;
  consecutiveFailures: number;
}

export class WebSocketReconnectionService extends EventEmitter {
  private config: ReconnectionConfig;
  private stats: ReconnectionStats;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isActive = false;
  private connectionCallback: (() => Promise<boolean>) | null = null;

  constructor(config: Partial<ReconnectionConfig> = {}) {
    super();
    
    this.config = {
      maxAttempts: config.maxAttempts || 10,
      baseDelay: config.baseDelay || 1000, // 1 second
      maxDelay: config.maxDelay || 30000, // 30 seconds
      backoffMultiplier: config.backoffMultiplier || 2,
      jitter: config.jitter !== false, // default true
      healthCheckInterval: config.healthCheckInterval || 60000 // 1 minute
    };

    this.stats = {
      attempts: 0,
      successfulReconnections: 0,
      failedReconnections: 0,
      lastAttemptTime: 0,
      lastSuccessTime: 0,
      currentDelay: this.config.baseDelay,
      isReconnecting: false,
      consecutiveFailures: 0
    };
  }

  /**
   * Set the connection callback function
   */
  setConnectionCallback(callback: () => Promise<boolean>): void {
    this.connectionCallback = callback;
  }

  /**
   * Start reconnection service
   */
  start(): void {
    if (this.isActive) {
      console.log('⚠️ RECONNECTION - Already active');
      return;
    }

    console.log('🔄 RECONNECTION - Starting reconnection service', {
      maxAttempts: this.config.maxAttempts,
      baseDelay: this.config.baseDelay,
      maxDelay: this.config.maxDelay,
      backoffMultiplier: this.config.backoffMultiplier
    });

    this.isActive = true;
    this.startHealthCheck();

    this.emit('started');
  }

  /**
   * Stop reconnection service
   */
  stop(): void {
    if (!this.isActive) {
      return;
    }

    console.log('🔄 RECONNECTION - Stopping reconnection service');

    this.isActive = false;
    this.stats.isReconnecting = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    this.emit('stopped');
  }

  /**
   * Trigger reconnection
   */
  async triggerReconnection(): Promise<void> {
    if (!this.isActive || !this.connectionCallback) {
      console.log('⚠️ RECONNECTION - Cannot reconnect: service inactive or no callback');
      return;
    }

    if (this.stats.isReconnecting) {
      console.log('⚠️ RECONNECTION - Already reconnecting');
      return;
    }

    if (this.stats.attempts >= this.config.maxAttempts) {
      console.error('💀 RECONNECTION - Max attempts reached', {
        attempts: this.stats.attempts,
        maxAttempts: this.config.maxAttempts
      });
      
      this.emit('maxAttemptsReached', this.stats);
      return;
    }

    this.stats.isReconnecting = true;
    this.stats.attempts++;
    this.stats.lastAttemptTime = Date.now();

    console.log('🔄 RECONNECTION - Starting reconnection attempt', {
      attempt: this.stats.attempts,
      maxAttempts: this.config.maxAttempts,
      delay: this.stats.currentDelay,
      consecutiveFailures: this.stats.consecutiveFailures
    });

    this.emit('reconnectionAttempt', {
      attempt: this.stats.attempts,
      delay: this.stats.currentDelay
    });

    // Wait for the calculated delay
    await this.delay(this.stats.currentDelay);

    try {
      // Attempt to reconnect
      const success = await this.connectionCallback();
      
      if (success) {
        this.handleReconnectionSuccess();
      } else {
        this.handleReconnectionFailure();
      }
    } catch (error) {
      console.error('❌ RECONNECTION - Reconnection attempt failed', error);
      this.handleReconnectionFailure();
    }
  }

  /**
   * Handle successful reconnection
   */
  private handleReconnectionSuccess(): void {
    this.stats.successfulReconnections++;
    this.stats.lastSuccessTime = Date.now();
    this.stats.consecutiveFailures = 0;
    this.stats.isReconnecting = false;
    this.stats.currentDelay = this.config.baseDelay; // Reset delay

    console.log('✅ RECONNECTION - Successfully reconnected', {
      attempt: this.stats.attempts,
      totalSuccesses: this.stats.successfulReconnections,
      consecutiveFailures: this.stats.consecutiveFailures
    });

    this.emit('reconnectionSuccess', {
      attempt: this.stats.attempts,
      totalSuccesses: this.stats.successfulReconnections,
      timestamp: this.stats.lastSuccessTime
    });
  }

  /**
   * Handle failed reconnection
   */
  private handleReconnectionFailure(): void {
    this.stats.failedReconnections++;
    this.stats.consecutiveFailures++;
    this.stats.isReconnecting = false;

    // Calculate next delay with exponential backoff
    this.stats.currentDelay = Math.min(
      this.stats.currentDelay * this.config.backoffMultiplier,
      this.config.maxDelay
    );

    console.log('❌ RECONNECTION - Reconnection failed', {
      attempt: this.stats.attempts,
      consecutiveFailures: this.stats.consecutiveFailures,
      nextDelay: this.stats.currentDelay,
      maxAttempts: this.config.maxAttempts
    });

    this.emit('reconnectionFailure', {
      attempt: this.stats.attempts,
      consecutiveFailures: this.stats.consecutiveFailures,
      nextDelay: this.stats.currentDelay
    });

    // Schedule next attempt if under max attempts
    if (this.stats.attempts < this.config.maxAttempts) {
      this.scheduleNextAttempt();
    }
  }

  /**
   * Schedule next reconnection attempt
   */
  private scheduleNextAttempt(): void {
    const delay = this.calculateDelay();
    
    console.log('⏰ RECONNECTION - Scheduling next attempt', {
      delay: `${delay}ms`,
      attempt: this.stats.attempts + 1,
      maxAttempts: this.config.maxAttempts
    });

    this.reconnectTimeout = setTimeout(() => {
      this.triggerReconnection();
    }, delay);
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private calculateDelay(): number {
    let delay = this.stats.currentDelay;

    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(0, Math.floor(delay));
  }

  /**
   * Start health check interval
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health check
   */
  private performHealthCheck(): void {
    const now = Date.now();
    const timeSinceLastSuccess = now - this.stats.lastSuccessTime;
    const isHealthy = timeSinceLastSuccess < this.config.healthCheckInterval * 2;

    console.log('🏥 RECONNECTION - Health check', {
      isHealthy,
      timeSinceLastSuccess: `${timeSinceLastSuccess}ms`,
      consecutiveFailures: this.stats.consecutiveFailures,
      attempts: this.stats.attempts
    });

    this.emit('healthCheck', {
      isHealthy,
      timeSinceLastSuccess,
      consecutiveFailures: this.stats.consecutiveFailures
    });

    // If unhealthy and not already reconnecting, trigger reconnection
    if (!isHealthy && !this.stats.isReconnecting && this.stats.attempts < this.config.maxAttempts) {
      console.log('🏥 RECONNECTION - Health check failed, triggering reconnection');
      this.triggerReconnection();
    }
  }

  /**
   * Utility function to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current reconnection statistics
   */
  getStats(): ReconnectionStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      attempts: 0,
      successfulReconnections: 0,
      failedReconnections: 0,
      lastAttemptTime: 0,
      lastSuccessTime: 0,
      currentDelay: this.config.baseDelay,
      isReconnecting: false,
      consecutiveFailures: 0
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ReconnectionConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    console.log('🔄 RECONNECTION - Configuration updated', {
      old: oldConfig,
      new: this.config
    });
  }
}
