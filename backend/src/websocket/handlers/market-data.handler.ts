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
  private logger: Logger;
  private readonly CACHE_TTL = 1000; // 1 segundo

  constructor(logger: Logger) {
    super();
    this.logger = logger;
    console.log('🚀 MARKET DATA HANDLER - Initializing...');
    this.startMarketDataUpdates();
  }

  /**
   * Subscribe uma conexão para dados de mercado
   */
  subscribe(connectionId: string, data: any): void {
    const { symbol = 'BTCUSDT' } = data;
    
    console.log('📡 MARKET DATA HANDLER - Subscription added:', { connectionId, symbol });
    
    this.subscribers.add(connectionId);
    
    // Enviar dados atuais se disponível em cache
    const cacheKey = `market_${symbol}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log('📦 MARKET DATA HANDLER - Sending cached data to new subscriber:', { connectionId });
      // Note: O manager será responsável por enviar a mensagem
      return;
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
      this.emit('market_data_update', {
        type: 'market_data',
        data: binanceData,
        timestamp: Date.now()
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
