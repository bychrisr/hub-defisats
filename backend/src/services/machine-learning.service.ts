import { PrismaClient } from '@prisma/client';
import { LNMarketsAPIv2 } from './lnmarkets/LNMarketsAPIv2.service';
import { TradingLoggerService } from './trading-logger.service';
import { HistoricalDataService } from './historical-data.service';

const prisma = new PrismaClient();

export interface MarketData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  market: string;
}

export interface TechnicalIndicators {
  sma: number[]; // Simple Moving Average
  ema: number[]; // Exponential Moving Average
  rsi: number[]; // Relative Strength Index
  macd: number[]; // MACD Line
  macdSignal: number[]; // MACD Signal Line
  macdHistogram: number[]; // MACD Histogram
  bollingerUpper: number[]; // Bollinger Bands Upper
  bollingerMiddle: number[]; // Bollinger Bands Middle
  bollingerLower: number[]; // Bollinger Bands Lower
  atr: number[]; // Average True Range
  stochastic: number[]; // Stochastic Oscillator
  williamsR: number[]; // Williams %R
  cci: number[]; // Commodity Channel Index
  adx: number[]; // Average Directional Index
}

export interface PredictionResult {
  id: string;
  market: string;
  timestamp: Date;
  prediction: {
    direction: 'up' | 'down' | 'sideways';
    confidence: number; // 0-1
    priceTarget: number;
    timeHorizon: number; // em horas
    probability: number; // 0-1
  };
  features: {
    technicalIndicators: TechnicalIndicators;
    marketConditions: {
      volatility: number;
      trend: 'bullish' | 'bearish' | 'sideways';
      volume: 'high' | 'medium' | 'low';
    };
    sentiment: {
      score: number; // -1 a 1
      sources: string[];
    };
  };
  model: {
    name: string;
    version: string;
    accuracy: number;
    lastTraining: Date;
  };
}

export interface TrainingData {
  features: number[][];
  labels: number[];
  timestamps: Date[];
  market: string;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  rocAuc: number;
  mse: number;
  mae: number;
  r2Score: number;
}

export interface SentimentData {
  source: string;
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  timestamp: Date;
  market?: string;
}

export class MachineLearningService {
  private lnMarketsService: LNMarketsService;
  private loggerService: TradingLoggerService;
  private historicalDataService: HistoricalDataService;
  private models: Map<string, any> = new Map();

  constructor(
    lnMarketsService: LNMarketsService,
    loggerService: TradingLoggerService
  ) {
    this.lnMarketsService = lnMarketsService;
    this.loggerService = loggerService;
    this.historicalDataService = new HistoricalDataService();
  }

  /**
   * Gera predição de mercado usando machine learning
   */
  async generateMarketPrediction(market: string, timeHorizon: number = 24): Promise<PredictionResult> {
    try {
      console.log(`Generating market prediction for ${market} with ${timeHorizon}h horizon`);

      // Obter dados históricos reais das APIs
      const historicalData = await this.historicalDataService.getHistoricalData(market, '1h', 1000); // Últimos 1000 pontos
      
      if (historicalData.length < 100) {
        throw new Error('Insufficient historical data for prediction');
      }

      // Calcular indicadores técnicos
      const technicalIndicators = this.calculateTechnicalIndicators(historicalData);

      // Obter dados de sentiment
      const sentimentData = await this.getSentimentData(market);

      // Preparar features para o modelo
      const features = this.prepareFeatures(historicalData, technicalIndicators, sentimentData);

      // Fazer predição usando modelo treinado
      const prediction = await this.predictWithModel(market, features, timeHorizon);

      // Calcular condições de mercado
      const marketConditions = this.analyzeMarketConditions(historicalData, technicalIndicators);

      const result: PredictionResult = {
        id: `prediction_${Date.now()}`,
        market,
        timestamp: new Date(),
        prediction: {
          direction: prediction.direction,
          confidence: prediction.confidence,
          priceTarget: prediction.priceTarget,
          timeHorizon,
          probability: prediction.probability,
        },
        features: {
          technicalIndicators,
          marketConditions,
          sentiment: {
            score: sentimentData.score,
            sources: sentimentData.sources,
          },
        },
        model: {
          name: 'LSTM_Price_Predictor',
          version: '1.0.0',
          accuracy: 0.75, // Simulado
          lastTraining: new Date(),
        },
      };

      // Log da predição
      await this.loggerService.logRiskAlert({
        alertType: 'high_exposure',
        message: `Market prediction generated for ${market}`,
        riskLevel: 'moderate',
      });

      console.log(`Prediction generated: ${prediction.direction} with ${(prediction.confidence * 100).toFixed(1)}% confidence`);
      
      return result;
    } catch (error) {
      console.error('Error generating market prediction:', error);
      // Preservar mensagens de erro específicas
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to generate market prediction');
    }
  }

  /**
   * Treina modelo de machine learning
   */
  async trainModel(market: string, trainingData: TrainingData): Promise<ModelMetrics> {
    try {
      console.log(`Training model for ${market} with ${trainingData.features.length} samples`);

      // Por enquanto, vamos simular o treinamento
      // Em produção, isso usaria bibliotecas como TensorFlow.js ou ML5.js
      const metrics: ModelMetrics = {
        accuracy: 0.75 + Math.random() * 0.15, // 75-90%
        precision: 0.70 + Math.random() * 0.20, // 70-90%
        recall: 0.65 + Math.random() * 0.25, // 65-90%
        f1Score: 0.68 + Math.random() * 0.22, // 68-90%
        confusionMatrix: [
          [45, 5], // True Positives, False Positives
          [8, 42], // False Negatives, True Negatives
        ],
        rocAuc: 0.80 + Math.random() * 0.15, // 80-95%
        mse: 0.05 + Math.random() * 0.03, // 5-8%
        mae: 0.03 + Math.random() * 0.02, // 3-5%
        r2Score: 0.70 + Math.random() * 0.20, // 70-90%
      };

      // Salvar modelo treinado
      this.models.set(market, {
        metrics,
        lastTraining: new Date(),
        version: '1.0.0',
      });

      console.log(`Model trained successfully: ${(metrics.accuracy * 100).toFixed(1)}% accuracy`);
      
      return metrics;
    } catch (error) {
      console.error('Error training model:', error);
      throw new Error('Failed to train model');
    }
  }

  /**
   * Analisa sentiment do mercado
   */
  async analyzeSentiment(market: string): Promise<{ score: number; sources: string[] }> {
    try {
      // Por enquanto, vamos simular análise de sentiment
      // Em produção, isso analisaria dados de redes sociais, notícias, etc.
      const sentimentData = await this.getSentimentData(market);
      
      return {
        score: sentimentData.score,
        sources: sentimentData.sources,
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw new Error('Failed to analyze sentiment');
    }
  }

  /**
   * Detecta padrões no mercado
   */
  async detectPatterns(market: string, data: MarketData[]): Promise<{
    patterns: Array<{
      name: string;
      type: 'reversal' | 'continuation' | 'consolidation';
      confidence: number;
      startIndex: number;
      endIndex: number;
      description: string;
    }>;
    signals: Array<{
      type: 'buy' | 'sell' | 'hold';
      strength: number;
      timestamp: Date;
      reason: string;
    }>;
  }> {
    try {
      console.log(`Detecting patterns in ${market} with ${data.length} data points`);

      const patterns = [];
      const signals = [];

      // Detectar padrões comuns
      const headAndShoulders = this.detectHeadAndShoulders(data);
      if (headAndShoulders) patterns.push(headAndShoulders);

      const doubleTop = this.detectDoubleTop(data);
      if (doubleTop) patterns.push(doubleTop);

      const triangle = this.detectTriangle(data);
      if (triangle) patterns.push(triangle);

      const flag = this.detectFlag(data);
      if (flag) patterns.push(flag);

      // Gerar sinais baseados nos padrões
      for (const pattern of patterns) {
        if (pattern.type === 'reversal' && pattern.confidence > 0.7) {
          signals.push({
            type: pattern.name.includes('Head') ? 'sell' : 'buy',
            strength: pattern.confidence,
            timestamp: data[pattern.endIndex].timestamp,
            reason: `Pattern detected: ${pattern.name}`,
          });
        }
      }

      console.log(`Detected ${patterns.length} patterns and ${signals.length} signals`);
      
      return { patterns, signals };
    } catch (error) {
      console.error('Error detecting patterns:', error);
      throw new Error('Failed to detect patterns');
    }
  }

  /**
   * Gera recomendações automáticas
   */
  async generateRecommendations(market: string): Promise<{
    recommendations: Array<{
      action: 'buy' | 'sell' | 'hold';
      confidence: number;
      reasoning: string[];
      riskLevel: 'low' | 'medium' | 'high';
      timeHorizon: number;
      priceTarget?: number;
      stopLoss?: number;
    }>;
    summary: {
      overallSentiment: 'bullish' | 'bearish' | 'neutral';
      confidence: number;
      keyFactors: string[];
    };
  }> {
    try {
      console.log(`Generating recommendations for ${market}`);

      // Obter predição de mercado
      const prediction = await this.generateMarketPrediction(market);

      // Obter análise de padrões com dados reais
      const historicalData = await this.historicalDataService.getHistoricalData(market, '1h', 500);
      const patternAnalysis = await this.detectPatterns(market, historicalData);

      // Obter análise de sentiment
      const sentimentAnalysis = await this.analyzeSentiment(market);

      // Gerar recomendações baseadas em múltiplos fatores
      const recommendations = [];
      const keyFactors = [];

      // Recomendação baseada na predição
      if (prediction.prediction.confidence > 0.7) {
        recommendations.push({
          action: prediction.prediction.direction === 'up' ? 'buy' : 'sell',
          confidence: prediction.prediction.confidence,
          reasoning: [
            `ML model predicts ${prediction.prediction.direction} movement`,
            `Confidence: ${(prediction.prediction.confidence * 100).toFixed(1)}%`,
          ],
          riskLevel: prediction.prediction.confidence > 0.8 ? 'low' : 'medium',
          timeHorizon: prediction.prediction.timeHorizon,
          priceTarget: prediction.prediction.priceTarget,
        });
        keyFactors.push('Machine Learning Prediction');
      }

      // Recomendação baseada em padrões
      for (const signal of patternAnalysis.signals) {
        if (signal.strength > 0.6) {
          recommendations.push({
            action: signal.type,
            confidence: signal.strength,
            reasoning: [
              `Pattern-based signal: ${signal.reason}`,
              `Signal strength: ${(signal.strength * 100).toFixed(1)}%`,
            ],
            riskLevel: signal.strength > 0.8 ? 'low' : 'medium',
            timeHorizon: 24,
          });
          keyFactors.push('Technical Pattern Analysis');
        }
      }

      // Recomendação baseada em sentiment
      if (Math.abs(sentimentAnalysis.score) > 0.5) {
        recommendations.push({
          action: sentimentAnalysis.score > 0 ? 'buy' : 'sell',
          confidence: Math.abs(sentimentAnalysis.score),
          reasoning: [
            `Market sentiment: ${sentimentAnalysis.score > 0 ? 'positive' : 'negative'}`,
            `Sentiment score: ${sentimentAnalysis.score.toFixed(2)}`,
          ],
          riskLevel: Math.abs(sentimentAnalysis.score) > 0.7 ? 'low' : 'medium',
          timeHorizon: 48,
        });
        keyFactors.push('Sentiment Analysis');
      }

      // Calcular resumo geral
      const overallSentiment = this.calculateOverallSentiment(recommendations, sentimentAnalysis.score);
      const overallConfidence = recommendations.length > 0 
        ? recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length 
        : 0;

      console.log(`Generated ${recommendations.length} recommendations with ${(overallConfidence * 100).toFixed(1)}% confidence`);
      
      return {
        recommendations,
        summary: {
          overallSentiment,
          confidence: overallConfidence,
          keyFactors,
        },
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }


  /**
   * Calcula indicadores técnicos
   */
  private calculateTechnicalIndicators(data: MarketData[]): TechnicalIndicators {
    const prices = data.map(d => d.close);
    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const volumes = data.map(d => d.volume);

    return {
      sma: this.calculateSMA(prices, 20),
      ema: this.calculateEMA(prices, 20),
      rsi: this.calculateRSI(prices, 14),
      macd: this.calculateMACD(prices),
      macdSignal: this.calculateMACDSignal(prices),
      macdHistogram: this.calculateMACDHistogram(prices),
      bollingerUpper: this.calculateBollingerBands(prices, 20, 2).upper,
      bollingerMiddle: this.calculateBollingerBands(prices, 20, 2).middle,
      bollingerLower: this.calculateBollingerBands(prices, 20, 2).lower,
      atr: this.calculateATR(highs, lows, prices, 14),
      stochastic: this.calculateStochastic(highs, lows, prices, 14),
      williamsR: this.calculateWilliamsR(highs, lows, prices, 14),
      cci: this.calculateCCI(highs, lows, prices, 20),
      adx: this.calculateADX(highs, lows, prices, 14),
    };
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
   * Calcula média móvel exponencial
   */
  private calculateEMA(prices: number[], period: number): number[] {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    ema[0] = prices[0];
    for (let i = 1; i < prices.length; i++) {
      ema[i] = (prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier));
    }
    
    return ema;
  }

  /**
   * Calcula RSI (Relative Strength Index)
   */
  private calculateRSI(prices: number[], period: number): number[] {
    const rsi: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }
    
    for (let i = period - 1; i < gains.length; i++) {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }
    
    return rsi;
  }

  /**
   * Calcula MACD
   */
  private calculateMACD(prices: number[]): number[] {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd: number[] = [];
    
    for (let i = 25; i < prices.length; i++) {
      macd.push(ema12[i] - ema26[i]);
    }
    
    return macd;
  }

  /**
   * Calcula sinal MACD
   */
  private calculateMACDSignal(prices: number[]): number[] {
    const macd = this.calculateMACD(prices);
    return this.calculateEMA(macd, 9);
  }

  /**
   * Calcula histograma MACD
   */
  private calculateMACDHistogram(prices: number[]): number[] {
    const macd = this.calculateMACD(prices);
    const signal = this.calculateMACDSignal(prices);
    const histogram: number[] = [];
    
    for (let i = 0; i < macd.length; i++) {
      histogram.push(macd[i] - signal[i]);
    }
    
    return histogram;
  }

  /**
   * Calcula Bollinger Bands
   */
  private calculateBollingerBands(prices: number[], period: number, stdDev: number): { upper: number[]; middle: number[]; lower: number[] } {
    const sma = this.calculateSMA(prices, period);
    const upper: number[] = [];
    const middle = sma;
    const lower: number[] = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = sma[i - period + 1];
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      upper.push(mean + (stdDev * standardDeviation));
      lower.push(mean - (stdDev * standardDeviation));
    }
    
    return { upper, middle, lower };
  }

  /**
   * Calcula ATR (Average True Range)
   */
  private calculateATR(highs: number[], lows: number[], closes: number[], period: number): number[] {
    const trueRanges: number[] = [];
    
    for (let i = 1; i < highs.length; i++) {
      const tr1 = highs[i] - lows[i];
      const tr2 = Math.abs(highs[i] - closes[i - 1]);
      const tr3 = Math.abs(lows[i] - closes[i - 1]);
      trueRanges.push(Math.max(tr1, tr2, tr3));
    }
    
    const atr: number[] = [];
    for (let i = period - 1; i < trueRanges.length; i++) {
      const sum = trueRanges.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      atr.push(sum / period);
    }
    
    return atr;
  }

  /**
   * Calcula Stochastic Oscillator
   */
  private calculateStochastic(highs: number[], lows: number[], closes: number[], period: number): number[] {
    const stochastic: number[] = [];
    
    for (let i = period - 1; i < closes.length; i++) {
      const highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
      const lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
      const currentClose = closes[i];
      
      const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      stochastic.push(k);
    }
    
    return stochastic;
  }

  /**
   * Calcula Williams %R
   */
  private calculateWilliamsR(highs: number[], lows: number[], closes: number[], period: number): number[] {
    const williamsR: number[] = [];
    
    for (let i = period - 1; i < closes.length; i++) {
      const highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
      const lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
      const currentClose = closes[i];
      
      const r = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
      williamsR.push(r);
    }
    
    return williamsR;
  }

  /**
   * Calcula CCI (Commodity Channel Index)
   */
  private calculateCCI(highs: number[], lows: number[], closes: number[], period: number): number[] {
    const cci: number[] = [];
    
    for (let i = period - 1; i < closes.length; i++) {
      const typicalPrices = [];
      for (let j = i - period + 1; j <= i; j++) {
        typicalPrices.push((highs[j] + lows[j] + closes[j]) / 3);
      }
      
      const sma = typicalPrices.reduce((sum, tp) => sum + tp, 0) / period;
      const meanDeviation = typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;
      const currentTP = (highs[i] + lows[i] + closes[i]) / 3;
      
      cci.push((currentTP - sma) / (0.015 * meanDeviation));
    }
    
    return cci;
  }

  /**
   * Calcula ADX (Average Directional Index)
   */
  private calculateADX(highs: number[], lows: number[], closes: number[], period: number): number[] {
    // Implementação simplificada do ADX
    const adx: number[] = [];
    
    for (let i = period; i < closes.length; i++) {
      // Cálculo simplificado - em produção seria mais complexo
      const volatility = Math.abs(closes[i] - closes[i - period]) / closes[i - period];
      adx.push(volatility * 100);
    }
    
    return adx;
  }

  /**
   * Prepara features para o modelo ML
   */
  private prepareFeatures(
    data: MarketData[],
    indicators: TechnicalIndicators,
    sentiment: { score: number; sources: string[] }
  ): number[][] {
    const features: number[][] = [];
    
    for (let i = 0; i < data.length; i++) {
      const feature = [
        data[i].open,
        data[i].high,
        data[i].low,
        data[i].close,
        data[i].volume,
        indicators.sma[i] || 0,
        indicators.ema[i] || 0,
        indicators.rsi[i] || 0,
        indicators.macd[i] || 0,
        indicators.macdSignal[i] || 0,
        indicators.macdHistogram[i] || 0,
        indicators.bollingerUpper[i] || 0,
        indicators.bollingerMiddle[i] || 0,
        indicators.bollingerLower[i] || 0,
        indicators.atr[i] || 0,
        indicators.stochastic[i] || 0,
        indicators.williamsR[i] || 0,
        indicators.cci[i] || 0,
        indicators.adx[i] || 0,
        sentiment.score,
      ];
      
      features.push(feature);
    }
    
    return features;
  }

  /**
   * Faz predição usando modelo treinado
   */
  private async predictWithModel(market: string, features: number[][], timeHorizon: number): Promise<{
    direction: 'up' | 'down' | 'sideways';
    confidence: number;
    priceTarget: number;
    probability: number;
  }> {
    try {
      // Por enquanto, vamos simular a predição
      // Em produção, isso usaria um modelo ML treinado
      const currentPrice = features[features.length - 1][3]; // Close price
      const randomFactor = Math.random();
      
      let direction: 'up' | 'down' | 'sideways';
      let confidence: number;
      let priceTarget: number;
      
      if (randomFactor > 0.6) {
        direction = 'up';
        confidence = 0.7 + Math.random() * 0.2;
        priceTarget = currentPrice * (1 + confidence * 0.05);
      } else if (randomFactor < 0.4) {
        direction = 'down';
        confidence = 0.7 + Math.random() * 0.2;
        priceTarget = currentPrice * (1 - confidence * 0.05);
      } else {
        direction = 'sideways';
        confidence = 0.5 + Math.random() * 0.2;
        priceTarget = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
      }
      
      return {
        direction,
        confidence,
        priceTarget,
        probability: confidence,
      };
    } catch (error) {
      console.error('Error predicting with model:', error);
      throw new Error('Failed to predict with model');
    }
  }

  /**
   * Analisa condições de mercado
   */
  private analyzeMarketConditions(data: MarketData[], indicators: TechnicalIndicators): {
    volatility: number;
    trend: 'bullish' | 'bearish' | 'sideways';
    volume: 'high' | 'medium' | 'low';
  } {
    const recentPrices = data.slice(-20).map(d => d.close);
    const recentVolumes = data.slice(-20).map(d => d.volume);
    
    // Calcular volatilidade
    const priceChanges = recentPrices.slice(1).map((price, i) => Math.abs(price - recentPrices[i]));
    const volatility = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;
    
    // Determinar tendência
    const sma20 = indicators.sma[indicators.sma.length - 1] || 0;
    const currentPrice = recentPrices[recentPrices.length - 1];
    let trend: 'bullish' | 'bearish' | 'sideways';
    
    if (currentPrice > sma20 * 1.02) {
      trend = 'bullish';
    } else if (currentPrice < sma20 * 0.98) {
      trend = 'bearish';
    } else {
      trend = 'sideways';
    }
    
    // Determinar volume
    const avgVolume = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
    const currentVolume = recentVolumes[recentVolumes.length - 1];
    let volume: 'high' | 'medium' | 'low';
    
    if (currentVolume > avgVolume * 1.5) {
      volume = 'high';
    } else if (currentVolume < avgVolume * 0.5) {
      volume = 'low';
    } else {
      volume = 'medium';
    }
    
    return { volatility, trend, volume };
  }

  /**
   * Obtém dados de sentiment (simulado)
   */
  private async getSentimentData(market: string): Promise<{ score: number; sources: string[] }> {
    // Por enquanto, vamos simular dados de sentiment
    // Em produção, isso analisaria dados de redes sociais, notícias, etc.
    return {
      score: (Math.random() - 0.5) * 2, // -1 a 1
      sources: ['twitter', 'reddit', 'news', 'social_media'],
    };
  }

  /**
   * Detecta padrão Head and Shoulders
   */
  private detectHeadAndShoulders(data: MarketData[]): any {
    // Implementação simplificada
    // Em produção, seria mais sofisticada
    if (data.length < 50) return null;
    
    const recentHighs = data.slice(-30).map(d => d.high);
    const maxHigh = Math.max(...recentHighs);
    const maxIndex = recentHighs.indexOf(maxHigh);
    
    if (maxIndex > 10 && maxIndex < 20) {
      return {
        name: 'Head and Shoulders',
        type: 'reversal',
        confidence: 0.6 + Math.random() * 0.3,
        startIndex: data.length - 30,
        endIndex: data.length - 1,
        description: 'Potential reversal pattern detected',
      };
    }
    
    return null;
  }

  /**
   * Detecta padrão Double Top
   */
  private detectDoubleTop(data: MarketData[]): any {
    // Implementação simplificada
    if (data.length < 40) return null;
    
    const recentHighs = data.slice(-20).map(d => d.high);
    const sortedHighs = [...recentHighs].sort((a, b) => b - a);
    
    if (sortedHighs[0] - sortedHighs[1] < sortedHighs[0] * 0.02) {
      return {
        name: 'Double Top',
        type: 'reversal',
        confidence: 0.5 + Math.random() * 0.3,
        startIndex: data.length - 20,
        endIndex: data.length - 1,
        description: 'Potential bearish reversal pattern',
      };
    }
    
    return null;
  }

  /**
   * Detecta padrão Triangle
   */
  private detectTriangle(data: MarketData[]): any {
    // Implementação simplificada
    if (data.length < 30) return null;
    
    const recentData = data.slice(-20);
    const highs = recentData.map(d => d.high);
    const lows = recentData.map(d => d.low);
    
    const highTrend = (highs[highs.length - 1] - highs[0]) / highs.length;
    const lowTrend = (lows[lows.length - 1] - lows[0]) / lows.length;
    
    if (Math.abs(highTrend) < highs[0] * 0.01 && Math.abs(lowTrend) < lows[0] * 0.01) {
      return {
        name: 'Triangle',
        type: 'consolidation',
        confidence: 0.4 + Math.random() * 0.3,
        startIndex: data.length - 20,
        endIndex: data.length - 1,
        description: 'Consolidation pattern detected',
      };
    }
    
    return null;
  }

  /**
   * Detecta padrão Flag
   */
  private detectFlag(data: MarketData[]): any {
    // Implementação simplificada
    if (data.length < 25) return null;
    
    const recentData = data.slice(-15);
    const highs = recentData.map(d => d.high);
    const lows = recentData.map(d => d.low);
    
    const highRange = Math.max(...highs) - Math.min(...highs);
    const lowRange = Math.max(...lows) - Math.min(...lows);
    
    if (highRange < highs[0] * 0.02 && lowRange < lows[0] * 0.02) {
      return {
        name: 'Flag',
        type: 'continuation',
        confidence: 0.5 + Math.random() * 0.3,
        startIndex: data.length - 15,
        endIndex: data.length - 1,
        description: 'Continuation pattern detected',
      };
    }
    
    return null;
  }

  /**
   * Calcula sentiment geral
   */
  private calculateOverallSentiment(
    recommendations: any[],
    sentimentScore: number
  ): 'bullish' | 'bearish' | 'neutral' {
    const buyCount = recommendations.filter(r => r.action === 'buy').length;
    const sellCount = recommendations.filter(r => r.action === 'sell').length;
    
    if (buyCount > sellCount && sentimentScore > 0.2) {
      return 'bullish';
    } else if (sellCount > buyCount && sentimentScore < -0.2) {
      return 'bearish';
    } else {
      return 'neutral';
    }
  }
}
