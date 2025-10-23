import { FastifyRequest, FastifyReply } from 'fastify';
import { getPrisma } from '../../lib/prisma';
import { createLogger } from 'winston';
import { UnifiedAdminOptimizationService } from '../../services/unified-admin-optimization.service';

const logger = createLogger({
  level: 'info',
  format: require('winston').format.simple(),
  transports: [new (require('winston').transports.Console)()]
});

interface OptimizationQuery {
  action?: 'metrics' | 'recommendations' | 'execute' | 'report';
  type?: 'database' | 'cache' | 'market' | 'all';
  force?: boolean;
}

export class OptimizationManagementController {
  private prisma: any;
  private optimizationService: UnifiedAdminOptimizationService;

  constructor() {
    this.initializeServices();
  }

  private async initializeServices() {
    this.prisma = await getPrisma();
    this.optimizationService = new UnifiedAdminOptimizationService(this.prisma, logger);
  }

  /**
   * GET /api/admin/optimization/metrics
   * 
   * Obtém métricas unificadas de otimização
   */
  async getOptimizationMetrics(req: FastifyRequest<{ Querystring: OptimizationQuery }>, reply: FastifyReply) {
    try {
      const { type = 'all' } = req.query;

      logger.info('Optimization metrics requested', { type });

      const metrics = await this.optimizationService.getUnifiedMetrics();

      // Filtrar métricas por tipo se especificado
      let filteredMetrics = metrics;
      if (type !== 'all') {
        filteredMetrics = {
          ...metrics,
          // Manter apenas o tipo solicitado
          [type === 'database' ? 'databaseHealth' : 
           type === 'cache' ? 'cachePerformance' :
           type === 'market' ? 'marketDataSafety' : 'queryPerformance']: 
          metrics[type === 'database' ? 'databaseHealth' : 
                  type === 'cache' ? 'cachePerformance' :
                  type === 'market' ? 'marketDataSafety' : 'queryPerformance']
        };
      }

      return reply.send({
        success: true,
        data: {
          metrics: filteredMetrics,
          timestamp: Date.now(),
          type
        }
      });

    } catch (error) {
      logger.error('Failed to get optimization metrics', {
        error: (error as Error).message
      });

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch optimization metrics'
      });
    }
  }

  /**
   * GET /api/admin/optimization/recommendations
   * 
   * Obtém recomendações de otimização
   */
  async getOptimizationRecommendations(req: FastifyRequest<{ Querystring: OptimizationQuery }>, reply: FastifyReply) {
    try {
      const { type = 'all' } = req.query;

      logger.info('Optimization recommendations requested', { type });

      const recommendations = await this.optimizationService.getOptimizationRecommendations();

      // Filtrar recomendações por tipo se especificado
      let filteredRecommendations = recommendations;
      if (type !== 'all') {
        filteredRecommendations = {
          database: type === 'database' ? recommendations.database : { createIndexes: [], removeIndexes: [], optimizeQueries: [] },
          cache: type === 'cache' ? recommendations.cache : { invalidatePatterns: [], adjustTTL: [] },
          marketData: type === 'market' ? recommendations.marketData : { forceRefresh: false, clearCache: false }
        };
      }

      return reply.send({
        success: true,
        data: {
          recommendations: filteredRecommendations,
          timestamp: Date.now(),
          type
        }
      });

    } catch (error) {
      logger.error('Failed to get optimization recommendations', {
        error: (error as Error).message
      });

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch optimization recommendations'
      });
    }
  }

  /**
   * POST /api/admin/optimization/execute
   * 
   * Executa otimizações automáticas
   */
  async executeOptimizations(req: FastifyRequest<{ Querystring: OptimizationQuery }>, reply: FastifyReply) {
    try {
      const { type = 'all', force = false } = req.query;

      logger.info('Optimization execution requested', { type, force });

      const result = await this.optimizationService.executeAutomaticOptimizations();

      return reply.send({
        success: true,
        data: {
          executed: result.executed,
          failed: result.failed,
          timestamp: Date.now(),
          type,
          force
        }
      });

    } catch (error) {
      logger.error('Failed to execute optimizations', {
        error: (error as Error).message
      });

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to execute optimizations'
      });
    }
  }

  /**
   * GET /api/admin/optimization/report
   * 
   * Obtém relatório detalhado de performance
   */
  async getPerformanceReport(req: FastifyRequest<{ Querystring: OptimizationQuery }>, reply: FastifyReply) {
    try {
      logger.info('Performance report requested');

      const report = await this.optimizationService.getDetailedPerformanceReport();

      return reply.send({
        success: true,
        data: {
          report,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      logger.error('Failed to get performance report', {
        error: (error as Error).message
      });

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to generate performance report'
      });
    }
  }

  /**
   * POST /api/admin/optimization/cache/invalidate
   * 
   * Invalida cache específico
   */
  async invalidateCache(req: FastifyRequest<{ 
    Body: { 
      type?: 'market' | 'user' | 'historical' | 'all';
      pattern?: string;
    }
  }>, reply: FastifyReply) {
    try {
      const { type, pattern } = req.body;

      logger.info('Cache invalidation requested', { type, pattern });

      if (!type && !pattern) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Either type or pattern must be specified'
        });
      }

      // TODO: Implementar invalidação de cache específica
      // Por enquanto, retornar sucesso mockado
      const result = {
        invalidated: type === 'all' ? -1 : 1,
        type: type || 'pattern',
        pattern: pattern || null
      };

      return reply.send({
        success: true,
        data: {
          ...result,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      logger.error('Failed to invalidate cache', {
        error: (error as Error).message
      });

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to invalidate cache'
      });
    }
  }

  /**
   * GET /api/admin/optimization/health
   * 
   * Obtém status de saúde das otimizações
   */
  async getOptimizationHealth(req: FastifyRequest, reply: FastifyReply) {
    try {
      logger.info('Optimization health check requested');

      const metrics = await this.optimizationService.getUnifiedMetrics();

      // Determinar status de saúde baseado nas métricas
      const healthStatus = this.calculateHealthStatus(metrics);

      return reply.send({
        success: true,
        data: {
          status: healthStatus.status,
          score: healthStatus.score,
          issues: healthStatus.issues,
          recommendations: healthStatus.recommendations,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      logger.error('Failed to get optimization health', {
        error: (error as Error).message
      });

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to check optimization health'
      });
    }
  }

  /**
   * Calcula status de saúde baseado nas métricas
   */
  private calculateHealthStatus(metrics: any) {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Verificar performance de queries
    if (metrics.queryPerformance.averageExecutionTime > 1000) {
      issues.push('Slow query performance detected');
      recommendations.push('Consider optimizing database queries');
      score -= 20;
    }

    if (metrics.queryPerformance.cacheHitRate < 0.5) {
      issues.push('Low cache hit rate');
      recommendations.push('Review cache configuration and TTL settings');
      score -= 15;
    }

    // Verificar saúde do banco
    if (metrics.databaseHealth.slowQueries > 10) {
      issues.push('Multiple slow database queries detected');
      recommendations.push('Create additional database indexes');
      score -= 25;
    }

    if (metrics.databaseHealth.unusedIndexes > 5) {
      issues.push('Multiple unused database indexes');
      recommendations.push('Remove unused indexes to improve write performance');
      score -= 10;
    }

    // Verificar dados de mercado
    if (metrics.marketDataSafety.isStale) {
      issues.push('Market data is stale');
      recommendations.push('Force refresh market data cache');
      score -= 30;
    }

    // Verificar saúde do sistema
    if (metrics.systemHealth.memoryUsage > 1024 * 1024 * 1024) { // 1GB
      issues.push('High memory usage detected');
      recommendations.push('Consider increasing memory or optimizing memory usage');
      score -= 15;
    }

    const status = score >= 80 ? 'healthy' : score >= 60 ? 'warning' : 'critical';

    return {
      status,
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }
}
