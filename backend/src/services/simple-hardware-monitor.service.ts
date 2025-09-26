/**
 * Simple Hardware Monitor Service
 * 
 * Basic hardware monitoring without external dependencies
 */

import { logger } from '../utils/logger';

export interface SimpleHardwareMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  system: {
    uptime: number;
    platform: string;
    arch: string;
    hostname: string;
  };
  lastUpdate: number;
}

export interface HardwareAlert {
  type: 'cpu' | 'memory' | 'disk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export class SimpleHardwareMonitorService {
  private metrics: SimpleHardwareMetrics | null = null;
  private lastUpdate: number = 0;
  private updateInterval: number = 30000; // 30 seconds
  private alerts: HardwareAlert[] = [];
  
  // Thresholds for alerts
  private thresholds = {
    cpu: {
      warning: 70,
      critical: 90
    },
    memory: {
      warning: 80,
      critical: 95
    }
  };

  constructor() {
    this.startMonitoring();
  }

  /**
   * Start hardware monitoring
   */
  private startMonitoring(): void {
    // Initial metrics collection
    this.collectMetrics();
    
    // Set up periodic collection
    setInterval(() => {
      this.collectMetrics();
    }, this.updateInterval);
    
    logger.info('Simple hardware monitoring started', { interval: this.updateInterval });
  }

  /**
   * Collect hardware metrics using Node.js built-in APIs
   */
  private async collectMetrics(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Get basic system info
      const cpuUsage = await this.getCpuUsage();
      const memoryUsage = process.memoryUsage();
      const systemInfo = this.getSystemInfo();

      this.metrics = {
        cpu: {
          usage: cpuUsage,
          cores: require('os').cpus().length
        },
        memory: {
          total: memoryUsage.heapTotal,
          used: memoryUsage.heapUsed,
          free: memoryUsage.heapTotal - memoryUsage.heapUsed,
          usagePercent: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        },
        system: systemInfo,
        lastUpdate: Date.now()
      };

      this.lastUpdate = Date.now();
      
      // Check for alerts
      this.checkAlerts();
      
      const collectionTime = Date.now() - startTime;
      logger.debug('Hardware metrics collected', { 
        collectionTime: `${collectionTime}ms`,
        cpuUsage: `${cpuUsage}%`,
        memoryUsage: `${this.metrics.memory.usagePercent}%`
      });

    } catch (error: any) {
      logger.error('Failed to collect hardware metrics', { error: error.message });
    }
  }

  /**
   * Get CPU usage using Node.js built-in APIs
   */
  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = endUsage.user + endUsage.system;
        const totalTime = 1000000; // 1 second in microseconds
        
        const usagePercent = Math.round((totalUsage / totalTime) * 100);
        resolve(Math.min(usagePercent, 100));
      }, 100);
    });
  }

  /**
   * Get system information
   */
  private getSystemInfo(): SimpleHardwareMetrics['system'] {
    const os = require('os');
    
    return {
      uptime: os.uptime(),
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname()
    };
  }

  /**
   * Check for hardware alerts
   */
  private checkAlerts(): void {
    if (!this.metrics) return;

    const newAlerts: HardwareAlert[] = [];

    // CPU alerts
    if (this.metrics.cpu.usage >= this.thresholds.cpu.critical) {
      newAlerts.push({
        type: 'cpu',
        severity: 'critical',
        message: `CPU usage critical: ${this.metrics.cpu.usage}%`,
        value: this.metrics.cpu.usage,
        threshold: this.thresholds.cpu.critical,
        timestamp: Date.now()
      });
    } else if (this.metrics.cpu.usage >= this.thresholds.cpu.warning) {
      newAlerts.push({
        type: 'cpu',
        severity: 'medium',
        message: `CPU usage high: ${this.metrics.cpu.usage}%`,
        value: this.metrics.cpu.usage,
        threshold: this.thresholds.cpu.warning,
        timestamp: Date.now()
      });
    }

    // Memory alerts
    if (this.metrics.memory.usagePercent >= this.thresholds.memory.critical) {
      newAlerts.push({
        type: 'memory',
        severity: 'critical',
        message: `Memory usage critical: ${this.metrics.memory.usagePercent}%`,
        value: this.metrics.memory.usagePercent,
        threshold: this.thresholds.memory.critical,
        timestamp: Date.now()
      });
    } else if (this.metrics.memory.usagePercent >= this.thresholds.memory.warning) {
      newAlerts.push({
        type: 'memory',
        severity: 'medium',
        message: `Memory usage high: ${this.metrics.memory.usagePercent}%`,
        value: this.metrics.memory.usagePercent,
        threshold: this.thresholds.memory.warning,
        timestamp: Date.now()
      });
    }

    // Add new alerts
    this.alerts.push(...newAlerts);
    
    // Keep only recent alerts (last 24 hours)
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > dayAgo);

    // Log critical alerts
    newAlerts.filter(alert => alert.severity === 'critical').forEach(alert => {
      logger.error('Hardware alert triggered', alert);
    });
  }

  /**
   * Get current hardware metrics
   */
  getMetrics(): SimpleHardwareMetrics | null {
    return this.metrics;
  }

  /**
   * Get hardware alerts
   */
  getAlerts(): HardwareAlert[] {
    return this.alerts;
  }

  /**
   * Get hardware health status
   */
  getHealthStatus(): 'healthy' | 'degraded' | 'unhealthy' {
    if (!this.metrics) return 'unhealthy';

    const criticalAlerts = this.alerts.filter(alert => 
      alert.severity === 'critical' && 
      alert.timestamp > Date.now() - (5 * 60 * 1000) // Last 5 minutes
    );

    const warningAlerts = this.alerts.filter(alert => 
      alert.severity === 'medium' && 
      alert.timestamp > Date.now() - (5 * 60 * 1000) // Last 5 minutes
    );

    if (criticalAlerts.length > 0) return 'unhealthy';
    if (warningAlerts.length > 0) return 'degraded';
    return 'healthy';
  }

  /**
   * Get formatted metrics for display
   */
  getFormattedMetrics(): any {
    if (!this.metrics) return null;

    return {
      cpu: {
        usage: `${this.metrics.cpu.usage}%`,
        cores: this.metrics.cpu.cores
      },
      memory: {
        total: this.formatBytes(this.metrics.memory.total),
        used: this.formatBytes(this.metrics.memory.used),
        free: this.formatBytes(this.metrics.memory.free),
        usagePercent: `${this.metrics.memory.usagePercent}%`
      },
      system: {
        uptime: this.formatUptime(this.metrics.system.uptime),
        platform: this.metrics.system.platform,
        arch: this.metrics.system.arch,
        hostname: this.metrics.system.hostname
      },
      lastUpdate: new Date(this.lastUpdate).toISOString(),
      alerts: this.alerts.slice(-10) // Last 10 alerts
    };
  }

  /**
   * Format bytes to human readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Format uptime to human readable format
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
}

// Export singleton instance
export const simpleHardwareMonitorService = new SimpleHardwareMonitorService();
