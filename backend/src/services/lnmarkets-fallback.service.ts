import { LNMarketsAPIv2 } from './lnmarkets/LNMarketsAPIv2.service';
import { CircuitBreaker } from './circuit-breaker.service';
import { RetryService } from './retry.service';
import { Logger } from 'winston';
import axios from 'axios';

export interface FallbackProvider {
  name: string;
  getMarketData: () => Promise<any>;
  getPrice: () => Promise<number>;
  isHealthy: () => Promise<boolean>;
}

export interface LNMarketsFallbackConfig {
  primaryTimeout: number;
  fallbackTimeout: number;
  maxRetries: number;
  circuitBreakerThreshold: number;
  circuitBreakerTimeout: number;
}

export class LNMarketsFallbackService {
  private primaryService: LNMarketsAPIv2;
  private fallbackProviders: FallbackProvider[];
  private circuitBreaker: CircuitBreaker;
  private retryService: RetryService;
  private logger: Logger;
  private config: LNMarketsFallbackConfig;

  constructor(
    credentials: LNMarketsCredentials,
    fallbackProviders: FallbackProvider[],
    logger: Logger,
    config: Partial<LNMarketsFallbackConfig> = {}
  ) {
    this.primaryService = new LNMarketsAPIv2({
      credentials: credentials,
      logger: logger
    });
    this.fallbackProviders = fallbackProviders;
    this.logger = logger;
    
    this.config = {
      primaryTimeout: 5000,
      fallbackTimeout: 3000,
      maxRetries: 3,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 60000,
      ...config
    };

    this.circuitBreaker = new CircuitBreaker(
      this.config.circuitBreakerThreshold,
      this.config.circuitBreakerTimeout
    );

    this.retryService = new RetryService({
      maxRetries: this.config.maxRetries,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2
    });
  }

  /**
   * Get market data with fallback strategy
   */
  async getMarketData(): Promise<any> {
    try {
      // Try primary service first
      if (this.circuitBreaker.isOpen()) {
        this.logger.warn('LN Markets circuit breaker is open, using fallback');
        return await this.tryFallbackProviders('getMarketData');
      }

      const result = await this.retryService.execute(async () => {
        return await Promise.race([
          this.primaryService.getMarketData(),
          this.timeoutPromise(this.config.primaryTimeout, 'Primary service timeout')
        ]);
      });

      this.circuitBreaker.recordSuccess();
      this.logger.info('LN Markets primary service successful');
      return result;

    } catch (error: any) {
      this.circuitBreaker.recordFailure();
      this.logger.error('LN Markets primary service failed', { error: error.message });
      
      // Try fallback providers
      return await this.tryFallbackProviders('getMarketData');
    }
  }

  /**
   * Get user positions with fallback strategy
   */
  async getPositions(): Promise<any[]> {
    try {
      if (this.circuitBreaker.isOpen()) {
        this.logger.warn('LN Markets circuit breaker is open, returning empty positions');
        return [];
      }

      const result = await this.retryService.execute(async () => {
        return await Promise.race([
          this.primaryService.getPositions(),
          this.timeoutPromise(this.config.primaryTimeout, 'Primary service timeout')
        ]);
      });

      this.circuitBreaker.recordSuccess();
      return result;

    } catch (error: any) {
      this.circuitBreaker.recordFailure();
      this.logger.error('LN Markets getPositions failed', { error: error.message });
      
      // For positions, we can't use fallback (user-specific data)
      // Return empty array to prevent system failure
      return [];
    }
  }

  /**
   * Get margin info with fallback strategy
   */
  async getMarginInfo(): Promise<any> {
    try {
      if (this.circuitBreaker.isOpen()) {
        this.logger.warn('LN Markets circuit breaker is open, returning default margin info');
        return this.getDefaultMarginInfo();
      }

      const result = await this.retryService.execute(async () => {
        return await Promise.race([
          this.primaryService.getMarginInfo(),
          this.timeoutPromise(this.config.primaryTimeout, 'Primary service timeout')
        ]);
      });

      this.circuitBreaker.recordSuccess();
      return result;

    } catch (error: any) {
      this.circuitBreaker.recordFailure();
      this.logger.error('LN Markets getMarginInfo failed', { error: error.message });
      
      // Return safe default margin info
      return this.getDefaultMarginInfo();
    }
  }

  /**
   * Try fallback providers for market data
   */
  private async tryFallbackProviders(method: string): Promise<any> {
    for (const provider of this.fallbackProviders) {
      try {
        this.logger.info(`Trying fallback provider: ${provider.name}`);
        
        const isHealthy = await Promise.race([
          provider.isHealthy(),
          this.timeoutPromise(2000, 'Health check timeout')
        ]);

        if (!isHealthy) {
          this.logger.warn(`Fallback provider ${provider.name} is unhealthy`);
          continue;
        }

        const result = await Promise.race([
          provider.getMarketData(),
          this.timeoutPromise(this.config.fallbackTimeout, 'Fallback timeout')
        ]);

        this.logger.info(`Fallback provider ${provider.name} succeeded`);
        return result;

      } catch (error: any) {
        this.logger.error(`Fallback provider ${provider.name} failed`, { error: error.message });
        continue;
      }
    }

    // All fallbacks failed, return default data
    this.logger.error('All fallback providers failed, returning default data');
    return this.getDefaultMarketData();
  }

  /**
   * Create timeout promise
   */
  private timeoutPromise(timeout: number, message: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), timeout);
    });
  }

  /**
   * Get default market data when all providers fail
   */
  private getDefaultMarketData(): any {
    return {
      symbol: 'BTCUSD',
      price: 50000,
      change_24h: 0,
      volume_24h: 0,
      high_24h: 50000,
      low_24h: 50000,
      timestamp: new Date().toISOString(),
      source: 'default',
      warning: 'Using default data - all providers failed'
    };
  }

  /**
   * Get default margin info when primary service fails
   */
  private getDefaultMarginInfo(): any {
    return {
      marginLevel: 1000, // Safe margin level
      marginUsed: 0,
      marginAvailable: 1000,
      unrealizedPnl: 0,
      warning: 'Using default margin info - LN Markets unavailable'
    };
  }

  /**
   * Get circuit breaker status
   */
  getCircuitBreakerStatus(): any {
    return {
      isOpen: this.circuitBreaker.isOpen(),
      failureCount: this.circuitBreaker.getFailureCount(),
      lastFailureTime: this.circuitBreaker.getLastFailureTime(),
      nextRetryTime: this.circuitBreaker.getNextRetryTime()
    };
  }

  /**
   * Get service health status
   */
  async getHealthStatus(): Promise<any> {
    const circuitBreakerStatus = this.getCircuitBreakerStatus();
    
    try {
      // Quick health check
      await Promise.race([
        this.primaryService.getMarketData(),
        this.timeoutPromise(3000, 'Health check timeout')
      ]);

      return {
        status: 'healthy',
        primary: 'available',
        circuitBreaker: circuitBreakerStatus,
        fallbackProviders: this.fallbackProviders.length,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      return {
        status: 'degraded',
        primary: 'unavailable',
        circuitBreaker: circuitBreakerStatus,
        fallbackProviders: this.fallbackProviders.length,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

/**
 * CoinGecko fallback provider
 */
export class CoinGeckoProvider implements FallbackProvider {
  name = 'CoinGecko';
  private baseUrl = 'https://api.coingecko.com/api/v3';

  async getMarketData(): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/simple/price`, {
      params: {
        ids: 'bitcoin',
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_24hr_vol: true
      },
      timeout: 5000
    });

    const btc = response.data.bitcoin;
    return {
      symbol: 'BTCUSD',
      price: btc.usd,
      change_24h: btc.usd_24h_change,
      volume_24h: btc.usd_24h_vol,
      high_24h: btc.usd * 1.05, // Estimate
      low_24h: btc.usd * 0.95,  // Estimate
      timestamp: new Date().toISOString(),
      source: 'coingecko'
    };
  }

  async getPrice(): Promise<number> {
    const data = await this.getMarketData();
    return data.price;
  }

  async isHealthy(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/ping`, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Binance fallback provider
 */
export class BinanceProvider implements FallbackProvider {
  name = 'Binance';
  private baseUrl = 'https://api.binance.com/api/v3';

  async getMarketData(): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/ticker/24hr`, {
      params: { symbol: 'BTCUSDT' },
      timeout: 5000
    });

    const data = response.data;
    return {
      symbol: 'BTCUSD',
      price: parseFloat(data.lastPrice),
      change_24h: parseFloat(data.priceChangePercent),
      volume_24h: parseFloat(data.volume),
      high_24h: parseFloat(data.highPrice),
      low_24h: parseFloat(data.lowPrice),
      timestamp: new Date().toISOString(),
      source: 'binance'
    };
  }

  async getPrice(): Promise<number> {
    const data = await this.getMarketData();
    return data.price;
  }

  async isHealthy(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/ping`, { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }
}
