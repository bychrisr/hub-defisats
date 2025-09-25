import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { VolatileMarketDataService } from '../../services/volatile-market-data.service';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

// Mock do Prisma
jest.mock('@prisma/client');
const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

// Mock do Logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
} as unknown as Logger;

describe('VolatileMarketDataService', () => {
  let service: VolatileMarketDataService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VolatileMarketDataService(mockPrisma, mockLogger);
  });

  describe('Cache Security', () => {
    it('should never cache data for more than 30 seconds', async () => {
      const mockData = {
        index: 50000,
        change24h: 2.5,
        volume24h: 1000000,
        high24h: 51000,
        low24h: 49000,
        timestamp: Date.now(),
        source: 'test' as const
      };

      // Mock successful data fetch
      jest.spyOn(service as any, 'fetchFreshMarketData').mockResolvedValue(mockData);

      // First call - should cache data
      const result1 = await service.getMarketData();
      expect(result1.success).toBe(true);
      expect(result1.data).toEqual(mockData);

      // Second call within 30 seconds - should use cache
      const result2 = await service.getMarketData();
      expect(result2.success).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Market data cache hit',
        expect.objectContaining({
          cacheAge: expect.any(Number),
          maxAge: 30000
        })
      );

      // Wait for cache to expire (31 seconds)
      jest.advanceTimersByTime(31000);

      // Third call after 31 seconds - should fetch fresh data
      const result3 = await service.getMarketData();
      expect(result3.success).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Fetching fresh market data',
        expect.any(Object)
      );
    });

    it('should never use stale cache when API fails', async () => {
      // Mock API failure
      jest.spyOn(service as any, 'fetchFreshMarketData').mockResolvedValue(null);

      const result = await service.getMarketData();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('SERVICE_UNAVAILABLE');
      expect(result.message).toContain('for safety, we do not display outdated data');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Fresh market data unavailable - NOT using stale cache'
      );
    });

    it('should reject data older than 30 seconds', async () => {
      const oldData = {
        index: 50000,
        change24h: 2.5,
        volume24h: 1000000,
        high24h: 51000,
        low24h: 49000,
        timestamp: Date.now() - 35000, // 35 seconds ago
        source: 'test' as const
      };

      jest.spyOn(service as any, 'fetchFreshMarketData').mockResolvedValue(oldData);

      const result = await service.getMarketData();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('DATA_TOO_OLD');
      expect(result.message).toContain('for safety, we do not display outdated data');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Market data too old - rejecting',
        expect.objectContaining({
          dataAge: expect.any(Number)
        })
      );
    });
  });

  describe('Data Validation', () => {
    it('should validate market data structure', () => {
      const validData = {
        index: 50000,
        change24h: 2.5,
        volume24h: 1000000,
        high24h: 51000,
        low24h: 49000,
        timestamp: Date.now(),
        source: 'test'
      };

      const result = service.validateExternalMarketData(validData);
      expect(result).toEqual(expect.objectContaining({
        index: 50000,
        timestamp: expect.any(Number),
        source: 'test'
      }));
    });

    it('should reject invalid market data', () => {
      const invalidData = {
        index: -1000, // Invalid negative index
        timestamp: 'not-a-number' // Invalid timestamp
      };

      const result = service.validateExternalMarketData(invalidData);
      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid external market data - invalid index',
        expect.any(Object)
      );
    });

    it('should reject data without required fields', () => {
      const incompleteData = {
        change24h: 2.5
        // Missing index and timestamp
      };

      const result = service.validateExternalMarketData(incompleteData);
      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Invalid external market data - missing index',
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      jest.spyOn(service as any, 'fetchFreshMarketData').mockRejectedValue(
        new Error('API connection failed')
      );

      const result = await service.getMarketData();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('FETCH_FAILED');
      expect(result.message).toContain('for safety, we do not display outdated data');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Market data fetch failed',
        expect.objectContaining({
          error: 'API connection failed'
        })
      );
    });

    it('should provide educational error messages', async () => {
      jest.spyOn(service as any, 'fetchFreshMarketData').mockResolvedValue(null);

      const result = await service.getMarketDataWithFallback();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('financial losses');
      expect(result.message).toContain('volatile markets');
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', () => {
      const stats = service.getCacheStats();
      
      expect(stats).toHaveProperty('hasData');
      expect(stats).toHaveProperty('cacheAge');
      expect(stats).toHaveProperty('isStale');
      expect(stats).toHaveProperty('ttl');
      expect(stats.ttl).toBe(30000); // 30 seconds
    });

    it('should clear cache when requested', () => {
      service.clearCache();
      expect(mockLogger.info).toHaveBeenCalledWith('Market data cache cleared');
    });

    it('should force refresh and clear cache', async () => {
      const mockData = {
        index: 50000,
        change24h: 2.5,
        volume24h: 1000000,
        high24h: 51000,
        low24h: 49000,
        timestamp: Date.now(),
        source: 'test' as const
      };

      jest.spyOn(service as any, 'fetchFreshMarketData').mockResolvedValue(mockData);

      const result = await service.forceRefresh();
      
      expect(result.success).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith('Forcing market data refresh');
    });
  });

  describe('Security Principles Compliance', () => {
    it('should never use simulated or fallback data', async () => {
      jest.spyOn(service as any, 'fetchFreshMarketData').mockResolvedValue(null);

      const result = await service.getMarketDataWithFallback();
      
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.message).toContain('do not display outdated data');
    });

    it('should always validate timestamps', () => {
      const dataWithInvalidTimestamp = {
        index: 50000,
        timestamp: 0 // Invalid timestamp
      };

      const result = service.validateExternalMarketData(dataWithInvalidTimestamp);
      expect(result).toBeNull();
    });

    it('should enforce maximum cache age of 30 seconds', () => {
      const stats = service.getCacheStats();
      expect(stats.ttl).toBe(30000);
    });
  });
});
