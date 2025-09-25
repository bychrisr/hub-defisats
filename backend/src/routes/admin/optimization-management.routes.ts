import { FastifyInstance } from 'fastify';
import { OptimizationManagementController } from '../../controllers/admin/optimization-management.controller';
import { dynamicRateLimiters } from '../../middleware/dynamic-rate-limit.middleware';

export async function optimizationManagementRoutes(fastify: FastifyInstance) {
  const controller = new OptimizationManagementController();

  // Obtém métricas de otimização
  fastify.get(
    '/metrics',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get unified optimization metrics',
        tags: ['Admin', 'Optimization'],
        querystring: {
          type: 'object',
          properties: {
            type: { 
              type: 'string', 
              enum: ['database', 'cache', 'market', 'all'],
              default: 'all'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  metrics: { type: 'object' },
                  timestamp: { type: 'number' },
                  type: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    controller.getOptimizationMetrics.bind(controller)
  );

  // Obtém recomendações de otimização
  fastify.get(
    '/recommendations',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get optimization recommendations',
        tags: ['Admin', 'Optimization'],
        querystring: {
          type: 'object',
          properties: {
            type: { 
              type: 'string', 
              enum: ['database', 'cache', 'market', 'all'],
              default: 'all'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  recommendations: { type: 'object' },
                  timestamp: { type: 'number' },
                  type: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    controller.getOptimizationRecommendations.bind(controller)
  );

  // Executa otimizações automáticas
  fastify.post(
    '/execute',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Execute automatic optimizations',
        tags: ['Admin', 'Optimization'],
        querystring: {
          type: 'object',
          properties: {
            type: { 
              type: 'string', 
              enum: ['database', 'cache', 'market', 'all'],
              default: 'all'
            },
            force: { type: 'boolean', default: false }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  executed: { type: 'array', items: { type: 'string' } },
                  failed: { 
                    type: 'array', 
                    items: {
                      type: 'object',
                      properties: {
                        action: { type: 'string' },
                        error: { type: 'string' }
                      }
                    }
                  },
                  timestamp: { type: 'number' },
                  type: { type: 'string' },
                  force: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    },
    controller.executeOptimizations.bind(controller)
  );

  // Obtém relatório detalhado de performance
  fastify.get(
    '/report',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get detailed performance report',
        tags: ['Admin', 'Optimization'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  report: { type: 'object' },
                  timestamp: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    controller.getPerformanceReport.bind(controller)
  );

  // Invalida cache específico
  fastify.post(
    '/cache/invalidate',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Invalidate specific cache',
        tags: ['Admin', 'Optimization', 'Cache'],
        body: {
          type: 'object',
          properties: {
            type: { 
              type: 'string', 
              enum: ['market', 'user', 'historical', 'all']
            },
            pattern: { type: 'string' }
          },
          anyOf: [
            { required: ['type'] },
            { required: ['pattern'] }
          ]
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  invalidated: { type: 'number' },
                  type: { type: 'string' },
                  pattern: { type: 'string' },
                  timestamp: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    controller.invalidateCache.bind(controller)
  );

  // Obtém status de saúde das otimizações
  fastify.get(
    '/health',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get optimization health status',
        tags: ['Admin', 'Optimization', 'Health'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['healthy', 'warning', 'critical'] },
                  score: { type: 'number', minimum: 0, maximum: 100 },
                  issues: { type: 'array', items: { type: 'string' } },
                  recommendations: { type: 'array', items: { type: 'string' } },
                  timestamp: { type: 'number' }
                }
              }
            }
          }
        }
      }
    },
    controller.getOptimizationHealth.bind(controller)
  );
}
