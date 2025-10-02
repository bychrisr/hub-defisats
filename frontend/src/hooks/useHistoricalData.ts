import { useState, useEffect, useCallback, useRef } from 'react';
import { marketDataService } from '@/services/marketData.service';

type CandlestickPoint = { time: number; open: number; high: number; low: number; close: number };

interface UseHistoricalDataProps {
  symbol: string;
  timeframe: string;
  initialLimit?: number;
  enabled?: boolean;
}

interface UseHistoricalDataReturn {
  candleData: CandlestickPoint[] | undefined;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMoreData: boolean;
  loadMoreHistorical: () => Promise<void>;
  resetData: () => void;
}

export const useHistoricalData = ({
  symbol,
  timeframe,
  initialLimit = 168, // 7 dias para 1h
  enabled = true
}: UseHistoricalDataProps): UseHistoricalDataReturn => {
  const [candleData, setCandleData] = useState<CandlestickPoint[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [oldestTimestamp, setOldestTimestamp] = useState<number | null>(null);
  const loadingRef = useRef(false);

  // Função para calcular limite baseado no timeframe
  const getLimitForTimeframe = useCallback((tf: string): number => {
    const tfLower = tf.toLowerCase();
    if (tfLower.includes('1m')) return 1;
    if (tfLower.includes('5m')) return 5;
    if (tfLower.includes('15m')) return 15;
    if (tfLower.includes('30m')) return 30;
    if (tfLower.includes('1h')) return 60;
    if (tfLower.includes('4h')) return 240;
    if (tfLower.includes('1d')) return 1440;
    return 60; // Default 1h
  }, []);

  // Carregar dados iniciais (sem useCallback para evitar problemas de dependência)
  const loadInitialData = async () => {
    console.log('🔄 HISTORICAL - loadInitialData called:', { enabled, loadingRef: loadingRef.current });
    if (!enabled || loadingRef.current) {
      console.log('🔄 HISTORICAL - Early return from loadInitialData:', { enabled, loadingRef: loadingRef.current });
      return;
    }
    
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 HISTORICAL - Loading initial data:', { symbol, timeframe, limit: initialLimit });
      
      // Timeout de 15 segundos para evitar travamento
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000);
      });

      const dataPromise = marketDataService.getHistoricalDataFromBinance(symbol, timeframe, initialLimit);
      
      const rawData = await Promise.race([dataPromise, timeoutPromise]);
      
      const mappedData: CandlestickPoint[] = rawData.map((candle) => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close
      }));
      
      // Ordenar dados por tempo (ascendente) - REQUISITO OBRIGATÓRIO do Lightweight Charts
      const sortedData = mappedData.sort((a, b) => a.time - b.time);
      
      setCandleData(sortedData);
      
      // Definir timestamp mais antigo para próxima carga
      if (mappedData.length > 0) {
        const oldest = Math.min(...mappedData.map(c => c.time));
        setOldestTimestamp(oldest);
        const hasMore = mappedData.length === initialLimit;
        setHasMoreData(hasMore);
        
        console.log('✅ HISTORICAL - Initial data loaded:', {
          count: mappedData.length,
          oldestTimestamp: oldest,
          hasMoreData: hasMore,
          initialLimit
        });
      }
      
    } catch (err: any) {
      console.error('❌ HISTORICAL - Error loading initial data:', err);
      setError(err.message || 'Failed to load initial data');
      
      // Reset loadingRef em caso de erro para permitir nova tentativa
      loadingRef.current = false;
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  // Carregar mais dados históricos
  const loadMoreHistorical = useCallback(async () => {
    if (!enabled || !hasMoreData || loadingRef.current || !oldestTimestamp) {
      console.log('🔄 HISTORICAL - Load more conditions not met:', {
        enabled,
        hasMoreData,
        loadingRef: loadingRef.current,
        oldestTimestamp
      });
      return;
    }
    
    loadingRef.current = true;
    setIsLoadingMore(true);
    setError(null);
    
    try {
      console.log('🔄 HISTORICAL - Loading more data:', { 
        symbol, 
        timeframe, 
        oldestTimestamp,
        limit: initialLimit 
      });
      
      // Calcular timestamp de início para dados anteriores
      const timeframeMinutes = getLimitForTimeframe(timeframe);
      const startTime = oldestTimestamp - (initialLimit * timeframeMinutes * 60);
      
      // Usar apenas Binance API (sem autenticação) para evitar 401
      const rawData = await marketDataService.getHistoricalDataFromBinance(
        symbol, 
        timeframe, 
        initialLimit,
        startTime
      );
      
      if (rawData.length === 0) {
        setHasMoreData(false);
        return;
      }
      
      const mappedData: CandlestickPoint[] = rawData.map((candle) => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close
      }));
      
      // Adicionar novos dados ao início do array (dados mais antigos)
      setCandleData(prev => {
        const combinedData = [...mappedData, ...(prev || [])];
        
        // Ordenar dados por tempo (ascendente) - REQUISITO OBRIGATÓRIO do Lightweight Charts
        const sortedData = combinedData.sort((a, b) => a.time - b.time);
        
        return sortedData;
      });
      
      // Atualizar timestamp mais antigo
      if (mappedData.length > 0) {
        const newOldest = Math.min(...mappedData.map(c => c.time));
        setOldestTimestamp(newOldest);
        setHasMoreData(mappedData.length === initialLimit);
      }
      
      console.log('✅ HISTORICAL - More data loaded:', {
        newCount: mappedData.length,
        totalCount: (candleData?.length || 0) + mappedData.length,
        oldestTimestamp: oldestTimestamp
      });
      
    } catch (err: any) {
      console.error('❌ HISTORICAL - Error loading more data:', err);
      setError(err.message || 'Failed to load more historical data');
    } finally {
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [symbol, timeframe, initialLimit, enabled, hasMoreData, oldestTimestamp, candleData?.length]);

  // Resetar dados
  const resetData = useCallback(() => {
    setCandleData(undefined);
    setOldestTimestamp(null);
    setHasMoreData(true);
    setError(null);
    loadingRef.current = false;
  }, []);

  // Carregar dados iniciais automaticamente
  useEffect(() => {
    console.log('🔄 HISTORICAL - useEffect triggered:', { enabled, symbol, timeframe, initialLimit });
    if (enabled) {
      loadInitialData();
    }
  }, [enabled, symbol, timeframe, initialLimit]); // Remover loadInitialData das dependências

  return {
    candleData,
    isLoading,
    isLoadingMore,
    error,
    hasMoreData,
    loadMoreHistorical,
    resetData,
    // Expor função para carregar dados iniciais
    loadInitialData
  };
};