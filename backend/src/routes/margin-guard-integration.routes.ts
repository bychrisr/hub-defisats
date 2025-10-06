import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { MarginGuardIntegrationController } from '../controllers/margin-guard-integration.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminAuthMiddleware } from '../middleware/auth.middleware';

export async function marginGuardIntegrationRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  
  // Redis connection (mock for now - should be configured properly)
  const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD
  };

  const marginGuardIntegrationController = new MarginGuardIntegrationController(prisma, redisConnection);

  // Initialize Margin Guard system
  fastify.post(
    '/initialize',
    {
      preHandler: [adminAuthMiddleware],
      schema: {
        description: 'Initialize Margin Guard system',
        tags: ['margin-guard', 'admin'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string' }
            }
          },
          500: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'string' }
            }
          }
        }
      }
    },
    marginGuardIntegrationController.initialize.bind(marginGuardIntegrationController)
  );

  // Execute Margin Guard for specific user
  fastify.post(
    '/execute/:userId',
    {
      preHandler: [authMiddleware],
      schema: {
        description: 'Execute Margin Guard for a specific user',
        tags: ['margin-guard'],
        params: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: {
              type: 'string',
              description: 'User ID to execute Margin Guard for'
            }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' },
              message: { type: 'string' },
              timestamp: { type: 'string' }
            }
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'string' }
            }
          },
          500: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'string' }
            }
          }
        }
      }
    },
    marginGuardIntegrationController.executeForUser.bind(marginGuardIntegrationController)
  );

  // Execute Margin Guard for all users
  fastify.post(
    '/execute-all',
    {
      preHandler: [adminAuthMiddleware],
      schema: {
        description: 'Execute Margin Guard for all users with active automations',
        tags: ['margin-guard', 'admin'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  successful: { type: 'number' },
                  failed: { type: 'number' },
                  results: { type: 'array' }
                }
              },
              message: { type: 'string' },
              timestamp: { type: 'string' }
            }
          },
          500: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'string' }
            }
          }
        }
      }
    },
    marginGuardIntegrationController.executeForAllUsers.bind(marginGuardIntegrationController)
  );

  // Get system status
  fastify.get(
    '/status',
    {
      preHandler: [authMiddleware],
      schema: {
        description: 'Get Margin Guard system status',
        tags: ['margin-guard'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  isInitialized: { type: 'boolean' },
                  activeAutomations: { type: 'number' },
                  totalUsers: { type: 'number' },
                  queueStats: { type: 'object' },
                  timestamp: { type: 'string' }
                }
              },
              message: { type: 'string' },
              timestamp: { type: 'string' }
            }
          },
          500: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'string' }
            }
          }
        }
      }
    },
    marginGuardIntegrationController.getSystemStatus.bind(marginGuardIntegrationController)
  );

  // Test Margin Guard system
  fastify.post(
    '/test',
    {
      preHandler: [adminAuthMiddleware],
      schema: {
        description: 'Test Margin Guard system with brainoschris@gmail.com user',
        tags: ['margin-guard', 'admin', 'test'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  testUserId: { type: 'string' },
                  result: { type: 'object' },
                  systemStatus: { type: 'object' }
                }
              },
              message: { type: 'string' },
              timestamp: { type: 'string' }
            }
          },
          500: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'string' }
            }
          }
        }
      }
    },
    marginGuardIntegrationController.testSystem.bind(marginGuardIntegrationController)
  );

  // Shutdown Margin Guard system
  fastify.post(
    '/shutdown',
    {
      preHandler: [adminAuthMiddleware],
      schema: {
        description: 'Shutdown Margin Guard system',
        tags: ['margin-guard', 'admin'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              timestamp: { type: 'string' }
            }
          },
          500: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'string' }
            }
          }
        }
      }
    },
    marginGuardIntegrationController.shutdown.bind(marginGuardIntegrationController)
  );

  // Health check endpoint
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Health check for Margin Guard system',
        tags: ['margin-guard', 'health'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              status: { type: 'string' },
              timestamp: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      return reply.send({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    }
  );
}
