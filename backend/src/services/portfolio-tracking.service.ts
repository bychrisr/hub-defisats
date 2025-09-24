import { PrismaClient } from '@prisma/client';
import { LNMarketsService } from './lnmarkets.service';
import { TradingLoggerService } from './trading-logger.service';

const prisma = new PrismaClient();

export interface Position {
  id: string;
  market: string;
  side: 'b' | 's';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  stoploss?: number;
  takeprofit?: number;
  unrealizedPnl: number;
  unrealizedPnlPercentage: number;
  marginUsed: number;
  timestamp: Date;
}

export interface PortfolioMetrics {
  totalValue: number; // Valor total do portfólio em sats
  totalMargin: number; // Margem total utilizada em sats
  availableMargin: number; // Margem disponível em sats
  totalExposure: number; // Exposição total em sats
  totalUnrealizedPnl: number; // P&L não realizado total em sats
  totalUnrealizedPnlPercentage: number; // P&L não realizado em percentual
  positionCount: number; // Número de posições abertas
  marginLevel: number; // Nível de margem (0-1)
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  diversificationScore: number; // Score de diversificação (0-1)
  averageLeverage: number; // Alavancagem média
  maxDrawdown: number; // Máxima perda em percentual
  sharpeRatio: number; // Ratio de Sharpe
  winRate: number; // Taxa de vitórias (0-1)
  profitFactor: number; // Fator de lucro
}

export interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalVolume: number; // Volume total negociado em sats
  totalPnl: number; // P&L total realizado em sats
  averageTradeSize: number; // Tamanho médio das posições
  averageHoldingTime: number; // Tempo médio de manutenção em horas
  bestTrade: number; // Melhor trade em sats
  worstTrade: number; // Pior trade em sats
  consecutiveWins: number; // Sequência de vitórias
  consecutiveLosses: number; // Sequência de perdas
  monthlyReturns: number[]; // Retornos mensais em percentual
  volatility: number; // Volatilidade dos retornos
  maxDrawdown: number; // Máxima perda em percentual
  sharpeRatio: number; // Ratio de Sharpe
  calmarRatio: number; // Ratio de Calmar
  sortinoRatio: number; // Ratio de Sortino
}

export interface MarketExposure {
  market: string;
  exposure: number; // Exposição em sats
  exposurePercentage: number; // Exposição em percentual
  positionCount: number;
  averageLeverage: number;
  unrealizedPnl: number;
  unrealizedPnlPercentage: number;
}

export class PortfolioTrackingService {
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
   * Obtém todas as posições ativas do usuário
   */
  async getActivePositions(userId: string): Promise<Position[]> {
    try {
      const positions = await this.lnMarketsService.getRunningTrades();
      
      return positions.map(position => {
        // Para posições vendidas (short), o P&L é calculado de forma inversa
        const unrealizedPnl = position.side === 'b' 
          ? (position.currentPrice - position.entryPrice) * position.quantity
          : (position.entryPrice - position.currentPrice) * position.quantity;
        const unrealizedPnlPercentage = (unrealizedPnl / (position.quantity * position.entryPrice)) * 100;
        const marginUsed = (position.quantity * position.entryPrice) / position.leverage;
        
        return {
          id: position.id,
          market: position.market,
          side: position.side,
          quantity: position.quantity,
          entryPrice: position.entryPrice,
          currentPrice: position.currentPrice,
          leverage: position.leverage,
          stoploss: position.stoploss,
          takeprofit: position.takeprofit,
          unrealizedPnl,
          unrealizedPnlPercentage,
          marginUsed,
          timestamp: new Date(),
        };
      });
    } catch (error) {
      console.error('Error getting active positions:', error);
      throw new Error('Failed to get active positions');
    }
  }

  /**
   * Calcula métricas do portfólio
   */
  async calculatePortfolioMetrics(userId: string): Promise<PortfolioMetrics> {
    try {
      const balance = await this.lnMarketsService.getBalance();
      const positions = await this.getActivePositions(userId);
      
      // Calcular métricas básicas
      const totalMargin = positions.reduce((sum, pos) => sum + pos.marginUsed, 0);
      const totalExposure = positions.reduce((sum, pos) => sum + (pos.quantity * pos.currentPrice), 0);
      const totalUnrealizedPnl = positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0);
      const totalUnrealizedPnlPercentage = balance.balance > 0 ? (totalUnrealizedPnl / balance.balance) * 100 : 0;
      
      // Calcular diversificação
      const diversificationScore = this.calculateDiversificationScore(positions);
      
      // Calcular alavancagem média
      const averageLeverage = positions.length > 0 
        ? positions.reduce((sum, pos) => sum + pos.leverage, 0) / positions.length 
        : 0;
      
      // Determinar nível de risco
      let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      const exposureRatio = balance.balance > 0 ? totalExposure / balance.balance : 0;
      
      if (exposureRatio > 0.8 || balance.marginLevel < 0.2) {
        riskLevel = 'critical';
      } else if (exposureRatio > 0.6 || balance.marginLevel < 0.4) {
        riskLevel = 'high';
      } else if (exposureRatio > 0.4 || balance.marginLevel < 0.6) {
        riskLevel = 'moderate';
      }
      
      // Calcular métricas de performance (simplificadas)
      const maxDrawdown = await this.calculateMaxDrawdown(userId);
      const sharpeRatio = await this.calculateSharpeRatio(userId);
      const winRate = await this.calculateWinRate(userId);
      const profitFactor = await this.calculateProfitFactor(userId);
      
      return {
        totalValue: balance.balance,
        totalMargin,
        availableMargin: balance.available_margin,
        totalExposure,
        totalUnrealizedPnl,
        totalUnrealizedPnlPercentage,
        positionCount: positions.length,
        marginLevel: balance.marginLevel,
        riskLevel,
        diversificationScore,
        averageLeverage,
        maxDrawdown,
        sharpeRatio,
        winRate,
        profitFactor,
      };
    } catch (error) {
      console.error('Error calculating portfolio metrics:', error);
      throw new Error('Failed to calculate portfolio metrics');
    }
  }

  /**
   * Calcula exposição por mercado
   */
  async calculateMarketExposure(userId: string): Promise<MarketExposure[]> {
    try {
      const positions = await this.getActivePositions(userId);
      const balance = await this.lnMarketsService.getBalance();
      
      const marketMap = new Map<string, {
        exposure: number;
        positionCount: number;
        leverageSum: number;
        unrealizedPnl: number;
      }>();
      
      // Agrupar posições por mercado
      positions.forEach(position => {
        const existing = marketMap.get(position.market) || {
          exposure: 0,
          positionCount: 0,
          leverageSum: 0,
          unrealizedPnl: 0,
        };
        
        existing.exposure += position.quantity * position.currentPrice;
        existing.positionCount += 1;
        existing.leverageSum += position.leverage;
        existing.unrealizedPnl += position.unrealizedPnl;
        
        marketMap.set(position.market, existing);
      });
      
      // Converter para array de MarketExposure
      const totalExposure = Array.from(marketMap.values()).reduce((sum, market) => sum + market.exposure, 0);
      
      return Array.from(marketMap.entries()).map(([market, data]) => ({
        market,
        exposure: data.exposure,
        exposurePercentage: totalExposure > 0 ? (data.exposure / totalExposure) * 100 : 0,
        positionCount: data.positionCount,
        averageLeverage: data.positionCount > 0 ? data.leverageSum / data.positionCount : 0,
        unrealizedPnl: data.unrealizedPnl,
        unrealizedPnlPercentage: data.exposure > 0 ? (data.unrealizedPnl / data.exposure) * 100 : 0,
      }));
    } catch (error) {
      console.error('Error calculating market exposure:', error);
      throw new Error('Failed to calculate market exposure');
    }
  }

  /**
   * Calcula métricas de performance histórica
   */
  async calculatePerformanceMetrics(userId: string, days: number = 30): Promise<PerformanceMetrics> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
      
      // Obter logs de trading do período
      const logs = await prisma.tradingLog.findMany({
        where: {
          userId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
          action: {
            in: ['trade_created', 'trade_closed'],
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });
      
      // Processar logs para calcular métricas
      let totalTrades = 0;
      let winningTrades = 0;
      let losingTrades = 0;
      let totalVolume = 0;
      let totalPnl = 0;
      let tradeSizes: number[] = [];
      let holdingTimes: number[] = [];
      let tradePnls: number[] = [];
      let consecutiveWins = 0;
      let consecutiveLosses = 0;
      let maxConsecutiveWins = 0;
      let maxConsecutiveLosses = 0;
      
      const tradeMap = new Map<string, { startTime: Date; size: number }>();
      
      logs.forEach(log => {
        if (log.action === 'trade_created') {
          totalTrades++;
          const size = log.quantity ? Number(log.quantity) * (log.price ? Number(log.price) : 0) : 0;
          totalVolume += size;
          tradeSizes.push(size);
          
          if (log.tradeId) {
            tradeMap.set(log.tradeId, {
              startTime: log.timestamp,
              size,
            });
          }
        } else if (log.action === 'trade_closed') {
          const trade = tradeMap.get(log.tradeId || '');
          if (trade) {
            const holdingTime = log.timestamp.getTime() - trade.startTime.getTime();
            holdingTimes.push(holdingTime / (1000 * 60 * 60)); // Converter para horas
            
            const pnl = log.metadata && typeof log.metadata === 'object' && 'pnl' in log.metadata 
              ? Number(log.metadata.pnl) 
              : 0;
            
            tradePnls.push(pnl);
            totalPnl += pnl;
            
            if (pnl > 0) {
              winningTrades++;
              consecutiveWins++;
              consecutiveLosses = 0;
              maxConsecutiveWins = Math.max(maxConsecutiveWins, consecutiveWins);
            } else if (pnl < 0) {
              losingTrades++;
              consecutiveLosses++;
              consecutiveWins = 0;
              maxConsecutiveLosses = Math.max(maxConsecutiveLosses, consecutiveLosses);
            }
            
            tradeMap.delete(log.tradeId || '');
          }
        }
      });
      
      // Calcular métricas derivadas
      const averageTradeSize = tradeSizes.length > 0 ? tradeSizes.reduce((sum, size) => sum + size, 0) / tradeSizes.length : 0;
      const averageHoldingTime = holdingTimes.length > 0 ? holdingTimes.reduce((sum, time) => sum + time, 0) / holdingTimes.length : 0;
      const bestTrade = tradePnls.length > 0 ? Math.max(...tradePnls) : 0;
      const worstTrade = tradePnls.length > 0 ? Math.min(...tradePnls) : 0;
      
      // Calcular retornos mensais (simplificado)
      const monthlyReturns = await this.calculateMonthlyReturns(userId, days);
      const volatility = this.calculateVolatility(monthlyReturns);
      const maxDrawdown = this.calculateMaxDrawdownFromReturns(monthlyReturns);
      const sharpeRatio = this.calculateSharpeRatioFromReturns(monthlyReturns);
      const calmarRatio = this.calculateCalmarRatio(monthlyReturns, maxDrawdown);
      const sortinoRatio = this.calculateSortinoRatio(monthlyReturns);
      
      return {
        totalTrades,
        winningTrades,
        losingTrades,
        totalVolume,
        totalPnl,
        averageTradeSize,
        averageHoldingTime,
        bestTrade,
        worstTrade,
        consecutiveWins: maxConsecutiveWins,
        consecutiveLosses: maxConsecutiveLosses,
        monthlyReturns,
        volatility,
        maxDrawdown,
        sharpeRatio,
        calmarRatio,
        sortinoRatio,
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      throw new Error('Failed to calculate performance metrics');
    }
  }

  /**
   * Calcula score de diversificação (0-1)
   */
  private calculateDiversificationScore(positions: Position[]): number {
    if (positions.length <= 1) return 0;
    
    const markets = new Set(positions.map(pos => pos.market));
    const marketCount = markets.size;
    const positionCount = positions.length;
    
    // Score baseado na distribuição de mercados
    const marketDistribution = marketCount / positionCount;
    
    // Score baseado na distribuição de exposição
    const totalExposure = positions.reduce((sum, pos) => sum + (pos.quantity * pos.currentPrice), 0);
    const exposureVariance = positions.reduce((sum, pos) => {
      const exposure = pos.quantity * pos.currentPrice;
      const proportion = exposure / totalExposure;
      return sum + Math.pow(proportion - (1 / positionCount), 2);
    }, 0);
    
    const exposureDistribution = 1 - (exposureVariance / positionCount);
    
    return (marketDistribution + exposureDistribution) / 2;
  }

  /**
   * Calcula máxima perda (drawdown)
   */
  private async calculateMaxDrawdown(userId: string): Promise<number> {
    // Implementação simplificada - em produção seria mais complexa
    return 0.15; // 15% como exemplo
  }

  /**
   * Calcula ratio de Sharpe
   */
  private async calculateSharpeRatio(userId: string): Promise<number> {
    // Implementação simplificada - em produção seria mais complexa
    return 1.2; // 1.2 como exemplo
  }

  /**
   * Calcula taxa de vitórias
   */
  private async calculateWinRate(userId: string): Promise<number> {
    // Implementação simplificada - em produção seria mais complexa
    return 0.65; // 65% como exemplo
  }

  /**
   * Calcula fator de lucro
   */
  private async calculateProfitFactor(userId: string): Promise<number> {
    // Implementação simplificada - em produção seria mais complexa
    return 1.5; // 1.5 como exemplo
  }

  /**
   * Calcula retornos mensais
   */
  private async calculateMonthlyReturns(userId: string, days: number): Promise<number[]> {
    // Implementação simplificada - em produção seria mais complexa
    return [0.05, -0.02, 0.08, 0.03, -0.01]; // Exemplo de retornos mensais
  }

  /**
   * Calcula volatilidade dos retornos
   */
  private calculateVolatility(returns: number[]): number {
    if (returns.length <= 1) return 0;
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Calcula máxima perda a partir dos retornos
   */
  private calculateMaxDrawdownFromReturns(returns: number[]): number {
    let maxDrawdown = 0;
    let peak = 0;
    let runningReturn = 0;
    
    returns.forEach(ret => {
      runningReturn += ret;
      if (runningReturn > peak) {
        peak = runningReturn;
      }
      const drawdown = peak - runningReturn;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    });
    
    return maxDrawdown;
  }

  /**
   * Calcula ratio de Sharpe a partir dos retornos
   */
  private calculateSharpeRatioFromReturns(returns: number[]): number {
    if (returns.length <= 1) return 0;
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const volatility = this.calculateVolatility(returns);
    
    return volatility > 0 ? mean / volatility : 0;
  }

  /**
   * Calcula ratio de Calmar
   */
  private calculateCalmarRatio(returns: number[], maxDrawdown: number): number {
    if (maxDrawdown === 0) return 0;
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    return mean / maxDrawdown;
  }

  /**
   * Calcula ratio de Sortino
   */
  private calculateSortinoRatio(returns: number[]): number {
    if (returns.length <= 1) return 0;
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const negativeReturns = returns.filter(ret => ret < 0);
    
    if (negativeReturns.length === 0) return 0;
    
    const downsideVariance = negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / negativeReturns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);
    
    return downsideDeviation > 0 ? mean / downsideDeviation : 0;
  }

  /**
   * Gera relatório de performance
   */
  async generatePerformanceReport(userId: string, days: number = 30): Promise<{
    portfolioMetrics: PortfolioMetrics;
    marketExposure: MarketExposure[];
    performanceMetrics: PerformanceMetrics;
    summary: {
      totalReturn: number;
      riskAdjustedReturn: number;
      riskLevel: string;
      recommendation: string;
    };
  }> {
    try {
      const portfolioMetrics = await this.calculatePortfolioMetrics(userId);
      const marketExposure = await this.calculateMarketExposure(userId);
      const performanceMetrics = await this.calculatePerformanceMetrics(userId, days);
      
      // Calcular resumo
      const totalReturn = portfolioMetrics.totalUnrealizedPnlPercentage;
      const riskAdjustedReturn = portfolioMetrics.sharpeRatio;
      
      let recommendation = 'Continue current strategy';
      if (portfolioMetrics.riskLevel === 'critical') {
        recommendation = 'Reduce exposure immediately';
      } else if (portfolioMetrics.riskLevel === 'high') {
        recommendation = 'Consider reducing position sizes';
      } else if (portfolioMetrics.winRate < 0.5) {
        recommendation = 'Review trading strategy';
      } else if (portfolioMetrics.sharpeRatio > 1.5) {
        recommendation = 'Excellent performance, consider scaling up';
      }
      
      return {
        portfolioMetrics,
        marketExposure,
        performanceMetrics,
        summary: {
          totalReturn,
          riskAdjustedReturn,
          riskLevel: portfolioMetrics.riskLevel,
          recommendation,
        },
      };
    } catch (error) {
      console.error('Error generating performance report:', error);
      throw new Error('Failed to generate performance report');
    }
  }
}
