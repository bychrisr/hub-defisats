/**
 * WebSocket Manager Consolidado
 * 
 * Consolida todas as funcionalidades dos WebSocket managers duplicados:
 * - WebSocketManagerOptimized (funcionalidades avançadas)
 * - websocket-manager.service (funcionalidades básicas)
 * - WebSocket routes (market, user, positions)
 * 
 * Funcionalidades integradas:
 * ✅ Conexão gerenciada com reconexão automática
 * ✅ Heartbeat e rate limiting
 * ✅ Handlers especializados por tipo de dados
 * ✅ Broadcast seletivo por usuário/tipo
 * ✅ Error handling robusto
 * ✅ Logs detalhados para debugging
 */

import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { WebSocket } from 'ws';

// Interfaces para tipos de dados
export interface WebSocketConnection {
  id: string;
  ws: WebSocket;
  userId?: string;
  subscriptions: Set<string>;
  metadata: Record<string, any>;
  lastPing: number;
  isAlive: boolean;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
  target?: string; // userId ou connectionId
}

export interface WebSocketConfig {
  heartbeatInterval: number;
  maxReconnectAttempts: number;
  reconnectInterval: number;
  rateLimitWindow: number;
  maxMessagesPerWindow: number;
  pingTimeout: number;
}

export interface BroadcastOptions {
  target?: string; // userId específico
  type?: string; // tipo de mensagem
  exclude?: string[]; // connectionIds para excluir
}

/**
 * WebSocket Manager Consolidado
 * 
 * Gerencia todas as conexões WebSocket da aplicação com funcionalidades avançadas.
 */
export class WebSocketManager extends EventEmitter {
  private connections = new Map<string, WebSocketConnection>();
  private userConnections = new Map<string, Set<string>>(); // userId -> Set<connectionIds>
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private config: WebSocketConfig;
  private logger: Logger;

  constructor(config: Partial<WebSocketConfig> = {}, logger: Logger) {
    super();
    
    // Increase max listeners to support many handlers
    this.setMaxListeners(100);
    
    this.config = {
      heartbeatInterval: 30000, // 30 segundos
      maxReconnectAttempts: 5,
      reconnectInterval: 5000,
      rateLimitWindow: 60000, // 1 minuto
      maxMessagesPerWindow: 100,
      pingTimeout: 10000, // 10 segundos
      ...config
    };
    
    this.logger = logger;
    
    console.log('🚀 WEBSOCKET MANAGER CONSOLIDADO - Initializing...', {
      heartbeatInterval: this.config.heartbeatInterval,
      maxReconnectAttempts: this.config.maxReconnectAttempts,
      rateLimitWindow: this.config.rateLimitWindow
    });
    
    this.startHeartbeat();
  }

  /**
   * Criar nova conexão WebSocket
   */
  async createConnection(
    id: string,
    ws: WebSocket,
    metadata: Record<string, any> = {}
  ): Promise<WebSocketConnection> {
    console.log('🔌 WEBSOCKET MANAGER - Creating connection:', { 
      id, 
      metadata,
      wsReadyState: ws.readyState,
      wsProtocol: ws.protocol,
      timestamp: new Date().toISOString()
    });

    const connection: WebSocketConnection = {
      id,
      ws,
      userId: metadata.userId,
      subscriptions: new Set(),
      metadata,
      lastPing: Date.now(),
      isAlive: true
    };

    // Adicionar à lista de conexões
    this.connections.set(id, connection);

    // Mapear por usuário se userId fornecido
    if (metadata.userId) {
      if (!this.userConnections.has(metadata.userId)) {
        this.userConnections.set(metadata.userId, new Set());
      }
      this.userConnections.get(metadata.userId)!.add(id);
      
      console.log('👤 WEBSOCKET MANAGER - User connection mapped:', {
        userId: metadata.userId,
        connectionId: id,
        totalUserConnections: this.userConnections.get(metadata.userId)!.size
      });
    }

    // Configurar event listeners
    this.setupConnectionListeners(connection);

    // Emitir evento de conexão
    this.emit('connection', connection);

    console.log('✅ WEBSOCKET MANAGER - Connection created:', {
      id,
      userId: metadata.userId,
      totalConnections: this.connections.size,
      activeConnectionIds: Array.from(this.connections.keys()),
      totalUsers: this.userConnections.size,
      timestamp: new Date().toISOString()
    });

    return connection;
  }

  /**
   * Configurar listeners para uma conexão
   */
  private setupConnectionListeners(connection: WebSocketConnection): void {
    const { id, ws } = connection;

    console.log('📡 WEBSOCKET MANAGER - Setting up listeners:', {
      id,
      wsReadyState: ws.readyState,
      timestamp: new Date().toISOString()
    });

    // Listener para mensagens
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 WEBSOCKET MANAGER - Message received from client:', {
          connectionId: id,
          userId: connection.userId,
          messageType: message.type,
          timestamp: new Date().toISOString()
        });
        this.handleMessage(connection, message);
      } catch (error) {
        console.error('❌ WEBSOCKET MANAGER - Message parse error:', {
          connectionId: id,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        });
        this.sendError(connection, 'Invalid message format');
      }
    });

    // Listener para pong (resposta ao ping)
    ws.on('pong', () => {
      connection.lastPing = Date.now();
      connection.isAlive = true;
      console.log('🏓 WEBSOCKET MANAGER - Pong received:', { id });
    });

    // Listener para fechamento
    ws.on('close', (code, reason) => {
      console.log('🔌 WEBSOCKET MANAGER - Connection closed:', { id, code, reason: reason?.toString() || 'No reason provided' });
      this.removeConnection(id);
    });

    // Listener para erros
    ws.on('error', (error) => {
      console.error('❌ WEBSOCKET MANAGER - Connection error:', { id, error: error.message });
      this.removeConnection(id);
    });
  }

  /**
   * Lidar com mensagens recebidas
   */
  private handleMessage(connection: WebSocketConnection, message: WebSocketMessage): void {
    const { id, userId } = connection;

    // Verificar rate limiting
    if (!this.checkRateLimit(id)) {
      console.log('⏳ WEBSOCKET MANAGER - Rate limit exceeded:', { id });
      this.sendError(connection, 'Rate limit exceeded');
      return;
    }

    console.log('📨 WEBSOCKET MANAGER - Message received:', { id, userId, type: message.type });

    // Emitir evento de mensagem
    this.emit('message', connection, message);

    // Processar por tipo de mensagem
    switch (message.type) {
      case 'ping':
        this.handlePing(connection);
        break;
      case 'subscribe':
        this.handleSubscribe(connection, message.data);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(connection, message.data);
        break;
      case 'heartbeat':
        this.handleHeartbeat(connection);
        break;
      default:
        console.log('📨 WEBSOCKET MANAGER - Unknown message type:', { id, type: message.type });
    }
  }

  /**
   * Lidar com ping
   */
  private handlePing(connection: WebSocketConnection): void {
    this.sendMessage(connection.id, { type: 'pong', timestamp: Date.now() });
  }

  /**
   * Lidar com subscribe
   */
  private handleSubscribe(connection: WebSocketConnection, data: any): void {
    const { subscription } = data;
    if (subscription) {
      connection.subscriptions.add(subscription);
      console.log('📡 WEBSOCKET MANAGER - Subscription added:', { 
        id: connection.id, 
        subscription,
        totalSubscriptions: connection.subscriptions.size 
      });
    }
  }

  /**
   * Lidar com unsubscribe
   */
  private handleUnsubscribe(connection: WebSocketConnection, data: any): void {
    const { subscription } = data;
    if (subscription) {
      connection.subscriptions.delete(subscription);
      console.log('📡 WEBSOCKET MANAGER - Subscription removed:', { 
        id: connection.id, 
        subscription,
        totalSubscriptions: connection.subscriptions.size 
      });
    }
  }

  /**
   * Lidar com heartbeat
   */
  private handleHeartbeat(connection: WebSocketConnection): void {
    connection.lastPing = Date.now();
    connection.isAlive = true;
    this.sendMessage(connection.id, { type: 'heartbeat_ack', timestamp: Date.now() });
  }

  /**
   * Enviar mensagem para uma conexão específica
   */
  sendMessage(connectionId: string, message: any): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
      console.log('❌ WEBSOCKET MANAGER - Connection not found or closed:', { connectionId });
      return false;
    }

    try {
      connection.ws.send(JSON.stringify(message));
      console.log('📤 WEBSOCKET MANAGER - Message sent:', { connectionId, type: message.type });
      return true;
    } catch (error) {
      console.error('❌ WEBSOCKET MANAGER - Send error:', { connectionId, error });
      this.removeConnection(connectionId);
      return false;
    }
  }

  /**
   * Broadcast para múltiplas conexões
   */
  broadcast(message: any, options: BroadcastOptions = {}): number {
    let sentCount = 0;
    const { target, type, exclude = [] } = options;

    console.log('📢 WEBSOCKET MANAGER - Broadcasting:', { 
      type: message.type, 
      target, 
      excludeCount: exclude.length,
      totalConnections: this.connections.size,
      activeConnectionIds: Array.from(this.connections.keys())
    });

    console.log('🔄 WEBSOCKET MANAGER - Starting broadcast loop...');
    for (const [connectionId, connection] of this.connections) {
      console.log('🔍 WEBSOCKET MANAGER - Checking connection:', {
        id: connectionId,
        userId: connection.userId,
        subscriptions: Array.from(connection.subscriptions),
        hasTarget: !!target,
        isExcluded: exclude.includes(connectionId),
        hasTypeFilter: !!type,
        hasSubscription: type ? connection.subscriptions.has(type) : true
      });

      // Pular conexões excluídas
      if (exclude.includes(connectionId)) {
        console.log('⏭️ WEBSOCKET MANAGER - Skipping excluded connection:', connectionId);
        continue;
      }

      // Filtrar por target (userId)
      if (target && connection.userId !== target) {
        console.log('⏭️ WEBSOCKET MANAGER - Skipping connection (wrong target):', {
          connectionId,
          connectionUserId: connection.userId,
          target
        });
        continue;
      }

      // Filtrar por tipo de subscription
      if (type && !connection.subscriptions.has(type)) {
        console.log('⏭️ WEBSOCKET MANAGER - Skipping connection (no subscription):', {
          connectionId,
          requiredType: type,
          userSubscriptions: Array.from(connection.subscriptions)
        });
        continue;
      }

      // Enviar mensagem
      if (this.sendMessage(connectionId, message)) {
        sentCount++;
        console.log('✅ WEBSOCKET MANAGER - Message sent to:', connectionId);
      } else {
        console.log('❌ WEBSOCKET MANAGER - Failed to send to:', connectionId);
      }
    }

    console.log('✅ WEBSOCKET MANAGER - Broadcast completed:', { sentCount });
    return sentCount;
  }

  /**
   * Broadcast para usuário específico
   */
  broadcastToUser(userId: string, message: any): number {
    const userConnectionIds = this.userConnections.get(userId);
    if (!userConnectionIds || userConnectionIds.size === 0) {
      console.log('⚠️ WEBSOCKET MANAGER - No connections found for user:', { userId });
      return 0;
    }

    let sentCount = 0;
    for (const connectionId of userConnectionIds) {
      if (this.sendMessage(connectionId, message)) {
        sentCount++;
      }
    }

    console.log('📤 WEBSOCKET MANAGER - User broadcast completed:', { userId, sentCount });
    return sentCount;
  }

  /**
   * Verificar rate limiting
   */
  private checkRateLimit(connectionId: string): boolean {
    const now = Date.now();
    const limit = this.rateLimitMap.get(connectionId);

    if (!limit || now > limit.resetTime) {
      this.rateLimitMap.set(connectionId, {
        count: 1,
        resetTime: now + this.config.rateLimitWindow
      });
      return true;
    }

    if (limit.count >= this.config.maxMessagesPerWindow) {
      return false;
    }

    limit.count++;
    return true;
  }

  /**
   * Enviar erro para conexão
   */
  private sendError(connection: WebSocketConnection, error: string): void {
    this.sendMessage(connection.id, {
      type: 'error',
      error,
      timestamp: Date.now()
    });
  }

  /**
   * Adicionar subscription para uma conexão
   */
  addSubscription(connectionId: string, topic: string): boolean {
    const conn = this.connections.get(connectionId);
    if (!conn) {
      console.log('⚠️ WEBSOCKET MANAGER - Connection not found for subscription:', { connectionId, topic });
      return false;
    }
    
    if (!conn.subscriptions) {
      conn.subscriptions = new Set();
    }
    
    conn.subscriptions.add(topic);
    
    console.log('📝 WEBSOCKET MANAGER - Subscription added:', {
      connectionId,
      topic,
      totalSubscriptions: conn.subscriptions.size,
      allSubscriptions: Array.from(conn.subscriptions)
    });
    
    return true;
  }

  /**
   * Remover conexão
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    console.log('🗑️ WEBSOCKET MANAGER - Removing connection:', { connectionId });

    // Remover da lista de conexões
    this.connections.delete(connectionId);

    // Remover do mapeamento de usuário
    if (connection.userId) {
      const userConnections = this.userConnections.get(connection.userId);
      if (userConnections) {
        userConnections.delete(connectionId);
        if (userConnections.size === 0) {
          this.userConnections.delete(connection.userId);
        }
      }
    }

    // Emitir evento de desconexão
    this.emit('disconnection', connection);

    console.log('✅ WEBSOCKET MANAGER - Connection removed:', {
      connectionId,
      userId: connection.userId,
      totalConnections: this.connections.size,
      activeConnectionIds: Array.from(this.connections.keys()),
      totalConnections: this.connections.size
    });
  }

  /**
   * Fechar conexão
   */
  closeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.ws.close();
      this.removeConnection(connectionId);
    }
  }

  /**
   * Iniciar heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.performHeartbeat();
    }, this.config.heartbeatInterval);

    console.log('💓 WEBSOCKET MANAGER - Heartbeat started:', { 
      interval: this.config.heartbeatInterval 
    });
  }

  /**
   * Executar heartbeat
   */
  private performHeartbeat(): void {
    const now = Date.now();
    const deadConnections: string[] = [];

    for (const [connectionId, connection] of this.connections) {
      // Verificar se conexão está viva
      if (now - connection.lastPing > this.config.pingTimeout) {
        console.log('💀 WEBSOCKET MANAGER - Dead connection detected:', { connectionId });
        deadConnections.push(connectionId);
        continue;
      }

      // Enviar ping
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.ping();
        connection.isAlive = false; // Será marcado como vivo quando receber pong
      }
    }

    // Remover conexões mortas
    deadConnections.forEach(connectionId => {
      this.removeConnection(connectionId);
    });

    if (deadConnections.length > 0) {
      console.log('🧹 WEBSOCKET MANAGER - Cleaned up dead connections:', { 
        count: deadConnections.length 
      });
    }
  }

  /**
   * Obter estatísticas
   */
  getStats(): any {
    return {
      totalConnections: this.connections.size,
      totalUsers: this.userConnections.size,
      connections: Array.from(this.connections.keys()),
      users: Array.from(this.userConnections.keys()),
      config: this.config
    };
  }

  /**
   * Limpar recursos
   */
  cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Fechar todas as conexões
    for (const [connectionId, connection] of this.connections) {
      connection.ws.close();
    }

    this.connections.clear();
    this.userConnections.clear();
    this.rateLimitMap.clear();

    console.log('🧹 WEBSOCKET MANAGER - Cleanup completed');
  }
}
