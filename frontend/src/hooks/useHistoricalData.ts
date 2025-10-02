import { useState, useEffect, useCallback, useRef } from 'react';
import { marketDataService } from '@/services/marketData.service';

type CandlestickPoint = { time: number; open: number; high: number; low: number; close: number };

interface UseHistoricalDataProps {
  symbol: string;
  timeframe: string;
  initialLimit?: number;
  enabled?: boolean;
  maxDataPoints?: number; // Limite máximo de dados em memória
  loadThreshold?: number; // Quantos candles antes do fim para carregar mais
}

interface UseHistoricalDataReturn {
  candleData: CandlestickPoint[] | undefined;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMoreData: boolean;
  loadMoreHistorical: () => Promise<void>;
  resetData: () => void;
  // Novas funções para controle avançado
  loadDataForRange: (startTime: number, endTime: number) => Promise<void>;
  getDataRange: () => { start: number; end: number } | null;
  isDataAvailable: (time: number) => boolean;
  // Função para carregar dados iniciais
  loadInitialData: () => Promise<void>;
}

export const useHistoricalData = ({
  symbol,
  timeframe,
  initialLimit = 168, // 7 dias para 1h
  enabled = true,
  maxDataPoints = 10000, // Máximo 10k candles em memória
  loadThreshold = 20 // Carregar mais quando restam 20 candles
}: UseHistoricalDataProps): UseHistoricalDataReturn => {
  const [candleData, setCandleData] = useState<CandlestickPoint[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [oldestTimestamp, setOldestTimestamp] = useState<number | null>(null);
  const [newestTimestamp, setNewestTimestamp] = useState<number | null>(null);
  const loadingRef = useRef(false);
  const dataCacheRef = useRef<Map<string, CandlestickPoint[]>>(new Map());

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

  // Função para gerenciar cache de dados
  const getCacheKey = useCallback((startTime: number, endTime: number) => {
    return `${symbol}-${timeframe}-${startTime}-${endTime}`;
  }, [symbol, timeframe]);

  const addToCache = useCallback((data: CandlestickPoint[], startTime: number, endTime: number) => {
    const key = getCacheKey(startTime, endTime);
    dataCacheRef.current.set(key, data);
    
    // Limitar cache a 50 entradas
    if (dataCacheRef.current.size > 50) {
      const firstKey = dataCacheRef.current.keys().next().value;
      dataCacheRef.current.delete(firstKey);
    }
  }, [getCacheKey]);

  const getFromCache = useCallback((startTime: number, endTime: number) => {
    const key = getCacheKey(startTime, endTime);
    return dataCacheRef.current.get(key);
  }, [getCacheKey]);

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
      
      // Remover duplicatas baseado no timestamp
      const uniqueData = mappedData.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.time === current.time);
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          // Se já existe, manter o mais recente (substituir)
          acc[existingIndex] = current;
        }
        return acc;
      }, [] as CandlestickPoint[]);
      
      // Ordenar dados por tempo (ascendente) - REQUISITO OBRIGATÓRIO do Lightweight Charts
      const sortedData = uniqueData.sort((a, b) => a.time - b.time);
      
      console.log(`🔄 HISTORICAL - Initial data deduplication: ${mappedData.length} -> ${uniqueData.length} unique points`);
      setCandleData(sortedData);
      
      // Definir timestamps para controle de range
      if (mappedData.length > 0) {
        const oldest = Math.min(...mappedData.map(c => c.time));
        const newest = Math.max(...mappedData.map(c => c.time));
        setOldestTimestamp(oldest);
        setNewestTimestamp(newest);
        setHasMoreData(mappedData.length === initialLimit);
        
        // Adicionar ao cache
        addToCache(sortedData, oldest, newest);
        
        console.log('✅ HISTORICAL - Initial data loaded:', {
          count: mappedData.length,
          oldestTimestamp: oldest,
          newestTimestamp: newest,
          hasMoreData: mappedData.length === initialLimit,
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

  // Carregar mais dados históricos (versão melhorada)
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
      
      // Verificar cache primeiro
      const cachedData = getFromCache(startTime, oldestTimestamp);
      let rawData;
      
      if (cachedData) {
        console.log('📦 HISTORICAL - Using cached data');
        rawData = cachedData;
      } else {
        // Usar apenas Binance API (sem autenticação) para evitar 401
        rawData = await marketDataService.getHistoricalDataFromBinance(
          symbol, 
          timeframe, 
          initialLimit,
          startTime
        );
        
        // Adicionar ao cache
        addToCache(rawData, startTime, oldestTimestamp);
      }
      
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
        const existingData = prev || [];
        const combinedData = [...mappedData, ...existingData];
        
        // Remover duplicatas baseado no timestamp
        const uniqueData = combinedData.reduce((acc, current) => {
          const existingIndex = acc.findIndex(item => item.time === current.time);
          if (existingIndex === -1) {
            acc.push(current);
          } else {
            // Se já existe, manter o mais recente (substituir)
            acc[existingIndex] = current;
          }
          return acc;
        }, [] as CandlestickPoint[]);
        
        // Ordenar dados por tempo (ascendente) - REQUISITO OBRIGATÓRIO do Lightweight Charts
        const sortedData = uniqueData.sort((a, b) => a.time - b.time);
        
        // Limitar dados em memória se necessário
        if (sortedData.length > maxDataPoints) {
          const excess = sortedData.length - maxDataPoints;
          const trimmedData = sortedData.slice(excess);
          console.log(`🗑️ HISTORICAL - Trimmed ${excess} old data points to maintain ${maxDataPoints} limit`);
          return trimmedData;
        }
        
        console.log(`🔄 HISTORICAL - Data deduplication: ${combinedData.length} -> ${uniqueData.length} unique points`);
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
        oldestTimestamp: oldestTimestamp,
        cached: !!cachedData
      });
      
    } catch (err: any) {
      console.error('❌ HISTORICAL - Error loading more data:', err);
      setError(err.message || 'Failed to load more historical data');
    } finally {
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [symbol, timeframe, initialLimit, enabled, hasMoreData, oldestTimestamp, candleData?.length, maxDataPoints, getFromCache, addToCache]);

  // Carregar dados para um range específico
  const loadDataForRange = useCallback(async (startTime: number, endTime: number) => {
    if (!enabled || loadingRef.current) {
      console.log('🔄 HISTORICAL - Load range conditions not met:', { enabled, loadingRef: loadingRef.current });
      return;
    }
    
    loadingRef.current = true;
    setIsLoadingMore(true);
    setError(null);
    
    try {
      console.log('🔄 HISTORICAL - Loading data for range:', { startTime, endTime, symbol, timeframe });
      
      // Verificar cache primeiro
      const cachedData = getFromCache(startTime, endTime);
      let rawData;
      
      if (cachedData) {
        console.log('📦 HISTORICAL - Using cached data for range');
        rawData = cachedData;
      } else {
        // Calcular quantos candles precisamos para este range
        const timeframeMinutes = getLimitForTimeframe(timeframe);
        const rangeMinutes = (endTime - startTime) / 60;
        const neededCandles = Math.ceil(rangeMinutes / timeframeMinutes);
        
        rawData = await marketDataService.getHistoricalDataFromBinance(
          symbol, 
          timeframe, 
          Math.min(neededCandles, 1000), // Limitar a 1000 candles por request
          startTime
        );
        
        // Adicionar ao cache
        addToCache(rawData, startTime, endTime);
      }
      
      if (rawData.length === 0) {
        console.log('⚠️ HISTORICAL - No data found for range');
        return;
      }
      
      const mappedData: CandlestickPoint[] = rawData.map((candle) => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close
      }));
      
      // Ordenar dados por tempo (ascendente)
      const sortedData = mappedData.sort((a, b) => a.time - b.time);
      
      // Combinar com dados existentes
      setCandleData(prev => {
        if (!prev) return sortedData;
        
        // Criar um mapa para evitar duplicatas
        const dataMap = new Map<number, CandlestickPoint>();
        
        // Adicionar dados existentes
        prev.forEach(candle => dataMap.set(candle.time, candle));
        
        // Adicionar novos dados (sobrescrever se necessário)
        sortedData.forEach(candle => dataMap.set(candle.time, candle));
        
        // Converter de volta para array e ordenar
        const combinedData = Array.from(dataMap.values()).sort((a, b) => a.time - b.time);
        
        // Limitar dados em memória se necessário
        if (combinedData.length > maxDataPoints) {
          const excess = combinedData.length - maxDataPoints;
          const trimmedData = combinedData.slice(excess);
          console.log(`🗑️ HISTORICAL - Trimmed ${excess} old data points to maintain ${maxDataPoints} limit`);
          return trimmedData;
        }
        
        return combinedData;
      });
      
      console.log('✅ HISTORICAL - Range data loaded:', {
        count: sortedData.length,
        startTime,
        endTime,
        cached: !!cachedData
      });
      
    } catch (err: any) {
      console.error('❌ HISTORICAL - Error loading range data:', err);
      setError(err.message || 'Failed to load range data');
    } finally {
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [enabled, symbol, timeframe, maxDataPoints, getFromCache, addToCache]);

  // Obter range atual dos dados
  const getDataRange = useCallback(() => {
    if (!candleData || candleData.length === 0) return null;
    
    const start = Math.min(...candleData.map(c => c.time));
    const end = Math.max(...candleData.map(c => c.time));
    
    return { start, end };
  }, [candleData]);

  // Verificar se dados estão disponíveis para um timestamp específico
  const isDataAvailable = useCallback((time: number) => {
    if (!candleData || candleData.length === 0) return false;
    
    return candleData.some(candle => candle.time === time);
  }, [candleData]);

  // Resetar dados
  const resetData = useCallback(() => {
    setCandleData(undefined);
    setOldestTimestamp(null);
    setNewestTimestamp(null);
    setHasMoreData(true);
    setError(null);
    loadingRef.current = false;
    dataCacheRef.current.clear();
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
    // Novas funções para controle avançado
    loadDataForRange,
    getDataRange,
    isDataAvailable,
    // Expor função para carregar dados iniciais
    loadInitialData
  };
};