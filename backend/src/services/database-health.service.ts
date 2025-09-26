/**
 * Database Health Service
 * 
 * Specialized health checks for PostgreSQL database
 * including performance monitoring and connection management
 */

import { getPrisma } from '../lib/prisma';
import { logger } from '../utils/logger';

export interface DatabaseHealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  databaseSize: number;
  cacheHitRatio: number;
  slowQueries: number;
  locks: number;
  replicationLag?: number;
  lastVacuum?: number;
  lastAnalyze?: number;
}

export interface DatabasePerformanceMetrics {
  averageQueryTime: number;
  slowestQuery: {
    query: string;
    duration: number;
    calls: number;
  };
  topQueries: Array<{
    query: string;
    totalTime: number;
    calls: number;
    averageTime: number;
  }>;
  indexUsage: Array<{
    table: string;
    index: string;
    usage: number;
  }>;
}

export class DatabaseHealthService {
  private prisma: any;

  constructor() {
    // Will be initialized when needed
  }

  /**
   * Get comprehensive database health
   */
  async getDatabaseHealth(): Promise<DatabaseHealthMetrics> {
    const startTime = Date.now();
    
    try {
      this.prisma = await getPrisma();
      
      const [
        connectionInfo,
        databaseSize,
        cacheHitRatio,
        slowQueries,
        locks,
        maintenanceInfo
      ] = await Promise.all([
        this.getConnectionInfo(),
        this.getDatabaseSize(),
        this.getCacheHitRatio(),
        this.getSlowQueries(),
        this.getLockInfo(),
        this.getMaintenanceInfo()
      ]);

      const latency = Date.now() - startTime;
      
      // Determine status based on metrics
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (latency > 1000) status = 'degraded';
      if (latency > 5000) status = 'unhealthy';
      if (connectionInfo.activeConnections > 50) status = 'degraded';
      if (connectionInfo.activeConnections > 100) status = 'unhealthy';
      if (cacheHitRatio < 90) status = 'degraded';
      if (cacheHitRatio < 80) status = 'unhealthy';

      return {
        status,
        latency,
        activeConnections: connectionInfo.activeConnections,
        idleConnections: connectionInfo.idleConnections,
        totalConnections: connectionInfo.totalConnections,
        databaseSize,
        cacheHitRatio,
        slowQueries,
        locks,
        lastVacuum: maintenanceInfo.lastVacuum,
        lastAnalyze: maintenanceInfo.lastAnalyze
      };

    } catch (error: any) {
      logger.error('Database health check failed', error);
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        activeConnections: 0,
        idleConnections: 0,
        totalConnections: 0,
        databaseSize: 0,
        cacheHitRatio: 0,
        slowQueries: 0,
        locks: 0
      };
    }
  }

  /**
   * Get connection information
   */
  private async getConnectionInfo(): Promise<{
    activeConnections: number;
    idleConnections: number;
    totalConnections: number;
  }> {
    const result = await this.prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;

    return {
      totalConnections: Number(result[0].total_connections),
      activeConnections: Number(result[0].active_connections),
      idleConnections: Number(result[0].idle_connections)
    };
  }

  /**
   * Get database size
   */
  private async getDatabaseSize(): Promise<number> {
    const result = await this.prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size,
             pg_database_size(current_database()) as size_bytes
    `;

    return Number(result[0].size_bytes);
  }

  /**
   * Get cache hit ratio
   */
  private async getCacheHitRatio(): Promise<number> {
    const result = await this.prisma.$queryRaw`
      SELECT 
        round(
          (sum(blks_hit) * 100.0 / (sum(blks_hit) + sum(blks_read))), 2
        ) as cache_hit_ratio
      FROM pg_stat_database 
      WHERE datname = current_database()
    `;

    return parseFloat(result[0].cache_hit_ratio) || 0;
  }

  /**
   * Get slow queries count
   */
  private async getSlowQueries(): Promise<number> {
    const result = await this.prisma.$queryRaw`
      SELECT count(*) as slow_queries
      FROM pg_stat_statements 
      WHERE mean_exec_time > 1000
    `;

    return Number(result[0]?.slow_queries) || 0;
  }

  /**
   * Get lock information
   */
  private async getLockInfo(): Promise<number> {
    const result = await this.prisma.$queryRaw`
      SELECT count(*) as locks
      FROM pg_locks 
      WHERE NOT granted
    `;

    return Number(result[0].locks);
  }

  /**
   * Get maintenance information
   */
  private async getMaintenanceInfo(): Promise<{
    lastVacuum?: number;
    lastAnalyze?: number;
  }> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables 
        ORDER BY last_vacuum DESC NULLS LAST
        LIMIT 1
      `;

      return {
        lastVacuum: result[0]?.last_vacuum ? new Date(result[0].last_vacuum).getTime() : undefined,
        lastAnalyze: result[0]?.last_analyze ? new Date(result[0].last_analyze).getTime() : undefined
      };
    } catch {
      return {};
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<DatabasePerformanceMetrics> {
    try {
      const [
        averageQueryTime,
        slowestQuery,
        topQueries,
        indexUsage
      ] = await Promise.all([
        this.getAverageQueryTime(),
        this.getSlowestQuery(),
        this.getTopQueries(),
        this.getIndexUsage()
      ]);

      return {
        averageQueryTime,
        slowestQuery,
        topQueries,
        indexUsage
      };

    } catch (error: any) {
      logger.error('Failed to get performance metrics', error);
      return {
        averageQueryTime: 0,
        slowestQuery: { query: '', duration: 0, calls: 0 },
        topQueries: [],
        indexUsage: []
      };
    }
  }

  /**
   * Get average query time
   */
  private async getAverageQueryTime(): Promise<number> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT avg(mean_exec_time) as avg_time
        FROM pg_stat_statements
      `;

      return parseFloat(result[0]?.avg_time) || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Get slowest query
   */
  private async getSlowestQuery(): Promise<{
    query: string;
    duration: number;
    calls: number;
  }> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          query,
          mean_exec_time as duration,
          calls
        FROM pg_stat_statements 
        ORDER BY mean_exec_time DESC 
        LIMIT 1
      `;

      return {
        query: result[0]?.query || '',
        duration: parseFloat(result[0]?.duration) || 0,
        calls: Number(result[0]?.calls) || 0
      };
    } catch {
      return { query: '', duration: 0, calls: 0 };
    }
  }

  /**
   * Get top queries by total time
   */
  private async getTopQueries(): Promise<Array<{
    query: string;
    totalTime: number;
    calls: number;
    averageTime: number;
  }>> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          query,
          total_exec_time as total_time,
          calls,
          mean_exec_time as average_time
        FROM pg_stat_statements 
        ORDER BY total_exec_time DESC 
        LIMIT 10
      `;

      return result.map((row: any) => ({
        query: row.query,
        totalTime: parseFloat(row.total_time) || 0,
        calls: Number(row.calls) || 0,
        averageTime: parseFloat(row.average_time) || 0
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get index usage statistics
   */
  private async getIndexUsage(): Promise<Array<{
    table: string;
    index: string;
    usage: number;
  }>> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes 
        ORDER BY idx_tup_read DESC 
        LIMIT 10
      `;

      return result.map((row: any) => ({
        table: `${row.schemaname}.${row.tablename}`,
        index: row.indexname,
        usage: Number(row.idx_tup_read) || 0
      }));
    } catch {
      return [];
    }
  }

  /**
   * Optimize database performance
   */
  async optimizePerformance(): Promise<{
    success: boolean;
    actions: string[];
    errors: string[];
  }> {
    const actions: string[] = [];
    const errors: string[] = [];

    try {
      // Kill idle connections
      try {
        const result = await this.prisma.$queryRaw`
          SELECT pg_terminate_backend(pid) 
          FROM pg_stat_activity 
          WHERE state = 'idle' 
          AND state_change < now() - INTERVAL '1 hour'
        `;
        actions.push('Terminated idle connections');
      } catch (error: any) {
        errors.push(`Failed to terminate idle connections: ${error.message}`);
      }

      // Update table statistics
      try {
        await this.prisma.$queryRaw`ANALYZE`;
        actions.push('Updated table statistics');
      } catch (error: any) {
        errors.push(`Failed to update statistics: ${error.message}`);
      }

      // Vacuum if needed
      try {
        const vacuumNeeded = await this.prisma.$queryRaw`
          SELECT count(*) as tables_needing_vacuum
          FROM pg_stat_user_tables 
          WHERE n_dead_tup > 1000
        `;

        if (Number(vacuumNeeded[0].tables_needing_vacuum) > 0) {
          await this.prisma.$queryRaw`VACUUM`;
          actions.push('Performed vacuum');
        }
      } catch (error: any) {
        errors.push(`Failed to vacuum: ${error.message}`);
      }

      return {
        success: errors.length === 0,
        actions,
        errors
      };

    } catch (error: any) {
      errors.push(`Optimization failed: ${error.message}`);
      return {
        success: false,
        actions,
        errors
      };
    }
  }
}

// Export singleton instance
export const databaseHealthService = new DatabaseHealthService();
