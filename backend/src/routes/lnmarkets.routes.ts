import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIService } from '@/services/lnmarkets-api.service';
import { authMiddleware } from '@/middleware/auth.middleware';

const prisma = new PrismaClient();

export async function lnmarketsRoutes(fastify: FastifyInstance) {
  // GET /api/lnmarkets/positions - Get user positions
  fastify.get('/positions', {
    preHandler: [authMiddleware],
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
                      uid: { type: 'string' },
                      type: { type: 'string' },
                      side: { type: 'string' },
                      opening_fee: { type: 'number' },
                      closing_fee: { type: 'number' },
                      maintenance_margin: { type: 'number' },
                      quantity: { type: 'number' },
                      margin: { type: 'number' },
                      leverage: { type: 'number' },
                      price: { type: 'number' },
                      liquidation: { type: 'number' },
                      stoploss: { type: 'number' },
                      takeprofit: { type: 'number' },
                      exit_price: { type: ['number', 'null'] },
                      pl: { type: 'number' },
                      creation_ts: { type: 'number' },
                      market_filled_ts: { type: 'number' },
                      closed_ts: { type: ['number', 'null'] },
                      entry_price: { type: 'number' },
                      entry_margin: { type: 'number' },
                      open: { type: 'boolean' },
                      running: { type: 'boolean' },
                      canceled: { type: 'boolean' },
                      closed: { type: 'boolean' },
                      sum_carry_fees: { type: 'number' },
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
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        429: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    console.log('🚨🚨🚨 TESTE SIMPLES - ENDPOINT POSITIONS CHAMADO! 🚨🚨🚨');
    console.log('🎯 LN MARKETS CONTROLLER - Starting positions request');
    console.log('📊 Request URL:', request.url);
    console.log('📊 Request method:', request.method);
    console.log('📊 Request headers:', request.headers);
    try {
      const user = (request as any).user;
      console.log('🎯 LN MARKETS CONTROLLER - User info:', {
        id: user?.id,
        email: user?.email,
        planType: user?.planType
      });

      // Get user credentials
      console.log('🎯 LN MARKETS CONTROLLER - Fetching user credentials from database');
      const userProfile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true,
        },
      });

      console.log('🎯 LN MARKETS CONTROLLER - User profile from DB:', {
        hasApiKey: !!userProfile?.ln_markets_api_key,
        hasApiSecret: !!userProfile?.ln_markets_api_secret,
        hasPassphrase: !!userProfile?.ln_markets_passphrase,
        apiKeyPreview: userProfile?.ln_markets_api_key ? `${userProfile.ln_markets_api_key.substring(0, 10)}...` : 'MISSING',
        apiSecretPreview: userProfile?.ln_markets_api_secret ? `${userProfile.ln_markets_api_secret.substring(0, 10)}...` : 'MISSING',
        passphrasePreview: userProfile?.ln_markets_passphrase ? `${userProfile.ln_markets_passphrase.substring(0, 5)}...` : 'MISSING'
      });

      if (!userProfile?.ln_markets_api_key || !userProfile?.ln_markets_api_secret || !userProfile?.ln_markets_passphrase) {
        console.log('❌ LN MARKETS CONTROLLER - Missing credentials, returning 400');
        return reply.status(400).send({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'LN Markets credentials not configured',
        });
      }

      // Initialize LN Markets service
      console.log('🎯 LN MARKETS CONTROLLER - Initializing LN Markets service');
      console.log('🚨 TESTE SIMPLES - ANTES DE CRIAR LNMarketsAPIService!');
      const lnMarketsService = new LNMarketsAPIService({
        apiKey: userProfile.ln_markets_api_key,
        apiSecret: userProfile.ln_markets_api_secret,
        passphrase: userProfile.ln_markets_passphrase,
        isTestnet: false, // Force mainnet for now
      });
      console.log('🚨 TESTE SIMPLES - DEPOIS DE CRIAR LNMarketsAPIService!');

      console.log('🎯 LN MARKETS CONTROLLER - Service initialized, calling getUserPositions');
      // Get positions using the new service
      const positions = await lnMarketsService.getUserPositions();

      console.log('✅ LN MARKETS CONTROLLER - Positions retrieved successfully:', {
        positionsCount: Array.isArray(positions) ? positions.length : 'not array',
        positions: positions
      });
      
      // Log detailed info about positions
      if (Array.isArray(positions) && positions.length > 0) {
        console.log('🔍 LN MARKETS CONTROLLER - First position details:', {
          id: positions[0].id,
          side: positions[0].side,
          quantity: positions[0].quantity,
          price: positions[0].price,
          liquidation: positions[0].liquidation,
          margin: positions[0].margin,
          pl: positions[0].pl,
          leverage: positions[0].leverage,
          allKeys: Object.keys(positions[0])
        });
      }

      return reply.status(200).send({
        success: true,
        data: {
          positions: positions || [],
        },
      });
    } catch (error: any) {
      console.error('❌ LN MARKETS CONTROLLER - Error getting positions:', {
        message: error.message,
        stack: error.stack,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        fullError: error
      });
      
      // Handle specific error types
      if (error.message?.includes('LN Markets credentials not configured')) {
        return reply.status(400).send({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'LN Markets credentials not configured. Please update your profile with API credentials.',
        });
      }
      
      if (error.message?.includes('Invalid API credentials')) {
        return reply.status(400).send({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Invalid LN Markets API credentials. Please check your API key, secret, and passphrase.',
        });
      }
      
      if (error.message?.includes('Insufficient permissions')) {
        return reply.status(400).send({
          success: false,
          error: 'INSUFFICIENT_PERMISSIONS',
          message: 'LN Markets API credentials do not have sufficient permissions.',
        });
      }
      
      // Handle HTTP status codes
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
      
      if (error.response?.status === 429) {
        return reply.status(429).send({
          success: false,
          error: 'RATE_LIMIT',
          message: 'Rate limit exceeded. Please try again later.',
        });
      }
      
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to get LN Markets positions. Please try again later.',
      });
    }
  });

  // GET /api/lnmarkets/market-data/:market - Get market data
  fastify.get('/market-data/:market', {
    preHandler: [authMiddleware],
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
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
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

      // Decrypt credentials (assuming we have access to decryption)
      const authService = new (await import('../services/auth.service')).AuthService(prisma, {} as any);
      const apiKey = authService.decryptData(userProfile.ln_markets_api_key);
      const apiSecret = authService.decryptData(userProfile.ln_markets_api_secret);
      const passphrase = authService.decryptData(userProfile.ln_markets_passphrase);

      // Initialize LN Markets service
      const lnMarketsService = new LNMarketsAPIService({
        apiKey,
        apiSecret,
        passphrase,
        isTestnet: false, // Force mainnet for now
      });

      // Get market data
      const marketData = await lnMarketsService.getMarketData();

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

