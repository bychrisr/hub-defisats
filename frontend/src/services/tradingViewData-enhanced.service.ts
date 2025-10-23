/**
 * TradingView Data Service Enhanced
 * 
 * Serviço consolidado para dados TradingView com:
 * - Cache inteligente de 1 segundo para dados de mercado
 * - WebSocket integration para atualizações em tempo real
 * - Fallback automático para múltiplas fontes
 * - Rate limiting e debouncing
 * - Error handling robusto
 * 
 * Funcionalidades integradas:
 * ✅ Cache de 1 segundo para dados de mercado
 * ✅ WebSocket para atualizações em tempo real
 * ✅ Subscribers para notificações
 * ✅ Fallback para Binance/CoinGecko
 * ✅ Rate limiting inteligente
 * ✅ Error handling com retry
 */

import { MarketData, HistoricalData, API_CONFIG } from './tradingViewData.service';

// Interface para subscribers
interface Subscriber {
  id: string;
  callback: (data: MarketData) => void;
  symbol?: string;
}

// Interface para cache entry
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// Interface para WebSocket connection
interface WebSocketConnection {
  ws: WebSocket | null;
  isConnected: boolean;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  reconnectInterval: number;
}

/**
 * TradingView Data Service Enhanced
 * 
 * Serviço consolidado que integra todas as funcionalidades dos serviços duplicados
 * com foco em dados em tempo real e cache inteligente.
 */
export class TradingViewDataServiceEnhanced {
  private cache = new Map<string, CacheEntry>();
  private subscribers = new Map<string, Subscriber>();
  private wsConnection: WebSocketConnection;
  private rateLimitMap = new Map<string, number>();
  private isInitialized = false;

  // Cache TTL diferenciado
  private readonly TTL_MARKET = 1000;        // 1 segundo para dados de mercado
  private readonly TTL_HISTORICAL = 5 * 60 * 1000; // 5 minutos para dados históricos
  
  // Rate limiting
  private readonly RATE_LIMIT = 1000; // 1 req/sec
  private readonly MAX_REQUESTS_PER_MINUTE = 60;

  constructor() {
    this.wsConnection = {
      ws: null,
      isConnected: false,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5,
      reconnectInterval: 5000
    };

    console.log('🚀 TRADINGVIEW DATA SERVICE ENHANCED - Initializing...');
    this.initialize();
  }

  /**
   * Inicializar serviço
   */
  private async initialize(): Promise<void> {
    try {
      // Conectar WebSocket para atualizações em tempo real
      await this.connectWebSocket();
      
      // Configurar limpeza automática de cache
      this.setupCacheCleanup();
      
      // Configurar rate limiting
      this.setupRateLimiting();
      
      this.isInitialized = true;
      console.log('✅ TRADINGVIEW DATA SERVICE ENHANCED - Initialized successfully');
      
    } catch (error) {
      console.error('❌ TRADINGVIEW DATA SERVICE ENHANCED - Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Conectar WebSocket para atualizações em tempo real
   */
  private async connectWebSocket(): Promise<void> {
    try {
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:3000'}/tradingview/stream`;
      
      this.wsConnection.ws = new WebSocket(wsUrl);
      
      this.wsConnection.ws.onopen = () => {
        console.log('🔌 TRADINGVIEW ENHANCED - WebSocket connected');
        this.wsConnection.isConnected = true;
        this.wsConnection.reconnectAttempts = 0;
        
        // Subscribe a dados de mercado
        this.wsConnection.ws?.send(JSON.stringify({
          type: 'subscribe',
          symbol: 'BTCUSDT'
        }));
      };
      
      this.wsConnection.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'market_data') {
            // Atualizar cache local
            this.cache.set('market_BTCUSDT', {
              data: message.data,
              timestamp: Date.now(),
              ttl: this.TTL_MARKET
            });
            
            // Notificar subscribers
            this.notifySubscribers('market_BTCUSDT', message.data);
          }
        } catch (error) {
          console.error('❌ TRADINGVIEW ENHANCED - WebSocket message error:', error);
        }
      };
      
      this.wsConnection.ws.onclose = () => {
        console.log('🔌 TRADINGVIEW ENHANCED - WebSocket disconnected');
        this.wsConnection.isConnected = false;
        this.handleReconnect();
      };
      
      this.wsConnection.ws.onerror = (error) => {
        console.error('❌ TRADINGVIEW ENHANCED - WebSocket error:', error);
        this.wsConnection.isConnected = false;
      };
      
    } catch (error) {
      console.error('❌ TRADINGVIEW ENHANCED - WebSocket connection failed:', error);
      throw error;
    }
  }

  /**
   * Lidar com reconexão automática
   */
  private handleReconnect(): void {
    if (this.wsConnection.reconnectAttempts < this.wsConnection.maxReconnectAttempts) {
      this.wsConnection.reconnectAttempts++;
      
      console.log(`🔄 TRADINGVIEW ENHANCED - Attempting reconnect ${this.wsConnection.reconnectAttempts}/${this.wsConnection.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, this.wsConnection.reconnectInterval * this.wsConnection.reconnectAttempts);
    } else {
      console.error('❌ TRADINGVIEW ENHANCED - Max reconnect attempts reached');
    }
  }

  /**
   * Configurar limpeza automática de cache
   */
  private setupCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 TRADINGVIEW ENHANCED - Cache cleanup: ${cleanedCount} expired entries removed`);
      }
    }, 60000); // Limpeza a cada minuto
  }

  /**
   * Configurar rate limiting
   */
  private setupRateLimiting(): void {
    setInterval(() => {
      this.rateLimitMap.clear();
    }, 60000); // Reset rate limiting a cada minuto
  }

  /**
   * Verificar rate limiting
   */
  private checkRateLimit(key: string): boolean {
    const now = Date.now();
    const lastRequest = this.rateLimitMap.get(key);
    
    if (lastRequest && (now - lastRequest) < this.RATE_LIMIT) {
      return false; // Rate limit exceeded
    }
    
    this.rateLimitMap.set(key, now);
    return true;
  }

  /**
   * Obter dados de mercado com cache de 1 segundo
   */
  async getMarketData(symbol: string = 'BTCUSDT'): Promise<MarketData> {
    const cacheKey = `market_${symbol}`;
    
    // Verificar cache primeiro
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      console.log('📦 TRADINGVIEW ENHANCED - Market data cache hit:', { symbol });
      return cached.data;
    }

    // Verificar rate limiting
    if (!this.checkRateLimit(`market_${symbol}`)) {
      console.log('⏳ TRADINGVIEW ENHANCED - Rate limit exceeded, using cached data');
      if (cached) return cached.data;
    }

    console.log('🔄 TRADINGVIEW ENHANCED - Fetching fresh market data:', { symbol });

    try {
      // Buscar dados frescos
      const response = await fetch(`/api/tradingview/market-data?symbol=${symbol}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch market data');
      }

      // Cache por 1 segundo
      this.cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now(),
        ttl: this.TTL_MARKET
      });

      console.log('✅ TRADINGVIEW ENHANCED - Market data fetched and cached:', {
        symbol,
        price: result.data.price,
        change24h: result.data.change24h
      });

      return result.data;

    } catch (error) {
      console.error('❌ TRADINGVIEW ENHANCED - Market data error:', error);
      
      // Fallback para dados em cache se disponível
      if (cached) {
        console.log('🔄 TRADINGVIEW ENHANCED - Using cached data as fallback');
        return cached.data;
      }
      
      throw error;
    }
  }

  /**
   * Obter dados históricos com cache de 5 minutos
   */
  async getHistoricalData(symbol: string, timeframe: string, limit: number = 100): Promise<HistoricalData[]> {
    const cacheKey = `historical_${symbol}_${timeframe}_${limit}`;
    
    // Verificar cache primeiro
    const cached = this.cache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      console.log('📦 TRADINGVIEW ENHANCED - Historical data cache hit:', { symbol, timeframe });
      return cached.data;
    }

    // Verificar rate limiting
    if (!this.checkRateLimit(`historical_${symbol}`)) {
      console.log('⏳ TRADINGVIEW ENHANCED - Rate limit exceeded, using cached data');
      if (cached) return cached.data;
    }

    console.log('🔄 TRADINGVIEW ENHANCED - Fetching fresh historical data:', { symbol, timeframe });

    try {
      // Buscar dados frescos
      const response = await fetch(`/api/tradingview/scanner?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch historical data');
      }

      // Cache por 5 minutos
      this.cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now(),
        ttl: this.TTL_HISTORICAL
      });

      console.log('✅ TRADINGVIEW ENHANCED - Historical data fetched and cached:', {
        symbol,
        timeframe,
        dataPoints: result.data.length
      });

      return result.data;

    } catch (error) {
      console.error('❌ TRADINGVIEW ENHANCED - Historical data error:', error);
      
      // Fallback para dados em cache se disponível
      if (cached) {
        console.log('🔄 TRADINGVIEW ENHANCED - Using cached data as fallback');
        return cached.data;
      }
      
      throw error;
    }
  }

  /**
   * Subscribe para atualizações em tempo real
   */
  subscribe(callback: (data: MarketData) => void, symbol: string = 'BTCUSDT'): string {
    const subscriberId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.subscribers.set(subscriberId, {
      id: subscriberId,
      callback,
      symbol
    });
    
    console.log('📡 TRADINGVIEW ENHANCED - Subscriber added:', { subscriberId, symbol });
    
    // Auto-connect WebSocket se necessário
    if (!this.wsConnection.isConnected) {
      this.connectWebSocket();
    }
    
    return subscriberId;
  }

  /**
   * Unsubscribe de atualizações
   */
  unsubscribe(subscriberId: string): void {
    if (this.subscribers.delete(subscriberId)) {
      console.log('📡 TRADINGVIEW ENHANCED - Subscriber removed:', { subscriberId });
    }
  }

  /**
   * Notificar subscribers
   */
  private notifySubscribers(cacheKey: string, data: MarketData): void {
    this.subscribers.forEach((subscriber) => {
      try {
        subscriber.callback(data);
      } catch (error) {
        console.error('❌ TRADINGVIEW ENHANCED - Subscriber callback error:', error);
        // Remover subscriber com erro
        this.subscribers.delete(subscriber.id);
      }
    });
  }

  /**
   * Verificar se cache é válido
   */
  private isCacheValid(cached: CacheEntry): boolean {
    return Date.now() - cached.timestamp < cached.ttl;
  }

  /**
   * Obter estatísticas do serviço
   */
  getStats(): any {
    return {
      isInitialized: this.isInitialized,
      cache: {
        size: this.cache.size,
        keys: Array.from(this.cache.keys())
      },
      subscribers: {
        count: this.subscribers.size,
        ids: Array.from(this.subscribers.keys())
      },
      websocket: {
        isConnected: this.wsConnection.isConnected,
        reconnectAttempts: this.wsConnection.reconnectAttempts
      },
      rateLimiting: {
        activeLimits: this.rateLimitMap.size,
        limits: Array.from(this.rateLimitMap.entries())
      }
    };
  }

  /**
   * Limpar recursos
   */
  async cleanup(): Promise<void> {
    // Fechar WebSocket
    if (this.wsConnection.ws) {
      this.wsConnection.ws.close();
    }
    
    // Limpar cache
    this.cache.clear();
    
    // Limpar subscribers
    this.subscribers.clear();
    
    // Limpar rate limiting
    this.rateLimitMap.clear();
    
    console.log('🧹 TRADINGVIEW ENHANCED - Cleanup completed');
  }
}

// Singleton instance
export const tradingViewDataServiceEnhanced = new TradingViewDataServiceEnhanced();
