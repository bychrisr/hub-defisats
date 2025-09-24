import Redis, { RedisOptions } from 'ioredis';
import { prisma } from '../lib/prisma';

export interface CacheStrategy {
  ttl: number; // Time to live in seconds
  prefix: string;
  serialize: boolean;
  fallbackToDB: boolean;
  refreshOnAccess: boolean;
  maxRetries: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
}

export class StrategicCacheService {
  private redis: Redis;
  private isConnected: boolean = false;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: 0,
  };

  // Estratégias de cache por tipo de dados
  private strategies: Record<string, CacheStrategy> = {
    // Cache de dados de usuário - TTL longo, refresh automático
    user: {
      ttl: 1800, // 30 minutos
      prefix: 'user:',
      serialize: true,
      fallbackToDB: true,
      refreshOnAccess: true,
      maxRetries: 3,
    },
    
    // Cache de dados de mercado - TTL curto, alta frequência
    market: {
      ttl: 60, // 1 minuto
      prefix: 'market:',
      serialize: true,
      fallbackToDB: false,
      refreshOnAccess: false,
      maxRetries: 2,
    },
    
    // Cache de posições - TTL médio, refresh condicional
    positions: {
      ttl: 300, // 5 minutos
      prefix: 'positions:',
      serialize: true,
      fallbackToDB: true,
      refreshOnAccess: false,
      maxRetries: 3,
    },
    
    // Cache de configurações - TTL longo, baixa frequência
    config: {
      ttl: 3600, // 1 hora
      prefix: 'config:',
      serialize: true,
      fallbackToDB: true,
      refreshOnAccess: false,
      maxRetries: 2,
    },
    
    // Cache de rate limiting - TTL curto, alta performance
    rateLimit: {
      ttl: 60, // 1 minuto
      prefix: 'ratelimit:',
      serialize: false,
      fallbackToDB: false,
      refreshOnAccess: false,
      maxRetries: 1,
    },
    
    // Cache de sessões - TTL médio, segurança
    session: {
      ttl: 900, // 15 minutos
      prefix: 'session:',
      serialize: true,
      fallbackToDB: true,
      refreshOnAccess: true,
      maxRetries: 3,
    },
    
    // Cache de dados históricos - TTL longo, baixa frequência
    historical: {
      ttl: 7200, // 2 horas
      prefix: 'historical:',
      serialize: true,
      fallbackToDB: true,
      refreshOnAccess: false,
      maxRetries: 2,
    },
  };

  constructor(config?: Partial<RedisOptions>) {
    const defaultConfig: RedisOptions = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: 10000,
      commandTimeout: 5000,
      ...config,
    };

    this.redis = new Redis(defaultConfig);

    this.redis.on('connect', () => {
      console.log('✅ STRATEGIC CACHE - Redis connected successfully');
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      console.error('❌ STRATEGIC CACHE - Redis connection error:', error);
      this.isConnected = false;
      this.metrics.errors++;
    });

    this.redis.on('close', () => {
      console.log('⚠️ STRATEGIC CACHE - Redis connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', () => {
      console.log('🔄 STRATEGIC CACHE - Redis reconnecting...');
    });
  }

  /**
   * Verifica se o Redis está conectado
   */
  isRedisConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Obtém métricas de cache
   */
  getMetrics(): CacheMetrics {
    this.metrics.hitRate = this.metrics.hits / (this.metrics.hits + this.metrics.misses) || 0;
    return { ...this.metrics };
  }

  /**
   * Reseta métricas
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
    };
  }

  /**
   * Gera chave de cache com prefixo
   */
  private generateKey(strategy: string, key: string): string {
    const strategyConfig = this.strategies[strategy];
    if (!strategyConfig) {
      throw new Error(`Unknown cache strategy: ${strategy}`);
    }
    return `${strategyConfig.prefix}${key}`;
  }

  /**
   * Serializa dados se necessário
   */
  private serialize(data: any, strategy: CacheStrategy): string {
    if (!strategy.serialize) {
      return data;
    }
    return JSON.stringify(data);
  }

  /**
   * Deserializa dados se necessário
   */
  private deserialize(data: string, strategy: CacheStrategy): any {
    if (!strategy.serialize) {
      return data;
    }
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ STRATEGIC CACHE - Deserialization error:', error);
      return null;
    }
  }

  /**
   * Obtém dados do cache com estratégia
   */
  async get<T>(strategy: string, key: string, fallbackFn?: () => Promise<T>): Promise<T | null> {
    if (!this.isConnected) {
      console.warn('⚠️ STRATEGIC CACHE - Redis not connected, using fallback');
      if (fallbackFn) {
        return await fallbackFn();
      }
      return null;
    }

    const strategyConfig = this.strategies[strategy];
    if (!strategyConfig) {
      throw new Error(`Unknown cache strategy: ${strategy}`);
    }

    const cacheKey = this.generateKey(strategy, key);

    try {
      const cachedData = await this.redis.get(cacheKey);
      
      if (cachedData !== null) {
        this.metrics.hits++;
        
        // Refresh TTL se configurado
        if (strategyConfig.refreshOnAccess) {
          await this.redis.expire(cacheKey, strategyConfig.ttl);
        }
        
        return this.deserialize(cachedData, strategyConfig);
      } else {
        this.metrics.misses++;
        
        // Tentar fallback para banco de dados
        if (strategyConfig.fallbackToDB && fallbackFn) {
          console.log(`🔄 STRATEGIC CACHE - Cache miss for ${strategy}:${key}, fetching from DB`);
          const data = await fallbackFn();
          
          // Armazenar no cache para próximas consultas
          if (data !== null) {
            await this.set(strategy, key, data);
          }
          
          return data;
        }
        
        return null;
      }
    } catch (error) {
      console.error(`❌ STRATEGIC CACHE - Error getting ${strategy}:${key}:`, error);
      this.metrics.errors++;
      
      // Fallback para banco de dados em caso de erro
      if (strategyConfig.fallbackToDB && fallbackFn) {
        console.log(`🔄 STRATEGIC CACHE - Redis error, using DB fallback for ${strategy}:${key}`);
        return await fallbackFn();
      }
      
      return null;
    }
  }

  /**
   * Armazena dados no cache com estratégia
   */
  async set<T>(strategy: string, key: string, data: T): Promise<boolean> {
    if (!this.isConnected) {
      console.warn('⚠️ STRATEGIC CACHE - Redis not connected, skipping set');
      return false;
    }

    const strategyConfig = this.strategies[strategy];
    if (!strategyConfig) {
      throw new Error(`Unknown cache strategy: ${strategy}`);
    }

    const cacheKey = this.generateKey(strategy, key);

    try {
      const serializedData = this.serialize(data, strategyConfig);
      await this.redis.setex(cacheKey, strategyConfig.ttl, serializedData);
      this.metrics.sets++;
      return true;
    } catch (error) {
      console.error(`❌ STRATEGIC CACHE - Error setting ${strategy}:${key}:`, error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Remove dados do cache
   */
  async delete(strategy: string, key: string): Promise<boolean> {
    if (!this.isConnected) {
      console.warn('⚠️ STRATEGIC CACHE - Redis not connected, skipping delete');
      return false;
    }

    const cacheKey = this.generateKey(strategy, key);

    try {
      const result = await this.redis.del(cacheKey);
      this.metrics.deletes++;
      return result > 0;
    } catch (error) {
      console.error(`❌ STRATEGIC CACHE - Error deleting ${strategy}:${key}:`, error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Remove múltiplas chaves do cache
   */
  async deleteMultiple(strategy: string, keys: string[]): Promise<number> {
    if (!this.isConnected) {
      console.warn('⚠️ STRATEGIC CACHE - Redis not connected, skipping delete multiple');
      return 0;
    }

    const cacheKeys = keys.map(key => this.generateKey(strategy, key));

    try {
      const result = await this.redis.del(...cacheKeys);
      this.metrics.deletes += result;
      return result;
    } catch (error) {
      console.error(`❌ STRATEGIC CACHE - Error deleting multiple ${strategy}:`, error);
      this.metrics.errors++;
      return 0;
    }
  }

  /**
   * Verifica se uma chave existe no cache
   */
  async exists(strategy: string, key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    const cacheKey = this.generateKey(strategy, key);

    try {
      const result = await this.redis.exists(cacheKey);
      return result === 1;
    } catch (error) {
      console.error(`❌ STRATEGIC CACHE - Error checking existence ${strategy}:${key}:`, error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Define TTL personalizado para uma chave
   */
  async expire(strategy: string, key: string, ttl: number): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    const cacheKey = this.generateKey(strategy, key);

    try {
      const result = await this.redis.expire(cacheKey, ttl);
      return result === 1;
    } catch (error) {
      console.error(`❌ STRATEGIC CACHE - Error setting TTL ${strategy}:${key}:`, error);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Obtém TTL de uma chave
   */
  async getTTL(strategy: string, key: string): Promise<number> {
    if (!this.isConnected) {
      return -1;
    }

    const cacheKey = this.generateKey(strategy, key);

    try {
      return await this.redis.ttl(cacheKey);
    } catch (error) {
      console.error(`❌ STRATEGIC CACHE - Error getting TTL ${strategy}:${key}:`, error);
      this.metrics.errors++;
      return -1;
    }
  }

  /**
   * Limpa cache por padrão
   */
  async clearPattern(strategy: string, pattern: string): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    const strategyConfig = this.strategies[strategy];
    if (!strategyConfig) {
      throw new Error(`Unknown cache strategy: ${strategy}`);
    }

    const fullPattern = `${strategyConfig.prefix}${pattern}`;

    try {
      const keys = await this.redis.keys(fullPattern);
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      this.metrics.deletes += result;
      return result;
    } catch (error) {
      console.error(`❌ STRATEGIC CACHE - Error clearing pattern ${fullPattern}:`, error);
      this.metrics.errors++;
      return 0;
    }
  }

  /**
   * Obtém informações sobre o cache
   */
  async getCacheInfo(): Promise<any> {
    if (!this.isConnected) {
      return { connected: false };
    }

    try {
      const info = await this.redis.info();
      const memory = await this.redis.memory('STATS');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        connected: true,
        memory: memory,
        keyspace: keyspace,
        metrics: this.getMetrics(),
        strategies: Object.keys(this.strategies),
      };
    } catch (error) {
      console.error('❌ STRATEGIC CACHE - Error getting cache info:', error);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Fecha conexão Redis
   */
  async close(): Promise<void> {
    try {
      await this.redis.quit();
      console.log('✅ STRATEGIC CACHE - Redis connection closed gracefully');
    } catch (error) {
      console.error('❌ STRATEGIC CACHE - Error closing Redis connection:', error);
    }
  }

  /**
   * Ping Redis para verificar conectividade
   */
  async ping(): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Redis not connected');
    }

    try {
      return await this.redis.ping();
    } catch (error) {
      console.error('❌ STRATEGIC CACHE - Ping error:', error);
      throw error;
    }
  }
}

// Instância singleton
export const strategicCache = new StrategicCacheService();
