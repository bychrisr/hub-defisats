/**
 * LN Markets Optimized Service
 * 
 * Serviço otimizado para dados específicos da LN Markets com:
 * - Cache diferenciado por tipo de dado (30s rate, 1min funding, 5min fees)
 * - Suporte a testnet detection
 * - Rate limiting otimizado (1 req/sec)
 * - Validação rigorosa de dados
 * - Logs detalhados para debugging
 */

import { LNMarketsAPIv2 } from './lnmarkets/LNMarketsAPIv2.service';
import { TestnetDetector } from '../utils/testnet-detector';
import { MarketDataValidator } from '../utils/market-data-validator';

interface CachedData {
  data: any;
  timestamp: number;
  ttl: number;
}

interface LNMarketsCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  isTestnet?: boolean;
}

interface TradingFeesData {
  tradingFees: number;
  timestamp: number;
  source: string;
}

interface NextFundingData {
  nextFunding: string;
  timestamp: number;
  source: string;
}

interface RateData {
  rate: number;
  rateChange: number;
  timestamp: number;
  source: string;
}

export class LNMarketsOptimizedService {
  private cache = new Map<string, CachedData>();
  private lnMarketsAPI: LNMarketsAPIv2;
  private credentials: LNMarketsCredentials;
  private isTestnet: boolean;
  
  // Cache TTL diferenciado conforme _VOLATILE_MARKET_SAFETY.md
  private readonly TTL_RATE = 30 * 1000; // 30 segundos para rate
  private readonly TTL_FUNDING = 60 * 1000; // 1 minuto para funding
  private readonly TTL_FEES = 5 * 60 * 1000; // 5 minutos para fees
  
  // Rate limiting
  private lastRequestTime = 0;
  private readonly RATE_LIMIT = 1000; // 1 req/sec

  constructor(credentials: LNMarketsCredentials) {
    this.credentials = credentials;
    
    // Detectar testnet
    const testnetResult = TestnetDetector.detectTestnet(credentials);
    this.isTestnet = testnetResult.isTestnet;
    
    console.log('🚀 LN MARKETS OPTIMIZED - Initializing:', {
      isTestnet: this.isTestnet,
      reason: testnetResult.reason,
      confidence: testnetResult.confidence,
      credentials: {
        hasApiKey: !!credentials.apiKey,
        hasApiSecret: !!credentials.apiSecret,
        hasPassphrase: !!credentials.passphrase
      }
    });

    // Inicializar API com detecção de testnet
    this.lnMarketsAPI = new LNMarketsAPIv2({
      credentials: {
        ...credentials,
        isTestnet: this.isTestnet
      },
      logger: console
    });
  }

  /**
   * Obter trading fees com cache 5min
   */
  async getTradingFees(): Promise<TradingFeesData> {
    const cacheKey = 'trading_fees';
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log('📦 LN MARKETS OPTIMIZED - Trading fees cache hit:', {
        age: Date.now() - cached.timestamp + 'ms',
        ttl: cached.ttl + 'ms'
      });
      return cached.data;
    }

    console.log('🔄 LN MARKETS OPTIMIZED - Fetching trading fees...');
    
    try {
      await this.rateLimit();
      
      // Buscar dados de instrumentos para obter trading fees
      const instrumentData = await this.lnMarketsAPI.futures.getMarketInfo();
      
      const tradingFeesData: TradingFeesData = {
        tradingFees: instrumentData.tradingFees || 0.1, // Fallback padrão LN Markets
        timestamp: Date.now(),
        source: `lnmarkets-${this.isTestnet ? 'testnet' : 'mainnet'}`
      };

      // Validar dados
      const validation = MarketDataValidator.validateLNMarketsData({
        index: 0, // Não usado para fees
        tradingFees: tradingFeesData.tradingFees,
        nextFunding: '', // Não usado para fees
        rate: 0, // Não usado para fees
        timestamp: tradingFeesData.timestamp
      });

      if (!validation.valid) {
        throw new Error(`Trading fees validation failed: ${validation.reason}`);
      }

      // Cache por 5 minutos
      this.cache.set(cacheKey, {
        data: tradingFeesData,
        timestamp: Date.now(),
        ttl: this.TTL_FEES
      });

      console.log('✅ LN MARKETS OPTIMIZED - Trading fees fetched:', {
        tradingFees: tradingFeesData.tradingFees,
        source: tradingFeesData.source,
        isTestnet: this.isTestnet
      });

      return tradingFeesData;

    } catch (error: any) {
      console.error('❌ LN MARKETS OPTIMIZED - Trading fees error:', error);
      throw new Error(`Failed to fetch trading fees: ${error.message}`);
    }
  }

  /**
   * Obter next funding com cache 1min
   */
  async getNextFunding(): Promise<NextFundingData> {
    const cacheKey = 'next_funding';
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log('📦 LN MARKETS OPTIMIZED - Next funding cache hit:', {
        age: Date.now() - cached.timestamp + 'ms',
        ttl: cached.ttl + 'ms'
      });
      return cached.data;
    }

    console.log('🔄 LN MARKETS OPTIMIZED - Fetching next funding...');
    
    try {
      await this.rateLimit();
      
      // Buscar dados de instrumentos para obter next funding
      const instrumentData = await this.lnMarketsAPI.futures.getMarketInfo();
      
      const nextFundingData: NextFundingData = {
        nextFunding: instrumentData.nextFunding || 'Calculating...',
        timestamp: Date.now(),
        source: `lnmarkets-${this.isTestnet ? 'testnet' : 'mainnet'}`
      };

      // Cache por 1 minuto
      this.cache.set(cacheKey, {
        data: nextFundingData,
        timestamp: Date.now(),
        ttl: this.TTL_FUNDING
      });

      console.log('✅ LN MARKETS OPTIMIZED - Next funding fetched:', {
        nextFunding: nextFundingData.nextFunding,
        source: nextFundingData.source,
        isTestnet: this.isTestnet
      });

      return nextFundingData;

    } catch (error: any) {
      console.error('❌ LN MARKETS OPTIMIZED - Next funding error:', error);
      throw new Error(`Failed to fetch next funding: ${error.message}`);
    }
  }

  /**
   * Obter rate com cache 30s
   */
  async getRate(): Promise<RateData> {
    const cacheKey = 'rate';
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log('📦 LN MARKETS OPTIMIZED - Rate cache hit:', {
        age: Date.now() - cached.timestamp + 'ms',
        ttl: cached.ttl + 'ms'
      });
      return cached.data;
    }

    console.log('🔄 LN MARKETS OPTIMIZED - Fetching rate...');
    
    try {
      await this.rateLimit();
      
      // Buscar dados de ticker para obter rate
      const tickerData = await this.lnMarketsAPI.market.getTicker();
      
      const rateData: RateData = {
        rate: tickerData.carryFeeRate || 0.00006, // Fallback padrão
        rateChange: 0.00001, // TODO: Calcular mudança real
        timestamp: Date.now(),
        source: `lnmarkets-${this.isTestnet ? 'testnet' : 'mainnet'}`
      };

      // Validar dados
      const validation = MarketDataValidator.validateLNMarketsData({
        index: 0, // Não usado para rate
        tradingFees: 0, // Não usado para rate
        nextFunding: '', // Não usado para rate
        rate: rateData.rate,
        timestamp: rateData.timestamp
      });

      if (!validation.valid) {
        throw new Error(`Rate validation failed: ${validation.reason}`);
      }

      // Cache por 30 segundos
      this.cache.set(cacheKey, {
        data: rateData,
        timestamp: Date.now(),
        ttl: this.TTL_RATE
      });

      console.log('✅ LN MARKETS OPTIMIZED - Rate fetched:', {
        rate: rateData.rate,
        rateChange: rateData.rateChange,
        source: rateData.source,
        isTestnet: this.isTestnet
      });

      return rateData;

    } catch (error: any) {
      console.error('❌ LN MARKETS OPTIMIZED - Rate error:', error);
      throw new Error(`Failed to fetch rate: ${error.message}`);
    }
  }

  /**
   * Obter todos os dados específicos da LN Markets
   */
  async getSpecificData(): Promise<{
    tradingFees: TradingFeesData;
    nextFunding: NextFundingData;
    rate: RateData;
  }> {
    console.log('🔄 LN MARKETS OPTIMIZED - Fetching all specific data...');
    
    try {
      // Buscar todos os dados em paralelo para otimizar performance
      const [tradingFees, nextFunding, rate] = await Promise.all([
        this.getTradingFees(),
        this.getNextFunding(),
        this.getRate()
      ]);

      console.log('✅ LN MARKETS OPTIMIZED - All specific data fetched:', {
        tradingFees: tradingFees.tradingFees,
        nextFunding: nextFunding.nextFunding,
        rate: rate.rate,
        isTestnet: this.isTestnet,
        sources: {
          tradingFees: tradingFees.source,
          nextFunding: nextFunding.source,
          rate: rate.source
        }
      });

      return {
        tradingFees,
        nextFunding,
        rate
      };

    } catch (error: any) {
      console.error('❌ LN MARKETS OPTIMIZED - Error fetching specific data:', error);
      throw new Error(`Failed to fetch LN Markets specific data: ${error.message}`);
    }
  }

  /**
   * Rate limiting para respeitar limites da LN Markets
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT) {
      const waitTime = this.RATE_LIMIT - timeSinceLastRequest;
      console.log(`⏳ LN MARKETS OPTIMIZED - Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Validar se cache é válido
   */
  private isCacheValid(cached: CachedData): boolean {
    const age = Date.now() - cached.timestamp;
    return age <= cached.ttl;
  }

  /**
   * Limpar cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 LN MARKETS OPTIMIZED - Cache cleared');
  }

  /**
   * Obter estatísticas do cache
   */
  getCacheStats(): {
    size: number;
    keys: string[];
    entries: Array<{
      key: string;
      age: number;
      ttl: number;
      valid: boolean;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, cached]) => ({
      key,
      age: now - cached.timestamp,
      ttl: cached.ttl,
      valid: this.isCacheValid(cached)
    }));

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      entries
    };
  }

  /**
   * Obter informações de debug
   */
  getDebugInfo(): {
    isTestnet: boolean;
    credentials: {
      hasApiKey: boolean;
      hasApiSecret: boolean;
      hasPassphrase: boolean;
    };
    cacheStats: ReturnType<typeof this.getCacheStats>;
    lastRequestTime: number;
  } {
    return {
      isTestnet: this.isTestnet,
      credentials: {
        hasApiKey: !!this.credentials.apiKey,
        hasApiSecret: !!this.credentials.apiSecret,
        hasPassphrase: !!this.credentials.passphrase
      },
      cacheStats: this.getCacheStats(),
      lastRequestTime: this.lastRequestTime
    };
  }
}
