interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

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

  // Obter dados históricos via REST API
  async getHistoricalData(symbol: string, timeframe: string = '1m', limit: number = 100): Promise<CandleData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/market/historical?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ MARKET DATA - Historical data received:', data);
      return data.data?.candles || [];
    } catch (error) {
      console.error('❌ MARKET DATA - Erro ao obter dados históricos:', error);
      return this.generateSampleData();
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
