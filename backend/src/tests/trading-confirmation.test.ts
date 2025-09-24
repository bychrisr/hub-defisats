import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { LNMarketsService } from '../services/lnmarkets.service';
import { createLNMarketsService } from '../utils/lnmarkets-factory';

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('Trading Confirmation System Tests', () => {
  let lnMarketsService: LNMarketsService;
  let mockAxios: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAxios = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
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

  describe('Order Creation and Status', () => {
    it('should create trade order successfully', async () => {
      // Mock successful trade creation
      mockAxios.post.mockResolvedValueOnce({
        data: {
          id: 'trade_123',
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          leverage: 10,
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

      const result = await lnMarketsService.createTrade(tradeParams);

      expect(result).toBeDefined();
      expect(result.id).toBe('trade_123');
      expect(result.market).toBe('btcusd');
      expect(result.side).toBe('b');
      expect(result.quantity).toBe(100);
      expect(result.leverage).toBe(10);
      expect(result.price).toBe(50000);
    });

    it('should handle trade creation failure', async () => {
      // Mock trade creation failure
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Insufficient balance' },
        },
        message: 'Request failed with status code 400',
      });

      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 10,
        quantity: 100,
      };

      await expect(lnMarketsService.createTrade(tradeParams)).rejects.toThrow(
        'Failed to create trade: Request failed with status code 400'
      );
    });

    it('should get running trades successfully', async () => {
      // Mock running trades response
      mockAxios.get.mockResolvedValueOnce({
        data: [
          {
            id: 'trade_1',
            market: 'btcusd',
            side: 'b',
            quantity: 100,
            leverage: 10,
            entry_price: 50000,
            current_price: 52000,
            unrealized_pnl: 2000,
          },
          {
            id: 'trade_2',
            market: 'btcusd',
            side: 's',
            quantity: 50,
            leverage: 5,
            entry_price: 51000,
            current_price: 49000,
            unrealized_pnl: 1000,
          },
        ],
      });

      const trades = await lnMarketsService.getRunningTrades();

      expect(trades).toBeDefined();
      expect(trades).toHaveLength(2);
      expect(trades[0].id).toBe('trade_1');
      expect(trades[1].id).toBe('trade_2');
    });

    it('should handle empty running trades', async () => {
      // Mock empty trades response
      mockAxios.get.mockResolvedValueOnce({
        data: [],
      });

      const trades = await lnMarketsService.getRunningTrades();

      expect(trades).toBeDefined();
      expect(trades).toHaveLength(0);
    });

    it('should handle API error when getting running trades', async () => {
      // Mock API error
      mockAxios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
        message: 'Request failed with status code 500',
      });

      // Should return empty array instead of throwing
      const trades = await lnMarketsService.getRunningTrades();

      expect(trades).toBeDefined();
      expect(trades).toHaveLength(0);
    });
  });

  describe('Trade Updates', () => {
    it('should update take profit successfully', async () => {
      // Mock successful TP update
      mockAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          tradeId: 'trade_123',
          takeProfit: 60000,
          timestamp: '2025-01-25T12:05:00Z',
        },
      });

      const result = await lnMarketsService.updateTakeProfit('trade_123', 60000);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.tradeId).toBe('trade_123');
      expect(result.takeProfit).toBe(60000);
      expect(result.timestamp).toBeDefined();
    });

    it('should update stop loss successfully', async () => {
      // Mock successful SL update
      mockAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          tradeId: 'trade_123',
          stopLoss: 45000,
          timestamp: '2025-01-25T12:05:00Z',
        },
      });

      const result = await lnMarketsService.updateStopLoss('trade_123', 45000);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.tradeId).toBe('trade_123');
      expect(result.stopLoss).toBe(45000);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle TP update failure', async () => {
      // Mock TP update failure
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Invalid take profit level' },
        },
        message: 'Request failed with status code 400',
      });

      await expect(lnMarketsService.updateTakeProfit('trade_123', 60000)).rejects.toThrow(
        'Failed to update take profit: Request failed with status code 400'
      );
    });

    it('should handle SL update failure', async () => {
      // Mock SL update failure
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Invalid stop loss level' },
        },
        message: 'Request failed with status code 400',
      });

      await expect(lnMarketsService.updateStopLoss('trade_123', 45000)).rejects.toThrow(
        'Failed to update stop loss: Request failed with status code 400'
      );
    });
  });

  describe('Position Management', () => {
    it('should reduce position successfully', async () => {
      // Mock successful position reduction
      mockAxios.post.mockResolvedValueOnce({
        data: {
          id: 'trade_reduce_123',
          market: 'btcusd',
          side: 's', // opposite side to reduce long position
          quantity: 50,
          price: 52000,
          timestamp: '2025-01-25T12:05:00Z',
        },
      });

      const result = await lnMarketsService.reducePosition('btcusd', 'b', 50);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.tradeId).toBe('trade_reduce_123');
      expect(result.reducedQuantity).toBe(50);
      expect(result.timestamp).toBeDefined();
    });

    it('should handle position reduction failure', async () => {
      // Mock position reduction failure
      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { error: 'Position size too small' },
        },
        message: 'Request failed with status code 400',
      });

      await expect(lnMarketsService.reducePosition('btcusd', 'b', 50)).rejects.toThrow(
        'Failed to reduce position: Request failed with status code 400'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle network connectivity issues', async () => {
      // Mock network error
      mockAxios.post.mockRejectedValueOnce({
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND api.lnmarkets.com',
        errno: -3008,
        syscall: 'getaddrinfo',
        hostname: 'api.lnmarkets.com',
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

    it('should handle authentication failures', async () => {
      // Mock authentication failure
      mockAxios.post.mockRejectedValueOnce({
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

    it('should handle rate limiting', async () => {
      // Mock rate limit exceeded
      mockAxios.post.mockRejectedValueOnce({
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
});