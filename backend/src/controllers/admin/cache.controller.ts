import { FastifyRequest, FastifyReply } from 'fastify';
import { cacheManager } from '../../services/cache-manager.service';
import { strategicCache } from '../../services/strategic-cache.service';

export class CacheController {
  /**
   * Obtém métricas de cache
   */
  async getMetrics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const metrics = await cacheManager.getCacheMetrics();
      
      return reply.status(200).send({
        success: true,
        data: {
          metrics,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'CACHE_METRICS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get cache metrics',
      });
    }
  }

  /**
   * Obtém informações do cache
   */
  async getInfo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const info = await cacheManager.getCacheInfo();
      
      return reply.status(200).send({
        success: true,
        data: {
          info,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'CACHE_INFO_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get cache info',
      });
    }
  }

  /**
   * Verifica saúde do cache
   */
  async healthCheck(request: FastifyRequest, reply: FastifyReply) {
    try {
      const health = await cacheManager.healthCheck();
      
      return reply.status(200).send({
        success: true,
        data: {
          health,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'CACHE_HEALTH_ERROR',
        message: error instanceof Error ? error.message : 'Failed to check cache health',
      });
    }
  }

  /**
   * Reseta métricas de cache
   */
  async resetMetrics(request: FastifyRequest, reply: FastifyReply) {
    try {
      await cacheManager.resetCacheMetrics();
      
      return reply.status(200).send({
        success: true,
        message: 'Cache metrics reset successfully',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'CACHE_RESET_ERROR',
        message: error instanceof Error ? error.message : 'Failed to reset cache metrics',
      });
    }
  }

  /**
   * Limpa cache por estratégia e padrão
   */
  async clearCache(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { strategy, pattern } = request.body as { strategy: string; pattern: string };
      
      if (!strategy) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Strategy is required',
        });
      }

      const clearedCount = await cacheManager.clearCachePattern(strategy, pattern || '*');
      
      return reply.status(200).send({
        success: true,
        data: {
          strategy,
          pattern: pattern || '*',
          clearedCount,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'CACHE_CLEAR_ERROR',
        message: error instanceof Error ? error.message : 'Failed to clear cache',
      });
    }
  }

  /**
   * Invalida cache de usuário específico
   */
  async invalidateUserCache(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { userId } = request.params as { userId: string };
      
      if (!userId) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'User ID is required',
        });
      }

      await cacheManager.clearUserCache(userId);
      
      return reply.status(200).send({
        success: true,
        message: `Cache cleared for user ${userId}`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'CACHE_INVALIDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to invalidate user cache',
      });
    }
  }

  /**
   * Invalida cache de configurações do sistema
   */
  async invalidateSystemConfig(request: FastifyRequest, reply: FastifyReply) {
    try {
      await cacheManager.invalidateSystemConfig();
      
      return reply.status(200).send({
        success: true,
        message: 'System configuration cache invalidated',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'CACHE_INVALIDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to invalidate system config cache',
      });
    }
  }

  /**
   * Invalida cache de planos
   */
  async invalidatePlansCache(request: FastifyRequest, reply: FastifyReply) {
    try {
      await cacheManager.invalidatePlans();
      
      return reply.status(200).send({
        success: true,
        message: 'Plans cache invalidated',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'CACHE_INVALIDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to invalidate plans cache',
      });
    }
  }

  /**
   * Invalida cache de dados de mercado
   */
  async invalidateMarketData(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { symbol } = request.body as { symbol: string };
      
      if (!symbol) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Symbol is required',
        });
      }

      await cacheManager.invalidateMarketData(symbol);
      
      return reply.status(200).send({
        success: true,
        message: `Market data cache invalidated for ${symbol}`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'CACHE_INVALIDATE_ERROR',
        message: error instanceof Error ? error.message : 'Failed to invalidate market data cache',
      });
    }
  }

  /**
   * Obtém estatísticas de cache por estratégia
   */
  async getStrategyStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { strategy } = request.params as { strategy: string };
      
      if (!strategy) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_REQUEST',
          message: 'Strategy is required',
        });
      }

      // Obter informações do Redis para a estratégia
      const info = await strategicCache.getCacheInfo();
      const metrics = strategicCache.getMetrics();
      
      return reply.status(200).send({
        success: true,
        data: {
          strategy,
          metrics,
          info,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'CACHE_STATS_ERROR',
        message: error instanceof Error ? error.message : 'Failed to get strategy stats',
      });
    }
  }

  /**
   * Ping Redis
   */
  async ping(request: FastifyRequest, reply: FastifyReply) {
    try {
      const pingResult = await strategicCache.ping();
      
      return reply.status(200).send({
        success: true,
        data: {
          ping: pingResult,
          connected: strategicCache.isRedisConnected(),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: 'CACHE_PING_ERROR',
        message: error instanceof Error ? error.message : 'Failed to ping Redis',
      });
    }
  }
}
