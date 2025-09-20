import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsFuturesController } from '../controllers/lnmarkets-futures.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function lnmarketsFuturesRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const futuresController = new LNMarketsFuturesController(prisma);

  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Add margin to a running trade
  fastify.post(
    '/futures/add-margin',
    {
      schema: {
        description: 'Add margin to a running futures trade',
        tags: ['LN Markets - Futures'],
        body: {
          type: 'object',
          required: ['id', 'amount'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Trade ID'
            },
            amount: {
              type: 'number',
              description: 'Amount of margin to add (in sats)'
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
    futuresController.addMargin.bind(futuresController)
  );

  // Cancel all futures trades
  fastify.post(
    '/futures/cancel-all-trades',
    {
      schema: {
        description: 'Cancel all futures trades',
        tags: ['LN Markets - Futures'],
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
    futuresController.cancelAllTrades.bind(futuresController)
  );

  // Close all futures trades
  fastify.post(
    '/futures/close-all-trades',
    {
      schema: {
        description: 'Close all futures trades',
        tags: ['LN Markets - Futures'],
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
    futuresController.closeAllTrades.bind(futuresController)
  );

  // Get futures trades
  fastify.get(
    '/futures/trades',
    {
      schema: {
        description: 'Get futures trades with pagination and filtering',
        tags: ['LN Markets - Futures'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'string', description: 'Number of trades to return' },
            offset: { type: 'string', description: 'Number of trades to skip' },
            status: { type: 'string', description: 'Filter by trade status' },
            type: { type: 'string', description: 'Filter by trade type' }
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
    futuresController.getTrades.bind(futuresController)
  );

  // Update futures trade
  fastify.put(
    '/futures/trades/:id',
    {
      schema: {
        description: 'Update futures trade parameters',
        tags: ['LN Markets - Futures'],
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
            takeprofit: { type: 'number', description: 'Take profit price' },
            leverage: { type: 'number', description: 'Leverage' }
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
    futuresController.updateTrade.bind(futuresController)
  );

  // Create futures trade
  fastify.post(
    '/futures/trades',
    {
      schema: {
        description: 'Create a new futures trade',
        tags: ['LN Markets - Futures'],
        body: {
          type: 'object',
          required: ['side', 'quantity', 'leverage'],
          properties: {
            side: { 
              type: 'string', 
              enum: ['b', 's'], 
              description: 'Trade side: b (buy) or s (sell)' 
            },
            quantity: { 
              type: 'number', 
              description: 'Position size in USD' 
            },
            leverage: { 
              type: 'number', 
              description: 'Leverage' 
            },
            stoploss: { 
              type: 'number', 
              description: 'Stop loss price' 
            },
            takeprofit: { 
              type: 'number', 
              description: 'Take profit price' 
            },
            margin_mode: { 
              type: 'string', 
              enum: ['isolated', 'cross'], 
              description: 'Margin mode' 
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
    futuresController.createTrade.bind(futuresController)
  );

  // Get futures market data
  fastify.get(
    '/futures/market',
    {
      schema: {
        description: 'Get futures market data',
        tags: ['LN Markets - Futures'],
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
    futuresController.getFuturesMarket.bind(futuresController)
  );

  // Get specific futures trade
  fastify.get(
    '/futures/trades/:id',
    {
      schema: {
        description: 'Get specific futures trade by ID',
        tags: ['LN Markets - Futures'],
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
    futuresController.getTrade.bind(futuresController)
  );
}
