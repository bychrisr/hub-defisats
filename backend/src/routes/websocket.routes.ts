import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@/middleware/auth.middleware';
import { websocketManager } from '@/services/websocket-manager.service';

export async function websocketRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  // WebSocket route for real-time data (without authentication for testing)
  fastify.get('/ws/realtime', { websocket: true }, async (connection, req) => {
    const userId = req.query.userId as string;
    
    console.log('🔌 WEBSOCKET ROUTE - Nova conexão recebida:', {
      userId,
      remoteAddress: req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    });
    
    if (!userId) {
      console.log('❌ WEBSOCKET ROUTE - User ID não fornecido, fechando conexão');
      connection.socket.close(1008, 'User ID is required');
      return;
    }

    console.log('🔌 WEBSOCKET ROUTE - Processando conexão para usuário:', userId);
    
    // Get user credentials from database or config
    const credentials = {
      apiKey: process.env.LN_MARKETS_API_KEY || '',
      apiSecret: process.env.LN_MARKETS_API_SECRET || '',
      passphrase: process.env.LN_MARKETS_PASSPHRASE || '',
      isTestnet: process.env.LN_MARKETS_TESTNET === 'true'
    };

    console.log('🔑 WEBSOCKET ROUTE - Credenciais LN Markets:', {
      hasApiKey: !!credentials.apiKey,
      hasApiSecret: !!credentials.apiSecret,
      hasPassphrase: !!credentials.passphrase,
      isTestnet: credentials.isTestnet
    });

    try {
      // Create WebSocket connection
      console.log('🔄 WEBSOCKET ROUTE - Criando conexão WebSocket para usuário:', userId);
      const wsService = await websocketManager.createConnection(userId, credentials);
      
      // Set up message forwarding
      wsService.on('marketUpdate', (data) => {
        console.log('📈 WEBSOCKET ROUTE - Enviando dados de mercado:', data);
        const message = {
          type: 'market_data',
          data: {
            symbol: 'BTC',
            price: data.price,
            volume: data.volume,
            timestamp: data.timestamp
          }
        };
        connection.socket.send(JSON.stringify(message));
      });

      wsService.on('positionUpdate', (data) => {
        console.log('📊 WEBSOCKET ROUTE - Enviando atualização de posição:', data);
        const message = {
          type: 'position_update',
          data: {
            id: data.id,
            symbol: 'BTC',
            side: data.side,
            quantity: data.quantity,
            price: data.price,
            margin: data.margin,
            leverage: data.leverage,
            pnl: data.pnl,
            pnlPercent: data.pnl / data.margin * 100,
            timestamp: data.timestamp
          }
        };
        connection.socket.send(JSON.stringify(message));
      });

      wsService.on('marginUpdate', (data) => {
        console.log('💰 WEBSOCKET ROUTE - Enviando atualização de margem:', data);
        const message = {
          type: 'balance_update',
          data: {
            total_balance: data.totalValue,
            available_balance: data.availableMargin,
            margin_used: data.margin,
            timestamp: data.timestamp
          }
        };
        connection.socket.send(JSON.stringify(message));
      });

      // Handle client messages
      connection.socket.on('message', (message) => {
        console.log('📨 WEBSOCKET ROUTE - Mensagem recebida do cliente:', {
          userId,
          message: message.toString(),
          timestamp: new Date().toISOString()
        });
        
        try {
          const data = JSON.parse(message.toString());
          console.log('📨 WEBSOCKET ROUTE - Dados parseados:', data);
          
          switch (data.type) {
            case 'subscribe_market':
              console.log('📈 WEBSOCKET ROUTE - Inscrevendo em mercado:', data.symbol);
              wsService.subscribeToMarket(data.symbol || 'BTC');
              break;
            case 'subscribe_positions':
              console.log('📊 WEBSOCKET ROUTE - Inscrevendo em posições');
              wsService.subscribeToPositions();
              break;
            case 'subscribe_margin':
              console.log('💰 WEBSOCKET ROUTE - Inscrevendo em margem');
              wsService.subscribeToMargin();
              break;
            default:
              console.log('❓ WEBSOCKET ROUTE - Tipo de mensagem desconhecido:', data.type);
          }
        } catch (error) {
          console.error('❌ WEBSOCKET ROUTE - Erro ao processar mensagem:', {
            error,
            message: message.toString(),
            userId,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Handle connection close
      connection.socket.on('close', (code, reason) => {
        console.log('🔌 WEBSOCKET ROUTE - Conexão fechada:', {
          userId,
          code,
          reason: reason.toString(),
          timestamp: new Date().toISOString()
        });
        websocketManager.disconnectUser(userId);
      });

      // Handle connection error
      connection.socket.on('error', (error) => {
        console.error('❌ WEBSOCKET ROUTE - Erro na conexão:', {
          userId,
          error,
          timestamp: new Date().toISOString()
        });
      });

    } catch (error) {
      console.error('❌ WEBSOCKET ROUTE - Erro ao criar conexão:', {
        error,
        userId,
        timestamp: new Date().toISOString()
      });
      connection.socket.close(1011, 'Internal server error');
    }
  });

  // Apply authentication middleware to all routes (except WebSocket routes above)
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
        console.log('🔌 WEBSOCKET ROUTES - Usuário conectando:', {
          userId: user.id,
          userEmail: user.email,
          timestamp: new Date().toISOString(),
          ip: request.ip,
          userAgent: request.headers['user-agent']
        });

        // Get user credentials
        console.log('🔑 WEBSOCKET ROUTES - Buscando credenciais do usuário:', user.id);
        const userProfile = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            ln_markets_api_key: true,
            ln_markets_api_secret: true,
            ln_markets_passphrase: true,
          },
        });

        console.log('🔑 WEBSOCKET ROUTES - Credenciais encontradas:', {
          hasApiKey: !!userProfile?.ln_markets_api_key,
          hasApiSecret: !!userProfile?.ln_markets_api_secret,
          hasPassphrase: !!userProfile?.ln_markets_passphrase,
          userId: user.id
        });

        if (!userProfile?.ln_markets_api_key || !userProfile?.ln_markets_api_secret || !userProfile?.ln_markets_passphrase) {
          console.log('❌ WEBSOCKET ROUTES - Credenciais LN Markets não configuradas para usuário:', user.id);
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

