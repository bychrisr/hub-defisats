// __tests__/indicators.test.ts
import { computeEMAFromBars, computeSMAFromBars, computeRSI, computeMACD, computeBollinger } from '@/utils/indicators';
import { LwcBar } from '@/types/chart';

// Helper function to create test data
function createTestBars(count: number, startPrice = 100): LwcBar[] {
  const bars: LwcBar[] = [];
  let price = startPrice;
  
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * 4; // Random change between -2 and +2
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    
    bars.push({
      time: i + 1,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000
    });
    
    price = close;
  }
  
  return bars;
}

describe('Technical Indicators', () => {
  describe('SMA (Simple Moving Average)', () => {
    test('should compute SMA correctly for known data', () => {
      const bars: LwcBar[] = [
        { time: 1, open: 100, high: 105, low: 95, close: 102 },
        { time: 2, open: 102, high: 108, low: 98, close: 106 },
        { time: 3, open: 106, high: 110, low: 104, close: 108 },
        { time: 4, open: 108, high: 112, low: 106, close: 110 },
        { time: 5, open: 110, high: 115, low: 108, close: 113 }
      ];
      
      const sma = computeSMAFromBars(bars, 3);
      
      expect(sma).toHaveLength(3);
      expect(sma[0].time).toBe(3);
      expect(sma[0].value).toBeCloseTo((102 + 106 + 108) / 3, 2);
      expect(sma[1].time).toBe(4);
      expect(sma[1].value).toBeCloseTo((106 + 108 + 110) / 3, 2);
      expect(sma[2].time).toBe(5);
      expect(sma[2].value).toBeCloseTo((108 + 110 + 113) / 3, 2);
    });

    test('should return empty array for insufficient data', () => {
      const bars: LwcBar[] = [
        { time: 1, open: 100, high: 105, low: 95, close: 102 },
        { time: 2, open: 102, high: 108, low: 98, close: 106 }
      ];
      
      const sma = computeSMAFromBars(bars, 5);
      expect(sma).toHaveLength(0);
    });
  });

  describe('EMA (Exponential Moving Average)', () => {
    test('should compute EMA correctly', () => {
      const bars: LwcBar[] = [
        { time: 1, open: 100, high: 105, low: 95, close: 100 },
        { time: 2, open: 100, high: 105, low: 95, close: 102 },
        { time: 3, open: 102, high: 107, low: 97, close: 104 },
        { time: 4, open: 104, high: 109, low: 99, close: 106 },
        { time: 5, open: 106, high: 111, low: 101, close: 108 }
      ];
      
      const ema = computeEMAFromBars(bars, 3);
      
      expect(ema).toHaveLength(3);
      expect(ema[0].time).toBe(3);
      expect(ema[0].value).toBeCloseTo((100 + 102 + 104) / 3, 2); // First EMA = SMA
    });

    test('should return empty array for insufficient data', () => {
      const bars: LwcBar[] = [
        { time: 1, open: 100, high: 105, low: 95, close: 100 }
      ];
      
      const ema = computeEMAFromBars(bars, 3);
      expect(ema).toHaveLength(0);
    });
  });

  describe('RSI (Relative Strength Index)', () => {
    test('should compute RSI with known values', () => {
      // Create a simple trending dataset
      const bars: LwcBar[] = [];
      let price = 100;
      
      // Create 20 bars with alternating gains and losses
      for (let i = 0; i < 20; i++) {
        const change = i % 2 === 0 ? 2 : -1; // Alternating gains and losses
        price += change;
        
        bars.push({
          time: i + 1,
          open: price - change,
          high: price + Math.random(),
          low: price - Math.random(),
          close: price,
          volume: 1000
        });
      }
      
      const rsi = computeRSI(bars, 14);
      
      expect(rsi.length).toBeGreaterThan(0);
      expect(rsi[0].time).toBe(15); // First RSI at index 14 (period 14)
      
      // RSI should be between 0 and 100
      rsi.forEach(point => {
        expect(point.value).toBeGreaterThanOrEqual(0);
        expect(point.value).toBeLessThanOrEqual(100);
      });
    });

    test('should return empty array for insufficient data', () => {
      const bars: LwcBar[] = createTestBars(10);
      const rsi = computeRSI(bars, 14);
      expect(rsi).toHaveLength(0);
    });
  });

  describe('MACD (Moving Average Convergence Divergence)', () => {
    test('should compute MACD components', () => {
      const bars = createTestBars(50);
      const macd = computeMACD(bars, 12, 26, 9);
      
      expect(macd.macdLine).toBeDefined();
      expect(macd.signalLine).toBeDefined();
      expect(macd.histogram).toBeDefined();
      
      expect(macd.macdLine.length).toBeGreaterThan(0);
      expect(macd.signalLine.length).toBeGreaterThan(0);
      expect(macd.histogram.length).toBeGreaterThan(0);
      
      // MACD line should start after slow EMA period (26)
      expect(macd.macdLine[0].time).toBeGreaterThanOrEqual(26);
      
      // Signal line should start after signal period (9) from MACD line
      expect(macd.signalLine[0].time).toBeGreaterThanOrEqual(26 + 9 - 1);
    });

    test('should return empty arrays for insufficient data', () => {
      const bars = createTestBars(10);
      const macd = computeMACD(bars, 12, 26, 9);
      
      expect(macd.macdLine).toHaveLength(0);
      expect(macd.signalLine).toHaveLength(0);
      expect(macd.histogram).toHaveLength(0);
    });
  });

  describe('Bollinger Bands', () => {
    test('should compute Bollinger Bands correctly', () => {
      const bars = createTestBars(30);
      const bb = computeBollinger(bars, 20, 2);
      
      expect(bb.middle).toBeDefined();
      expect(bb.upper).toBeDefined();
      expect(bb.lower).toBeDefined();
      
      expect(bb.middle.length).toBeGreaterThan(0);
      expect(bb.upper.length).toBeGreaterThan(0);
      expect(bb.lower.length).toBeGreaterThan(0);
      
      // Upper band should be higher than middle, lower should be lower
      bb.upper.forEach((upper, index) => {
        const middle = bb.middle[index];
        const lower = bb.lower[index];
        
        expect(upper.value).toBeGreaterThan(middle.value);
        expect(middle.value).toBeGreaterThan(lower.value);
      });
    });

    test('should return empty arrays for insufficient data', () => {
      const bars = createTestBars(10);
      const bb = computeBollinger(bars, 20, 2);
      
      expect(bb.middle).toHaveLength(0);
      expect(bb.upper).toHaveLength(0);
      expect(bb.lower).toHaveLength(0);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large datasets efficiently', () => {
      const bars = createTestBars(1000);
      
      const startTime = Date.now();
      
      const ema = computeEMAFromBars(bars, 20);
      const rsi = computeRSI(bars, 14);
      const macd = computeMACD(bars, 12, 26, 9);
      const bb = computeBollinger(bars, 20, 2);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
      
      expect(ema.length).toBeGreaterThan(0);
      expect(rsi.length).toBeGreaterThan(0);
      expect(macd.macdLine.length).toBeGreaterThan(0);
      expect(bb.middle.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty input', () => {
      const emptyBars: LwcBar[] = [];
      
      expect(computeSMAFromBars(emptyBars, 5)).toHaveLength(0);
      expect(computeEMAFromBars(emptyBars, 5)).toHaveLength(0);
      expect(computeRSI(emptyBars, 14)).toHaveLength(0);
      expect(computeMACD(emptyBars, 12, 26, 9).macdLine).toHaveLength(0);
      expect(computeBollinger(emptyBars, 20, 2).middle).toHaveLength(0);
    });

    test('should handle single data point', () => {
      const singleBar: LwcBar[] = [
        { time: 1, open: 100, high: 105, low: 95, close: 102, volume: 1000 }
      ];
      
      expect(computeSMAFromBars(singleBar, 5)).toHaveLength(0);
      expect(computeEMAFromBars(singleBar, 5)).toHaveLength(0);
      expect(computeRSI(singleBar, 14)).toHaveLength(0);
      expect(computeMACD(singleBar, 12, 26, 9).macdLine).toHaveLength(0);
      expect(computeBollinger(singleBar, 20, 2).middle).toHaveLength(0);
    });
  });
});
