import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/middleware/auth.middleware';
import { LNMarketsAPIService } from '@/services/lnmarkets-api.service';

export async function marketDataRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  
  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Get historical market data (candlesticks)
  fastify.get('/market/historical', {
    schema: {
      description: 'Get historical market data for charting',
      tags: ['Market Data'],
      querystring: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Trading symbol (e.g., BTCUSD)' },
          timeframe: { type: 'string', description: 'Timeframe (1m, 5m, 15m, 1h, 4h, 1d)', default: '1h' },
          limit: { type: 'string', description: 'Number of candles to return', default: '100' }
        },
        required: ['symbol']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                symbol: { type: 'string' },
                timeframe: { type: 'string' },
                candles: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      time: { type: 'number' },
                      open: { type: 'number' },
                      high: { type: 'number' },
                      low: { type: 'number' },
                      close: { type: 'number' },
                      volume: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { symbol, timeframe = '1h', limit = '100' } = request.query as any;
      
      console.log('🔍 MARKET DATA - Getting historical data for:', { symbol, timeframe, limit });

      // Get user credentials
      const userProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true,
        },
      });

      if (!userProfile?.ln_markets_api_key || !userProfile?.ln_markets_api_secret || !userProfile?.ln_markets_passphrase) {
        return reply.status(400).send({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'LN Markets credentials not configured',
        });
      }

      // Initialize LN Markets service
      const lnMarketsService = new LNMarketsAPIService({
        apiKey: userProfile.ln_markets_api_key,
        apiSecret: userProfile.ln_markets_api_secret,
        passphrase: userProfile.ln_markets_passphrase,
        isTestnet: false,
      });

      // Get historical data from LN Markets
      const historicalData = await lnMarketsService.getHistoricalData(symbol, timeframe, parseInt(limit));
      
      console.log('✅ MARKET DATA - Historical data retrieved:', historicalData.length, 'candles');

      return reply.status(200).send({
        success: true,
        data: {
          symbol,
          timeframe,
          candles: historicalData
        }
      });
    } catch (error: any) {
      console.error('❌ MARKET DATA - Error getting historical data:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get historical market data',
        details: error.message
      });
    }
  });

  // Get current market data
  fastify.get('/market/data', {
    schema: {
      description: 'Get current market data',
      tags: ['Market Data'],
      querystring: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: 'Trading symbol (e.g., BTCUSD)', default: 'BTCUSD' }
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
                symbol: { type: 'string' },
                price: { type: 'number' },
                change24h: { type: 'number' },
                changePercent24h: { type: 'number' },
                volume24h: { type: 'number' },
                high24h: { type: 'number' },
                low24h: { type: 'number' },
                timestamp: { type: 'number' }
              }
            }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { symbol = 'BTCUSD' } = request.query as any;
      
      console.log('🔍 MARKET DATA - Getting current market data for:', symbol);

      // Get user credentials
      const userProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true,
        },
      });

      if (!userProfile?.ln_markets_api_key || !userProfile?.ln_markets_api_secret || !userProfile?.ln_markets_passphrase) {
        return reply.status(400).send({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'LN Markets credentials not configured',
        });
      }

      // Initialize LN Markets service
      const lnMarketsService = new LNMarketsAPIService({
        apiKey: userProfile.ln_markets_api_key,
        apiSecret: userProfile.ln_markets_api_secret,
        passphrase: userProfile.ln_markets_passphrase,
        isTestnet: false,
      });

      // Get current market data
      const marketData = await lnMarketsService.getMarketData();
      
      console.log('✅ MARKET DATA - Current market data retrieved:', marketData);

      return reply.status(200).send({
        success: true,
        data: {
          symbol,
          price: marketData.price || 0,
          change24h: marketData.change24h || 0,
          changePercent24h: marketData.changePercent24h || 0,
          volume24h: marketData.volume24h || 0,
          high24h: marketData.high24h || 0,
          low24h: marketData.low24h || 0,
          timestamp: Date.now()
        }
      });
    } catch (error: any) {
      console.error('❌ MARKET DATA - Error getting current market data:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get current market data',
        details: error.message
      });
    }
  });
}
