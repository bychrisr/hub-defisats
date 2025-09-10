import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsOptionsController } from '@/controllers/lnmarkets-options.controller';
import { authMiddleware } from '@/middleware/auth.middleware';

export async function lnmarketsOptionsRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const optionsController = new LNMarketsOptionsController(prisma);

  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Close all options trades
  fastify.post(
    '/options/close-all-trades',
    {
      schema: {
        description: 'Close all options trades',
        tags: ['LN Markets - Options'],
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
    optionsController.closeAllTrades.bind(optionsController)
  );

  // Get options trades
  fastify.get(
    '/options/trades',
    {
      schema: {
        description: 'Get options trades with pagination and filtering',
        tags: ['LN Markets - Options'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string', description: 'Number of trades to return' },
            offset: { type: 'string', description: 'Number of trades to skip' },
            status: { type: 'string', description: 'Filter by trade status' }
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
    optionsController.getTrades.bind(optionsController)
  );

  // Update options trade
  fastify.put(
    '/options/trades/:id',
    {
      schema: {
        description: 'Update options trade parameters',
        tags: ['LN Markets - Options'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Trade ID' }
          }
        },
        body: {
          type: 'object',
          properties: {
            stoploss: { type: 'number', description: 'Stop loss price' },
            takeprofit: { type: 'number', description: 'Take profit price' }
          }
        },
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
    optionsController.updateTrade.bind(optionsController)
  );

  // Create options trade
  fastify.post(
    '/options/trades',
    {
      schema: {
        description: 'Create a new options trade',
        tags: ['LN Markets - Options'],
        body: {
          type: 'object',
          required: ['side', 'quantity', 'instrument'],
          properties: {
            side: { 
              type: 'string', 
              enum: ['b', 's'], 
              description: 'Trade side: b (buy) or s (sell)' 
            },
            quantity: { 
              type: 'number', 
              description: 'Position size' 
            },
            instrument: { 
              type: 'string', 
              description: 'Options instrument identifier' 
            },
            stoploss: { 
              type: 'number', 
              description: 'Stop loss price' 
            },
            takeprofit: { 
              type: 'number', 
              description: 'Take profit price' 
            }
          }
        },
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
    optionsController.createTrade.bind(optionsController)
  );

  // Get options market data
  fastify.get(
    '/options/market',
    {
      schema: {
        description: 'Get options market data',
        tags: ['LN Markets - Options'],
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
    optionsController.getOptionsMarket.bind(optionsController)
  );

  // Get specific options trade
  fastify.get(
    '/options/trades/:id',
    {
      schema: {
        description: 'Get specific options trade by ID',
        tags: ['LN Markets - Options'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Trade ID' }
          }
        },
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
    optionsController.getTrade.bind(optionsController)
  );
}
