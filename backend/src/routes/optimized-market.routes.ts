import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPrisma } from '../lib/prisma';
import { createLogger } from '../lib/logger';
import { VolatileMarketDataService } from '../services/volatile-market-data.service';
import { SecureQueryOptimizerService } from '../services/secure-query-optimizer.service';
import { AdvancedQueryOptimizerService } from '../services/advanced-query-optimizer.service';

const logger = createLogger('optimized-market-routes');

export async function optimizedMarketRoutes(fastify: FastifyInstance) {
  const prisma = await getPrisma();
  const marketDataService = new VolatileMarketDataService(prisma, logger);
  const queryOptimizer = new SecureQueryOptimizerService(prisma, logger);
  const advancedOptimizer = new AdvancedQueryOptimizerService(prisma, logger);

  /**
   * GET /api/market/index/optimized
   * 
   * Endpoint otimizado para dados de mercado com segurança rigorosa
   * 
   * ⚠️ PRINCÍPIOS CRÍTICOS:
   * - Cache máximo de 30 segundos
   * - NUNCA usa dados antigos ou simulados
   * - Validação rigorosa de timestamps
   * - Erro transparente quando dados indisponíveis
   */
  fastify.get('/api/market/index/optimized', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('Optimized market data requested');

      // Usar serviço de dados de mercado voláteis
      const result = await marketDataService.getMarketDataWithFallback();

      if (!result.success) {
        logger.warn('Market data unavailable - returning error', {
          error: result.error,
          message: result.message
        });

        return reply.status(503).send({
          success: false,
          error: result.error || 'SERVICE_UNAVAILABLE',
          message: result.message || 'Market data temporarily unavailable - for safety, we do not display outdated data in volatile markets',
          timestamp: Date.now()
        });
      }

      // Validar dados antes de retornar
      if (!result.data || !isValidMarketData(result.data)) {
        logger.error('Invalid market data received from service', { data: result.data });
        
        return reply.status(503).send({
          success: false,
          error: 'INVALID_DATA',
          message: 'Invalid market data received - for safety, we do not display invalid data in volatile markets',
          timestamp: Date.now()
        });
      }

      logger.info('Optimized market data returned successfully', {
        source: result.data.source,
        index: result.data.index,
        timestamp: result.data.timestamp
      });

      return reply.send({
        success: true,
        data: result.data,
        timestamp: Date.now(),
        cacheInfo: {
          maxAge: 30000, // 30 segundos
          isStale: false
        }
      });

    } catch (error) {
      logger.error('Optimized market data endpoint error', {
        error: (error as Error).message
      });

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Internal server error - for safety, we do not display potentially outdated data in volatile markets',
        timestamp: Date.now()
      });
    }
  });

  /**
   * GET /api/market/analytics/optimized
   * 
   * Endpoint otimizado para analytics de mercado
   */
  fastify.get('/api/market/analytics/optimized', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.query as { userId?: string };
      
      if (!userId) {
        return reply.status(400).send({
          success: false,
          error: 'MISSING_USER_ID',
          message: 'User ID is required for analytics'
        });
      }

      logger.info('Optimized market analytics requested', { userId });

      // Usar cache inteligente para analytics
      const analytics = await queryOptimizer.getHistoricalData(
        `market_analytics:${userId}`,
        async () => {
          return await advancedOptimizer.getTradingAnalyticsOptimized(
            userId,
            {
              start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias
              end: new Date()
            },
            'day'
          );
        }
      );

      return reply.send({
        success: true,
        data: analytics,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error('Optimized market analytics endpoint error', {
        error: (error as Error).message
      });

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch market analytics'
      });
    }
  });

  /**
   * GET /api/market/dashboard/optimized
   * 
   * Endpoint otimizado para dados de dashboard
   */
  fastify.get('/api/market/dashboard/optimized', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.query as { userId?: string };
      
      if (!userId) {
        return reply.status(400).send({
          success: false,
          error: 'MISSING_USER_ID',
          message: 'User ID is required for dashboard data'
        });
      }

      logger.info('Optimized dashboard data requested', { userId });

      // Usar cache inteligente para dashboard
      const dashboardData = await queryOptimizer.getUserData(
        `dashboard:${userId}`,
        async () => {
          return await advancedOptimizer.getDashboardMetricsOptimized(userId);
        }
      );

      return reply.send({
        success: true,
        data: dashboardData,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error('Optimized dashboard endpoint error', {
        error: (error as Error).message
      });

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch dashboard data'
      });
    }
  });

  /**
   * GET /api/market/performance/optimized
   * 
   * Endpoint para métricas de performance de queries
   */
  fastify.get('/api/market/performance/optimized', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      logger.info('Query performance metrics requested');

      const [cacheStats, queryMetrics, indexAnalysis] = await Promise.all([
        queryOptimizer.getCacheStats(),
        queryOptimizer.getQueryMetrics(),
        advancedOptimizer.analyzeQueryPerformance()
      ]);

      return reply.send({
        success: true,
        data: {
          cache: cacheStats,
          queries: queryMetrics,
          indexes: indexAnalysis
        },
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error('Query performance metrics endpoint error', {
        error: (error as Error).message
      });

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch performance metrics'
      });
    }
  });

  /**
   * POST /api/market/cache/invalidate
   * 
   * Endpoint para invalidar cache
   */
  fastify.post('/api/market/cache/invalidate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { type, pattern } = request.body as { type?: string; pattern?: string };
      
      logger.info('Cache invalidation requested', { type, pattern });

      let invalidated = 0;

      if (type === 'market') {
        invalidated = queryOptimizer.invalidateByDataType('market');
      } else if (type === 'historical') {
        invalidated = queryOptimizer.invalidateByDataType('historical');
      } else if (type === 'user') {
        invalidated = queryOptimizer.invalidateByDataType('user');
      } else if (type === 'all') {
        queryOptimizer.clearCache();
        invalidated = -1; // Indica que todo cache foi limpo
      } else if (pattern) {
        invalidated = queryOptimizer.invalidatePattern(pattern);
      } else {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Either type or pattern must be specified'
        });
      }

      return reply.send({
        success: true,
        data: {
          invalidated,
          type: type || 'pattern',
          pattern: pattern || null
        },
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error('Cache invalidation endpoint error', {
        error: (error as Error).message
      });

      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to invalidate cache'
      });
    }
  });
}

/**
 * Valida se dados de mercado são válidos
 */
function isValidMarketData(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  if (typeof data.index !== 'number' || data.index <= 0) {
    return false;
  }

  if (typeof data.timestamp !== 'number' || data.timestamp <= 0) {
    return false;
  }

  if (!data.source || !['lnmarkets', 'binance', 'coingecko'].includes(data.source)) {
    return false;
  }

  return true;
}
