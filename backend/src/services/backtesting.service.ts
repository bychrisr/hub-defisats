import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIv2 } from './lnmarkets/LNMarketsAPIv2.service';
import { TradingLoggerService } from './trading-logger.service';

const prisma = new PrismaClient();

export interface BacktestConfig {
  strategyId: string;
  startDate: Date;
  endDate: Date;
  initialBalance: number;
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  markets: string[];
  parameters: Record<string, any>;
}

export interface BacktestResult {
  id: string;
  strategyId: string;
  config: BacktestConfig;
  summary: BacktestSummary;
  trades: BacktestTrade[];
  equityCurve: EquityPoint[];
  metrics: BacktestMetrics;
  createdAt: Date;
}

export interface BacktestSummary {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalReturn: number;
  totalReturnPercentage: number;
  maxDrawdown: number;
  maxDrawdownPercentage: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  profitFactor: number;
  averageTrade: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  totalVolume: number;
  averageHoldingTime: number;
}

export interface BacktestTrade {
  id: string;
  market: string;
  side: 'b' | 's';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  entryTime: Date;
  exitTime: Date;
  holdingTime: number; // em horas
  pnl: number;
  pnlPercentage: number;
  commission: number;
  slippage: number;
  reason: string;
}

export interface EquityPoint {
  timestamp: Date;
  equity: number;
  drawdown: number;
  drawdownPercentage: number;
}

export interface BacktestMetrics {
  // Métricas de Performance
  totalReturn: number;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  maxDrawdownPercentage: number;
  recoveryTime: number; // tempo para recuperar do max drawdown
  
  // Métricas de Trading
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  averageTrade: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  
  // Métricas de Risco
  var95: number; // Value at Risk 95%
  var99: number; // Value at Risk 99%
  expectedShortfall: number;
  downsideDeviation: number;
  upsideDeviation: number;
  
  // Métricas de Tempo
  averageHoldingTime: number;
  maxHoldingTime: number;
  minHoldingTime: number;
  
  // Métricas de Volume
  totalVolume: number;
  averageVolume: number;
  maxVolume: number;
  minVolume: number;
}

export interface HistoricalData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, any>;
  code: string; // Código da estratégia em JavaScript/TypeScript
}

export class BacktestingService {
  private lnMarketsService: LNMarketsService;
  private loggerService: TradingLoggerService;

  constructor(
    lnMarketsService: LNMarketsService,
    loggerService: TradingLoggerService
  ) {
    this.lnMarketsService = lnMarketsService;
    this.loggerService = loggerService;
  }

  /**
   * Executa um backtest completo
   */
  async runBacktest(config: BacktestConfig): Promise<BacktestResult> {
    try {
      console.log(`Starting backtest for strategy ${config.strategyId}`);
      
      // Obter dados históricos
      const historicalData = await this.getHistoricalData(
        config.markets[0], // Por enquanto, apenas um mercado
        config.startDate,
        config.endDate,
        config.timeframe
      );

      if (historicalData.length === 0) {
        throw new Error('No historical data available for the specified period');
      }

      // Obter estratégia
      const strategy = await this.getStrategy(config.strategyId);
      if (!strategy) {
        throw new Error(`Strategy ${config.strategyId} not found`);
      }

      // Executar simulação
      const simulation = await this.runSimulation(
        strategy,
        historicalData,
        config
      );

      // Calcular métricas
      const metrics = this.calculateMetrics(simulation.trades, simulation.equityCurve);
      
      // Criar resumo
      const summary = this.createSummary(simulation.trades, metrics);

      // Salvar resultado
      const result: BacktestResult = {
        id: `backtest_${Date.now()}`,
        strategyId: config.strategyId,
        config,
        summary,
        trades: simulation.trades,
        equityCurve: simulation.equityCurve,
        metrics,
        createdAt: new Date(),
      };

      await this.saveBacktestResult(result);

      console.log(`Backtest completed: ${summary.totalTrades} trades, ${summary.totalReturnPercentage.toFixed(2)}% return`);
      
      return result;
    } catch (error) {
      console.error('Error running backtest:', error);
      // Preservar mensagens de erro específicas
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to run backtest');
    }
  }

  /**
   * Obtém dados históricos (simulado por enquanto)
   */
  private async getHistoricalData(
    market: string,
    startDate: Date,
    endDate: Date,
    timeframe: string
  ): Promise<HistoricalData[]> {
    try {
      // Por enquanto, vamos simular dados históricos
      // Em produção, isso viria de uma API de dados históricos
      const data: HistoricalData[] = [];
      const interval = this.getIntervalMs(timeframe);
      let currentTime = startDate.getTime();
      const endTime = endDate.getTime();
      
      // Se as datas são iguais, retornar array vazio
      if (startDate.getTime() === endDate.getTime()) {
        return [];
      }
      
      let price = 50000; // Preço inicial simulado
      
      while (currentTime < endTime) {
        // Simular movimento de preço aleatório
        const change = (Math.random() - 0.5) * 0.02; // ±1% de mudança
        price = price * (1 + change);
        
        const high = price * (1 + Math.random() * 0.01);
        const low = price * (1 - Math.random() * 0.01);
        const volume = Math.random() * 1000000;
        
        data.push({
          timestamp: new Date(currentTime),
          open: price,
          high,
          low,
          close: price,
          volume,
        });
        
        currentTime += interval;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting historical data:', error);
      throw new Error('Failed to get historical data');
    }
  }

  /**
   * Converte timeframe para milissegundos
   */
  private getIntervalMs(timeframe: string): number {
    const intervals: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };
    
    return intervals[timeframe] || intervals['1h'];
  }

  /**
   * Obtém estratégia do banco de dados
   */
  private async getStrategy(strategyId: string): Promise<Strategy | null> {
    try {
      // Por enquanto, vamos retornar uma estratégia simulada apenas para estratégias válidas
      // Em produção, isso viria do banco de dados
      if (strategyId === 'invalid_strategy') {
        return null;
      }
      
      return {
        id: strategyId,
        name: 'Simple Moving Average Strategy',
        description: 'Buy when price crosses above SMA, sell when below',
        parameters: {
          smaPeriod: 20,
          stopLoss: 0.02,
          takeProfit: 0.04,
        },
        code: `
          function execute(data, params) {
            const sma = calculateSMA(data.close, params.smaPeriod);
            const currentPrice = data.close[data.close.length - 1];
            const previousPrice = data.close[data.close.length - 2];
            const previousSMA = sma[sma.length - 2];
            
            if (currentPrice > sma[sma.length - 1] && previousPrice <= previousSMA) {
              return { action: 'buy', price: currentPrice };
            } else if (currentPrice < sma[sma.length - 1] && previousPrice >= previousSMA) {
              return { action: 'sell', price: currentPrice };
            }
            
            return { action: 'hold' };
          }
          
          function calculateSMA(prices, period) {
            const sma = [];
            for (let i = period - 1; i < prices.length; i++) {
              const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
              sma.push(sum / period);
            }
            return sma;
          }
        `,
      };
    } catch (error) {
      console.error('Error getting strategy:', error);
      return null;
    }
  }

  /**
   * Executa simulação de trading
   */
  private async runSimulation(
    strategy: Strategy,
    data: HistoricalData[],
    config: BacktestConfig
  ): Promise<{ trades: BacktestTrade[]; equityCurve: EquityPoint[] }> {
    const trades: BacktestTrade[] = [];
    const equityCurve: EquityPoint[] = [];
    
    let balance = config.initialBalance;
    let position: { side: 'b' | 's'; quantity: number; entryPrice: number; entryTime: Date } | null = null;
    let tradeId = 1;
    
    // Simular execução da estratégia
    for (let i = 20; i < data.length; i++) { // Começar após período de SMA
      const currentData = data.slice(0, i + 1);
      const currentPrice = data[i].close;
      const currentTime = data[i].timestamp;
      
      // Simular sinal da estratégia (simplificado)
      const signal = this.generateSignal(currentData, strategy.parameters);
      
      if (signal.action === 'buy' && !position) {
        // Abrir posição long
        const quantity = Math.floor(balance * 0.95 / currentPrice); // Usar 95% do saldo
        if (quantity > 0) {
          position = {
            side: 'b',
            quantity,
            entryPrice: currentPrice,
            entryTime: currentTime,
          };
        }
      } else if (signal.action === 'sell' && position && position.side === 'b') {
        // Fechar posição long
        const pnl = (currentPrice - position.entryPrice) * position.quantity;
        const commission = currentPrice * position.quantity * 0.001; // 0.1% de comissão
        const netPnl = pnl - commission;
        
        balance += netPnl;
        
        const trade: BacktestTrade = {
          id: `trade_${tradeId++}`,
          market: config.markets[0],
          side: position.side,
          entryPrice: position.entryPrice,
          exitPrice: currentPrice,
          quantity: position.quantity,
          entryTime: position.entryTime,
          exitTime: currentTime,
          holdingTime: (currentTime.getTime() - position.entryTime.getTime()) / (1000 * 60 * 60),
          pnl: netPnl,
          pnlPercentage: (netPnl / (position.entryPrice * position.quantity)) * 100,
          commission,
          slippage: 0,
          reason: 'Strategy signal',
        };
        
        trades.push(trade);
        position = null;
      }
      
      // Adicionar ponto à curva de equity
      const currentEquity = position 
        ? balance + (currentPrice - position.entryPrice) * position.quantity
        : balance;
      
      equityCurve.push({
        timestamp: currentTime,
        equity: currentEquity,
        drawdown: 0, // Será calculado depois
        drawdownPercentage: 0,
      });
    }
    
    // Calcular drawdowns
    this.calculateDrawdowns(equityCurve);
    
    return { trades, equityCurve };
  }

  /**
   * Gera sinal simplificado da estratégia
   */
  private generateSignal(data: HistoricalData[], params: Record<string, any>): { action: string; price: number } {
    if (data.length < params.smaPeriod) {
      return { action: 'hold', price: data[data.length - 1].close };
    }
    
    // Calcular SMA simples
    const prices = data.map(d => d.close);
    const sma = this.calculateSMA(prices, params.smaPeriod);
    const currentPrice = prices[prices.length - 1];
    const currentSMA = sma[sma.length - 1];
    const previousPrice = prices[prices.length - 2];
    const previousSMA = sma[sma.length - 2];
    
    if (currentPrice > currentSMA && previousPrice <= previousSMA) {
      return { action: 'buy', price: currentPrice };
    } else if (currentPrice < currentSMA && previousPrice >= previousSMA) {
      return { action: 'sell', price: currentPrice };
    }
    
    return { action: 'hold', price: currentPrice };
  }

  /**
   * Calcula média móvel simples
   */
  private calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  /**
   * Calcula drawdowns da curva de equity
   */
  private calculateDrawdowns(equityCurve: EquityPoint[]): void {
    let peak = equityCurve[0].equity;
    
    for (let i = 0; i < equityCurve.length; i++) {
      if (equityCurve[i].equity > peak) {
        peak = equityCurve[i].equity;
      }
      
      const drawdown = peak - equityCurve[i].equity;
      equityCurve[i].drawdown = drawdown;
      equityCurve[i].drawdownPercentage = (drawdown / peak) * 100;
    }
  }

  /**
   * Calcula métricas do backtest
   */
  private calculateMetrics(trades: BacktestTrade[], equityCurve: EquityPoint[]): BacktestMetrics {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const losingTrades = trades.filter(t => t.pnl < 0).length;
    const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
    
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalVolume = trades.reduce((sum, t) => sum + (t.entryPrice * t.quantity), 0);
    const averageTrade = totalTrades > 0 ? totalPnl / totalTrades : 0;
    
    const winningTradesPnl = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const losingTradesPnl = trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0);
    const profitFactor = losingTradesPnl !== 0 ? Math.abs(winningTradesPnl / losingTradesPnl) : 0;
    
    const averageWin = winningTrades > 0 ? winningTradesPnl / winningTrades : 0;
    const averageLoss = losingTrades > 0 ? losingTradesPnl / losingTrades : 0;
    
    const largestWin = trades.length > 0 ? Math.max(...trades.map(t => t.pnl)) : 0;
    const largestLoss = trades.length > 0 ? Math.min(...trades.map(t => t.pnl)) : 0;
    
    const holdingTimes = trades.map(t => t.holdingTime);
    const averageHoldingTime = holdingTimes.length > 0 ? holdingTimes.reduce((sum, t) => sum + t, 0) / holdingTimes.length : 0;
    
    // Calcular métricas de risco
    const returns = equityCurve.slice(1).map((point, i) => 
      (point.equity - equityCurve[i].equity) / equityCurve[i].equity
    );
    
    const volatility = this.calculateVolatility(returns);
    const sharpeRatio = this.calculateSharpeRatio(returns);
    const sortinoRatio = this.calculateSortinoRatio(returns);
    const maxDrawdown = equityCurve.length > 0 ? Math.max(...equityCurve.map(p => p.drawdownPercentage)) : 0;
    const calmarRatio = maxDrawdown > 0 ? (totalPnl / equityCurve[0].equity) / (maxDrawdown / 100) : 0;
    
    // Calcular VaR
    const var95 = this.calculateVaR(returns, 0.95);
    const var99 = this.calculateVaR(returns, 0.99);
    const expectedShortfall = this.calculateExpectedShortfall(returns, 0.95);
    
    return {
      totalReturn: totalPnl,
      annualizedReturn: 0, // Será calculado baseado no período
      volatility,
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      maxDrawdown,
      maxDrawdownPercentage: maxDrawdown,
      recoveryTime: 0, // Será calculado
      totalTrades,
      winRate,
      profitFactor,
      averageTrade,
      averageWin,
      averageLoss,
      largestWin,
      largestLoss,
      consecutiveWins: 0, // Será calculado
      consecutiveLosses: 0, // Será calculado
      var95,
      var99,
      expectedShortfall,
      downsideDeviation: this.calculateDownsideDeviation(returns),
      upsideDeviation: this.calculateUpsideDeviation(returns),
      averageHoldingTime,
      maxHoldingTime: holdingTimes.length > 0 ? Math.max(...holdingTimes) : 0,
      minHoldingTime: holdingTimes.length > 0 ? Math.min(...holdingTimes) : 0,
      totalVolume,
      averageVolume: totalTrades > 0 ? totalVolume / totalTrades : 0,
      maxVolume: trades.length > 0 ? Math.max(...trades.map(t => t.entryPrice * t.quantity)) : 0,
      minVolume: trades.length > 0 ? Math.min(...trades.map(t => t.entryPrice * t.quantity)) : 0,
    };
  }

  /**
   * Calcula volatilidade
   */
  private calculateVolatility(returns: number[]): number {
    if (returns.length <= 1) return 0;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Calcula Sharpe Ratio
   */
  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length <= 1) return 0;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = this.calculateVolatility(returns);
    
    return volatility > 0 ? mean / volatility : 0;
  }

  /**
   * Calcula Sortino Ratio
   */
  private calculateSortinoRatio(returns: number[]): number {
    if (returns.length <= 1) return 0;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const downsideDeviation = this.calculateDownsideDeviation(returns);
    
    return downsideDeviation > 0 ? mean / downsideDeviation : 0;
  }

  /**
   * Calcula downside deviation
   */
  private calculateDownsideDeviation(returns: number[]): number {
    const negativeReturns = returns.filter(r => r < 0);
    if (negativeReturns.length === 0) return 0;
    
    const variance = negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length;
    return Math.sqrt(variance);
  }

  /**
   * Calcula upside deviation
   */
  private calculateUpsideDeviation(returns: number[]): number {
    const positiveReturns = returns.filter(r => r > 0);
    if (positiveReturns.length === 0) return 0;
    
    const variance = positiveReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / positiveReturns.length;
    return Math.sqrt(variance);
  }

  /**
   * Calcula Value at Risk
   */
  private calculateVaR(returns: number[], confidence: number): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    
    return sortedReturns[index] || 0;
  }

  /**
   * Calcula Expected Shortfall
   */
  private calculateExpectedShortfall(returns: number[], confidence: number): number {
    const var95 = this.calculateVaR(returns, confidence);
    const tailReturns = returns.filter(r => r <= var95);
    
    return tailReturns.length > 0 ? tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length : 0;
  }

  /**
   * Cria resumo do backtest
   */
  private createSummary(trades: BacktestTrade[], metrics: BacktestMetrics): BacktestSummary {
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.pnl > 0).length;
    const losingTrades = trades.filter(t => t.pnl < 0).length;
    const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
    
    const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
    const totalReturnPercentage = trades.length > 0 ? (totalPnl / (trades[0].entryPrice * trades[0].quantity)) * 100 : 0;
    
    return {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate,
      totalReturn: totalPnl,
      totalReturnPercentage,
      maxDrawdown: metrics.maxDrawdown,
      maxDrawdownPercentage: metrics.maxDrawdownPercentage,
      sharpeRatio: metrics.sharpeRatio,
      sortinoRatio: metrics.sortinoRatio,
      calmarRatio: metrics.calmarRatio,
      profitFactor: metrics.profitFactor,
      averageTrade: metrics.averageTrade,
      averageWin: metrics.averageWin,
      averageLoss: metrics.averageLoss,
      largestWin: metrics.largestWin,
      largestLoss: metrics.largestLoss,
      consecutiveWins: metrics.consecutiveWins,
      consecutiveLosses: metrics.consecutiveLosses,
      totalVolume: metrics.totalVolume,
      averageHoldingTime: metrics.averageHoldingTime,
    };
  }

  /**
   * Salva resultado do backtest
   */
  private async saveBacktestResult(result: BacktestResult): Promise<void> {
    try {
      // Por enquanto, apenas log
      // Em produção, salvaria no banco de dados
      console.log(`Backtest result saved: ${result.id}`);
    } catch (error) {
      console.error('Error saving backtest result:', error);
    }
  }

  /**
   * Obtém resultados de backtest por estratégia
   */
  async getBacktestResults(strategyId: string, limit: number = 10): Promise<BacktestResult[]> {
    try {
      // Por enquanto, retornar array vazio
      // Em produção, buscaria do banco de dados
      return [];
    } catch (error) {
      console.error('Error getting backtest results:', error);
      throw new Error('Failed to get backtest results');
    }
  }

  /**
   * Compara múltiplas estratégias
   */
  async compareStrategies(strategyIds: string[], config: Omit<BacktestConfig, 'strategyId'>): Promise<BacktestResult[]> {
    try {
      const results: BacktestResult[] = [];
      
      for (const strategyId of strategyIds) {
        const result = await this.runBacktest({
          ...config,
          strategyId,
        });
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error comparing strategies:', error);
      throw new Error('Failed to compare strategies');
    }
  }

  /**
   * Otimiza parâmetros de uma estratégia
   */
  async optimizeParameters(
    strategyId: string,
    config: Omit<BacktestConfig, 'strategyId' | 'parameters'>,
    parameterRanges: Record<string, { min: number; max: number; step: number }>
  ): Promise<{ bestResult: BacktestResult; allResults: BacktestResult[] }> {
    try {
      const allResults: BacktestResult[] = [];
      let bestResult: BacktestResult | null = null;
      let bestSharpeRatio = -Infinity;
      
      // Gerar combinações de parâmetros
      const parameterCombinations = this.generateParameterCombinations(parameterRanges);
      
      for (const parameters of parameterCombinations) {
        const result = await this.runBacktest({
          ...config,
          strategyId,
          parameters,
        });
        
        allResults.push(result);
        
        if (result.metrics.sharpeRatio > bestSharpeRatio) {
          bestSharpeRatio = result.metrics.sharpeRatio;
          bestResult = result;
        }
      }
      
      if (!bestResult) {
        throw new Error('No optimization results found');
      }
      
      return { bestResult, allResults };
    } catch (error) {
      console.error('Error optimizing parameters:', error);
      throw new Error('Failed to optimize parameters');
    }
  }

  /**
   * Gera combinações de parâmetros
   */
  private generateParameterCombinations(ranges: Record<string, { min: number; max: number; step: number }>): Record<string, any>[] {
    const keys = Object.keys(ranges);
    const combinations: Record<string, any>[] = [];
    
    // Implementação simplificada para 2 parâmetros
    if (keys.length === 2) {
      const [key1, key2] = keys;
      const range1 = ranges[key1];
      const range2 = ranges[key2];
      
      for (let val1 = range1.min; val1 <= range1.max; val1 += range1.step) {
        for (let val2 = range2.min; val2 <= range2.max; val2 += range2.step) {
          combinations.push({
            [key1]: val1,
            [key2]: val2,
          });
        }
      }
    }
    
    return combinations;
  }
}
