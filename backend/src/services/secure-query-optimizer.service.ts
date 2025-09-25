import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

interface QueryOptimizationConfig {
  maxCacheAge: number; // em milissegundos
  enableMarketDataCache: boolean;
  marketDataMaxAge: number; // 30 segundos para dados de mercado
  enableHistoricalDataCache: boolean;
  historicalDataMaxAge: number; // 10 minutos para dados históricos
  enableUserDataCache: boolean;
  userDataMaxAge: number; // 5 minutos para dados de usuário
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  dataType: 'market' | 'historical' | 'user' | 'system';
}

interface QueryMetrics {
  query: string;
  executionTime: number;
  cacheHit: boolean;
  dataType: string;
  timestamp: Date;
}

/**
 * Serviço de otimização de queries com segurança rigorosa para mercados voláteis
 * 
 * ⚠️ PRINCÍPIOS CRÍTICOS:
 * - Dados de mercado: cache máximo 30 segundos
 * - Dados históricos: cache até 10 minutos
 * - Dados de usuário: cache até 5 minutos
 * - NUNCA usar dados antigos de mercado
 * - Validação rigorosa de timestamps
 */
export class SecureQueryOptimizerService {
  private prisma: PrismaClient;
  private logger: Logger;
  private cache = new Map<string, CacheEntry<any>>();
  private config: QueryOptimizationConfig;
  private queryMetrics: QueryMetrics[] = [];

  constructor(prisma: PrismaClient, logger: Logger, config: Partial<QueryOptimizationConfig> = {}) {
    this.prisma = prisma;
    this.logger = logger;
    this.config = {
      maxCacheAge: 300000, // 5 minutos padrão
      enableMarketDataCache: true,
      marketDataMaxAge: 30000, // 30 segundos - CRÍTICO
      enableHistoricalDataCache: true,
      historicalDataMaxAge: 600000, // 10 minutos
      enableUserDataCache: true,
      userDataMaxAge: 300000, // 5 minutos
      ...config
    };
  }

  /**
   * Executa query com cache inteligente baseado no tipo de dados
   */
  async executeQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    dataType: 'market' | 'historical' | 'user' | 'system' = 'system'
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Verificar se cache é apropriado para este tipo de dados
      if (!this.shouldUseCache(dataType)) {
        this.logger.debug(`Cache disabled for data type: ${dataType}`);
        const result = await queryFn();
        this.recordQueryMetrics(key, Date.now() - startTime, false, dataType);
        return result;
      }

      // Verificar cache existente
      const cached = this.cache.get(key);
      if (cached && this.isCacheValid(cached, dataType)) {
        this.logger.debug(`Cache hit for ${dataType} data`, { key, dataType });
        this.recordQueryMetrics(key, Date.now() - startTime, true, dataType);
        return cached.data;
      }

      // Cache miss ou expirado - executar query
      this.logger.debug(`Cache miss for ${dataType} data`, { key, dataType });
      const result = await queryFn();
      
      // Armazenar no cache com TTL apropriado
      this.cache.set(key, {
        data: result,
        timestamp: Date.now(),
        ttl: this.getTTLForDataType(dataType),
        dataType
      });

      this.recordQueryMetrics(key, Date.now() - startTime, false, dataType);
      return result;

    } catch (error) {
      this.logger.error(`Query execution failed for ${dataType} data`, {
        key,
        dataType,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Obtém dados de mercado com segurança rigorosa
   * ⚠️ Cache máximo de 30 segundos
   */
  async getMarketData<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    return this.executeQuery(key, queryFn, 'market');
  }

  /**
   * Obtém dados históricos (pode ser cacheados por mais tempo)
   */
  async getHistoricalData<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    return this.executeQuery(key, queryFn, 'historical');
  }

  /**
   * Obtém dados de usuário (cache moderado)
   */
  async getUserData<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    return this.executeQuery(key, queryFn, 'user');
  }

  /**
   * Obtém dados do sistema (cache padrão)
   */
  async getSystemData<T>(key: string, queryFn: () => Promise<T>): Promise<T> {
    return this.executeQuery(key, queryFn, 'system');
  }

  /**
   * Invalida cache por tipo de dados
   */
  invalidateByDataType(dataType: 'market' | 'historical' | 'user' | 'system'): number {
    let invalidated = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.dataType === dataType) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    this.logger.info(`Cache invalidated for data type: ${dataType}`, {
      dataType,
      invalidated,
      remainingSize: this.cache.size
    });

    return invalidated;
  }

  /**
   * Invalida cache de dados de mercado (crítico para segurança)
   */
  invalidateMarketData(): number {
    this.logger.warn('Market data cache invalidated - forcing fresh data');
    return this.invalidateByDataType('market');
  }

  /**
   * Invalida cache por padrão
   */
  invalidatePattern(pattern: string): number {
    let invalidated = 0;
    const regex = new RegExp(pattern);

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    this.logger.info(`Cache pattern invalidated: ${pattern}`, {
      pattern,
      invalidated,
      remainingSize: this.cache.size
    });

    return invalidated;
  }

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    const size = this.cache.size;
    this.cache.clear();
    
    this.logger.info('All cache cleared', { clearedEntries: size });
  }

  /**
   * Obtém estatísticas do cache
   */
  getCacheStats(): {
    totalEntries: number;
    entriesByType: Record<string, number>;
    averageAge: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entriesByType: Record<string, number> = {};
    let totalAge = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;

    for (const entry of this.cache.values()) {
      entriesByType[entry.dataType] = (entriesByType[entry.dataType] || 0) + 1;
      
      const age = Date.now() - entry.timestamp;
      totalAge += age;
      
      if (entry.timestamp < oldestEntry) {
        oldestEntry = entry.timestamp;
      }
      
      if (entry.timestamp > newestEntry) {
        newestEntry = entry.timestamp;
      }
    }

    return {
      totalEntries: this.cache.size,
      entriesByType,
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
      oldestEntry: Date.now() - oldestEntry,
      newestEntry: Date.now() - newestEntry
    };
  }

  /**
   * Obtém métricas de performance
   */
  getQueryMetrics(): {
    totalQueries: number;
    averageExecutionTime: number;
    cacheHitRate: number;
    queriesByType: Record<string, number>;
    slowQueries: QueryMetrics[];
  } {
    const totalQueries = this.queryMetrics.length;
    const cacheHits = this.queryMetrics.filter(q => q.cacheHit).length;
    const cacheHitRate = totalQueries > 0 ? cacheHits / totalQueries : 0;
    
    const averageExecutionTime = totalQueries > 0 
      ? this.queryMetrics.reduce((sum, q) => sum + q.executionTime, 0) / totalQueries 
      : 0;

    const queriesByType: Record<string, number> = {};
    for (const query of this.queryMetrics) {
      queriesByType[query.dataType] = (queriesByType[query.dataType] || 0) + 1;
    }

    const slowQueries = this.queryMetrics.filter(q => q.executionTime > 1000);

    return {
      totalQueries,
      averageExecutionTime,
      cacheHitRate,
      queriesByType,
      slowQueries
    };
  }

  /**
   * Verifica se cache deve ser usado para este tipo de dados
   */
  private shouldUseCache(dataType: string): boolean {
    switch (dataType) {
      case 'market':
        return this.config.enableMarketDataCache;
      case 'historical':
        return this.config.enableHistoricalDataCache;
      case 'user':
        return this.config.enableUserDataCache;
      case 'system':
        return true;
      default:
        return false;
    }
  }

  /**
   * Verifica se cache é válido baseado no tipo de dados
   */
  private isCacheValid(entry: CacheEntry<any>, dataType: string): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    
    // Para dados de mercado, validação extra rigorosa
    if (dataType === 'market') {
      if (age > this.config.marketDataMaxAge) {
        this.logger.warn('Market data cache expired - too old for volatile markets', {
          age,
          maxAge: this.config.marketDataMaxAge
        });
        return false;
      }
    }

    return age < entry.ttl;
  }

  /**
   * Obtém TTL apropriado para tipo de dados
   */
  private getTTLForDataType(dataType: string): number {
    switch (dataType) {
      case 'market':
        return this.config.marketDataMaxAge; // 30 segundos
      case 'historical':
        return this.config.historicalDataMaxAge; // 10 minutos
      case 'user':
        return this.config.userDataMaxAge; // 5 minutos
      case 'system':
        return this.config.maxCacheAge; // 5 minutos
      default:
        return 300000; // 5 minutos padrão
    }
  }

  /**
   * Registra métricas de query
   */
  private recordQueryMetrics(
    query: string, 
    executionTime: number, 
    cacheHit: boolean, 
    dataType: string
  ): void {
    const metrics: QueryMetrics = {
      query,
      executionTime,
      cacheHit,
      dataType,
      timestamp: new Date()
    };

    this.queryMetrics.push(metrics);

    // Manter apenas os últimos 1000 registros
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }

    // Log de queries lentas
    if (executionTime > 1000) {
      this.logger.warn('Slow query detected', {
        query: query.substring(0, 100),
        executionTime,
        dataType,
        cacheHit
      });
    }
  }

  /**
   * Limpa métricas antigas
   */
  cleanupOldMetrics(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const beforeCount = this.queryMetrics.length;
    
    this.queryMetrics = this.queryMetrics.filter(q => q.timestamp > cutoffTime);
    
    const removedCount = beforeCount - this.queryMetrics.length;
    
    if (removedCount > 0) {
      this.logger.info('Cleaned up old query metrics', {
        removedCount,
        remainingCount: this.queryMetrics.length
      });
    }
  }

  /**
   * Executa limpeza automática de cache expirado
   */
  cleanupExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp >= entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.info('Cleaned up expired cache entries', {
        cleaned,
        remainingSize: this.cache.size
      });
    }
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): QueryOptimizationConfig {
    return { ...this.config };
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<QueryOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    this.logger.info('Query optimization config updated', {
      newConfig,
      fullConfig: this.config
    });
  }
}
