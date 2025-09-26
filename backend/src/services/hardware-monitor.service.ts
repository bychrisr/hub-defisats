/**
 * Hardware Monitor Service
 * 
 * Monitors physical server hardware metrics
 */

import * as si from 'systeminformation';
import { logger } from '../utils/logger';

export interface HardwareMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
    swapTotal: number;
    swapUsed: number;
    swapFree: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
    readSpeed: number;
    writeSpeed: number;
  };
  network: {
    interfaces: Array<{
      name: string;
      bytesReceived: number;
      bytesSent: number;
      packetsReceived: number;
      packetsSent: number;
    }>;
  };
  system: {
    uptime: number;
    platform: string;
    arch: string;
    hostname: string;
    loadAverage: number[];
  };
}

export interface HardwareAlert {
  type: 'cpu' | 'memory' | 'disk' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export class HardwareMonitorService {
  private metrics: HardwareMetrics | null = null;
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
    },
    disk: {
      warning: 85,
      critical: 95
    },
    network: {
      warning: 1000, // MB/s
      critical: 2000 // MB/s
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
    
    logger.info('Hardware monitoring started', { interval: this.updateInterval });
  }

  /**
   * Collect hardware metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Collect all metrics in parallel
      const [
        cpuData,
        memoryData,
        diskData,
        networkData,
        systemData
      ] = await Promise.all([
        this.getCpuMetrics(),
        this.getMemoryMetrics(),
        this.getDiskMetrics(),
        this.getNetworkMetrics(),
        this.getSystemMetrics()
      ]);

      this.metrics = {
        cpu: cpuData,
        memory: memoryData,
        disk: diskData,
        network: networkData,
        system: systemData
      };

      this.lastUpdate = Date.now();
      
      // Check for alerts
      this.checkAlerts();
      
      const collectionTime = Date.now() - startTime;
      logger.debug('Hardware metrics collected', { 
        collectionTime: `${collectionTime}ms`,
        cpuUsage: `${cpuData.usage}%`,
        memoryUsage: `${memoryData.usagePercent}%`,
        diskUsage: `${diskData.usagePercent}%`
      });

    } catch (error: any) {
      logger.error('Failed to collect hardware metrics', { error: error.message });
    }
  }

  /**
   * Get CPU metrics
   */
  private async getCpuMetrics(): Promise<HardwareMetrics['cpu']> {
    try {
      const [cpu, cpuTemp] = await Promise.all([
        si.currentLoad(),
        si.cpuTemperature().catch(() => ({ main: null }))
      ]);

      return {
        usage: Math.round(cpu.currentLoad || 0),
        cores: cpu.cpus?.length || 0,
        temperature: cpuTemp.main || undefined,
        loadAverage: Array.isArray(cpu.avgLoad) ? cpu.avgLoad : [0, 0, 0]
      };
    } catch (error) {
      logger.warn('Failed to get CPU metrics', { error: error.message });
      return {
        usage: 0,
        cores: 0,
        loadAverage: [0, 0, 0]
      };
    }
  }

  /**
   * Get memory metrics
   */
  private async getMemoryMetrics(): Promise<HardwareMetrics['memory']> {
    try {
      const mem = await si.mem();
      
      return {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        usagePercent: Math.round((mem.used / mem.total) * 100),
        swapTotal: mem.swaptotal,
        swapUsed: mem.swapused,
        swapFree: mem.swapfree
      };
    } catch (error) {
      logger.warn('Failed to get memory metrics', { error: error.message });
      return {
        total: 0,
        used: 0,
        free: 0,
        usagePercent: 0,
        swapTotal: 0,
        swapUsed: 0,
        swapFree: 0
      };
    }
  }

  /**
   * Get disk metrics
   */
  private async getDiskMetrics(): Promise<HardwareMetrics['disk']> {
    try {
      const [fsSize, diskIO] = await Promise.all([
        si.fsSize(),
        si.disksIO().catch(() => ({ rIO_sec: 0, wIO_sec: 0 }))
      ]);

      // Get root filesystem (usually the first one)
      const rootFs = fsSize.find(fs => fs.mount === '/') || fsSize[0];
      
      if (!rootFs) {
        throw new Error('No filesystem found');
      }

      return {
        total: rootFs.size,
        used: rootFs.used,
        free: rootFs.available,
        usagePercent: Math.round((rootFs.used / rootFs.size) * 100),
        readSpeed: diskIO.rIO_sec || 0,
        writeSpeed: diskIO.wIO_sec || 0
      };
    } catch (error) {
      logger.warn('Failed to get disk metrics', { error: error.message });
      return {
        total: 0,
        used: 0,
        free: 0,
        usagePercent: 0,
        readSpeed: 0,
        writeSpeed: 0
      };
    }
  }

  /**
   * Get network metrics
   */
  private async getNetworkMetrics(): Promise<HardwareMetrics['network']> {
    try {
      const networkStats = await si.networkStats();
      
      return {
        interfaces: networkStats.map(iface => ({
          name: iface.iface,
          bytesReceived: iface.rx_bytes || 0,
          bytesSent: iface.tx_bytes || 0,
          packetsReceived: iface.rx_sec || 0,
          packetsSent: iface.tx_sec || 0
        }))
      };
    } catch (error) {
      logger.warn('Failed to get network metrics', { error: error.message });
      return {
        interfaces: []
      };
    }
  }

  /**
   * Get system metrics
   */
  private async getSystemMetrics(): Promise<HardwareMetrics['system']> {
    try {
      const [system, uptime] = await Promise.all([
        si.system(),
        si.time()
      ]);

      return {
        uptime: uptime.uptime,
        platform: system.platform || 'unknown',
        arch: system.arch || 'unknown',
        hostname: system.hostname || 'unknown',
        loadAverage: Array.isArray(uptime.load) ? uptime.load : [0, 0, 0]
      };
    } catch (error) {
      logger.warn('Failed to get system metrics', { error: error.message });
      return {
        uptime: 0,
        platform: 'unknown',
        arch: 'unknown',
        hostname: 'unknown',
        loadAverage: [0, 0, 0]
      };
    }
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

    // Disk alerts
    if (this.metrics.disk.usagePercent >= this.thresholds.disk.critical) {
      newAlerts.push({
        type: 'disk',
        severity: 'critical',
        message: `Disk usage critical: ${this.metrics.disk.usagePercent}%`,
        value: this.metrics.disk.usagePercent,
        threshold: this.thresholds.disk.critical,
        timestamp: Date.now()
      });
    } else if (this.metrics.disk.usagePercent >= this.thresholds.disk.warning) {
      newAlerts.push({
        type: 'disk',
        severity: 'medium',
        message: `Disk usage high: ${this.metrics.disk.usagePercent}%`,
        value: this.metrics.disk.usagePercent,
        threshold: this.thresholds.disk.warning,
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
  getMetrics(): HardwareMetrics | null {
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
        cores: this.metrics.cpu.cores,
        temperature: this.metrics.cpu.temperature ? `${this.metrics.cpu.temperature}°C` : 'N/A',
        loadAverage: this.metrics.cpu.loadAverage.map(load => load.toFixed(2))
      },
      memory: {
        total: this.formatBytes(this.metrics.memory.total),
        used: this.formatBytes(this.metrics.memory.used),
        free: this.formatBytes(this.metrics.memory.free),
        usagePercent: `${this.metrics.memory.usagePercent}%`,
        swap: {
          total: this.formatBytes(this.metrics.memory.swapTotal),
          used: this.formatBytes(this.metrics.memory.swapUsed),
          free: this.formatBytes(this.metrics.memory.swapFree)
        }
      },
      disk: {
        total: this.formatBytes(this.metrics.disk.total),
        used: this.formatBytes(this.metrics.disk.used),
        free: this.formatBytes(this.metrics.disk.free),
        usagePercent: `${this.metrics.disk.usagePercent}%`,
        readSpeed: `${this.metrics.disk.readSpeed} IO/s`,
        writeSpeed: `${this.metrics.disk.writeSpeed} IO/s`
      },
      system: {
        uptime: this.formatUptime(this.metrics.system.uptime),
        platform: this.metrics.system.platform,
        arch: this.metrics.system.arch,
        hostname: this.metrics.system.hostname,
        loadAverage: this.metrics.system.loadAverage.map(load => load.toFixed(2))
      },
      network: {
        interfaces: this.metrics.network.interfaces.map(iface => ({
          name: iface.name,
          bytesReceived: this.formatBytes(iface.bytesReceived),
          bytesSent: this.formatBytes(iface.bytesSent),
          packetsReceived: `${iface.packetsReceived}/s`,
          packetsSent: `${iface.packetsSent}/s`
        }))
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
export const hardwareMonitorService = new HardwareMonitorService();
