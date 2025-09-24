import { describe, it, expect, beforeEach, jest } from '@jest/globals';
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

describe('TradingLoggerService Simple Tests', () => {
  let loggerService: TradingLoggerService;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get the mocked Prisma instance
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
    
    // Default mocks
    mockPrisma.tradingLog.create.mockResolvedValue({
      id: 'log_123',
      userId: 'user_123',
      action: 'trade_created',
      timestamp: new Date(),
    });
    
    mockPrisma.tradingLog.findMany.mockResolvedValue([
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
    ]);

    loggerService = new TradingLoggerService(
      'user_123',
      'session_456',
      '192.168.1.1',
      'Mozilla/5.0'
    );
  });

  it('should create service instance', () => {
    expect(loggerService).toBeInstanceOf(TradingLoggerService);
  });

  it('should have required methods', () => {
    expect(loggerService.logTradeCreation).toBeInstanceOf(Function);
    expect(loggerService.logTradeUpdate).toBeInstanceOf(Function);
    expect(loggerService.logTradeClosure).toBeInstanceOf(Function);
    expect(loggerService.logMarginCall).toBeInstanceOf(Function);
    expect(loggerService.logRiskAlert).toBeInstanceOf(Function);
    expect(loggerService.logApiError).toBeInstanceOf(Function);
    expect(loggerService.logAuthEvent).toBeInstanceOf(Function);
    expect(loggerService.getUserLogs).toBeInstanceOf(Function);
    expect(loggerService.getTradingStats).toBeInstanceOf(Function);
  });

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
      reason: 'Test trade',
      performanceMetrics: {
        executionTime: 150,
        processingTime: 50,
        memoryUsage: 1024,
        apiLatency: 100,
      },
      marketSnapshot: {
        price: 50000,
        priceChange24h: 0.02,
        volume24h: 2000000,
        high24h: 52000,
        low24h: 48000,
        volatility: 0.15,
        timestamp: new Date(),
      },
      riskMetrics: {
        totalMargin: 10000,
        availableMargin: 20000,
        marginLevel: 0.8,
        portfolioExposure: 0.3,
        positionCount: 2,
        unrealizedPnl: 1000,
        riskLevel: 'moderate' as const,
      },
    };

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
        reason: 'Test trade',
        metadata: expect.objectContaining({
          performanceMetrics: tradeData.performanceMetrics,
          marketSnapshot: tradeData.marketSnapshot,
          riskMetrics: tradeData.riskMetrics,
        }),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        sessionId: 'session_456',
      }),
    });
  });

  it('should log trade update successfully', async () => {
    const tradeData = {
      tradeId: 'trade_123',
      updateType: 'takeprofit' as const,
      oldValue: 55000,
      newValue: 60000,
      reason: 'Market moved favorably',
      performanceMetrics: {
        executionTime: 100,
        processingTime: 20,
        memoryUsage: 512,
        apiLatency: 80,
      },
      marketSnapshot: {
        price: 52000,
        priceChange24h: 0.04,
        volume24h: 1500000,
        high24h: 53000,
        low24h: 51000,
        volatility: 0.12,
        timestamp: new Date(),
      },
    };

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
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        sessionId: 'session_456',
      }),
    });
  });

  it('should get user logs successfully', async () => {
    const logs = await loggerService.getUserLogs();

    expect(logs).toBeDefined();
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]).toHaveProperty('id');
    expect(logs[0]).toHaveProperty('userId');
    expect(logs[0]).toHaveProperty('action');
  });

  it('should get trading statistics successfully', async () => {
    const stats = await loggerService.getTradingStats();

    expect(stats).toBeDefined();
    expect(stats).toHaveProperty('totalTrades');
    expect(stats).toHaveProperty('totalVolume');
    expect(stats).toHaveProperty('averageExecutionTime');
    expect(stats).toHaveProperty('successRate');
  });

  it('should handle empty logs gracefully', async () => {
    mockPrisma.tradingLog.findMany.mockResolvedValueOnce([]);
    
    const stats = await loggerService.getTradingStats();

    expect(stats.totalTrades).toBe(0);
    expect(stats.totalVolume).toBe(0);
    expect(stats.averageExecutionTime).toBe(0);
    expect(stats.successfulTrades).toBe(0);
  });
});
