import { describe, it, expect, beforeEach } from '@jest/globals';
import { TradingValidationService } from '../services/trading-validation.service';

describe('TradingValidationService Simple Tests', () => {
  let validationService: TradingValidationService;
  let mockLNMarketsService: any;

  beforeEach(() => {
    // Create mock LNMarketsService
    mockLNMarketsService = {
      getBalance: jest.fn(),
      getRunningTrades: jest.fn(),
      getMarketData: jest.fn(),
    };

    validationService = new TradingValidationService(mockLNMarketsService);
  });

  it('should create service instance', () => {
    expect(validationService).toBeDefined();
  });

  it('should validate basic parameters correctly', async () => {
    const tradeParams = {
      market: 'btcusd',
      side: 'b' as const,
      quantity: 100,
      leverage: 10,
    };

    // Mock all required methods
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

    const result = await validationService.validateTrade(tradeParams);

    // Basic checks
    expect(result).toBeDefined();
    expect(result.isValid).toBeDefined();
    expect(result.errors).toBeDefined();
    expect(result.warnings).toBeDefined();
    expect(result.riskLevel).toBeDefined();
    expect(result.marginRequired).toBeDefined();
    expect(result.availableMargin).toBeDefined();
    expect(result.maxPositionSize).toBeDefined();

    // Check that the service was called
    expect(mockLNMarketsService.getBalance).toHaveBeenCalled();
    expect(mockLNMarketsService.getRunningTrades).toHaveBeenCalled();
    expect(mockLNMarketsService.getMarketData).toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    const tradeParams = {
      market: 'btcusd',
      side: 'b' as const,
      quantity: 100,
      leverage: 10,
    };

    // Mock API error
    mockLNMarketsService.getBalance.mockRejectedValue(new Error('API Error'));

    const result = await validationService.validateTrade(tradeParams);

    expect(result).toBeDefined();
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.riskLevel).toBe('critical');
  });

  it('should validate position update', async () => {
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

    const result = await validationService.validatePositionUpdate('trade_123', 'takeprofit', 55000);

    expect(result).toBeDefined();
    expect(result.isValid).toBeDefined();
    expect(result.errors).toBeDefined();
    expect(result.warnings).toBeDefined();
  });
});
