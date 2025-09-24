import { FastifyInstance } from 'fastify';
import { CacheController } from '../../controllers/admin/cache.controller';
import { dynamicRateLimiters } from '../../middleware/dynamic-rate-limit.middleware';

export async function cacheRoutes(fastify: FastifyInstance) {
  const controller = new CacheController();

  // Obtém métricas de cache
  fastify.get(
    '/metrics',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get cache metrics',
        tags: ['Admin', 'Cache'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  metrics: { type: 'object' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.getMetrics.bind(controller)
  );

  // Obtém informações do cache
  fastify.get(
    '/info',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get cache information',
        tags: ['Admin', 'Cache'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  info: { type: 'object' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.getInfo.bind(controller)
  );

  // Verifica saúde do cache
  fastify.get(
    '/health',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Check cache health',
        tags: ['Admin', 'Cache'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  health: { type: 'object' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.healthCheck.bind(controller)
  );

  // Reseta métricas de cache
  fastify.post(
    '/reset-metrics',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Reset cache metrics',
        tags: ['Admin', 'Cache'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    controller.resetMetrics.bind(controller)
  );

  // Limpa cache por estratégia e padrão
  fastify.post(
    '/clear',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Clear cache by strategy and pattern',
        tags: ['Admin', 'Cache'],
        body: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
            pattern: { type: 'string' },
          },
          required: ['strategy'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  strategy: { type: 'string' },
                  pattern: { type: 'string' },
                  clearedCount: { type: 'number' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.clearCache.bind(controller)
  );

  // Invalida cache de usuário específico
  fastify.post(
    '/invalidate-user/:userId',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Invalidate user cache',
        tags: ['Admin', 'Cache'],
        params: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
          },
          required: ['userId'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    controller.invalidateUserCache.bind(controller)
  );

  // Invalida cache de configurações do sistema
  fastify.post(
    '/invalidate-system-config',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Invalidate system configuration cache',
        tags: ['Admin', 'Cache'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    controller.invalidateSystemConfig.bind(controller)
  );

  // Invalida cache de planos
  fastify.post(
    '/invalidate-plans',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Invalidate plans cache',
        tags: ['Admin', 'Cache'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    controller.invalidatePlansCache.bind(controller)
  );

  // Invalida cache de dados de mercado
  fastify.post(
    '/invalidate-market-data',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Invalidate market data cache',
        tags: ['Admin', 'Cache'],
        body: {
          type: 'object',
          properties: {
            symbol: { type: 'string' },
          },
          required: ['symbol'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string' },
            },
          },
        },
      },
    },
    controller.invalidateMarketData.bind(controller)
  );

  // Obtém estatísticas de cache por estratégia
  fastify.get(
    '/stats/:strategy',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get cache statistics by strategy',
        tags: ['Admin', 'Cache'],
        params: {
          type: 'object',
          properties: {
            strategy: { type: 'string' },
          },
          required: ['strategy'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  strategy: { type: 'string' },
                  metrics: { type: 'object' },
                  info: { type: 'object' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.getStrategyStats.bind(controller)
  );

  // Ping Redis
  fastify.get(
    '/ping',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Ping Redis connection',
        tags: ['Admin', 'Cache'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  ping: { type: 'string' },
                  connected: { type: 'boolean' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    controller.ping.bind(controller)
  );
}
