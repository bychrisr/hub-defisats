import { EventEmitter } from 'events';
import { LNMarketsWebSocketService, LNMarketsWebSocketCredentials } from './lnmarkets-websocket.service';

export interface UserWebSocketConnection {
  userId: string;
  wsService: LNMarketsWebSocketService;
  subscriptions: Set<string>;
  lastActivity: number;
}

export class WebSocketManagerService extends EventEmitter {
  private connections: Map<string, UserWebSocketConnection> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  constructor() {
    super();
    this.startCleanupInterval();
  }

  /**
   * Create or get WebSocket connection for user
   */
  async createConnection(
    userId: string, 
    credentials: LNMarketsWebSocketCredentials
  ): Promise<LNMarketsWebSocketService> {
    console.log('🔌 WEBSOCKET MANAGER - Criando/conectando usuário:', {
      userId,
      hasCredentials: !!(credentials.apiKey && credentials.apiSecret),
      isTestnet: credentials.isTestnet,
      timestamp: new Date().toISOString()
    });

    // Check if connection already exists
    const existingConnection = this.connections.get(userId);
    if (existingConnection && existingConnection.wsService.getConnectionStatus()) {
      console.log('🔄 WEBSOCKET MANAGER - Reutilizando conexão existente para usuário:', userId);
      existingConnection.lastActivity = Date.now();
      return existingConnection.wsService;
    }

    // Create new connection
    console.log('🆕 WEBSOCKET MANAGER - Criando nova conexão para usuário:', userId);
    const wsService = new LNMarketsWebSocketService(credentials);
    
    // Set up event listeners
    wsService.on('connected', () => {
      console.log('✅ WEBSOCKET MANAGER - User connected:', userId);
      this.emit('userConnected', userId);
    });

    wsService.on('disconnected', (data) => {
      console.log('🔌 WEBSOCKET MANAGER - User disconnected:', userId, data);
      this.emit('userDisconnected', userId, data);
    });

    wsService.on('error', (error) => {
      console.error('❌ WEBSOCKET MANAGER - User connection error:', userId, error);
      this.emit('userError', userId, error);
    });

    wsService.on('marketUpdate', (data) => {
      this.emit('marketUpdate', userId, data);
    });

    wsService.on('positionUpdate', (data) => {
      this.emit('positionUpdate', userId, data);
    });

    wsService.on('marginUpdate', (data) => {
      this.emit('marginUpdate', userId, data);
    });

    // Connect to WebSocket
    await wsService.connect();

    // Store connection
    this.connections.set(userId, {
      userId,
      wsService,
      subscriptions: new Set(),
      lastActivity: Date.now()
    });

    return wsService;
  }

  /**
   * Get existing connection for user
   */
  getConnection(userId: string): LNMarketsWebSocketService | null {
    const connection = this.connections.get(userId);
    if (connection && connection.wsService.getConnectionStatus()) {
      connection.lastActivity = Date.now();
      return connection.wsService;
    }
    return null;
  }

  /**
   * Add direct WebSocket connection (for frontend connections)
   */
  addConnection(userId: string, connection: any): void {
    console.log('🔌 WEBSOCKET MANAGER - Adicionando conexão direta para usuário:', userId);
    
    // Store the direct connection
    this.connections.set(userId, {
      userId,
      wsService: null as any, // Direct connection, not LN Markets service
      subscriptions: new Set(),
      lastActivity: Date.now()
    });

    // Set up connection event handlers
    connection.on('close', () => {
      console.log('🔌 WEBSOCKET MANAGER - Conexão direta fechada para usuário:', userId);
      this.removeConnection(userId);
    });

    connection.on('error', (error: any) => {
      console.log('❌ WEBSOCKET MANAGER - Erro na conexão direta:', error);
      this.removeConnection(userId);
    });

    // Send welcome message
    try {
      connection.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to LN Markets WebSocket',
        userId: userId,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.log('❌ WEBSOCKET MANAGER - Erro ao enviar mensagem de boas-vindas:', error);
    }
  }

  /**
   * Remove connection for user
   */
  removeConnection(userId: string): void {
    console.log('🔌 WEBSOCKET MANAGER - Removendo conexão para usuário:', userId);
    const connection = this.connections.get(userId);
    
    if (connection) {
      // Close LN Markets WebSocket if exists
      if (connection.wsService) {
        try {
          connection.wsService.disconnect();
        } catch (error) {
          console.log('❌ WEBSOCKET MANAGER - Erro ao desconectar serviço LN Markets:', error);
        }
      }
      
      this.connections.delete(userId);
      this.emit('userDisconnected', userId);
    }
  }

  /**
   * Subscribe user to market data
   */
  async subscribeToMarket(userId: string, market: string = 'BTC'): Promise<void> {
    const connection = this.connections.get(userId);
    if (!connection) {
      throw new Error('User not connected');
    }

    try {
      await connection.wsService.subscribeToMarket(market);
      connection.subscriptions.add(`market:${market}`);
      console.log('📊 WEBSOCKET MANAGER - User subscribed to market:', userId, market);
    } catch (error) {
      console.error('❌ WEBSOCKET MANAGER - Failed to subscribe to market:', error);
      throw error;
    }
  }

  /**
   * Subscribe user to position updates
   */
  async subscribeToPositions(userId: string): Promise<void> {
    const connection = this.connections.get(userId);
    if (!connection) {
      throw new Error('User not connected');
    }

    try {
      await connection.wsService.subscribeToPositions();
      connection.subscriptions.add('positions');
      console.log('📊 WEBSOCKET MANAGER - User subscribed to positions:', userId);
    } catch (error) {
      console.error('❌ WEBSOCKET MANAGER - Failed to subscribe to positions:', error);
      throw error;
    }
  }

  /**
   * Subscribe user to margin updates
   */
  async subscribeToMargin(userId: string): Promise<void> {
    const connection = this.connections.get(userId);
    if (!connection) {
      throw new Error('User not connected');
    }

    try {
      await connection.wsService.subscribeToMargin();
      connection.subscriptions.add('margin');
      console.log('📊 WEBSOCKET MANAGER - User subscribed to margin:', userId);
    } catch (error) {
      console.error('❌ WEBSOCKET MANAGER - Failed to subscribe to margin:', error);
      throw error;
    }
  }

  /**
   * Disconnect user
   */
  disconnectUser(userId: string): void {
    const connection = this.connections.get(userId);
    if (connection) {
      console.log('🔌 WEBSOCKET MANAGER - Disconnecting user:', userId);
      connection.wsService.disconnect();
      this.connections.delete(userId);
      this.emit('userDisconnected', userId);
    }
  }

  /**
   * Get all active connections
   */
  getActiveConnections(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Get connection count
   */
  getConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get user subscriptions
   */
  getUserSubscriptions(userId: string): string[] {
    const connection = this.connections.get(userId);
    return connection ? Array.from(connection.subscriptions) : [];
  }

  /**
   * Start cleanup interval for inactive connections
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveConnections();
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Clean up inactive connections
   */
  private cleanupInactiveConnections(): void {
    const now = Date.now();
    const inactiveUsers: string[] = [];

    for (const [userId, connection] of this.connections) {
      if (now - connection.lastActivity > this.INACTIVE_TIMEOUT) {
        inactiveUsers.push(userId);
      }
    }

    inactiveUsers.forEach(userId => {
      console.log('🧹 WEBSOCKET MANAGER - Cleaning up inactive connection:', userId);
      this.disconnectUser(userId);
    });

    if (inactiveUsers.length > 0) {
      console.log(`🧹 WEBSOCKET MANAGER - Cleaned up ${inactiveUsers.length} inactive connections`);
    }
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Shutdown all connections
   */
  shutdown(): void {
    console.log('🔄 WEBSOCKET MANAGER - Shutting down all connections');
    this.stopCleanupInterval();
    
    for (const [_userId, connection] of this.connections) {
      connection.wsService.disconnect();
    }
    
    this.connections.clear();
  }
}

// Singleton instance
export const websocketManager = new WebSocketManagerService();

