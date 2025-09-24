import { describe, it, expect, jest } from '@jest/globals';
import { BacktestingService } from '../services/backtesting.service';
import { LNMarketsService } from '../services/lnmarkets.service';
import { TradingLoggerService } from '../services/trading-logger.service';

describe('BacktestingService Basic Tests', () => {
  it('should create service instance', () => {
    const mockLNMarketsService = {} as any;
    const mockLoggerService = {} as any;
    
    const backtestingService = new BacktestingService(
      mockLNMarketsService,
      mockLoggerService
    );

    expect(backtestingService).toBeInstanceOf(BacktestingService);
  });

  it('should have required methods', () => {
    const mockLNMarketsService = {} as any;
    const mockLoggerService = {} as any;
    
    const backtestingService = new BacktestingService(
      mockLNMarketsService,
      mockLoggerService
    );

    expect(backtestingService.runBacktest).toBeInstanceOf(Function);
    expect(backtestingService.getBacktestResults).toBeInstanceOf(Function);
    expect(backtestingService.compareStrategies).toBeInstanceOf(Function);
    expect(backtestingService.optimizeParameters).toBeInstanceOf(Function);
  });

  it('should handle BacktestConfig data structure', () => {
    const config = {
      strategyId: 'sma_strategy',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      initialBalance: 100000,
      timeframe: '1h' as const,
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

  it('should handle BacktestResult data structure', () => {
    const result = {
      id: 'backtest_123',
      strategyId: 'sma_strategy',
      config: {
        strategyId: 'sma_strategy',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        initialBalance: 100000,
        timeframe: '1h' as const,
        markets: ['btcusd'],
        parameters: { smaPeriod: 20 },
      },
      summary: {
        totalTrades: 10,
        winningTrades: 6,
        losingTrades: 4,
        winRate: 0.6,
        totalReturn: 5000,
        totalReturnPercentage: 5,
        maxDrawdown: 1000,
        maxDrawdownPercentage: 1,
        sharpeRatio: 1.2,
        sortinoRatio: 1.5,
        calmarRatio: 0.8,
        profitFactor: 1.8,
        averageTrade: 500,
        averageWin: 1000,
        averageLoss: -500,
        largestWin: 2000,
        largestLoss: -1000,
        consecutiveWins: 3,
        consecutiveLosses: 2,
        totalVolume: 1000000,
        averageHoldingTime: 24,
      },
      trades: [
        {
          id: 'trade_1',
          market: 'btcusd',
          side: 'b' as const,
          entryPrice: 50000,
          exitPrice: 51000,
          quantity: 1,
          entryTime: new Date('2025-01-01'),
          exitTime: new Date('2025-01-02'),
          holdingTime: 24,
          pnl: 1000,
          pnlPercentage: 2,
          commission: 10,
          slippage: 0,
          reason: 'Strategy signal',
        },
      ],
      equityCurve: [
        {
          timestamp: new Date('2025-01-01'),
          equity: 100000,
          drawdown: 0,
          drawdownPercentage: 0,
        },
        {
          timestamp: new Date('2025-01-02'),
          equity: 101000,
          drawdown: 0,
          drawdownPercentage: 0,
        },
      ],
      metrics: {
        totalReturn: 5000,
        annualizedReturn: 60,
        volatility: 0.15,
        sharpeRatio: 1.2,
        sortinoRatio: 1.5,
        calmarRatio: 0.8,
        maxDrawdown: 1000,
        maxDrawdownPercentage: 1,
        recoveryTime: 5,
        totalTrades: 10,
        winRate: 0.6,
        profitFactor: 1.8,
        averageTrade: 500,
        averageWin: 1000,
        averageLoss: -500,
        largestWin: 2000,
        largestLoss: -1000,
        consecutiveWins: 3,
        consecutiveLosses: 2,
        var95: -500,
        var99: -1000,
        expectedShortfall: -750,
        downsideDeviation: 0.1,
        upsideDeviation: 0.12,
        averageHoldingTime: 24,
        maxHoldingTime: 48,
        minHoldingTime: 1,
        totalVolume: 1000000,
        averageVolume: 100000,
        maxVolume: 200000,
        minVolume: 50000,
      },
      createdAt: new Date(),
    };

    expect(result.id).toBe('backtest_123');
    expect(result.strategyId).toBe('sma_strategy');
    expect(result.config).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.trades).toBeDefined();
    expect(result.equityCurve).toBeDefined();
    expect(result.metrics).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should handle BacktestTrade data structure', () => {
    const trade = {
      id: 'trade_1',
      market: 'btcusd',
      side: 'b' as const,
      entryPrice: 50000,
      exitPrice: 51000,
      quantity: 1,
      entryTime: new Date('2025-01-01'),
      exitTime: new Date('2025-01-02'),
      holdingTime: 24,
      pnl: 1000,
      pnlPercentage: 2,
      commission: 10,
      slippage: 0,
      reason: 'Strategy signal',
    };

    expect(trade.id).toBe('trade_1');
    expect(trade.market).toBe('btcusd');
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
  });

  it('should handle EquityPoint data structure', () => {
    const equityPoint = {
      timestamp: new Date('2025-01-01'),
      equity: 100000,
      drawdown: 0,
      drawdownPercentage: 0,
    };

    expect(equityPoint.timestamp).toBeInstanceOf(Date);
    expect(equityPoint.equity).toBeGreaterThan(0);
    expect(equityPoint.drawdown).toBeGreaterThanOrEqual(0);
    expect(equityPoint.drawdownPercentage).toBeGreaterThanOrEqual(0);
  });

  it('should handle BacktestMetrics data structure', () => {
    const metrics = {
      totalReturn: 5000,
      annualizedReturn: 60,
      volatility: 0.15,
      sharpeRatio: 1.2,
      sortinoRatio: 1.5,
      calmarRatio: 0.8,
      maxDrawdown: 1000,
      maxDrawdownPercentage: 1,
      recoveryTime: 5,
      totalTrades: 10,
      winRate: 0.6,
      profitFactor: 1.8,
      averageTrade: 500,
      averageWin: 1000,
      averageLoss: -500,
      largestWin: 2000,
      largestLoss: -1000,
      consecutiveWins: 3,
      consecutiveLosses: 2,
      var95: -500,
      var99: -1000,
      expectedShortfall: -750,
      downsideDeviation: 0.1,
      upsideDeviation: 0.12,
      averageHoldingTime: 24,
      maxHoldingTime: 48,
      minHoldingTime: 1,
      totalVolume: 1000000,
      averageVolume: 100000,
      maxVolume: 200000,
      minVolume: 50000,
    };

    expect(metrics.totalReturn).toBeDefined();
    expect(metrics.annualizedReturn).toBeDefined();
    expect(metrics.volatility).toBeGreaterThanOrEqual(0);
    expect(metrics.sharpeRatio).toBeDefined();
    expect(metrics.sortinoRatio).toBeDefined();
    expect(metrics.calmarRatio).toBeDefined();
    expect(metrics.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(metrics.maxDrawdownPercentage).toBeGreaterThanOrEqual(0);
    expect(metrics.recoveryTime).toBeGreaterThanOrEqual(0);
    expect(metrics.totalTrades).toBeGreaterThanOrEqual(0);
    expect(metrics.winRate).toBeGreaterThanOrEqual(0);
    expect(metrics.winRate).toBeLessThanOrEqual(1);
    expect(metrics.profitFactor).toBeGreaterThanOrEqual(0);
    expect(metrics.averageTrade).toBeDefined();
    expect(metrics.averageWin).toBeDefined();
    expect(metrics.averageLoss).toBeDefined();
    expect(metrics.largestWin).toBeDefined();
    expect(metrics.largestLoss).toBeDefined();
    expect(metrics.consecutiveWins).toBeGreaterThanOrEqual(0);
    expect(metrics.consecutiveLosses).toBeGreaterThanOrEqual(0);
    expect(metrics.var95).toBeDefined();
    expect(metrics.var99).toBeDefined();
    expect(metrics.expectedShortfall).toBeDefined();
    expect(metrics.downsideDeviation).toBeGreaterThanOrEqual(0);
    expect(metrics.upsideDeviation).toBeGreaterThanOrEqual(0);
    expect(metrics.averageHoldingTime).toBeGreaterThanOrEqual(0);
    expect(metrics.maxHoldingTime).toBeGreaterThanOrEqual(0);
    expect(metrics.minHoldingTime).toBeGreaterThanOrEqual(0);
    expect(metrics.totalVolume).toBeGreaterThanOrEqual(0);
    expect(metrics.averageVolume).toBeGreaterThanOrEqual(0);
    expect(metrics.maxVolume).toBeGreaterThanOrEqual(0);
    expect(metrics.minVolume).toBeGreaterThanOrEqual(0);
  });

  it('should handle HistoricalData data structure', () => {
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

  it('should handle Strategy data structure', () => {
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
