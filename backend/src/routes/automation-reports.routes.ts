import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { AutomationReportsController } from '../controllers/automation-reports.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function automationReportsRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const automationReportsController = new AutomationReportsController(prisma);

  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Get user's automation execution reports
  fastify.get(
    '/automation-reports',
    {
      schema: {
        description: "Get user's automation execution reports",
        tags: ['automation-reports'],
        querystring: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['all', 'margin_guard', 'tp_sl', 'auto_entry'],
              default: 'all',
              description: 'Filter by automation type'
            },
            status: {
              type: 'string',
              enum: ['all', 'success', 'app_error', 'exchange_error'],
              default: 'all',
              description: 'Filter by execution status'
            },
            limit: {
              type: 'string',
              default: '50',
              description: 'Number of results to return'
            },
            offset: {
              type: 'string',
              default: '0',
              description: 'Number of results to skip'
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
                  executions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        automation_id: { type: 'string' },
                        automation_type: { type: 'string' },
                        status: { type: 'string' },
                        error_message: { type: 'string' },
                        executed_at: { type: 'string' },
                        created_at: { type: 'string' },
                        automation: { type: 'object' }
                      }
                    }
                  },
                  statistics: {
                    type: 'object',
                    properties: {
                      total_executions: { type: 'number' },
                      success_count: { type: 'number' },
                      error_count: { type: 'number' },
                      success_rate: { type: 'number' },
                      recent_executions_24h: { type: 'number' }
                    }
                  },
                  active_automations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        type: { type: 'string' },
                        config: { type: 'object' },
                        created_at: { type: 'string' },
                        updated_at: { type: 'string' }
                      }
                    }
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      limit: { type: 'number' },
                      offset: { type: 'number' },
                      total: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    automationReportsController.getUserAutomationReports.bind(automationReportsController)
  );

  // Get specific automation execution details
  fastify.get(
    '/automation-reports/:executionId',
    {
      schema: {
        description: "Get specific automation execution details",
        tags: ['automation-reports'],
        params: {
          type: 'object',
          required: ['executionId'],
          properties: {
            executionId: { type: 'string' }
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
                  id: { type: 'string' },
                  automation_id: { type: 'string' },
                  automation_type: { type: 'string' },
                  status: { type: 'string' },
                  error_message: { type: 'string' },
                  executed_at: { type: 'string' },
                  created_at: { type: 'string' },
                  automation: { type: 'object' }
                }
              }
            }
          }
        }
      }
    },
    automationReportsController.getAutomationExecutionDetails.bind(automationReportsController)
  );
}
