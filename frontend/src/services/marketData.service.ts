import { tradingViewDataService } from './tradingViewData.service';
import { CandleData } from '../types/market';

// CandleData já importado de types/market

interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  candles: CandleData[];
}

interface WebSocketMessage {
  type: 'price_update' | 'candle_update' | 'market_data' | 'error';
  data: any;
  timestamp: number;
}

class MarketDataService {
  private baseUrl: string;
  private wsUrl: string;

  constructor() {
    // ✅ Usar caminho relativo para funcionar com proxy do Vite
    this.baseUrl = '';
    this.wsUrl = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
  }

  // Obter dados históricos usando TradingView Data Service (nova arquitetura)
  async getHistoricalDataFromBinance(symbol: string, timeframe: string = '1m', limit: number = 100, startTime?: number): Promise<CandleData[]> {
    console.log('🔄 MARKET DATA - Using TradingView Data Service for historical data');
    
    try {
      const data = await tradingViewDataService.getHistoricalData(symbol, timeframe, limit, startTime);
      
      console.log(`✅ MARKET DATA - Data fetched successfully:`, {
        symbol,
        timeframe,
        count: data.length,
        source: 'TradingView-first with fallbacks'
      });
      
      return data;
    } catch (error: any) {
      console.error('❌ MARKET DATA - TradingView Data Service failed:', error);
      throw error;
    }
  }

  // Método legado mantido para compatibilidade (agora usa Exchange Weight Service)
  async getHistoricalDataFromBinanceLegacy(symbol: string, timeframe: string = '1m', limit: number = 100, startTime?: number): Promise<CandleData[]> {
    const mapTf = (tf: string) => {
      // Normalizar para intervalos do Binance
      const m = String(tf).toLowerCase();
      if (m === '1h' || m === '60' || m === '60m') return '1h';
      if (m === '4h' || m === '240' || m === '240m') return '4h';
      if (m === '1d' || m === 'd' || m === '1D') return '1d';
      if (m === '15m' || m === '15') return '15m';
      if (m === '5m' || m === '5') return '5m';
      return '1m';
    };

    try {
      const interval = mapTf(timeframe);
      let url = `https://api.binance.com/api/v3/klines?symbol=${symbol.replace(':','')}&interval=${interval}&limit=${Math.min(limit || 500, 1000)}`;
      
      // Adicionar startTime se fornecido
      if (startTime) {
        url += `&startTime=${startTime * 1000}`; // Binance usa milissegundos
      }
      
      const r = await fetch(url);
      if (!r.ok) throw new Error(`Binance HTTP ${r.status}`);
      const arr: any[] = await r.json();
      return arr.map((k: any[]) => ({
        time: Math.floor(k[0] / 1000),
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5])
      }));
    } catch (e) {
      console.error('❌ MARKET DATA - Binance API failed:', e);
      return this.generateSampleData();
    }
  }

  // Obter dados históricos via REST API
  async getHistoricalData(symbol: string, timeframe: string = '1m', limit: number = 100, startTime?: number): Promise<CandleData[]> {
    const mapTf = (tf: string) => {
      // Normalizar para intervalos do Binance
      const m = String(tf).toLowerCase();
      if (m === '1h' || m === '60' || m === '60m') return '1h';
      if (m === '4h' || m === '240' || m === '240m') return '4h';
      if (m === '1d' || m === 'd' || m === '1D') return '1d';
      if (m === '15m' || m === '15') return '15m';
      if (m === '5m' || m === '5') return '5m';
      return '1m';
    };

    const req = async (): Promise<CandleData[]> => {
      let url = `${this.baseUrl}/api/market/historical?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`;
      if (startTime) {
        url += `&startTime=${startTime}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(String(response.status));
      }
      const data = await response.json();
      return data.data?.candles || [];
    };

    const fallbackBinance = async (): Promise<CandleData[]> => {
      try {
        const interval = mapTf(timeframe);
        let url = `https://api.binance.com/api/v3/klines?symbol=${symbol.replace(':','')}&interval=${interval}&limit=${Math.min(limit || 500, 1000)}`;
        
        // Adicionar startTime se fornecido
        if (startTime) {
          url += `&startTime=${startTime * 1000}`; // Binance usa milissegundos
        }
        
        const r = await fetch(url);
        if (!r.ok) throw new Error(`Binance HTTP ${r.status}`);
        const arr: any[] = await r.json();
        return arr.map((k: any[]) => ({
          time: Math.floor(k[0] / 1000),
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
          volume: parseFloat(k[5])
        }));
      } catch (e) {
        console.error('❌ MARKET DATA - Binance fallback failed:', e);
        return this.generateSampleData();
      }
    };

    try {
      const candles = await req();
      console.log('✅ MARKET DATA - Historical data received:', { count: candles.length });
      return candles;
    } catch (error) {
      console.warn('⚠️ MARKET DATA - Primary historical endpoint failed, using Binance fallback:', error);
      return fallbackBinance();
    }
  }

  // Obter dados de mercado atuais
  async getMarketData(symbol: string): Promise<MarketData> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market/data?symbol=${symbol}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ MARKET DATA - Current market data received:', data);
      return data.data || this.generateSampleMarketData(symbol);
    } catch (error) {
      console.error('❌ MARKET DATA - Erro ao obter dados de mercado:', error);
      return this.generateSampleMarketData(symbol);
    }
  }

  // Gerar dados de exemplo para demonstração
  private generateSampleData(): CandleData[] {
    const data: CandleData[] = [];
    const now = Date.now();
    let price = 50000; // Preço inicial em USD

    for (let i = 100; i >= 0; i--) {
      const time = (now - i * 60000) / 1000; // 1 minuto atrás
      const change = (Math.random() - 0.5) * 100; // Mudança menor e mais realista
      price += change;
      
      const open = price;
      const close = price + (Math.random() - 0.5) * 50; // Variação menor
      const high = Math.max(open, close) + Math.random() * 25;
      const low = Math.min(open, close) - Math.random() * 25;
      const volume = Math.random() * 1000000;

      data.push({
        time,
        open: Math.max(0, open),
        high: Math.max(0, high),
        low: Math.max(0, low),
        close: Math.max(0, close),
        volume
      });
    }

    return data;
  }

  private generateSampleMarketData(symbol: string): MarketData {
    const candles = this.generateSampleData();
    const latestCandle = candles[candles.length - 1];
    const firstCandle = candles[0];
    
    const change24h = latestCandle.close - firstCandle.open;
    const changePercent24h = (change24h / firstCandle.open) * 100;

    return {
      symbol,
      price: latestCandle.close,
      change24h,
      changePercent24h,
      volume24h: candles.reduce((sum, candle) => sum + candle.volume, 0),
      high24h: Math.max(...candles.map(c => c.high)),
      low24h: Math.min(...candles.map(c => c.low)),
      candles
    };
  }

  // Processar mensagem WebSocket
  processWebSocketMessage(message: WebSocketMessage): CandleData | null {
    try {
      switch (message.type) {
        case 'price_update':
          return {
            time: message.timestamp,
            open: message.data.price,
            high: message.data.price,
            low: message.data.price,
            close: message.data.price,
            volume: message.data.volume || 0
          };
        
        case 'candle_update':
          return {
            time: message.data.time,
            open: message.data.open,
            high: message.data.high,
            low: message.data.low,
            close: message.data.close,
            volume: message.data.volume
          };
        
        case 'market_data':
          return {
            time: message.timestamp,
            open: message.data.open,
            high: message.data.high,
            low: message.data.low,
            close: message.data.close,
            volume: message.data.volume
          };
        
        default:
          console.warn('⚠️ MARKET DATA - Tipo de mensagem desconhecido:', message.type);
          return null;
      }
    } catch (error) {
      console.error('❌ MARKET DATA - Erro ao processar mensagem WebSocket:', error);
      return null;
    }
  }

  // Formatar dados para o gráfico
  formatCandleData(candle: CandleData) {
    return {
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    };
  }

  // Calcular estatísticas
  calculateStats(candles: CandleData[]) {
    if (candles.length === 0) return null;

    const prices = candles.map(c => c.close);
    const volumes = candles.map(c => c.volume);
    
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
    
    const priceChange = prices[prices.length - 1] - prices[0];
    const priceChangePercent = (priceChange / prices[0]) * 100;

    return {
      avgPrice,
      maxPrice,
      minPrice,
      totalVolume,
      priceChange,
      priceChangePercent,
      candleCount: candles.length
    };
  }
}

export const marketDataService = new MarketDataService();
export type { CandleData, MarketData, WebSocketMessage };
