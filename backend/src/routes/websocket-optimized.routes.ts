import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WebSocketManagerOptimized, WebSocketConfig } from '../services/websocket-manager-optimized.service';
import { StandardizedErrorHandler } from '../services/standardized-error-handler.service';
import { IntelligentCacheStrategy } from '../services/intelligent-cache-strategy.service';
import { Logger } from 'winston';
import Redis from 'ioredis';

export interface WebSocketRouteConfig {
  logger: Logger;
  redis: Redis;
  errorHandler: StandardizedErrorHandler;
  cacheStrategy: IntelligentCacheStrategy;
}

export async function websocketOptimizedRoutes(
  fastify: FastifyInstance,
  config: WebSocketRouteConfig
): Promise<void> {
  const { logger, redis, errorHandler, cacheStrategy } = config;

  // WebSocket managers for different services
  const managers = new Map<string, WebSocketManagerOptimized>();

  // TradingView WebSocket Manager
  const tradingViewConfig: WebSocketConfig = {
    url: process.env.TRADINGVIEW_WEBSOCKET_URL || 'wss://data.tradingview.com/socket.io/websocket',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    timeout: 10000,
    headers: {
      'User-Agent': 'Axisor-Trading-Platform/1.0.0',
      'Origin': process.env.FRONTEND_URL || 'http://localhost:13000'
    }
  };

  const tradingViewManager = new WebSocketManagerOptimized(tradingViewConfig, logger);
  managers.set('tradingview', tradingViewManager);

  // LN Markets WebSocket Manager
  const lnMarketsConfig: WebSocketConfig = {
    url: process.env.LN_MARKETS_WEBSOCKET_URL || 'wss://api.lnmarkets.com/v1/ws',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    timeout: 10000,
    headers: {
      'User-Agent': 'Axisor-Trading-Platform/1.0.0'
    }
  };

  const lnMarketsManager = new WebSocketManagerOptimized(lnMarketsConfig, logger);
  managers.set('lnmarkets', lnMarketsManager);

  // Binance WebSocket Manager
  const binanceConfig: WebSocketConfig = {
    url: process.env.BINANCE_WEBSOCKET_URL || 'wss://stream.binance.com:9443/ws',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    timeout: 10000,
    headers: {
      'User-Agent': 'Axisor-Trading-Platform/1.0.0'
    }
  };

  const binanceManager = new WebSocketManagerOptimized(binanceConfig, logger);
  managers.set('binance', binanceManager);

  // Setup WebSocket event handlers
  setupWebSocketEventHandlers(managers, logger, cacheStrategy);

  // WebSocket connection endpoint
  fastify.get('/ws/:service', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { service } = request.params as { service: string };
      const { userId } = request.query as { userId?: string };

      if (!managers.has(service)) {
        return errorHandler.sendErrorResponse(reply, {
          code: 'SERVICE_NOT_FOUND',
          message: `WebSocket service '${service}' not found`,
          statusCode: 404,
          timestamp: new Date().toISOString()
        });
      }

      const manager = managers.get(service)!;
      const connectionId = `${service}-${userId || 'anonymous'}-${Date.now()}`;
      
      const connection = await manager.createConnection(connectionId, undefined, {
        userId,
        service,
        timestamp: new Date().toISOString()
      });

      logger.info('WebSocket connection created', {
        service,
        connectionId,
        userId
      });

      return {
        success: true,
        connectionId,
        service,
        status: connection.status
      };
    } catch (error) {
      const context = errorHandler.createContext('websocket', 'create_connection');
      const apiError = errorHandler.handleInternalError(error, context);
      return errorHandler.sendErrorResponse(reply, apiError);
    }
  });

  // Send message endpoint
  fastify.post('/ws/:service/:connectionId/send', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { service, connectionId } = request.params as { service: string; connectionId: string };
      const { type, data, id } = request.body as { type: string; data: any; id?: string };

      if (!managers.has(service)) {
        return errorHandler.sendErrorResponse(reply, {
          code: 'SERVICE_NOT_FOUND',
          message: `WebSocket service '${service}' not found`,
          statusCode: 404,
          timestamp: new Date().toISOString()
        });
      }

      const manager = managers.get(service)!;
      const message = {
        type,
        data,
        id,
        timestamp: Date.now()
      };

      const sent = await manager.sendMessage(connectionId, message);

      if (!sent) {
        return errorHandler.sendErrorResponse(reply, {
          code: 'MESSAGE_SEND_FAILED',
          message: 'Failed to send message',
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
      }

      logger.info('WebSocket message sent', {
        service,
        connectionId,
        messageType: type
      });

      return {
        success: true,
        messageId: id,
        sent
      };
    } catch (error) {
      const context = errorHandler.createContext('websocket', 'send_message');
      const apiError = errorHandler.handleInternalError(error, context);
      return errorHandler.sendErrorResponse(reply, apiError);
    }
  });

  // Subscribe to message types
  fastify.post('/ws/:service/:connectionId/subscribe', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { service, connectionId } = request.params as { service: string; connectionId: string };
      const { messageType } = request.body as { messageType: string };

      if (!managers.has(service)) {
        return errorHandler.sendErrorResponse(reply, {
          code: 'SERVICE_NOT_FOUND',
          message: `WebSocket service '${service}' not found`,
          statusCode: 404,
          timestamp: new Date().toISOString()
        });
      }

      const manager = managers.get(service)!;
      manager.subscribe(connectionId, messageType);

      logger.info('WebSocket subscription added', {
        service,
        connectionId,
        messageType
      });

      return {
        success: true,
        messageType,
        subscribed: true
      };
    } catch (error) {
      const context = errorHandler.createContext('websocket', 'subscribe');
      const apiError = errorHandler.handleInternalError(error, context);
      return errorHandler.sendErrorResponse(reply, apiError);
    }
  });

  // Unsubscribe from message types
  fastify.post('/ws/:service/:connectionId/unsubscribe', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { service, connectionId } = request.params as { service: string; connectionId: string };
      const { messageType } = request.body as { messageType: string };

      if (!managers.has(service)) {
        return errorHandler.sendErrorResponse(reply, {
          code: 'SERVICE_NOT_FOUND',
          message: `WebSocket service '${service}' not found`,
          statusCode: 404,
          timestamp: new Date().toISOString()
        });
      }

      const manager = managers.get(service)!;
      manager.unsubscribe(connectionId, messageType);

      logger.info('WebSocket subscription removed', {
        service,
        connectionId,
        messageType
      });

      return {
        success: true,
        messageType,
        unsubscribed: true
      };
    } catch (error) {
      const context = errorHandler.createContext('websocket', 'unsubscribe');
      const apiError = errorHandler.handleInternalError(error, context);
      return errorHandler.sendErrorResponse(reply, apiError);
    }
  });

  // Close connection
  fastify.delete('/ws/:service/:connectionId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { service, connectionId } = request.params as { service: string; connectionId: string };

      if (!managers.has(service)) {
        return errorHandler.sendErrorResponse(reply, {
          code: 'SERVICE_NOT_FOUND',
          message: `WebSocket service '${service}' not found`,
          statusCode: 404,
          timestamp: new Date().toISOString()
        });
      }

      const manager = managers.get(service)!;
      await manager.closeConnection(connectionId);

      logger.info('WebSocket connection closed', {
        service,
        connectionId
      });

      return {
        success: true,
        connectionId,
        closed: true
      };
    } catch (error) {
      const context = errorHandler.createContext('websocket', 'close_connection');
      const apiError = errorHandler.handleInternalError(error, context);
      return errorHandler.sendErrorResponse(reply, apiError);
    }
  });

  // Get connection status
  fastify.get('/ws/:service/:connectionId/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { service, connectionId } = request.params as { service: string; connectionId: string };

      if (!managers.has(service)) {
        return errorHandler.sendErrorResponse(reply, {
          code: 'SERVICE_NOT_FOUND',
          message: `WebSocket service '${service}' not found`,
          statusCode: 404,
          timestamp: new Date().toISOString()
        });
      }

      const manager = managers.get(service)!;
      const connection = manager.getConnection(connectionId);

      if (!connection) {
        return errorHandler.sendErrorResponse(reply, {
          code: 'CONNECTION_NOT_FOUND',
          message: 'Connection not found',
          statusCode: 404,
          timestamp: new Date().toISOString()
        });
      }

      const stats = manager.getConnectionStats(connectionId);

      return {
        success: true,
        connection: stats
      };
    } catch (error) {
      const context = errorHandler.createContext('websocket', 'get_status');
      const apiError = errorHandler.handleInternalError(error, context);
      return errorHandler.sendErrorResponse(reply, apiError);
    }
  });

  // Get WebSocket statistics
  fastify.get('/ws/:service/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { service } = request.params as { service: string };

      if (!managers.has(service)) {
        return errorHandler.sendErrorResponse(reply, {
          code: 'SERVICE_NOT_FOUND',
          message: `WebSocket service '${service}' not found`,
          statusCode: 404,
          timestamp: new Date().toISOString()
        });
      }

      const manager = managers.get(service)!;
      const stats = manager.getStats();

      return {
        success: true,
        service,
        stats
      };
    } catch (error) {
      const context = errorHandler.createContext('websocket', 'get_stats');
      const apiError = errorHandler.handleInternalError(error, context);
      return errorHandler.sendErrorResponse(reply, apiError);
    }
  });

  // Health check
  fastify.get('/ws/health', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const health = {
        status: 'healthy',
        services: {},
        timestamp: new Date().toISOString()
      };

      for (const [service, manager] of managers) {
        const stats = manager.getStats();
        health.services[service] = {
          status: stats.activeConnections > 0 ? 'active' : 'inactive',
          connections: stats.activeConnections,
          totalConnections: stats.totalConnections,
          messagesSent: stats.messagesSent,
          messagesReceived: stats.messagesReceived,
          errors: stats.errors
        };
      }

      return health;
    } catch (error) {
      const context = errorHandler.createContext('websocket', 'health_check');
      const apiError = errorHandler.handleInternalError(error, context);
      return errorHandler.sendErrorResponse(reply, apiError);
    }
  });
}

/**
 * Setup WebSocket event handlers for all managers
 */
function setupWebSocketEventHandlers(
  managers: Map<string, WebSocketManagerOptimized>,
  logger: Logger,
  cacheStrategy: IntelligentCacheStrategy
): void {
  for (const [service, manager] of managers) {
    // Connection events
    manager.on('connected', (connection) => {
      logger.info('WebSocket connected', {
        service,
        connectionId: connection.id,
        url: connection.url
      });
    });

    manager.on('disconnected', (connection, code, reason) => {
      logger.info('WebSocket disconnected', {
        service,
        connectionId: connection.id,
        code,
        reason: reason.toString()
      });
    });

    manager.on('error', (connection, error) => {
      logger.error('WebSocket error', {
        service,
        connectionId: connection.id,
        error: error.message,
        stack: error.stack
      });
    });

    // Message events
    manager.on('message', async (connection, message) => {
      try {
        // Cache market data
        if (message.type === 'market_data' || message.type === 'price_update') {
          const cacheKey = `market_${message.data.symbol || 'unknown'}`;
          await cacheStrategy.set(cacheKey, message.data, 'market_data');
        }

        // Cache user data
        if (message.type === 'user_data' || message.type === 'account_update') {
          const cacheKey = `user_${connection.metadata.userId || 'anonymous'}`;
          await cacheStrategy.set(cacheKey, message.data, 'user_data');
        }

        logger.debug('WebSocket message processed', {
          service,
          connectionId: connection.id,
          messageType: message.type,
          cached: true
        });
      } catch (error) {
        logger.error('WebSocket message processing error', {
          service,
          connectionId: connection.id,
          error: error.message
        });
      }
    });

    // Reconnect events
    manager.on('reconnect_failed', (connection) => {
      logger.error('WebSocket reconnect failed', {
        service,
        connectionId: connection.id,
        attempts: connection.reconnectAttempts
      });
    });
  }
}
