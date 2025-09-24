import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { HistoricalDataService } from '../services/historical-data.service';

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('HistoricalDataService Tests', () => {
  let historicalDataService: HistoricalDataService;

  beforeEach(() => {
    jest.clearAllMocks();
    historicalDataService = new HistoricalDataService();
  });

  describe('getCoinGeckoHistoricalData', () => {
    it('should fetch CoinGecko historical data successfully', async () => {
      const mockResponse = {
        data: {
          prices: [
            [1640995200000, 50000], // timestamp, price
            [1640998800000, 51000],
            [1641002400000, 49000],
          ],
          total_volumes: [
            [1640995200000, 1000000],
            [1640998800000, 1200000],
            [1641002400000, 800000],
          ],
          market_caps: [
            [1640995200000, 950000000000],
            [1640998800000, 970000000000],
            [1641002400000, 930000000000],
          ],
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const result = await historicalDataService.getCoinGeckoHistoricalData('bitcoin', 30, 'hourly');

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('timestamp');
      expect(result[0]).toHaveProperty('open');
      expect(result[0]).toHaveProperty('high');
      expect(result[0]).toHaveProperty('low');
      expect(result[0]).toHaveProperty('close');
      expect(result[0]).toHaveProperty('volume');
      expect(result[0].timestamp).toBe(1640995200); // Converted to seconds
      expect(result[0].close).toBe(50000);
    });

    it('should handle CoinGecko API errors', async () => {
      axios.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(historicalDataService.getCoinGeckoHistoricalData('bitcoin', 30, 'hourly'))
        .rejects.toThrow('Failed to fetch CoinGecko data: Error: API Error');
    });

    it('should handle invalid CoinGecko response', async () => {
      const mockResponse = {
        data: {
          // Missing prices array
          total_volumes: [],
          market_caps: [],
        },
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      await expect(historicalDataService.getCoinGeckoHistoricalData('bitcoin', 30, 'hourly'))
        .rejects.toThrow('Invalid CoinGecko response format');
    });
  });

  describe('getBinanceHistoricalData', () => {
    it('should fetch Binance historical data successfully', async () => {
      const mockResponse = {
        data: [
          [1640995200000, '50000', '51000', '49000', '50500', '1000000'], // timestamp, open, high, low, close, volume
          [1640998800000, '50500', '51500', '49500', '51000', '1200000'],
          [1641002400000, '51000', '52000', '50000', '49500', '800000'],
        ],
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      const result = await historicalDataService.getBinanceHistoricalData('BTCUSDT', '1h', 100);

      expect(result).toHaveLength(3);
      expect(result[0]).toHaveProperty('timestamp');
      expect(result[0]).toHaveProperty('open');
      expect(result[0]).toHaveProperty('high');
      expect(result[0]).toHaveProperty('low');
      expect(result[0]).toHaveProperty('close');
      expect(result[0]).toHaveProperty('volume');
      expect(result[0].timestamp).toBe(1640995200); // Converted to seconds
      expect(result[0].open).toBe(50000);
      expect(result[0].high).toBe(51000);
      expect(result[0].low).toBe(49000);
      expect(result[0].close).toBe(50500);
      expect(result[0].volume).toBe(1000000);
    });

    it('should handle Binance API errors', async () => {
      axios.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(historicalDataService.getBinanceHistoricalData('BTCUSDT', '1h', 100))
        .rejects.toThrow('Failed to fetch Binance data: Error: API Error');
    });

    it('should handle invalid Binance response', async () => {
      const mockResponse = {
        data: 'invalid response', // Not an array
      };

      axios.get.mockResolvedValueOnce(mockResponse);

      await expect(historicalDataService.getBinanceHistoricalData('BTCUSDT', '1h', 100))
        .rejects.toThrow('Invalid Binance response format');
    });
  });

  describe('getHistoricalData with fallback', () => {
    it('should use Binance data when available', async () => {
      const mockBinanceResponse = {
        data: [
          [1640995200000, '50000', '51000', '49000', '50500', '1000000'],
        ],
      };

      axios.get.mockResolvedValueOnce(mockBinanceResponse);

      const result = await historicalDataService.getHistoricalData('btcusd', '1h', 100);

      expect(result).toHaveLength(1);
      expect(result[0].market).toBe('btcusd');
      expect(result[0].timestamp).toBeInstanceOf(Date);
      expect(result[0].open).toBe(50000);
      expect(result[0].high).toBe(51000);
      expect(result[0].low).toBe(49000);
      expect(result[0].close).toBe(50500);
      expect(result[0].volume).toBe(1000000);
    });

    it('should fallback to CoinGecko when Binance fails', async () => {
      // Binance fails
      axios.get.mockRejectedValueOnce(new Error('Binance API Error'));

      // CoinGecko succeeds
      const mockCoinGeckoResponse = {
        data: {
          prices: [[1640995200000, 50000]],
          total_volumes: [[1640995200000, 1000000]],
          market_caps: [[1640995200000, 950000000000]],
        },
      };

      axios.get.mockResolvedValueOnce(mockCoinGeckoResponse);

      const result = await historicalDataService.getHistoricalData('btcusd', '1h', 100);

      expect(result).toHaveLength(1);
      expect(result[0].market).toBe('btcusd');
      expect(result[0].close).toBe(50000);
    });

    it('should use simulated data when both APIs fail', async () => {
      // Both APIs fail
      axios.get.mockRejectedValue(new Error('API Error'));

      const result = await historicalDataService.getHistoricalData('btcusd', '1h', 100);

      expect(result).toHaveLength(100);
      expect(result[0].market).toBe('btcusd');
      expect(result[0].timestamp).toBeInstanceOf(Date);
      expect(result[0].open).toBeGreaterThan(0);
      expect(result[0].high).toBeGreaterThan(0);
      expect(result[0].low).toBeGreaterThan(0);
      expect(result[0].close).toBeGreaterThan(0);
      expect(result[0].volume).toBeGreaterThan(0);
    });
  });

  describe('market mapping', () => {
    it('should map markets to Binance symbols correctly', async () => {
      const mockResponse = {
        data: [[1640995200000, '50000', '51000', '49000', '50500', '1000000']],
      };

      axios.get.mockResolvedValue(mockResponse);

      // Test different market mappings
      await historicalDataService.getHistoricalData('btcusd', '1h', 1);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.binance.com/api/v3/klines',
        expect.objectContaining({
          params: expect.objectContaining({
            symbol: 'BTCUSDT',
          }),
        })
      );

      await historicalDataService.getHistoricalData('ethusd', '1h', 1);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.binance.com/api/v3/klines',
        expect.objectContaining({
          params: expect.objectContaining({
            symbol: 'ETHUSDT',
          }),
        })
      );
    });

    it('should map markets to CoinGecko IDs correctly', async () => {
      // Binance fails, CoinGecko succeeds
      axios.get.mockRejectedValueOnce(new Error('Binance Error'));

      const mockCoinGeckoResponse = {
        data: {
          prices: [[1640995200000, 50000]],
          total_volumes: [[1640995200000, 1000000]],
          market_caps: [[1640995200000, 950000000000]],
        },
      };

      axios.get.mockResolvedValueOnce(mockCoinGeckoResponse);

      await historicalDataService.getHistoricalData('btcusd', '1h', 1);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('bitcoin'),
        expect.any(Object)
      );
    });
  });

  describe('timeframe mapping', () => {
    it('should map timeframes correctly', async () => {
      const mockResponse = {
        data: [[1640995200000, '50000', '51000', '49000', '50500', '1000000']],
      };

      axios.get.mockResolvedValue(mockResponse);

      // Test different timeframes
      await historicalDataService.getHistoricalData('btcusd', '1h', 1);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.binance.com/api/v3/klines',
        expect.objectContaining({
          params: expect.objectContaining({
            interval: '1h',
          }),
        })
      );

      await historicalDataService.getHistoricalData('btcusd', '1d', 1);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.binance.com/api/v3/klines',
        expect.objectContaining({
          params: expect.objectContaining({
            interval: '1d',
          }),
        })
      );
    });
  });

  describe('cache functionality', () => {
    it('should use cached data when available', async () => {
      const mockResponse = {
        data: [[1640995200000, '50000', '51000', '49000', '50500', '1000000']],
      };

      axios.get.mockResolvedValue(mockResponse);

      // First call
      await historicalDataService.getHistoricalData('btcusd', '1h', 1);
      expect(axios.get).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await historicalDataService.getHistoricalData('btcusd', '1h', 1);
      expect(axios.get).toHaveBeenCalledTimes(1); // Still 1, using cache
    });

    it('should clear expired cache', () => {
      const stats = historicalDataService.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
    });
  });

  describe('data validation', () => {
    it('should validate historical candle structure', async () => {
      const mockResponse = {
        data: [[1640995200000, '50000', '51000', '49000', '50500', '1000000']],
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await historicalDataService.getHistoricalData('btcusd', '1h', 1);

      expect(result[0]).toHaveProperty('timestamp');
      expect(result[0]).toHaveProperty('open');
      expect(result[0]).toHaveProperty('high');
      expect(result[0]).toHaveProperty('low');
      expect(result[0]).toHaveProperty('close');
      expect(result[0]).toHaveProperty('volume');
      expect(result[0]).toHaveProperty('market');

      expect(typeof result[0].timestamp).toBe('object'); // Date object
      expect(typeof result[0].open).toBe('number');
      expect(typeof result[0].high).toBe('number');
      expect(typeof result[0].low).toBe('number');
      expect(typeof result[0].close).toBe('number');
      expect(typeof result[0].volume).toBe('number');
      expect(typeof result[0].market).toBe('string');
    });
  });
});
