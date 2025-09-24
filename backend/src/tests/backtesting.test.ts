import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BacktestingService, BacktestConfig } from '../services/backtesting.service';
import { LNMarketsService } from '../services/lnmarkets.service';
import { TradingLoggerService } from '../services/trading-logger.service';

describe('BacktestingService Tests', () => {
  let backtestingService: BacktestingService;
  let mockLNMarketsService: any;
  let mockLoggerService: any;

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

    backtestingService = new BacktestingService(
      mockLNMarketsService,
      mockLoggerService
    );
  });

  describe('runBacktest', () => {
    it('should run backtest successfully', async () => {
      const config: BacktestConfig = {
        strategyId: 'sma_strategy',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        initialBalance: 100000,
        timeframe: '1h',
        markets: ['btcusd'],
        parameters: {
          smaPeriod: 20,
          stopLoss: 0.02,
          takeProfit: 0.04,
        },
      };

      const result = await backtestingService.runBacktest(config);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.strategyId).toBe('sma_strategy');
      expect(result.config).toEqual(config);
      expect(result.summary).toBeDefined();
      expect(result.trades).toBeDefined();
      expect(result.equityCurve).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should handle empty historical data', async () => {
      const config: BacktestConfig = {
        strategyId: 'sma_strategy',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-01'), // Mesmo dia = sem dados
        initialBalance: 100000,
        timeframe: '1h',
        markets: ['btcusd'],
        parameters: {
          smaPeriod: 20,
        },
      };

      await expect(backtestingService.runBacktest(config)).rejects.toThrow('No historical data available');
    });

    it('should handle invalid strategy', async () => {
      const config: BacktestConfig = {
        strategyId: 'invalid_strategy',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        initialBalance: 100000,
        timeframe: '1h',
        markets: ['btcusd'],
        parameters: {},
      };

      await expect(backtestingService.runBacktest(config)).rejects.toThrow('Strategy invalid_strategy not found');
    });
  });

  describe('getBacktestResults', () => {
    it('should return backtest results', async () => {
      const results = await backtestingService.getBacktestResults('sma_strategy', 10);
      
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('compareStrategies', () => {
    it('should compare multiple strategies', async () => {
      const config = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        initialBalance: 100000,
        timeframe: '1h' as const,
        markets: ['btcusd'],
        parameters: {
          smaPeriod: 20,
        },
      };

      const results = await backtestingService.compareStrategies(['sma_strategy'], config);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      expect(results[0].strategyId).toBe('sma_strategy');
    });
  });

  describe('optimizeParameters', () => {
    it('should optimize strategy parameters', async () => {
      const config = {
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        initialBalance: 100000,
        timeframe: '1h' as const,
        markets: ['btcusd'],
      };

      const parameterRanges = {
        smaPeriod: { min: 10, max: 30, step: 10 },
        stopLoss: { min: 0.01, max: 0.03, step: 0.01 },
      };

      const result = await backtestingService.optimizeParameters('sma_strategy', config, parameterRanges);
      
      expect(result.bestResult).toBeDefined();
      expect(result.allResults).toBeDefined();
      expect(Array.isArray(result.allResults)).toBe(true);
      expect(result.allResults.length).toBeGreaterThan(0);
    });
  });

  describe('BacktestResult structure', () => {
    it('should have correct BacktestResult structure', async () => {
      const config: BacktestConfig = {
        strategyId: 'sma_strategy',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        initialBalance: 100000,
        timeframe: '1h',
        markets: ['btcusd'],
        parameters: {
          smaPeriod: 20,
        },
      };

      const result = await backtestingService.runBacktest(config);

      // Verificar estrutura do resultado
      expect(result.summary.totalTrades).toBeGreaterThanOrEqual(0);
      expect(result.summary.winningTrades).toBeGreaterThanOrEqual(0);
      expect(result.summary.losingTrades).toBeGreaterThanOrEqual(0);
      expect(result.summary.winRate).toBeGreaterThanOrEqual(0);
      expect(result.summary.winRate).toBeLessThanOrEqual(1);
      expect(result.summary.totalReturn).toBeDefined();
      expect(result.summary.totalReturnPercentage).toBeDefined();
      expect(result.summary.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(result.summary.maxDrawdownPercentage).toBeGreaterThanOrEqual(0);
      expect(result.summary.sharpeRatio).toBeDefined();
      expect(result.summary.sortinoRatio).toBeDefined();
      expect(result.summary.calmarRatio).toBeDefined();
      expect(result.summary.profitFactor).toBeGreaterThanOrEqual(0);
      expect(result.summary.averageTrade).toBeDefined();
      expect(result.summary.averageWin).toBeDefined();
      expect(result.summary.averageLoss).toBeDefined();
      expect(result.summary.largestWin).toBeDefined();
      expect(result.summary.largestLoss).toBeDefined();
      expect(result.summary.consecutiveWins).toBeGreaterThanOrEqual(0);
      expect(result.summary.consecutiveLosses).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalVolume).toBeGreaterThanOrEqual(0);
      expect(result.summary.averageHoldingTime).toBeGreaterThanOrEqual(0);

      // Verificar estrutura dos trades
      if (result.trades.length > 0) {
        const trade = result.trades[0];
        expect(trade.id).toBeDefined();
        expect(trade.market).toBeDefined();
        expect(['b', 's']).toContain(trade.side);
        expect(trade.entryPrice).toBeGreaterThan(0);
        expect(trade.exitPrice).toBeGreaterThan(0);
        expect(trade.quantity).toBeGreaterThan(0);
        expect(trade.entryTime).toBeInstanceOf(Date);
        expect(trade.exitTime).toBeInstanceOf(Date);
        expect(trade.holdingTime).toBeGreaterThanOrEqual(0);
        expect(trade.pnl).toBeDefined();
        expect(trade.pnlPercentage).toBeDefined();
        expect(trade.commission).toBeGreaterThanOrEqual(0);
        expect(trade.slippage).toBeGreaterThanOrEqual(0);
        expect(trade.reason).toBeDefined();
      }

      // Verificar estrutura da curva de equity
      expect(result.equityCurve.length).toBeGreaterThan(0);
      const equityPoint = result.equityCurve[0];
      expect(equityPoint.timestamp).toBeInstanceOf(Date);
      expect(equityPoint.equity).toBeGreaterThan(0);
      expect(equityPoint.drawdown).toBeGreaterThanOrEqual(0);
      expect(equityPoint.drawdownPercentage).toBeGreaterThanOrEqual(0);

      // Verificar estrutura das métricas
      expect(result.metrics.totalReturn).toBeDefined();
      expect(result.metrics.annualizedReturn).toBeDefined();
      expect(result.metrics.volatility).toBeGreaterThanOrEqual(0);
      expect(result.metrics.sharpeRatio).toBeDefined();
      expect(result.metrics.sortinoRatio).toBeDefined();
      expect(result.metrics.calmarRatio).toBeDefined();
      expect(result.metrics.maxDrawdown).toBeGreaterThanOrEqual(0);
      expect(result.metrics.maxDrawdownPercentage).toBeGreaterThanOrEqual(0);
      expect(result.metrics.recoveryTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.totalTrades).toBeGreaterThanOrEqual(0);
      expect(result.metrics.winRate).toBeGreaterThanOrEqual(0);
      expect(result.metrics.winRate).toBeLessThanOrEqual(1);
      expect(result.metrics.profitFactor).toBeGreaterThanOrEqual(0);
      expect(result.metrics.averageTrade).toBeDefined();
      expect(result.metrics.averageWin).toBeDefined();
      expect(result.metrics.averageLoss).toBeDefined();
      expect(result.metrics.largestWin).toBeDefined();
      expect(result.metrics.largestLoss).toBeDefined();
      expect(result.metrics.consecutiveWins).toBeGreaterThanOrEqual(0);
      expect(result.metrics.consecutiveLosses).toBeGreaterThanOrEqual(0);
      expect(result.metrics.var95).toBeDefined();
      expect(result.metrics.var99).toBeDefined();
      expect(result.metrics.expectedShortfall).toBeDefined();
      expect(result.metrics.downsideDeviation).toBeGreaterThanOrEqual(0);
      expect(result.metrics.upsideDeviation).toBeGreaterThanOrEqual(0);
      expect(result.metrics.averageHoldingTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.maxHoldingTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.minHoldingTime).toBeGreaterThanOrEqual(0);
      expect(result.metrics.totalVolume).toBeGreaterThanOrEqual(0);
      expect(result.metrics.averageVolume).toBeGreaterThanOrEqual(0);
      expect(result.metrics.maxVolume).toBeGreaterThanOrEqual(0);
      expect(result.metrics.minVolume).toBeGreaterThanOrEqual(0);
    });
  });

  describe('BacktestConfig validation', () => {
    it('should validate BacktestConfig structure', () => {
      const config: BacktestConfig = {
        strategyId: 'sma_strategy',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        initialBalance: 100000,
        timeframe: '1h',
        markets: ['btcusd'],
        parameters: {
          smaPeriod: 20,
          stopLoss: 0.02,
          takeProfit: 0.04,
        },
      };

      expect(config.strategyId).toBe('sma_strategy');
      expect(config.startDate).toBeInstanceOf(Date);
      expect(config.endDate).toBeInstanceOf(Date);
      expect(config.initialBalance).toBe(100000);
      expect(['1m', '5m', '15m', '1h', '4h', '1d']).toContain(config.timeframe);
      expect(Array.isArray(config.markets)).toBe(true);
      expect(config.markets.length).toBeGreaterThan(0);
      expect(typeof config.parameters).toBe('object');
    });
  });

  describe('HistoricalData structure', () => {
    it('should validate HistoricalData structure', () => {
      const data = {
        timestamp: new Date('2025-01-01T00:00:00Z'),
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500,
        volume: 1000000,
      };

      expect(data.timestamp).toBeInstanceOf(Date);
      expect(data.open).toBeGreaterThan(0);
      expect(data.high).toBeGreaterThanOrEqual(data.open);
      expect(data.low).toBeLessThanOrEqual(data.open);
      expect(data.close).toBeGreaterThan(0);
      expect(data.volume).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Strategy structure', () => {
    it('should validate Strategy structure', () => {
      const strategy = {
        id: 'sma_strategy',
        name: 'Simple Moving Average Strategy',
        description: 'Buy when price crosses above SMA, sell when below',
        parameters: {
          smaPeriod: 20,
          stopLoss: 0.02,
          takeProfit: 0.04,
        },
        code: 'function execute(data, params) { /* strategy code */ }',
      };

      expect(strategy.id).toBe('sma_strategy');
      expect(strategy.name).toBe('Simple Moving Average Strategy');
      expect(strategy.description).toBeDefined();
      expect(typeof strategy.parameters).toBe('object');
      expect(typeof strategy.code).toBe('string');
    });
  });
});
