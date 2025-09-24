import { StrategicCacheService } from '../services/strategic-cache.service';
import { CacheManagerService } from '../services/cache-manager.service';

// Mock Redis
jest.mock('ioredis', () => {
  const mockRedis = {
    on: jest.fn(),
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    keys: jest.fn(),
    info: jest.fn(),
    memory: jest.fn(),
    ping: jest.fn(),
    quit: jest.fn(),
  };
  return jest.fn(() => mockRedis);
});

// Mock Prisma
jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    position: {
      findMany: jest.fn(),
    },
    automation: {
      findMany: jest.fn(),
    },
    plan: {
      findMany: jest.fn(),
    },
    systemConfig: {
      findMany: jest.fn(),
    },
    session: {
      findUnique: jest.fn(),
    },
  },
}));

describe('StrategicCacheService', () => {
  let cacheService: StrategicCacheService;
  let mockRedis: any;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService = new StrategicCacheService();
    mockRedis = (cacheService as any).redis;
  });

  describe('Cache Strategies', () => {
    it('should have predefined strategies', () => {
      const strategies = (cacheService as any).strategies;
      
      expect(strategies).toHaveProperty('user');
      expect(strategies).toHaveProperty('market');
      expect(strategies).toHaveProperty('positions');
      expect(strategies).toHaveProperty('config');
      expect(strategies).toHaveProperty('rateLimit');
      expect(strategies).toHaveProperty('session');
      expect(strategies).toHaveProperty('historical');
    });

    it('should have correct user strategy configuration', () => {
      const strategies = (cacheService as any).strategies;
      const userStrategy = strategies.user;
      
      expect(userStrategy.ttl).toBe(1800); // 30 minutes
      expect(userStrategy.prefix).toBe('user:');
      expect(userStrategy.serialize).toBe(true);
      expect(userStrategy.fallbackToDB).toBe(true);
      expect(userStrategy.refreshOnAccess).toBe(true);
    });

    it('should have correct market strategy configuration', () => {
      const strategies = (cacheService as any).strategies;
      const marketStrategy = strategies.market;
      
      expect(marketStrategy.ttl).toBe(60); // 1 minute
      expect(marketStrategy.prefix).toBe('market:');
      expect(marketStrategy.serialize).toBe(true);
      expect(marketStrategy.fallbackToDB).toBe(false);
      expect(marketStrategy.refreshOnAccess).toBe(false);
    });
  });

  describe('Key Generation', () => {
    it('should generate correct cache keys', () => {
      const generateKey = (cacheService as any).generateKey.bind(cacheService);
      
      expect(generateKey('user', '123')).toBe('user:123');
      expect(generateKey('market', 'BTC')).toBe('market:BTC');
      expect(generateKey('positions', 'user123')).toBe('positions:user123');
    });

    it('should throw error for unknown strategy', () => {
      const generateKey = (cacheService as any).generateKey.bind(cacheService);
      
      expect(() => generateKey('unknown', 'key')).toThrow('Unknown cache strategy: unknown');
    });
  });

  describe('Serialization', () => {
    it('should serialize data when strategy requires it', () => {
      const serialize = (cacheService as any).serialize.bind(cacheService);
      const strategies = (cacheService as any).strategies;
      
      const data = { id: 1, name: 'test' };
      const serialized = serialize(data, strategies.user);
      
      expect(serialized).toBe(JSON.stringify(data));
    });

    it('should not serialize data when strategy does not require it', () => {
      const serialize = (cacheService as any).serialize.bind(cacheService);
      const strategies = (cacheService as any).strategies;
      
      const data = 'test string';
      const serialized = serialize(data, strategies.rateLimit);
      
      expect(serialized).toBe(data);
    });

    it('should deserialize data correctly', () => {
      const deserialize = (cacheService as any).deserialize.bind(cacheService);
      const strategies = (cacheService as any).strategies;
      
      const data = { id: 1, name: 'test' };
      const serialized = JSON.stringify(data);
      const deserialized = deserialize(serialized, strategies.user);
      
      expect(deserialized).toEqual(data);
    });

    it('should handle deserialization errors gracefully', () => {
      const deserialize = (cacheService as any).deserialize.bind(cacheService);
      const strategies = (cacheService as any).strategies;
      
      const invalidJson = 'invalid json';
      const result = deserialize(invalidJson, strategies.user);
      
      expect(result).toBeNull();
    });
  });

  describe('Cache Operations', () => {
    beforeEach(() => {
      (cacheService as any).isConnected = true;
    });

    it('should get data from cache', async () => {
      const testData = { id: 1, name: 'test' };
      mockRedis.get.mockResolvedValue(JSON.stringify(testData));
      
      const result = await cacheService.get('user', '123');
      
      expect(result).toEqual(testData);
      expect(mockRedis.get).toHaveBeenCalledWith('user:123');
    });

    it('should set data in cache', async () => {
      const testData = { id: 1, name: 'test' };
      mockRedis.setex.mockResolvedValue('OK');
      
      const result = await cacheService.set('user', '123', testData);
      
      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith('user:123', 1800, JSON.stringify(testData));
    });

    it('should delete data from cache', async () => {
      mockRedis.del.mockResolvedValue(1);
      
      const result = await cacheService.delete('user', '123');
      
      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('user:123');
    });

    it('should check if key exists', async () => {
      mockRedis.exists.mockResolvedValue(1);
      
      const result = await cacheService.exists('user', '123');
      
      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('user:123');
    });

    it('should set TTL for key', async () => {
      mockRedis.expire.mockResolvedValue(1);
      
      const result = await cacheService.expire('user', '123', 3600);
      
      expect(result).toBe(true);
      expect(mockRedis.expire).toHaveBeenCalledWith('user:123', 3600);
    });

    it('should get TTL for key', async () => {
      mockRedis.ttl.mockResolvedValue(1800);
      
      const result = await cacheService.getTTL('user', '123');
      
      expect(result).toBe(1800);
      expect(mockRedis.ttl).toHaveBeenCalledWith('user:123');
    });
  });

  describe('Fallback to Database', () => {
    beforeEach(() => {
      (cacheService as any).isConnected = true;
    });

    it('should fallback to database when cache miss and fallbackToDB is true', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      const fallbackFn = jest.fn().mockResolvedValue({ id: 1, name: 'test' });
      mockRedis.setex.mockResolvedValue('OK');
      
      const result = await cacheService.get('user', '123', fallbackFn);
      
      expect(result).toEqual({ id: 1, name: 'test' });
      expect(fallbackFn).toHaveBeenCalled();
      expect(mockRedis.setex).toHaveBeenCalled();
    });

    it('should not fallback to database when fallbackToDB is false', async () => {
      mockRedis.get.mockResolvedValue(null);
      
      const fallbackFn = jest.fn().mockResolvedValue({ id: 1, name: 'test' });
      
      const result = await cacheService.get('market', 'BTC', fallbackFn);
      
      expect(result).toBeNull();
      expect(fallbackFn).not.toHaveBeenCalled();
    });
  });

  describe('Metrics', () => {
    it('should track cache hits', async () => {
      (cacheService as any).isConnected = true;
      mockRedis.get.mockResolvedValue('{"id": 1}');
      
      await cacheService.get('user', '123');
      
      const metrics = cacheService.getMetrics();
      expect(metrics.hits).toBe(1);
      expect(metrics.misses).toBe(0);
    });

    it('should track cache misses', async () => {
      (cacheService as any).isConnected = true;
      mockRedis.get.mockResolvedValue(null);
      
      await cacheService.get('user', '123');
      
      const metrics = cacheService.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(1);
    });

    it('should track cache sets', async () => {
      (cacheService as any).isConnected = true;
      mockRedis.setex.mockResolvedValue('OK');
      
      await cacheService.set('user', '123', { id: 1 });
      
      const metrics = cacheService.getMetrics();
      expect(metrics.sets).toBe(1);
    });

    it('should track cache deletes', async () => {
      (cacheService as any).isConnected = true;
      mockRedis.del.mockResolvedValue(1);
      
      await cacheService.delete('user', '123');
      
      const metrics = cacheService.getMetrics();
      expect(metrics.deletes).toBe(1);
    });

    it('should calculate hit rate correctly', async () => {
      (cacheService as any).isConnected = true;
      mockRedis.get.mockResolvedValue('{"id": 1}');
      mockRedis.setex.mockResolvedValue('OK');
      
      // 2 hits, 1 miss
      await cacheService.get('user', '123');
      await cacheService.get('user', '456');
      await cacheService.get('user', '789');
      mockRedis.get.mockResolvedValue(null);
      await cacheService.get('user', '999');
      
      const metrics = cacheService.getMetrics();
      expect(metrics.hitRate).toBe(0.75); // 3 hits / 4 total
    });

    it('should reset metrics', () => {
      (cacheService as any).metrics = { hits: 10, misses: 5, sets: 8, deletes: 2, errors: 1, hitRate: 0.67 };
      
      cacheService.resetMetrics();
      
      const metrics = cacheService.getMetrics();
      expect(metrics.hits).toBe(0);
      expect(metrics.misses).toBe(0);
      expect(metrics.sets).toBe(0);
      expect(metrics.deletes).toBe(0);
      expect(metrics.errors).toBe(0);
      expect(metrics.hitRate).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      (cacheService as any).isConnected = false;
      
      const result = await cacheService.get('user', '123');
      
      expect(result).toBeNull();
    });

    it('should handle Redis operation errors', async () => {
      (cacheService as any).isConnected = true;
      mockRedis.get.mockRejectedValue(new Error('Redis error'));
      
      const result = await cacheService.get('user', '123');
      
      expect(result).toBeNull();
      
      const metrics = cacheService.getMetrics();
      expect(metrics.errors).toBe(1);
    });
  });
});

describe('CacheManagerService', () => {
  let cacheManager: CacheManagerService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheManager = new CacheManagerService();
    mockPrisma = require('../lib/prisma').prisma;
  });

  describe('User Cache', () => {
    it('should cache user data', async () => {
      const mockUser = { id: '123', email: 'test@example.com', name: 'Test User' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      // Mock the strategic cache
      const mockStrategicCache = require('../services/strategic-cache.service').strategicCache;
      mockStrategicCache.get = jest.fn().mockImplementation(async (strategy, key, fallbackFn) => {
        if (fallbackFn) {
          return await fallbackFn();
        }
        return null;
      });
      mockStrategicCache.set = jest.fn().mockResolvedValue(true);
      
      const result = await cacheManager.getUser('123');
      
      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
        include: {
          automations: true,
          admin_user: true,
        },
      });
    });

    it('should cache user by email', async () => {
      const mockUser = { id: '123', email: 'test@example.com', name: 'Test User' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      
      const mockStrategicCache = require('../services/strategic-cache.service').strategicCache;
      mockStrategicCache.get = jest.fn().mockImplementation(async (strategy, key, fallbackFn) => {
        if (fallbackFn) {
          return await fallbackFn();
        }
        return null;
      });
      mockStrategicCache.set = jest.fn().mockResolvedValue(true);
      
      const result = await cacheManager.getUserByEmail('test@example.com');
      
      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          automations: true,
          admin_user: true,
        },
      });
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate user cache', async () => {
      const mockStrategicCache = require('../services/strategic-cache.service').strategicCache;
      mockStrategicCache.delete = jest.fn().mockResolvedValue(true);
      
      await cacheManager.invalidateUser('123');
      
      expect(mockStrategicCache.delete).toHaveBeenCalledWith('user', '123');
      expect(mockStrategicCache.delete).toHaveBeenCalledWith('positions', '123');
      expect(mockStrategicCache.delete).toHaveBeenCalledWith('config', 'automations:123');
    });

    it('should clear user cache', async () => {
      const mockStrategicCache = require('../services/strategic-cache.service').strategicCache;
      mockStrategicCache.delete = jest.fn().mockResolvedValue(true);
      
      await cacheManager.clearUserCache('123');
      
      expect(mockStrategicCache.delete).toHaveBeenCalledTimes(5);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when Redis is connected', async () => {
      const mockStrategicCache = require('../services/strategic-cache.service').strategicCache;
      mockStrategicCache.ping = jest.fn().mockResolvedValue('PONG');
      mockStrategicCache.isRedisConnected = jest.fn().mockReturnValue(true);
      mockStrategicCache.getMetrics = jest.fn().mockReturnValue({ hits: 10, misses: 5 });
      mockStrategicCache.getCacheInfo = jest.fn().mockResolvedValue({ connected: true });
      
      const result = await cacheManager.healthCheck();
      
      expect(result.healthy).toBe(true);
      expect(result.details.ping).toBe('PONG');
      expect(result.details.connected).toBe(true);
    });

    it('should return unhealthy status when Redis is not connected', async () => {
      const mockStrategicCache = require('../services/strategic-cache.service').strategicCache;
      mockStrategicCache.ping = jest.fn().mockRejectedValue(new Error('Connection failed'));
      mockStrategicCache.isRedisConnected = jest.fn().mockReturnValue(false);
      
      const result = await cacheManager.healthCheck();
      
      expect(result.healthy).toBe(false);
      expect(result.details.connected).toBe(false);
    });
  });
});
