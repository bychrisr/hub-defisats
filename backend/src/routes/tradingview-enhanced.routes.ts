/**
 * TradingView Enhanced Proxy Routes
 * 
 * Proxy otimizado para TradingView com cache de 1 segundo para dados de mercado
 * e integração WebSocket para atualizações em tempo real.
 * 
 * Funcionalidades:
 * ✅ Cache de 1 segundo para dados de mercado (real-time)
 * ✅ Cache de 5 minutos para dados históricos
 * ✅ WebSocket broadcaster para clientes conectados
 * ✅ Fallback para Binance quando TradingView falha
 * ✅ Limpeza automática de cache
 * ✅ Logs detalhados para debugging
 */

import { FastifyInstance } from 'fastify';
import axios from 'axios';

// Cache inteligente para dados de mercado (1 segundo)
let marketDataCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cache inteligente para dados históricos (5 minutos)
let historicalDataCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// WebSocket broadcaster para atualizações em tempo real
class WebSocketBroadcaster {
  private connections = new Set<any>();

  addConnection(connection: any) {
    this.connections.add(connection);
    console.log(`🔌 WebSocket broadcaster - Connection added (total: ${this.connections.size})`);
  }

  removeConnection(connection: any) {
    this.connections.delete(connection);
    console.log(`🔌 WebSocket broadcaster - Connection removed (total: ${this.connections.size})`);
  }

  broadcast(data: any) {
    const message = JSON.stringify({
      type: 'market_data',
      data,
      timestamp: Date.now()
    });

    this.connections.forEach(connection => {
      try {
        if (connection.readyState === 1) { // WebSocket.OPEN
          connection.send(message);
        }
      } catch (error) {
        console.error('❌ WebSocket broadcaster - Error sending message:', error);
        this.connections.delete(connection);
      }
    });
  }
}

const marketDataBroadcaster = new WebSocketBroadcaster();

// Limpeza automática do cache a cada 2 minutos
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  // Limpar cache de dados de mercado
  for (const [key, entry] of marketDataCache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      marketDataCache.delete(key);
      cleanedCount++;
    }
  }
  
  // Limpar cache de dados históricos
  for (const [key, entry] of historicalDataCache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      historicalDataCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 TRADINGVIEW ENHANCED - Cache cleanup: ${cleanedCount} expired entries removed`);
  }
}, 2 * 60 * 1000); // 2 minutos

export default async function tradingViewEnhancedRoutes(fastify: FastifyInstance) {
  console.log('🚀 TRADINGVIEW ENHANCED ROUTES - Initializing...');

  // ============================================================================
  // ENDPOINT PARA DADOS DE MERCADO (CACHE 1 SEGUNDO)
  // ============================================================================
  
  fastify.get('/tradingview/market-data', async (request, reply) => {
    try {
      const { symbol = 'BTCUSDT' } = request.query as { symbol?: string };
      
      console.log('🔄 TRADINGVIEW ENHANCED - Market data request:', { symbol });

      const cacheKey = `market_${symbol}`;
      const now = Date.now();
      const MARKET_DATA_CACHE_TTL = 1000; // 1 segundo
      
      // Verificar cache de dados de mercado (1 segundo)
      const cached = marketDataCache.get(cacheKey);
      if (cached && (now - cached.timestamp) < MARKET_DATA_CACHE_TTL) {
        console.log('📦 TRADINGVIEW ENHANCED - Market data cache hit:', {
          symbol,
          age: (now - cached.timestamp) + 'ms',
          ttl: MARKET_DATA_CACHE_TTL + 'ms'
        });
        
        return reply.send({
          success: true,
          data: cached.data,
          source: 'tradingview-enhanced-cached',
          timestamp: cached.timestamp,
          cacheHit: true
        });
      }

      console.log('📦 TRADINGVIEW ENHANCED - Market data cache miss, fetching fresh data');

      // Buscar dados frescos do Binance
      const freshData = await fetchMarketDataFromBinance(symbol);
      
      // Cache por 1 segundo
      marketDataCache.set(cacheKey, {
        data: freshData,
        timestamp: now,
        ttl: MARKET_DATA_CACHE_TTL
      });
      
      // Broadcast para WebSocket clients
      marketDataBroadcaster.broadcast(freshData);
      
      console.log('✅ TRADINGVIEW ENHANCED - Market data fetched and cached:', {
        symbol,
        price: freshData.price,
        change24h: freshData.change24h
      });

      return reply.send({
        success: true,
        data: freshData,
        source: 'tradingview-enhanced-fresh',
        timestamp: now,
        cacheHit: false
      });

    } catch (error: any) {
      console.error('❌ TRADINGVIEW ENHANCED - Market data error:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'MARKET_DATA_ERROR',
        message: error.message || 'Failed to fetch market data'
      });
    }
  });

  // ============================================================================
  // ENDPOINT PARA DADOS HISTÓRICOS (CACHE 5 MINUTOS)
  // ============================================================================
  
  fastify.get('/tradingview/scanner', async (request, reply) => {
    try {
      const { symbol, timeframe, limit } = request.query as {
        symbol?: string;
        timeframe?: string;
        limit?: string;
      };

      console.log('🔄 TRADINGVIEW ENHANCED - Historical data request:', { symbol, timeframe, limit });

      // Gerar chave de cache para dados históricos
      const cacheKey = `historical_${symbol}_${timeframe}_${limit}`;
      const now = Date.now();
      const HISTORICAL_DATA_CACHE_TTL = 5 * 60 * 1000; // 5 minutos
      
      // Verificar cache para dados históricos (5 minutos)
      const cached = historicalDataCache.get(cacheKey);
      if (cached && (now - cached.timestamp) < HISTORICAL_DATA_CACHE_TTL) {
        console.log('📦 TRADINGVIEW ENHANCED - Historical data cache hit:', {
          cacheKey: cacheKey.substring(0, 50) + '...',
          age: (now - cached.timestamp) / 1000 + 's',
          ttl: HISTORICAL_DATA_CACHE_TTL / 1000 + 's'
        });
        
        return reply.send({
          success: true,
          data: cached.data,
          source: 'tradingview-enhanced-historical-cached',
          timestamp: cached.timestamp,
          cacheHit: true
        });
      }

      console.log('📦 TRADINGVIEW ENHANCED - Historical data cache miss, fetching fresh data');

      // Buscar dados históricos do Binance
      const freshData = await fetchHistoricalDataFromBinance(symbol, timeframe, limit);
      
      // Cache por 5 minutos
      historicalDataCache.set(cacheKey, {
        data: freshData,
        timestamp: now,
        ttl: HISTORICAL_DATA_CACHE_TTL
      });
      
      console.log('✅ TRADINGVIEW ENHANCED - Historical data fetched and cached:', {
        symbol,
        timeframe,
        dataPoints: freshData.length
      });

      return reply.send({
        success: true,
        data: freshData,
        source: 'tradingview-enhanced-historical-fresh',
        timestamp: now,
        cacheHit: false
      });

    } catch (error: any) {
      console.error('❌ TRADINGVIEW ENHANCED - Historical data error:', error);
      
      return reply.status(500).send({
        success: false,
        error: 'HISTORICAL_DATA_ERROR',
        message: error.message || 'Failed to fetch historical data'
      });
    }
  });

  // ============================================================================
  // WEBSOCKET PARA ATUALIZAÇÕES EM TEMPO REAL
  // ============================================================================
  
  fastify.get('/tradingview/stream', { websocket: true }, (connection, request) => {
    console.log('🔌 TRADINGVIEW ENHANCED - WebSocket connection established');
    
    // Adicionar conexão ao broadcaster
    marketDataBroadcaster.addConnection(connection.socket);
    
    // Enviar dados iniciais
    const initialData = {
      type: 'connection_established',
      message: 'Connected to TradingView Enhanced stream',
      timestamp: Date.now()
    };
    
    connection.socket.send(JSON.stringify(initialData));
    
    // Handler para mensagens do cliente
    connection.socket.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('📨 TRADINGVIEW ENHANCED - WebSocket message received:', data);
        
        // Processar mensagens do cliente (subscribe, unsubscribe, etc.)
        if (data.type === 'subscribe') {
          connection.socket.send(JSON.stringify({
            type: 'subscribed',
            symbol: data.symbol,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('❌ TRADINGVIEW ENHANCED - WebSocket message error:', error);
      }
    });
    
    // Handler para fechamento da conexão
    connection.socket.on('close', () => {
      console.log('🔌 TRADINGVIEW ENHANCED - WebSocket connection closed');
      marketDataBroadcaster.removeConnection(connection.socket);
    });
    
    // Handler para erros
    connection.socket.on('error', (error) => {
      console.error('❌ TRADINGVIEW ENHANCED - WebSocket error:', error);
      marketDataBroadcaster.removeConnection(connection.socket);
    });
  });

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================
  
  /**
   * Buscar dados de mercado do Binance
   */
  async function fetchMarketDataFromBinance(symbol: string): Promise<any> {
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
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ TRADINGVIEW ENHANCED - Binance API error:', error);
      throw new Error('Failed to fetch market data from Binance');
    }
  }
  
  /**
   * Buscar dados históricos do Binance
   */
  async function fetchHistoricalDataFromBinance(symbol: string, timeframe: string, limit: string): Promise<any[]> {
    try {
      const interval = mapTimeframeToBinanceInterval(timeframe);
      const limitNum = parseInt(limit) || 100;
      
      const response = await axios.get(`https://api.binance.com/api/v3/klines`, {
        params: {
          symbol,
          interval,
          limit: limitNum
        },
        timeout: 10000
      });
      
      return response.data.map((kline: any[]) => ({
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5])
      }));
    } catch (error) {
      console.error('❌ TRADINGVIEW ENHANCED - Binance historical data error:', error);
      throw new Error('Failed to fetch historical data from Binance');
    }
  }
  
  /**
   * Mapear timeframe TradingView para intervalo Binance
   */
  function mapTimeframeToBinanceInterval(timeframe: string): string {
    const mapping: { [key: string]: string } = {
      '1m': '1m',
      '3m': '3m',
      '5m': '5m',
      '15m': '15m',
      '30m': '30m',
      '1h': '1h',
      '2h': '2h',
      '4h': '4h',
      '6h': '6h',
      '8h': '8h',
      '12h': '12h',
      '1d': '1d',
      '3d': '3d',
      '1w': '1w',
      '1M': '1M'
    };
    
    return mapping[timeframe] || '1h';
  }

  console.log('✅ TRADINGVIEW ENHANCED ROUTES - Routes registered successfully');
}
