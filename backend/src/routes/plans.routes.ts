import { FastifyInstance } from 'fastify';
import { PlansController } from '../controllers/plans.controller';
import { adminAuthMiddleware } from '../middleware/auth.middleware';

const plansController = new PlansController();

export async function plansRoutes(fastify: FastifyInstance) {
  // Listar todos os planos
  fastify.get('/plans', {
    schema: {
      description: 'Get all plans',
      tags: ['Plans'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { type: 'object' } },
            count: { type: 'number' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, plansController.getAllPlans.bind(plansController));

  // Obter estatísticas de usuários por plano
  fastify.get('/plans/user-stats', {
    schema: {
      description: 'Get plan user statistics',
      tags: ['Plans'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, plansController.getPlanUserStats.bind(plansController));

  // Obter plano por ID
  fastify.get('/plans/:id', {
    schema: {
      description: 'Get plan by ID',
      tags: ['Plans'],
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
            data: { type: 'object' }
          }
        },
        404: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, plansController.getPlanById.bind(plansController));

  // Criar novo plano (apenas admin)
  fastify.post('/plans', {
    preHandler: [adminAuthMiddleware],
    schema: {
      description: 'Create new plan',
      tags: ['Plans'],
      body: {
        type: 'object',
        required: ['name', 'slug', 'description'],
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          price_sats: { type: 'number', minimum: 0 },
          price_monthly: { type: 'number', minimum: 0 },
          price_yearly: { type: 'number', minimum: 0 },
          features: { type: 'array', items: { type: 'string' } },
          is_active: { type: 'boolean' },
          has_api_access: { type: 'boolean' },
          has_advanced: { type: 'boolean' },
          has_priority: { type: 'boolean' },
          max_notifications: { type: 'number', minimum: 0 },
          order: { type: 'number', minimum: 0 }
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
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, plansController.createPlan.bind(plansController));

  // Atualizar plano (apenas admin)
  fastify.put('/plans/:id', {
    preHandler: [adminAuthMiddleware],
    schema: {
      description: 'Update plan',
      tags: ['Plans'],
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
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          price_sats: { type: 'number', minimum: 0 },
          price_monthly: { type: 'number', minimum: 0 },
          price_yearly: { type: 'number', minimum: 0 },
          features: { type: 'array', items: { type: 'string' } },
          is_active: { type: 'boolean' },
          has_api_access: { type: 'boolean' },
          has_advanced: { type: 'boolean' },
          has_priority: { type: 'boolean' },
          max_notifications: { type: 'number', minimum: 0 },
          order: { type: 'number', minimum: 0 }
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
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, plansController.updatePlan.bind(plansController));

  // Deletar plano (apenas admin)
  fastify.delete('/plans/:id', {
    preHandler: [adminAuthMiddleware],
    schema: {
      description: 'Delete plan',
      tags: ['Plans'],
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
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, plansController.deletePlan.bind(plansController));
}
