import { Redis } from 'ioredis';
import { Logger } from 'winston';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  serialize?: boolean;
}

export class StructuredCacheService {
  private redis: Redis;
  private logger: Logger;
  private defaultTTL: number;

  constructor(redis: Redis, logger: Logger, defaultTTL = 300) {
    this.redis = redis;
    this.logger = logger;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const cached = await this.redis.get(fullKey);
      
      if (!cached) {
        this.logger.debug(`Cache miss for key: ${fullKey}`);
        return null;
      }

      this.logger.debug(`Cache hit for key: ${fullKey}`);
      
      if (options.serialize !== false) {
        return JSON.parse(cached);
      }
      
      return cached as T;
    } catch (error) {
      this.logger.error('Cache get error', { key, error: (error as Error).message });
      return null;
    }
  }

  /**
   * Set a value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const ttl = options.ttl || this.defaultTTL;
      
      let serializedValue: string;
      if (options.serialize !== false) {
        serializedValue = JSON.stringify(value);
      } else {
        serializedValue = value as string;
      }

      await this.redis.setex(fullKey, ttl, serializedValue);
      this.logger.debug(`Cache set for key: ${fullKey} with TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error('Cache set error', { key, error: (error as Error).message });
    }
  }

  /**
   * Delete a key from cache
   */
  async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const result = await this.redis.del(fullKey);
      this.logger.debug(`Cache delete for key: ${fullKey}, result: ${result}`);
      return result > 0;
    } catch (error) {
      this.logger.error('Cache delete error', { key, error: (error as Error).message });
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async delPattern(pattern: string, options: CacheOptions = {}): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern, options.prefix);
      const keys = await this.redis.keys(fullPattern);
      
      if (keys.length === 0) {
        this.logger.debug(`No keys found for pattern: ${fullPattern}`);
        return 0;
      }

      const result = await this.redis.del(...keys);
      this.logger.debug(`Cache delete pattern: ${fullPattern}, deleted: ${result} keys`);
      return result;
    } catch (error) {
      this.logger.error('Cache delete pattern error', { pattern, error: (error as Error).message });
      return 0;
    }
  }

  /**
   * Check if a key exists in cache
   */
  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options.prefix);
      const result = await this.redis.exists(fullKey);
      return result === 1;
    } catch (error) {
      this.logger.error('Cache exists error', { key, error: (error as Error).message });
      return false;
    }
  }

  /**
   * Get multiple keys at once
   */
  async mget<T>(keys: string[], options: CacheOptions = {}): Promise<(T | null)[]> {
    try {
      const fullKeys = keys.map(key => this.buildKey(key, options.prefix));
      const values = await this.redis.mget(...fullKeys);
      
      return values.map(value => {
        if (!value) return null;
        if (options.serialize !== false) {
          return JSON.parse(value);
        }
        return value as T;
      });
    } catch (error) {
      this.logger.error('Cache mget error', { keys, error: (error as Error).message });
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple key-value pairs at once
   */
  async mset<T>(keyValuePairs: Array<{ key: string; value: T }>, options: CacheOptions = {}): Promise<void> {
    try {
      const ttl = options.ttl || this.defaultTTL;
      const pipeline = this.redis.pipeline();
      
      for (const { key, value } of keyValuePairs) {
        const fullKey = this.buildKey(key, options.prefix);
        let serializedValue: string;
        
        if (options.serialize !== false) {
          serializedValue = JSON.stringify(value);
        } else {
          serializedValue = value as string;
        }
        
        pipeline.setex(fullKey, ttl, serializedValue);
      }
      
      await pipeline.exec();
      this.logger.debug(`Cache mset for ${keyValuePairs.length} keys with TTL: ${ttl}s`);
    } catch (error) {
      this.logger.error('Cache mset error', { keyValuePairs: keyValuePairs.length, error: (error as Error).message });
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    memory: string;
    keyspace: Record<string, string>;
    connectedClients: number;
  }> {
    try {
      const info = await this.redis.info();
      const memory = info.match(/used_memory_human:([^\r\n]+)/)?.[1] || '0B';
      const connectedClients = parseInt(info.match(/connected_clients:(\d+)/)?.[1] || '0');
      
      const keyspace: Record<string, string> = {};
      const keyspaceMatches = info.match(/db\d+:keys=(\d+),expires=(\d+)/g);
      if (keyspaceMatches) {
        keyspaceMatches.forEach(match => {
          const [db, keys, expires] = match.split(':');
          keyspace[db] = `keys=${keys}, expires=${expires}`;
        });
      }
      
      return { memory, keyspace, connectedClients };
    } catch (error) {
      this.logger.error('Cache stats error', { error: (error as Error).message });
      return { memory: '0B', keyspace: {}, connectedClients: 0 };
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.logger.info('Cache cleared successfully');
    } catch (error) {
      this.logger.error('Cache clear error', { error: (error as Error).message });
    }
  }

  /**
   * Build full cache key with prefix
   */
  private buildKey(key: string, prefix?: string): string {
    if (prefix) {
      return `${prefix}:${key}`;
    }
    return key;
  }

  /**
   * Cache with fallback function
   */
  async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    
    if (cached !== null) {
      return cached;
    }
    
    const value = await fallback();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Cache with TTL based on data type
   */
  async setWithSmartTTL<T>(key: string, value: T, dataType: 'user' | 'market' | 'config' | 'temp'): Promise<void> {
    const ttlMap = {
      user: 300,      // 5 minutes
      market: 30,     // 30 seconds
      config: 3600,   // 1 hour
      temp: 60        // 1 minute
    };
    
    await this.set(key, value, { ttl: ttlMap[dataType] });
  }
}