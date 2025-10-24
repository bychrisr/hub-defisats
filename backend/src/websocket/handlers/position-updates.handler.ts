/**
 * Position Updates WebSocket Handler
 * 
 * Handler especializado para atualizações de posições em tempo real:
 * - Position changes (open, close, modify)
 * - P&L updates
 * - Margin calls
 * - Liquidation alerts
 * - Risk metrics
 */

import { WebSocketConnection } from '../manager';
import { Logger } from 'winston';
import { EventEmitter } from 'events';

export interface PositionUpdateMessage {
  type: 'position_update';
  data: {
    userId: string;
    positionId: string;
    action: 'open' | 'close' | 'modify' | 'liquidation' | 'margin_call';
    position: any;
    pnl: number;
    pnlPercent: number;
    timestamp: number;
  };
  timestamp: number;
}

export interface PositionUpdateCache {
  data: any;
  timestamp: number;
  ttl: number;
}

export class PositionUpdatesHandler extends EventEmitter {
  private cache = new Map<string, PositionUpdateCache>(); // userId -> cache
  private positionSubscriptions = new Map<string, Set<string>>(); // userId -> Set<connectionIds>
  private logger: Logger;
  private readonly CACHE_TTL = 5000; // 5 segundos para dados de posição

  constructor(logger: Logger) {
    super();
    this.logger = logger;
    console.log('🚀 POSITION UPDATES HANDLER - Initializing...');
  }

  /**
   * Subscribe uma conexão para atualizações de posição
   */
  subscribe(connectionId: string, userId: string, data: any): void {
    console.log('📡 POSITION UPDATES HANDLER - Position subscription added:', { connectionId, userId });
    
    // Mapear conexão para usuário
    if (!this.positionSubscriptions.has(userId)) {
      this.positionSubscriptions.set(userId, new Set());
    }
    this.positionSubscriptions.get(userId)!.add(connectionId);
    
    // Enviar dados atuais se disponível em cache
    const cached = this.cache.get(userId);
    if (cached && this.isCacheValid(cached)) {
      console.log('📦 POSITION UPDATES HANDLER - Sending cached position data:', { connectionId, userId });
      // Note: O manager será responsável por enviar a mensagem
      return;
    }
    
    // Se não há dados em cache, buscar imediatamente
    this.fetchPositionUpdates(userId);
  }

  /**
   * Unsubscribe uma conexão
   */
  unsubscribe(connectionId: string, userId: string): void {
    console.log('📡 POSITION UPDATES HANDLER - Position subscription removed:', { connectionId, userId });
    
    const userConnections = this.positionSubscriptions.get(userId);
    if (userConnections) {
      userConnections.delete(connectionId);
      if (userConnections.size === 0) {
        this.positionSubscriptions.delete(userId);
      }
    }
  }

  /**
   * Buscar atualizações de posição
   */
  async fetchPositionUpdates(userId: string): Promise<void> {
    try {
      console.log('🔄 POSITION UPDATES HANDLER - Fetching position updates:', { userId });
      
      // Simular busca de atualizações de posição (substituir por API real)
      const positionUpdates = await this.simulatePositionUpdatesFetch(userId);
      
      // Cache por 5 segundos
      this.cache.set(userId, {
        data: positionUpdates,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      });
      
      console.log('✅ POSITION UPDATES HANDLER - Position updates fetched and cached:', {
        userId,
        updatesCount: positionUpdates.length
      });
      
      // Emitir evento para o manager broadcast
      this.emit('position_updates_update', {
        type: 'position_updates',
        data: positionUpdates,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('❌ POSITION UPDATES HANDLER - Fetch error:', error);
      
      // Emitir erro para subscribers
      this.emit('position_updates_error', {
        type: 'error',
        error: 'Failed to fetch position updates',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Simular busca de atualizações de posição (substituir por API real)
   */
  private async simulatePositionUpdatesFetch(userId: string): Promise<any[]> {
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const updates = [];
    
    // Simular algumas atualizações de posição
    if (Math.random() > 0.7) { // 30% chance de ter atualizações
      updates.push({
        userId,
        positionId: 'pos_1',
        action: 'modify',
        position: {
          id: 'pos_1',
          side: 'long',
          size: 0.1,
          entryPrice: 45000,
          currentPrice: 46000 + Math.random() * 1000,
          pl: Math.random() * 100 - 50,
          plPercent: Math.random() * 2 - 1
        },
        pnl: Math.random() * 100 - 50,
        pnlPercent: Math.random() * 2 - 1,
        timestamp: Date.now()
      });
    }
    
    // Simular alertas de risco
    if (Math.random() > 0.9) { // 10% chance de ter alertas
      updates.push({
        userId,
        positionId: 'pos_1',
        action: 'margin_call',
        position: null,
        pnl: 0,
        pnlPercent: 0,
        timestamp: Date.now(),
        alert: {
          type: 'margin_call',
          message: 'Position approaching margin call',
          severity: 'warning'
        }
      });
    }
    
    return updates;
  }

  /**
   * Verificar se cache é válido
   */
  private isCacheValid(cached: PositionUpdateCache): boolean {
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
    const connections = this.positionSubscriptions.get(userId);
    return connections ? Array.from(connections) : [];
  }

  /**
   * Obter estatísticas
   */
  getStats(): any {
    return {
      totalUsers: this.positionSubscriptions.size,
      totalConnections: Array.from(this.positionSubscriptions.values())
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
    this.positionSubscriptions.clear();
    this.cache.clear();
    
    console.log('🧹 POSITION UPDATES HANDLER - Cleanup completed');
  }

  /**
   * Emitir evento (será conectado ao manager)
   */
  private emit(event: string, data: any): void {
    // Este método será conectado ao manager via callback
    console.log('📡 POSITION UPDATES HANDLER - Event emitted:', { event, data });
  }
}
