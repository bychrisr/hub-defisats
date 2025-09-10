import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsMarketController } from '@/controllers/lnmarkets-market.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

export async function lnmarketsMarketRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const marketController = new LNMarketsMarketController(prisma);

  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Get market data
  fastify.get(
    '/lnmarkets/market',
    {
      schema: {
        description: 'Get LN Markets general market data',
        tags: ['LN Markets - Market Data'],
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
    marketController.getMarketData.bind(marketController)
  );

  // Get futures market data
  fastify.get(
    '/lnmarkets/futures/data',
    {
      schema: {
        description: 'Get LN Markets futures market data',
        tags: ['LN Markets - Market Data'],
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
    marketController.getFuturesData.bind(marketController)
  );

  // Get options market data
  fastify.get(
    '/lnmarkets/options/data',
    {
      schema: {
        description: 'Get LN Markets options market data',
        tags: ['LN Markets - Market Data'],
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
    marketController.getOptionsData.bind(marketController)
  );

  // Test LN Markets connection
  fastify.get(
    '/lnmarkets/test-connection',
    {
      schema: {
        description: 'Test LN Markets API connection',
        tags: ['LN Markets - Market Data'],
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
                  error: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    marketController.testConnection.bind(marketController)
  );
}
