import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { Logger } from 'winston';

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  timeout?: number;
  protocols?: string[];
  headers?: Record<string, string>;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  id?: string;
}

export interface WebSocketConnection {
  id: string;
  ws: WebSocket;
  url: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastHeartbeat: number;
  reconnectAttempts: number;
  subscriptions: Set<string>;
  metadata: Record<string, any>;
}

export interface WebSocketStats {
  totalConnections: number;
  activeConnections: number;
  messagesSent: number;
  messagesReceived: number;
  reconnects: number;
  errors: number;
}

export class WebSocketManagerOptimized extends EventEmitter {
  private connections: Map<string, WebSocketConnection> = new Map();
  private logger: Logger;
  private config: WebSocketConfig;
  private stats: WebSocketStats;
  private heartbeatInterval?: NodeJS.Timeout;
  private messageQueue: Map<string, WebSocketMessage[]> = new Map();

  constructor(config: WebSocketConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      reconnects: 0,
      errors: 0
    };

    this.setupHeartbeat();
  }

  /**
   * Create a new WebSocket connection
   */
  async createConnection(
    id: string, 
    url?: string, 
    metadata: Record<string, any> = {}
  ): Promise<WebSocketConnection> {
    const connectionUrl = url || this.config.url;
    
    this.logger.info('Creating WebSocket connection', { id, url: connectionUrl });

    const ws = new WebSocket(connectionUrl, {
      protocols: this.config.protocols,
      headers: this.config.headers,
      timeout: this.config.timeout || 10000
    });

    const connection: WebSocketConnection = {
      id,
      ws,
      url: connectionUrl,
      status: 'connecting',
      lastHeartbeat: Date.now(),
      reconnectAttempts: 0,
      subscriptions: new Set(),
      metadata
    };

    this.connections.set(id, connection);
    this.stats.totalConnections++;

    this.setupConnectionHandlers(connection);

    return connection;
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(connection: WebSocketConnection): void {
    connection.ws.on('open', () => {
      connection.status = 'connected';
      connection.lastHeartbeat = Date.now();
      this.stats.activeConnections++;
      
      this.logger.info('WebSocket connected', { 
        id: connection.id, 
        url: connection.url 
      });

      this.emit('connected', connection);
      
      // Send queued messages
      this.sendQueuedMessages(connection.id);
    });

    connection.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        connection.lastHeartbeat = Date.now();
        this.stats.messagesReceived++;

        this.logger.debug('WebSocket message received', {
          id: connection.id,
          type: message.type,
          data: message.data
        });

        this.emit('message', connection, message);
        this.emit(`message:${message.type}`, connection, message);
      } catch (error) {
        this.logger.error('WebSocket message parse error', {
          id: connection.id,
          error: error.message,
          data: data.toString()
        });
        this.stats.errors++;
      }
    });

    connection.ws.on('close', (code: number, reason: string) => {
      connection.status = 'disconnected';
      this.stats.activeConnections--;
      
      this.logger.info('WebSocket disconnected', {
        id: connection.id,
        code,
        reason: reason.toString()
      });

      this.emit('disconnected', connection, code, reason);
      
      // Attempt to reconnect if not manually closed
      if (code !== 1000) {
        this.attemptReconnect(connection);
      }
    });

    connection.ws.on('error', (error: Error) => {
      connection.status = 'error';
      this.stats.errors++;
      
      this.logger.error('WebSocket error', {
        id: connection.id,
        error: error.message,
        stack: error.stack
      });

      this.emit('error', connection, error);
    });

    connection.ws.on('ping', () => {
      connection.lastHeartbeat = Date.now();
      this.logger.debug('WebSocket ping received', { id: connection.id });
    });

    connection.ws.on('pong', () => {
      connection.lastHeartbeat = Date.now();
      this.logger.debug('WebSocket pong received', { id: connection.id });
    });
  }

  /**
   * Send message to specific connection
   */
  async sendMessage(
    connectionId: string, 
    message: WebSocketMessage
  ): Promise<boolean> {
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      this.logger.warn('Connection not found', { connectionId });
      return false;
    }

    if (connection.status !== 'connected') {
      this.logger.warn('Connection not ready', { 
        connectionId, 
        status: connection.status 
      });
      
      // Queue message for later
      this.queueMessage(connectionId, message);
      return false;
    }

    try {
      const messageStr = JSON.stringify(message);
      connection.ws.send(messageStr);
      this.stats.messagesSent++;
      
      this.logger.debug('WebSocket message sent', {
        connectionId,
        type: message.type,
        data: message.data
      });
      
      return true;
    } catch (error) {
      this.logger.error('WebSocket send error', {
        connectionId,
        error: error.message
      });
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Broadcast message to all connections
   */
  async broadcastMessage(message: WebSocketMessage): Promise<number> {
    let sentCount = 0;
    
    for (const [id, connection] of this.connections) {
      if (connection.status === 'connected') {
        const sent = await this.sendMessage(id, message);
        if (sent) sentCount++;
      }
    }
    
    this.logger.debug('WebSocket broadcast sent', {
      messageType: message.type,
      sentCount,
      totalConnections: this.connections.size
    });
    
    return sentCount;
  }

  /**
   * Subscribe to specific message types
   */
  subscribe(connectionId: string, messageType: string): void {
    const connection = this.connections.get(connectionId);
    
    if (connection) {
      connection.subscriptions.add(messageType);
      this.logger.debug('WebSocket subscription added', {
        connectionId,
        messageType
      });
    }
  }

  /**
   * Unsubscribe from specific message types
   */
  unsubscribe(connectionId: string, messageType: string): void {
    const connection = this.connections.get(connectionId);
    
    if (connection) {
      connection.subscriptions.delete(messageType);
      this.logger.debug('WebSocket subscription removed', {
        connectionId,
        messageType
      });
    }
  }

  /**
   * Close specific connection
   */
  async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    
    if (connection) {
      connection.ws.close(1000, 'Manual close');
      this.connections.delete(connectionId);
      
      this.logger.info('WebSocket connection closed', { connectionId });
    }
  }

  /**
   * Close all connections
   */
  async closeAllConnections(): Promise<void> {
    for (const [id, connection] of this.connections) {
      connection.ws.close(1000, 'Shutdown');
    }
    
    this.connections.clear();
    this.stats.activeConnections = 0;
    
    this.logger.info('All WebSocket connections closed');
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): WebSocketConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get all connections
   */
  getAllConnections(): WebSocketConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Get connections by status
   */
  getConnectionsByStatus(status: string): WebSocketConnection[] {
    return Array.from(this.connections.values())
      .filter(connection => connection.status === status);
  }

  /**
   * Get WebSocket statistics
   */
  getStats(): WebSocketStats {
    return { ...this.stats };
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(connectionId: string): any {
    const connection = this.connections.get(connectionId);
    
    if (!connection) {
      return null;
    }

    return {
      id: connection.id,
      url: connection.url,
      status: connection.status,
      lastHeartbeat: connection.lastHeartbeat,
      reconnectAttempts: connection.reconnectAttempts,
      subscriptions: Array.from(connection.subscriptions),
      metadata: connection.metadata
    };
  }

  /**
   * Setup heartbeat mechanism
   */
  private setupHeartbeat(): void {
    const interval = this.config.heartbeatInterval || 30000; // 30 seconds
    
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeat();
    }, interval);
  }

  /**
   * Perform heartbeat check
   */
  private performHeartbeat(): void {
    const now = Date.now();
    const timeout = this.config.timeout || 10000;
    
    for (const [id, connection] of this.connections) {
      if (connection.status === 'connected') {
        const timeSinceLastHeartbeat = now - connection.lastHeartbeat;
        
        if (timeSinceLastHeartbeat > timeout) {
          this.logger.warn('WebSocket heartbeat timeout', {
            id,
            timeSinceLastHeartbeat
          });
          
          connection.ws.terminate();
        } else {
          // Send ping
          connection.ws.ping();
        }
      }
    }
  }

  /**
   * Attempt to reconnect connection
   */
  private async attemptReconnect(connection: WebSocketConnection): Promise<void> {
    const maxAttempts = this.config.maxReconnectAttempts || 5;
    const interval = this.config.reconnectInterval || 5000;
    
    if (connection.reconnectAttempts >= maxAttempts) {
      this.logger.error('WebSocket max reconnect attempts reached', {
        id: connection.id,
        attempts: connection.reconnectAttempts
      });
      
      this.connections.delete(connection.id);
      this.emit('reconnect_failed', connection);
      return;
    }
    
    connection.reconnectAttempts++;
    this.stats.reconnects++;
    
    this.logger.info('WebSocket reconnecting', {
      id: connection.id,
      attempt: connection.reconnectAttempts,
      maxAttempts
    });
    
    setTimeout(async () => {
      try {
        await this.createConnection(connection.id, connection.url, connection.metadata);
      } catch (error) {
        this.logger.error('WebSocket reconnect error', {
          id: connection.id,
          error: error.message
        });
      }
    }, interval);
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(connectionId: string, message: WebSocketMessage): void {
    if (!this.messageQueue.has(connectionId)) {
      this.messageQueue.set(connectionId, []);
    }
    
    const queue = this.messageQueue.get(connectionId)!;
    queue.push(message);
    
    // Limit queue size
    if (queue.length > 100) {
      queue.shift();
    }
  }

  /**
   * Send queued messages
   */
  private async sendQueuedMessages(connectionId: string): Promise<void> {
    const queue = this.messageQueue.get(connectionId);
    
    if (queue && queue.length > 0) {
      this.logger.info('Sending queued messages', {
        connectionId,
        count: queue.length
      });
      
      for (const message of queue) {
        await this.sendMessage(connectionId, message);
      }
      
      this.messageQueue.delete(connectionId);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    await this.closeAllConnections();
    this.removeAllListeners();
    
    this.logger.info('WebSocket manager cleaned up');
  }
}
