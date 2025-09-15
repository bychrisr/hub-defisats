import { FastifyInstance } from 'fastify';
import { planController } from '../controllers/plan.controller';
import { authenticate } from '../middleware/auth.middleware';

export async function planRoutes(fastify: FastifyInstance) {
  // Apply authentication to all routes
  fastify.addHook('preHandler', authenticate);

  // Get all plans
  fastify.get('/api/admin/plans', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          include_inactive: { type: 'string', enum: ['true', 'false'], default: 'false' },
          limit: { type: 'string', default: '50' },
          offset: { type: 'string', default: '0' },
        },
      },
    },
  }, planController.getAllPlans.bind(planController));

  // Get plan by ID
  fastify.get('/api/admin/plans/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, planController.getPlanById.bind(planController));

  // Get plan by slug
  fastify.get('/api/admin/plans/slug/:slug', {
    schema: {
      params: {
        type: 'object',
        required: ['slug'],
        properties: {
          slug: { type: 'string', enum: ['free', 'basic', 'advanced', 'pro', 'lifetime'] },
        },
      },
    },
  }, planController.getPlanBySlug.bind(planController));

  // Create new plan
  fastify.post('/api/admin/plans', {
    schema: {
      body: {
        type: 'object',
        required: ['name', 'slug', 'max_automations', 'max_backtests', 'max_notifications', 'has_priority', 'has_advanced', 'has_api_access', 'features'],
        properties: {
          name: { type: 'string', minLength: 1 },
          slug: { type: 'string', enum: ['free', 'basic', 'advanced', 'pro', 'lifetime'] },
          description: { type: 'string' },
          price_monthly: { type: 'number', minimum: 0 },
          price_yearly: { type: 'number', minimum: 0 },
          price_lifetime: { type: 'number', minimum: 0 },
          currency: { type: 'string', default: 'BRL' },
          max_automations: { type: 'integer', minimum: -1 }, // -1 = unlimited
          max_backtests: { type: 'integer', minimum: -1 },
          max_notifications: { type: 'integer', minimum: -1 },
          has_priority: { type: 'boolean' },
          has_advanced: { type: 'boolean' },
          has_api_access: { type: 'boolean' },
          features: {
            type: 'object',
            properties: {
              automations: { type: 'array', items: { type: 'string' } },
              notifications: { type: 'array', items: { type: 'string' } },
              backtests: { type: 'array', items: { type: 'string' } },
              advanced: { type: 'array', items: { type: 'string' } },
              support: { type: 'array', items: { type: 'string' } },
            },
          },
          stripe_price_id: { type: 'string' },
          order: { type: 'integer', default: 0 },
        },
      },
    },
  }, planController.createPlan.bind(planController));

  // Update plan
  fastify.put('/api/admin/plans/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 1 },
          slug: { type: 'string', enum: ['free', 'basic', 'advanced', 'pro', 'lifetime'] },
          description: { type: 'string' },
          price_monthly: { type: 'number', minimum: 0 },
          price_yearly: { type: 'number', minimum: 0 },
          price_lifetime: { type: 'number', minimum: 0 },
          currency: { type: 'string' },
          max_automations: { type: 'integer', minimum: -1 },
          max_backtests: { type: 'integer', minimum: -1 },
          max_notifications: { type: 'integer', minimum: -1 },
          has_priority: { type: 'boolean' },
          has_advanced: { type: 'boolean' },
          has_api_access: { type: 'boolean' },
          is_active: { type: 'boolean' },
          features: {
            type: 'object',
            properties: {
              automations: { type: 'array', items: { type: 'string' } },
              notifications: { type: 'array', items: { type: 'string' } },
              backtests: { type: 'array', items: { type: 'string' } },
              advanced: { type: 'array', items: { type: 'string' } },
              support: { type: 'array', items: { type: 'string' } },
            },
          },
          stripe_price_id: { type: 'string' },
          order: { type: 'integer' },
        },
      },
    },
  }, planController.updatePlan.bind(planController));

  // Delete plan
  fastify.delete('/api/admin/plans/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, planController.deletePlan.bind(planController));

  // Get plan statistics
  fastify.get('/api/admin/plans/stats', planController.getPlanStats.bind(planController));

  // Toggle plan status
  fastify.patch('/api/admin/plans/:id/toggle', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  }, planController.togglePlanStatus.bind(planController));

  // Reorder plans
  fastify.post('/api/admin/plans/reorder', {
    schema: {
      body: {
        type: 'object',
        required: ['plans'],
        properties: {
          plans: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'order'],
              properties: {
                id: { type: 'string' },
                order: { type: 'integer', minimum: 0 },
              },
            },
          },
        },
      },
    },
  }, planController.reorderPlans.bind(planController));
}
