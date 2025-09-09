"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheRoutes = cacheRoutes;
const cache_service_1 = require("@/services/cache.service");
const auth_middleware_1 = require("@/middleware/auth.middleware");
async function cacheRoutes(fastify) {
    fastify.addHook('preHandler', auth_middleware_1.authMiddleware);
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
            },
        },
        handler: async (_request, reply) => {
            try {
                const stats = await cache_service_1.cacheService.getStats();
                return {
                    success: true,
                    data: stats,
                };
            }
            catch (error) {
                fastify.log.error('Error getting cache stats:', error);
                return reply.status(500).send({
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to get cache statistics',
                });
            }
        },
    });
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
            },
        },
        handler: async (_request, reply) => {
            try {
                await cache_service_1.cacheService.clear();
                return {
                    success: true,
                    message: 'Cache cleared successfully',
                };
            }
            catch (error) {
                fastify.log.error('Error clearing cache:', error);
                return reply.status(500).send({
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to clear cache',
                });
            }
        },
    });
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
            },
        },
        handler: async (_request, reply) => {
            try {
                const { pattern } = _request.body;
                await cache_service_1.cacheService.invalidatePattern(pattern);
                return {
                    success: true,
                    message: `Cache invalidated for pattern: ${pattern}`,
                };
            }
            catch (error) {
                fastify.log.error('Error invalidating cache:', error);
                return reply.status(500).send({
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to invalidate cache',
                });
            }
        },
    });
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
                        data: { type: 'any' },
                    },
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                    },
                },
            },
        },
        handler: async (_request, reply) => {
            try {
                const { key } = _request.params;
                const value = await cache_service_1.cacheService.get(key);
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
            }
            catch (error) {
                fastify.log.error('Error getting cache value:', error);
                return reply.status(500).send({
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to get cache value',
                });
            }
        },
    });
    fastify.post('/cache/set', {
        schema: {
            description: 'Set cache value',
            tags: ['Cache'],
            body: {
                type: 'object',
                required: ['key', 'value'],
                properties: {
                    key: { type: 'string' },
                    value: { type: 'any' },
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
            },
        },
        handler: async (_request, reply) => {
            try {
                const { key, value, ttl } = _request.body;
                await cache_service_1.cacheService.set(key, value, ttl);
                return {
                    success: true,
                    message: 'Value set in cache successfully',
                };
            }
            catch (error) {
                fastify.log.error('Error setting cache value:', error);
                return reply.status(500).send({
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to set cache value',
                });
            }
        },
    });
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
            },
        },
        handler: async (_request, reply) => {
            try {
                const { key } = _request.params;
                await cache_service_1.cacheService.del(key);
                return {
                    success: true,
                    message: 'Value deleted from cache successfully',
                };
            }
            catch (error) {
                fastify.log.error('Error deleting cache value:', error);
                return reply.status(500).send({
                    error: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to delete cache value',
                });
            }
        },
    });
}
//# sourceMappingURL=cache.routes.js.map