// src/hooks/useHistoricalData.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { LwcBar } from '@/types/chart';
import { marketDataService } from '@/services/marketData.service';

export type TimeFilterPeriod = '24H' | '7D' | '30D' | '90D' | 'ALL';

interface UseHistoricalDataProps {
  symbol: string;
  timeframe: string;
  initialLimit?: number;
  enabled?: boolean;
  maxDataPoints?: number;
  loadThreshold?: number;
  period?: TimeFilterPeriod;
}

interface HistoricalDataCache {
  data: LwcBar[];
  timestamp: number;
  period: TimeFilterPeriod;
}

interface UseHistoricalDataReturn {
  candleData: LwcBar[] | undefined;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMoreData: boolean;
  loadMoreHistorical: () => Promise<void>;
  resetData: () => void;
  changePeriod: (period: TimeFilterPeriod) => void;
  currentPeriod: TimeFilterPeriod;
  getPeriodData: (period: TimeFilterPeriod) => LwcBar[] | null;
}

export const useHistoricalData = ({
  symbol,
  timeframe,
  initialLimit = 168,
  enabled = true,
  maxDataPoints = 10000,
  loadThreshold = 20,
  period = '7D'
}: UseHistoricalDataProps): UseHistoricalDataReturn => {
  const [candleData, setCandleData] = useState<LwcBar[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [oldestTimestamp, setOldestTimestamp] = useState<number | null>(null);
  const [newestTimestamp, setNewestTimestamp] = useState<number | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<TimeFilterPeriod>(period);
  const loadingRef = useRef(false);
  const dataCacheRef = useRef<Map<string, LwcBar[]>>(new Map());
  const periodCacheRef = useRef<Map<string, HistoricalDataCache>>(new Map());

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

  // Função para calcular limite baseado no período
  const getLimitForPeriod = useCallback((period: TimeFilterPeriod): number => {
    switch (period) {
      case '24H': return 24; // 24 horas
      case '7D': return 168; // 7 dias * 24 horas
      case '30D': return 720; // 30 dias * 24 horas
      case '90D': return 2160; // 90 dias * 24 horas
      case 'ALL': return 10000; // Máximo
      default: return 168;
    }
  }, []);

  // Função para obter dados de um período específico do cache
  const getPeriodData = useCallback((period: TimeFilterPeriod): LwcBar[] | null => {
    const cacheKey = `${symbol}-${timeframe}-${period}`;
    const cached = periodCacheRef.current.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < 300000) { // 5 minutos de cache
      return cached.data;
    }
    
    return null;
  }, [symbol, timeframe]);

  // Função para mudar período
  const changePeriod = useCallback(async (period: TimeFilterPeriod) => {
    if (period === currentPeriod) return;
    
    console.log('🔄 HISTORICAL - Changing period:', period);
    setCurrentPeriod(period);
    
    // Verificar cache primeiro
    const cachedData = getPeriodData(period);
    if (cachedData) {
      console.log('📦 HISTORICAL - Using cached period data:', period);
      setCandleData(cachedData);
      setError(null);
      return;
    }
    
    // Carregar novos dados para o período
    setIsLoading(true);
    setError(null);
    
    try {
      const limit = getLimitForPeriod(period);
      const rawData = await marketDataService.getHistoricalData(symbol, timeframe, limit);
      
      const mappedData: LwcBar[] = rawData.map((candle) => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume
      }));
      
      // Ordenar dados
      const sortedData = mappedData.sort((a, b) => {
        const timeA = typeof a.time === 'number' ? a.time : new Date(a.time).getTime() / 1000;
        const timeB = typeof b.time === 'number' ? b.time : new Date(b.time).getTime() / 1000;
        return timeA - timeB;
      });
      
      setCandleData(sortedData);
      
      // Cache dos dados do período
      const cacheKey = `${symbol}-${timeframe}-${period}`;
      periodCacheRef.current.set(cacheKey, {
        data: sortedData,
        timestamp: Date.now(),
        period
      });
      
      console.log('✅ HISTORICAL - Period data loaded:', period, sortedData.length, 'points');
      
    } catch (err: any) {
      console.error('❌ HISTORICAL - Error loading period data:', err);
      setError(err.message || 'Failed to load period data');
    } finally {
      setIsLoading(false);
    }
  }, [currentPeriod, symbol, timeframe, getPeriodData, getLimitForPeriod]);

  // Função para gerenciar cache de dados
  const getCacheKey = useCallback((startTime: number, endTime: number) => {
    return `${symbol}-${timeframe}-${startTime}-${endTime}`;
  }, [symbol, timeframe]);

  const addToCache = useCallback((key: string, data: LwcBar[]) => {
    dataCacheRef.current.set(key, data);
  }, []);

  const getFromCache = useCallback((key: string) => {
    return dataCacheRef.current.get(key);
  }, []);

  const loadInitialData = async () => {
    if (!enabled || loadingRef.current) return;
    
    console.log('🔄 HISTORICAL - Loading initial data:', { symbol, timeframe, limit: initialLimit });
    
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      // Timeout de 15 segundos para evitar travamento
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000);
      });

      const dataPromise = marketDataService.getHistoricalData(symbol, timeframe, initialLimit);
      
      const rawData = await Promise.race([dataPromise, timeoutPromise]);
      
      const mappedData: LwcBar[] = rawData.map((candle) => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume
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
      }, [] as LwcBar[]);
      
      // Ordenar dados por tempo (ascendente) - REQUISITO OBRIGATÓRIO do Lightweight Charts
      const sortedData = uniqueData.sort((a, b) => {
        const timeA = typeof a.time === 'number' ? a.time : new Date(a.time).getTime() / 1000;
        const timeB = typeof b.time === 'number' ? b.time : new Date(b.time).getTime() / 1000;
        return timeA - timeB;
      });
      
      console.log(`🔄 HISTORICAL - Initial data deduplication: ${mappedData.length} -> ${uniqueData.length} unique points`);
      setCandleData(sortedData);
      
      // Definir timestamps para controle de range
      if (sortedData.length > 0) {
        const firstTime = typeof sortedData[0].time === 'number' 
          ? sortedData[0].time 
          : new Date(sortedData[0].time).getTime() / 1000;
        const lastTime = typeof sortedData[sortedData.length - 1].time === 'number'
          ? sortedData[sortedData.length - 1].time
          : new Date(sortedData[sortedData.length - 1].time).getTime() / 1000;
        
        setOldestTimestamp(firstTime);
        setNewestTimestamp(lastTime);
        setHasMoreData(sortedData.length >= initialLimit);
      }
      
      // Cache dos dados
      const cacheKey = getCacheKey(0, Date.now());
      addToCache(cacheKey, sortedData);
      
    } catch (err: any) {
      console.error('❌ HISTORICAL - Error loading initial data:', err);
      setError(err.message || 'Failed to load historical data');
      setCandleData(undefined);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };

  const loadMoreHistorical = async () => {
    if (!enabled || !hasMoreData || isLoadingMore || !oldestTimestamp || !candleData) return;
    
    console.log('🔄 HISTORICAL - Loading more data from:', oldestTimestamp);
    
    setIsLoadingMore(true);
    
    try {
      // Calcular timestamp de início para buscar dados mais antigos
      const startTime = oldestTimestamp - (getLimitForTimeframe(timeframe) * 60 * 100); // 100 períodos atrás
      
      // Verificar cache primeiro
      const cacheKey = getCacheKey(startTime, oldestTimestamp);
      const cachedData = getFromCache(cacheKey);
      
      if (cachedData) {
        console.log('📦 HISTORICAL - Using cached data for load more');
        const mergedData = [...cachedData, ...candleData]
          .reduce((acc, current) => {
            const existingIndex = acc.findIndex(item => item.time === current.time);
            if (existingIndex === -1) {
              acc.push(current);
            } else {
              acc[existingIndex] = current;
            }
            return acc;
          }, [] as LwcBar[])
          .sort((a, b) => {
            const timeA = typeof a.time === 'number' ? a.time : new Date(a.time).getTime() / 1000;
            const timeB = typeof b.time === 'number' ? b.time : new Date(b.time).getTime() / 1000;
            return timeA - timeB;
          });
        
        setCandleData(mergedData);
        
        if (mergedData.length > 0) {
          const firstTime = typeof mergedData[0].time === 'number' 
            ? mergedData[0].time 
            : new Date(mergedData[0].time).getTime() / 1000;
          setOldestTimestamp(firstTime);
        }
        
        setHasMoreData(mergedData.length < maxDataPoints);
        return;
      }
      
      // Buscar dados da API
      const rawData = await marketDataService.getHistoricalData(symbol, timeframe, 100, startTime);
      
      const mappedData: LwcBar[] = rawData.map((candle) => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume
      }));
      
      // Merge com dados existentes
      const mergedData = [...mappedData, ...candleData]
        .reduce((acc, current) => {
          const existingIndex = acc.findIndex(item => item.time === current.time);
          if (existingIndex === -1) {
            acc.push(current);
          } else {
            acc[existingIndex] = current;
          }
          return acc;
        }, [] as LwcBar[])
        .sort((a, b) => {
          const timeA = typeof a.time === 'number' ? a.time : new Date(a.time).getTime() / 1000;
          const timeB = typeof b.time === 'number' ? b.time : new Date(b.time).getTime() / 1000;
          return timeA - timeB;
        });
      
      console.log(`🔄 HISTORICAL - Load more: ${mappedData.length} new + ${candleData.length} existing = ${mergedData.length} total`);
      
      setCandleData(mergedData);
      
      if (mergedData.length > 0) {
        const firstTime = typeof mergedData[0].time === 'number' 
          ? mergedData[0].time 
          : new Date(mergedData[0].time).getTime() / 1000;
        setOldestTimestamp(firstTime);
      }
      
      setHasMoreData(mergedData.length < maxDataPoints);
      
      // Cache dos novos dados
      addToCache(cacheKey, mappedData);
      
    } catch (err: any) {
      console.error('❌ HISTORICAL - Error loading more data:', err);
      setError(err.message || 'Failed to load more historical data');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const resetData = useCallback(() => {
    setCandleData(undefined);
    setError(null);
    setHasMoreData(true);
    setOldestTimestamp(null);
    setNewestTimestamp(null);
    dataCacheRef.current.clear();
    periodCacheRef.current.clear();
  }, []);

  // Carregar dados inicialmente
  useEffect(() => {
    if (enabled) {
      loadInitialData();
    }
  }, [symbol, timeframe, enabled]);

  // Carregar dados do período atual quando mudar
  useEffect(() => {
    if (enabled && currentPeriod !== period) {
      changePeriod(currentPeriod);
    }
  }, [enabled, currentPeriod, period, changePeriod]);

  return {
    candleData,
    isLoading,
    isLoadingMore,
    error,
    hasMoreData,
    loadMoreHistorical,
    resetData,
    changePeriod,
    currentPeriod,
    getPeriodData
  };
};