/**
 * LN Markets API v2 - Serviço Principal Centralizado (Enhanced)
 * 
 * Versão consolidada que integra todas as funcionalidades dos serviços duplicados:
 * - Circuit breaker do LNMarketsRobustService
 * - Retry logic do LNMarketsFallbackService  
 * - Cache inteligente do LNMarketsOptimizedService
 * - Rate limiting e validação rigorosa
 * - Dashboard data unificado
 * 
 * Funcionalidades integradas:
 * ✅ Autenticação robusta com formato configurável
 * ✅ Circuit breaker integrado
 * ✅ Retry logic com backoff exponencial
 * ✅ Cache diferenciado por tipo de dado
 * ✅ Testnet detection automático
 * ✅ Rate limiting inteligente (1 req/sec)
 * ✅ Validação rigorosa de dados
 * ✅ Dashboard data unificado
 */

import { Logger } from 'winston';
import { LNMarketsClient, LNMarketsCredentials, LNMarketsConfig } from './LNMarketsClient';
import { LNMarketsUserEndpoints } from './endpoints/user.endpoints';
import { LNMarketsFuturesEndpoints } from './endpoints/futures.endpoints';
import { LNMarketsMarketEndpoints } from './endpoints/market.endpoints';
import { CircuitBreaker } from '../circuit-breaker.service';
import { RetryService } from '../retry.service';
import { TestnetDetector } from '../../utils/testnet-detector';
import { MarketDataValidator } from '../../utils/market-data-validator';

// Re-export types for convenience
export * from './types/user.types';
export * from './types/futures.types';
export * from './types/market.types';

export { LNMarketsCredentials } from './LNMarketsClient';

// 🎯 CONFIGURAÇÃO: Formato de assinatura (alterar aqui se a API mudar)
const SIGNATURE_FORMAT: 'base64' | 'hex' = 'base64'; // Sistema original que funcionava

// Interface para dados de dashboard unificado
export interface LNMarketsDashboardData {
  user: any;
  balance: any;
  positions: any[];
  market: any;
  deposits: any[];
  withdrawals: any[];
  trades: any[];
  orders: any[];
  metadata: {
    lastUpdate: number;
    isTestnet: boolean;
    cacheHit: boolean;
    source: string;
  };
}

// Interface para cache diferenciado
interface CachedData {
  data: any;
  timestamp: number;
  ttl: number;
}

/**
 * LN Markets API v2 Enhanced Service
 * 
 * Serviço centralizado consolidado com todas as funcionalidades dos serviços duplicados.
 * 
 * @example
 * ```typescript
 * const api = new LNMarketsAPIv2Enhanced({
 *   credentials: {
 *     apiKey: 'your-api-key',
 *     apiSecret: 'your-api-secret',
 *     passphrase: 'your-passphrase'
 *   },
 *   logger: winstonLogger
 * });
 * 
 * // Get dashboard data (todos os dados em uma requisição)
 * const dashboard = await api.getDashboardData();
 * console.log('Dashboard:', dashboard);
 * 
 * // Get market data with cache
 * const market = await api.getMarketData();
 * console.log('Market:', market);
 * ```
 */
export class LNMarketsAPI {
  public readonly user: LNMarketsUserEndpoints;
  public readonly futures: LNMarketsFuturesEndpoints;
  public readonly market: LNMarketsMarketEndpoints;

  private client: LNMarketsClient;
  private logger: Logger;
  private circuitBreaker: CircuitBreaker;
  private retryService: RetryService;
  private cache = new Map<string, CachedData>();
  private isTestnet: boolean;
  
  // Cache TTL diferenciado conforme _VOLATILE_MARKET_SAFETY.md
  private readonly TTL_RATE = 30 * 1000;      // 30 segundos para rate
  private readonly TTL_FUNDING = 60 * 1000;   // 1 minuto para funding
  private readonly TTL_FEES = 5 * 60 * 1000;  // 5 minutos para fees
  private readonly TTL_MARKET = 30 * 1000;     // 30 segundos para market data
  
  // Rate limiting
  private lastRequestTime = 0;
  private readonly RATE_LIMIT = 1000; // 1 req/sec

  constructor(config: LNMarketsConfig) {
    this.logger = config.logger;
    
    // Detectar testnet automaticamente
    const testnetResult = TestnetDetector.detectTestnet(config.credentials);
    this.isTestnet = testnetResult.isTestnet;
    
    console.log('🚀 LN MARKETS API v2 ENHANCED - Initializing:', {
      isTestnet: this.isTestnet,
      reason: testnetResult.reason,
      confidence: testnetResult.confidence,
      signatureFormat: SIGNATURE_FORMAT
    });

    // Initialize circuit breaker
    this.circuitBreaker = new CircuitBreaker({ 
      failureThreshold: 5, 
      recoveryTimeout: 60000,
      monitoringPeriod: 60000
    });
    
    // Initialize retry service
    this.retryService = new RetryService({
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    });

    // Initialize HTTP client with testnet detection
    this.client = new LNMarketsClient({
      ...config,
      credentials: {
        ...config.credentials,
        isTestnet: this.isTestnet
      }
    });
    
    // Initialize endpoint modules
    this.user = new LNMarketsUserEndpoints(this.client);
    this.futures = new LNMarketsFuturesEndpoints(this.client);
    this.market = new LNMarketsMarketEndpoints(this.client);

    this.logger.info('🚀 LN Markets API v2 Enhanced Service initialized', {
      baseURL: config.baseURL || (this.isTestnet 
        ? 'https://api.testnet4.lnmarkets.com/v2' 
        : 'https://api.lnmarkets.com/v2'),
      isTestnet: this.isTestnet,
      signatureFormat: SIGNATURE_FORMAT
    });
  }

  /**
   * Get dashboard data unificado (todos os dados em uma requisição)
   * Integra funcionalidade do LNMarketsRobustService
   */
  async getDashboardData(): Promise<LNMarketsDashboardData> {
    const cacheKey = 'dashboard_data';
    const cached = this.cache.get(cacheKey);
    
    // Cache de 30 segundos para dashboard data
    if (cached && this.isCacheValid(cached)) {
      console.log('📦 LN MARKETS ENHANCED - Dashboard cache hit');
      return {
        ...cached.data,
        metadata: {
          ...cached.data.metadata,
          cacheHit: true
        }
      };
    }

    console.log('🔄 LN MARKETS ENHANCED - Fetching dashboard data...');
    
    try {
      // Verificar circuit breaker
      if (this.circuitBreaker.isOpen()) {
        throw new Error('Circuit breaker is open');
      }

      // Rate limiting
      await this.rateLimit();

      // Executar com retry automático
      const result = await this.retryService.execute(async () => {
        // Buscar todos os dados em paralelo
        const [userData, balance, positions, marketData, deposits, withdrawals, trades, orders] = await Promise.all([
          this.user.getUser(),
          this.user.getBalance(),
          this.futures.getRunningPositions(),
          this.market.getTicker(),
          this.user.getDeposits(),
          this.user.getWithdrawals(),
          this.futures.getTrades(),
          this.futures.getOrders()
        ]);

        return {
          user: userData,
          balance,
          positions,
          market: marketData,
          deposits,
          withdrawals,
          trades,
          orders,
          metadata: {
            lastUpdate: Date.now(),
            isTestnet: this.isTestnet,
            cacheHit: false,
            source: 'lnmarkets-api-enhanced'
          }
        };
      });

      // Validar dados
      this.validateDashboardData(result);

      // Cache por 30 segundos
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: this.TTL_MARKET
      });

      this.circuitBreaker.recordSuccess();
      console.log('✅ LN MARKETS ENHANCED - Dashboard data fetched successfully');
      
      return result;

    } catch (error: any) {
      this.circuitBreaker.recordFailure();
      this.logger.error('❌ LN MARKETS ENHANCED - Dashboard data failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get market data with cache inteligente
   * Integra funcionalidade do LNMarketsOptimizedService
   */
  async getMarketData(): Promise<any> {
    const cacheKey = 'market_data';
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log('📦 LN MARKETS ENHANCED - Market data cache hit');
      return cached.data;
    }

    console.log('🔄 LN MARKETS ENHANCED - Fetching market data...');
    
    try {
      // Verificar circuit breaker
      if (this.circuitBreaker.isOpen()) {
        throw new Error('Circuit breaker is open');
      }

      // Rate limiting
      await this.rateLimit();

      // Executar com retry automático
      const result = await this.retryService.execute(async () => {
        return await this.market.getTicker();
      });

      // Validar dados
      const validationResult = MarketDataValidator.validateMarketData(result);
      if (!validationResult.isValid) {
        throw new Error(`Invalid market data: ${validationResult.errors.join(', ')}`);
      }

      // Cache por 30 segundos
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: this.TTL_MARKET
      });

      this.circuitBreaker.recordSuccess();
      console.log('✅ LN MARKETS ENHANCED - Market data fetched successfully');
      
      return result;

    } catch (error: any) {
      this.circuitBreaker.recordFailure();
      this.logger.error('❌ LN MARKETS ENHANCED - Market data failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get trading fees with cache 5min
   * Integra funcionalidade do LNMarketsOptimizedService
   */
  async getTradingFees(): Promise<any> {
    const cacheKey = 'trading_fees';
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log('📦 LN MARKETS ENHANCED - Trading fees cache hit');
      return cached.data;
    }

    console.log('🔄 LN MARKETS ENHANCED - Fetching trading fees...');
    
    try {
      // Rate limiting
      await this.rateLimit();

      // Executar com retry automático
      const result = await this.retryService.execute(async () => {
        return await this.user.getTradingFees();
      });

      // Cache por 5 minutos
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: this.TTL_FEES
      });

      console.log('✅ LN MARKETS ENHANCED - Trading fees fetched successfully');
      
      return result;

    } catch (error: any) {
      this.logger.error('❌ LN MARKETS ENHANCED - Trading fees failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get next funding with cache 1min
   * Integra funcionalidade do LNMarketsOptimizedService
   */
  async getNextFunding(): Promise<any> {
    const cacheKey = 'next_funding';
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log('📦 LN MARKETS ENHANCED - Next funding cache hit');
      return cached.data;
    }

    console.log('🔄 LN MARKETS ENHANCED - Fetching next funding...');
    
    try {
      // Rate limiting
      await this.rateLimit();

      // Executar com retry automático
      const result = await this.retryService.execute(async () => {
        return await this.futures.getNextFunding();
      });

      // Cache por 1 minuto
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: this.TTL_FUNDING
      });

      console.log('✅ LN MARKETS ENHANCED - Next funding fetched successfully');
      
      return result;

    } catch (error: any) {
      this.logger.error('❌ LN MARKETS ENHANCED - Next funding failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get rate with cache 30s
   * Integra funcionalidade do LNMarketsOptimizedService
   */
  async getRate(): Promise<any> {
    const cacheKey = 'rate';
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached)) {
      console.log('📦 LN MARKETS ENHANCED - Rate cache hit');
      return cached.data;
    }

    console.log('🔄 LN MARKETS ENHANCED - Fetching rate...');
    
    try {
      // Rate limiting
      await this.rateLimit();

      // Executar com retry automático
      const result = await this.retryService.execute(async () => {
        return await this.market.getRate();
      });

      // Cache por 30 segundos
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: this.TTL_RATE
      });

      console.log('✅ LN MARKETS ENHANCED - Rate fetched successfully');
      
      return result;

    } catch (error: any) {
      this.logger.error('❌ LN MARKETS ENHANCED - Rate failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Rate limiting inteligente (1 req/sec)
   * Integra funcionalidade do LNMarketsOptimizedService
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT) {
      const waitTime = this.RATE_LIMIT - timeSinceLastRequest;
      console.log(`⏳ LN MARKETS ENHANCED - Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Verificar se cache é válido
   * Integra funcionalidade do LNMarketsOptimizedService
   */
  private isCacheValid(cached: CachedData): boolean {
    return Date.now() - cached.timestamp < cached.ttl;
  }

  /**
   * Validar dados de dashboard
   * Integra funcionalidade do LNMarketsOptimizedService
   */
  private validateDashboardData(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid dashboard data format');
    }

    const requiredFields = ['user', 'balance', 'positions', 'market'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    console.log('✅ LN MARKETS ENHANCED - Dashboard data validation passed');
  }

  /**
   * Get client statistics
   * @returns Request statistics and configuration
   */
  getStats() {
    return {
      ...this.client.getStats(),
      circuitBreaker: {
        isOpen: this.circuitBreaker.isOpen(),
        failureCount: this.circuitBreaker.getFailureCount(),
        lastFailureTime: this.circuitBreaker.getLastFailureTime()
      },
      cache: {
        size: this.cache.size,
        keys: Array.from(this.cache.keys())
      },
      rateLimiting: {
        lastRequestTime: this.lastRequestTime,
        timeSinceLastRequest: Date.now() - this.lastRequestTime
      },
      testnet: {
        isTestnet: this.isTestnet,
        signatureFormat: SIGNATURE_FORMAT
      }
    };
  }

  /**
   * Test connection to LN Markets API
   * @returns Promise<boolean> - true if connection successful
   */
  async testConnection(): Promise<boolean> {
    try {
      this.logger.info('🧪 Testing LN Markets API Enhanced connection...');
      
      // Try to get market info (public endpoint, no auth required)
      await this.market.getTicker();
      
      this.logger.info('✅ LN Markets API Enhanced connection successful');
      return true;
    } catch (error: any) {
      this.logger.error('❌ LN Markets API Enhanced connection failed', { error: error.message });
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.cache.clear();
    this.logger.info('🧹 LN Markets API Enhanced cleanup completed');
  }
}
