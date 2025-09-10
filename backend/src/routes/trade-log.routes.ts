import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { TradeLogController } from '@/controllers/trade-log.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

export async function tradeLogRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const tradeLogController = new TradeLogController(prisma);

  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Get user's trade logs with pagination and filtering
  fastify.get(
    '/trade-logs',
    {
      schema: {
        description: "Get user's trade logs with pagination and filtering",
        tags: ['Trade Logs'],
        querystring: {
          type: 'object',
          properties: {
            page: {
              type: 'string',
              description: 'Page number (default: 1)',
            },
            limit: {
              type: 'string',
              description: 'Items per page (default: 20)',
            },
            status: {
              type: 'string',
              enum: ['success', 'app_error', 'exchange_error'],
              description: 'Filter by trade status',
            },
            automation_id: {
              type: 'string',
              format: 'uuid',
              description: 'Filter by automation ID',
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
                  tradeLogs: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        trade_id: { type: 'string' },
                        automation_id: { type: 'string' },
                        status: { type: 'string' },
                        error_message: { type: 'string' },
                        executed_at: { type: 'string' },
                        created_at: { type: 'string' },
                        automation: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            type: { type: 'string' },
                            config: { type: 'object' },
                          },
                        },
                      },
                    },
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: { type: 'number' },
                      limit: { type: 'number' },
                      total: { type: 'number' },
                      totalPages: { type: 'number' },
                      hasNext: { type: 'boolean' },
                      hasPrev: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    tradeLogController.getUserTradeLogs.bind(tradeLogController)
  );

  // Get specific trade log by ID
  fastify.get(
    '/trade-logs/:id',
    {
      schema: {
        description: 'Get specific trade log by ID',
        tags: ['Trade Logs'],
        params: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Trade log ID',
            },
          },
          required: ['id'],
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
                  trade_id: { type: 'string' },
                  automation_id: { type: 'string' },
                  status: { type: 'string' },
                  error_message: { type: 'string' },
                  executed_at: { type: 'string' },
                  created_at: { type: 'string' },
                  automation: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      type: { type: 'string' },
                      config: { type: 'object' },
                    },
                  },
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
    tradeLogController.getTradeLogById.bind(tradeLogController)
  );

  // Get trade log statistics
  fastify.get(
    '/trade-logs/stats',
    {
      schema: {
        description: 'Get trade log statistics for user',
        tags: ['Trade Logs'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  success: { type: 'number' },
                  errors: { type: 'number' },
                  successRate: { type: 'number' },
                  recent: { type: 'number' },
                  byStatus: {
                    type: 'object',
                    additionalProperties: { type: 'number' },
                  },
                  byAutomation: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    tradeLogController.getTradeLogStats.bind(tradeLogController)
  );
}

