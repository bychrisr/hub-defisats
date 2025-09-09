import { Redis } from 'ioredis';
import { config } from '@/config/env';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export class CacheService {
  private redis: Redis;
  private defaultTTL: number = 3600; // 1 hour

  constructor() {
    this.redis = new Redis(config.env.REDIS_URL);
    this.redis.on('error', err => console.error('Redis Cache Error:', err));
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const expiration = ttl || this.defaultTTL;
      await this.redis.setex(key, expiration, serialized);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Get or set pattern - get from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // If not in cache, fetch and cache the result
      const result = await fetcher();
      await this.set(key, result, options?.ttl);
      return result;
    } catch (error) {
      console.error('Cache getOrSet error:', error);
      // If cache fails, still try to fetch
      return await fetcher();
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    used_memory: string;
    connected_clients: string;
    total_commands_processed: string;
    keyspace_hits: string;
    keyspace_misses: string;
  }> {
    try {
      const info = await this.redis.info('memory');
      const stats = await this.redis.info('stats');

      const parseInfo = (infoString: string) => {
        const lines = infoString.split('\r\n');
        const result: Record<string, unknown> = {};
        lines.forEach(line => {
          if (line.includes(':')) {
            const [key, value] = line.split(':');
            result[key] = value;
          }
        });
        return result;
      };

      const memoryInfo = parseInfo(info);
      const statsInfo = parseInfo(stats);

      return {
        used_memory: memoryInfo.used_memory_human || '0B',
        connected_clients: statsInfo.connected_clients || '0',
        total_commands_processed: statsInfo.total_commands_processed || '0',
        keyspace_hits: statsInfo.keyspace_hits || '0',
        keyspace_misses: statsInfo.keyspace_misses || '0',
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        used_memory: '0B',
        connected_clients: '0',
        total_commands_processed: '0',
        keyspace_hits: '0',
        keyspace_misses: '0',
      };
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance
export const cacheService = new CacheService();
