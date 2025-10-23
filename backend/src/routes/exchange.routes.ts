import { FastifyInstance } from 'fastify';
import { ExchangeService } from '../services/exchange.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { getPrisma } from '../lib/prisma';

export async function exchangeRoutes(fastify: FastifyInstance) {
  const prisma = await getPrisma();
  const exchangeService = new ExchangeService(prisma);

  // Get available exchanges (public during registration)
  fastify.get('/exchanges', {
    schema: {
      tags: ['Exchange'],
      summary: 'Get available exchanges',
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
                  name: { type: 'string' },
                  slug: { type: 'string' },
                  description: { type: 'string' },
                  website: { type: 'string' },
                  logo_url: { type: 'string' },
                  is_active: { type: 'boolean' },
                  api_version: { type: 'string' },
                  credential_types: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        field_name: { type: 'string' },
                        field_type: { type: 'string' },
                        is_required: { type: 'boolean' },
                        description: { type: 'string' },
                        order: { type: 'number' },
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
  }, async (request, reply) => {
    try {
      const exchanges = await exchangeService.getAvailableExchanges();
      
      return reply.send({
        success: true,
        data: exchanges,
      });
    } catch (error: any) {
      fastify.log.error('Error fetching exchanges:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch exchanges',
      });
    }
  });

  // Get user's exchange accounts
  fastify.get('/user/exchange-accounts', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Exchange'],
      summary: 'Get user exchange accounts',
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
                  exchange_id: { type: 'string' },
                  account_name: { type: 'string' },
                  is_active: { type: 'boolean' },
                  is_verified: { type: 'boolean' },
                  last_test: { type: 'string', format: 'date-time' },
                  created_at: { type: 'string', format: 'date-time' },
                  exchange: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      slug: { type: 'string' },
                      logo_url: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.id;
      const accounts = await exchangeService.getUserAccounts(userId);
      
      return reply.send({
        success: true,
        data: accounts,
      });
    } catch (error: any) {
      fastify.log.error('Error fetching user accounts:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch user accounts',
      });
    }
  });

  // Get user's plan limits
  fastify.get('/user/plan-limits', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Exchange'],
      summary: 'Get user plan limits',
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                max_exchange_accounts: { type: 'number' },
                max_automations: { type: 'number' },
                max_indicators: { type: 'number' },
                max_simulations: { type: 'number' },
                max_backtests: { type: 'number' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.id;
      const limits = await exchangeService.getUserPlanLimits(userId);
      
      return reply.send({
        success: true,
        data: limits,
      });
    } catch (error: any) {
      fastify.log.error('Error fetching plan limits:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch plan limits',
      });
    }
  });

  // Create new exchange account
  fastify.post('/user/exchange-accounts', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Exchange'],
      summary: 'Create new exchange account',
      body: {
        type: 'object',
        required: ['exchange_id', 'account_name', 'credentials'],
        properties: {
          exchange_id: { type: 'string' },
          account_name: { type: 'string', minLength: 1 },
          credentials: {
            type: 'object',
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
                exchange_id: { type: 'string' },
                account_name: { type: 'string' },
                is_active: { type: 'boolean' },
                is_verified: { type: 'boolean' },
                created_at: { type: 'string', format: 'date-time' },
                exchange: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    slug: { type: 'string' },
                    logo_url: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.id;
      const { exchange_id, account_name, credentials } = request.body as any;
      
      const account = await exchangeService.createUserAccount(
        userId,
        exchange_id,
        account_name,
        credentials
      );
      
      return reply.status(201).send({
        success: true,
        data: account,
      });
    } catch (error: any) {
      fastify.log.error('Error creating exchange account:', error);
      return reply.status(400).send({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message || 'Failed to create exchange account',
      });
    }
  });

  // Test exchange credentials
  fastify.post('/user/exchange-accounts/:accountId/test', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Exchange'],
      summary: 'Test exchange credentials',
      params: {
        type: 'object',
        properties: {
          accountId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['credentials'],
        properties: {
          credentials: {
            type: 'object',
            additionalProperties: true,
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
                success: { type: 'boolean' },
                message: { type: 'string' },
                data: { type: 'object' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.id;
      const { accountId } = request.params as any;
      const { credentials } = request.body as any;
      
      const result = await exchangeService.testCredentials(
        userId,
        accountId,
        credentials
      );
      
      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      fastify.log.error('Error testing credentials:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to test credentials',
      });
    }
  });

  // Delete exchange account
  fastify.delete('/user/exchange-accounts/:accountId', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Exchange'],
      summary: 'Delete exchange account',
      params: {
        type: 'object',
        properties: {
          accountId: { type: 'string' },
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
      },
    },
  }, async (request, reply) => {
    try {
      const userId = (request as any).user.id;
      const { accountId } = request.params as any;
      
      await exchangeService.deleteAccount(userId, accountId);
      
      return reply.send({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error: any) {
      fastify.log.error('Error deleting account:', error);
      return reply.status(400).send({
        success: false,
        error: 'VALIDATION_ERROR',
        message: error.message || 'Failed to delete account',
      });
    }
  });
}
