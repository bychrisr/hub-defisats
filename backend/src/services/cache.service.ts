import Redis from 'ioredis';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
}

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  serialize?: boolean;
}

export class CacheService {
  private redis: Redis;
  private isConnected: boolean = false;
  private defaultTTL: number = 3600; // 1 hour default

  constructor(config?: Partial<CacheConfig>) {
    const defaultConfig: CacheConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    };

    const finalConfig = { ...defaultConfig, ...config };

    this.redis = new Redis(finalConfig);

    this.redis.on('connect', () => {
      console.log('✅ CACHE - Redis connected successfully');
      this.isConnected = true;
    });

    this.redis.on('error', (error) => {
      console.error('❌ CACHE - Redis connection error:', error);
      this.isConnected = false;
    });

    this.redis.on('close', () => {
      console.log('⚠️ CACHE - Redis connection closed');
      this.isConnected = false;
    });

    this.redis.on('reconnecting', () => {
      console.log('🔄 CACHE - Redis reconnecting...');
    });
  }

  /**
   * Verifica se o Redis está conectado
   */
  isRedisConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Obtém valor do cache
   */
  async get<T = any>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      if (!this.isConnected) {
        console.log('⚠️ CACHE - Redis not connected, skipping cache get');
        return null;
      }

      const fullKey = this.buildKey(key, options?.prefix);
      const value = await this.redis.get(fullKey);

      if (!value) {
        return null;
      }

      return options?.serialize !== false ? JSON.parse(value) : value;
    } catch (error) {
      console.error('❌ CACHE - Error getting from cache:', error);
      return null;
    }
  }

  /**
   * Define valor no cache
   */
  async set<T = any>(
    key: string,
    value: T,
    options?: CacheOptions
  ): Promise<boolean> {
    try {
      if (!this.isConnected) {
        console.log('⚠️ CACHE - Redis not connected, skipping cache set');
        return false;
      }

      const fullKey = this.buildKey(key, options?.prefix);
      const serializedValue = options?.serialize !== false 
        ? JSON.stringify(value) 
        : String(value);
      
      const ttl = options?.ttl || this.defaultTTL;
      
      await this.redis.setex(fullKey, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('❌ CACHE - Error setting cache:', error);
      return false;
    }
  }

  /**
   * Remove valor do cache
   */
  async delete(key: string, prefix?: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        console.log('⚠️ CACHE - Redis not connected, skipping cache delete');
        return false;
      }

      const fullKey = this.buildKey(key, prefix);
      const result = await this.redis.del(fullKey);
      return result > 0;
    } catch (error) {
      console.error('❌ CACHE - Error deleting from cache:', error);
      return false;
    }
  }

  /**
   * Verifica se chave existe no cache
   */
  async exists(key: string, prefix?: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const fullKey = this.buildKey(key, prefix);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      console.error('❌ CACHE - Error checking cache existence:', error);
      return false;
    }
  }

  /**
   * Define TTL para uma chave existente
   */
  async expire(key: string, ttl: number, prefix?: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const fullKey = this.buildKey(key, prefix);
      const result = await this.redis.expire(fullKey, ttl);
      return result === 1;
    } catch (error) {
      console.error('❌ CACHE - Error setting TTL:', error);
      return false;
    }
  }

  /**
   * Obtém TTL de uma chave
   */
  async ttl(key: string, prefix?: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return -1;
      }

      const fullKey = this.buildKey(key, prefix);
      return await this.redis.ttl(fullKey);
    } catch (error) {
      console.error('❌ CACHE - Error getting TTL:', error);
      return -1;
    }
  }

  /**
   * Incrementa valor numérico
   */
  async increment(key: string, amount: number = 1, options?: CacheOptions): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const fullKey = this.buildKey(key, options?.prefix);
      const result = await this.redis.incrby(fullKey, amount);
      
      // Define TTL se especificado
      if (options?.ttl) {
        await this.redis.expire(fullKey, options.ttl);
      }
      
      return result;
    } catch (error) {
      console.error('❌ CACHE - Error incrementing cache:', error);
      return 0;
    }
  }

  /**
   * Decrementa valor numérico
   */
  async decrement(key: string, amount: number = 1, options?: CacheOptions): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const fullKey = this.buildKey(key, options?.prefix);
      const result = await this.redis.decrby(fullKey, amount);
      
      // Define TTL se especificado
      if (options?.ttl) {
        await this.redis.expire(fullKey, options.ttl);
      }
      
      return result;
    } catch (error) {
      console.error('❌ CACHE - Error decrementing cache:', error);
      return 0;
    }
  }

  /**
   * Obtém múltiplas chaves
   */
  async mget<T = any>(keys: string[], prefix?: string): Promise<(T | null)[]> {
    try {
      if (!this.isConnected) {
        return keys.map(() => null);
      }

      const fullKeys = keys.map(key => this.buildKey(key, prefix));
      const values = await this.redis.mget(...fullKeys);
      
      return values.map(value => {
        if (!value) return null;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      });
    } catch (error) {
      console.error('❌ CACHE - Error getting multiple keys:', error);
      return keys.map(() => null);
    }
  }

  /**
   * Define múltiplas chaves
   */
  async mset<T = any>(
    keyValuePairs: Record<string, T>,
    options?: CacheOptions
  ): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const pipeline = this.redis.pipeline();
      const ttl = options?.ttl || this.defaultTTL;

      for (const [key, value] of Object.entries(keyValuePairs)) {
        const fullKey = this.buildKey(key, options?.prefix);
        const serializedValue = options?.serialize !== false 
          ? JSON.stringify(value) 
          : String(value);
        
        pipeline.setex(fullKey, ttl, serializedValue);
      }

      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('❌ CACHE - Error setting multiple keys:', error);
      return false;
    }
  }

  /**
   * Limpa cache por padrão
   */
  async clearPattern(pattern: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      return await this.redis.del(...keys);
    } catch (error) {
      console.error('❌ CACHE - Error clearing pattern:', error);
      return 0;
    }
  }

  /**
   * Obtém informações do Redis
   */
  async getInfo(): Promise<any> {
    try {
      if (!this.isConnected) {
        return null;
      }

      const info = await this.redis.info();
      const parsedInfo: Record<string, string> = {};
      
      info.split('\r\n').forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          parsedInfo[key] = value;
        }
      });

      return {
        connected: this.isConnected,
        memory: {
          used: parsedInfo['used_memory_human'],
          peak: parsedInfo['used_memory_peak_human'],
          fragmentation: parsedInfo['mem_fragmentation_ratio'],
        },
        stats: {
          totalConnections: parsedInfo['total_connections_received'],
          commandsProcessed: parsedInfo['total_commands_processed'],
          keyspaceHits: parsedInfo['keyspace_hits'],
          keyspaceMisses: parsedInfo['keyspace_misses'],
        },
        uptime: parsedInfo['uptime_in_seconds'],
      };
    } catch (error) {
      console.error('❌ CACHE - Error getting Redis info:', error);
      return null;
    }
  }

  /**
   * Fecha conexão Redis
   */
  async disconnect(): Promise<void> {
    try {
      await this.redis.disconnect();
      this.isConnected = false;
      console.log('✅ CACHE - Redis disconnected');
    } catch (error) {
      console.error('❌ CACHE - Error disconnecting Redis:', error);
    }
  }

  /**
   * Constrói chave completa com prefixo
   */
  private buildKey(key: string, prefix?: string): string {
    const basePrefix = process.env.CACHE_PREFIX || 'hub-defisats';
    const finalPrefix = prefix ? `${basePrefix}:${prefix}` : basePrefix;
    return `${finalPrefix}:${key}`;
  }

  /**
   * Cache com fallback - tenta cache primeiro, depois executa função
   */
  async getOrSet<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    try {
      // Tenta obter do cache primeiro
      const cached = await this.get<T>(key, options);
      if (cached !== null) {
        return cached;
      }

      // Se não encontrou no cache, executa função e armazena resultado
      const result = await fallbackFn();
      await this.set(key, result, options);
      return result;
    } catch (error) {
      console.error('❌ CACHE - Error in getOrSet:', error);
      // Em caso de erro no cache, executa função diretamente
      return await fallbackFn();
    }
  }

  /**
   * Cache de usuário com TTL específico
   */
  async setUserCache<T>(userId: string, key: string, value: T, ttl: number = 1800): Promise<boolean> {
    return this.set(`user:${userId}:${key}`, value, { ttl, prefix: 'user' });
  }

  /**
   * Obtém cache de usuário
   */
  async getUserCache<T>(userId: string, key: string): Promise<T | null> {
    return this.get<T>(`user:${userId}:${key}`, { prefix: 'user' });
  }

  /**
   * Remove cache de usuário
   */
  async deleteUserCache(userId: string, key: string): Promise<boolean> {
    return this.delete(`user:${userId}:${key}`, 'user');
  }

  /**
   * Limpa todo cache de um usuário
   */
  async clearUserCache(userId: string): Promise<number> {
    return this.clearPattern(`*user:${userId}:*`);
  }

  /**
   * Invalidate cache by pattern (alias for clearPattern)
   */
  async invalidatePattern(pattern: string): Promise<number> {
    return this.clearPattern(pattern);
  }
}

// Instância singleton do cache
export const cacheService = new CacheService();