import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/middleware/auth.middleware';
import { websocketManager } from '@/services/websocket-manager.service';

export async function websocketRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Connect to WebSocket
  fastify.post(
    '/websocket/connect',
    {
      schema: {
        description: 'Connect to LN Markets WebSocket',
        tags: ['WebSocket'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              connectionId: { type: 'string' }
            }
          },
          400: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        console.log('🔌 WEBSOCKET ROUTES - User connecting:', user.id);

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

        // Create WebSocket connection
        const wsService = await websocketManager.createConnection(user.id, {
          apiKey: userProfile.ln_markets_api_key,
          apiSecret: userProfile.ln_markets_api_secret,
          passphrase: userProfile.ln_markets_passphrase,
          isTestnet: false,
        });

        console.log('✅ WEBSOCKET ROUTES - User connected successfully:', user.id);

        return reply.send({
          success: true,
          message: 'Connected to WebSocket successfully',
          connectionId: user.id
        });

      } catch (error: any) {
        console.error('❌ WEBSOCKET ROUTES - Connection error:', error);
        return reply.status(500).send({
          success: false,
          error: 'CONNECTION_FAILED',
          message: 'Failed to connect to WebSocket',
          details: error.message
        });
      }
    }
  );

  // Subscribe to market data
  fastify.post(
    '/websocket/subscribe/market',
    {
      schema: {
        description: 'Subscribe to market data updates',
        tags: ['WebSocket'],
        body: {
          type: 'object',
          properties: {
            market: { type: 'string', default: 'BTC' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const { market = 'BTC' } = request.body as { market?: string };

        await websocketManager.subscribeToMarket(user.id, market);

        return reply.send({
          success: true,
          message: `Subscribed to ${market} market data`
        });

      } catch (error: any) {
        console.error('❌ WEBSOCKET ROUTES - Market subscription error:', error);
        return reply.status(500).send({
          success: false,
          error: 'SUBSCRIPTION_FAILED',
          message: 'Failed to subscribe to market data',
          details: error.message
        });
      }
    }
  );

  // Subscribe to position updates
  fastify.post(
    '/websocket/subscribe/positions',
    {
      schema: {
        description: 'Subscribe to position updates',
        tags: ['WebSocket'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;

        await websocketManager.subscribeToPositions(user.id);

        return reply.send({
          success: true,
          message: 'Subscribed to position updates'
        });

      } catch (error: any) {
        console.error('❌ WEBSOCKET ROUTES - Position subscription error:', error);
        return reply.status(500).send({
          success: false,
          error: 'SUBSCRIPTION_FAILED',
          message: 'Failed to subscribe to position updates',
          details: error.message
        });
      }
    }
  );

  // Subscribe to margin updates
  fastify.post(
    '/websocket/subscribe/margin',
    {
      schema: {
        description: 'Subscribe to margin updates',
        tags: ['WebSocket'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;

        await websocketManager.subscribeToMargin(user.id);

        return reply.send({
          success: true,
          message: 'Subscribed to margin updates'
        });

      } catch (error: any) {
        console.error('❌ WEBSOCKET ROUTES - Margin subscription error:', error);
        return reply.status(500).send({
          success: false,
          error: 'SUBSCRIPTION_FAILED',
          message: 'Failed to subscribe to margin updates',
          details: error.message
        });
      }
    }
  );

  // Get connection status
  fastify.get(
    '/websocket/status',
    {
      schema: {
        description: 'Get WebSocket connection status',
        tags: ['WebSocket'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              connected: { type: 'boolean' },
              subscriptions: { type: 'array', items: { type: 'string' } }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;
        const connection = websocketManager.getConnection(user.id);
        const subscriptions = websocketManager.getUserSubscriptions(user.id);

        return reply.send({
          success: true,
          connected: connection ? connection.getConnectionStatus() : false,
          subscriptions
        });

      } catch (error: any) {
        console.error('❌ WEBSOCKET ROUTES - Status error:', error);
        return reply.status(500).send({
          success: false,
          error: 'STATUS_FAILED',
          message: 'Failed to get connection status',
          details: error.message
        });
      }
    }
  );

  // Disconnect from WebSocket
  fastify.post(
    '/websocket/disconnect',
    {
      schema: {
        description: 'Disconnect from WebSocket',
        tags: ['WebSocket'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const user = (request as any).user;

        websocketManager.disconnectUser(user.id);

        return reply.send({
          success: true,
          message: 'Disconnected from WebSocket'
        });

      } catch (error: any) {
        console.error('❌ WEBSOCKET ROUTES - Disconnect error:', error);
        return reply.status(500).send({
          success: false,
          error: 'DISCONNECT_FAILED',
          message: 'Failed to disconnect from WebSocket',
          details: error.message
        });
      }
    }
  );

  // Get manager statistics
  fastify.get(
    '/websocket/stats',
    {
      schema: {
        description: 'Get WebSocket manager statistics',
        tags: ['WebSocket'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              activeConnections: { type: 'number' },
              connectionCount: { type: 'number' }
            }
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const activeConnections = websocketManager.getActiveConnections();
        const connectionCount = websocketManager.getConnectionCount();

        return reply.send({
          success: true,
          activeConnections: activeConnections.length,
          connectionCount
        });

      } catch (error: any) {
        console.error('❌ WEBSOCKET ROUTES - Stats error:', error);
        return reply.status(500).send({
          success: false,
          error: 'STATS_FAILED',
          message: 'Failed to get WebSocket statistics',
          details: error.message
        });
      }
    }
  );
}

