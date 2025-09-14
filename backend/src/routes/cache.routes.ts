import { FastifyInstance } from 'fastify';
import { cacheService } from '@/services/cache.service';
import { authMiddleware } from '@/middleware/auth.middleware';

export async function cacheRoutes(fastify: FastifyInstance) {
  // Aplicar middleware de autenticação em todas as rotas
  fastify.addHook('preHandler', authMiddleware);

  // Get cache statistics
  fastify.get('/cache/stats', {
    schema: {
      description: 'Get cache statistics',
      tags: ['Cache'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                used_memory: { type: 'string' },
                connected_clients: { type: 'string' },
                total_commands_processed: { type: 'string' },
                keyspace_hits: { type: 'string' },
                keyspace_misses: { type: 'string' },
              },
            },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      try {
        const stats = await cacheService.getStats();
        return {
          success: true,
          data: stats,
        };
      } catch (error) {
        fastify.log.error('Error getting cache stats:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get cache statistics',
        });
      }
    },
  });

  // Clear cache
  fastify.post('/cache/clear', {
    schema: {
      description: 'Clear all cache',
      tags: ['Cache'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      try {
        await cacheService.clear();
        return {
          success: true,
          message: 'Cache cleared successfully',
        };
      } catch (error) {
        fastify.log.error('Error clearing cache:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to clear cache',
        });
      }
    },
  });

  // Invalidate cache by pattern
  fastify.post('/cache/invalidate', {
    schema: {
      description: 'Invalidate cache by pattern',
      tags: ['Cache'],
      body: {
        type: 'object',
        required: ['pattern'],
        properties: {
          pattern: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      try {
        const { pattern } = _request.body as { pattern: string };
        await cacheService.invalidatePattern(pattern);
        return {
          success: true,
          message: `Cache invalidated for pattern: ${pattern}`,
        };
      } catch (error) {
        fastify.log.error('Error invalidating cache:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to invalidate cache',
        });
      }
    },
  });

  // Get cache value
  fastify.get('/cache/get/:key', {
    schema: {
      description: 'Get cache value by key',
      tags: ['Cache'],
      params: {
        type: 'object',
        properties: {
          key: { type: 'string' },
        },
        required: ['key'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {},
          },
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      try {
        const { key } = _request.params as { key: string };
        const value = await cacheService.get(key);

        if (value === null) {
          return reply.status(404).send({
            success: false,
            message: 'Key not found in cache',
          });
        }

        return {
          success: true,
          data: value,
        };
      } catch (error) {
        fastify.log.error('Error getting cache value:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get cache value',
        });
      }
    },
  });

  // Set cache value
  fastify.post('/cache/set', {
    schema: {
      description: 'Set cache value',
      tags: ['Cache'],
      body: {
        type: 'object',
        required: ['key', 'value'],
        properties: {
          key: { type: 'string' },
          value: {},
          ttl: { type: 'number' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      try {
        const { key, value, ttl } = _request.body as {
          key: string;
          value: any;
          ttl?: number;
        };
        await cacheService.set(key, value, ttl);
        return {
          success: true,
          message: 'Value set in cache successfully',
        };
      } catch (error) {
        fastify.log.error('Error setting cache value:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to set cache value',
        });
      }
    },
  });

  // Delete cache value
  fastify.delete('/cache/delete/:key', {
    schema: {
      description: 'Delete cache value by key',
      tags: ['Cache'],
      params: {
        type: 'object',
        properties: {
          key: { type: 'string' },
        },
        required: ['key'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async (_request, reply) => {
      try {
        const { key } = _request.params as { key: string };
        await cacheService.del(key);
        return {
          success: true,
          message: 'Value deleted from cache successfully',
        };
      } catch (error) {
        fastify.log.error('Error deleting cache value:', error as any);
        return reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete cache value',
        });
      }
    },
  });
}
