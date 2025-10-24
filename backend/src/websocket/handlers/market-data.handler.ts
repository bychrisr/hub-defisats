/**
 * Market Data WebSocket Handler
 * 
 * Handler especializado para dados de mercado em tempo real:
 * - TradingView data (preço, volume, mudanças)
 * - LN Markets data (index, funding, fees)
 * - Binance data (backup/fallback)
 * - Cache inteligente com TTL de 1 segundo
 * - Broadcast seletivo por subscription
 */

import { WebSocketConnection } from '../manager';
import { Logger } from 'winston';
import axios from 'axios';
import { EventEmitter } from 'events';

// Singleton pattern para evitar múltiplas instâncias
// Usar globalThis para sobreviver a hot-reload em dev
declare global {
  // eslint-disable-next-line no-var
  var __MARKET_DATA_HANDLER__: MarketDataHandler | undefined;
}

// EventEmitter global para market_data_update
export const globalMarketDataEmitter = new EventEmitter();

export interface MarketDataMessage {
  type: 'market_data';
  data: {
    symbol: string;
    price: number;
    change24h: number;
    volume: number;
    high24h: number;
    low24h: number;
    timestamp: number;
    source: string;
  };
  timestamp: number;
}

export interface MarketDataCache {
  data: any;
  timestamp: number;
  ttl: number;
}

export class MarketDataHandler extends EventEmitter {
  private cache = new Map<string, MarketDataCache>();
  private subscribers = new Set<string>(); // connectionIds
  private updateInterval: NodeJS.Timeout | null = null;
  private lnMarketsInterval: NodeJS.Timeout | null = null;
  private logger: Logger;
  private readonly CACHE_TTL = 1000; // 1 segundo
  private readonly LN_MARKETS_TTL = 30000; // 30 segundos
  private wsManager: any = null; // Referência ao WebSocketManager
  private lastLNMarketsData: any = null; // Última mensagem LN Markets para novos clientes

  constructor(logger: Logger) {
    super();
    this.logger = logger;
    console.log('🚀 MARKET DATA HANDLER - Initializing...');
    this.startMarketDataUpdates();
    this.startLNMarketsUpdates();
  }

  // Método estático para obter instância singleton
  static getInstance(logger: Logger): MarketDataHandler {
    if (!globalThis.__MARKET_DATA_HANDLER__) {
      console.log('📦 MARKET DATA HANDLER - Creating new singleton instance...');
      globalThis.__MARKET_DATA_HANDLER__ = new MarketDataHandler(logger);
      console.log('📦 MARKET DATA HANDLER - Singleton instance created');
    } else {
      console.log('📦 MARKET DATA HANDLER - Using existing singleton instance');
    }
    return globalThis.__MARKET_DATA_HANDLER__;
  }

  /**
   * Definir referência ao WebSocketManager
   */
  setWebSocketManager(wsManager: any): void {
    this.wsManager = wsManager;
    console.log('🔗 MARKET DATA HANDLER - WebSocketManager reference set');
  }

  /**
   * Anexar WebSocketManager e configurar comunicação
   */
  attachManager(wsManager: any): void {
    this.wsManager = wsManager;
    console.log('🔗 MARKET DATA HANDLER - WebSocketManager attached');
  }

  /**
   * Subscribe uma conexão para dados de mercado
   */
  subscribe(connectionId: string, data: any): void {
    const { symbol = 'BTCUSDT' } = data;
    
    console.log('📡 MARKET DATA HANDLER - Subscription added:', { connectionId, symbol });
    
    this.subscribers.add(connectionId);
    
    // 🔑 REGISTRAR A ASSINATURA NO MANAGER:
    if (this.wsManager && this.wsManager.addSubscription) {
      this.wsManager.addSubscription(connectionId, 'market_data');
    }
    
    // Enviar dados atuais se disponível em cache
    const cacheKey = `market_${symbol}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log('📦 MARKET DATA HANDLER - Sending cached data to new subscriber:', { connectionId });
      // Note: O manager será responsável por enviar a mensagem
    }
    
    // Enviar última mensagem LN Markets se disponível
    if (this.lastLNMarketsData && this.wsManager) {
      console.log('📊 MARKET DATA HANDLER - Sending last LN Markets data to new subscriber:', { connectionId });
      this.wsManager.sendMessage(connectionId, this.lastLNMarketsData);
    }
    
    // Se não há dados em cache, buscar imediatamente
    this.fetchMarketData(symbol);
  }

  /**
   * Unsubscribe uma conexão
   */
  unsubscribe(connectionId: string): void {
    console.log('📡 MARKET DATA HANDLER - Subscription removed:', { connectionId });
    this.subscribers.delete(connectionId);
  }

  /**
   * Iniciar atualizações automáticas de dados de mercado
   */
  private startMarketDataUpdates(): void {
    console.log('🔄 MARKET DATA HANDLER - Starting market data updates...');
    
    this.updateInterval = setInterval(async () => {
      try {
        await this.fetchMarketData('BTCUSDT');
      } catch (error) {
        console.error('❌ MARKET DATA HANDLER - Update error:', error);
      }
    }, this.CACHE_TTL);
  }

  /**
   * Iniciar atualizações automáticas de dados LN Markets (30s)
   */
  private startLNMarketsUpdates(): void {
    console.log('🔄 MARKET DATA HANDLER - Starting LN Markets updates (30s)...');
    
    // Executar imediatamente
    this.broadcastLNMarketsData().catch(error => {
      console.error('❌ MARKET DATA HANDLER - Initial LN Markets broadcast error:', error);
    });
    
    // Configurar intervalo para atualizações futuras
    this.lnMarketsInterval = setInterval(async () => {
      try {
        console.log('🔄 MARKET DATA HANDLER - LN Markets update tick...');
        await this.broadcastLNMarketsData();
      } catch (error) {
        console.error('❌ MARKET DATA HANDLER - LN Markets update error:', error);
      }
    }, this.LN_MARKETS_TTL);
    
    console.log('✅ MARKET DATA HANDLER - LN Markets interval configured');
  }

  /**
   * Broadcast dados LN Markets para todas as conexões
   */
  private async broadcastLNMarketsData(): Promise<void> {
    try {
      console.log('📊 MARKET DATA HANDLER - Broadcasting LN Markets data...');
      
      // Buscar dados LN Markets via API interna
      console.log('🔍 MARKET DATA HANDLER - Fetching LN Markets header data...');
      const lnData = await this.fetchLNMarketsHeaderData();
      console.log('🔍 MARKET DATA HANDLER - LN Markets data fetched:', lnData ? 'SUCCESS' : 'NULL');
      
      if (lnData) {
        const payload = {
          type: 'lnmarkets_data',
          data: {
            tradingFees: lnData.tradingFees,
            nextFunding: lnData.nextFunding,
            rate: lnData.rate,
            rateChange: lnData.rateChange,
            timestamp: Date.now()
          }
        };
        
        console.log('🔥 MARKET DATA HANDLER - About to broadcast LN Markets data:', payload);
        
        // Armazenar última mensagem para novos clientes
        this.lastLNMarketsData = payload;
        
        // Broadcast direto via WebSocketManager se disponível
        if (this.wsManager) {
          console.log('📡 MARKET DATA HANDLER - Broadcasting via WebSocketManager...');
          try {
            const sentCount = this.wsManager.broadcast(payload, { type: 'lnmarkets_data' });
            console.log('✅ MARKET DATA HANDLER - LN Markets data broadcasted via WebSocketManager:', { sentCount });
          } catch (error) {
            console.error('❌ MARKET DATA HANDLER - Error broadcasting via WebSocketManager:', error);
            console.log('⚠️ MARKET DATA HANDLER - Falling back to EventEmitter');
            this.emit('lnmarkets_data', payload);
          }
        } else {
          console.log('⚠️ MARKET DATA HANDLER - WebSocketManager not available, using EventEmitter fallback');
          // Fallback para EventEmitter
          this.emit('lnmarkets_data', payload);
        }
        
        console.log('✅ MARKET DATA HANDLER - LN Markets data processed:', {
          tradingFees: lnData.tradingFees,
          nextFunding: lnData.nextFunding,
          rate: lnData.rate,
          subscribers: this.subscribers.size,
          wsManagerAvailable: !!this.wsManager
        });
      }
    } catch (error) {
      console.error('❌ MARKET DATA HANDLER - Error broadcasting LN Markets data:', error);
    }
  }

  /**
   * Buscar dados LN Markets via API interna
   */
  private async fetchLNMarketsHeaderData(): Promise<any> {
    try {
      // Simular dados LN Markets (substituir por chamada real da API)
      const mockData = {
        tradingFees: 0.1 + (Math.random() - 0.5) * 0.02, // 0.08-0.12
        nextFunding: `${Math.floor(Math.random() * 8)}h ${Math.floor(Math.random() * 60)}m`,
        rate: 0.01 + (Math.random() - 0.5) * 0.002, // 0.009-0.011
        rateChange: (Math.random() - 0.5) * 0.005,
        timestamp: Date.now()
      };
      
      console.log('📊 MARKET DATA HANDLER - LN Markets data fetched:', mockData);
      return mockData;
    } catch (error) {
      console.error('❌ MARKET DATA HANDLER - Error fetching LN Markets data:', error);
      return null;
    }
  }

  /**
   * Buscar dados de mercado
   */
  private async fetchMarketData(symbol: string): Promise<void> {
    try {
      console.log('🔄 MARKET DATA HANDLER - Fetching market data:', { symbol });
      
      // Buscar dados do Binance (fonte principal)
      const binanceData = await this.fetchFromBinance(symbol);
      
      // Cache por 1 segundo
      const cacheKey = `market_${symbol}`;
      this.cache.set(cacheKey, {
        data: binanceData,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      });
      
      console.log('✅ MARKET DATA HANDLER - Market data fetched and cached:', {
        symbol,
        price: binanceData.price,
        change24h: binanceData.change24h,
        subscribers: this.subscribers.size
      });
      
      // Emitir evento para o manager broadcast
      const eventData = {
        type: 'market_data',
        data: binanceData,
        timestamp: Date.now()
      };
      
      console.log('📡 MARKET DATA HANDLER - About to emit market_data_update event:', {
        eventType: 'market_data_update',
        data: eventData,
        listenerCount: this.listenerCount('market_data_update'),
        globalListenerCount: globalMarketDataEmitter.listenerCount('market_data_update')
      });
      
      // Emitir no EventEmitter global
      globalMarketDataEmitter.emit('market_data_update', eventData);
      
      console.log('✅ MARKET DATA HANDLER - market_data_update event emitted:', {
        eventType: 'market_data_update',
        listenerCount: this.listenerCount('market_data_update'),
        globalListenerCount: globalMarketDataEmitter.listenerCount('market_data_update')
      });
      
    } catch (error) {
      console.error('❌ MARKET DATA HANDLER - Fetch error:', error);
      
      // Emitir erro para subscribers
      this.emit('market_data_error', {
        type: 'error',
        error: 'Failed to fetch market data',
        timestamp: Date.now()
      });
    }
  }

  /**
   * Buscar dados do Binance
   */
  private async fetchFromBinance(symbol: string): Promise<any> {
    try {
      const response = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, {
        timeout: 5000
      });
      
      const data = response.data;
      
      return {
        symbol: data.symbol,
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChangePercent),
        volume: parseFloat(data.volume),
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        timestamp: Date.now(),
        source: 'binance'
      };
    } catch (error) {
      console.error('❌ MARKET DATA HANDLER - Binance API error:', error);
      throw new Error('Failed to fetch data from Binance');
    }
  }

  /**
   * Verificar se cache é válido
   */
  private isCacheValid(cached: MarketDataCache): boolean {
    return Date.now() - cached.timestamp < cached.ttl;
  }

  /**
   * Obter dados em cache
   */
  getCachedData(symbol: string): any | null {
    const cacheKey = `market_${symbol}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Obter lista de subscribers
   */
  getSubscribers(): string[] {
    return Array.from(this.subscribers);
  }

  /**
   * Obter estatísticas
   */
  getStats(): any {
    return {
      subscribers: this.subscribers.size,
      cacheSize: this.cache.size,
      cacheKeys: Array.from(this.cache.keys()),
      updateInterval: this.CACHE_TTL
    };
  }

  /**
   * Limpar recursos
   */
  cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (this.lnMarketsInterval) {
      clearInterval(this.lnMarketsInterval);
    }
    
    this.subscribers.clear();
    this.cache.clear();
    
    console.log('🧹 MARKET DATA HANDLER - Cleanup completed');
  }

  /**
   * Emitir evento (será conectado ao manager)
   */
  private emit(event: string, data: any): void {
    // Este método será conectado ao manager via callback
    console.log('📡 MARKET DATA HANDLER - Event emitted:', { event, data });
  }
}
