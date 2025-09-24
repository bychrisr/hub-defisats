import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MachineLearningService } from '../services/machine-learning.service';
import { LNMarketsService } from '../services/lnmarkets.service';
import { TradingLoggerService } from '../services/trading-logger.service';

// Mock HistoricalDataService
jest.mock('../services/historical-data.service', () => ({
  HistoricalDataService: jest.fn().mockImplementation(() => ({
    getHistoricalData: jest.fn(),
  })),
}));

describe('MachineLearningService Tests', () => {
  let mlService: MachineLearningService;
  let mockLNMarketsService: any;
  let mockLoggerService: any;
  let mockHistoricalDataService: any;

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

    // Mock HistoricalDataService
    const { HistoricalDataService } = require('../services/historical-data.service');
    mockHistoricalDataService = new HistoricalDataService();

    mlService = new MachineLearningService(
      mockLNMarketsService,
      mockLoggerService
    );

    // Replace the historical data service instance
    (mlService as any).historicalDataService = mockHistoricalDataService;

    // Default mocks for historical data
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
        timestamp: new Date('2025-01-01T01:00:00Z'),
        open: 50500,
        high: 51500,
        low: 49500,
        close: 51000,
        volume: 1200000,
        market: 'btcusd',
      },
      // Add more data points for testing
      ...Array.from({ length: 98 }, (_, i) => ({
        timestamp: new Date(`2025-01-01T${String(i + 2).padStart(2, '0')}:00:00Z`),
        open: 50000 + i * 10,
        high: 51000 + i * 10,
        low: 49000 + i * 10,
        close: 50500 + i * 10,
        volume: 1000000 + i * 1000,
        market: 'btcusd',
      })),
    ]);
  });

  describe('generateMarketPrediction', () => {
    it('should generate market prediction successfully', async () => {
      const result = await mlService.generateMarketPrediction('btcusd', 24);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.market).toBe('btcusd');
      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.prediction).toBeDefined();
      expect(result.prediction.direction).toMatch(/^(up|down|sideways)$/);
      expect(result.prediction.confidence).toBeGreaterThanOrEqual(0);
      expect(result.prediction.confidence).toBeLessThanOrEqual(1);
      expect(result.prediction.priceTarget).toBeGreaterThan(0);
      expect(result.prediction.timeHorizon).toBe(24);
      expect(result.prediction.probability).toBeGreaterThanOrEqual(0);
      expect(result.prediction.probability).toBeLessThanOrEqual(1);
      expect(result.features).toBeDefined();
      expect(result.features.technicalIndicators).toBeDefined();
      expect(result.features.marketConditions).toBeDefined();
      expect(result.features.sentiment).toBeDefined();
      expect(result.model).toBeDefined();
      expect(result.model.name).toBe('LSTM_Price_Predictor');
      expect(result.model.version).toBe('1.0.0');
      expect(result.model.accuracy).toBeGreaterThan(0);
      expect(result.model.lastTraining).toBeInstanceOf(Date);
    });

    it('should handle insufficient historical data', async () => {
      mockHistoricalDataService.getHistoricalData.mockResolvedValueOnce([
        // Only 50 data points, less than required 100
        ...Array.from({ length: 50 }, (_, i) => ({
          timestamp: new Date(`2025-01-01T${String(i).padStart(2, '0')}:00:00Z`),
          open: 50000 + i * 10,
          high: 51000 + i * 10,
          low: 49000 + i * 10,
          close: 50500 + i * 10,
          volume: 1000000 + i * 1000,
          market: 'btcusd',
        })),
      ]);

      await expect(mlService.generateMarketPrediction('btcusd', 24))
        .rejects.toThrow('Insufficient historical data for prediction');
    });

    it('should log prediction to trading logger', async () => {
      await mlService.generateMarketPrediction('btcusd', 24);

      expect(mockLoggerService.logRiskAlert).toHaveBeenCalledWith({
        alertType: 'high_exposure',
        message: 'Market prediction generated for btcusd',
        riskLevel: 'moderate',
      });
    });
  });

  describe('trainModel', () => {
    it('should train model successfully', async () => {
      const trainingData = {
        features: Array.from({ length: 100 }, () => Array.from({ length: 20 }, () => Math.random())),
        labels: Array.from({ length: 100 }, () => Math.random()),
        timestamps: Array.from({ length: 100 }, (_, i) => new Date(`2025-01-01T${String(i).padStart(2, '0')}:00:00Z`)),
        market: 'btcusd',
      };

      const result = await mlService.trainModel('btcusd', trainingData);

      expect(result).toBeDefined();
      expect(result.accuracy).toBeGreaterThanOrEqual(0.75);
      expect(result.accuracy).toBeLessThanOrEqual(0.90);
      expect(result.precision).toBeGreaterThanOrEqual(0.70);
      expect(result.precision).toBeLessThanOrEqual(0.90);
      expect(result.recall).toBeGreaterThanOrEqual(0.65);
      expect(result.recall).toBeLessThanOrEqual(0.90);
      expect(result.f1Score).toBeGreaterThanOrEqual(0.68);
      expect(result.f1Score).toBeLessThanOrEqual(0.90);
      expect(result.confusionMatrix).toHaveLength(2);
      expect(result.confusionMatrix[0]).toHaveLength(2);
      expect(result.confusionMatrix[1]).toHaveLength(2);
      expect(result.rocAuc).toBeGreaterThanOrEqual(0.80);
      expect(result.rocAuc).toBeLessThanOrEqual(0.95);
      expect(result.mse).toBeGreaterThanOrEqual(0.05);
      expect(result.mse).toBeLessThanOrEqual(0.08);
      expect(result.mae).toBeGreaterThanOrEqual(0.03);
      expect(result.mae).toBeLessThanOrEqual(0.05);
      expect(result.r2Score).toBeGreaterThanOrEqual(0.70);
      expect(result.r2Score).toBeLessThanOrEqual(0.90);
    });
  });

  describe('analyzeSentiment', () => {
    it('should analyze sentiment successfully', async () => {
      const result = await mlService.analyzeSentiment('btcusd');

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(-1);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.sources).toBeDefined();
      expect(Array.isArray(result.sources)).toBe(true);
      expect(result.sources.length).toBeGreaterThan(0);
    });
  });

  describe('detectPatterns', () => {
    it('should detect patterns successfully', async () => {
      const data = Array.from({ length: 100 }, (_, i) => ({
        timestamp: new Date(`2025-01-01T${String(i).padStart(2, '0')}:00:00Z`),
        open: 50000 + i * 10,
        high: 51000 + i * 10,
        low: 49000 + i * 10,
        close: 50500 + i * 10,
        volume: 1000000 + i * 1000,
        market: 'btcusd',
      }));

      const result = await mlService.detectPatterns('btcusd', data);

      expect(result).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(Array.isArray(result.patterns)).toBe(true);
      expect(result.signals).toBeDefined();
      expect(Array.isArray(result.signals)).toBe(true);

      // Check pattern structure if patterns are found
      if (result.patterns.length > 0) {
        const pattern = result.patterns[0];
        expect(pattern).toHaveProperty('name');
        expect(pattern).toHaveProperty('type');
        expect(['reversal', 'continuation', 'consolidation']).toContain(pattern.type);
        expect(pattern).toHaveProperty('confidence');
        expect(pattern.confidence).toBeGreaterThanOrEqual(0);
        expect(pattern.confidence).toBeLessThanOrEqual(1);
        expect(pattern).toHaveProperty('startIndex');
        expect(pattern).toHaveProperty('endIndex');
        expect(pattern).toHaveProperty('description');
      }

      // Check signal structure if signals are found
      if (result.signals.length > 0) {
        const signal = result.signals[0];
        expect(signal).toHaveProperty('type');
        expect(['buy', 'sell', 'hold']).toContain(signal.type);
        expect(signal).toHaveProperty('strength');
        expect(signal.strength).toBeGreaterThanOrEqual(0);
        expect(signal.strength).toBeLessThanOrEqual(1);
        expect(signal).toHaveProperty('timestamp');
        expect(signal.timestamp).toBeInstanceOf(Date);
        expect(signal).toHaveProperty('reason');
      }
    });

    it('should handle empty data', async () => {
      const result = await mlService.detectPatterns('btcusd', []);

      expect(result).toBeDefined();
      expect(result.patterns).toHaveLength(0);
      expect(result.signals).toHaveLength(0);
    });
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations successfully', async () => {
      const result = await mlService.generateRecommendations('btcusd');

      expect(result).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.summary).toBeDefined();
      expect(result.summary.overallSentiment).toMatch(/^(bullish|bearish|neutral)$/);
      expect(result.summary.confidence).toBeGreaterThanOrEqual(0);
      expect(result.summary.confidence).toBeLessThanOrEqual(1);
      expect(result.summary.keyFactors).toBeDefined();
      expect(Array.isArray(result.summary.keyFactors)).toBe(true);

      // Check recommendation structure if recommendations are found
      if (result.recommendations.length > 0) {
        const recommendation = result.recommendations[0];
        expect(recommendation).toHaveProperty('action');
        expect(['buy', 'sell', 'hold']).toContain(recommendation.action);
        expect(recommendation).toHaveProperty('confidence');
        expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
        expect(recommendation.confidence).toBeLessThanOrEqual(1);
        expect(recommendation).toHaveProperty('reasoning');
        expect(Array.isArray(recommendation.reasoning)).toBe(true);
        expect(recommendation).toHaveProperty('riskLevel');
        expect(['low', 'medium', 'high']).toContain(recommendation.riskLevel);
        expect(recommendation).toHaveProperty('timeHorizon');
        expect(recommendation.timeHorizon).toBeGreaterThan(0);
      }
    });
  });

  describe('technical indicators calculation', () => {
    it('should calculate technical indicators correctly', async () => {
      const result = await mlService.generateMarketPrediction('btcusd', 24);

      const indicators = result.features.technicalIndicators;
      expect(indicators).toBeDefined();
      expect(indicators.sma).toBeDefined();
      expect(indicators.ema).toBeDefined();
      expect(indicators.rsi).toBeDefined();
      expect(indicators.macd).toBeDefined();
      expect(indicators.macdSignal).toBeDefined();
      expect(indicators.macdHistogram).toBeDefined();
      expect(indicators.bollingerUpper).toBeDefined();
      expect(indicators.bollingerMiddle).toBeDefined();
      expect(indicators.bollingerLower).toBeDefined();
      expect(indicators.atr).toBeDefined();
      expect(indicators.stochastic).toBeDefined();
      expect(indicators.williamsR).toBeDefined();
      expect(indicators.cci).toBeDefined();
      expect(indicators.adx).toBeDefined();

      // Check that arrays have reasonable lengths
      expect(indicators.sma.length).toBeGreaterThan(0);
      expect(indicators.ema.length).toBeGreaterThan(0);
      expect(indicators.rsi.length).toBeGreaterThan(0);
    });
  });

  describe('market conditions analysis', () => {
    it('should analyze market conditions correctly', async () => {
      const result = await mlService.generateMarketPrediction('btcusd', 24);

      const conditions = result.features.marketConditions;
      expect(conditions).toBeDefined();
      expect(conditions.volatility).toBeGreaterThanOrEqual(0);
      expect(['bullish', 'bearish', 'sideways']).toContain(conditions.trend);
      expect(['high', 'medium', 'low']).toContain(conditions.volume);
    });
  });

  describe('sentiment analysis', () => {
    it('should analyze sentiment correctly', async () => {
      const result = await mlService.generateMarketPrediction('btcusd', 24);

      const sentiment = result.features.sentiment;
      expect(sentiment).toBeDefined();
      expect(sentiment.score).toBeGreaterThanOrEqual(-1);
      expect(sentiment.score).toBeLessThanOrEqual(1);
      expect(sentiment.sources).toBeDefined();
      expect(Array.isArray(sentiment.sources)).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle historical data service errors', async () => {
      mockHistoricalDataService.getHistoricalData.mockRejectedValueOnce(new Error('API Error'));

      await expect(mlService.generateMarketPrediction('btcusd', 24))
        .rejects.toThrow('API Error');
    });

    it('should handle training data errors', async () => {
      const invalidTrainingData = {
        features: [],
        labels: [],
        timestamps: [],
        market: 'btcusd',
      };

      // Should still work with empty data
      const result = await mlService.trainModel('btcusd', invalidTrainingData);
      expect(result).toBeDefined();
    });
  });
});
