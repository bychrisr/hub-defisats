// src/services/marketData.service.ts
import axios from 'axios';

export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketData {
  price: number;
  change24h: number;
  volume: number;
  timestamp: number;
}

class MarketDataService {
  private baseUrl: string;
  private wsUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:13000';
    this.wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:13000';
  }

  // Generate sample data for development
  private generateSampleData(symbol: string, timeframe: string, limit: number): CandleData[] {
    console.log('📊 MARKET DATA - Generating sample data for development');
    
    const bars: CandleData[] = [];
    let price = 50000; // Starting BTC price
    const now = Date.now() / 1000;
    
    // Calculate interval in seconds based on timeframe
    const intervalSeconds = this.getIntervalSeconds(timeframe);
    
    for (let i = 0; i < limit; i++) {
      const time = now - (limit - i) * intervalSeconds;
      const change = (Math.random() - 0.5) * 1000; // Random price change
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * 200;
      const low = Math.min(open, close) - Math.random() * 200;
      const volume = Math.random() * 1000000;
      
      bars.push({
        time: Math.floor(time),
        open,
        high,
        low,
        close,
        volume
      });
      
      price = close;
    }
    
    return bars;
  }

  private getIntervalSeconds(timeframe: string): number {
    const tf = timeframe.toLowerCase();
    if (tf.includes('1m')) return 60;
    if (tf.includes('5m')) return 300;
    if (tf.includes('15m')) return 900;
    if (tf.includes('30m')) return 1800;
    if (tf.includes('1h')) return 3600;
    if (tf.includes('4h')) return 14400;
    if (tf.includes('1d')) return 86400;
    return 3600; // Default 1h
  }

  // Map timeframe to Binance interval
  private mapTimeframeToBinance(timeframe: string): string {
    const tf = timeframe.toLowerCase();
    if (tf.includes('1m')) return '1m';
    if (tf.includes('5m')) return '5m';
    if (tf.includes('15m')) return '15m';
    if (tf.includes('30m')) return '30m';
    if (tf.includes('1h')) return '1h';
    if (tf.includes('4h')) return '4h';
    if (tf.includes('1d')) return '1d';
    return '1h'; // Default
  }

  // Clean symbol for Binance API
  private cleanSymbolForBinance(symbol: string): string {
    return symbol
      .replace('BINANCE:', '')
      .replace(':', '')
      .toUpperCase();
  }

  // Get historical data through TradingView proxy
  async getHistoricalData(symbol: string, timeframe: string = '1h', limit: number = 100, startTime?: number): Promise<CandleData[]> {
    console.log('🔄 MARKET DATA - Fetching historical data via TradingView proxy:', { symbol, timeframe, limit, startTime });

    // Try TradingView proxy first (recommended)
    try {
      const response = await axios.get(`${this.baseUrl}/api/tradingview/scanner`, {
        params: {
          symbol: symbol.replace('BINANCE:', ''),
          timeframe,
          limit
        },
        timeout: 15000
      });

      if (response.data && response.data.success && response.data.data) {
        console.log('✅ MARKET DATA - TradingView proxy success:', {
          count: response.data.data.length,
          source: response.data.source,
          cacheHit: response.data.cacheHit
        });
        
        return response.data.data.map((candle: any) => ({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume || 0
        }));
      }
    } catch (error: any) {
      console.warn('⚠️ MARKET DATA - TradingView proxy failed:', error.message);
    }

    // Try legacy market endpoint as fallback
    try {
      const response = await axios.get(`${this.baseUrl}/api/market/historical`, {
        params: {
          symbol: symbol.replace('BINANCE:', ''),
          timeframe,
          limit,
          startTime
        },
        timeout: 10000
      });

      if (response.data && response.data.data) {
        console.log('✅ MARKET DATA - Legacy endpoint success:', response.data.data.length, 'candles');
        return response.data.data.map((candle: any) => ({
          time: candle.time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume || 0
        }));
      }
    } catch (error: any) {
      console.warn('⚠️ MARKET DATA - Legacy endpoint failed:', error.message);
    }

    // Fallback to sample data for development
    console.log('📊 MARKET DATA - Using sample data for development');
    return this.generateSampleData(symbol, timeframe, limit);
  }

  // Get current market data through TradingView proxy
  async getMarketData(symbol: string): Promise<MarketData> {
    // Try TradingView proxy first
    try {
      const response = await axios.get(`${this.baseUrl}/api/tradingview/market/${symbol.replace('BINANCE:', '')}`, {
        timeout: 5000
      });

      if (response.data && response.data.success && response.data.data) {
        console.log('✅ MARKET DATA - TradingView market data success:', response.data.data);
        return {
          price: response.data.data.price,
          change24h: response.data.data.change24h,
          volume: response.data.data.volume,
          timestamp: response.data.data.timestamp || Date.now()
        };
      }
    } catch (error: any) {
      console.warn('⚠️ MARKET DATA - TradingView market proxy failed:', error.message);
    }

    // Try legacy ticker endpoint as fallback
    try {
      const response = await axios.get(`${this.baseUrl}/api/market/ticker`, {
        params: { symbol: symbol.replace('BINANCE:', '') },
        timeout: 5000
      });

      if (response.data && response.data.data) {
        return {
          price: response.data.data.price,
          change24h: response.data.data.change24h,
          volume: response.data.data.volume,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.warn('⚠️ MARKET DATA - Legacy ticker endpoint failed, using sample data');
    }

    // Fallback to sample data
    const samplePrice = 50000 + (Math.random() - 0.5) * 2000;
    return {
      price: samplePrice,
      change24h: (Math.random() - 0.5) * 10,
      volume: Math.random() * 1000000,
      timestamp: Date.now()
    };
  }

  // WebSocket connection for real-time data
  connectWebSocket(symbol: string, onMessage: (data: any) => void): WebSocket | null {
    try {
      const ws = new WebSocket(`${this.wsUrl}/ws/market?symbol=${encodeURIComponent(symbol)}`);
      
      ws.onopen = () => {
        console.log('📡 MARKET DATA - WebSocket connected for', symbol);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('❌ MARKET DATA - WebSocket message parse error:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('📡 MARKET DATA - WebSocket disconnected');
      };
      
      ws.onerror = (error) => {
        console.error('❌ MARKET DATA - WebSocket error:', error);
      };
      
      return ws;
    } catch (error) {
      console.error('❌ MARKET DATA - WebSocket connection failed:', error);
      return null;
    }
  }
}

export const marketDataService = new MarketDataService();