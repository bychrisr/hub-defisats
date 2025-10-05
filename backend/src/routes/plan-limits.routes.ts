import { FastifyInstance } from 'fastify';
import { PlanLimitsController } from '../controllers/plan-limits.controller';

const planLimitsController = new PlanLimitsController();

export async function planLimitsRoutes(fastify: FastifyInstance) {
  // Middleware de autenticação para todas as rotas
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      // Verificar se o usuário está autenticado
      if (!request.user) {
        return reply.status(401).send({
          error: 'UNAUTHORIZED',
          message: 'Authentication required'
        });
      }

      // Verificar se o usuário é admin
      if (request.user.role !== 'admin' && request.user.role !== 'superadmin') {
        return reply.status(403).send({
          error: 'FORBIDDEN',
          message: 'Admin access required'
        });
      }
    } catch (error) {
      return reply.status(401).send({
        error: 'UNAUTHORIZED',
        message: 'Invalid authentication'
      });
    }
  });

  // Criar limites para um plano
  fastify.post('/plan-limits', {
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
            data: { type: 'object' },
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

  // Obter limites de um plano
  fastify.get('/plan-limits/plan/:planId', {
    schema: {
      description: 'Get plan limits by plan ID',
      tags: ['Plan Limits'],
      params: {
        type: 'object',
        properties: {
          planId: { type: 'string' }
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
    schema: {
      description: 'Get all plan limits',
      tags: ['Plan Limits'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
            count: { type: 'number' }
          }
        }
      }
    }
  }, planLimitsController.getAllPlanLimits.bind(planLimitsController));

  // Obter limites de um usuário
  fastify.get('/plan-limits/user/:userId', {
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

  // Validar limite específico
  fastify.get('/plan-limits/validate/:userId', {
    schema: {
      description: 'Validate specific limit for user',
      tags: ['Plan Limits'],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          limitType: { 
            type: 'string',
            enum: ['EXCHANGE_ACCOUNTS', 'AUTOMATIONS', 'INDICATORS', 'SIMULATIONS', 'BACKTESTS']
          }
        }
      },
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
  }, planLimitsController.validateLimit.bind(planLimitsController));

  // Deletar limites de um plano
  fastify.delete('/plan-limits/:id', {
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

  // Obter estatísticas de uso
  fastify.get('/plan-limits/statistics', {
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
}
