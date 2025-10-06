import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { MarginGuardUserController } from '../controllers/margin-guard-user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function marginGuardUserRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const marginGuardUserController = new MarginGuardUserController(prisma);

  // Apply auth middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Get user's plan features and limitations
  fastify.get(
    '/plan-features',
    {
      schema: {
        description: 'Get user plan features and limitations for Margin Guard',
        tags: ['margin-guard', 'user'],
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
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      planType: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    marginGuardUserController.getPlanFeatures.bind(marginGuardUserController)
  );

  // Get user's current positions
  fastify.get(
    '/positions',
    {
      schema: {
        description: 'Get user current positions for Margin Guard',
        tags: ['margin-guard', 'user'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  positions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        symbol: { type: 'string' },
                        side: { type: 'string' },
                        size: { type: 'number' },
                        margin: { type: 'number' },
                        liquidation_price: { type: 'number' },
                        current_price: { type: 'number' },
                        pnl: { type: 'number' },
                        distance_to_liquidation: { type: 'number' }
                      }
                    }
                  },
                  total: { type: 'number' },
                  closestToLiquidation: { type: 'object' }
                }
              }
            }
          }
        }
      }
    },
    marginGuardUserController.getUserPositions.bind(marginGuardUserController)
  );

  // Get current market price
  fastify.get(
    '/current-price',
    {
      schema: {
        description: 'Get current market price for Margin Guard calculations',
        tags: ['margin-guard', 'user'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  price: { type: 'number' },
                  symbol: { type: 'string' },
                  timestamp: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    marginGuardUserController.getCurrentPrice.bind(marginGuardUserController)
  );

  // Create or update user's Margin Guard configuration
  fastify.post(
    '/',
    {
      schema: {
        description: 'Create or update user Margin Guard configuration',
        tags: ['margin-guard', 'user'],
        body: {
          type: 'object',
          required: ['enabled', 'margin_threshold', 'action'],
          properties: {
            enabled: { type: 'boolean' },
            margin_threshold: { type: 'number', minimum: 0.1, maximum: 100 },
            action: { 
              type: 'string', 
              enum: ['close_position', 'reduce_position', 'add_margin', 'increase_liquidation_distance'] 
            },
            reduce_percentage: { type: 'number', minimum: 1, maximum: 100 },
            add_margin_amount: { type: 'number', minimum: 0 },
            new_liquidation_distance: { type: 'number', minimum: 0.1, maximum: 100 },
            selected_positions: { 
              type: 'array', 
              items: { type: 'string' } 
            },
            protection_mode: { 
              type: 'string', 
              enum: ['unitario', 'total', 'both'] 
            },
            individual_configs: { type: 'object' },
            notifications: {
              type: 'object',
              properties: {
                push: { type: 'boolean' },
                email: { type: 'boolean' },
                telegram: { type: 'boolean' },
                whatsapp: { type: 'boolean' },
                webhook: { type: 'boolean' }
              }
            }
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
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' },
              warnings: { type: 'array' }
            }
          }
        }
      }
    },
    marginGuardUserController.createOrUpdateConfiguration.bind(marginGuardUserController)
  );

  // Get user's current Margin Guard configuration
  fastify.get(
    '/configuration',
    {
      schema: {
        description: 'Get user current Margin Guard configuration',
        tags: ['margin-guard', 'user'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  configuration: { type: 'object' },
                  lastUpdated: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    marginGuardUserController.getCurrentConfiguration.bind(marginGuardUserController)
  );
}
