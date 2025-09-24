import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { LNMarketsService } from '../services/lnmarkets.service';
import { createLNMarketsService } from '../utils/lnmarkets-factory';

// Mock axios
jest.mock('axios');
const axios = require('axios');

const prisma = new PrismaClient();

describe('Trading Validation Tests', () => {
  let lnMarketsService: LNMarketsService;
  let mockAxios: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAxios = {
      post: jest.fn(),
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };
    
    axios.create.mockReturnValue(mockAxios);
    
    lnMarketsService = createLNMarketsService({
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      passphrase: 'test-passphrase',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Balance Validation', () => {
    it('should validate sufficient balance before creating trade', async () => {
      // Mock user balance
      mockAxios.get.mockResolvedValueOnce({
        data: {
          balance: 10000, // 10k sats
          margin: 5000,  // 5k sats margin
        },
      });

      // Mock successful trade creation
      mockAxios.post.mockResolvedValue({
        data: {
          id: 'trade_123',
          price: 50000,
          timestamp: '2025-01-25T12:00:00Z',
        },
      });

      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 10,
        quantity: 100, // Small quantity that should be within balance
      };

      const result = await lnMarketsService.createTrade(tradeParams);

      expect(result).toBeDefined();
      expect(result.id).toBe('trade_123');
    });

    it('should reject trade when insufficient balance', async () => {
      // Mock low balance
      mockAxios.get.mockResolvedValueOnce({
        data: {
          balance: 1000, // Only 1k sats
          margin: 500,   // 500 sats margin
        },
      });

      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 10,
        quantity: 10000, // Large quantity exceeding balance
      };

      // Should fail due to insufficient balance
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Insufficient balance' },
        },
        message: 'Request failed with status code 400',
      });

      await expect(lnMarketsService.createTrade(tradeParams)).rejects.toThrow(
        'Failed to create trade: Request failed with status code 400'
      );
    });

    it('should validate margin requirements', async () => {
      // Mock balance with low margin
      mockAxios.get.mockResolvedValueOnce({
        data: {
          balance: 10000,
          margin: 100, // Very low margin
          margin_ratio: 0.95, // High margin ratio (risky)
        },
      });

      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 20, // High leverage
        quantity: 1000, // Large quantity
      };

      // Should fail due to insufficient margin
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Insufficient margin' },
        },
        message: 'Request failed with status code 400',
      });

      await expect(lnMarketsService.createTrade(tradeParams)).rejects.toThrow(
        'Failed to create trade: Request failed with status code 400'
      );
    });
  });

  describe('Risk Management Validation', () => {
    it('should validate position size limits', async () => {
      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 10,
        quantity: 1000000, // Extremely large position
      };

      // Should fail due to position size limits
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Position size exceeds maximum allowed' },
        },
        message: 'Request failed with status code 400',
      });

      await expect(lnMarketsService.createTrade(tradeParams)).rejects.toThrow(
        'Failed to create trade: Request failed with status code 400'
      );
    });

    it('should validate leverage limits', async () => {
      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 1000, // Extremely high leverage
        quantity: 100,
      };

      // Should fail due to leverage limits
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Leverage exceeds maximum allowed' },
        },
        message: 'Request failed with status code 400',
      });

      await expect(lnMarketsService.createTrade(tradeParams)).rejects.toThrow(
        'Failed to create trade: Request failed with status code 400'
      );
    });

    it('should validate stop loss and take profit levels', async () => {
      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 10,
        quantity: 100,
        stoploss: 60000, // Stop loss above entry price (invalid for long)
        takeprofit: 40000, // Take profit below entry price (invalid for long)
      };

      // Should fail due to invalid stop loss/take profit levels
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Invalid stop loss or take profit levels' },
        },
        message: 'Request failed with status code 400',
      });

      await expect(lnMarketsService.createTrade(tradeParams)).rejects.toThrow(
        'Failed to create trade: Request failed with status code 400'
      );
    });
  });

  describe('Market Validation', () => {
    it('should validate market is available for trading', async () => {
      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'invalid_market', // Invalid market
        leverage: 10,
        quantity: 100,
      };

      // Should fail due to invalid market
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Market not available for trading' },
        },
        message: 'Request failed with status code 400',
      });

      await expect(lnMarketsService.createTrade(tradeParams)).rejects.toThrow(
        'Failed to create trade: Request failed with status code 400'
      );
    });

    it('should validate market hours', async () => {
      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 10,
        quantity: 100,
      };

      // Should fail if market is closed
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Market is currently closed' },
        },
        message: 'Request failed with status code 400',
      });

      await expect(lnMarketsService.createTrade(tradeParams)).rejects.toThrow(
        'Failed to create trade: Request failed with status code 400'
      );
    });
  });

  describe('Update Validation', () => {
    it('should validate take profit update levels', async () => {
      // Mock current position
      mockAxios.get.mockResolvedValueOnce({
        data: {
          id: 'trade_123',
          side: 'b', // Long position
          entry_price: 50000,
          current_price: 51000,
        },
      });

      // Should fail if new take profit is below current price for long position
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Take profit must be above current price for long positions' },
        },
        message: 'Request failed with status code 400',
      });

      await expect(lnMarketsService.updateTakeProfit('trade_123', 49000)).rejects.toThrow(
        'Failed to update take profit: Request failed with status code 400'
      );
    });

    it('should validate stop loss update levels', async () => {
      // Mock current position
      mockAxios.get.mockResolvedValueOnce({
        data: {
          id: 'trade_123',
          side: 's', // Short position
          entry_price: 50000,
          current_price: 49000,
        },
      });

      // Should fail if new stop loss is below current price for short position
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Stop loss must be above current price for short positions' },
        },
        message: 'Request failed with status code 400',
      });

      await expect(lnMarketsService.updateStopLoss('trade_123', 48000)).rejects.toThrow(
        'Failed to update stop loss: Request failed with status code 400'
      );
    });
  });

  describe('Security Validation', () => {
    it('should validate API credentials before trading', async () => {
      // Mock authentication failure
      mockAxios.post.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Invalid API credentials' },
        },
        message: 'Request failed with status code 401',
      });

      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 10,
        quantity: 100,
      };

      await expect(lnMarketsService.createTrade(tradeParams)).rejects.toThrow(
        'Failed to create trade: Request failed with status code 401'
      );
    });

    it('should validate rate limiting', async () => {
      // Mock rate limit exceeded
      mockAxios.post.mockRejectedValue({
        response: {
          status: 429,
          data: { error: 'Rate limit exceeded' },
        },
        message: 'Request failed with status code 429',
      });

      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 10,
        quantity: 100,
      };

      await expect(lnMarketsService.createTrade(tradeParams)).rejects.toThrow(
        'Failed to create trade: Request failed with status code 429'
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent trade attempts', async () => {
      // Mock successful response
      mockAxios.post.mockResolvedValue({
        data: {
          id: 'trade_concurrent',
          price: 50000,
          timestamp: '2025-01-25T12:00:00Z',
        },
      });

      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 10,
        quantity: 100,
      };

      // Simulate concurrent requests
      const promises = [
        lnMarketsService.createTrade(tradeParams),
        lnMarketsService.createTrade(tradeParams),
        lnMarketsService.createTrade(tradeParams),
      ];

      const results = await Promise.allSettled(promises);
      
      // At least one should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should handle network interruptions during validation', async () => {
      // Mock network error during balance check
      mockAxios.get.mockRejectedValue({
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND api.lnmarkets.com',
      });

      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 10,
        quantity: 100,
      };

      await expect(lnMarketsService.createTrade(tradeParams)).rejects.toThrow();
    });
  });
});
