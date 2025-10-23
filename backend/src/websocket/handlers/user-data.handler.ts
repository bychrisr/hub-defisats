/**
 * User Data WebSocket Handler
 * 
 * Handler especializado para dados de usuário em tempo real:
 * - Balance updates
 * - Position changes
 * - Order updates
 * - Account status
 * - Notifications
 */

import { WebSocketConnection } from '../manager';
import { Logger } from 'winston';

export interface UserDataMessage {
  type: 'user_data';
  data: {
    userId: string;
    balance: any;
    positions: any[];
    orders: any[];
    notifications: any[];
    timestamp: number;
  };
  timestamp: number;
}

export interface UserDataCache {
  data: any;
  timestamp: number;
  ttl: number;
}

export class UserDataHandler {
  private cache = new Map<string, UserDataCache>(); // userId -> cache
  private userSubscriptions = new Map<string, Set<string>>(); // userId -> Set<connectionIds>
  private logger: Logger;
  private readonly CACHE_TTL = 30000; // 30 segundos para dados de usuário

  constructor(logger: Logger) {
    this.logger = logger;
    console.log('🚀 USER DATA HANDLER - Initializing...');
  }

  /**
   * Subscribe uma conexão para dados de usuário
   */
  subscribe(connectionId: string, userId: string, data: any): void {
    console.log('📡 USER DATA HANDLER - User subscription added:', { connectionId, userId });
    
    // Mapear conexão para usuário
    if (!this.userSubscriptions.has(userId)) {
      this.userSubscriptions.set(userId, new Set());
    }
    this.userSubscriptions.get(userId)!.add(connectionId);
    
    // Enviar dados atuais se disponível em cache
    const cached = this.cache.get(userId);
    if (cached && this.isCacheValid(cached)) {
      console.log('📦 USER DATA HANDLER - Sending cached user data:', { connectionId, userId });
      // Note: O manager será responsável por enviar a mensagem
      return;
    }
    
    // Se não há dados em cache, buscar imediatamente
    this.fetchUserData(userId);
  }

  /**
   * Unsubscribe uma conexão
   */
  unsubscribe(connectionId: string, userId: string): void {
    console.log('📡 USER DATA HANDLER - User subscription removed:', { connectionId, userId });
    
    const userConnections = this.userSubscriptions.get(userId);
    if (userConnections) {
      userConnections.delete(connectionId);
      if (userConnections.size === 0) {
        this.userSubscriptions.delete(userId);
      }
    }
  }

  /**
   * Buscar dados de usuário
   */
  async fetchUserData(userId: string): Promise<void> {
    try {
      console.log('🔄 USER DATA HANDLER - Fetching user data:', { userId });
      
      // Simular busca de dados de usuário (substituir por API real)
      const userData = await this.simulateUserDataFetch(userId);
      
      // Cache por 30 segundos
      this.cache.set(userId, {
        data: userData,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      });
      
      console.log('✅ USER DATA HANDLER - User data fetched and cached:', {
        userId,
        balance: userData.balance,
        positionsCount: userData.positions.length,
        ordersCount: userData.orders.length
      });
      
      // Emitir evento para o manager broadcast
      this.emit('user_data_update', {
        type: 'user_data',
        data: userData,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('❌ USER DATA HANDLER - Fetch error:', error);
      
      // Emitir erro para subscribers
      this.emit('user_data_error', {
        type: 'error',
        error: 'Failed to fetch user data',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Simular busca de dados de usuário (substituir por API real)
   */
  private async simulateUserDataFetch(userId: string): Promise<any> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      userId,
      balance: {
        total: 1000 + Math.random() * 100,
        available: 800 + Math.random() * 50,
        locked: 200 + Math.random() * 25,
        currency: 'USD'
      },
      positions: [
        {
          id: 'pos_1',
          side: 'long',
          size: 0.1,
          entryPrice: 45000,
          currentPrice: 46000 + Math.random() * 1000,
          pl: Math.random() * 100 - 50,
          plPercent: Math.random() * 2 - 1
        }
      ],
      orders: [
        {
          id: 'order_1',
          type: 'limit',
          side: 'buy',
          size: 0.05,
          price: 45000,
          status: 'open'
        }
      ],
      notifications: [
        {
          id: 'notif_1',
          type: 'info',
          message: 'Position updated',
          timestamp: Date.now()
        }
      ],
      timestamp: Date.now()
    };
  }

  /**
   * Verificar se cache é válido
   */
  private isCacheValid(cached: UserDataCache): boolean {
    return Date.now() - cached.timestamp < cached.ttl;
  }

  /**
   * Obter dados em cache
   */
  getCachedData(userId: string): any | null {
    const cached = this.cache.get(userId);
    
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Obter conexões de um usuário
   */
  getUserConnections(userId: string): string[] {
    const connections = this.userSubscriptions.get(userId);
    return connections ? Array.from(connections) : [];
  }

  /**
   * Obter estatísticas
   */
  getStats(): any {
    return {
      totalUsers: this.userSubscriptions.size,
      totalConnections: Array.from(this.userSubscriptions.values())
        .reduce((sum, connections) => sum + connections.size, 0),
      cacheSize: this.cache.size,
      cacheKeys: Array.from(this.cache.keys()),
      updateInterval: this.CACHE_TTL
    };
  }

  /**
   * Limpar recursos
   */
  cleanup(): void {
    this.userSubscriptions.clear();
    this.cache.clear();
    
    console.log('🧹 USER DATA HANDLER - Cleanup completed');
  }

  /**
   * Emitir evento (será conectado ao manager)
   */
  private emit(event: string, data: any): void {
    // Este método será conectado ao manager via callback
    console.log('📡 USER DATA HANDLER - Event emitted:', { event, data });
  }
}
