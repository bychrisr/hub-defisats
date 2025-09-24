import { PrismaClient } from '@prisma/client';
import { HistoricalDataService } from './historical-data.service';
import { TradingLoggerService } from './trading-logger.service';

const prisma = new PrismaClient();

export interface RiskMetrics {
  var: {
    value: number;
    confidence: number; // 95%, 99%, etc.
    method: 'historical' | 'parametric' | 'monte_carlo';
    timeHorizon: number; // em dias
  };
  sharpeRatio: {
    value: number;
    riskFreeRate: number;
    excessReturn: number;
    volatility: number;
    period: string; // 'daily', 'monthly', 'yearly'
  };
  maximumDrawdown: {
    value: number;
    peakValue: number;
    troughValue: number;
    peakDate: Date;
    troughDate: Date;
    recoveryDate?: Date;
    duration: number; // em dias
  };
  correlation: {
    assets: string[];
    matrix: number[][];
    averageCorrelation: number;
    diversificationRatio: number;
  };
  volatility: {
    daily: number;
    annualized: number;
    rolling: number[];
    garch?: number; // Volatilidade GARCH se disponível
  };
  beta: {
    value: number;
    benchmark: string;
    confidence: number;
  };
  trackingError: {
    value: number;
    benchmark: string;
    period: string;
  };
  informationRatio: {
    value: number;
    benchmark: string;
    activeReturn: number;
    trackingError: number;
  };
  calmarRatio: {
    value: number;
    annualReturn: number;
    maximumDrawdown: number;
  };
  sortinoRatio: {
    value: number;
    downsideDeviation: number;
    targetReturn: number;
  };
}

export interface PortfolioData {
  returns: number[];
  prices: number[];
  dates: Date[];
  weights?: number[];
  assets?: string[];
}

export interface RiskAnalysisResult {
  portfolioId: string;
  analysisDate: Date;
  metrics: RiskMetrics;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  alerts: Array<{
    type: 'high_var' | 'low_sharpe' | 'high_drawdown' | 'high_correlation' | 'high_volatility';
    severity: 'warning' | 'critical';
    message: string;
    threshold: number;
    actual: number;
  }>;
}

export class RiskMetricsService {
  private historicalDataService: HistoricalDataService;
  private loggerService: TradingLoggerService;

  constructor(loggerService: TradingLoggerService) {
    this.historicalDataService = new HistoricalDataService();
    this.loggerService = loggerService;
  }

  /**
   * Calcula todas as métricas de risco para um portfólio
   */
  async calculateRiskMetrics(
    portfolioData: PortfolioData,
    options: {
      confidenceLevel?: number;
      timeHorizon?: number;
      riskFreeRate?: number;
      benchmark?: string;
    } = {}
  ): Promise<RiskMetrics> {
    try {
      console.log('Calculating comprehensive risk metrics for portfolio');

      const {
        confidenceLevel = 0.95,
        timeHorizon = 1,
        riskFreeRate = 0.02, // 2% anual
        benchmark = 'BTCUSDT',
      } = options;

      // Calcular retornos se não fornecidos
      const returns = portfolioData.returns.length > 0 
        ? portfolioData.returns 
        : this.calculateReturns(portfolioData.prices);

      // Calcular todas as métricas
      const varMetric = await this.calculateVaR(returns, confidenceLevel, timeHorizon);
      const sharpeRatio = await this.calculateSharpeRatio(returns, riskFreeRate);
      const maxDrawdown = await this.calculateMaximumDrawdown(portfolioData.prices, portfolioData.dates);
      const correlation = await this.calculateCorrelation(portfolioData);
      const volatility = await this.calculateVolatility(returns);
      const beta = await this.calculateBeta(returns, benchmark);
      const trackingError = await this.calculateTrackingError(returns, benchmark);
      const informationRatio = await this.calculateInformationRatio(returns, benchmark);
      const calmarRatio = await this.calculateCalmarRatio(returns, maxDrawdown.value);
      const sortinoRatio = await this.calculateSortinoRatio(returns, riskFreeRate);

      const metrics: RiskMetrics = {
        var: varMetric,
        sharpeRatio,
        maximumDrawdown: maxDrawdown,
        correlation,
        volatility,
        beta,
        trackingError,
        informationRatio,
        calmarRatio,
        sortinoRatio,
      };

      console.log('Risk metrics calculated successfully');
      return metrics;
    } catch (error) {
      console.error('Error calculating risk metrics:', error);
      throw new Error('Failed to calculate risk metrics');
    }
  }

  /**
   * Calcula Value at Risk (VaR)
   */
  async calculateVaR(
    returns: number[],
    confidenceLevel: number = 0.95,
    timeHorizon: number = 1
  ): Promise<RiskMetrics['var']> {
    try {
      console.log(`Calculating VaR with ${confidenceLevel * 100}% confidence over ${timeHorizon} day(s)`);

      if (returns.length < 30) {
        throw new Error('Insufficient data for VaR calculation');
      }

      // Método Histórico (mais simples e robusto)
      const sortedReturns = [...returns].sort((a, b) => a - b);
      const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
      const historicalVaR = Math.abs(sortedReturns[index]);

      // Método Paramétrico (assumindo distribuição normal)
      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
      const stdDev = Math.sqrt(variance);
      
      // Z-score para o nível de confiança
      const zScore = this.getZScore(confidenceLevel);
      const parametricVaR = Math.abs(mean - zScore * stdDev * Math.sqrt(timeHorizon));

      // Usar o maior entre os dois métodos para ser mais conservador
      const finalVaR = Math.max(historicalVaR, parametricVaR);

      const result: RiskMetrics['var'] = {
        value: finalVaR,
        confidence: confidenceLevel,
        method: 'historical',
        timeHorizon,
      };

      console.log(`VaR calculated: ${(finalVaR * 100).toFixed(2)}%`);
      return result;
    } catch (error) {
      console.error('Error calculating VaR:', error);
      // Preservar mensagens de erro específicas
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to calculate VaR');
    }
  }

  /**
   * Calcula Sharpe Ratio
   */
  async calculateSharpeRatio(
    returns: number[],
    riskFreeRate: number = 0.02
  ): Promise<RiskMetrics['sharpeRatio']> {
    try {
      console.log('Calculating Sharpe Ratio');

      if (returns.length < 30) {
        throw new Error('Insufficient data for Sharpe Ratio calculation');
      }

      const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance);

      // Anualizar retorno e volatilidade
      const annualizedReturn = meanReturn * 252; // 252 dias de trading por ano
      const annualizedVolatility = volatility * Math.sqrt(252);
      const annualizedRiskFreeRate = riskFreeRate;

      const excessReturn = annualizedReturn - annualizedRiskFreeRate;
      const sharpeRatio = annualizedVolatility > 0 ? excessReturn / annualizedVolatility : 0;

      const result: RiskMetrics['sharpeRatio'] = {
        value: sharpeRatio,
        riskFreeRate: annualizedRiskFreeRate,
        excessReturn,
        volatility: annualizedVolatility,
        period: 'yearly',
      };

      console.log(`Sharpe Ratio calculated: ${sharpeRatio.toFixed(3)}`);
      return result;
    } catch (error) {
      console.error('Error calculating Sharpe Ratio:', error);
      // Preservar mensagens de erro específicas
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to calculate Sharpe Ratio');
    }
  }

  /**
   * Calcula Maximum Drawdown
   */
  async calculateMaximumDrawdown(
    prices: number[],
    dates: Date[]
  ): Promise<RiskMetrics['maximumDrawdown']> {
    try {
      console.log('Calculating Maximum Drawdown');

      if (prices.length < 2) {
        throw new Error('Insufficient data for Maximum Drawdown calculation');
      }

      let peak = prices[0];
      let peakIndex = 0;
      let maxDrawdown = 0;
      let troughValue = prices[0];
      let troughIndex = 0;
      let peakValue = prices[0];
      let peakDate = dates[0];
      let troughDate = dates[0];

      for (let i = 1; i < prices.length; i++) {
        if (prices[i] > peak) {
          peak = prices[i];
          peakIndex = i;
        }

        const drawdown = (peak - prices[i]) / peak;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
          troughValue = prices[i];
          troughIndex = i;
          peakValue = peak;
          peakDate = dates[peakIndex];
          troughDate = dates[i];
        }
      }

      // Calcular duração do drawdown
      const duration = Math.max(0, troughIndex - peakIndex);

      // Tentar encontrar data de recuperação
      let recoveryDate: Date | undefined;
      if (troughIndex < prices.length - 1) {
        for (let i = troughIndex + 1; i < prices.length; i++) {
          if (prices[i] >= peakValue) {
            recoveryDate = dates[i];
            break;
          }
        }
      }

      const result: RiskMetrics['maximumDrawdown'] = {
        value: maxDrawdown,
        peakValue,
        troughValue,
        peakDate,
        troughDate,
        recoveryDate,
        duration,
      };

      console.log(`Maximum Drawdown calculated: ${(maxDrawdown * 100).toFixed(2)}%`);
      return result;
    } catch (error) {
      console.error('Error calculating Maximum Drawdown:', error);
      // Preservar mensagens de erro específicas
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to calculate Maximum Drawdown');
    }
  }

  /**
   * Calcula Correlation Analysis
   */
  async calculateCorrelation(portfolioData: PortfolioData): Promise<RiskMetrics['correlation']> {
    try {
      console.log('Calculating Correlation Analysis');

      // Se temos apenas um ativo, retornar correlação neutra
      if (!portfolioData.assets || portfolioData.assets.length < 2) {
        return {
          assets: portfolioData.assets || ['single_asset'],
          matrix: [[1]],
          averageCorrelation: 0,
          diversificationRatio: 1,
        };
      }

      const assets = portfolioData.assets;
      const weights = portfolioData.weights || assets.map(() => 1 / assets.length);
      
      // Simular dados históricos para múltiplos ativos
      const assetReturns = await this.getAssetReturns(assets);
      
      // Calcular matriz de correlação
      const correlationMatrix = this.calculateCorrelationMatrix(assetReturns);
      
      // Calcular correlação média
      const averageCorrelation = this.calculateAverageCorrelation(correlationMatrix);
      
      // Calcular ratio de diversificação
      const diversificationRatio = this.calculateDiversificationRatio(weights, correlationMatrix);

      const result: RiskMetrics['correlation'] = {
        assets,
        matrix: correlationMatrix,
        averageCorrelation,
        diversificationRatio,
      };

      console.log(`Correlation Analysis completed. Average correlation: ${averageCorrelation.toFixed(3)}`);
      return result;
    } catch (error) {
      console.error('Error calculating Correlation Analysis:', error);
      throw new Error('Failed to calculate Correlation Analysis');
    }
  }

  /**
   * Calcula Volatility
   */
  async calculateVolatility(returns: number[]): Promise<RiskMetrics['volatility']> {
    try {
      console.log('Calculating Volatility');

      if (returns.length < 2) {
        throw new Error('Insufficient data for volatility calculation');
      }

      const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
      const dailyVolatility = Math.sqrt(variance);
      const annualizedVolatility = dailyVolatility * Math.sqrt(252);

      // Calcular volatilidade rolling (30 dias)
      const rollingVolatility: number[] = [];
      const window = Math.min(30, returns.length);
      
      for (let i = window - 1; i < returns.length; i++) {
        const windowReturns = returns.slice(i - window + 1, i + 1);
        const windowMean = windowReturns.reduce((sum, r) => sum + r, 0) / windowReturns.length;
        const windowVariance = windowReturns.reduce((sum, r) => sum + Math.pow(r - windowMean, 2), 0) / windowReturns.length;
        rollingVolatility.push(Math.sqrt(windowVariance) * Math.sqrt(252));
      }

      const result: RiskMetrics['volatility'] = {
        daily: dailyVolatility,
        annualized: annualizedVolatility,
        rolling: rollingVolatility,
      };

      console.log(`Volatility calculated. Daily: ${(dailyVolatility * 100).toFixed(2)}%, Annualized: ${(annualizedVolatility * 100).toFixed(2)}%`);
      return result;
    } catch (error) {
      console.error('Error calculating Volatility:', error);
      // Preservar mensagens de erro específicas
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to calculate Volatility');
    }
  }

  /**
   * Calcula Beta
   */
  async calculateBeta(returns: number[], benchmark: string = 'BTCUSDT'): Promise<RiskMetrics['beta']> {
    try {
      console.log(`Calculating Beta against ${benchmark}`);

      if (returns.length < 30) {
        throw new Error('Insufficient data for Beta calculation');
      }

      // Obter retornos do benchmark
      const benchmarkReturns = await this.getBenchmarkReturns(benchmark, returns.length);
      
      if (benchmarkReturns.length !== returns.length) {
        throw new Error('Benchmark returns length mismatch');
      }

      // Calcular covariância e variância
      const portfolioMean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const benchmarkMean = benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;

      let covariance = 0;
      let benchmarkVariance = 0;

      for (let i = 0; i < returns.length; i++) {
        covariance += (returns[i] - portfolioMean) * (benchmarkReturns[i] - benchmarkMean);
        benchmarkVariance += Math.pow(benchmarkReturns[i] - benchmarkMean, 2);
      }

      covariance /= returns.length;
      benchmarkVariance /= returns.length;

      const beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 0;

      // Calcular confiança baseada no R²
      const correlation = covariance / (Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - portfolioMean, 2), 0) / returns.length) * 
                                       Math.sqrt(benchmarkVariance));
      const confidence = Math.pow(correlation, 2);

      const result: RiskMetrics['beta'] = {
        value: beta,
        benchmark,
        confidence,
      };

      console.log(`Beta calculated: ${beta.toFixed(3)} (confidence: ${(confidence * 100).toFixed(1)}%)`);
      return result;
    } catch (error) {
      console.error('Error calculating Beta:', error);
      // Preservar mensagens de erro específicas
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to calculate Beta');
    }
  }

  /**
   * Calcula Tracking Error
   */
  async calculateTrackingError(returns: number[], benchmark: string = 'BTCUSDT'): Promise<RiskMetrics['trackingError']> {
    try {
      console.log(`Calculating Tracking Error against ${benchmark}`);

      if (returns.length < 30) {
        throw new Error('Insufficient data for Tracking Error calculation');
      }

      const benchmarkReturns = await this.getBenchmarkReturns(benchmark, returns.length);
      
      if (benchmarkReturns.length !== returns.length) {
        throw new Error('Benchmark returns length mismatch');
      }

      // Calcular diferenças (active returns)
      const activeReturns = returns.map((r, i) => r - benchmarkReturns[i]);
      
      // Calcular tracking error (desvio padrão dos active returns)
      const activeMean = activeReturns.reduce((sum, r) => sum + r, 0) / activeReturns.length;
      const activeVariance = activeReturns.reduce((sum, r) => sum + Math.pow(r - activeMean, 2), 0) / (activeReturns.length - 1); // Usar n-1 para correção
      const trackingError = Math.sqrt(Math.max(0, activeVariance)) * Math.sqrt(252); // Anualizado

      const result: RiskMetrics['trackingError'] = {
        value: trackingError,
        benchmark,
        period: 'yearly',
      };

      console.log(`Tracking Error calculated: ${(trackingError * 100).toFixed(2)}%`);
      return result;
    } catch (error) {
      console.error('Error calculating Tracking Error:', error);
      // Preservar mensagens de erro específicas
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to calculate Tracking Error');
    }
  }

  /**
   * Calcula Information Ratio
   */
  async calculateInformationRatio(returns: number[], benchmark: string = 'BTCUSDT'): Promise<RiskMetrics['informationRatio']> {
    try {
      console.log(`Calculating Information Ratio against ${benchmark}`);

      const benchmarkReturns = await this.getBenchmarkReturns(benchmark, returns.length);
      
      // Calcular active returns
      const activeReturns = returns.map((r, i) => r - benchmarkReturns[i]);
      const activeReturn = activeReturns.reduce((sum, r) => sum + r, 0) / activeReturns.length * 252; // Anualizado
      
      // Calcular tracking error
      const activeMean = activeReturns.reduce((sum, r) => sum + r, 0) / activeReturns.length;
      const activeVariance = activeReturns.reduce((sum, r) => sum + Math.pow(r - activeMean, 2), 0) / (activeReturns.length - 1); // Usar n-1 para correção
      const trackingError = Math.sqrt(Math.max(0, activeVariance)) * Math.sqrt(252);

      const informationRatio = trackingError > 0 ? activeReturn / trackingError : 0;

      const result: RiskMetrics['informationRatio'] = {
        value: informationRatio,
        benchmark,
        activeReturn,
        trackingError,
      };

      console.log(`Information Ratio calculated: ${informationRatio.toFixed(3)}`);
      return result;
    } catch (error) {
      console.error('Error calculating Information Ratio:', error);
      throw new Error('Failed to calculate Information Ratio');
    }
  }

  /**
   * Calcula Calmar Ratio
   */
  async calculateCalmarRatio(returns: number[], maxDrawdown: number): Promise<RiskMetrics['calmarRatio']> {
    try {
      console.log('Calculating Calmar Ratio');

      const annualReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length * 252;
      const calmarRatio = maxDrawdown > 0 ? annualReturn / maxDrawdown : 0;

      const result: RiskMetrics['calmarRatio'] = {
        value: calmarRatio,
        annualReturn,
        maximumDrawdown: maxDrawdown,
      };

      console.log(`Calmar Ratio calculated: ${calmarRatio.toFixed(3)}`);
      return result;
    } catch (error) {
      console.error('Error calculating Calmar Ratio:', error);
      throw new Error('Failed to calculate Calmar Ratio');
    }
  }

  /**
   * Calcula Sortino Ratio
   */
  async calculateSortinoRatio(returns: number[], targetReturn: number = 0.02): Promise<RiskMetrics['sortinoRatio']> {
    try {
      console.log('Calculating Sortino Ratio');

      const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const annualizedReturn = meanReturn * 252;

      // Calcular downside deviation
      const downsideReturns = returns.filter(r => r < targetReturn / 252);
      const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r - targetReturn / 252, 2), 0) / returns.length;
      const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(252);

      const sortinoRatio = downsideDeviation > 0 ? (annualizedReturn - targetReturn) / downsideDeviation : 0;

      const result: RiskMetrics['sortinoRatio'] = {
        value: sortinoRatio,
        downsideDeviation,
        targetReturn,
      };

      console.log(`Sortino Ratio calculated: ${sortinoRatio.toFixed(3)}`);
      return result;
    } catch (error) {
      console.error('Error calculating Sortino Ratio:', error);
      throw new Error('Failed to calculate Sortino Ratio');
    }
  }

  /**
   * Realiza análise completa de risco
   */
  async performRiskAnalysis(
    portfolioData: PortfolioData,
    options: {
      confidenceLevel?: number;
      timeHorizon?: number;
      riskFreeRate?: number;
      benchmark?: string;
    } = {}
  ): Promise<RiskAnalysisResult> {
    try {
      console.log('Performing comprehensive risk analysis');

      const metrics = await this.calculateRiskMetrics(portfolioData, options);
      
      // Determinar nível de risco
      const riskLevel = this.determineRiskLevel(metrics);
      
      // Gerar recomendações
      const recommendations = this.generateRecommendations(metrics);
      
      // Gerar alertas
      const alerts = this.generateAlerts(metrics);

      const result: RiskAnalysisResult = {
        portfolioId: `portfolio_${Date.now()}`,
        analysisDate: new Date(),
        metrics,
        riskLevel,
        recommendations,
        alerts,
      };

      // Log da análise
      await this.loggerService.logRiskAlert({
        alertType: 'volatility_risk',
        message: `Risk analysis completed. Risk level: ${riskLevel}`,
        riskLevel: riskLevel === 'critical' ? 'critical' : riskLevel === 'high' ? 'high' : 'moderate',
      });

      console.log(`Risk analysis completed. Risk level: ${riskLevel}`);
      return result;
    } catch (error) {
      console.error('Error performing risk analysis:', error);
      throw new Error('Failed to perform risk analysis');
    }
  }

  /**
   * Calcula retornos a partir de preços
   */
  private calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  /**
   * Obtém Z-score para nível de confiança
   */
  private getZScore(confidenceLevel: number): number {
    const zScores: Record<number, number> = {
      0.90: 1.282,
      0.95: 1.645,
      0.99: 2.326,
      0.999: 3.090,
    };
    return zScores[confidenceLevel] || 1.645;
  }

  /**
   * Obtém retornos de ativos múltiplos
   */
  private async getAssetReturns(assets: string[]): Promise<number[][]> {
    // Simular retornos para múltiplos ativos
    // Em produção, isso viria de dados históricos reais
    const returns: number[][] = [];
    
    for (const asset of assets) {
      const assetReturns = Array.from({ length: 100 }, () => (Math.random() - 0.5) * 0.05);
      returns.push(assetReturns);
    }
    
    return returns;
  }

  /**
   * Calcula matriz de correlação
   */
  private calculateCorrelationMatrix(assetReturns: number[][]): number[][] {
    const n = assetReturns.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          matrix[i][j] = this.calculateCorrelationCoefficient(assetReturns[i], assetReturns[j]);
        }
      }
    }

    return matrix;
  }

  /**
   * Calcula correlação entre dois arrays de retornos
   */
  private calculateCorrelationCoefficient(returns1: number[], returns2: number[]): number {
    const n = Math.min(returns1.length, returns2.length);
    if (n < 2) return 0;

    const mean1 = returns1.slice(0, n).reduce((sum, r) => sum + r, 0) / n;
    const mean2 = returns2.slice(0, n).reduce((sum, r) => sum + r, 0) / n;

    let numerator = 0;
    let sum1Squared = 0;
    let sum2Squared = 0;

    for (let i = 0; i < n; i++) {
      const diff1 = returns1[i] - mean1;
      const diff2 = returns2[i] - mean2;
      numerator += diff1 * diff2;
      sum1Squared += diff1 * diff1;
      sum2Squared += diff2 * diff2;
    }

    const denominator = Math.sqrt(sum1Squared * sum2Squared);
    return denominator > 0 ? numerator / denominator : 0;
  }

  /**
   * Calcula correlação média
   */
  private calculateAverageCorrelation(matrix: number[][]): number {
    const n = matrix.length;
    let sum = 0;
    let count = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        sum += Math.abs(matrix[i][j]);
        count++;
      }
    }

    return count > 0 ? sum / count : 0;
  }

  /**
   * Calcula ratio de diversificação
   */
  private calculateDiversificationRatio(weights: number[], correlationMatrix: number[][]): number {
    // Implementação simplificada
    // Em produção, seria mais complexa
    const averageCorrelation = this.calculateAverageCorrelation(correlationMatrix);
    return 1 / (1 + averageCorrelation);
  }

  /**
   * Obtém retornos do benchmark
   */
  private async getBenchmarkReturns(benchmark: string, length: number): Promise<number[]> {
    try {
      // Obter dados históricos do benchmark
      const historicalData = await this.historicalDataService.getHistoricalData(benchmark, '1d', length);
      const returns = this.calculateReturns(historicalData.map(d => d.close));
      
      // Garantir que temos o comprimento correto
      if (returns.length !== length) {
        console.log(`Benchmark returns length mismatch: expected ${length}, got ${returns.length}. Using simulated data.`);
        return Array.from({ length }, () => (Math.random() - 0.5) * 0.03);
      }
      
      return returns;
    } catch (error) {
      console.log('Using simulated benchmark returns');
      // Fallback para retornos simulados
      return Array.from({ length }, () => (Math.random() - 0.5) * 0.03);
    }
  }

  /**
   * Determina nível de risco
   */
  private determineRiskLevel(metrics: RiskMetrics): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;

    // VaR alto aumenta risco
    if (metrics.var.value > 0.05) riskScore += 2;
    else if (metrics.var.value > 0.03) riskScore += 1;

    // Sharpe Ratio baixo aumenta risco
    if (metrics.sharpeRatio.value < 0.5) riskScore += 2;
    else if (metrics.sharpeRatio.value < 1.0) riskScore += 1;

    // Drawdown alto aumenta risco
    if (metrics.maximumDrawdown.value > 0.3) riskScore += 2;
    else if (metrics.maximumDrawdown.value > 0.2) riskScore += 1;

    // Volatilidade alta aumenta risco
    if (metrics.volatility.annualized > 0.4) riskScore += 1;

    // Correlação alta aumenta risco
    if (metrics.correlation.averageCorrelation > 0.7) riskScore += 1;

    if (riskScore >= 5) return 'critical';
    if (riskScore >= 3) return 'high';
    if (riskScore >= 1) return 'medium';
    return 'low';
  }

  /**
   * Gera recomendações baseadas nas métricas
   */
  private generateRecommendations(metrics: RiskMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.var.value > 0.05) {
      recommendations.push('Consider reducing position sizes to lower VaR');
    }

    if (metrics.sharpeRatio.value < 1.0) {
      recommendations.push('Portfolio risk-adjusted returns could be improved');
    }

    if (metrics.maximumDrawdown.value > 0.2) {
      recommendations.push('Consider implementing stop-loss strategies');
    }

    if (metrics.correlation.averageCorrelation > 0.7) {
      recommendations.push('Portfolio diversification could be improved');
    }

    if (metrics.volatility.annualized > 0.3) {
      recommendations.push('Consider hedging strategies to reduce volatility');
    }

    if (recommendations.length === 0) {
      recommendations.push('Portfolio risk metrics are within acceptable ranges');
    }

    return recommendations;
  }

  /**
   * Gera alertas baseados nas métricas
   */
  private generateAlerts(metrics: RiskMetrics): RiskAnalysisResult['alerts'] {
    const alerts: RiskAnalysisResult['alerts'] = [];

    if (metrics.var.value > 0.05) {
      alerts.push({
        type: 'high_var',
        severity: 'critical',
        message: `VaR exceeds 5% threshold`,
        threshold: 0.05,
        actual: metrics.var.value,
      });
    }

    if (metrics.sharpeRatio.value < 0.5) {
      alerts.push({
        type: 'low_sharpe',
        severity: 'warning',
        message: `Sharpe Ratio below 0.5`,
        threshold: 0.5,
        actual: metrics.sharpeRatio.value,
      });
    }

    if (metrics.maximumDrawdown.value > 0.3) {
      alerts.push({
        type: 'high_drawdown',
        severity: 'critical',
        message: `Maximum Drawdown exceeds 30%`,
        threshold: 0.3,
        actual: metrics.maximumDrawdown.value,
      });
    }

    if (metrics.correlation.averageCorrelation > 0.8) {
      alerts.push({
        type: 'high_correlation',
        severity: 'warning',
        message: `Average correlation exceeds 80%`,
        threshold: 0.8,
        actual: metrics.correlation.averageCorrelation,
      });
    }

    if (metrics.volatility.annualized > 0.4) {
      alerts.push({
        type: 'high_volatility',
        severity: 'warning',
        message: `Annualized volatility exceeds 40%`,
        threshold: 0.4,
        actual: metrics.volatility.annualized,
      });
    }

    return alerts;
  }
}
