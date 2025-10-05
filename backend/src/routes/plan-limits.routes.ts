import { FastifyInstance } from 'fastify';
import { PlanLimitsController } from '../controllers/plan-limits.controller';
import { adminAuthMiddleware } from '../middleware/auth.middleware';

const planLimitsController = new PlanLimitsController();

export async function planLimitsRoutes(fastify: FastifyInstance) {
  // Criar limites para um plano
  fastify.post('/plan-limits', {
    preHandler: [adminAuthMiddleware],
    schema: {
      description: 'Create plan limits',
      tags: ['Plan Limits'],
      body: {
        type: 'object',
        required: ['planId', 'maxExchangeAccounts', 'maxAutomations', 'maxIndicators', 'maxSimulations', 'maxBacktests'],
        properties: {
          planId: { type: 'string' },
          maxExchangeAccounts: { type: 'number', minimum: 0 },
          maxAutomations: { type: 'number', minimum: 0 },
          maxIndicators: { type: 'number', minimum: 0 },
          maxSimulations: { type: 'number', minimum: 0 },
          maxBacktests: { type: 'number', minimum: 0 }
        }
      },
      response: {
        201: {
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
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        409: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, planLimitsController.createPlanLimits.bind(planLimitsController));

  // Atualizar limites de um plano
  fastify.put('/plan-limits/:id', {
    preHandler: [adminAuthMiddleware],
    schema: {
      description: 'Update plan limits',
      tags: ['Plan Limits'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          maxExchangeAccounts: { type: 'number', minimum: 0 },
          maxAutomations: { type: 'number', minimum: 0 },
          maxIndicators: { type: 'number', minimum: 0 },
          maxSimulations: { type: 'number', minimum: 0 },
          maxBacktests: { type: 'number', minimum: 0 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { 
              type: 'object',
              additionalProperties: true  // ✅ ISSO PERMITE PASSAR TODAS AS PROPRIEDADES
            },
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, planLimitsController.updatePlanLimits.bind(planLimitsController));

  // Obter limites de um plano específico
  fastify.get('/plan-limits/:id', {
    preHandler: [adminAuthMiddleware],
    schema: {
      description: 'Get plan limits by ID',
      tags: ['Plan Limits'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
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
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, planLimitsController.getPlanLimits.bind(planLimitsController));

  // Listar todos os limites de planos
  fastify.get('/plan-limits', {
    preHandler: [adminAuthMiddleware],
    schema: {
      description: 'Get all plan limits',
      tags: ['Plan Limits'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' }
          }
        }
      }
    }
  }, planLimitsController.getAllPlanLimits.bind(planLimitsController));

  // Obter limites de um usuário específico
  fastify.get('/plan-limits/user/:userId', {
    preHandler: [adminAuthMiddleware],
    schema: {
      description: 'Get user plan limits',
      tags: ['Plan Limits'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        }
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
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, planLimitsController.getUserLimits.bind(planLimitsController));

  // Verificar se usuário pode criar recurso
  fastify.post('/plan-limits/check', {
    preHandler: [adminAuthMiddleware],
    schema: {
      description: 'Check if user can create resource',
      tags: ['Plan Limits'],
      body: {
        type: 'object',
        required: ['userId', 'resourceType'],
        properties: {
          userId: { type: 'string' },
          resourceType: { type: 'string', enum: ['exchange_account', 'automation', 'indicator', 'simulation', 'backtest'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            canCreate: { type: 'boolean' },
            currentUsage: { type: 'number' },
            limit: { type: 'number' }
          }
        }
      }
    }
  }, planLimitsController.validateLimit.bind(planLimitsController));

  // Obter estatísticas de uso
  fastify.get('/plan-limits/statistics', {
    preHandler: [adminAuthMiddleware],
    schema: {
      description: 'Get plan limits usage statistics',
      tags: ['Plan Limits'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, planLimitsController.getUsageStatistics.bind(planLimitsController));

  // Test route for statistics
  fastify.get('/plan-limits/stats', {
    preHandler: [adminAuthMiddleware],
  }, async (request, reply) => {
    try {
      console.log('📊 STATS ROUTE - Getting usage statistics...');
      
      const { planLimitsService } = await import('../services/plan-limits.service');
      const statistics = await planLimitsService.getUsageStatistics();
      
      console.log('📊 STATS ROUTE - Statistics received:', statistics);
      
      return reply.status(200).send({
        success: true,
        data: statistics
      });
    } catch (error: any) {
      console.error('❌ STATS ROUTE - Error:', error);
      return reply.status(500).send({
        error: 'INTERNAL_ERROR',
        message: error.message
      });
    }
  });

  // Deletar limites de um plano
  fastify.delete('/plan-limits/:id', {
    preHandler: [adminAuthMiddleware],
    schema: {
      description: 'Delete plan limits',
      tags: ['Plan Limits'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, planLimitsController.deletePlanLimits.bind(planLimitsController));
}