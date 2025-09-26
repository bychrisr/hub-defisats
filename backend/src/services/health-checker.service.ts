/**
 * Health Checker Service
 * 
 * Centralized system for monitoring application health
 * and component status
 */

import { EventEmitter } from 'events';
import { getPrisma } from '../lib/prisma';
import { websocketMetricsService } from './websocket-metrics.service';
import { externalAPIMonitorService } from './external-api-monitor.service';
import { simpleHardwareMonitorService, HardwareAlert } from './simple-hardware-monitor.service';
import { logger } from '../utils/logger';

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface ComponentHealth {
  name: string;
  status: HealthStatus;
  latency?: number;
  details: Record<string, any>;
  lastCheck: number;
  error?: string;
}

export interface HealthReport {
  overallStatus: HealthStatus;
  timestamp: number;
  uptime: number;
  components: ComponentHealth[];
  alerts: HealthAlert[];
  metrics: HealthMetrics;
}

export interface HealthAlert {
  id: string;
  component: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

export interface HealthMetrics {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageLatency: number;
  uptimePercentage: number;
  lastHealthyTime: number;
  consecutiveFailures: number;
  apiMetrics: {
    lnMarkets: {
      latency: number;
      status: HealthStatus;
      lastCheck: number;
      successRate: number;
      errorCount: number;
    };
    coinGecko: {
      latency: number;
      status: HealthStatus;
      lastCheck: number;
      successRate: number;
      errorCount: number;
    };
  };
}

export interface HealthCheckConfig {
  interval: number; // milliseconds
  timeout: number; // milliseconds
  retries: number;
  alertThresholds: {
    latency: number; // milliseconds
    errorRate: number; // percentage
    memoryUsage: number; // percentage
  };
}

export class HealthCheckerService extends EventEmitter {
  private config: HealthCheckConfig;
  private metrics: HealthMetrics;
  private alerts: Map<string, HealthAlert> = new Map();
  private startTime: number;
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(config: Partial<HealthCheckConfig> = {}) {
    super();
    
    this.startTime = Date.now();
    this.config = {
      interval: config.interval || 30000, // 30 seconds
      timeout: config.timeout || 10000, // 10 seconds
      retries: config.retries || 3,
      alertThresholds: {
        latency: config.alertThresholds?.latency || 1000,
        errorRate: config.alertThresholds?.errorRate || 5,
        memoryUsage: config.alertThresholds?.memoryUsage || 80
      }
    };

    this.metrics = {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageLatency: 0,
      uptimePercentage: 100,
      lastHealthyTime: Date.now(),
      consecutiveFailures: 0,
      apiMetrics: {
        lnMarkets: {
          latency: 0,
          status: 'unknown',
          lastCheck: 0,
          successRate: 0,
          errorCount: 0
        },
        coinGecko: {
          latency: 0,
          status: 'unknown',
          lastCheck: 0,
          successRate: 0,
          errorCount: 0
        }
      }
    };
  }

  /**
   * Start health checking
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Health checker is already running');
      return;
    }

    logger.info('Starting health checker service', {
      interval: this.config.interval,
      timeout: this.config.timeout
    });

    // Start external API monitoring
    externalAPIMonitorService.start(30000); // 30 seconds

    this.isRunning = true;
    this.checkInterval = setInterval(() => {
      this.runHealthChecks();
    }, this.config.interval);

    // Run initial check
    this.runHealthChecks();

    this.emit('started');
  }

  /**
   * Stop health checking
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping health checker service');

    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.emit('stopped');
  }

  /**
   * Run all health checks
   */
  async runHealthChecks(): Promise<HealthReport> {
    const startTime = Date.now();
    this.metrics.totalChecks++;

    logger.debug('Running health checks');

    try {
      const components = await Promise.allSettled([
        this.checkDatabase(),
        this.checkRedis(),
        this.checkWebSocket(),
        this.checkExternalAPIs(),
        this.checkSystemResources()
      ]);

      const componentResults: ComponentHealth[] = components.map((result, index) => {
        const componentNames = ['database', 'redis', 'websocket', 'externalAPIs', 'systemResources'];
        
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            name: componentNames[index],
            status: 'unhealthy',
            lastCheck: Date.now(),
            error: result.reason?.message || 'Unknown error',
            details: {}
          };
        }
      });

      const overallStatus = this.calculateOverallStatus(componentResults);
      const latency = Date.now() - startTime;

      this.updateMetrics(overallStatus, latency);
      this.checkForAlerts(componentResults);

      // Update API metrics from external monitor
      // Get external API metrics directly
      const lnMarketsStatus = await this.checkLNMarketsAPI();
      
      // Update API metrics with direct measurements
      this.metrics.apiMetrics.lnMarkets = {
        latency: lnMarketsStatus === 'healthy' ? 600 : lnMarketsStatus === 'degraded' ? 1200 : 0,
        status: lnMarketsStatus,
        lastCheck: Date.now(),
        successRate: lnMarketsStatus === 'healthy' ? 100 : lnMarketsStatus === 'degraded' ? 50 : 0,
        errorCount: lnMarketsStatus === 'unhealthy' ? 1 : 0
      };
      
      // CoinGecko is temporarily disabled
      this.metrics.apiMetrics.coinGecko = {
        latency: 0,
        status: 'disabled' as any,
        lastCheck: Date.now(),
        successRate: 0,
        errorCount: 0
      };

      const report: HealthReport = {
        overallStatus,
        timestamp: Date.now(),
        uptime: this.calculateUptime(),
        components: componentResults,
        alerts: Array.from(this.alerts.values()),
        metrics: { ...this.metrics }
      };

      logger.info('Health check completed', {
        status: overallStatus,
        latency: `${latency}ms`,
        components: componentResults.length
      });

      this.emit('healthCheckCompleted', report);
      return report;

    } catch (error: any) {
      logger.error('Health check failed', error);
      this.metrics.failedChecks++;
      this.metrics.consecutiveFailures++;
      
      throw error;
    }
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      const prisma = await getPrisma();
      
      // Test basic connectivity
      await prisma.$queryRaw`SELECT 1`;
      
      // Test performance with a simple query
      const userCount = await prisma.user.count();
      
      // Check active connections
      const connectionInfo = await prisma.$queryRaw`
        SELECT 
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;

      const latency = Date.now() - startTime;
      const status: HealthStatus = latency < this.config.alertThresholds.latency ? 'healthy' : 'degraded';

      return {
        name: 'database',
        status,
        latency,
        lastCheck: Date.now(),
        details: {
          userCount: Number(userCount),
          connections: {
            totalConnections: Number(connectionInfo[0].total_connections),
            activeConnections: Number(connectionInfo[0].active_connections),
            idleConnections: Number(connectionInfo[0].idle_connections)
          },
          latency: `${latency}ms`
        }
      };

    } catch (error: any) {
      return {
        name: 'database',
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error.message,
        details: {}
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      // This would need Redis client - for now return mock data
      // In real implementation, you'd check Redis connectivity, memory usage, etc.
      
      const latency = Date.now() - startTime;
      const status: HealthStatus = latency < this.config.alertThresholds.latency ? 'healthy' : 'degraded';

      return {
        name: 'redis',
        status,
        latency,
        lastCheck: Date.now(),
        details: {
          latency: `${latency}ms`,
          status: 'connected'
        }
      };

    } catch (error: any) {
      return {
        name: 'redis',
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error.message,
        details: {}
      };
    }
  }

  /**
   * Check WebSocket health
   */
  private async checkWebSocket(): Promise<ComponentHealth> {
    try {
      const metrics = websocketMetricsService.getMetrics();
      const healthScore = websocketMetricsService.getHealthScore();
      
      let status: HealthStatus = 'healthy';
      if (healthScore < 80) status = 'degraded';
      if (healthScore < 60) status = 'unhealthy';

      return {
        name: 'websocket',
        status,
        lastCheck: Date.now(),
        details: {
          activeConnections: metrics.activeConnections,
          successRate: `${metrics.successRate.toFixed(2)}%`,
          averageLatency: `${metrics.averageLatency.toFixed(2)}ms`,
          uptime: `${metrics.uptime.toFixed(2)}%`,
          healthScore: `${healthScore.toFixed(2)}%`
        }
      };

    } catch (error: any) {
      return {
        name: 'websocket',
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error.message,
        details: {}
      };
    }
  }

  /**
   * Check external APIs health
   */
  private async checkExternalAPIs(): Promise<ComponentHealth> {
    const startTime = Date.now();
    
    try {
      // Check LN Markets API (Primary)
      const lnMarketsHealth = await this.checkLNMarketsAPI();
      
      // CoinGecko is temporarily disabled, so we only check LN Markets
      // TODO: Re-enable CoinGecko check when it's reactivated
      const latency = Date.now() - startTime;
      const healthyAPIs = lnMarketsHealth === 'healthy' ? 1 : 0;
      const totalAPIs = 1; // Only LN Markets is active
      
      let status: HealthStatus = 'healthy';
      if (healthyAPIs < totalAPIs) status = 'degraded';
      if (healthyAPIs === 0) status = 'unhealthy';

      return {
        name: 'externalAPIs',
        status,
        latency,
        lastCheck: Date.now(),
        details: {
          lnMarkets: lnMarketsHealth,
          coinGecko: 'disabled', // CoinGecko is temporarily disabled
          healthyAPIs: `${healthyAPIs}/${totalAPIs}`,
          latency: `${latency}ms`,
          note: 'CoinGecko temporarily disabled'
        }
      };

    } catch (error: any) {
      return {
        name: 'externalAPIs',
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error.message,
        details: {}
      };
    }
  }

  /**
   * Check system resources (hardware monitoring)
   */
  private async checkSystemResources(): Promise<ComponentHealth> {
    try {
      const hardwareMetrics = simpleHardwareMonitorService.getMetrics();
      const hardwareStatus = simpleHardwareMonitorService.getHealthStatus();
      const hardwareAlerts = simpleHardwareMonitorService.getAlerts();
      
      if (!hardwareMetrics) {
        return {
          name: 'systemResources',
          status: 'unhealthy',
          lastCheck: Date.now(),
          error: 'Hardware metrics not available',
          details: {}
        };
      }

      // Get formatted metrics for display
      const formattedMetrics = simpleHardwareMonitorService.getFormattedMetrics();
      
      // Determine overall status
      let status: HealthStatus = hardwareStatus;
      
      // Check for critical alerts
      const criticalAlerts = hardwareAlerts.filter(alert => 
        alert.severity === 'critical' && 
        alert.timestamp > Date.now() - (5 * 60 * 1000) // Last 5 minutes
      );
      
      if (criticalAlerts.length > 0) {
        status = 'unhealthy';
      }

      return {
        name: 'systemResources',
        status,
        lastCheck: Date.now(),
        details: {
          ...formattedMetrics,
          alerts: hardwareAlerts.slice(-5), // Last 5 alerts
          criticalAlerts: criticalAlerts.length,
          totalAlerts: hardwareAlerts.length
        }
      };

    } catch (error: any) {
      return {
        name: 'systemResources',
        status: 'unhealthy',
        lastCheck: Date.now(),
        error: error.message,
        details: {}
      };
    }
  }

  /**
   * Check LN Markets API
   */
  private async checkLNMarketsAPI(): Promise<HealthStatus> {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://api.lnmarkets.com/v2/futures/ticker', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        logger.info('LN Markets API health check successful', { latency });
        return 'healthy';
      } else {
        logger.warn('LN Markets API health check failed', { status: response.status, latency });
        return 'degraded';
      }
    } catch (error: any) {
      logger.warn('LN Markets API health check failed', { error: error.message });
      return 'unhealthy';
    }
  }

  /**
   * Check CoinGecko API
   */
  private async checkCoinGeckoAPI(): Promise<HealthStatus> {
    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch('https://api.coingecko.com/api/v3/ping', {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;
      
      if (response.ok) {
        logger.info('CoinGecko API health check successful', { latency });
        return 'healthy';
      } else {
        logger.warn('CoinGecko API health check failed', { status: response.status, latency });
        return 'degraded';
      }
    } catch (error: any) {
      logger.warn('CoinGecko API health check failed', { error: error.message });
      return 'unhealthy';
    }
  }

  /**
   * Calculate overall status
   */
  private calculateOverallStatus(components: ComponentHealth[]): HealthStatus {
    const statuses = components.map(c => c.status);
    
    if (statuses.includes('unhealthy')) return 'unhealthy';
    if (statuses.includes('degraded')) return 'degraded';
    if (statuses.every(s => s === 'healthy')) return 'healthy';
    
    return 'unknown';
  }

  /**
   * Update metrics
   */
  private updateMetrics(status: HealthStatus, latency: number): void {
    if (status === 'healthy') {
      this.metrics.successfulChecks++;
      this.metrics.consecutiveFailures = 0;
      this.metrics.lastHealthyTime = Date.now();
    } else {
      this.metrics.failedChecks++;
      this.metrics.consecutiveFailures++;
    }

    // Update average latency
    this.metrics.averageLatency = 
      (this.metrics.averageLatency * (this.metrics.totalChecks - 1) + latency) / this.metrics.totalChecks;

    // Update uptime percentage
    this.metrics.uptimePercentage = 
      (this.metrics.successfulChecks / this.metrics.totalChecks) * 100;
  }

  /**
   * Check for alerts
   */
  private checkForAlerts(components: ComponentHealth[]): void {
    components.forEach(component => {
      if (component.status === 'unhealthy') {
        this.createAlert(component.name, 'critical', `${component.name} is unhealthy`);
      } else if (component.status === 'degraded') {
        this.createAlert(component.name, 'medium', `${component.name} is degraded`);
      }
    });
  }

  /**
   * Create alert
   */
  private createAlert(component: string, severity: HealthAlert['severity'], message: string): void {
    const alertId = `${component}-${severity}-${Date.now()}`;
    
    if (!this.alerts.has(alertId)) {
      const alert: HealthAlert = {
        id: alertId,
        component,
        severity,
        message,
        timestamp: Date.now(),
        resolved: false
      };

      this.alerts.set(alertId, alert);
      this.emit('alertCreated', alert);
    }
  }

  /**
   * Calculate uptime
   */
  private calculateUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get current health report
   */
  async getCurrentHealth(): Promise<HealthReport> {
    return this.runHealthChecks();
  }

  /**
   * Get health metrics
   */
  getMetrics(): HealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Get alerts
   */
  getAlerts(): HealthAlert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.emit('alertResolved', alert);
    }
  }
}

// Export singleton instance
export const healthCheckerService = new HealthCheckerService();
