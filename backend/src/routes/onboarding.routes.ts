import { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middleware/auth.middleware';
import { OnboardingService } from '../services/onboarding.service';
import { z } from 'zod';

const AddExchangeAccountSchema = z.object({
  exchangeId: z.string().min(1, 'Exchange ID is required'),
  accountName: z.string().min(1, 'Account name is required'),
  credentials: z.record(z.string(), z.any()),
});

const TestCredentialsSchema = z.object({
  credentials: z.record(z.string(), z.any()),
});

export async function onboardingRoutes(fastify: FastifyInstance) {
  const onboardingService = new OnboardingService(fastify.prisma);

  // Get onboarding status (public route for registration flow)
  fastify.get('/api/onboarding/status', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Onboarding'],
      summary: 'Get onboarding status for user',
      querystring: {
        type: 'object',
        properties: {
          sessionToken: { type: 'string' }
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
                requiresOnboarding: { type: 'boolean' },
                onboardingCompleted: { type: 'boolean' },
                firstLoginAt: { type: 'string', format: 'date-time' },
                userAccounts: {
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
                planLimits: {
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
      },
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user?.id;
        const sessionToken = (request.query as any)?.sessionToken;
        
        if (!userId && !sessionToken) {
          return reply.status(401).send({ success: false, message: 'Unauthorized' });
        }

        // If we have sessionToken, find the user from registration progress
        let targetUserId = userId;
        if (sessionToken && !userId) {
          const progress = await fastify.prisma.registrationProgress.findFirst({
            where: {
              session_token: sessionToken,
              expires_at: { gt: new Date() }
            }
          });
          if (!progress) {
            return reply.status(401).send({ success: false, message: 'Invalid session token' });
          }
          targetUserId = progress.user_id;
        }

        const status = await onboardingService.getOnboardingStatus(targetUserId);
        return reply.send({ success: true, data: status });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          message: 'Failed to get onboarding status',
        });
      }
    },
  });

  // Get user's exchange accounts
  fastify.get('/api/onboarding/exchange-accounts', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Onboarding'],
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
    handler: async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.status(401).send({ success: false, message: 'Unauthorized' });
        }

        const accounts = await onboardingService.getUserExchangeAccounts(userId);
        return reply.send({ success: true, data: accounts });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          message: 'Failed to get exchange accounts',
        });
      }
    },
  });

  // Add exchange account
  fastify.post('/api/onboarding/exchange-account', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Onboarding'],
      summary: 'Add exchange account',
      body: {
        type: 'object',
        required: ['exchangeId', 'accountName', 'credentials'],
        properties: {
          exchangeId: { type: 'string', minLength: 1 },
          accountName: { type: 'string', minLength: 1 },
          credentials: { type: 'object' },
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
    handler: async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.status(401).send({ success: false, message: 'Unauthorized' });
        }

        const { exchangeId, accountName, credentials } = request.body as z.infer<typeof AddExchangeAccountSchema>;
        const account = await onboardingService.addExchangeAccount(userId, exchangeId, accountName, credentials);
        
        return reply.status(201).send({ success: true, data: account });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error.message || 'Failed to add exchange account',
        });
      }
    },
  });

  // Test exchange credentials
  fastify.post('/api/onboarding/exchange-account/:accountId/test', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Onboarding'],
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
          credentials: { type: 'object' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.status(401).send({ success: false, message: 'Unauthorized' });
        }

        const { accountId } = request.params as { accountId: string };
        const { credentials } = request.body as z.infer<typeof TestCredentialsSchema>;
        
        const result = await onboardingService.testCredentials(userId, accountId, credentials);
        return reply.send(result);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error.message || 'Failed to test credentials',
        });
      }
    },
  });

  // Delete exchange account
  fastify.delete('/api/onboarding/exchange-account/:accountId', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Onboarding'],
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
    handler: async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.status(401).send({ success: false, message: 'Unauthorized' });
        }

        const { accountId } = request.params as { accountId: string };
        await onboardingService.deleteAccount(userId, accountId);
        
        return reply.send({ success: true, message: 'Account deleted successfully' });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(400).send({
          success: false,
          message: error.message || 'Failed to delete account',
        });
      }
    },
  });

  // Skip onboarding
  fastify.post('/api/onboarding/skip', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Onboarding'],
      summary: 'Skip onboarding',
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
    handler: async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.status(401).send({ success: false, message: 'Unauthorized' });
        }

        await onboardingService.skipOnboarding(userId);
        return reply.send({ success: true, message: 'Onboarding skipped successfully' });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          message: 'Failed to skip onboarding',
        });
      }
    },
  });

  // Complete onboarding
  fastify.post('/api/onboarding/complete', {
    preHandler: [authMiddleware],
    schema: {
      tags: ['Onboarding'],
      summary: 'Complete onboarding',
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
    handler: async (request, reply) => {
      try {
        const userId = request.user?.id;
        if (!userId) {
          return reply.status(401).send({ success: false, message: 'Unauthorized' });
        }

        await onboardingService.completeOnboarding(userId);
        return reply.send({ success: true, message: 'Onboarding completed successfully' });
      } catch (error: any) {
        fastify.log.error(error);
        return reply.status(500).send({
          success: false,
          message: 'Failed to complete onboarding',
        });
      }
    },
  });
}
