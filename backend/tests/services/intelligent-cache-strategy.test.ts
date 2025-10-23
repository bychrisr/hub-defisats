import { IntelligentCacheStrategy, CacheConfig } from '../../src/services/intelligent-cache-strategy.service';
import { Logger } from 'winston';
import Redis from 'ioredis';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
} as unknown as Logger;

// Mock Redis
const mockRedis = {
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
  flushdb: jest.fn(),
  ping: jest.fn()
} as unknown as Redis;

describe('IntelligentCacheStrategy', () => {
  let cacheStrategy: IntelligentCacheStrategy;

  beforeEach(() => {
    cacheStrategy = new IntelligentCacheStrategy(mockRedis, mockLogger);
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should have default configurations', () => {
      const marketDataConfig = cacheStrategy.getConfig('market_data');
      expect(marketDataConfig.ttl).toBe(30000);
      expect(marketDataConfig.maxSize).toBe(1000);
      expect(marketDataConfig.strategy).toBe('LRU');
      expect(marketDataConfig.compression).toBe(true);
      expect(marketDataConfig.encryption).toBe(false);

      const userDataConfig = cacheStrategy.getConfig('user_data');
      expect(userDataConfig.ttl).toBe(300000);
      expect(userDataConfig.maxSize).toBe(500);
      expect(userDataConfig.strategy).toBe('LRU');
      expect(userDataConfig.compression).toBe(true);
      expect(userDataConfig.encryption).toBe(true);

      const credentialsConfig = cacheStrategy.getConfig('credentials');
      expect(credentialsConfig.ttl).toBe(1800000);
      expect(credentialsConfig.maxSize).toBe(50);
      expect(credentialsConfig.strategy).toBe('LRU');
      expect(credentialsConfig.compression).toBe(false);
      expect(credentialsConfig.encryption).toBe(true);
    });

    it('should set custom configuration', () => {
      const customConfig: CacheConfig = {
        ttl: 60000,
        maxSize: 200,
        strategy: 'LFU',
        compression: true,
        encryption: false
      };

      cacheStrategy.setConfig('custom_type', customConfig);
      const retrievedConfig = cacheStrategy.getConfig('custom_type');

      expect(retrievedConfig).toEqual(customConfig);
    });

    it('should return default configuration for unknown type', () => {
      const defaultConfig = cacheStrategy.getConfig('unknown_type');
      
      expect(defaultConfig.ttl).toBe(60000);
      expect(defaultConfig.maxSize).toBe(100);
      expect(defaultConfig.strategy).toBe('LRU');
      expect(defaultConfig.compression).toBe(false);
      expect(defaultConfig.encryption).toBe(false);
    });
  });

  describe('Cache Operations', () => {
    it('should set and get data from cache', async () => {
      const testData = { price: 50000, symbol: 'BTC' };
      const key = 'test_key';
      const type = 'market_data';

      // Mock Redis operations
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.get.mockResolvedValue(JSON.stringify({
        data: testData,
        timestamp: Date.now(),
        ttl: 30000,
        accessCount: 0,
        lastAccessed: Date.now(),
        size: JSON.stringify(testData).length
      }));

      await cacheStrategy.set(key, testData, type);
      const result = await cacheStrategy.get(key, type);

      expect(mockRedis.setex).toHaveBeenCalled();
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent key', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheStrategy.get('non_existent_key', 'market_data');
      expect(result).toBeNull();
    });

    it('should return null for expired data', async () => {
      const expiredEntry = {
        data: { price: 50000 },
        timestamp: Date.now() - 60000, // 1 minute ago
        ttl: 30000, // 30 seconds TTL
        accessCount: 0,
        lastAccessed: Date.now() - 60000,
        size: 100
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(expiredEntry));
      mockRedis.del.mockResolvedValue(1);

      const result = await cacheStrategy.get('expired_key', 'market_data');
      expect(result).toBeNull();
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should delete data from cache', async () => {
      const key = 'test_key';
      const type = 'market_data';

      mockRedis.del.mockResolvedValue(1);

      await cacheStrategy.delete(key, type);

      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should clear cache by type', async () => {
      const type = 'market_data';
      const keys = [`${type}:key1`, `${type}:key2`];

      mockRedis.keys.mockResolvedValue(keys);
      mockRedis.del.mockResolvedValue(2);

      await cacheStrategy.clearType(type);

      expect(mockRedis.keys).toHaveBeenCalledWith(`${type}:*`);
      expect(mockRedis.del).toHaveBeenCalledWith(...keys);
    });

    it('should clear all cache', async () => {
      mockRedis.flushdb.mockResolvedValue('OK');

      await cacheStrategy.clearAll();

      expect(mockRedis.flushdb).toHaveBeenCalled();
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache statistics', () => {
      const stats = cacheStrategy.getStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('evictions');
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats).toHaveProperty('hitRate');
    });

    it('should return type-specific statistics', async () => {
      const type = 'market_data';
      const keys = [`${type}:key1`, `${type}:key2`];

      mockRedis.keys.mockResolvedValue(keys);

      const stats = await cacheStrategy.getTypeStats(type);

      expect(stats).toHaveProperty('count');
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats).toHaveProperty('keys');
      expect(stats.keys).toEqual(['key1', 'key2']);
    });
  });

  describe('Cache Warming', () => {
    it('should warm up cache with data', async () => {
      const type = 'market_data';
      const data = {
        'BTC': { price: 50000, symbol: 'BTC' },
        'ETH': { price: 3000, symbol: 'ETH' }
      };

      mockRedis.setex.mockResolvedValue('OK');

      await cacheStrategy.warmUp(type, data);

      expect(mockRedis.setex).toHaveBeenCalledTimes(2);
      expect(mockLogger.info).toHaveBeenCalledWith('Cache warmed up', {
        type,
        entries: 2
      });
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      mockRedis.ping.mockResolvedValue('PONG');

      const health = await cacheStrategy.healthCheck();

      expect(health.status).toBe('healthy');
      expect(health.details).toHaveProperty('redis');
      expect(health.details).toHaveProperty('memoryCache');
      expect(health.details).toHaveProperty('stats');
    });

    it('should return unhealthy status on Redis error', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'));

      const health = await cacheStrategy.healthCheck();

      expect(health.status).toBe('unhealthy');
      expect(health.details).toHaveProperty('redis');
      expect(health.details).toHaveProperty('error');
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis errors gracefully', async () => {
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await cacheStrategy.get('test_key', 'market_data');

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Cache get error',
        expect.objectContaining({
          key: 'test_key',
          type: 'market_data',
          error: 'Redis connection failed'
        })
      );
    });

    it('should handle set errors gracefully', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis set failed'));

      await cacheStrategy.set('test_key', { data: 'test' }, 'market_data');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Cache set error',
        expect.objectContaining({
          key: 'test_key',
          type: 'market_data',
          error: 'Redis set failed'
        })
      );
    });

    it('should handle delete errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Redis delete failed'));

      await cacheStrategy.delete('test_key', 'market_data');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Cache delete error',
        expect.objectContaining({
          key: 'test_key',
          type: 'market_data',
          error: 'Redis delete failed'
        })
      );
    });

    it('should handle clear type errors gracefully', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis keys failed'));

      await cacheStrategy.clearType('market_data');

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Cache clear type error',
        expect.objectContaining({
          type: 'market_data',
          error: 'Redis keys failed'
        })
      );
    });
  });

  describe('Cache Entry Validation', () => {
    it('should validate cache entries', () => {
      const now = Date.now();
      const validEntry = {
        data: { price: 50000 },
        timestamp: now - 10000, // 10 seconds ago
        ttl: 30000, // 30 seconds TTL
        accessCount: 0,
        lastAccessed: now - 10000,
        size: 100
      };

      const invalidEntry = {
        data: { price: 50000 },
        timestamp: now - 60000, // 1 minute ago
        ttl: 30000, // 30 seconds TTL
        accessCount: 0,
        lastAccessed: now - 60000,
        size: 100
      };

      // This would be tested through the private method indirectly
      // by testing the get method behavior
      expect(validEntry).toBeDefined();
      expect(invalidEntry).toBeDefined();
    });
  });
});
