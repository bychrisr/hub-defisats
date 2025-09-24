import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PortfolioTrackingService } from '../services/portfolio-tracking.service';
import { LNMarketsService } from '../services/lnmarkets.service';
import { TradingLoggerService } from '../services/trading-logger.service';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    tradingLog: {
      findMany: jest.fn(),
    },
  })),
}));

describe('PortfolioTrackingService Tests', () => {
  let portfolioService: PortfolioTrackingService;
  let mockLNMarketsService: any;
  let mockLoggerService: any;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock LNMarketsService
    mockLNMarketsService = {
      getBalance: jest.fn(),
      getRunningTrades: jest.fn(),
    };

    // Mock TradingLoggerService
    mockLoggerService = {
      logRiskAlert: jest.fn(),
    };

    // Mock Prisma
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();

    portfolioService = new PortfolioTrackingService(
      mockLNMarketsService,
      mockLoggerService
    );

    // Default mocks
    mockLNMarketsService.getBalance.mockResolvedValue({
      balance: 100000,
      margin: 20000,
      available_margin: 80000,
      marginLevel: 0.8,
    });

    mockLNMarketsService.getRunningTrades.mockResolvedValue([
      {
        id: 'position_1',
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        entryPrice: 50000,
        currentPrice: 52000,
        leverage: 5,
        stoploss: 45000,
        takeprofit: 55000,
      },
      {
        id: 'position_2',
        market: 'ethusd',
        side: 's',
        quantity: 50,
        entryPrice: 3000,
        currentPrice: 2900,
        leverage: 3,
        stoploss: 3200,
        takeprofit: 2800,
      },
    ]);

    mockPrisma.tradingLog.findMany.mockResolvedValue([
      {
        id: 'log_1',
        userId: 'user_123',
        action: 'trade_created',
        tradeId: 'trade_1',
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        price: 50000,
        leverage: 5,
        timestamp: new Date('2025-01-01'),
      },
      {
        id: 'log_2',
        userId: 'user_123',
        action: 'trade_closed',
        tradeId: 'trade_1',
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        price: 52000,
        leverage: 5,
        metadata: { pnl: 2000 },
        timestamp: new Date('2025-01-02'),
      },
    ]);
  });

  describe('getActivePositions', () => {
    it('should return active positions with calculated metrics', async () => {
      const positions = await portfolioService.getActivePositions('user_123');

      expect(positions).toHaveLength(2);
      
      // Verificar primeira posição (BTC)
      const btcPosition = positions.find(pos => pos.market === 'btcusd');
      expect(btcPosition).toBeDefined();
      expect(btcPosition?.unrealizedPnl).toBe(200000); // (52000 - 50000) * 100
      expect(btcPosition?.unrealizedPnlPercentage).toBeCloseTo(4, 1); // 200000 / 5000000 * 100
      expect(btcPosition?.marginUsed).toBe(1000000); // 100 * 50000 / 5
      
      // Verificar segunda posição (ETH) - posição vendida (short)
      const ethPosition = positions.find(pos => pos.market === 'ethusd');
      expect(ethPosition).toBeDefined();
      expect(ethPosition?.unrealizedPnl).toBe(-5000); // (2900 - 3000) * 50 (short position)
      expect(ethPosition?.unrealizedPnlPercentage).toBeCloseTo(-3.4, 1); // -5000 / 150000 * 100
      expect(ethPosition?.marginUsed).toBe(50000); // 50 * 3000 / 3
    });

    it('should handle empty positions', async () => {
      mockLNMarketsService.getRunningTrades.mockResolvedValueOnce([]);
      
      const positions = await portfolioService.getActivePositions('user_123');
      expect(positions).toHaveLength(0);
    });
  });

  describe('calculatePortfolioMetrics', () => {
    it('should calculate portfolio metrics correctly', async () => {
      const metrics = await portfolioService.calculatePortfolioMetrics('user_123');

      expect(metrics.totalValue).toBe(100000);
      expect(metrics.totalMargin).toBe(1050000); // 1000000 + 50000
      expect(metrics.availableMargin).toBe(80000);
      expect(metrics.totalExposure).toBe(5345000); // 100*52000 + 50*2900
      expect(metrics.totalUnrealizedPnl).toBe(195000); // 200000 + (-5000)
      expect(metrics.positionCount).toBe(2);
      expect(metrics.marginLevel).toBe(0.8);
      expect(metrics.averageLeverage).toBe(4); // (5 + 3) / 2
      expect(['low', 'moderate', 'high', 'critical']).toContain(metrics.riskLevel);
    });

    it('should handle high risk scenarios', async () => {
      mockLNMarketsService.getBalance.mockResolvedValueOnce({
        balance: 100000,
        margin: 5000,
        available_margin: 5000,
        marginLevel: 0.1,
      });

      const metrics = await portfolioService.calculatePortfolioMetrics('user_123');
      expect(metrics.riskLevel).toBe('critical');
    });
  });

  describe('calculateMarketExposure', () => {
    it('should calculate market exposure correctly', async () => {
      const exposure = await portfolioService.calculateMarketExposure('user_123');

      expect(exposure).toHaveLength(2);
      
      // Verificar exposição BTC
      const btcExposure = exposure.find(exp => exp.market === 'btcusd');
      expect(btcExposure).toBeDefined();
      expect(btcExposure?.exposure).toBe(5200000); // 100 * 52000
      expect(btcExposure?.positionCount).toBe(1);
      expect(btcExposure?.averageLeverage).toBe(5);
      expect(btcExposure?.unrealizedPnl).toBe(200000);
      
      // Verificar exposição ETH
      const ethExposure = exposure.find(exp => exp.market === 'ethusd');
      expect(ethExposure).toBeDefined();
      expect(ethExposure?.exposure).toBe(145000); // 50 * 2900
      expect(ethExposure?.positionCount).toBe(1);
      expect(ethExposure?.averageLeverage).toBe(3);
      expect(ethExposure?.unrealizedPnl).toBe(-5000);
    });

    it('should handle single market exposure', async () => {
      mockLNMarketsService.getRunningTrades.mockResolvedValueOnce([
        {
          id: 'position_1',
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          entryPrice: 50000,
          currentPrice: 52000,
          leverage: 5,
        },
      ]);

      const exposure = await portfolioService.calculateMarketExposure('user_123');
      expect(exposure).toHaveLength(1);
      expect(exposure[0].exposurePercentage).toBe(100);
    });
  });

  describe('calculatePerformanceMetrics', () => {
    it('should calculate performance metrics correctly', async () => {
      const metrics = await portfolioService.calculatePerformanceMetrics('user_123', 30);

      expect(metrics.totalTrades).toBe(1);
      expect(metrics.winningTrades).toBe(1);
      expect(metrics.losingTrades).toBe(0);
      expect(metrics.totalVolume).toBeGreaterThan(0);
      expect(metrics.totalPnl).toBe(2000);
      expect(metrics.averageTradeSize).toBeGreaterThan(0);
      expect(metrics.averageHoldingTime).toBeGreaterThan(0);
      expect(metrics.bestTrade).toBe(2000);
      expect(metrics.worstTrade).toBe(0);
      expect(metrics.consecutiveWins).toBeGreaterThanOrEqual(0);
      expect(metrics.consecutiveLosses).toBe(0);
      expect(Array.isArray(metrics.monthlyReturns)).toBe(true);
      expect(metrics.volatility).toBeGreaterThanOrEqual(0);
      expect(metrics.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(metrics.sharpeRatio).toBeGreaterThanOrEqual(0);
      expect(metrics.calmarRatio).toBeGreaterThanOrEqual(0);
      expect(metrics.sortinoRatio).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty trading history', async () => {
      mockPrisma.tradingLog.findMany.mockResolvedValueOnce([]);
      
      const metrics = await portfolioService.calculatePerformanceMetrics('user_123', 30);
      expect(metrics.totalTrades).toBe(0);
      expect(metrics.winningTrades).toBe(0);
      expect(metrics.losingTrades).toBe(0);
      expect(metrics.totalVolume).toBe(0);
      expect(metrics.totalPnl).toBe(0);
    });
  });

  describe('generatePerformanceReport', () => {
    it('should generate complete performance report', async () => {
      const report = await portfolioService.generatePerformanceReport('user_123', 30);

      expect(report.portfolioMetrics).toBeDefined();
      expect(report.marketExposure).toBeDefined();
      expect(report.performanceMetrics).toBeDefined();
      expect(report.summary).toBeDefined();
      
      expect(report.summary.totalReturn).toBeDefined();
      expect(report.summary.riskAdjustedReturn).toBeDefined();
      expect(report.summary.riskLevel).toBeDefined();
      expect(report.summary.recommendation).toBeDefined();
    });

    it('should provide appropriate recommendations', async () => {
      // Teste para cenário de alto risco
      mockLNMarketsService.getBalance.mockResolvedValueOnce({
        balance: 100000,
        margin: 5000,
        available_margin: 5000,
        marginLevel: 0.05,
      });

      const report = await portfolioService.generatePerformanceReport('user_123', 30);
      expect(report.summary.recommendation).toContain('Reduce exposure');
    });
  });

  describe('utility methods', () => {
    it('should calculate diversification score correctly', async () => {
      const positions = await portfolioService.getActivePositions('user_123');
      
      // Com 2 posições em mercados diferentes, o score deve ser > 0
      const metrics = await portfolioService.calculatePortfolioMetrics('user_123');
      expect(metrics.diversificationScore).toBeGreaterThan(0);
    });

    it('should handle single position diversification', async () => {
      mockLNMarketsService.getRunningTrades.mockResolvedValueOnce([
        {
          id: 'position_1',
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          entryPrice: 50000,
          currentPrice: 52000,
          leverage: 5,
        },
      ]);

      const metrics = await portfolioService.calculatePortfolioMetrics('user_123');
      expect(metrics.diversificationScore).toBe(0);
    });
  });
});
