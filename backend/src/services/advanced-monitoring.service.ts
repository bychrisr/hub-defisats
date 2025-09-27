import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { config } from '../config/env';
import { metrics } from './metrics-export';
import { alerting } from './alerting.service';
import type { Logger } from 'winston';

export interface MonitoringThreshold {
  id: string;
  name: string;
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  enabled: boolean;
}

export interface MonitoringAlert {
  id: string;
  thresholdId: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export class AdvancedMonitoringService extends EventEmitter {
  private logger: Logger;
  private isRunning = false;
  private monitoringInterval?: NodeJS.Timeout;
  private prisma: PrismaClient;
  private redis: Redis;
  
  // Default thresholds
  private defaultThresholds: MonitoringThreshold[] = [
    {
      id: 'cpu_high',
      name: 'CPU Usage High',
      metric: 'cpu_usage_percent',
      operator: 'gt',
      value: 80,
      severity: 'high',
      description: 'CPU usage is above 80%',
      enabled: true,
    },
    {
      id: 'memory_high',
      name: 'Memory Usage High',
      metric: 'memory_usage_bytes',
      operator: 'gt',
      value: 1024 * 1024 * 1024, // 1GB
      severity: 'medium',
      description: 'Memory usage is above 1GB',
      enabled: true,
    },
    {
      id: 'error_rate_high',
      name: 'Error Rate High',
      metric: 'http_request_errors_rate',
      operator: 'gt',
      value: 5, // 5%
      severity: 'critical',
      description: 'HTTP error rate is above 5%',
      enabled: true,
    },
    {
      id: 'response_time_high',
      name: 'Response Time High',
      metric: 'http_request_duration_seconds',
      operator: 'gt',
      value: 2, // 2 seconds
      severity: 'medium',
      description: 'Average response time is above 2 seconds',
      enabled: true,
    },
    {
      id: 'database_slow',
      name: 'Database Slow Response',
      metric: 'db_query_duration_seconds',
      operator: 'gt',
      value: 1, // 1 second
      severity: 'high',
      description: 'Database queries are taking more than 1 second',
      enabled: true,
    },
    {
      id: 'redis_slow',
      name: 'Redis Slow Response',
      metric: 'redis_operation_duration_seconds',
      operator: 'gt',
      value: 0.5, // 500ms
      severity: 'medium',
      description: 'Redis operations are taking more than 500ms',
      enabled: true,
    },
  ];

  private activeAlerts: Map<string, MonitoringAlert> = new Map();
  private thresholds: Map<string, MonitoringThreshold> = new Map();

  constructor(logger: Logger) {
    super();
    this.logger = logger;
    this.prisma = new PrismaClient();
    this.redis = new Redis(config.redis.url);
    
    // Initialize default thresholds
    this.defaultThresholds.forEach(threshold => {
      this.thresholds.set(threshold.id, threshold);
    });
  }

  /**
   * Start monitoring service
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.logger.info('🔍 Starting Advanced Monitoring Service...');
    
    try {
      // Start monitoring loop
      this.monitoringInterval = setInterval(() => {
        this.checkThresholds().catch(error => {
          this.logger.error('Error in monitoring loop:', error);
        });
      }, 30000); // Check every 30 seconds

      this.isRunning = true;
      this.logger.info('✅ Advanced Monitoring Service started');
      
      this.emit('started');
    } catch (error) {
      this.logger.error('Failed to start Advanced Monitoring Service:', error);
      throw error;
    }
  }

  /**
   * Stop monitoring service
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.logger.info('🛑 Stopping Advanced Monitoring Service...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    await this.prisma.$disconnect();
    await this.redis.quit();

    this.isRunning = false;
    this.logger.info('✅ Advanced Monitoring Service stopped');
    
    this.emit('stopped');
  }

  /**
   * Check all thresholds against current metrics
   */
  private async checkThresholds(): Promise<void> {
    try {
      // Get current metrics
      const metricsData = await metrics.getMetricsAsJson();
      
      // Check each threshold
      for (const [thresholdId, threshold] of this.thresholds) {
        if (!threshold.enabled) {
          continue;
        }

        const metricData = metricsData.find((m: any) => m.name === threshold.metric);
        if (!metricData || !metricData.values || metricData.values.length === 0) {
          continue;
        }

        // Calculate metric value based on type
        let currentValue: number;
        
        if (threshold.metric === 'http_request_errors_rate') {
          // Special calculation for error rate
          currentValue = await this.calculateErrorRate();
        } else {
          // Use average value for other metrics
          currentValue = metricData.values.reduce((sum: number, val: any) => sum + val.value, 0) / metricData.values.length;
        }

        // Check threshold
        const isThresholdBreached = this.evaluateThreshold(currentValue, threshold);
        
        if (isThresholdBreached) {
          await this.handleThresholdBreach(threshold, currentValue);
        } else {
          await this.handleThresholdResolved(threshold, currentValue);
        }
      }
    } catch (error) {
      this.logger.error('Error checking thresholds:', error);
    }
  }

  /**
   * Evaluate if threshold is breached
   */
  private evaluateThreshold(value: number, threshold: MonitoringThreshold): boolean {
    switch (threshold.operator) {
      case 'gt':
        return value > threshold.value;
      case 'gte':
        return value >= threshold.value;
      case 'lt':
        return value < threshold.value;
      case 'lte':
        return value <= threshold.value;
      case 'eq':
        return value === threshold.value;
      default:
        return false;
    }
  }

  /**
   * Handle threshold breach
   */
  private async handleThresholdBreach(threshold: MonitoringThreshold, value: number): Promise<void> {
    const alertId = `${threshold.id}_${Date.now()}`;
    
    // Check if alert already exists
    const existingAlert = Array.from(this.activeAlerts.values()).find(
      alert => alert.thresholdId === threshold.id && !alert.resolved
    );

    if (existingAlert) {
      return; // Alert already active
    }

    // Create new alert
    const alert: MonitoringAlert = {
      id: alertId,
      thresholdId: threshold.id,
      metric: threshold.metric,
      value,
      threshold: threshold.value,
      severity: threshold.severity,
      message: `${threshold.name}: ${threshold.description} (current: ${value.toFixed(2)}, threshold: ${threshold.value})`,
      timestamp: new Date(),
      resolved: false,
    };

    this.activeAlerts.set(alertId, alert);

    // Send to alerting service
    alerting.createAlert({
      ruleId: threshold.id,
      severity: threshold.severity,
      message: alert.message,
      metadata: {
        metric: threshold.metric,
        currentValue: value,
        thresholdValue: threshold.value,
        operator: threshold.operator,
      },
    });

    this.logger.warn(`🚨 Threshold breached: ${alert.message}`);
    this.emit('alert', alert);
  }

  /**
   * Handle threshold resolved
   */
  private async handleThresholdResolved(threshold: MonitoringThreshold, value: number): Promise<void> {
    // Find active alert for this threshold
    const activeAlert = Array.from(this.activeAlerts.values()).find(
      alert => alert.thresholdId === threshold.id && !alert.resolved
    );

    if (!activeAlert) {
      return; // No active alert to resolve
    }

    // Resolve alert
    activeAlert.resolved = true;
    activeAlert.resolvedAt = new Date();

    // Remove from active alerts
    this.activeAlerts.delete(activeAlert.id);

    this.logger.info(`✅ Threshold resolved: ${threshold.name} (current: ${value.toFixed(2)})`);
    this.emit('alert_resolved', activeAlert);
  }

  /**
   * Calculate HTTP error rate
   */
  private async calculateErrorRate(): Promise<number> {
    try {
      const metricsData = await metrics.getMetricsAsJson();
      
      const requestsMetric = metricsData.find((m: any) => m.name === 'http_requests_total');
      const errorsMetric = metricsData.find((m: any) => m.name === 'http_request_errors_total');

      if (!requestsMetric || !errorsMetric) {
        return 0;
      }

      const totalRequests = requestsMetric.values?.reduce((sum: number, val: any) => sum + val.value, 0) || 0;
      const totalErrors = errorsMetric.values?.reduce((sum: number, val: any) => sum + val.value, 0) || 0;

      return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    } catch (error) {
      this.logger.error('Error calculating error rate:', error);
      return 0;
    }
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeAlerts: this.activeAlerts.size,
      enabledThresholds: Array.from(this.thresholds.values()).filter(t => t.enabled).length,
      totalThresholds: this.thresholds.size,
    };
  }

  /**
   * Get all thresholds
   */
  getThresholds(): MonitoringThreshold[] {
    return Array.from(this.thresholds.values());
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): MonitoringAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Add or update threshold
   */
  setThreshold(threshold: MonitoringThreshold): void {
    this.thresholds.set(threshold.id, threshold);
    this.logger.info(`Threshold updated: ${threshold.name}`);
  }

  /**
   * Remove threshold
   */
  removeThreshold(thresholdId: string): boolean {
    const removed = this.thresholds.delete(thresholdId);
    if (removed) {
      this.logger.info(`Threshold removed: ${thresholdId}`);
    }
    return removed;
  }

  /**
   * Enable/disable threshold
   */
  toggleThreshold(thresholdId: string, enabled: boolean): boolean {
    const threshold = this.thresholds.get(thresholdId);
    if (!threshold) {
      return false;
    }

    threshold.enabled = enabled;
    this.logger.info(`Threshold ${enabled ? 'enabled' : 'disabled'}: ${threshold.name}`);
    return true;
  }

  /**
   * Get system health summary
   */
  async getHealthSummary() {
    try {
      const [dbHealth, redisHealth] = await Promise.allSettled([
        this.checkDatabaseHealth(),
        this.checkRedisHealth(),
      ]);

      const systemMetrics = await this.getSystemMetrics();

      return {
        overall: this.calculateOverallHealth(dbHealth, redisHealth, systemMetrics),
        database: dbHealth.status === 'fulfilled' ? dbHealth.value : { status: 'unhealthy', error: 'Connection failed' },
        redis: redisHealth.status === 'fulfilled' ? redisHealth.value : { status: 'unhealthy', error: 'Connection failed' },
        system: systemMetrics,
        alerts: {
          active: this.activeAlerts.size,
          critical: Array.from(this.activeAlerts.values()).filter(a => a.severity === 'critical').length,
          high: Array.from(this.activeAlerts.values()).filter(a => a.severity === 'high').length,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting health summary:', error);
      return {
        overall: 'unhealthy',
        error: 'Failed to get health summary',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check database health
   */
  private async checkDatabaseHealth() {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
        connections: 'active',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedisHealth() {
    const start = Date.now();
    try {
      await this.redis.ping();
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
        connections: 'active',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get system metrics
   */
  private async getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      uptime: process.uptime(),
      memory: {
        used: memoryUsage.heapUsed / 1024 / 1024, // MB
        total: memoryUsage.heapTotal / 1024 / 1024, // MB
        external: memoryUsage.external / 1024 / 1024, // MB
        rss: memoryUsage.rss / 1024 / 1024, // MB
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      },
      cpu: {
        user: cpuUsage.user / 1000000, // Convert to seconds
        system: cpuUsage.system / 1000000, // Convert to seconds
      },
      version: process.version,
      platform: process.platform,
    };
  }

  /**
   * Calculate overall health status
   */
  private calculateOverallHealth(dbHealth: any, redisHealth: any, systemMetrics: any): string {
    const criticalAlerts = Array.from(this.activeAlerts.values()).filter(a => a.severity === 'critical').length;
    const highAlerts = Array.from(this.activeAlerts.values()).filter(a => a.severity === 'high').length;

    if (criticalAlerts > 0) {
      return 'critical';
    }

    if (dbHealth.status === 'rejected' || redisHealth.status === 'rejected') {
      return 'degraded';
    }

    if (highAlerts > 0 || systemMetrics.memory.percentage > 90) {
      return 'degraded';
    }

    return 'healthy';
  }
}

// Export singleton instance
let advancedMonitoring: AdvancedMonitoringService | null = null;

export function createAdvancedMonitoring(logger: Logger): AdvancedMonitoringService {
  if (!advancedMonitoring) {
    advancedMonitoring = new AdvancedMonitoringService(logger);
  }
  return advancedMonitoring;
}

export { advancedMonitoring };
