import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TradingLoggerService } from '../services/trading-logger.service';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    tradingLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  })),
}));

describe('TradingLoggerService Tests', () => {
  let loggerService: TradingLoggerService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Prisma
    mockPrisma = {
      tradingLog: {
        create: jest.fn().mockImplementation((data: any) => {
          return Promise.resolve({
            id: 'log_123',
            ...data.data,
            timestamp: new Date(),
          });
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'log_1',
            userId: 'user_123',
            action: 'trade_created',
            tradeId: 'trade_123',
            market: 'btcusd',
            side: 'b',
            quantity: 100,
            price: 50000,
            leverage: 10,
            stoploss: 45000,
            takeprofit: 55000,
            reason: 'Test trade',
            metadata: {},
            timestamp: new Date(),
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            sessionId: 'session_456',
          },
          {
            id: 'log_2',
            userId: 'user_123',
            action: 'trade_closed',
            tradeId: 'trade_123',
            market: 'btcusd',
            side: 'b',
            quantity: 100,
            price: 52000,
            leverage: 10,
            stoploss: 45000,
            takeprofit: 55000,
            reason: 'Take profit hit',
            metadata: { pnl: 2000 },
            timestamp: new Date(),
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            sessionId: 'session_456',
          },
        ]),
      },
    };

    // Mock the PrismaClient constructor
    const { PrismaClient } = require('@prisma/client');
    PrismaClient.mockImplementation(() => mockPrisma);

    loggerService = new TradingLoggerService(
      'user_123',
      'session_456',
      '192.168.1.1',
      'Mozilla/5.0'
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Service Initialization', () => {
    it('should create service instance with correct parameters', () => {
      expect(loggerService).toBeDefined();
    });

    it('should have all required methods', () => {
      expect(typeof loggerService.logTradeCreation).toBe('function');
      expect(typeof loggerService.logTradeUpdate).toBe('function');
      expect(typeof loggerService.logTradeClosure).toBe('function');
      expect(typeof loggerService.logMarginCall).toBe('function');
      expect(typeof loggerService.logRiskAlert).toBe('function');
      expect(typeof loggerService.logApiError).toBe('function');
      expect(typeof loggerService.logAuthEvent).toBe('function');
      expect(typeof loggerService.getUserLogs).toBe('function');
      expect(typeof loggerService.getTradingStats).toBe('function');
    });
  });

  describe('Trade Creation Logging', () => {
    it('should log trade creation successfully', async () => {
      const tradeData = {
        tradeId: 'trade_123',
        market: 'btcusd',
        side: 'b' as const,
        quantity: 100,
        price: 50000,
        leverage: 10,
        stoploss: 45000,
        takeprofit: 55000,
        performanceMetrics: {
          executionTime: 150,
          apiLatency: 100,
          processingTime: 50,
          memoryUsage: 1024,
        },
        marketSnapshot: {
          price: 50000,
          volume24h: 2000000,
          priceChange24h: 0.02,
          high24h: 52000,
          low24h: 48000,
          volatility: 0.15,
          timestamp: new Date(),
        },
        riskMetrics: {
          portfolioExposure: 0.3,
          marginLevel: 0.8,
          unrealizedPnl: 1000,
          riskLevel: 'moderate' as const,
          positionCount: 2,
          totalMargin: 10000,
          availableMargin: 20000,
        },
      };

      mockPrisma.tradingLog.create.mockResolvedValue({
        id: 'log_123',
        userId: 'user_123',
        action: 'trade_created',
        tradeId: 'trade_123',
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        price: 50000,
        leverage: 10,
        stoploss: 45000,
        takeprofit: 55000,
        timestamp: new Date(),
      });

      await loggerService.logTradeCreation(tradeData);

      expect(mockPrisma.tradingLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          action: 'trade_created',
          tradeId: 'trade_123',
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          price: 50000,
          leverage: 10,
          stoploss: 45000,
          takeprofit: 55000,
          metadata: expect.objectContaining({
            performanceMetrics: tradeData.performanceMetrics,
            marketSnapshot: tradeData.marketSnapshot,
            riskMetrics: tradeData.riskMetrics,
            sessionId: 'session_456',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
          }),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          sessionId: 'session_456',
        }),
      });
    });

    it('should handle trade creation logging errors gracefully', async () => {
      const tradeData = {
        tradeId: 'trade_123',
        market: 'btcusd',
        side: 'b' as const,
        quantity: 100,
        price: 50000,
        leverage: 10,
      };

      mockPrisma.tradingLog.create.mockRejectedValue(new Error('Database error'));

      // Should not throw error
      await expect(loggerService.logTradeCreation(tradeData)).resolves.not.toThrow();
    });
  });

  describe('Trade Update Logging', () => {
    it('should log take profit update successfully', async () => {
      const tradeData = {
        tradeId: 'trade_123',
        updateType: 'takeprofit' as const,
        oldValue: 55000,
        newValue: 60000,
        reason: 'Market moved favorably',
        performanceMetrics: {
          executionTime: 100,
          apiLatency: 80,
          processingTime: 20,
          memoryUsage: 512,
        },
        marketSnapshot: {
          price: 52000,
          volume24h: 1500000,
          priceChange24h: 0.04,
          high24h: 53000,
          low24h: 51000,
          volatility: 0.12,
          timestamp: new Date(),
        },
      };

      mockPrisma.tradingLog.create.mockResolvedValue({
        id: 'log_456',
        userId: 'user_123',
        action: 'trade_updated',
        tradeId: 'trade_123',
        oldValue: 55000,
        newValue: 60000,
        reason: 'Market moved favorably',
        timestamp: new Date(),
      });

      await loggerService.logTradeUpdate(tradeData);

      expect(mockPrisma.tradingLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          action: 'trade_updated',
          tradeId: 'trade_123',
          oldValue: 55000,
          newValue: 60000,
          reason: 'Market moved favorably',
          metadata: expect.objectContaining({
            updateType: 'takeprofit',
            performanceMetrics: tradeData.performanceMetrics,
            marketSnapshot: tradeData.marketSnapshot,
          }),
        }),
      });
    });

    it('should log stop loss update successfully', async () => {
      const tradeData = {
        tradeId: 'trade_123',
        updateType: 'stoploss' as const,
        oldValue: 45000,
        newValue: 47000,
        reason: 'Tightening risk management',
      };

      mockPrisma.tradingLog.create.mockResolvedValue({
        id: 'log_789',
        userId: 'user_123',
        action: 'trade_updated',
        tradeId: 'trade_123',
        oldValue: 45000,
        newValue: 47000,
        reason: 'Tightening risk management',
        timestamp: new Date(),
      });

      await loggerService.logTradeUpdate(tradeData);

      expect(mockPrisma.tradingLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          action: 'trade_updated',
          tradeId: 'trade_123',
          oldValue: 45000,
          newValue: 47000,
          reason: 'Tightening risk management',
          metadata: expect.objectContaining({
            updateType: 'stoploss',
          }),
        }),
      });
    });
  });

  describe('Trade Closure Logging', () => {
    it('should log profitable trade closure successfully', async () => {
      const tradeData = {
        tradeId: 'trade_123',
        market: 'btcusd',
        side: 'b' as const,
        quantity: 100,
        entryPrice: 50000,
        exitPrice: 52000,
        pnl: 2000,
        reason: 'Take profit hit',
        performanceMetrics: {
          executionTime: 200,
          apiLatency: 150,
          processingTime: 50,
          memoryUsage: 2048,
        },
        marketSnapshot: {
          price: 52000,
          volume24h: 1800000,
          priceChange24h: 0.04,
          high24h: 52500,
          low24h: 51500,
          volatility: 0.10,
          timestamp: new Date(),
        },
      };

      mockPrisma.tradingLog.create.mockResolvedValue({
        id: 'log_closure',
        userId: 'user_123',
        action: 'trade_closed',
        tradeId: 'trade_123',
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        price: 52000,
        timestamp: new Date(),
      });

      await loggerService.logTradeClosure(tradeData);

      expect(mockPrisma.tradingLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          action: 'trade_closed',
          tradeId: 'trade_123',
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          price: 52000,
          metadata: expect.objectContaining({
            entryPrice: 50000,
            exitPrice: 52000,
            pnl: 2000,
            reason: 'Take profit hit',
            performanceMetrics: tradeData.performanceMetrics,
            marketSnapshot: tradeData.marketSnapshot,
          }),
        }),
      });
    });
  });

  describe('Margin Call Logging', () => {
    it('should log margin call warning successfully', async () => {
      const tradeData = {
        tradeId: 'trade_123',
        market: 'btcusd',
        marginLevel: 0.15,
        requiredMargin: 8000,
        availableMargin: 1200,
        action: 'warning' as const,
        performanceMetrics: {
          executionTime: 50,
          apiLatency: 30,
          processingTime: 20,
          memoryUsage: 256,
        },
        marketSnapshot: {
          price: 48000,
          volume24h: 2500000,
          priceChange24h: -0.08,
          high24h: 50000,
          low24h: 47000,
          volatility: 0.25,
          timestamp: new Date(),
        },
      };

      mockPrisma.tradingLog.create.mockResolvedValue({
        id: 'log_margin',
        userId: 'user_123',
        action: 'margin_call',
        tradeId: 'trade_123',
        market: 'btcusd',
        timestamp: new Date(),
      });

      await loggerService.logMarginCall(tradeData);

      expect(mockPrisma.tradingLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          action: 'margin_call',
          tradeId: 'trade_123',
          market: 'btcusd',
          metadata: expect.objectContaining({
            marginLevel: 0.15,
            requiredMargin: 8000,
            availableMargin: 1200,
            action: 'warning',
            performanceMetrics: tradeData.performanceMetrics,
            marketSnapshot: tradeData.marketSnapshot,
          }),
        }),
      });
    });
  });

  describe('Risk Alert Logging', () => {
    it('should log high exposure risk alert successfully', async () => {
      const tradeData = {
        alertType: 'high_exposure' as const,
        riskLevel: 'high' as const,
        message: 'Portfolio exposure exceeds 80%',
        riskMetrics: {
          portfolioExposure: 0.85,
          marginLevel: 0.6,
          unrealizedPnl: -2000,
          riskLevel: 'high' as const,
          positionCount: 5,
          totalMargin: 15000,
          availableMargin: 5000,
        },
        marketSnapshot: {
          price: 49000,
          volume24h: 3000000,
          priceChange24h: -0.12,
          high24h: 52000,
          low24h: 48000,
          volatility: 0.30,
          timestamp: new Date(),
        },
      };

      mockPrisma.tradingLog.create.mockResolvedValue({
        id: 'log_risk',
        userId: 'user_123',
        action: 'risk_alert',
        timestamp: new Date(),
      });

      await loggerService.logRiskAlert(tradeData);

      expect(mockPrisma.tradingLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          action: 'risk_alert',
          metadata: expect.objectContaining({
            alertType: 'high_exposure',
            riskLevel: 'high',
            message: 'Portfolio exposure exceeds 80%',
            riskMetrics: tradeData.riskMetrics,
            marketSnapshot: tradeData.marketSnapshot,
          }),
        }),
      });
    });
  });

  describe('API Error Logging', () => {
    it('should log API error successfully', async () => {
      const tradeData = {
        action: 'create_trade',
        error: 'Insufficient balance',
        errorCode: 'INSUFFICIENT_BALANCE',
        tradeId: 'trade_123',
        retryCount: 2,
        performanceMetrics: {
          executionTime: 5000,
          apiLatency: 4500,
          processingTime: 500,
          memoryUsage: 4096,
        },
      };

      mockPrisma.tradingLog.create.mockResolvedValue({
        id: 'log_error',
        userId: 'user_123',
        action: 'api_error',
        tradeId: 'trade_123',
        reason: 'Insufficient balance',
        timestamp: new Date(),
      });

      await loggerService.logApiError(tradeData);

      expect(mockPrisma.tradingLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          action: 'api_error',
          tradeId: 'trade_123',
          reason: 'Insufficient balance',
          metadata: expect.objectContaining({
            action: 'create_trade',
            error: 'Insufficient balance',
            errorCode: 'INSUFFICIENT_BALANCE',
            retryCount: 2,
            performanceMetrics: tradeData.performanceMetrics,
          }),
        }),
      });
    });
  });

  describe('Authentication Event Logging', () => {
    it('should log successful login successfully', async () => {
      const tradeData = {
        eventType: 'login' as const,
        success: true,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      };

      mockPrisma.tradingLog.create.mockResolvedValue({
        id: 'log_auth',
        userId: 'user_123',
        action: 'auth_event',
        timestamp: new Date(),
      });

      await loggerService.logAuthEvent(tradeData);

      expect(mockPrisma.tradingLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          action: 'auth_event',
          metadata: expect.objectContaining({
            eventType: 'login',
            success: true,
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          }),
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        }),
      });
    });

    it('should log failed login successfully', async () => {
      const tradeData = {
        eventType: 'login' as const,
        success: false,
        reason: 'Invalid credentials',
        ipAddress: '192.168.1.200',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      };

      mockPrisma.tradingLog.create.mockResolvedValue({
        id: 'log_auth_fail',
        userId: 'user_123',
        action: 'auth_event',
        timestamp: new Date(),
      });

      await loggerService.logAuthEvent(tradeData);

      expect(mockPrisma.tradingLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user_123',
          action: 'auth_event',
          metadata: expect.objectContaining({
            eventType: 'login',
            success: false,
            reason: 'Invalid credentials',
            ipAddress: '192.168.1.200',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          }),
          ipAddress: '192.168.1.200',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        }),
      });
    });
  });

  describe('Get User Logs', () => {
    it('should get user logs successfully', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          userId: 'user_123',
          action: 'trade_created',
          tradeId: 'trade_123',
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          price: 50000,
          leverage: 10,
          timestamp: new Date('2025-01-25T10:00:00Z'),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          sessionId: 'session_456',
        },
        {
          id: 'log_2',
          userId: 'user_123',
          action: 'trade_closed',
          tradeId: 'trade_123',
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          price: 52000,
          timestamp: new Date('2025-01-25T11:00:00Z'),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          sessionId: 'session_456',
        },
      ];

      mockPrisma.tradingLog.findMany.mockResolvedValue(mockLogs);

      const logs = await loggerService.getUserLogs();

      expect(logs).toHaveLength(2);
      expect(logs[0].action).toBe('trade_created');
      expect(logs[1].action).toBe('trade_closed');
      expect(mockPrisma.tradingLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 100,
      });
    });

    it('should get user logs with filters successfully', async () => {
      const startDate = new Date('2025-01-25T00:00:00Z');
      const endDate = new Date('2025-01-25T23:59:59Z');

      mockPrisma.tradingLog.findMany.mockResolvedValue([]);

      await loggerService.getUserLogs(startDate, endDate, 'trade_created', 50);

      expect(mockPrisma.tradingLog.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
          action: 'trade_created',
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 50,
      });
    });
  });

  describe('Get Trading Statistics', () => {
    it('should calculate trading statistics successfully', async () => {
      const mockLogs = [
        {
          action: 'trade_created',
          quantity: 100,
          market: 'btcusd',
          metadata: { performanceMetrics: { executionTime: 150 } },
        },
        {
          action: 'trade_created',
          quantity: 200,
          market: 'ethusd',
          metadata: { performanceMetrics: { executionTime: 200 } },
        },
        {
          action: 'trade_closed',
          metadata: { pnl: 1000 },
        },
        {
          action: 'trade_closed',
          metadata: { pnl: -500 },
        },
        {
          action: 'risk_alert',
        },
        {
          action: 'margin_call',
        },
      ];

      mockPrisma.tradingLog.findMany.mockResolvedValue(mockLogs);

      const stats = await loggerService.getTradingStats();

      expect(stats.totalTrades).toBe(2);
      expect(stats.successfulTrades).toBe(1);
      expect(stats.failedTrades).toBe(1);
      expect(stats.totalVolume).toBe(300);
      expect(stats.totalPnl).toBe(500);
      expect(stats.averageExecutionTime).toBe(175);
      expect(stats.riskAlerts).toBe(1);
      expect(stats.marginCalls).toBe(1);
    });

    it('should handle empty logs gracefully', async () => {
      mockPrisma.tradingLog.findMany.mockResolvedValue([]);

      const stats = await loggerService.getTradingStats();

      expect(stats.totalTrades).toBe(0);
      expect(stats.successfulTrades).toBe(0);
      expect(stats.failedTrades).toBe(0);
      expect(stats.totalVolume).toBe(0);
      expect(stats.totalPnl).toBe(0);
      expect(stats.averageExecutionTime).toBe(0);
      expect(stats.riskAlerts).toBe(0);
      expect(stats.marginCalls).toBe(0);
    });
  });
});
