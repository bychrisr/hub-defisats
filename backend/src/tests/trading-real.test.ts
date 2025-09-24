import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { LNMarketsService } from '../services/lnmarkets.service';
import { createLNMarketsService } from '../utils/lnmarkets-factory';

// Mock axios
jest.mock('axios');
const axios = require('axios');

const prisma = new PrismaClient();

describe('Trading Real Methods Tests', () => {
  let lnMarketsService: LNMarketsService;
  let mockAxios: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock axios instance
    mockAxios = {
      post: jest.fn(),
      put: jest.fn(),
      get: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };
    
    axios.create.mockReturnValue(mockAxios);
    
    // Create service instance
    lnMarketsService = createLNMarketsService({
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      passphrase: 'test-passphrase',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createTrade', () => {
    it('should create a market buy order successfully', async () => {
      // Mock successful response
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
        quantity: 100,
        stoploss: 45000,
        takeprofit: 55000,
      };

      const result = await lnMarketsService.createTrade(tradeParams);

      expect(mockAxios.post).toHaveBeenCalledWith('/futures/new-trade', {
        type: 'm',
        side: 'b',
        market: 'btcusd',
        leverage: 10,
        quantity: 100,
        stoploss: 45000,
        takeprofit: 55000,
      });

      expect(result).toEqual({
        id: 'trade_123',
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        leverage: 10,
        price: 50000,
        timestamp: expect.any(String),
      });
    });

    it('should create a limit sell order successfully', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          id: 'trade_456',
          price: 52000,
          timestamp: '2025-01-25T12:00:00Z',
        },
      });

      const tradeParams = {
        type: 'l' as const,
        side: 's' as const,
        market: 'btcusd',
        leverage: 5,
        quantity: 50,
        price: 52000,
      };

      const result = await lnMarketsService.createTrade(tradeParams);

      expect(mockAxios.post).toHaveBeenCalledWith('/futures/new-trade', {
        type: 'l',
        side: 's',
        market: 'btcusd',
        leverage: 5,
        quantity: 50,
        price: 52000,
      });

      expect(result.id).toBe('trade_456');
      expect(result.side).toBe('s');
      expect(result.price).toBe(52000);
    });

    it('should handle API errors gracefully', async () => {
      mockAxios.post.mockRejectedValue({
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
        quantity: 1000, // Large quantity that might exceed balance
      };

      await expect(lnMarketsService.createTrade(tradeParams)).rejects.toThrow(
        'Failed to create trade: Request failed with status code 400'
      );
    });

    it('should validate required parameters', async () => {
      const invalidParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 10,
        // Missing quantity
      } as any;

      await expect(lnMarketsService.createTrade(invalidParams)).rejects.toThrow();
    });
  });

  describe('updateTakeProfit', () => {
    it('should update take profit successfully', async () => {
      mockAxios.put.mockResolvedValue({
        data: {
          id: 'trade_123',
          takeprofit: 55000,
          updated_at: '2025-01-25T12:00:00Z',
        },
      });

      const result = await lnMarketsService.updateTakeProfit('trade_123', 55000);

      expect(mockAxios.post).toHaveBeenCalledWith('/futures/update-trade', {
        id: 'trade_123',
        type: 'takeprofit',
        value: 55000,
      });

      expect(result).toEqual({
        success: true,
        tradeId: 'trade_123',
        takeProfit: 55000,
        timestamp: expect.any(String),
      });
    });

    it('should handle invalid trade ID', async () => {
      mockAxios.post.mockRejectedValue({
        response: {
          status: 404,
          data: { error: 'Trade not found' },
        },
        message: 'Request failed with status code 404',
      });

      await expect(lnMarketsService.updateTakeProfit('invalid_trade', 55000)).rejects.toThrow(
        'Failed to update take profit: Request failed with status code 404'
      );
    });

    it('should validate take profit price', async () => {
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Invalid take profit price' },
        },
        message: 'Request failed with status code 400',
      });

      await expect(lnMarketsService.updateTakeProfit('trade_123', -1000)).rejects.toThrow(
        'Failed to update take profit: Request failed with status code 400'
      );
    });
  });

  describe('updateStopLoss', () => {
    it('should update stop loss successfully', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          success: true,
          tradeId: 'trade_123',
          stopLoss: 45000,
          timestamp: '2025-01-25T12:00:00Z',
        },
      });

      const result = await lnMarketsService.updateStopLoss('trade_123', 45000);

      expect(mockAxios.post).toHaveBeenCalledWith('/futures/update-trade', {
        id: 'trade_123',
        type: 'stoploss',
        value: 45000,
      });

      expect(result).toEqual({
        success: true,
        tradeId: 'trade_123',
        stopLoss: 45000,
        timestamp: expect.any(String),
      });
    });

    it('should handle stop loss update errors', async () => {
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Stop loss too close to current price' },
        },
        message: 'Request failed with status code 400',
      });

      await expect(lnMarketsService.updateStopLoss('trade_123', 50000)).rejects.toThrow(
        'Failed to update stop loss: Request failed with status code 400'
      );
    });
  });

  describe('Contract Tests', () => {
    it('should follow LN Markets API contract for createTrade', async () => {
      mockAxios.post.mockResolvedValue({
        data: {
          id: 'trade_contract_test',
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

      // Verify contract compliance
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('market');
      expect(result).toHaveProperty('side');
      expect(result).toHaveProperty('quantity');
      expect(result).toHaveProperty('leverage');
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('timestamp');

      expect(typeof result.id).toBe('string');
      expect(typeof result.price).toBe('number');
      expect(typeof result.timestamp).toBe('string');
    });

    it('should follow LN Markets API contract for updateTakeProfit', async () => {
      mockAxios.put.mockResolvedValue({
        data: {
          id: 'trade_contract_test',
          takeprofit: 55000,
          updated_at: '2025-01-25T12:00:00Z',
        },
      });

      const result = await lnMarketsService.updateTakeProfit('trade_contract_test', 55000);

      expect(result).toHaveProperty('tradeId');
      expect(result).toHaveProperty('takeProfit');
      expect(result).toHaveProperty('timestamp');

      expect(typeof result.tradeId).toBe('string');
      expect(typeof result.takeProfit).toBe('number');
      expect(typeof result.timestamp).toBe('string');
    });

    it('should follow LN Markets API contract for updateStopLoss', async () => {
      mockAxios.put.mockResolvedValue({
        data: {
          id: 'trade_contract_test',
          stoploss: 45000,
          updated_at: '2025-01-25T12:00:00Z',
        },
      });

      const result = await lnMarketsService.updateStopLoss('trade_contract_test', 45000);

      expect(result).toHaveProperty('tradeId');
      expect(result).toHaveProperty('stopLoss');
      expect(result).toHaveProperty('timestamp');

      expect(typeof result.tradeId).toBe('string');
      expect(typeof result.stopLoss).toBe('number');
      expect(typeof result.timestamp).toBe('string');
    });
  });

  describe('Security Tests', () => {
    it('should validate authentication headers', async () => {
      mockAxios.post.mockResolvedValue({
        data: { id: 'trade_123', price: 50000 },
      });

      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 10,
        quantity: 100,
      };

      await lnMarketsService.createTrade(tradeParams);

      // Verify that request interceptor was set up
      expect(mockAxios.interceptors.request.use).toHaveBeenCalled();
    });

    it('should handle authentication failures', async () => {
      mockAxios.post.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Invalid API key' },
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
  });

  describe('Performance Tests', () => {
    it('should execute createTrade within acceptable time', async () => {
      mockAxios.post.mockResolvedValue({
        data: { id: 'trade_perf', price: 50000 },
      });

      const startTime = Date.now();
      
      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 10,
        quantity: 100,
      };

      await lnMarketsService.createTrade(tradeParams);
      
      const executionTime = Date.now() - startTime;
      
      // Should execute within 200ms (as per requirements)
      expect(executionTime).toBeLessThan(200);
    });

    it('should execute updateTakeProfit within acceptable time', async () => {
      mockAxios.put.mockResolvedValue({
        data: { id: 'trade_perf', takeprofit: 55000 },
      });

      const startTime = Date.now();
      
      await lnMarketsService.updateTakeProfit('trade_perf', 55000);
      
      const executionTime = Date.now() - startTime;
      
      expect(executionTime).toBeLessThan(200);
    });

    it('should execute updateStopLoss within acceptable time', async () => {
      mockAxios.put.mockResolvedValue({
        data: { id: 'trade_perf', stoploss: 45000 },
      });

      const startTime = Date.now();
      
      await lnMarketsService.updateStopLoss('trade_perf', 45000);
      
      const executionTime = Date.now() - startTime;
      
      expect(executionTime).toBeLessThan(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle network timeout', async () => {
      mockAxios.post.mockRejectedValue({
        code: 'ECONNABORTED',
        message: 'timeout of 15000ms exceeded',
      });

      const tradeParams = {
        type: 'm' as const,
        side: 'b' as const,
        market: 'btcusd',
        leverage: 10,
        quantity: 100,
      };

      await expect(lnMarketsService.createTrade(tradeParams)).rejects.toThrow(
        'Failed to create trade: timeout of 15000ms exceeded'
      );
    });

    it('should handle malformed API response', async () => {
      mockAxios.post.mockResolvedValue({
        data: null, // Malformed response
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

    it('should handle empty trade ID', async () => {
      mockAxios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Invalid trade ID' },
        },
        message: 'Request failed with status code 400',
      });

      await expect(lnMarketsService.updateTakeProfit('', 55000)).rejects.toThrow(
        'Failed to update take profit: Request failed with status code 400'
      );
      await expect(lnMarketsService.updateStopLoss('', 45000)).rejects.toThrow(
        'Failed to update stop loss: Request failed with status code 400'
      );
    });
  });
});
