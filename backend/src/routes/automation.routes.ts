import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AutomationController } from '../controllers/automation.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  requireAutomationAccess,
  // requireResourceAccess,
} from '../middleware/idor.middleware';
import { automationRateLimitMiddleware } from '../middleware/user-rate-limit.middleware';

export async function automationRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const automationController = new AutomationController(prisma);

  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Create new automation
  fastify.post(
    '/automations',
    {
      preHandler: [automationRateLimitMiddleware],
      schema: {
        description: 'Create a new automation',
        tags: ['automations'],
        body: {
          type: 'object',
          required: ['type', 'config'],
          properties: {
            type: {
              type: 'string',
              enum: ['margin_guard', 'tp_sl', 'auto_entry'],
              description: 'Type of automation to create',
            },
            config: {
              type: 'object',
              description: 'Configuration object specific to automation type',
              additionalProperties: true,
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  config: { type: 'object' },
                  is_active: { type: 'boolean' },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' },
                },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'array' },
            },
          },
        },
      },
    },
    automationController.createAutomation.bind(automationController)
  );

  // Get user's automations
  fastify.get(
    '/automations',
    {
      schema: {
        description: "Get user's automations",
        tags: ['automations'],
        querystring: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['margin_guard', 'tp_sl', 'auto_entry'],
              description: 'Filter by automation type',
            },
            is_active: {
              type: 'boolean',
              description: 'Filter by active status',
            },
          },
        },
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
                    type: { type: 'string' },
                    config: { type: 'object' },
                    is_active: { type: 'boolean' },
                    created_at: { type: 'string' },
                    updated_at: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    automationController.getUserAutomations.bind(automationController)
  );

  // Get specific automation
  fastify.get(
    '/automations/:id',
    {
      preHandler: [requireAutomationAccess('id')],
      schema: {
        description: 'Get specific automation by ID',
        tags: ['automations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Automation ID',
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
                  id: { type: 'string' },
                  type: { type: 'string' },
                  config: { type: 'object' },
                  is_active: { type: 'boolean' },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' },
                },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    automationController.getAutomation.bind(automationController)
  );

  // Update automation
  fastify.put(
    '/automations/:id',
    {
      preHandler: [
        requireAutomationAccess('id'),
        automationRateLimitMiddleware,
      ],
      schema: {
        description: 'Update automation configuration',
        tags: ['automations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Automation ID',
            },
          },
        },
        body: {
          type: 'object',
          properties: {
            config: {
              type: 'object',
              description: 'Updated configuration object',
              additionalProperties: true,
            },
            is_active: {
              type: 'boolean',
              description: 'Active status',
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
                  id: { type: 'string' },
                  type: { type: 'string' },
                  config: { type: 'object' },
                  is_active: { type: 'boolean' },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' },
                },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    automationController.updateAutomation.bind(automationController)
  );

  // Delete automation
  fastify.delete(
    '/automations/:id',
    {
      preHandler: [requireAutomationAccess('id')],
      schema: {
        description: 'Delete automation',
        tags: ['automations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Automation ID',
            },
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
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    automationController.deleteAutomation.bind(automationController)
  );

  // Toggle automation status
  fastify.patch(
    '/automations/:id/toggle',
    {
      schema: {
        description: 'Toggle automation active status',
        tags: ['automations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Automation ID',
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
                  id: { type: 'string' },
                  type: { type: 'string' },
                  config: { type: 'object' },
                  is_active: { type: 'boolean' },
                  created_at: { type: 'string' },
                  updated_at: { type: 'string' },
                },
              },
              message: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    automationController.toggleAutomation.bind(automationController)
  );

  // Get automation statistics
  fastify.get(
    '/automations/stats',
    {
      schema: {
        description: 'Get automation statistics for user',
        tags: ['automations'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  active: { type: 'number' },
                  inactive: { type: 'number' },
                  byType: {
                    type: 'object',
                    properties: {
                      margin_guard: { type: 'number' },
                      tp_sl: { type: 'number' },
                      auto_entry: { type: 'number' },
                    },
                  },
                  recentActivity: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        type: { type: 'string' },
                        is_active: { type: 'boolean' },
                        updated_at: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    automationController.getAutomationStats.bind(automationController)
  );

  // Get automation state change history
  fastify.get(
    '/automations/state-history',
    {
      schema: {
        description: 'Get automation state change history',
        tags: ['automations', 'logs'],
        querystring: {
          type: 'object',
          properties: {
            automationId: { type: 'string', description: 'Filter by specific automation ID' },
            limit: { type: 'string', default: '50', description: 'Number of records to return' },
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
                  history: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        action: { type: 'string' },
                        automation_id: { type: 'string' },
                        old_state: { type: 'boolean' },
                        new_state: { type: 'boolean' },
                        config_changes: { type: 'object' },
                        automation_type: { type: 'string' },
                        change_type: { type: 'string' },
                        reason: { type: 'string' },
                        timestamp: { type: 'string' },
                      },
                    },
                  },
                  statistics: {
                    type: 'object',
                    properties: {
                      total_changes: { type: 'number' },
                      activations: { type: 'number' },
                      deactivations: { type: 'number' },
                      config_updates: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    automationController.getAutomationStateHistory.bind(automationController)
  );

  // Get automation execution history
  fastify.get(
    '/automations/execution-history',
    {
      schema: {
        description: 'Get automation execution history (when automations are triggered)',
        tags: ['automations', 'logs'],
        querystring: {
          type: 'object',
          properties: {
            automationId: { type: 'string', description: 'Filter by specific automation ID' },
            limit: { type: 'string', default: '50', description: 'Number of records to return' },
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
                  history: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        action: { type: 'string' },
                        automation_id: { type: 'string' },
                        trade_id: { type: 'string' },
                        status: { type: 'string' },
                        automation_action: { type: 'string' },
                        trigger_data: { type: 'object' },
                        execution_result: { type: 'object' },
                        error_message: { type: 'string' },
                        execution_time_ms: { type: 'number' },
                        automation_type: { type: 'string' },
                        timestamp: { type: 'string' },
                      },
                    },
                  },
                  statistics: {
                    type: 'object',
                    properties: {
                      total_executions: { type: 'number' },
                      successful_executions: { type: 'number' },
                      failed_executions: { type: 'number' },
                      success_rate: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    automationController.getAutomationExecutionHistory.bind(automationController)
  );

  // Margin Guard specific routes
  fastify.get(
    '/margin-guard/plan-features',
    {
      schema: {
        description: 'Get Margin Guard plan features for user',
        tags: ['margin-guard'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  planType: { type: 'string' },
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
    automationController.getMarginGuardPlanFeatures.bind(automationController)
  );

  fastify.post(
    '/margin-guard',
    {
      preHandler: [automationRateLimitMiddleware],
      schema: {
        description: 'Create Margin Guard automation with plan validation',
        tags: ['margin-guard'],
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
              default: true,
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
                push: { type: 'boolean', default: true },
                email: { type: 'boolean', default: false },
                telegram: { type: 'boolean', default: false },
                whatsapp: { type: 'boolean', default: false },
                webhook: { type: 'boolean', default: false },
              },
              description: 'Notification settings',
            },
          },
        },
        response: {
          201: {
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
    automationController.createMarginGuardAutomation.bind(automationController)
  );

  fastify.put(
    '/margin-guard/:id',
    {
      preHandler: [automationRateLimitMiddleware, requireAutomationAccess],
      schema: {
        description: 'Update Margin Guard automation with plan validation',
        tags: ['margin-guard'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
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
    automationController.updateMarginGuardAutomation.bind(automationController)
  );
}
