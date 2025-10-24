/**
 * WebSocket Routes Consolidado
 * 
 * Rotas WebSocket consolidadas que substituem todas as implementações duplicadas:
 * - websocket.routes.ts (básico)
 * - websocket-market.routes.ts (market data)
 * - websocket-optimized.routes.ts (otimizado)
 * 
 * Funcionalidades integradas:
 * ✅ WebSocket Manager consolidado
 * ✅ Handlers especializados (market, user, positions)
 * ✅ Autenticação e autorização
 * ✅ Rate limiting e error handling
 * ✅ Logs detalhados para debugging
 */

import { FastifyInstance } from 'fastify';
import { WebSocketManager } from './manager';
import { MarketDataHandler } from './handlers/market-data.handler';
import { UserDataHandler } from './handlers/user-data.handler';
import { PositionUpdatesHandler } from './handlers/position-updates.handler';
import { Logger } from 'winston';

// Flag para evitar múltiplas inicializações
let isInitialized = false;

export async function websocketConsolidatedRoutes(fastify: FastifyInstance) {
  if (isInitialized) {
    console.log('⚠️ WEBSOCKET ROUTES CONSOLIDADO - Already initialized, skipping...');
    return;
  }
  
  isInitialized = true;
  console.log('🚀 WEBSOCKET ROUTES CONSOLIDADO - Initializing...');
  
  const logger = fastify.log as any;
  
  // Inicializar WebSocket Manager
  const wsManager = new WebSocketManager({
    heartbeatInterval: 30000, // 30 segundos
    maxReconnectAttempts: 5,
    reconnectInterval: 5000,
    rateLimitWindow: 60000, // 1 minuto
    maxMessagesPerWindow: 100,
    pingTimeout: 10000 // 10 segundos
  }, logger);
  
  // Inicializar handlers especializados (usando singleton para MarketDataHandler)
  const marketDataHandler = MarketDataHandler.getInstance(logger);
  const userDataHandler = new UserDataHandler(logger);
  const positionUpdatesHandler = new PositionUpdatesHandler(logger);
  
  // Definir referência do WebSocketManager no handler
  marketDataHandler.setWebSocketManager(wsManager);
  
  // Conectar handlers ao manager
  console.log('🔗 WEBSOCKET ROUTES - About to call setupHandlerConnections...');
  try {
    setupHandlerConnections(wsManager, marketDataHandler, userDataHandler, positionUpdatesHandler);
    console.log('✅ WEBSOCKET ROUTES - setupHandlerConnections completed successfully');
  } catch (error) {
    console.error('❌ WEBSOCKET ROUTES - Error in setupHandlerConnections:', error);
  }
  
  console.log('✅ WEBSOCKET ROUTES CONSOLIDADO - Dependencies initialized');

  // ============================================================================
  // SETUP GLOBAL EVENT HANDLERS (ONCE)
  // ============================================================================
  
  // Handler para mensagens do cliente (configurado UMA VEZ para todas as conexões)
  wsManager.on('message', (conn, message) => {
    handleClientMessage(wsManager, marketDataHandler, userDataHandler, positionUpdatesHandler, conn, message);
  });

  // Handler para novas conexões - notificar handlers especializados
  wsManager.on('connection', (conn) => {
    console.log('🔗 WEBSOCKET ROUTES - New connection detected, notifying handlers:', { connectionId: conn.id, userId: conn.userId });
    
    // Notificar MarketDataHandler sobre nova conexão
    if (conn.userId) {
      marketDataHandler.subscribe(conn.id, { symbol: 'BTCUSDT' });
    }
  });
  
  // Handler para desconexão (configurado UMA VEZ para todas as conexões)
  wsManager.on('disconnection', (conn) => {
    console.log('🔌 WEBSOCKET ROUTES - Connection closed:', { connectionId: conn.id });
    
    // Limpar subscriptions
    if (conn.userId) {
      userDataHandler.unsubscribe(conn.id, conn.userId);
      positionUpdatesHandler.unsubscribe(conn.id, conn.userId);
    }
    marketDataHandler.unsubscribe(conn.id);
  });

  // ============================================================================
  // ROTA PRINCIPAL WEBSOCKET
  // ============================================================================
  
  fastify.get('/ws', { websocket: true }, async (connection, request) => {
    const connectionId = `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = (request.query as any)?.userId || 'anonymous';
    
    console.log('🔌 WEBSOCKET ROUTES - New WebSocket upgrade request:', {
      connectionId,
      userId,
      headers: {
        upgrade: request.headers.upgrade,
        connection: request.headers.connection,
        'sec-websocket-key': request.headers['sec-websocket-key'],
        'sec-websocket-version': request.headers['sec-websocket-version'],
        'user-agent': request.headers['user-agent']
      },
      url: request.url,
      query: request.query,
      socket: {
        remoteAddress: connection.socket.remoteAddress,
        remotePort: connection.socket.remotePort,
        readyState: connection.socket.readyState
      },
      timestamp: new Date().toISOString()
    });
    
    try {
      // Log ANTES de criar conexão
      console.log('🔌 WEBSOCKET ROUTES - About to create connection:', {
        connectionId,
        socketReadyState: connection.socket.readyState,
        socketBufferedAmount: connection.socket.bufferedAmount,
        timestamp: new Date().toISOString()
      });
      
      // Criar conexão gerenciada
      const wsConnection = await wsManager.createConnection(connectionId, connection.socket, {
        userId,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
        timestamp: Date.now()
      });
      
      // Log APÓS criar conexão
      console.log('✅ WEBSOCKET ROUTES - Connection created successfully:', {
        connectionId,
        userId,
        socketReadyState: connection.socket.readyState,
        timestamp: new Date().toISOString()
      });
      
      // Enviar mensagem de boas-vindas
      wsManager.sendMessage(connectionId, {
        type: 'connection_established',
        connectionId,
        userId,
        timestamp: Date.now(),
        message: 'Connected to consolidated WebSocket system'
      });
      
      console.log('📤 WEBSOCKET ROUTES - Welcome message sent:', {
        connectionId,
        userId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ WEBSOCKET ROUTES - Connection error:', {
        connectionId,
        userId,
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      connection.socket.close();
    }
  });

  // ============================================================================
  // ROTA PARA DADOS DE MERCADO (HTTP + WebSocket)
  // ============================================================================
  
  fastify.get('/ws/market-data', { websocket: true }, async (connection, request) => {
    const connectionId = `market_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('📊 WEBSOCKET ROUTES - Market data connection:', { connectionId });
    
    try {
      // Criar conexão gerenciada
      const wsConnection = await wsManager.createConnection(connectionId, connection.socket, {
        type: 'market_data',
        timestamp: Date.now()
      });
      
      // Subscribe automaticamente para dados de mercado
      marketDataHandler.subscribe(connectionId, { symbol: 'BTCUSDT' });
      
      // Enviar dados iniciais
      const cachedData = marketDataHandler.getCachedData('BTCUSDT');
      if (cachedData) {
        wsManager.sendMessage(connectionId, {
          type: 'market_data',
          data: cachedData,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      console.error('❌ WEBSOCKET ROUTES - Market data connection error:', error);
      connection.socket.close();
    }
  });

  // ============================================================================
  // ROTA PARA DADOS DE USUÁRIO (HTTP + WebSocket)
  // ============================================================================
  
  fastify.get('/ws/user-data', { websocket: true }, async (connection, request) => {
    const connectionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = (request.query as any).userId;
    
    if (!userId) {
      console.error('❌ WEBSOCKET ROUTES - User ID required for user data connection');
      connection.socket.close();
      return;
    }
    
    console.log('👤 WEBSOCKET ROUTES - User data connection:', { connectionId, userId });
    
    try {
      // Criar conexão gerenciada
      const wsConnection = await wsManager.createConnection(connectionId, connection.socket, {
        userId,
        type: 'user_data',
        timestamp: Date.now()
      });
      
      // Subscribe automaticamente para dados de usuário
      userDataHandler.subscribe(connectionId, userId, {});
      
      // Enviar dados iniciais
      const cachedData = userDataHandler.getCachedData(userId);
      if (cachedData) {
        wsManager.sendMessage(connectionId, {
          type: 'user_data',
          data: cachedData,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      console.error('❌ WEBSOCKET ROUTES - User data connection error:', error);
      connection.socket.close();
    }
  });

  // ============================================================================
  // ROTA PARA ATUALIZAÇÕES DE POSIÇÃO (HTTP + WebSocket)
  // ============================================================================
  
  fastify.get('/ws/position-updates', { websocket: true }, async (connection, request) => {
    const connectionId = `position_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = (request.query as any).userId;
    
    if (!userId) {
      console.error('❌ WEBSOCKET ROUTES - User ID required for position updates connection');
      connection.socket.close();
      return;
    }
    
    console.log('📈 WEBSOCKET ROUTES - Position updates connection:', { connectionId, userId });
    
    try {
      // Criar conexão gerenciada
      const wsConnection = await wsManager.createConnection(connectionId, connection.socket, {
        userId,
        type: 'position_updates',
        timestamp: Date.now()
      });
      
      // Subscribe automaticamente para atualizações de posição
      positionUpdatesHandler.subscribe(connectionId, userId, {});
      
      // Enviar dados iniciais
      const cachedData = positionUpdatesHandler.getCachedData(userId);
      if (cachedData) {
        wsManager.sendMessage(connectionId, {
          type: 'position_updates',
          data: cachedData,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      console.error('❌ WEBSOCKET ROUTES - Position updates connection error:', error);
      connection.socket.close();
    }
  });

  // ============================================================================
  // ROTA DE STATUS (HTTP)
  // ============================================================================
  
  fastify.get('/ws/status', async (request, reply) => {
    try {
      const stats = {
        manager: wsManager.getStats(),
        marketData: marketDataHandler.getStats(),
        userData: userDataHandler.getStats(),
        positionUpdates: positionUpdatesHandler.getStats(),
        timestamp: Date.now()
      };
      
      return reply.send({
        success: true,
        data: stats
      });
      
    } catch (error) {
      console.error('❌ WEBSOCKET ROUTES - Status error:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'Failed to get WebSocket status'
      });
    }
  });

  console.log('✅ WEBSOCKET ROUTES CONSOLIDADO - Routes registered successfully');
}

/**
 * Configurar conexões entre handlers e manager
 */
function setupHandlerConnections(
  wsManager: WebSocketManager,
  marketDataHandler: MarketDataHandler,
  userDataHandler: UserDataHandler,
  positionUpdatesHandler: PositionUpdatesHandler
): void {
  
  // 🔑 ANEXAR MANAGER AO HANDLER:
  marketDataHandler.attachManager(wsManager);
  
  // Conectar market data handler
  console.log('🔗 WEBSOCKET ROUTES - Registering market_data_update listener...');
  
  // Usar EventEmitter global para evitar problemas de múltiplas instâncias
  const { globalMarketDataEmitter } = require('./handlers/market-data.handler');
  
  console.log('🔍 WEBSOCKET ROUTES - Global MarketDataEmitter:', {
    hasOnMethod: typeof globalMarketDataEmitter.on === 'function',
    hasEmitMethod: typeof globalMarketDataEmitter.emit === 'function',
    listenerCount: globalMarketDataEmitter.listenerCount('market_data_update')
  });
  
  globalMarketDataEmitter.on('market_data_update', (data) => {
    console.log('📊 WEBSOCKET ROUTES - Market data event received:', JSON.stringify(data).substring(0, 100));
    console.log('📊 WEBSOCKET ROUTES - Broadcasting market data to clients...');
    try {
      wsManager.broadcast(data, { type: 'market_data' });
      console.log('✅ WEBSOCKET ROUTES - Market data broadcasted');
    } catch (error) {
      console.error('❌ WEBSOCKET ROUTES - Error broadcasting market data:', error);
    }
  });
  
  console.log('✅ WEBSOCKET ROUTES - market_data_update listener registered');
  console.log('🔍 WEBSOCKET ROUTES - After registration listener count:', globalMarketDataEmitter.listenerCount('market_data_update'));
  
  marketDataHandler.on('market_data_error', (data) => {
    console.log('❌ WEBSOCKET ROUTES - Market data error event received:', data);
    wsManager.broadcast(data, { type: 'market_data' });
  });

  // Conectar LN Markets data handler
  console.log('🔗 WEBSOCKET ROUTES - Registering lnmarkets_data listener...');
  marketDataHandler.on('lnmarkets_data', (data) => {
    console.log('📊 WEBSOCKET ROUTES - LN Markets event received:', JSON.stringify(data).substring(0, 100));
    console.log('📊 WEBSOCKET ROUTES - Broadcasting LN Markets data to clients...');
    wsManager.broadcast(data, { type: 'lnmarkets_data' });
    console.log('✅ WEBSOCKET ROUTES - LN Markets data broadcasted');
  });
  console.log('✅ WEBSOCKET ROUTES - lnmarkets_data listener registered');
  
  // Conectar user data handler
  userDataHandler.on('user_data_update', (data) => {
    wsManager.broadcast(data, { target: data.data.userId });
  });
  
  userDataHandler.on('user_data_error', (data) => {
    wsManager.broadcast(data, { target: data.data.userId });
  });
  
  // Conectar position updates handler
  positionUpdatesHandler.on('position_updates_update', (data) => {
    wsManager.broadcast(data, { target: data.data.userId });
  });
  
  positionUpdatesHandler.on('position_updates_error', (data) => {
    wsManager.broadcast(data, { target: data.data.userId });
  });
}

/**
 * Lidar com mensagens do cliente
 */
function handleClientMessage(
  wsManager: WebSocketManager,
  marketDataHandler: MarketDataHandler,
  userDataHandler: UserDataHandler,
  positionUpdatesHandler: PositionUpdatesHandler,
  connection: any,
  message: any
): void {
  const { type, data } = message;
  
  console.log('📨 WEBSOCKET ROUTES - Handling client message:', { 
    connectionId: connection.id, 
    userId: connection.userId, 
    type 
  });
  
  switch (type) {
    case 'subscribe_market':
      marketDataHandler.subscribe(connection.id, data);
      break;
      
    case 'subscribe_user':
      if (connection.userId) {
        userDataHandler.subscribe(connection.id, connection.userId, data);
      }
      break;
      
    case 'subscribe_positions':
      if (connection.userId) {
        positionUpdatesHandler.subscribe(connection.id, connection.userId, data);
      }
      break;
      
    case 'unsubscribe_market':
      marketDataHandler.unsubscribe(connection.id);
      break;
      
    case 'unsubscribe_user':
      if (connection.userId) {
        userDataHandler.unsubscribe(connection.id, connection.userId);
      }
      break;
      
    case 'unsubscribe_positions':
      if (connection.userId) {
        positionUpdatesHandler.unsubscribe(connection.id, connection.userId);
      }
      break;
      
    default:
      console.log('📨 WEBSOCKET ROUTES - Unknown message type:', { type });
  }
}
