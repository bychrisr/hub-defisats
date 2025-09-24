import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RiskMetricsService } from '../services/risk-metrics.service';
import { TradingLoggerService } from '../services/trading-logger.service';

// Mock HistoricalDataService
jest.mock('../services/historical-data.service', () => ({
  HistoricalDataService: jest.fn().mockImplementation(() => ({
    getHistoricalData: jest.fn(),
  })),
}));

describe('RiskMetricsService Tests', () => {
  let riskMetricsService: RiskMetricsService;
  let mockLoggerService: any;
  let mockHistoricalDataService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock TradingLoggerService
    mockLoggerService = {
      logRiskAlert: jest.fn(),
    };

    // Mock HistoricalDataService
    const { HistoricalDataService } = require('../services/historical-data.service');
    mockHistoricalDataService = new HistoricalDataService();

    riskMetricsService = new RiskMetricsService(mockLoggerService);

    // Replace the historical data service instance
    (riskMetricsService as any).historicalDataService = mockHistoricalDataService;

    // Default mock for historical data
    mockHistoricalDataService.getHistoricalData.mockResolvedValue([
      {
        timestamp: new Date('2025-01-01T00:00:00Z'),
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500,
        volume: 1000000,
        market: 'btcusd',
      },
      {
        timestamp: new Date('2025-01-02T00:00:00Z'),
        open: 50500,
        high: 51500,
        low: 49500,
        close: 51000,
        volume: 1200000,
        market: 'btcusd',
      },
      // Add more data points for testing
      ...Array.from({ length: 98 }, (_, i) => ({
        timestamp: new Date(`2025-01-${String(i + 3).padStart(2, '0')}T00:00:00Z`),
        open: 50000 + i * 10,
        high: 51000 + i * 10,
        low: 49000 + i * 10,
        close: 50500 + i * 10,
        volume: 1000000 + i * 1000,
        market: 'btcusd',
      })),
    ]);
  });

  describe('calculateVaR', () => {
    it('should calculate VaR successfully', async () => {
      const returns = Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05);
      
      const result = await riskMetricsService.calculateVaR(returns, 0.95, 1);

      expect(result).toBeDefined();
      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBe(0.95);
      expect(result.method).toBe('historical');
      expect(result.timeHorizon).toBe(1);
    });

    it('should handle insufficient data for VaR', async () => {
      const returns = Array.from({ length: 10 }, () => (Math.random() - 0.5) * 0.05);

      await expect(riskMetricsService.calculateVaR(returns, 0.95, 1))
        .rejects.toThrow('Insufficient data for VaR calculation');
    });

    it('should calculate VaR with different confidence levels', async () => {
      const returns = Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05);
      
      const var95 = await riskMetricsService.calculateVaR(returns, 0.95, 1);
      const var99 = await riskMetricsService.calculateVaR(returns, 0.99, 1);

      expect(var95.confidence).toBe(0.95);
      expect(var99.confidence).toBe(0.99);
      expect(var99.value).toBeGreaterThanOrEqual(var95.value);
    });
  });

  describe('calculateSharpeRatio', () => {
    it('should calculate Sharpe Ratio successfully', async () => {
      const returns = Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05);
      
      const result = await riskMetricsService.calculateSharpeRatio(returns, 0.02);

      expect(result).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.riskFreeRate).toBe(0.02);
      expect(result.excessReturn).toBeDefined();
      expect(result.volatility).toBeGreaterThan(0);
      expect(result.period).toBe('yearly');
    });

    it('should handle insufficient data for Sharpe Ratio', async () => {
      const returns = Array.from({ length: 10 }, () => (Math.random() - 0.5) * 0.05);

      await expect(riskMetricsService.calculateSharpeRatio(returns, 0.02))
        .rejects.toThrow('Insufficient data for Sharpe Ratio calculation');
    });

    it('should calculate Sharpe Ratio with different risk-free rates', async () => {
      const returns = Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05);
      
      const sharpe1 = await riskMetricsService.calculateSharpeRatio(returns, 0.01);
      const sharpe2 = await riskMetricsService.calculateSharpeRatio(returns, 0.03);

      expect(sharpe1.riskFreeRate).toBe(0.01);
      expect(sharpe2.riskFreeRate).toBe(0.03);
    });
  });

  describe('calculateMaximumDrawdown', () => {
    it('should calculate Maximum Drawdown successfully', async () => {
      const prices = [100, 110, 105, 120, 100, 90, 95, 110, 130, 120];
      const dates = Array.from({ length: 10 }, (_, i) => new Date(`2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`));
      
      const result = await riskMetricsService.calculateMaximumDrawdown(prices, dates);

      expect(result).toBeDefined();
      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.value).toBeLessThanOrEqual(1);
      expect(result.peakValue).toBeGreaterThan(0);
      expect(result.troughValue).toBeGreaterThan(0);
      expect(result.peakDate).toBeInstanceOf(Date);
      expect(result.troughDate).toBeInstanceOf(Date);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle insufficient data for Maximum Drawdown', async () => {
      const prices = [100];
      const dates = [new Date()];

      await expect(riskMetricsService.calculateMaximumDrawdown(prices, dates))
        .rejects.toThrow('Insufficient data for Maximum Drawdown calculation');
    });

    it('should identify peak and trough correctly', async () => {
      const prices = [100, 120, 80, 90, 110]; // Peak at 120, trough at 80
      const dates = Array.from({ length: 5 }, (_, i) => new Date(`2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`));
      
      const result = await riskMetricsService.calculateMaximumDrawdown(prices, dates);

      expect(result.peakValue).toBe(120);
      expect(result.troughValue).toBe(80);
      expect(result.value).toBeCloseTo((120 - 80) / 120, 2);
    });
  });

  describe('calculateCorrelation', () => {
    it('should calculate correlation for single asset', async () => {
      const portfolioData = {
        returns: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05),
        prices: Array.from({ length: 100 }, (_, i) => 50000 + i * 10),
        dates: Array.from({ length: 100 }, (_, i) => new Date(`2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`)),
        assets: ['BTC'],
      };

      const result = await riskMetricsService.calculateCorrelation(portfolioData);

      expect(result).toBeDefined();
      expect(result.assets).toEqual(['BTC']);
      expect(result.matrix).toHaveLength(1);
      expect(result.matrix[0]).toHaveLength(1);
      expect(result.matrix[0][0]).toBe(1);
      expect(result.averageCorrelation).toBe(0);
      expect(result.diversificationRatio).toBe(1);
    });

    it('should calculate correlation for multiple assets', async () => {
      const portfolioData = {
        returns: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05),
        prices: Array.from({ length: 100 }, (_, i) => 50000 + i * 10),
        dates: Array.from({ length: 100 }, (_, i) => new Date(`2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`)),
        assets: ['BTC', 'ETH', 'ADA'],
        weights: [0.5, 0.3, 0.2],
      };

      const result = await riskMetricsService.calculateCorrelation(portfolioData);

      expect(result).toBeDefined();
      expect(result.assets).toEqual(['BTC', 'ETH', 'ADA']);
      expect(result.matrix).toHaveLength(3);
      expect(result.matrix[0]).toHaveLength(3);
      expect(result.averageCorrelation).toBeGreaterThanOrEqual(0);
      expect(result.averageCorrelation).toBeLessThanOrEqual(1);
      expect(result.diversificationRatio).toBeGreaterThan(0);
      expect(result.diversificationRatio).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateVolatility', () => {
    it('should calculate volatility successfully', async () => {
      const returns = Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05);
      
      const result = await riskMetricsService.calculateVolatility(returns);

      expect(result).toBeDefined();
      expect(result.daily).toBeGreaterThan(0);
      expect(result.annualized).toBeGreaterThan(0);
      expect(result.rolling).toBeDefined();
      expect(Array.isArray(result.rolling)).toBe(true);
      expect(result.annualized).toBeGreaterThan(result.daily);
    });

    it('should handle insufficient data for volatility', async () => {
      const returns = [0.01];

      await expect(riskMetricsService.calculateVolatility(returns))
        .rejects.toThrow('Insufficient data for volatility calculation');
    });

    it('should calculate rolling volatility', async () => {
      const returns = Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05);
      
      const result = await riskMetricsService.calculateVolatility(returns);

      expect(result.rolling.length).toBeGreaterThan(0);
      expect(result.rolling.every(v => v > 0)).toBe(true);
    });
  });

  describe('calculateBeta', () => {
    it('should calculate Beta successfully', async () => {
      const returns = Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05);
      
      const result = await riskMetricsService.calculateBeta(returns, 'BTCUSDT');

      expect(result).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.benchmark).toBe('BTCUSDT');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle insufficient data for Beta', async () => {
      const returns = Array.from({ length: 10 }, () => (Math.random() - 0.5) * 0.05);

      await expect(riskMetricsService.calculateBeta(returns, 'BTCUSDT'))
        .rejects.toThrow('Insufficient data for Beta calculation');
    });
  });

  describe('calculateTrackingError', () => {
    it('should calculate Tracking Error successfully', async () => {
      const returns = Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05);
      
      const result = await riskMetricsService.calculateTrackingError(returns, 'BTCUSDT');

      expect(result).toBeDefined();
      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.benchmark).toBe('BTCUSDT');
      expect(result.period).toBe('yearly');
    });

    it('should handle insufficient data for Tracking Error', async () => {
      const returns = Array.from({ length: 10 }, () => (Math.random() - 0.5) * 0.05);

      await expect(riskMetricsService.calculateTrackingError(returns, 'BTCUSDT'))
        .rejects.toThrow('Insufficient data for Tracking Error calculation');
    });
  });

  describe('calculateInformationRatio', () => {
    it('should calculate Information Ratio successfully', async () => {
      const returns = Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05);
      
      const result = await riskMetricsService.calculateInformationRatio(returns, 'BTCUSDT');

      expect(result).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.benchmark).toBe('BTCUSDT');
      expect(result.activeReturn).toBeDefined();
      expect(result.trackingError).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateCalmarRatio', () => {
    it('should calculate Calmar Ratio successfully', async () => {
      const returns = Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05);
      const maxDrawdown = 0.15;
      
      const result = await riskMetricsService.calculateCalmarRatio(returns, maxDrawdown);

      expect(result).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.annualReturn).toBeDefined();
      expect(result.maximumDrawdown).toBe(maxDrawdown);
    });
  });

  describe('calculateSortinoRatio', () => {
    it('should calculate Sortino Ratio successfully', async () => {
      const returns = Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05);
      
      const result = await riskMetricsService.calculateSortinoRatio(returns, 0.02);

      expect(result).toBeDefined();
      expect(result.value).toBeDefined();
      expect(result.downsideDeviation).toBeGreaterThanOrEqual(0);
      expect(result.targetReturn).toBe(0.02);
    });
  });

  describe('calculateRiskMetrics', () => {
    it('should calculate all risk metrics successfully', async () => {
      const portfolioData = {
        returns: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05),
        prices: Array.from({ length: 100 }, (_, i) => 50000 + i * 10),
        dates: Array.from({ length: 100 }, (_, i) => new Date(`2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`)),
        assets: ['BTC', 'ETH'],
        weights: [0.6, 0.4],
      };

      const result = await riskMetricsService.calculateRiskMetrics(portfolioData);

      expect(result).toBeDefined();
      expect(result.var).toBeDefined();
      expect(result.sharpeRatio).toBeDefined();
      expect(result.maximumDrawdown).toBeDefined();
      expect(result.correlation).toBeDefined();
      expect(result.volatility).toBeDefined();
      expect(result.beta).toBeDefined();
      expect(result.trackingError).toBeDefined();
      expect(result.informationRatio).toBeDefined();
      expect(result.calmarRatio).toBeDefined();
      expect(result.sortinoRatio).toBeDefined();
    });

    it('should calculate risk metrics with custom options', async () => {
      const portfolioData = {
        returns: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05),
        prices: Array.from({ length: 100 }, (_, i) => 50000 + i * 10),
        dates: Array.from({ length: 100 }, (_, i) => new Date(`2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`)),
      };

      const options = {
        confidenceLevel: 0.99,
        timeHorizon: 5,
        riskFreeRate: 0.03,
        benchmark: 'ETHUSDT',
      };

      const result = await riskMetricsService.calculateRiskMetrics(portfolioData, options);

      expect(result.var.confidence).toBe(0.99);
      expect(result.var.timeHorizon).toBe(5);
      expect(result.sharpeRatio.riskFreeRate).toBe(0.03);
      expect(result.beta.benchmark).toBe('ETHUSDT');
    });
  });

  describe('performRiskAnalysis', () => {
    it('should perform comprehensive risk analysis successfully', async () => {
      const portfolioData = {
        returns: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05),
        prices: Array.from({ length: 100 }, (_, i) => 50000 + i * 10),
        dates: Array.from({ length: 100 }, (_, i) => new Date(`2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`)),
        assets: ['BTC', 'ETH'],
        weights: [0.6, 0.4],
      };

      const result = await riskMetricsService.performRiskAnalysis(portfolioData);

      expect(result).toBeDefined();
      expect(result.portfolioId).toBeDefined();
      expect(result.analysisDate).toBeInstanceOf(Date);
      expect(result.metrics).toBeDefined();
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(Array.isArray(result.alerts)).toBe(true);
    });

    it('should log risk analysis to trading logger', async () => {
      const portfolioData = {
        returns: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05),
        prices: Array.from({ length: 100 }, (_, i) => 50000 + i * 10),
        dates: Array.from({ length: 100 }, (_, i) => new Date(`2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`)),
      };

      await riskMetricsService.performRiskAnalysis(portfolioData);

      expect(mockLoggerService.logRiskAlert).toHaveBeenCalledWith({
        alertType: 'volatility_risk',
        message: expect.stringContaining('Risk analysis completed'),
        riskLevel: expect.stringMatching(/^(moderate|high|critical)$/),
      });
    });
  });

  describe('risk level determination', () => {
    it('should determine risk level correctly', async () => {
      // Test with low risk portfolio
      const lowRiskData = {
        returns: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.01), // Low volatility
        prices: Array.from({ length: 100 }, (_, i) => 50000 + i * 5), // Stable prices
        dates: Array.from({ length: 100 }, (_, i) => new Date(`2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`)),
      };

      const result = await riskMetricsService.performRiskAnalysis(lowRiskData);
      expect(['low', 'medium']).toContain(result.riskLevel);
    });
  });

  describe('recommendations and alerts', () => {
    it('should generate appropriate recommendations', async () => {
      const portfolioData = {
        returns: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.08), // High volatility
        prices: Array.from({ length: 100 }, (_, i) => 50000 + i * 20), // Volatile prices
        dates: Array.from({ length: 100 }, (_, i) => new Date(`2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`)),
      };

      const result = await riskMetricsService.performRiskAnalysis(portfolioData);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.every(rec => typeof rec === 'string')).toBe(true);
    });

    it('should generate appropriate alerts', async () => {
      const portfolioData = {
        returns: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.08), // High volatility
        prices: Array.from({ length: 100 }, (_, i) => 50000 + i * 20), // Volatile prices
        dates: Array.from({ length: 100 }, (_, i) => new Date(`2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`)),
      };

      const result = await riskMetricsService.performRiskAnalysis(portfolioData);

      expect(Array.isArray(result.alerts)).toBe(true);
      result.alerts.forEach(alert => {
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('message');
        expect(alert).toHaveProperty('threshold');
        expect(alert).toHaveProperty('actual');
        expect(['warning', 'critical']).toContain(alert.severity);
      });
    });
  });

  describe('error handling', () => {
    it('should handle historical data service errors', async () => {
      mockHistoricalDataService.getHistoricalData.mockRejectedValueOnce(new Error('API Error'));

      const portfolioData = {
        returns: Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05),
        prices: Array.from({ length: 100 }, (_, i) => 50000 + i * 10),
        dates: Array.from({ length: 100 }, (_, i) => new Date(`2025-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`)),
      };

      // Should still work with simulated benchmark returns
      const result = await riskMetricsService.performRiskAnalysis(portfolioData);
      expect(result).toBeDefined();
    });
  });
});
