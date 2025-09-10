import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIService } from '@/services/lnmarkets-api.service';

const prisma = new PrismaClient();

export async function lnmarketsRoutes(fastify: FastifyInstance) {
  // GET /api/lnmarkets/positions - Get user positions
  fastify.get('/positions', {
    preHandler: [(fastify as any).authenticate],
    schema: {
      description: 'Get LN Markets positions',
      tags: ['LN Markets'],
      security: [{ bearerAuth: [] }],
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
                      market: { type: 'string' },
                      side: { type: 'string' },
                      size: { type: 'number' },
                      entryPrice: { type: 'number' },
                      liquidationPrice: { type: 'number' },
                      unrealizedPnl: { type: 'number' },
                    },
                  },
                },
                marginInfo: {
                  type: 'object',
                  properties: {
                    margin: { type: 'number' },
                    availableMargin: { type: 'number' },
                    marginLevel: { type: 'number' },
                    totalValue: { type: 'number' },
                    totalUnrealizedPnl: { type: 'number' },
                  },
                },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      console.log('🔍 LN MARKETS - Getting positions for user:', user?.id);

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
        isTestnet: process.env.NODE_ENV === 'development',
      });

      // Get positions using the new service
      const positions = await lnMarketsService.getUserPositions();

      console.log('✅ LN MARKETS - Positions retrieved successfully');

      return reply.status(200).send({
        success: true,
        data: positions || [],
      });
    } catch (error: any) {
      console.error('❌ LN MARKETS - Error getting positions:', error);
      
      // Handle specific LN Markets API errors
      if (error.response?.status === 401) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid LN Markets API credentials. Please check your API key, secret, and passphrase.',
        });
      }
      
      if (error.response?.status === 403) {
        return reply.status(400).send({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'LN Markets API credentials do not have sufficient permissions.',
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get LN Markets positions',
      });
    }
  });

  // GET /api/lnmarkets/market-data/:market - Get market data
  fastify.get('/market-data/:market', {
    preHandler: [(fastify as any).authenticate],
    schema: {
      description: 'Get LN Markets market data',
      tags: ['LN Markets'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          market: { type: 'string' },
        },
        required: ['market'],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const { market } = request.params as { market: string };
      console.log('🔍 LN MARKETS - Getting market data for:', market);

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
      const lnMarketsService = new LNMarketsService({
        apiKey: userProfile.ln_markets_api_key,
        apiSecret: userProfile.ln_markets_api_secret,
        passphrase: userProfile.ln_markets_passphrase,
      });

      // Get market data
      const marketData = await lnMarketsService.getMarketData(market);

      console.log('✅ LN MARKETS - Market data retrieved successfully');

      return reply.status(200).send({
        success: true,
        data: marketData,
      });
    } catch (error: any) {
      console.error('❌ LN MARKETS - Error getting market data:', error);
      
      // Handle specific LN Markets API errors
      if (error.response?.status === 401) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid LN Markets API credentials. Please check your API key, secret, and passphrase.',
        });
      }
      
      if (error.response?.status === 403) {
        return reply.status(400).send({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'LN Markets API credentials do not have sufficient permissions.',
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get market data',
      });
    }
  });
}
