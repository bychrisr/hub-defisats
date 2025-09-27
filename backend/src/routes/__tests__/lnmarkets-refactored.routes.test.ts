/**
 * Integration tests for LN Markets Refactored Routes
 */

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';
import { lnmarketsRefactoredRoutes } from '../lnmarkets-refactored.routes';
import { ExchangeServiceFactory } from '../../services/ExchangeServiceFactory';
import { LNMarketsApiService } from '../../services/LNMarketsApiService';

// Mock dependencies
jest.mock('../../services/ExchangeServiceFactory');
jest.mock('../../services/LNMarketsApiService');

const mockExchangeServiceFactory = ExchangeServiceFactory as jest.Mocked<typeof ExchangeServiceFactory>;
const mockLNMarketsApiService = LNMarketsApiService as jest.Mocked<typeof LNMarketsApiService>;

describe('LN Markets Refactored Routes', () => {
  let fastify: FastifyInstance;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockLogger: jest.Mocked<Logger>;
  let mockExchangeService: jest.Mocked<any>;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Prisma
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    } as any;

    // Mock Logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as any;

    // Mock Exchange Service
    mockExchangeService = {
      getMarketData: jest.fn(),
      getTicker: jest.fn(),
      getPositions: jest.fn(),
      placeOrder: jest.fn(),
      closePosition: jest.fn(),
      addMargin: jest.fn(),
      reducePosition: jest.fn(),
      updateTakeProfit: jest.fn(),
      updateStopLoss: jest.fn(),
      getUserProfile: jest.fn(),
      getUserBalance: jest.fn(),
      getUserHistory: jest.fn(),
      getUserOrders: jest.fn(),
      getUserDeposits: jest.fn(),
      getUserWithdrawals: jest.fn(),
      cancelAllTrades: jest.fn(),
      closeAllTrades: jest.fn(),
      validateCredentials: jest.fn(),
      getSystemStatus: jest.fn(),
      getSystemHealth: jest.fn(),
    };

    // Mock ExchangeServiceFactory
    mockExchangeServiceFactory.createService.mockReturnValue(mockExchangeService);

    // Create Fastify instance
    fastify = require('fastify')({
      logger: false,
    });

    // Register mock dependencies
    fastify.decorate('prisma', mockPrisma);
    fastify.decorate('log', mockLogger);
    fastify.decorate('authenticate', jest.fn((request, reply, done) => {
      request.user = { id: 'test-user-id' };
      done();
    }));

    // Register routes
    await fastify.register(lnmarketsRefactoredRoutes);
  });

  afterEach(async () => {
    await fastify.close();
  });

  describe('Market Routes', () => {
    it('should get market data', async () => {
      const mockMarketData = { price: 50000, volume: 1000 };
      mockExchangeService.getMarketData.mockResolvedValue({
        success: true,
        data: mockMarketData
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/market/data'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockMarketData,
        message: 'Market data retrieved successfully'
      });
    });

    it('should get futures data', async () => {
      const mockFuturesData = { futures: [] };
      mockExchangeService.getMarketData.mockResolvedValue({
        success: true,
        data: mockFuturesData
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/market/futures'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockFuturesData,
        message: 'Futures data retrieved successfully'
      });
    });

    it('should get options data', async () => {
      const mockOptionsData = { options: [] };
      mockExchangeService.getMarketData.mockResolvedValue({
        success: true,
        data: mockOptionsData
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/market/options'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockOptionsData,
        message: 'Options data retrieved successfully'
      });
    });

    it('should get ticker data', async () => {
      const mockTickerData = { lastPrice: 50000, bid: 49900, ask: 50100 };
      mockExchangeService.getTicker.mockResolvedValue({
        success: true,
        data: mockTickerData
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/market/ticker'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockTickerData,
        message: 'Ticker data retrieved successfully'
      });
    });

    it('should get market history', async () => {
      const mockHistoryData = { history: [] };
      mockExchangeService.getMarketHistory.mockResolvedValue({
        success: true,
        data: mockHistoryData
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/market/history?limit=100&offset=0'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockHistoryData,
        message: 'Market history retrieved successfully'
      });
    });

    it('should get system status', async () => {
      const mockStatusData = { status: 'online' };
      mockExchangeService.getSystemStatus.mockResolvedValue({
        success: true,
        data: mockStatusData
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/market/status'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockStatusData,
        message: 'System status retrieved successfully'
      });
    });

    it('should get system health', async () => {
      const mockHealthData = { health: 'good' };
      mockExchangeService.getSystemHealth.mockResolvedValue({
        success: true,
        data: mockHealthData
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/market/health'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockHealthData,
        message: 'System health retrieved successfully'
      });
    });
  });

  describe('User Routes', () => {
    it('should get user profile', async () => {
      const mockProfileData = { uid: 'user123', username: 'testuser' };
      mockExchangeService.getUserProfile.mockResolvedValue({
        success: true,
        data: mockProfileData
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/user/profile'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockProfileData,
        message: 'User profile retrieved successfully'
      });
    });

    it('should get user balance', async () => {
      const mockBalanceData = { balance: 1000, currency: 'USD' };
      mockExchangeService.getUserBalance.mockResolvedValue({
        success: true,
        data: mockBalanceData
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/user/balance'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockBalanceData,
        message: 'User balance retrieved successfully'
      });
    });

    it('should get user history', async () => {
      const mockHistoryData = { history: [] };
      mockExchangeService.getUserHistory.mockResolvedValue({
        success: true,
        data: mockHistoryData
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/user/history?limit=100&offset=0'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockHistoryData,
        message: 'User history retrieved successfully'
      });
    });

    it('should get user orders', async () => {
      const mockOrdersData = { orders: [] };
      mockExchangeService.getUserOrders.mockResolvedValue({
        success: true,
        data: mockOrdersData
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/user/orders?limit=100&offset=0'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockOrdersData,
        message: 'User orders retrieved successfully'
      });
    });

    it('should get user deposits', async () => {
      const mockDepositsData = { deposits: [] };
      mockExchangeService.getUserDeposits.mockResolvedValue({
        success: true,
        data: mockDepositsData
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/user/deposits?limit=100&offset=0'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockDepositsData,
        message: 'User deposits retrieved successfully'
      });
    });

    it('should get user withdrawals', async () => {
      const mockWithdrawalsData = { withdrawals: [] };
      mockExchangeService.getUserWithdrawals.mockResolvedValue({
        success: true,
        data: mockWithdrawalsData
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/user/withdrawals?limit=100&offset=0'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockWithdrawalsData,
        message: 'User withdrawals retrieved successfully'
      });
    });
  });

  describe('Trading Routes', () => {
    it('should get positions', async () => {
      const mockPositionsData = { positions: [] };
      mockExchangeService.getPositions.mockResolvedValue({
        success: true,
        data: mockPositionsData
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/trading/positions'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockPositionsData,
        message: 'Positions retrieved successfully'
      });
    });

    it('should place order', async () => {
      const mockOrderData = { id: 'order123', status: 'pending' };
      const orderPayload = { quantity: 100, side: 'buy' };
      mockExchangeService.placeOrder.mockResolvedValue({
        success: true,
        data: mockOrderData
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/trading/order',
        payload: orderPayload
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockOrderData,
        message: 'Order placed successfully'
      });
    });

    it('should close position', async () => {
      const mockCloseData = { success: true };
      const tradeId = 'trade123';
      mockExchangeService.closePosition.mockResolvedValue({
        success: true,
        data: mockCloseData
      });

      const response = await fastify.inject({
        method: 'POST',
        url: `/trading/position/${tradeId}/close`
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockCloseData,
        message: 'Position closed successfully'
      });
    });

    it('should add margin', async () => {
      const mockMarginData = { success: true };
      const tradeId = 'trade123';
      const marginPayload = { amount: 100 };
      mockExchangeService.addMargin.mockResolvedValue({
        success: true,
        data: mockMarginData
      });

      const response = await fastify.inject({
        method: 'POST',
        url: `/trading/position/${tradeId}/margin`,
        payload: marginPayload
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockMarginData,
        message: 'Margin added successfully'
      });
    });

    it('should reduce position', async () => {
      const mockReduceData = { success: true };
      const tradeId = 'trade123';
      const reducePayload = { quantity: 50 };
      mockExchangeService.reducePosition.mockResolvedValue({
        success: true,
        data: mockReduceData
      });

      const response = await fastify.inject({
        method: 'POST',
        url: `/trading/position/${tradeId}/reduce`,
        payload: reducePayload
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockReduceData,
        message: 'Position reduced successfully'
      });
    });

    it('should update take profit', async () => {
      const mockUpdateData = { success: true };
      const tradeId = 'trade123';
      const takeProfitPayload = { takeProfit: 55000 };
      mockExchangeService.updateTakeProfit.mockResolvedValue({
        success: true,
        data: mockUpdateData
      });

      const response = await fastify.inject({
        method: 'PUT',
        url: `/trading/position/${tradeId}/take-profit`,
        payload: takeProfitPayload
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockUpdateData,
        message: 'Take profit updated successfully'
      });
    });

    it('should update stop loss', async () => {
      const mockUpdateData = { success: true };
      const tradeId = 'trade123';
      const stopLossPayload = { stopLoss: 45000 };
      mockExchangeService.updateStopLoss.mockResolvedValue({
        success: true,
        data: mockUpdateData
      });

      const response = await fastify.inject({
        method: 'PUT',
        url: `/trading/position/${tradeId}/stop-loss`,
        payload: stopLossPayload
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockUpdateData,
        message: 'Stop loss updated successfully'
      });
    });

    it('should cancel all trades', async () => {
      const mockCancelData = { success: true };
      mockExchangeService.cancelAllTrades.mockResolvedValue({
        success: true,
        data: mockCancelData
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/trading/cancel-all'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockCancelData,
        message: 'All trades cancelled successfully'
      });
    });

    it('should close all trades', async () => {
      const mockCloseData = { success: true };
      mockExchangeService.closeAllTrades.mockResolvedValue({
        success: true,
        data: mockCloseData
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/trading/close-all'
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        success: true,
        data: mockCloseData,
        message: 'All trades closed successfully'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      mockExchangeService.getMarketData.mockResolvedValue({
        success: false,
        error: 'Service unavailable'
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/market/data'
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        success: false,
        error: 'MARKET_DATA_FETCH_FAILED',
        message: 'Service unavailable'
      });
    });

    it('should handle missing trade ID', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/trading/position//close'
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        success: false,
        error: 'MISSING_TRADE_ID',
        message: 'Trade ID is required'
      });
    });

    it('should handle invalid order data', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/trading/order',
        payload: null
      });

      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        success: false,
        error: 'INVALID_ORDER_DATA',
        message: 'Order data is required'
      });
    });
  });
});
