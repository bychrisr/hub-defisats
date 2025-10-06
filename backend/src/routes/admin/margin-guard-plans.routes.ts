import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { MarginGuardPlansController } from '../../controllers/admin/margin-guard-plans.controller';
import { adminMiddleware } from '../../middleware/admin.middleware';

export async function marginGuardPlansRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const marginGuardPlansController = new MarginGuardPlansController(prisma);

  // Apply admin middleware to all routes
  fastify.addHook('preHandler', adminMiddleware);

  // Get all plan configurations
  fastify.get(
    '/margin-guard/plans',
    {
      schema: {
        description: 'Get all Margin Guard plan configurations',
        tags: ['admin', 'margin-guard'],
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
                    planType: { type: 'string' },
                    config: { type: 'object' },
                    features: { type: 'object' },
                    limitations: { type: 'object' },
                    defaultConfig: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    marginGuardPlansController.getPlanConfigurations.bind(marginGuardPlansController)
  );

  // Get specific plan configuration
  fastify.get(
    '/margin-guard/plans/:planType',
    {
      schema: {
        description: 'Get specific Margin Guard plan configuration',
        tags: ['admin', 'margin-guard'],
        params: {
          type: 'object',
          required: ['planType'],
          properties: {
            planType: {
              type: 'string',
              enum: ['free', 'basic', 'advanced', 'pro', 'lifetime'],
              description: 'Plan type to get configuration for',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  planType: { type: 'string' },
                  config: { type: 'object' },
                  features: { type: 'object' },
                  limitations: { type: 'object' },
                  defaultConfig: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
    marginGuardPlansController.getPlanConfiguration.bind(marginGuardPlansController)
  );

  // Update plan configuration
  fastify.put(
    '/margin-guard/plans/:planType',
    {
      schema: {
        description: 'Update Margin Guard plan configuration',
        tags: ['admin', 'margin-guard'],
        params: {
          type: 'object',
          required: ['planType'],
          properties: {
            planType: {
              type: 'string',
              enum: ['free', 'basic', 'advanced', 'pro', 'lifetime'],
              description: 'Plan type to update configuration for',
            },
          },
        },
        body: {
          type: 'object',
          required: ['plan_type', 'margin_threshold', 'action'],
          properties: {
            plan_type: {
              type: 'string',
              enum: ['free', 'basic', 'advanced', 'pro', 'lifetime'],
              description: 'User plan type',
            },
            margin_threshold: {
              type: 'number',
              minimum: 0.1,
              maximum: 100,
              description: 'Margin threshold percentage (e.g., 85 for 85%)',
            },
            action: {
              type: 'string',
              enum: ['close_position', 'reduce_position', 'add_margin', 'increase_liquidation_distance'],
              description: 'Action to take when threshold is reached',
            },
            reduce_percentage: {
              type: 'number',
              minimum: 1,
              maximum: 100,
              description: 'Percentage to reduce position (for reduce_position action)',
            },
            add_margin_amount: {
              type: 'number',
              minimum: 0,
              description: 'Amount of margin to add in sats (for add_margin action)',
            },
            new_liquidation_distance: {
              type: 'number',
              minimum: 0.1,
              maximum: 100,
              description: 'New liquidation distance percentage (for increase_liquidation_distance action)',
            },
            enabled: {
              type: 'boolean',
              description: 'Whether automation is enabled',
            },
            selected_positions: {
              type: 'array',
              items: { type: 'string' },
              maxItems: 2,
              description: 'Selected position IDs (for Free plan)',
            },
            protection_mode: {
              type: 'string',
              enum: ['unitario', 'total', 'both'],
              description: 'Protection mode (for Advanced/Pro plans)',
            },
            individual_configs: {
              type: 'object',
              additionalProperties: {
                type: 'object',
                properties: {
                  margin_threshold: { type: 'number' },
                  action: { type: 'string' },
                  reduce_percentage: { type: 'number' },
                  add_margin_amount: { type: 'number' },
                  new_liquidation_distance: { type: 'number' },
                },
              },
              description: 'Individual position configurations (for Pro plan)',
            },
            notifications: {
              type: 'object',
              properties: {
                push: { type: 'boolean' },
                email: { type: 'boolean' },
                telegram: { type: 'boolean' },
                whatsapp: { type: 'boolean' },
                webhook: { type: 'boolean' },
              },
              description: 'Notification settings',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    marginGuardPlansController.updatePlanConfiguration.bind(marginGuardPlansController)
  );

  // Get plan statistics
  fastify.get(
    '/margin-guard/statistics',
    {
      schema: {
        description: 'Get Margin Guard plan statistics',
        tags: ['admin', 'margin-guard'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  totalUsers: { type: 'number' },
                  usersByPlan: {
                    type: 'object',
                    properties: {
                      free: { type: 'number' },
                      basic: { type: 'number' },
                      advanced: { type: 'number' },
                      pro: { type: 'number' },
                      lifetime: { type: 'number' },
                    },
                  },
                  marginGuardUsage: {
                    type: 'object',
                    properties: {
                      totalAutomations: { type: 'number' },
                      activeAutomations: { type: 'number' },
                      executionsToday: { type: 'number' },
                      successRate: { type: 'number' },
                    },
                  },
                  planLimitations: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
    marginGuardPlansController.getPlanStatistics.bind(marginGuardPlansController)
  );

  // Reset plan to default configuration
  fastify.post(
    '/margin-guard/plans/:planType/reset',
    {
      schema: {
        description: 'Reset Margin Guard plan configuration to default',
        tags: ['admin', 'margin-guard'],
        params: {
          type: 'object',
          required: ['planType'],
          properties: {
            planType: {
              type: 'string',
              enum: ['free', 'basic', 'advanced', 'pro', 'lifetime'],
              description: 'Plan type to reset configuration for',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    marginGuardPlansController.resetPlanConfiguration.bind(marginGuardPlansController)
  );
}
