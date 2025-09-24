import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RiskManagementService, RiskLimits } from '../services/risk-management.service';
import { LNMarketsService } from '../services/lnmarkets.service';
import { TradingLoggerService } from '../services/trading-logger.service';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  })),
}));

describe('RiskManagementService Tests', () => {
  let riskService: RiskManagementService;
  let mockLNMarketsService: any;
  let mockLoggerService: any;
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock LNMarketsService
    mockLNMarketsService = {
      getBalance: jest.fn(),
      getRunningTrades: jest.fn(),
      closePosition: jest.fn(),
    };

    // Mock TradingLoggerService
    mockLoggerService = {
      logRiskAlert: jest.fn(),
    };

    // Mock Prisma
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();

    riskService = new RiskManagementService(
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
      },
    ]);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user_123',
      risk_profile: 'moderate',
    });

    mockPrisma.user.update.mockResolvedValue({});
  });

  describe('calculateRiskMetrics', () => {
    it('should calculate risk metrics correctly', async () => {
      const metrics = await riskService.calculateRiskMetrics('user_123');

      expect(metrics).toBeDefined();
      expect(metrics.currentExposure).toBeGreaterThan(0);
      expect(metrics.dailyPnL).toBeGreaterThan(0);
      expect(metrics.portfolioValue).toBe(100000);
      expect(metrics.marginLevel).toBe(0.8);
      expect(metrics.positionCount).toBe(1);
      expect(['low', 'moderate', 'high', 'critical']).toContain(metrics.riskLevel);
    });

    it('should handle high exposure correctly', async () => {
      mockLNMarketsService.getRunningTrades.mockResolvedValue([
        {
          id: 'position_1',
          market: 'btcusd',
          side: 'b',
          quantity: 2000,
          entryPrice: 50000,
          currentPrice: 52000,
          leverage: 5,
        },
      ]);

      const metrics = await riskService.calculateRiskMetrics('user_123');
      expect(metrics.riskLevel).toBe('critical');
    });

    it('should handle low margin correctly', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 5000,
        available_margin: 5000,
        marginLevel: 0.1,
      });

      const metrics = await riskService.calculateRiskMetrics('user_123');
      expect(metrics.riskLevel).toBe('critical');
    });
  });

  describe('validateTradeRisk', () => {
    const riskLimits: RiskLimits = {
      maxExposure: 0.5,
      maxDailyLoss: 10000,
      maxPositionSize: 100000,
      maxLeverage: 5,
      stopLossThreshold: 0.1,
    };

    it('should validate safe trade', async () => {
      // Mock para posição menor para evitar exposição alta
      mockLNMarketsService.getRunningTrades.mockResolvedValueOnce([
        {
          id: 'position_1',
          market: 'btcusd',
          side: 'b',
          quantity: 10,
          entryPrice: 50000,
          currentPrice: 52000,
          leverage: 5,
        },
      ]);

      const tradeParams = {
        quantity: 50,
        price: 50000,
        leverage: 3,
        side: 'b' as const,
      };

      const result = await riskService.validateTradeRisk('user_123', tradeParams, riskLimits);
      expect(result.isValid).toBe(true);
      expect(result.alerts).toHaveLength(0);
    });

    it('should block trade exceeding exposure limit', async () => {
      const tradeParams = {
        quantity: 2000,
        price: 50000,
        leverage: 3,
        side: 'b' as const,
      };

      const result = await riskService.validateTradeRisk('user_123', tradeParams, riskLimits);
      expect(result.isValid).toBe(false);
      expect(result.alerts.some(alert => alert.type === 'exposure_limit')).toBe(true);
    });

    it('should block trade exceeding position size limit', async () => {
      const tradeParams = {
        quantity: 3000,
        price: 50000,
        leverage: 3,
        side: 'b' as const,
      };

      const result = await riskService.validateTradeRisk('user_123', tradeParams, riskLimits);
      expect(result.isValid).toBe(false);
      expect(result.alerts.some(alert => alert.type === 'position_size')).toBe(true);
    });

    it('should block trade exceeding leverage limit', async () => {
      const tradeParams = {
        quantity: 100,
        price: 50000,
        leverage: 10,
        side: 'b' as const,
      };

      const result = await riskService.validateTradeRisk('user_123', tradeParams, riskLimits);
      expect(result.isValid).toBe(false);
      expect(result.alerts.some(alert => alert.type === 'leverage')).toBe(true);
    });

    it('should block trade exceeding daily loss limit', async () => {
      mockLNMarketsService.getRunningTrades.mockResolvedValueOnce([
        {
          id: 'position_1',
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          entryPrice: 50000,
          currentPrice: 40000, // Perda de 1000000 sats
          leverage: 5,
        },
      ]);

      const tradeParams = {
        quantity: 100,
        price: 50000,
        leverage: 3,
        side: 'b' as const,
      };

      const result = await riskService.validateTradeRisk('user_123', tradeParams, riskLimits);
      expect(result.isValid).toBe(false);
      expect(result.alerts.some(alert => alert.type === 'daily_loss')).toBe(true);
    });

    it('should block trade with low margin', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 5000,
        available_margin: 5000,
        marginLevel: 0.05,
      });

      const tradeParams = {
        quantity: 100,
        price: 50000,
        leverage: 3,
        side: 'b' as const,
      };

      const result = await riskService.validateTradeRisk('user_123', tradeParams, riskLimits);
      expect(result.isValid).toBe(false);
      expect(result.alerts.some(alert => alert.type === 'margin_call')).toBe(true);
    });
  });

  describe('monitorPositions', () => {
    it('should execute stop loss when threshold is reached', async () => {
      mockLNMarketsService.getRunningTrades.mockResolvedValue([
        {
          id: 'position_1',
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          entryPrice: 50000,
          currentPrice: 45000, // 10% de perda
          leverage: 5,
        },
      ]);

      const riskLimits: RiskLimits = {
        maxExposure: 0.5,
        maxDailyLoss: 10000,
        maxPositionSize: 100000,
        maxLeverage: 5,
        stopLossThreshold: 0.1,
      };

      await riskService.monitorPositions('user_123', riskLimits);

      expect(mockLNMarketsService.closePosition).toHaveBeenCalledWith('position_1');
      expect(mockLoggerService.logRiskAlert).toHaveBeenCalled();
    });

    it('should not execute stop loss when threshold is not reached', async () => {
      mockLNMarketsService.getRunningTrades.mockResolvedValue([
        {
          id: 'position_1',
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          entryPrice: 50000,
          currentPrice: 49000, // 2% de perda
          leverage: 5,
        },
      ]);

      const riskLimits: RiskLimits = {
        maxExposure: 0.5,
        maxDailyLoss: 10000,
        maxPositionSize: 100000,
        maxLeverage: 5,
        stopLossThreshold: 0.1,
      };

      await riskService.monitorPositions('user_123', riskLimits);

      expect(mockLNMarketsService.closePosition).not.toHaveBeenCalled();
    });
  });

  describe('reduceExposure', () => {
    it('should reduce exposure by closing positions', async () => {
      mockLNMarketsService.getRunningTrades.mockResolvedValue([
        {
          id: 'position_1',
          market: 'btcusd',
          side: 'b',
          quantity: 1000,
          entryPrice: 50000,
          currentPrice: 45000,
          leverage: 5,
        },
        {
          id: 'position_2',
          market: 'btcusd',
          side: 'b',
          quantity: 500,
          entryPrice: 50000,
          currentPrice: 52000,
          leverage: 5,
        },
      ]);

      const riskLimits: RiskLimits = {
        maxExposure: 0.3,
        maxDailyLoss: 10000,
        maxPositionSize: 100000,
        maxLeverage: 5,
        stopLossThreshold: 0.1,
      };

      await riskService.reduceExposure('user_123', riskLimits);

      expect(mockLNMarketsService.closePosition).toHaveBeenCalled();
    });

    it('should not reduce exposure when within limits', async () => {
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

      const riskLimits: RiskLimits = {
        maxExposure: 0.8,
        maxDailyLoss: 10000,
        maxPositionSize: 100000,
        maxLeverage: 5,
        stopLossThreshold: 0.1,
      };

      await riskService.reduceExposure('user_123', riskLimits);

      expect(mockLNMarketsService.closePosition).not.toHaveBeenCalled();
    });
  });

  describe('getDefaultRiskLimits', () => {
    it('should return conservative limits for conservative profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user_123',
        risk_profile: 'conservative',
      });

      const limits = await riskService.getDefaultRiskLimits('user_123');
      expect(limits.maxExposure).toBe(0.3);
      expect(limits.maxLeverage).toBe(3);
    });

    it('should return moderate limits for moderate profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user_123',
        risk_profile: 'moderate',
      });

      const limits = await riskService.getDefaultRiskLimits('user_123');
      expect(limits.maxExposure).toBe(0.5);
      expect(limits.maxLeverage).toBe(5);
    });

    it('should return aggressive limits for aggressive profile', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user_123',
        risk_profile: 'aggressive',
      });

      const limits = await riskService.getDefaultRiskLimits('user_123');
      expect(limits.maxExposure).toBe(0.7);
      expect(limits.maxLeverage).toBe(10);
    });

    it('should return moderate limits as default', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const limits = await riskService.getDefaultRiskLimits('user_123');
      expect(limits.maxExposure).toBe(0.5);
      expect(limits.maxLeverage).toBe(5);
    });
  });

  describe('generateRiskAlerts', () => {
    it('should generate exposure warning alert', async () => {
      mockLNMarketsService.getRunningTrades.mockResolvedValue([
        {
          id: 'position_1',
          market: 'btcusd',
          side: 'b',
          quantity: 800,
          entryPrice: 50000,
          currentPrice: 52000,
          leverage: 5,
        },
      ]);

      const alerts = await riskService.generateRiskAlerts('user_123');
      expect(alerts.some(alert => alert.type === 'exposure_limit')).toBe(true);
    });

    it('should generate daily loss warning alert', async () => {
      mockLNMarketsService.getRunningTrades.mockResolvedValue([
        {
          id: 'position_1',
          market: 'btcusd',
          side: 'b',
          quantity: 100,
          entryPrice: 50000,
          currentPrice: 40000, // Perda de 1000000 sats
          leverage: 5,
        },
      ]);

      const alerts = await riskService.generateRiskAlerts('user_123');
      expect(alerts.some(alert => alert.type === 'daily_loss')).toBe(true);
    });

    it('should generate margin call alert', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 10000,
        available_margin: 10000,
        marginLevel: 0.15,
      });

      const alerts = await riskService.generateRiskAlerts('user_123');
      expect(alerts.some(alert => alert.type === 'margin_call')).toBe(true);
    });

    it('should return empty array when no alerts needed', async () => {
      mockLNMarketsService.getRunningTrades.mockResolvedValueOnce([
        {
          id: 'position_1',
          market: 'btcusd',
          side: 'b',
          quantity: 10,
          entryPrice: 50000,
          currentPrice: 52000,
          leverage: 3,
        },
      ]);

      const alerts = await riskService.generateRiskAlerts('user_123');
      expect(alerts).toHaveLength(0);
    });
  });
});
