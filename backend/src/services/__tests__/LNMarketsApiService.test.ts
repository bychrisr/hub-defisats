/**
 * LN Markets API Service Tests
 * 
 * Unit tests for LNMarketsApiService implementation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { LNMarketsApiService, LNMarketsCredentials } from '../LNMarketsApiService';
import { ExchangeApiResponse } from '../ExchangeApiService.interface';
import { Logger } from 'winston';

// Mock winston logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;

// Mock axios
jest.mock('axios');
const mockedAxios = require('axios');

// Mock crypto
jest.mock('crypto');
const mockedCrypto = require('crypto');

// Mock circuit breaker and retry service
jest.mock('../circuit-breaker.service');
jest.mock('../retry.service');

describe('LNMarketsApiService', () => {
  let service: LNMarketsApiService;
  let credentials: LNMarketsCredentials;

  beforeEach(() => {
    credentials = {
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      passphrase: 'test-passphrase',
      isTestnet: false
    };

    service = new LNMarketsApiService(credentials, mockLogger);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with correct credentials', () => {
      expect(service).toBeDefined();
      expect(service.getExchangeName()).toBe('LN Markets');
      expect(service.getExchangeVersion()).toBe('2.0');
      expect(service.isSandbox()).toBe(false);
    });

    it('should initialize with testnet credentials', () => {
      const testnetCredentials = { ...credentials, isTestnet: true };
      const testnetService = new LNMarketsApiService(testnetCredentials, mockLogger);
      
      expect(testnetService.isSandbox()).toBe(true);
    });
  });

  describe('validateCredentials', () => {
    it('should return true for test credentials', async () => {
      const testCredentials = { ...credentials, apiKey: 'test-api-key' };
      const result = await service.validateCredentials(testCredentials);
      
      expect(result).toBe(true);
    });

    it('should return false for invalid credentials', async () => {
      // Mock axios to throw error
      mockedAxios.create.mockReturnValue({
        interceptors: {
          request: { use: jest.fn() }
        },
        request: jest.fn().mockRejectedValue(new Error('Invalid credentials'))
      });

      const invalidCredentials = { ...credentials, apiKey: 'invalid-key' };
      const result = await service.validateCredentials(invalidCredentials);
      
      expect(result).toBe(false);
    });
  });

  describe('getUser', () => {
    it('should return user data successfully', async () => {
      const mockUserData = {
        uid: 'test-uid',
        email: 'test@example.com',
        username: 'testuser',
        role: 'user',
        created_at: '2023-01-01T00:00:00Z'
      };

      // Mock the makeAuthenticatedRequest method
      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockResolvedValue(mockUserData);

      const result = await service.getUser();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 'test-uid',
        email: 'test@example.com',
        username: 'testuser',
        isActive: true,
        createdAt: new Date('2023-01-01T00:00:00Z')
      });
    });

    it('should handle errors gracefully', async () => {
      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockRejectedValue(new Error('API Error'));

      const result = await service.getUser();

      expect(result.success).toBe(false);
      expect(result.error).toBe('USER_FETCH_FAILED');
    });
  });

  describe('getUserBalance', () => {
    it('should return balance data successfully', async () => {
      const mockBalanceData = {
        balance: 1000,
        synthetic_usd_balance: 50000
      };

      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockResolvedValue(mockBalanceData);

      const result = await service.getUserBalance();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{
        currency: 'BTC',
        available: 1000,
        locked: 0,
        total: 1000
      }]);
    });
  });

  describe('getPositions', () => {
    it('should return positions data successfully', async () => {
      const mockPositionsData = [
        {
          id: 'pos-1',
          side: 'b',
          quantity: 100,
          price: 50000,
          current_price: 51000,
          pl: 1000,
          margin: 5000,
          maintenance_margin: 1000,
          leverage: 10,
          status: 'open',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        }
      ];

      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockResolvedValue(mockPositionsData);

      const result = await service.getPositions();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{
        id: 'pos-1',
        symbol: 'BTCUSD',
        side: 'long',
        size: 100,
        entryPrice: 50000,
        currentPrice: 51000,
        pnl: 1000,
        margin: 5000,
        maintenanceMargin: 1000,
        leverage: 10,
        status: 'open',
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      }]);
    });
  });

  describe('getTicker', () => {
    it('should return ticker data successfully', async () => {
      const mockTickerData = {
        lastPrice: 50000,
        index: 49950,
        carryFeeRate: 0.01
      };

      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockResolvedValue(mockTickerData);

      const result = await service.getTicker('BTCUSD');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        symbol: 'BTCUSD',
        price: 50000,
        change24h: 0,
        changePercent24h: 0,
        volume24h: 0,
        high24h: 50000,
        low24h: 50000,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('placeOrder', () => {
    it('should place order successfully', async () => {
      const mockOrderData = {
        id: 'order-1',
        side: 'b',
        quantity: 100,
        price: 50000,
        status: 'open'
      };

      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockResolvedValue(mockOrderData);

      const orderOptions = {
        symbol: 'BTCUSD',
        side: 'buy' as const,
        type: 'market' as const,
        size: 100
      };

      const result = await service.placeOrder(orderOptions);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 'order-1',
        symbol: 'BTCUSD',
        side: 'buy',
        type: 'market',
        size: 100,
        price: 50000,
        status: 'pending',
        filledSize: 0,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('closePosition', () => {
    it('should close position successfully', async () => {
      const mockCloseData = {
        id: 'close-1',
        price: 50000
      };

      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockResolvedValue(mockCloseData);

      const closeOptions = {
        positionId: 'pos-1',
        size: 100
      };

      const result = await service.closePosition(closeOptions);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: 'close-1',
        symbol: 'BTCUSD',
        side: 'sell',
        type: 'market',
        size: 100,
        status: 'filled',
        filledSize: 100,
        averagePrice: 50000,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });

  describe('getTrades', () => {
    it('should return trades data successfully', async () => {
      const mockTradesData = [
        {
          id: 'trade-1',
          side: 'b',
          quantity: 100,
          price: 50000,
          fee: 50,
          pl: 1000,
          created_at: '2023-01-01T00:00:00Z'
        }
      ];

      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockResolvedValue(mockTradesData);

      const result = await service.getTrades();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{
        id: 'trade-1',
        symbol: 'BTCUSD',
        side: 'buy',
        size: 100,
        price: 50000,
        fee: 50,
        pnl: 1000,
        timestamp: new Date('2023-01-01T00:00:00Z')
      }]);
    });
  });

  describe('getMarketData', () => {
    it('should return market data successfully', async () => {
      const mockMarketData = {
        lastPrice: 50000,
        index: 49950
      };

      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockResolvedValue(mockMarketData);

      const result = await service.getMarketData('BTCUSD');

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        symbol: 'BTCUSD',
        price: 50000,
        volume24h: 0,
        change24h: 0,
        changePercent24h: 0,
        high24h: 50000,
        low24h: 50000,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('getSystemStatus', () => {
    it('should return system status successfully', async () => {
      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockResolvedValue({});

      const result = await service.getSystemStatus();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        status: 'operational'
      });
    });

    it('should handle system errors gracefully', async () => {
      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockRejectedValue(new Error('System error'));

      const result = await service.getSystemStatus();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        status: 'degraded',
        message: 'System error'
      });
    });
  });

  describe('getSystemHealth', () => {
    it('should return healthy system status', async () => {
      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockResolvedValue({});

      const result = await service.getSystemHealth();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        healthy: true,
        services: {
          api: true,
          trading: true,
          market_data: true
        }
      });
    });

    it('should handle system errors gracefully', async () => {
      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockRejectedValue(new Error('System error'));

      const result = await service.getSystemHealth();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        healthy: false,
        services: {
          api: false,
          trading: false,
          market_data: false
        }
      });
    });
  });

  describe('getRateLimit', () => {
    it('should return rate limit info', async () => {
      const result = await service.getRateLimit();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        remaining: 100,
        reset: expect.any(Date)
      });
    });
  });

  describe('Legacy methods', () => {
    it('should support getUserPositions legacy method', async () => {
      const mockPositionsData = [
        {
          id: 'pos-1',
          side: 'b',
          quantity: 100,
          price: 50000,
          status: 'open'
        }
      ];

      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockResolvedValue(mockPositionsData);

      const result = await service.getUserPositions('running');

      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'pos-1',
          symbol: 'BTCUSD',
          side: 'long'
        })
      ]));
    });

    it('should support getTicker legacy method', async () => {
      const mockTickerData = {
        lastPrice: 50000,
        index: 49950
      };

      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockResolvedValue(mockTickerData);

      const result = await service.getTicker();

      expect(result).toEqual({
        symbol: 'BTCUSD',
        price: 50000,
        change24h: 0,
        changePercent24h: 0,
        volume24h: 0,
        high24h: 50000,
        low24h: 50000,
        timestamp: expect.any(Date)
      });
    });

    it('should support closePosition legacy method', async () => {
      const mockCloseData = {
        id: 'close-1',
        price: 50000
      };

      const makeRequestSpy = jest.spyOn(service as any, 'makeAuthenticatedRequest');
      makeRequestSpy.mockResolvedValue(mockCloseData);

      const result = await service.closePosition('pos-1');

      expect(result).toEqual({
        id: 'close-1',
        symbol: 'BTCUSD',
        side: 'sell',
        type: 'market',
        size: 0,
        status: 'filled',
        filledSize: 0,
        averagePrice: 50000,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      });
    });
  });
});
