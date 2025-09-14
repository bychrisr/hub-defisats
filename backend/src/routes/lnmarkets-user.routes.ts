import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsUserController } from '@/controllers/lnmarkets-user.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

export async function lnmarketsUserRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const userController = new LNMarketsUserController(prisma);

  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Get user data
  fastify.get(
    '/lnmarkets/user',
    {
      schema: {
        description: 'Get LN Markets user data',
        tags: ['LN Markets - User'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object' }
            }
          }
        }
      }
    },
    userController.getUser.bind(userController)
  );

  // Get user balance
  fastify.get(
    '/lnmarkets/user/balance',
    {
      schema: {
        description: 'Get LN Markets user balance',
        tags: ['LN Markets - User'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { 
                type: 'object',
                properties: {
                  balance: { type: 'number' },
                  synthetic_usd_balance: { type: 'number' },
                  uid: { type: 'string' },
                  role: { type: 'string' },
                  username: { type: 'string' },
                  login: { type: 'string' },
                  linking_public_key: { type: ['string', 'null'] },
                  show_leaderboard: { type: 'boolean' },
                  email: { type: ['string', 'null'] },
                  email_confirmed: { type: 'boolean' },
                  account_type: { type: 'string' },
                  fee_tier: { type: 'number' }
                },
                additionalProperties: true
              }
            }
          }
        }
      }
    },
    userController.getUserBalance.bind(userController)
  );

  // Get estimated balance (wallet + margin + PnL - fees)
  fastify.get(
    '/lnmarkets/user/estimated-balance',
    {
      schema: {
        description: 'Get estimated balance calculation',
        tags: ['LN Markets - User'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { 
                type: 'object',
                properties: {
                  wallet_balance: { type: 'number' },
                  total_margin: { type: 'number' },
                  total_pnl: { type: 'number' },
                  total_fees: { type: 'number' },
                  estimated_balance: { type: 'number' },
                  total_invested: { type: 'number' },
                  positions_count: { type: 'number' },
                  trades_count: { type: 'number' }
                },
                additionalProperties: true
              }
            }
          }
        }
      }
    },
    userController.getEstimatedBalance.bind(userController)
  );

  // Get user history
  fastify.get(
    '/lnmarkets/user/history',
    {
      schema: {
        description: 'Get LN Markets user history',
        tags: ['LN Markets - User'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string', description: 'Number of records to return' },
            offset: { type: 'string', description: 'Number of records to skip' },
            type: { type: 'string', description: 'Filter by transaction type' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array', items: { type: 'object' } }
            }
          }
        }
      }
    },
    userController.getUserHistory.bind(userController)
  );

  // Get user trades
  fastify.get(
    '/lnmarkets/user/trades',
    {
      schema: {
        description: 'Get LN Markets user trades',
        tags: ['LN Markets - User'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string', description: 'Number of trades to return' },
            offset: { type: 'string', description: 'Number of trades to skip' },
            status: { type: 'string', description: 'Filter by trade status' },
            type: { type: 'string', description: 'Filter by trade type (running, closed)' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array', items: { type: 'object' } }
            }
          }
        }
      }
    },
    userController.getUserTrades.bind(userController)
  );

  // Get user positions
  fastify.get(
    '/lnmarkets/user/positions',
    userController.getUserPositions.bind(userController)
  );

  // Get user orders
  fastify.get(
    '/lnmarkets/user/orders',
    {
      schema: {
        description: 'Get LN Markets user orders',
        tags: ['LN Markets - User'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'array', items: { type: 'object' } }
            }
          }
        }
      }
    },
    userController.getUserOrders.bind(userController)
  );
}
