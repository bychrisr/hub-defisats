import { useState, useEffect, useCallback } from 'react';
import { marketDataService } from '@/services/marketData.service';

type CandlestickPoint = { time: number; open: number; high: number; low: number; close: number };

interface UseCandleDataProps {
  symbol: string;
  timeframe: string;
  limit?: number;
  enabled?: boolean;
}

interface UseCandleDataReturn {
  candleData: CandlestickPoint[] | undefined;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useCandleData = ({
  symbol,
  timeframe,
  limit = 500,
  enabled = true
}: UseCandleDataProps): UseCandleDataReturn => {
  const [candleData, setCandleData] = useState<CandlestickPoint[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCandleData = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 CANDLE DATA - Fetching data:', { symbol, timeframe, limit });
      
      const rawData = await marketDataService.getHistoricalData(symbol, timeframe, limit);
      
      const mappedData: CandlestickPoint[] = rawData.map((candle) => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close
      }));
      
      setCandleData(mappedData);
      console.log('✅ CANDLE DATA - Data fetched successfully:', {
        count: mappedData.length,
        timeframe,
        symbol
      });
      
    } catch (err: any) {
      console.error('❌ CANDLE DATA - Error fetching data:', err);
      setError(err.message || 'Failed to fetch candle data');
      setCandleData(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe, limit, enabled]);

  useEffect(() => {
    fetchCandleData();
  }, [fetchCandleData]);

  return {
    candleData,
    isLoading,
    error,
    refetch: fetchCandleData
  };
};
