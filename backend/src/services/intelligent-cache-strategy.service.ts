import Redis from 'ioredis';
import { Logger } from 'winston';

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  strategy: 'LRU' | 'LFU' | 'FIFO';
  compression?: boolean;
  encryption?: boolean;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  memoryUsage: number;
  hitRate: number;
}

export class IntelligentCacheStrategy {
  private redis: Redis;
  private logger: Logger;
  private memoryCache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats;
  private configs: Map<string, CacheConfig> = new Map();

  constructor(redis: Redis, logger: Logger) {
    this.redis = redis;
    this.logger = logger;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      memoryUsage: 0,
      hitRate: 0
    };

    this.setupDefaultConfigs();
  }

  private setupDefaultConfigs(): void {
    // Market data - short TTL, high frequency
    this.configs.set('market_data', {
      ttl: 30000, // 30 seconds
      maxSize: 1000,
      strategy: 'LRU',
      compression: true,
      encryption: false
    });

    // User data - medium TTL, medium frequency
    this.configs.set('user_data', {
      ttl: 300000, // 5 minutes
      maxSize: 500,
      strategy: 'LRU',
      compression: true,
      encryption: true
    });

    // Exchange data - short TTL, high frequency
    this.configs.set('exchange_data', {
      ttl: 60000, // 1 minute
      maxSize: 200,
      strategy: 'LRU',
      compression: true,
      encryption: false
    });

    // Historical data - long TTL, low frequency
    this.configs.set('historical_data', {
      ttl: 3600000, // 1 hour
      maxSize: 100,
      strategy: 'LFU',
      compression: true,
      encryption: false
    });

    // Credentials - long TTL, low frequency, encrypted
    this.configs.set('credentials', {
      ttl: 1800000, // 30 minutes
      maxSize: 50,
      strategy: 'LRU',
      compression: false,
      encryption: true
    });
  }

  /**
   * Get cache configuration for a specific type
   */
  getConfig(type: string): CacheConfig {
    return this.configs.get(type) || {
      ttl: 60000, // 1 minute default
      maxSize: 100,
      strategy: 'LRU',
      compression: false,
      encryption: false
    };
  }

  /**
   * Set cache configuration for a specific type
   */
  setConfig(type: string, config: CacheConfig): void {
    this.configs.set(type, config);
  }

  /**
   * Get data from cache
   */
  async get<T = any>(key: string, type: string = 'default'): Promise<T | null> {
    try {
      const config = this.getConfig(type);
      const fullKey = `${type}:${key}`;

      // Try memory cache first
      const memoryEntry = this.memoryCache.get(fullKey);
      if (memoryEntry && this.isValidEntry(memoryEntry)) {
        this.updateAccessStats(memoryEntry);
        this.stats.hits++;
        this.updateHitRate();
        
        this.logger.debug('Cache hit (memory)', { key: fullKey, type });
        return this.decompressData(memoryEntry.data, config);
      }

      // Try Redis cache
      const redisData = await this.redis.get(fullKey);
      if (redisData) {
        const entry: CacheEntry<T> = JSON.parse(redisData);
        if (this.isValidEntry(entry)) {
          // Store in memory cache for faster access
          this.memoryCache.set(fullKey, entry);
          this.updateAccessStats(entry);
          this.stats.hits++;
          this.updateHitRate();
          
          this.logger.debug('Cache hit (redis)', { key: fullKey, type });
          return this.decompressData(entry.data, config);
        } else {
          // Remove expired entry from Redis
          await this.redis.del(fullKey);
        }
      }

      this.stats.misses++;
      this.updateHitRate();
      
      this.logger.debug('Cache miss', { key: fullKey, type });
      return null;
    } catch (error) {
      this.logger.error('Cache get error', { key, type, error: error.message });
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set<T = any>(key: string, data: T, type: string = 'default'): Promise<void> {
    try {
      const config = this.getConfig(type);
      const fullKey = `${type}:${key}`;
      const now = Date.now();

      const entry: CacheEntry<T> = {
        data: this.compressData(data, config),
        timestamp: now,
        ttl: config.ttl,
        accessCount: 0,
        lastAccessed: now,
        size: this.calculateSize(data)
      };

      // Store in memory cache
      this.memoryCache.set(fullKey, entry);
      this.stats.size++;

      // Store in Redis cache
      await this.redis.setex(fullKey, Math.ceil(config.ttl / 1000), JSON.stringify(entry));

      // Check if we need to evict entries
      await this.checkEviction(type);

      this.logger.debug('Cache set', { key: fullKey, type });
    } catch (error) {
      this.logger.error('Cache set error', { key, type, error: error.message });
    }
  }

  /**
   * Delete data from cache
   */
  async delete(key: string, type: string = 'default'): Promise<void> {
    try {
      const fullKey = `${type}:${key}`;

      // Remove from memory cache
      if (this.memoryCache.delete(fullKey)) {
        this.stats.size--;
      }

      // Remove from Redis cache
      await this.redis.del(fullKey);

      this.logger.debug('Cache delete', { key: fullKey, type });
    } catch (error) {
      this.logger.error('Cache delete error', { key, type, error: error.message });
    }
  }

  /**
   * Clear all cache entries for a specific type
   */
  async clearType(type: string): Promise<void> {
    try {
      const pattern = `${type}:*`;
      
      // Clear memory cache
      for (const [key] of this.memoryCache) {
        if (key.startsWith(`${type}:`)) {
          this.memoryCache.delete(key);
          this.stats.size--;
        }
      }

      // Clear Redis cache
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      this.logger.info('Cache cleared for type', { type });
    } catch (error) {
      this.logger.error('Cache clear type error', { type, error: error.message });
    }
  }

  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();
      this.stats.size = 0;

      // Clear Redis cache
      await this.redis.flushdb();

      this.logger.info('All cache cleared');
    } catch (error) {
      this.logger.error('Cache clear all error', { error: error.message });
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache statistics for a specific type
   */
  async getTypeStats(type: string): Promise<{ count: number; memoryUsage: number; keys: string[] }> {
    try {
      const pattern = `${type}:*`;
      const keys = await this.redis.keys(pattern);
      
      let memoryUsage = 0;
      for (const [key, entry] of this.memoryCache) {
        if (key.startsWith(`${type}:`)) {
          memoryUsage += entry.size;
        }
      }

      return {
        count: keys.length,
        memoryUsage,
        keys: keys.map(key => key.replace(`${type}:`, ''))
      };
    } catch (error) {
      this.logger.error('Cache type stats error', { type, error: error.message });
      return { count: 0, memoryUsage: 0, keys: [] };
    }
  }

  /**
   * Check if cache entry is valid
   */
  private isValidEntry(entry: CacheEntry): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  }

  /**
   * Update access statistics
   */
  private updateAccessStats(entry: CacheEntry): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Check if eviction is needed
   */
  private async checkEviction(type: string): Promise<void> {
    const config = this.getConfig(type);
    if (!config.maxSize) return;

    const typeEntries = Array.from(this.memoryCache.entries())
      .filter(([key]) => key.startsWith(`${type}:`));

    if (typeEntries.length > config.maxSize) {
      await this.evictEntries(typeEntries, config);
    }
  }

  /**
   * Evict entries based on strategy
   */
  private async evictEntries(entries: [string, CacheEntry][], config: CacheConfig): Promise<void> {
    const toEvict = entries.length - (config.maxSize || 100);
    
    let sortedEntries: [string, CacheEntry][];
    
    switch (config.strategy) {
      case 'LRU':
        sortedEntries = entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        break;
      case 'LFU':
        sortedEntries = entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
        break;
      case 'FIFO':
        sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        break;
      default:
        sortedEntries = entries;
    }

    for (let i = 0; i < toEvict; i++) {
      const [key, entry] = sortedEntries[i];
      this.memoryCache.delete(key);
      await this.redis.del(key);
      this.stats.evictions++;
      this.stats.size--;
    }
  }

  /**
   * Compress data if needed
   */
  private compressData<T>(data: T, config: CacheConfig): T {
    if (!config.compression) return data;
    
    // Simple compression - in production, use a proper compression library
    return data;
  }

  /**
   * Decompress data if needed
   */
  private decompressData<T>(data: T, config: CacheConfig): T {
    if (!config.compression) return data;
    
    // Simple decompression - in production, use a proper compression library
    return data;
  }

  /**
   * Calculate data size
   */
  private calculateSize(data: any): number {
    return JSON.stringify(data).length;
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp(type: string, data: Record<string, any>): Promise<void> {
    try {
      for (const [key, value] of Object.entries(data)) {
        await this.set(key, value, type);
      }
      
      this.logger.info('Cache warmed up', { type, entries: Object.keys(data).length });
    } catch (error) {
      this.logger.error('Cache warm up error', { type, error: error.message });
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; details: any }> {
    try {
      await this.redis.ping();
      
      return {
        status: 'healthy',
        details: {
          redis: 'connected',
          memoryCache: this.memoryCache.size,
          stats: this.getStats()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          redis: 'disconnected',
          error: error.message
        }
      };
    }
  }
}
