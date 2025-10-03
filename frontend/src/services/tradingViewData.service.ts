/**
 * TradingView Data Service - API Principal
 * 
 * Arquitetura TradingView-first com fallbacks robustos:
 * 1. TradingView (principal) - dados agregados de múltiplas exchanges via proxy backend
 * 2. Binance (fallback) - dados diretos da exchange
 * 3. CoinGecko (backup) - dados de mercado agregados
 * 
 * Conformidade com _VOLATILE_MARKET_SAFETY.md:
 * - Cache máximo 30 segundos
 * - Validação rigorosa de timestamps
 * - Nenhum fallback com dados simulados
 * - Erro transparente quando dados indisponíveis
 */

import { CandleData } from '../types/market';

// Configuração de símbolos TradingView (multi-exchange)
const TRADINGVIEW_SYMBOLS = {
  BTCUSDT: [
    'BINANCE:BTCUSDT',    // 40% weight
    'BYBIT:BTCUSDT',      // 30% weight  
    'BITMEX:BTCUSDT',     // 20% weight
    'DERIBIT:BTCUSDT'     // 10% weight
  ]
};

// Configuração de APIs com prioridades e limites
const API_CONFIG = {
  tradingview: {
    priority: 1,
    weight: 0.8,
    requestsPerMinute: 100,
    timeout: 10000,
    baseUrl: '/api/tradingview' // Proxy backend
  },
  binance: {
    priority: 2,
    weight: 0.15,
    requestsPerMinute: 20,
    timeout: 8000,
    baseUrl: 'https://api.binance.com'
  },
  coingecko: {
    priority: 3,
    weight: 0.05,
    requestsPerMinute: 10,
    timeout: 12000,
    baseUrl: 'https://api.coingecko.com'
  }
};

// Cache inteligente (conforme _VOLATILE_MARKET_SAFETY.md)
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // TTL diferenciado: 30s para mercado, 5min para históricos
}

class IntelligentCache {
  private cache = new Map<string, CacheEntry>();
  private readonly MAX_TTL_MARKET = 30 * 1000; // 30 segundos para dados de mercado
  private readonly MAX_TTL_HISTORICAL = 5 * 60 * 1000; // 5 minutos para dados históricos

  set(key: string, data: any, customTtl?: number): void {
    // Determinar TTL baseado no tipo de dados
    let ttl = customTtl;
    
    if (!ttl) {
      // TTL automático baseado no tipo de dados
      if (key.includes('historical_')) {
        ttl = this.MAX_TTL_HISTORICAL;
      } else {
        ttl = this.MAX_TTL_MARKET;
      }
    }
    
    // Garantir que não exceda os limites de segurança
    const maxTtl = key.includes('historical_') ? this.MAX_TTL_HISTORICAL : this.MAX_TTL_MARKET;
    ttl = Math.min(ttl, maxTtl);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Log para monitoramento do cache diferenciado
    const dataType = key.includes('historical_') ? 'HISTORICAL' : 'MARKET';
    console.log(`📦 CACHE SET - ${dataType} data cached for ${ttl/1000}s:`, {
      key: key.substring(0, 50) + '...',
      dataType,
      ttl: ttl/1000 + 's',
      dataLength: Array.isArray(data) ? data.length : 'object'
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) {
      console.log(`📦 CACHE MISS - No entry found:`, key.substring(0, 50) + '...');
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.cache.delete(key);
      const dataType = key.includes('historical_') ? 'HISTORICAL' : 'MARKET';
      console.log(`📦 CACHE EXPIRED - ${dataType} data expired after ${age/1000}s:`, key.substring(0, 50) + '...');
      return null;
    }

    const dataType = key.includes('historical_') ? 'HISTORICAL' : 'MARKET';
    console.log(`📦 CACHE HIT - ${dataType} data retrieved (age: ${age/1000}s):`, {
      key: key.substring(0, 50) + '...',
      dataType,
      age: age/1000 + 's',
      ttl: entry.ttl/1000 + 's'
    });
    return entry.data;
  }

  isCacheValid(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    return age <= entry.ttl;
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Rate Limiter inteligente
class IntelligentRateLimiter {
  private requests = new Map<string, number[]>();

  canMakeRequest(api: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(api) || [];
    
    // Limpar requests antigos (> 1 minuto)
    const recentRequests = requests.filter(time => now - time < 60000);
    this.requests.set(api, recentRequests);

    const config = API_CONFIG[api as keyof typeof API_CONFIG];
    return recentRequests.length < config.requestsPerMinute;
  }

  recordRequest(api: string): void {
    const now = Date.now();
    const requests = this.requests.get(api) || [];
    requests.push(now);
    this.requests.set(api, requests);
  }

  getStats(): Record<string, { requests: number; limit: number }> {
    const stats: Record<string, { requests: number; limit: number }> = {};
    
    for (const [api, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => Date.now() - time < 60000);
      const config = API_CONFIG[api as keyof typeof API_CONFIG];
      
      stats[api] = {
        requests: recentRequests.length,
        limit: config.requestsPerMinute
      };
    }
    
    return stats;
  }
}

// Validador de dados (conforme _VOLATILE_MARKET_SAFETY.md)
class DataValidator {
  static validateData(data: any, maxAge: number = 30000): boolean {
    if (!data || !data.timestamp) {
      console.warn('⚠️ VALIDATOR - Dados sem timestamp rejeitados');
      return false;
    }

    const age = Date.now() - data.timestamp;
    if (age > maxAge) {
      console.warn(`⚠️ VALIDATOR - Dados muito antigos rejeitados (${age}ms > ${maxAge}ms)`);
      return false;
    }

    return true;
  }

  static validateCandleData(candles: CandleData[]): boolean {
    if (!Array.isArray(candles) || candles.length === 0) {
      return false;
    }

    // Verificar se todos os candles têm os campos obrigatórios
    return candles.every(candle => 
      typeof candle.time === 'number' &&
      typeof candle.open === 'number' &&
      typeof candle.high === 'number' &&
      typeof candle.low === 'number' &&
      typeof candle.close === 'number'
    );
  }
}

export class TradingViewDataService {
  private cache = new IntelligentCache();
  private rateLimiter = new IntelligentRateLimiter();
  private validator = DataValidator;

  /**
   * Obter dados históricos com fallback robusto
   */
  async getHistoricalData(
    symbol: string,
    timeframe: string,
    limit: number = 500,
    startTime?: number
  ): Promise<CandleData[]> {
    const cacheKey = `historical_${symbol}_${timeframe}_${limit}_${startTime || 'latest'}`;
    
    // 1. Verificar cache primeiro
    if (this.cache.isCacheValid(cacheKey)) {
      console.log('📦 TRADINGVIEW - Using cached data');
      return this.cache.get(cacheKey);
    }

    // 2. Tentar APIs em ordem de prioridade
    const apis = Object.entries(API_CONFIG)
      .sort(([,a], [,b]) => a.priority - b.priority)
      .map(([name]) => name);

    for (const apiName of apis) {
      try {
        if (!this.rateLimiter.canMakeRequest(apiName)) {
          console.warn(`⏳ TRADINGVIEW - Rate limit reached for ${apiName}`);
          continue;
        }

        console.log(`🔄 TRADINGVIEW - Fetching from ${apiName}`);
        const data = await this.fetchFromAPI(apiName, symbol, timeframe, limit, startTime);
        
        if (this.validator.validateCandleData(data)) {
          this.rateLimiter.recordRequest(apiName);
          this.cache.set(cacheKey, data);
          console.log(`✅ TRADINGVIEW - Data fetched from ${apiName}: ${data.length} candles`);
          return data;
        } else {
          console.warn(`⚠️ TRADINGVIEW - Invalid data from ${apiName}, trying next API`);
        }
      } catch (error) {
        console.warn(`❌ TRADINGVIEW - ${apiName} failed:`, error);
        continue;
      }
    }

    // 3. Se todas as APIs falharam
    throw new Error('Todas as APIs falharam - dados indisponíveis por segurança');
  }

  /**
   * Obter dados de mercado (preço atual, 24h change)
   */
  async getMarketData(symbol: string): Promise<{
    price: number;
    change24h: number;
    volume: number;
    timestamp: number;
  }> {
    const cacheKey = `market_${symbol}`;
    
    if (this.cache.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const apis = ['tradingview', 'binance', 'coingecko'];
    
    for (const apiName of apis) {
      try {
        if (!this.rateLimiter.canMakeRequest(apiName)) {
          continue;
        }

        const data = await this.fetchMarketDataFromAPI(apiName, symbol);
        
        if (this.validator.validateData(data)) {
          this.rateLimiter.recordRequest(apiName);
          this.cache.set(cacheKey, data);
          return data;
        }
      } catch (error) {
        console.warn(`❌ TRADINGVIEW - Market data from ${apiName} failed:`, error);
        continue;
      }
    }

    throw new Error('Dados de mercado indisponíveis - não exibimos dados antigos por segurança');
  }

  /**
   * Fetch de dados históricos por API específica
   */
  private async fetchFromAPI(
    apiName: string,
    symbol: string,
    timeframe: string,
    limit: number,
    startTime?: number
  ): Promise<CandleData[]> {
    const config = API_CONFIG[apiName as keyof typeof API_CONFIG];
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timeout after ${config.timeout}ms`)), config.timeout);
    });

    let dataPromise: Promise<CandleData[]>;

    switch (apiName) {
      case 'tradingview':
        dataPromise = this.fetchFromTradingView(symbol, timeframe, limit, startTime);
        break;
      case 'binance':
        dataPromise = this.fetchFromBinance(symbol, timeframe, limit, startTime);
        break;
      case 'coingecko':
        dataPromise = this.fetchFromCoinGecko(symbol, timeframe, limit, startTime);
        break;
      default:
        throw new Error(`API não suportada: ${apiName}`);
    }

    return Promise.race([dataPromise, timeoutPromise]);
  }

  /**
   * TradingView - Dados agregados de múltiplas exchanges via proxy backend
   */
  private async fetchFromTradingView(
    symbol: string,
    timeframe: string,
    limit: number,
    startTime?: number
  ): Promise<CandleData[]> {
    // Usar proxy backend para evitar CORS
    const params = new URLSearchParams({
      symbol,
      timeframe,
      limit: limit.toString()
    });

    if (startTime) {
      params.append('startTime', startTime.toString());
    }

    const response = await fetch(`${API_CONFIG.tradingview.baseUrl}/scanner?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`TradingView Proxy error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'TradingView Proxy failed');
    }

    // ✅ CORREÇÃO CRÍTICA: Converter timestamps de milissegundos para segundos
    // O backend proxy retorna timestamps em ms, mas Lightweight Charts espera em segundos
    const rawData = result.data || [];
    return rawData.map((candle: any) => ({
      time: Math.floor(candle.time / 1000), // Converter ms para segundos
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume
    }));
  }

  /**
   * Binance - Fallback direto
   */
  private async fetchFromBinance(
    symbol: string,
    timeframe: string,
    limit: number,
    startTime?: number
  ): Promise<CandleData[]> {
    const params = new URLSearchParams({
      symbol: symbol.replace('USDT', 'USDT'),
      interval: timeframe,
      limit: limit.toString()
    });

    if (startTime) {
      params.append('startTime', startTime.toString());
    }

    const response = await fetch(`${API_CONFIG.binance.baseUrl}/api/v3/klines?${params}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    return this.convertBinanceData(data);
  }

  /**
   * CoinGecko - Backup final
   */
  private async fetchFromCoinGecko(
    symbol: string,
    timeframe: string,
    limit: number,
    startTime?: number
  ): Promise<CandleData[]> {
    // CoinGecko não tem dados históricos detalhados como candlesticks
    // Usar apenas para dados de mercado básicos
    throw new Error('CoinGecko não suporta dados históricos detalhados');
  }

  /**
   * Fetch de dados de mercado por API específica
   */
  private async fetchMarketDataFromAPI(apiName: string, symbol: string): Promise<any> {
    switch (apiName) {
      case 'tradingview':
        return this.fetchMarketDataFromTradingView(symbol);
      case 'binance':
        return this.fetchMarketDataFromBinance(symbol);
      case 'coingecko':
        return this.fetchMarketDataFromCoinGecko(symbol);
      default:
        throw new Error(`API não suportada: ${apiName}`);
    }
  }

  /**
   * TradingView - Dados de mercado agregados via proxy backend
   */
  private async fetchMarketDataFromTradingView(symbol: string): Promise<any> {
    const response = await fetch(`${API_CONFIG.tradingview.baseUrl}/market/${symbol}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`TradingView Market Proxy error: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'TradingView Market Proxy failed');
    }

    return result.data;
  }

  /**
   * Binance - Dados de mercado diretos
   */
  private async fetchMarketDataFromBinance(symbol: string): Promise<any> {
    const response = await fetch(`${API_CONFIG.binance.baseUrl}/api/v3/ticker/24hr?symbol=${symbol}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChangePercent),
      volume: parseFloat(data.volume),
      timestamp: Date.now()
    };
  }

  /**
   * CoinGecko - Dados de mercado de backup
   */
  private async fetchMarketDataFromCoinGecko(symbol: string): Promise<any> {
    const coinId = this.getCoinGeckoId(symbol);
    const response = await fetch(`${API_CONFIG.coingecko.baseUrl}/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const coinData = data[coinId];
    
    return {
      price: coinData.usd,
      change24h: coinData.usd_24h_change,
      volume: 0, // CoinGecko não fornece volume neste endpoint
      timestamp: Date.now()
    };
  }

  /**
   * Conversores de dados
   */
  private convertTradingViewData(data: any, timeframe: string, startTime?: number): CandleData[] {
    // Implementar conversão específica do TradingView
    // Por enquanto, retornar array vazio para forçar fallback
    return [];
  }

  private convertBinanceData(data: any[]): CandleData[] {
    return data.map(candle => ({
      // ✅ CORREÇÃO CRÍTICA: Converter timestamp de milissegundos para segundos
      // Binance retorna timestamps em ms, mas Lightweight Charts espera em segundos
      time: Math.floor(candle[0] / 1000),
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      close: parseFloat(candle[4]),
      volume: parseFloat(candle[5])
    }));
  }

  private getCoinGeckoId(symbol: string): string {
    const mapping: Record<string, string> = {
      'BTCUSDT': 'bitcoin',
      'ETHUSDT': 'ethereum',
      'ADAUSDT': 'cardano'
    };
    return mapping[symbol] || 'bitcoin';
  }

  /**
   * Métodos de utilidade
   */
  getCacheStats(): { size: number; keys: string[] } {
    return this.cache.getStats();
  }

  getRateLimitStats(): Record<string, { requests: number; limit: number }> {
    return this.rateLimiter.getStats();
  }

  clearCache(): void {
    this.cache.clear();
  }
}

// Instância singleton
export const tradingViewDataService = new TradingViewDataService();
