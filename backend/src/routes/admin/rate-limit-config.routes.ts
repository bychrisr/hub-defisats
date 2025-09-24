import { FastifyInstance } from 'fastify';
import { RateLimitConfigController } from '../../controllers/admin/rate-limit-config.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { adminMiddleware } from '../../middleware/admin.middleware';
import { dynamicRateLimiters } from '../../middleware/dynamic-rate-limit.middleware';

export async function rateLimitConfigRoutes(fastify: FastifyInstance) {
  const controller = new RateLimitConfigController();

  // Middleware de autenticação e admin para todas as rotas
  fastify.addHook('preHandler', authMiddleware);
  fastify.addHook('preHandler', adminMiddleware);

  // Obtém todas as configurações
  fastify.get(
    '/',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get all rate limit configurations',
        tags: ['Admin', 'Rate Limiting'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    environment: { type: 'string' },
                    endpointType: { type: 'string' },
                    maxRequests: { type: 'number' },
                    windowMs: { type: 'number' },
                    windowMinutes: { type: 'number' },
                    message: { type: 'string' },
                    skipSuccessfulRequests: { type: 'boolean' },
                    isActive: { type: 'boolean' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    createdBy: { type: 'string' },
                    updatedBy: { type: 'string' },
                    metadata: { type: 'object' },
                  }
                }
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  environments: { type: 'array', items: { type: 'string' } },
                  endpointTypes: { type: 'array', items: { type: 'string' } },
                }
              }
            }
          },
          500: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
            }
          }
        }
      }
    },
    controller.getAllConfigs.bind(controller)
  );

  // Obtém configurações por ambiente
  fastify.get(
    '/environment/:environment',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get rate limit configurations by environment',
        tags: ['Admin', 'Rate Limiting'],
        params: {
          type: 'object',
          properties: {
            environment: { 
              type: 'string',
              enum: ['development', 'staging', 'production', 'global']
            }
          },
          required: ['environment']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array' },
              meta: {
                type: 'object',
                properties: {
                  environment: { type: 'string' },
                  total: { type: 'number' },
                }
              }
            }
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
            }
          }
        }
      }
    },
    controller.getConfigsByEnvironment.bind(controller)
  );

  // Obtém configuração específica
  fastify.get(
    '/:environment/:endpointType',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get specific rate limit configuration',
        tags: ['Admin', 'Rate Limiting'],
        params: {
          type: 'object',
          properties: {
            environment: { 
              type: 'string',
              enum: ['development', 'staging', 'production', 'global']
            },
            endpointType: { 
              type: 'string',
              enum: ['auth', 'api', 'trading', 'notifications', 'payments', 'admin', 'global']
            }
          },
          required: ['environment', 'endpointType']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
            }
          }
        }
      }
    },
    controller.getConfig.bind(controller)
  );

  // Cria ou atualiza configuração
  fastify.post(
    '/',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Create or update rate limit configuration',
        tags: ['Admin', 'Rate Limiting'],
        body: {
          type: 'object',
          properties: {
            environment: { 
              type: 'string',
              enum: ['development', 'staging', 'production', 'global']
            },
            endpointType: { 
              type: 'string',
              enum: ['auth', 'api', 'trading', 'notifications', 'payments', 'admin', 'global']
            },
            maxRequests: { type: 'number', minimum: 1, maximum: 10000 },
            windowMs: { type: 'number', minimum: 1000, maximum: 3600000 },
            message: { type: 'string' },
            skipSuccessfulRequests: { type: 'boolean' },
            metadata: { type: 'object' },
          },
          required: ['environment', 'endpointType', 'maxRequests', 'windowMs']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' }
            }
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    },
    controller.upsertConfig.bind(controller)
  );

  // Ativa/desativa configuração
  fastify.patch(
    '/:id/toggle',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Toggle rate limit configuration active status',
        tags: ['Admin', 'Rate Limiting'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          },
          required: ['id']
        },
        body: {
          type: 'object',
          properties: {
            isActive: { type: 'boolean' }
          },
          required: ['isActive']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' }
            }
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
            }
          }
        }
      }
    },
    controller.toggleConfig.bind(controller)
  );

  // Remove configuração
  fastify.delete(
    '/:id',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Delete rate limit configuration',
        tags: ['Admin', 'Rate Limiting'],
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          },
          required: ['id']
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    controller.deleteConfig.bind(controller)
  );

  // Inicializa configurações padrão
  fastify.post(
    '/initialize-defaults',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Initialize default rate limit configurations',
        tags: ['Admin', 'Rate Limiting'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    controller.initializeDefaults.bind(controller)
  );

  // Obtém estatísticas
  fastify.get(
    '/stats',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get rate limit configuration statistics',
        tags: ['Admin', 'Rate Limiting'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  byEnvironment: { type: 'object' },
                  byEndpointType: { type: 'object' },
                  active: { type: 'number' },
                  inactive: { type: 'number' },
                }
              }
            }
          }
        }
      }
    },
    controller.getStats.bind(controller)
  );

  // Obtém configurações ativas para o ambiente atual
  fastify.get(
    '/active',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get active rate limit configurations for current environment',
        tags: ['Admin', 'Rate Limiting'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  environment: { type: 'string' },
                  configs: { type: 'array' },
                  cacheInfo: { type: 'object' },
                }
              }
            }
          }
        }
      }
    },
    controller.getActiveConfigs.bind(controller)
  );

  // Força atualização do cache
  fastify.post(
    '/refresh-cache',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Refresh rate limit configuration cache',
        tags: ['Admin', 'Rate Limiting'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    controller.refreshCache.bind(controller)
  );

  // Obtém informações sobre ambiente
  fastify.get(
    '/environment-info',
    {
      preHandler: [dynamicRateLimiters.admin],
      schema: {
        description: 'Get environment detection information',
        tags: ['Admin', 'Rate Limiting'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  detectedEnvironment: { type: 'string' },
                  rateLimitInfo: { type: 'object' },
                  environmentVariables: { type: 'object' },
                }
              }
            }
          }
        }
      }
    },
    controller.getEnvironmentInfo.bind(controller)
  );
}
