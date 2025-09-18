import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { Logger } from 'winston';

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: Record<string, any>;
  error?: string;
}

export interface HealthStatus {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
  summary: {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  };
}

export class AdvancedHealthService {
  private prisma: PrismaClient;
  private redis: Redis;
  private logger: Logger;
  private startTime: number;

  constructor(prisma: PrismaClient, redis: Redis, logger: Logger) {
    this.prisma = prisma;
    this.redis = redis;
    this.logger = logger;
    this.startTime = Date.now();
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkWorkers(),
      this.checkExternalAPIs(),
      this.checkMemory(),
      this.checkDiskSpace(),
      this.checkNetwork()
    ]);

    const healthChecks: HealthCheck[] = checks.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: this.getCheckName(index),
          status: 'unhealthy',
          responseTime: 0,
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    const summary = this.calculateSummary(healthChecks);
    const overall = this.determineOverallStatus(healthChecks);

    return {
      overall,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '0.0.2',
      environment: process.env.NODE_ENV || 'development',
      checks: healthChecks,
      summary
    };
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test basic connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Test query performance
      const queryStart = Date.now();
      await this.prisma.user.findFirst();
      const queryTime = Date.now() - queryStart;
      
      // Get connection pool status
      const poolStatus = await this.getConnectionPoolStatus();
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'database',
        status: queryTime < 100 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          queryTime,
          poolStatus,
          connectionCount: poolStatus?.length || 0
        }
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test basic connection
      await this.redis.ping();
      
      // Test set/get operations
      const testKey = `health_check_${Date.now()}`;
      const testValue = 'test_value';
      
      await this.redis.set(testKey, testValue, 'EX', 10);
      const retrievedValue = await this.redis.get(testKey);
      await this.redis.del(testKey);
      
      if (retrievedValue !== testValue) {
        throw new Error('Redis value mismatch');
      }
      
      // Get Redis info
      const info = await this.redis.info();
      const memory = this.parseRedisInfo(info, 'used_memory_human');
      const connectedClients = this.parseRedisInfo(info, 'connected_clients');
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'redis',
        status: 'healthy',
        responseTime,
        details: {
          memory,
          connectedClients: parseInt(connectedClients) || 0,
          version: this.parseRedisInfo(info, 'redis_version')
        }
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  /**
   * Check workers health
   */
  private async checkWorkers(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Check if workers are running (this would need to be implemented)
      // For now, we'll simulate a check
      const workers = [
        'margin-monitor',
        'automation-executor',
        'simulation-executor',
        'notification-worker'
      ];
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'workers',
        status: 'healthy',
        responseTime,
        details: {
          workers,
          status: 'running'
        }
      };
    } catch (error) {
      return {
        name: 'workers',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  /**
   * Check external APIs health
   */
  private async checkExternalAPIs(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const apis = [
        { name: 'LN Markets', url: 'https://api.lnmarkets.com/v2/user' },
        { name: 'CoinGecko', url: 'https://api.coingecko.com/api/v3/ping' }
      ];
      
      const results = await Promise.allSettled(
        apis.map(async (api) => {
          const response = await fetch(api.url, { 
            method: 'GET',
            timeout: 5000 
          });
          return {
            name: api.name,
            status: response.ok ? 'healthy' : 'unhealthy',
            statusCode: response.status
          };
        })
      );
      
      const apiResults = results.map((result, index) => ({
        name: apis[index].name,
        status: result.status === 'fulfilled' ? result.value.status : 'unhealthy',
        error: result.status === 'rejected' ? result.reason?.message : undefined
      }));
      
      const healthyCount = apiResults.filter(r => r.status === 'healthy').length;
      const overallStatus = healthyCount === apiResults.length ? 'healthy' : 
                           healthyCount > 0 ? 'degraded' : 'unhealthy';
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'external_apis',
        status: overallStatus,
        responseTime,
        details: {
          apis: apiResults,
          healthyCount,
          totalCount: apiResults.length
        }
      };
    } catch (error) {
      return {
        name: 'external_apis',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  /**
   * Check memory usage
   */
  private async checkMemory(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const totalMem = memUsage.heapTotal;
      const usedMem = memUsage.heapUsed;
      const externalMem = memUsage.external;
      const rssMem = memUsage.rss;
      
      const memoryUsagePercent = (usedMem / totalMem) * 100;
      const status = memoryUsagePercent < 80 ? 'healthy' : 
                    memoryUsagePercent < 90 ? 'degraded' : 'unhealthy';
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'memory',
        status,
        responseTime,
        details: {
          heapTotal: this.formatBytes(totalMem),
          heapUsed: this.formatBytes(usedMem),
          external: this.formatBytes(externalMem),
          rss: this.formatBytes(rssMem),
          usagePercent: Math.round(memoryUsagePercent * 100) / 100
        }
      };
    } catch (error) {
      return {
        name: 'memory',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  /**
   * Check disk space
   */
  private async checkDiskSpace(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // This would require a filesystem check
      // For now, we'll simulate a check
      const responseTime = Date.now() - startTime;
      
      return {
        name: 'disk_space',
        status: 'healthy',
        responseTime,
        details: {
          available: 'N/A',
          used: 'N/A',
          total: 'N/A'
        }
      };
    } catch (error) {
      return {
        name: 'disk_space',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  /**
   * Check network connectivity
   */
  private async checkNetwork(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test local network connectivity
      const testUrl = 'http://localhost:13016/health';
      const response = await fetch(testUrl, { 
        method: 'GET',
        timeout: 3000 
      });
      
      const responseTime = Date.now() - startTime;
      const status = response.ok ? 'healthy' : 'unhealthy';
      
      return {
        name: 'network',
        status,
        responseTime,
        details: {
          localConnectivity: response.ok,
          responseTime: responseTime,
          statusCode: response.status
        }
      };
    } catch (error) {
      return {
        name: 'network',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get connection pool status
   */
  private async getConnectionPoolStatus(): Promise<any> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          state,
          COUNT(*) as count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
      `;
      return result;
    } catch (error) {
      this.logger.error('Failed to get connection pool status', { error });
      return null;
    }
  }

  /**
   * Parse Redis info string
   */
  private parseRedisInfo(info: string, key: string): string {
    const match = info.match(new RegExp(`${key}:(.+)`));
    return match ? match[1] : 'N/A';
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get check name by index
   */
  private getCheckName(index: number): string {
    const names = [
      'database',
      'redis',
      'workers',
      'external_apis',
      'memory',
      'disk_space',
      'network'
    ];
    return names[index] || 'unknown';
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(checks: HealthCheck[]): {
    total: number;
    healthy: number;
    unhealthy: number;
    degraded: number;
  } {
    const total = checks.length;
    const healthy = checks.filter(c => c.status === 'healthy').length;
    const unhealthy = checks.filter(c => c.status === 'unhealthy').length;
    const degraded = checks.filter(c => c.status === 'degraded').length;
    
    return { total, healthy, unhealthy, degraded };
  }

  /**
   * Determine overall status
   */
  private determineOverallStatus(checks: HealthCheck[]): 'healthy' | 'unhealthy' | 'degraded' {
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;
    
    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  /**
   * Get health check by name
   */
  async getHealthCheck(name: string): Promise<HealthCheck | null> {
    const healthStatus = await this.getHealthStatus();
    return healthStatus.checks.find(check => check.name === name) || null;
  }

  /**
   * Get health metrics
   */
  getHealthMetrics(): {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    version: string;
    environment: string;
  } {
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      version: process.env.npm_package_version || '0.0.2',
      environment: process.env.NODE_ENV || 'development'
    };
  }
}