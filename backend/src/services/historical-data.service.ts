import axios from 'axios';

export interface HistoricalCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  market: string;
}

export class HistoricalDataService {
  private readonly COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
  private readonly BINANCE_BASE_URL = 'https://api.binance.com/api/v3';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
  private cache: Map<string, { data: HistoricalCandle[]; timestamp: number }> = new Map();

  /**
   * Obtém dados históricos da CoinGecko
   */
  async getCoinGeckoHistoricalData(
    coinId: string = 'bitcoin',
    days: number = 30,
    interval: string = 'hourly'
  ): Promise<HistoricalCandle[]> {
    try {
      const cacheKey = `coingecko_${coinId}_${days}_${interval}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.log('📊 HISTORICAL DATA - Using cached CoinGecko data');
        return cached;
      }

      console.log(`📊 HISTORICAL DATA - Fetching CoinGecko data for ${coinId}, ${days} days, ${interval}`);
      
      const response = await axios.get(`${this.COINGECKO_BASE_URL}/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: 'usd',
          days,
          interval: interval === 'hourly' ? 'hourly' : 'daily',
        },
        headers: {
          'User-Agent': 'Axisor/1.0',
          'Accept': 'application/json',
        },
        timeout: 10000,
      });

      if (!response.data.prices) {
        throw new Error('Invalid CoinGecko response format');
      }

      const prices = response.data.prices;
      const volumes = response.data.total_volumes || [];
      const marketCaps = response.data.market_caps || [];

      const candles: HistoricalCandle[] = [];
      
      for (let i = 0; i < prices.length; i++) {
        const [timestamp, price] = prices[i];
        const volume = volumes[i] ? volumes[i][1] : 0;
        const marketCap = marketCaps[i] ? marketCaps[i][1] : 0;

        // Para CoinGecko, precisamos simular OHLC já que só temos preços
        const volatility = 0.002; // 0.2% de volatilidade
        const open = price * (1 + (Math.random() - 0.5) * volatility);
        const close = price;
        const high = Math.max(open, close) * (1 + Math.random() * volatility);
        const low = Math.min(open, close) * (1 - Math.random() * volatility);

        candles.push({
          timestamp: Math.floor(timestamp / 1000), // Converter para segundos
          open,
          high,
          low,
          close,
          volume: volume || marketCap * 0.01, // Usar market cap como proxy se volume não disponível
        });
      }

      this.setCachedData(cacheKey, candles);
      console.log(`✅ HISTORICAL DATA - CoinGecko data retrieved: ${candles.length} candles`);
      
      return candles;
    } catch (error) {
      console.error('❌ HISTORICAL DATA - CoinGecko error:', error);
      throw new Error(`Failed to fetch CoinGecko data: ${error}`);
    }
  }

  /**
   * Obtém dados históricos da Binance
   */
  async getBinanceHistoricalData(
    symbol: string = 'BTCUSDT',
    interval: string = '1h',
    limit: number = 1000
  ): Promise<HistoricalCandle[]> {
    try {
      const cacheKey = `binance_${symbol}_${interval}_${limit}`;
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.log('📊 HISTORICAL DATA - Using cached Binance data');
        return cached;
      }

      console.log(`📊 HISTORICAL DATA - Fetching Binance data for ${symbol}, ${interval}, limit ${limit}`);
      
      const response = await axios.get(`${this.BINANCE_BASE_URL}/klines`, {
        params: {
          symbol,
          interval,
          limit,
        },
        headers: {
          'User-Agent': 'Axisor/1.0',
          'Accept': 'application/json',
        },
        timeout: 10000,
      });

      if (!Array.isArray(response.data)) {
        throw new Error('Invalid Binance response format');
      }

      const candles: HistoricalCandle[] = response.data.map((kline: any[]) => ({
        timestamp: kline[0] / 1000, // Converter de ms para segundos
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
      }));

      this.setCachedData(cacheKey, candles);
      console.log(`✅ HISTORICAL DATA - Binance data retrieved: ${candles.length} candles`);
      
      return candles;
    } catch (error) {
      console.error('❌ HISTORICAL DATA - Binance error:', error);
      throw new Error(`Failed to fetch Binance data: ${error}`);
    }
  }

  /**
   * Obtém dados históricos com fallback automático
   */
  async getHistoricalData(
    market: string = 'btcusd',
    timeframe: string = '1h',
    limit: number = 1000
  ): Promise<MarketData[]> {
    try {
      console.log(`📊 HISTORICAL DATA - Getting historical data for ${market}, ${timeframe}, limit ${limit}`);

      let candles: HistoricalCandle[] = [];

      // Tentar Binance primeiro (dados mais precisos)
      try {
        const binanceSymbol = this.mapMarketToBinanceSymbol(market);
        candles = await this.getBinanceHistoricalData(binanceSymbol, timeframe, limit);
        console.log(`✅ HISTORICAL DATA - Using Binance data for ${market}`);
      } catch (binanceError) {
        console.log('⚠️ HISTORICAL DATA - Binance failed, trying CoinGecko');
        
        // Fallback para CoinGecko
        try {
          const coinGeckoId = this.mapMarketToCoinGeckoId(market);
          const days = this.calculateDaysFromTimeframe(timeframe, limit);
          const interval = this.mapTimeframeToCoinGeckoInterval(timeframe);
          
          candles = await this.getCoinGeckoHistoricalData(coinGeckoId, days, interval);
          console.log(`✅ HISTORICAL DATA - Using CoinGecko data for ${market}`);
        } catch (coingeckoError) {
          console.log('⚠️ HISTORICAL DATA - Both APIs failed, using simulated data');
          candles = this.generateSimulatedData(market, timeframe, limit);
        }
      }

      // Converter para formato padrão
      const marketData: MarketData[] = candles.map(candle => ({
        timestamp: new Date(candle.timestamp * 1000),
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        market,
      }));

      console.log(`✅ HISTORICAL DATA - Historical data prepared: ${marketData.length} candles`);
      return marketData;
    } catch (error) {
      console.error('❌ HISTORICAL DATA - Error getting historical data:', error);
      throw new Error('Failed to get historical data');
    }
  }

  /**
   * Mapeia mercado para símbolo Binance
   */
  private mapMarketToBinanceSymbol(market: string): string {
    const mapping: Record<string, string> = {
      'btcusd': 'BTCUSDT',
      'ethusd': 'ETHUSDT',
      'ltcusd': 'LTCUSDT',
      'adausd': 'ADAUSDT',
      'dotusd': 'DOTUSDT',
      'linkusd': 'LINKUSDT',
      'uniusd': 'UNIUSDT',
      'solusd': 'SOLUSDT',
    };
    
    return mapping[market.toLowerCase()] || 'BTCUSDT';
  }

  /**
   * Mapeia mercado para ID CoinGecko
   */
  private mapMarketToCoinGeckoId(market: string): string {
    const mapping: Record<string, string> = {
      'btcusd': 'bitcoin',
      'ethusd': 'ethereum',
      'ltcusd': 'litecoin',
      'adausd': 'cardano',
      'dotusd': 'polkadot',
      'linkusd': 'chainlink',
      'uniusd': 'uniswap',
      'solusd': 'solana',
    };
    
    return mapping[market.toLowerCase()] || 'bitcoin';
  }

  /**
   * Mapeia timeframe para intervalo CoinGecko
   */
  private mapTimeframeToCoinGeckoInterval(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': 'hourly',
      '5m': 'hourly',
      '15m': 'hourly',
      '1h': 'hourly',
      '4h': 'hourly',
      '1d': 'daily',
    };
    
    return mapping[timeframe] || 'hourly';
  }

  /**
   * Calcula dias baseado no timeframe e limite
   */
  private calculateDaysFromTimeframe(timeframe: string, limit: number): number {
    const timeframeHours: Record<string, number> = {
      '1m': 1/60,
      '5m': 5/60,
      '15m': 15/60,
      '1h': 1,
      '4h': 4,
      '1d': 24,
    };
    
    const hoursPerPeriod = timeframeHours[timeframe] || 1;
    const totalHours = limit * hoursPerPeriod;
    const days = Math.ceil(totalHours / 24);
    
    return Math.min(Math.max(days, 1), 365); // Entre 1 e 365 dias
  }

  /**
   * Gera dados simulados como último recurso
   */
  private generateSimulatedData(market: string, timeframe: string, limit: number): HistoricalCandle[] {
    console.log(`🔄 HISTORICAL DATA - Generating simulated data for ${market}`);
    
    const candles: HistoricalCandle[] = [];
    const now = Date.now() / 1000;
    const intervalSeconds = this.getTimeframeSeconds(timeframe);
    let price = 50000; // Preço inicial simulado
    
    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = now - (i * intervalSeconds);
      
      // Simular movimento de preço realístico
      const change = (Math.random() - 0.5) * 0.02; // ±1% de mudança
      price = price * (1 + change);
      
      const high = price * (1 + Math.random() * 0.01);
      const low = price * (1 - Math.random() * 0.01);
      const volume = Math.random() * 1000000;
      
      candles.push({
        timestamp: Math.floor(timestamp),
        open: price,
        high,
        low,
        close: price,
        volume,
      });
    }
    
    return candles;
  }

  /**
   * Converte timeframe para segundos
   */
  private getTimeframeSeconds(timeframe: string): number {
    const mapping: Record<string, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400,
    };
    
    return mapping[timeframe] || 3600;
  }

  /**
   * Obtém dados do cache
   */
  private getCachedData(key: string): HistoricalCandle[] | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Define dados no cache
   */
  private setCachedData(key: string, data: HistoricalCandle[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Limpa cache expirado
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if ((now - cached.timestamp) >= this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}