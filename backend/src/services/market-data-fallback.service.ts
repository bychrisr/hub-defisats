/**
 * Market Data Fallback Service
 * 
 * Sistema crítico de fallback para dados de mercado
 * Seguindo princípios de VOLATILE_MARKET_SAFETY.md
 */

import axios, { AxiosInstance } from 'axios';
import { createHmac } from 'crypto';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { CircuitBreaker } from './circuit-breaker.service';

interface MarketDataProvider {
  name: string;
  priority: number; // 1 = mais prioritário
  baseURL: string;
  endpoints: {
    marketData: string;
    health: string;
  };
  timeout: number;
  requiresAuth: boolean;
  authConfig?: {
    apiKey: string;
    apiSecret: string;
    passphrase: string;
  };
  circuitBreaker: CircuitBreaker;
  client: AxiosInstance;
}

interface MarketData {
  index: number;
  change24h: number;
  timestamp: number;
  provider: string;
  source: 'primary' | 'fallback' | 'emergency';
}

interface FallbackConfig {
  maxCacheAge: number; // 30 segundos máximo
  retryAttempts: number;
  fallbackTimeout: number;
  emergencyProviders: string[];
}

export class MarketDataFallbackService {
  private providers: Map<string, MarketDataProvider> = new Map();
  private config: FallbackConfig;
  private cache: {
    data: MarketData | null;
    timestamp: number;
  } = { data: null, timestamp: 0 };

  constructor() {
    this.config = {
      maxCacheAge: 30 * 1000, // 30 segundos - conforme VOLATILE_MARKET_SAFETY.md
      retryAttempts: 3,
      fallbackTimeout: 5000, // 5 segundos para fallback
      emergencyProviders: ['binance'] // CoinGecko removido temporariamente
    };

    this.initializeProviders();
  }

  private initializeProviders() {
    // 1. LN Markets (Primary) - mas com circuit breaker agressivo
    this.addProvider({
      name: 'lnMarkets',
      priority: 1,
      baseURL: 'https://api.lnmarkets.com',
      endpoints: {
        marketData: '/v1/market',
        health: '/v1/status'
      },
      timeout: 3000, // Timeout agressivo
      requiresAuth: true,
      authConfig: {
        apiKey: config.LN_MARKETS_API_KEY || '',
        apiSecret: config.LN_MARKETS_API_SECRET || '',
        passphrase: config.LN_MARKETS_PASSPHRASE || ''
      },
      circuitBreaker: new CircuitBreaker({
        failureThreshold: 2, // Falha após 2 tentativas
        recoveryTimeout: 60000, // 1 minuto de recuperação
        monitoringPeriod: 30000
      })
    });

    // 2. Binance (Fallback) - Prioridade aumentada
    this.addProvider({
      name: 'binance',
      priority: 2,
      baseURL: 'https://api.binance.com',
      endpoints: {
        marketData: '/api/v3/ticker/24hr?symbol=BTCUSDT',
        health: '/api/v3/ping'
      },
      timeout: 5000,
      requiresAuth: false,
      circuitBreaker: new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 30000,
        monitoringPeriod: 30000
      })
    });

    // 3. CoinGecko (Temporariamente desativado)
    // TODO: Reativar quando necessário
    /*
    this.addProvider({
      name: 'coinGecko',
      priority: 3,
      baseURL: 'https://api.coingecko.com',
      endpoints: {
        marketData: '/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true',
        health: '/api/v3/ping'
      },
      timeout: 5000,
      requiresAuth: false,
      circuitBreaker: new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 30000,
        monitoringPeriod: 30000
      })
    });
    */
  }

  private addProvider(config: Omit<MarketDataProvider, 'circuitBreaker' | 'client'>) {
    const client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hub-DefiSats-Fallback/1.0'
      }
    });

    const provider: MarketDataProvider = {
      ...config,
      circuitBreaker: config.circuitBreaker,
      client
    };

    this.providers.set(config.name, provider);
  }

  /**
   * Obter dados de mercado com fallback automático
   * Seguindo princípios de VOLATILE_MARKET_SAFETY.md
   */
  async getMarketData(): Promise<{
    success: boolean;
    data?: MarketData;
    error?: string;
    source: 'primary' | 'fallback' | 'emergency' | 'cache' | 'unavailable';
  }> {
    // 1. Verificar cache válido (máximo 30 segundos)
    if (this.isCacheValid()) {
      logger.info('Using valid cache for market data', {
        age: Date.now() - this.cache.timestamp,
        provider: this.cache.data?.provider
      });
      return {
        success: true,
        data: this.cache.data!,
        source: 'cache'
      };
    }

    // 2. Tentar provedores em ordem de prioridade
    const sortedProviders = Array.from(this.providers.values())
      .sort((a, b) => a.priority - b.priority);

    for (const provider of sortedProviders) {
      try {
        const result = await this.tryProvider(provider);
        if (result.success && result.data) {
          // Cache apenas dados válidos e recentes
          this.cache = {
            data: result.data,
            timestamp: Date.now()
          };

          logger.info('Market data obtained successfully', {
            provider: provider.name,
            source: result.data.source,
            latency: Date.now() - result.data.timestamp
          });

          return result;
        }
      } catch (error: any) {
        logger.warn('Provider failed, trying next', {
          provider: provider.name,
          error: error.message
        });
        continue;
      }
    }

    // 3. Todos os provedores falharam
    logger.error('All market data providers failed', {
      providers: Array.from(this.providers.keys())
    });

    return {
      success: false,
      error: 'SERVICE_UNAVAILABLE',
      source: 'unavailable'
    };
  }

  /**
   * Tentar obter dados de um provedor específico
   */
  private async tryProvider(provider: MarketDataProvider): Promise<{
    success: boolean;
    data?: MarketData;
    error?: string;
  }> {
    try {
      const data = await provider.circuitBreaker.execute(async () => {
        return await this.fetchMarketData(provider);
      });

      return {
        success: true,
        data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Buscar dados de mercado de um provedor específico
   */
  private async fetchMarketData(provider: MarketDataProvider): Promise<MarketData> {
    const startTime = Date.now();

    // Preparar requisição
    const requestConfig: any = {
      timeout: provider.timeout
    };

    // Adicionar autenticação se necessário
    if (provider.requiresAuth && provider.authConfig) {
      const authHeaders = this.generateAuthHeaders(
        'GET',
        provider.endpoints.marketData,
        provider.authConfig
      );
      requestConfig.headers = { ...requestConfig.headers, ...authHeaders };
    }

    // Fazer requisição
    const response = await provider.client.get(
      provider.endpoints.marketData,
      requestConfig
    );

    // Processar resposta baseada no provedor
    const marketData = this.processProviderResponse(provider.name, response.data);
    
    // Validar dados
    this.validateMarketData(marketData);

    return {
      ...marketData,
      timestamp: startTime,
      provider: provider.name,
      source: provider.priority === 1 ? 'primary' : 
              provider.priority === 2 ? 'fallback' : 'emergency'
    };
  }

  /**
   * Processar resposta baseada no provedor
   */
  private processProviderResponse(providerName: string, data: any): Omit<MarketData, 'timestamp' | 'provider' | 'source'> {
    switch (providerName) {
      case 'lnMarkets':
        return {
          index: data.index || 0,
          change24h: data.change24h || 0
        };

      case 'coinGecko':
        const btc = data.bitcoin;
        return {
          index: btc.usd || 0,
          change24h: btc.usd_24h_change || 0
        };

      case 'binance':
        return {
          index: parseFloat(data.lastPrice) || 0,
          change24h: parseFloat(data.priceChangePercent) || 0
        };

      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }

  /**
   * Validar dados de mercado
   */
  private validateMarketData(data: Omit<MarketData, 'timestamp' | 'provider' | 'source'>): void {
    if (!data.index || data.index <= 0) {
      throw new Error('Invalid market index');
    }

    if (typeof data.change24h !== 'number') {
      throw new Error('Invalid change24h value');
    }

    // Validações específicas para Bitcoin
    if (data.index < 1000 || data.index > 200000) {
      throw new Error('Market index out of reasonable range');
    }
  }

  /**
   * Verificar se cache é válido (máximo 30 segundos)
   */
  private isCacheValid(): boolean {
    if (!this.cache.data) return false;
    
    const age = Date.now() - this.cache.timestamp;
    return age <= this.config.maxCacheAge;
  }

  /**
   * Gerar headers de autenticação para LN Markets
   */
  private generateAuthHeaders(method: string, path: string, authConfig: any): any {
    const timestamp = Date.now().toString();
    const body = '';
    const message = timestamp + method.toUpperCase() + path + body;
    
    const signature = createHmac('sha256', authConfig.apiSecret)
      .update(message)
      .digest('base64');

    return {
      'LN-ACCESS-KEY': authConfig.apiKey,
      'LN-ACCESS-SIGNATURE': signature,
      'LN-ACCESS-TIMESTAMP': timestamp,
      'LN-ACCESS-PASSPHRASE': authConfig.passphrase
    };
  }

  /**
   * Resetar circuit breakers de todos os provedores
   */
  resetCircuitBreakers(): Record<string, any> {
    const results: Record<string, any> = {};

    for (const [name, provider] of this.providers) {
      try {
        const previousState = provider.circuitBreaker.getState();
        const previousFailures = provider.circuitBreaker.getFailureCount();
        
        // Reset circuit breaker
        provider.circuitBreaker.reset();
        
        results[name] = {
          success: true,
          previousState,
          previousFailures,
          newState: provider.circuitBreaker.getState(),
          newFailures: provider.circuitBreaker.getFailureCount()
        };
      } catch (error: any) {
        results[name] = {
          success: false,
          error: error.message
        };
      }
    }

    return results;
  }

  /**
   * Forçar atualização do cache
   */
  async forceRefresh(): Promise<{
    success: boolean;
    data?: MarketData;
    error?: string;
  }> {
    this.cache = { data: null, timestamp: 0 };
    return this.getMarketData();
  }

  /**
   * Obter estatísticas de uso dos provedores
   */
  getUsageStats(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    providerStats: Record<string, any>;
  } {
    // Implementar estatísticas detalhadas
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      providerStats: {}
    };
  }
}

export const marketDataFallbackService = new MarketDataFallbackService();
