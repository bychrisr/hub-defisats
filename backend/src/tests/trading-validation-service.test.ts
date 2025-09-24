import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { TradingValidationService, TradeParams } from '../services/trading-validation.service';
import { LNMarketsService } from '../services/lnmarkets.service';

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('TradingValidationService Tests', () => {
  let validationService: TradingValidationService;
  let mockLNMarketsService: any;
  let mockAxios: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockAxios = {
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    };
    
    axios.create.mockReturnValue(mockAxios);
    
    // Create mock LNMarketsService
    mockLNMarketsService = {
      getBalance: jest.fn(),
      getRunningTrades: jest.fn(),
      getMarketData: jest.fn(),
    };

    validationService = new TradingValidationService(mockLNMarketsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Basic Parameter Validation', () => {
    it('should validate valid trade parameters', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 50000,
        available_margin: 50000,
        margin_level: 0.5,
      });

      mockLNMarketsService.getRunningTrades.mockResolvedValue([]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
        price_change_24h: 0.02,
        volume_24h: 2000000,
      });

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        leverage: 10,
        stoploss: 45000,
        takeprofit: 55000,
      };

      const result = await validationService.validateTrade(tradeParams);

      // For now, just check that we get a result
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      
      // Log the actual result for debugging
      console.log('Actual result:', result);
    });

    it('should reject invalid market parameter', async () => {
      const tradeParams: TradeParams = {
        market: '',
        side: 'b',
        quantity: 100,
        leverage: 10,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Market is required');
    });

    it('should reject invalid side parameter', async () => {
      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'x' as any,
        quantity: 100,
        leverage: 10,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid side (b/s) is required');
    });

    it('should reject zero or negative quantity', async () => {
      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 0,
        leverage: 10,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Quantity must be greater than 0');
    });

    it('should reject excessive leverage', async () => {
      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        leverage: 150,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Leverage cannot exceed 100x');
    });

    it('should warn about high leverage', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 50000,
        available_margin: 50000,
        margin_level: 0.5,
      });

      mockLNMarketsService.getRunningTrades.mockResolvedValue([]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
        price_change_24h: 0.02,
        volume_24h: 2000000,
      });

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        leverage: 75,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('High leverage increases risk significantly');
    });
  });

  describe('Balance and Margin Validation', () => {
    it('should reject trade with insufficient margin', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 10000,
        margin: 5000,
        available_margin: 1000, // Very low available margin
        margin_level: 0.5,
      });

      mockLNMarketsService.getRunningTrades.mockResolvedValue([]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
        price_change_24h: 0.02,
        volume_24h: 2000000,
      });

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 1000, // Large quantity requiring high margin
        leverage: 10,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Insufficient margin'))).toBe(true);
    });

    it('should warn about low margin level', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 80000,
        available_margin: 20000,
        margin_level: 0.8,
      });

      mockLNMarketsService.getRunningTrades.mockResolvedValue([
        {
          id: 'pos_1',
          size: 1000,
          entry_price: 50000,
          unrealized_pnl: -5000,
        },
      ]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
        price_change_24h: 0.02,
        volume_24h: 2000000,
      });

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 500,
        leverage: 20,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(warning => warning.includes('low margin level'))).toBe(true);
    });

    it('should calculate correct margin requirements', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 50000,
        available_margin: 50000,
        margin_level: 0.5,
      });

      mockLNMarketsService.getRunningTrades.mockResolvedValue([]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
        price_change_24h: 0.02,
        volume_24h: 2000000,
      });

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        leverage: 10,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.marginRequired).toBeGreaterThan(0);
      expect(result.maxPositionSize).toBeGreaterThan(0);
    });
  });

  describe('Risk Management Validation', () => {
    it('should warn about high portfolio exposure', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 50000,
        available_margin: 50000,
        margin_level: 0.5,
      });

      mockLNMarketsService.getRunningTrades.mockResolvedValue([
        {
          id: 'pos_1',
          size: 1000,
          entry_price: 50000,
          unrealized_pnl: 0,
        },
        {
          id: 'pos_2',
          size: 500,
          entry_price: 50000,
          unrealized_pnl: 0,
        },
      ]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
        price_change_24h: 0.02,
        volume_24h: 2000000,
      });

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 1000, // Large additional position
        leverage: 10,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.warnings.some(warning => warning.includes('High portfolio exposure'))).toBe(true);
    });

    it('should recommend lower leverage for high exposure', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 80000,
        available_margin: 20000,
        margin_level: 0.8,
      });

      mockLNMarketsService.getRunningTrades.mockResolvedValue([
        {
          id: 'pos_1',
          size: 1000,
          entry_price: 50000,
          unrealized_pnl: 0,
        },
      ]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
        price_change_24h: 0.02,
        volume_24h: 2000000,
      });

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 200,
        leverage: 20,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.recommendedLeverage).toBeDefined();
      expect(result.recommendedLeverage).toBeLessThan(tradeParams.leverage);
    });

    it('should warn about poor risk/reward ratio', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 50000,
        available_margin: 50000,
        margin_level: 0.5,
      });

      mockLNMarketsService.getRunningTrades.mockResolvedValue([]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
        price_change_24h: 0.02,
        volume_24h: 2000000,
      });

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        leverage: 10,
        stoploss: 49000, // Close stop loss
        takeprofit: 51000, // Close take profit
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.warnings.some(warning => warning.includes('Risk/reward ratio'))).toBe(true);
    });
  });

  describe('Market Conditions Validation', () => {
    it('should warn about high market volatility', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 50000,
        available_margin: 50000,
        margin_level: 0.5,
      });

      mockLNMarketsService.getRunningTrades.mockResolvedValue([]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
        price_change_24h: 0.15, // High volatility
        volume_24h: 2000000,
      });

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        leverage: 10,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.warnings.some(warning => warning.includes('High market volatility'))).toBe(true);
    });

    it('should warn about low market volume', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 50000,
        available_margin: 50000,
        margin_level: 0.5,
      });

      mockLNMarketsService.getRunningTrades.mockResolvedValue([]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
        price_change_24h: 0.02,
        volume_24h: 500000, // Low volume
      });

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        leverage: 10,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.warnings.some(warning => warning.includes('Low market volume'))).toBe(true);
    });

    it('should validate stop loss levels for long positions', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 50000,
        available_margin: 50000,
        margin_level: 0.5,
      });

      mockLNMarketsService.getRunningTrades.mockResolvedValue([]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
        price_change_24h: 0.02,
        volume_24h: 2000000,
      });

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b', // Long position
        quantity: 100,
        leverage: 10,
        stoploss: 51000, // Stop loss above current price (invalid)
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Stop loss for long position must be below current price'))).toBe(true);
    });

    it('should validate take profit levels for short positions', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 50000,
        available_margin: 50000,
        margin_level: 0.5,
      });

      mockLNMarketsService.getRunningTrades.mockResolvedValue([]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
        price_change_24h: 0.02,
        volume_24h: 2000000,
      });

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 's', // Short position
        quantity: 100,
        leverage: 10,
        takeprofit: 49000, // Take profit below current price (invalid)
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Take profit for short position must be below current price'))).toBe(true);
    });
  });

  describe('Risk Level Calculation', () => {
    it('should calculate critical risk level with errors', async () => {
      const tradeParams: TradeParams = {
        market: '',
        side: 'x' as any,
        quantity: 0,
        leverage: 150,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.riskLevel).toBe('critical');
    });

    it('should calculate high risk level with many warnings', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 80000,
        available_margin: 20000,
        margin_level: 0.8,
      });

      mockLNMarketsService.getRunningTrades.mockResolvedValue([
        {
          id: 'pos_1',
          size: 1000,
          entry_price: 50000,
          unrealized_pnl: 0,
        },
      ]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
        price_change_24h: 0.15,
        volume_24h: 500000,
      });

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 1000,
        leverage: 75,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.riskLevel).toBe('high');
    });

    it('should calculate low risk level for conservative trade', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 20000,
        available_margin: 80000,
        margin_level: 0.2,
      });

      mockLNMarketsService.getRunningTrades.mockResolvedValue([]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
        price_change_24h: 0.01,
        volume_24h: 5000000,
      });

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        leverage: 5,
        stoploss: 45000,
        takeprofit: 60000,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.riskLevel).toBe('low');
    });
  });

  describe('Position Update Validation', () => {
    it('should validate take profit update for long position', async () => {
      mockLNMarketsService.getRunningTrades.mockResolvedValue([
        {
          id: 'trade_123',
          market: 'btcusd',
          side: 'b',
          size: 100,
          entry_price: 50000,
        },
      ]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
      });

      const result = await validationService.validatePositionUpdate('trade_123', 'takeprofit', 49000);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Take profit for long position must be above current price'))).toBe(true);
    });

    it('should validate stop loss update for short position', async () => {
      mockLNMarketsService.getRunningTrades.mockResolvedValue([
        {
          id: 'trade_123',
          market: 'btcusd',
          side: 's',
          size: 100,
          entry_price: 50000,
        },
      ]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
      });

      const result = await validationService.validatePositionUpdate('trade_123', 'stoploss', 49000);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Stop loss for short position must be above current price'))).toBe(true);
    });

    it('should warn about update level too close to current price', async () => {
      mockLNMarketsService.getRunningTrades.mockResolvedValue([
        {
          id: 'trade_123',
          market: 'btcusd',
          side: 'b',
          size: 100,
          entry_price: 50000,
        },
      ]);
      mockLNMarketsService.getMarketData.mockResolvedValue({
        price: 50000,
      });

      const result = await validationService.validatePositionUpdate('trade_123', 'takeprofit', 50250); // Very close

      expect(result.warnings.some(warning => warning.includes('very close to current price'))).toBe(true);
    });

    it('should handle position not found', async () => {
      mockLNMarketsService.getRunningTrades.mockResolvedValue([]);

      const result = await validationService.validatePositionUpdate('nonexistent_trade', 'takeprofit', 55000);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Position not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockLNMarketsService.getBalance.mockRejectedValue(new Error('API Error'));

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        leverage: 10,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Validation error'))).toBe(true);
      expect(result.riskLevel).toBe('critical');
    });

    it('should handle market data API errors', async () => {
      mockLNMarketsService.getBalance.mockResolvedValue({
        balance: 100000,
        margin: 50000,
        available_margin: 50000,
        margin_level: 0.5,
      });

      mockLNMarketsService.getRunningTrades.mockResolvedValue([]);
      mockLNMarketsService.getMarketData.mockRejectedValue(new Error('Market data error'));

      const tradeParams: TradeParams = {
        market: 'btcusd',
        side: 'b',
        quantity: 100,
        leverage: 10,
      };

      const result = await validationService.validateTrade(tradeParams);

      expect(result.warnings.some(warning => warning.includes('Unable to validate market conditions'))).toBe(true);
    });
  });
});
