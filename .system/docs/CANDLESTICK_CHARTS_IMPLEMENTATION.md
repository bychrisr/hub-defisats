# 📈 **IMPLEMENTAÇÃO DETALHADA DOS GRÁFICOS DE CANDLES**

## 📋 **ÍNDICE**

1. [Visão Geral da Implementação](#1-visão-geral-da-implementação)
2. [Arquitetura TradingView-First](#2-arquitetura-tradingview-first)
3. [Hook useHistoricalData](#3-hook-usehistoricaldata)
4. [Componente LightweightLiquidationChart](#4-componente-lightweightliquidationchart)
5. [Sistema de Lazy Loading](#5-sistema-de-lazy-loading)
6. [Deduplicação e Validação](#6-deduplicação-e-validação)
7. [Configuração do Chart](#7-configuração-do-chart)
8. [Linhas de Liquidação e Take Profit](#8-linhas-de-liquidação-e-take-profit)
9. [Sistema de Cache Inteligente](#9-sistema-de-cache-inteligente)
10. [Tratamento de Erros](#10-tratamento-de-erros)

---

## 1. **VISÃO GERAL DA IMPLEMENTAÇÃO**

### 🎯 **Objetivos da Implementação**

O sistema de gráficos de candles foi projetado para:

- **Infinite Historical Data**: Carregamento infinito de dados históricos
- **Lazy Loading**: Carregamento sob demanda conforme o usuário navega
- **Performance Otimizada**: Cache inteligente e deduplicação
- **Segurança**: Validação rigorosa e fallbacks robustos
- **UX Superior**: Zoom inteligente e navegação fluida

### 🏗️ **Arquitetura Geral**

```mermaid
graph TB
    A[LightweightLiquidationChart] --> B[useHistoricalData]
    B --> C[TradingViewDataService]
    C --> D[/api/tradingview/scanner]
    D --> E[Backend Proxy]
    E --> F[Binance Klines API]
    
    B --> G[Data Cache]
    B --> H[Deduplication Logic]
    B --> I[Range Management]
    
    A --> J[Lightweight Charts Library]
    J --> K[Candlestick Series]
    J --> L[Liquidation Lines]
    J --> M[Take Profit Lines]
    
    N[useEffect] --> O[Data Updates]
    N --> P[Zoom Management]
    N --> Q[Scroll Detection]
```

---

## 2. **ARQUITETURA TRADINGVIEW-FIRST**

### 🎯 **TradingViewDataService**

```typescript
// frontend/src/services/tradingViewData.service.ts
export class TradingViewDataService {
  private cache = new IntelligentCache();
  private rateLimiter = new IntelligentRateLimiter();
  private validator = DataValidator;

  /**
   * Obter dados históricos com fallback robusto
   */
  async getHistoricalData(
    symbol: string,
    timeframe: string,
    limit: number = 500,
    startTime?: number
  ): Promise<CandleData[]> {
    const cacheKey = `historical_${symbol}_${timeframe}_${limit}_${startTime || 'latest'}`;
    
    // 1. Verificar cache primeiro
    if (this.cache.isCacheValid(cacheKey)) {
      console.log('📦 TRADINGVIEW - Using cached data');
      return this.cache.get(cacheKey);
    }

    // 2. Tentar APIs em ordem de prioridade
    const apis = Object.entries(API_CONFIG)
      .sort(([,a], [,b]) => a.priority - b.priority)
      .map(([name]) => name);

    for (const apiName of apis) {
      try {
        if (!this.rateLimiter.canMakeRequest(apiName)) {
          console.warn(`⏳ TRADINGVIEW - Rate limit reached for ${apiName}`);
          continue;
        }

        console.log(`🔄 TRADINGVIEW - Fetching from ${apiName}`);
        const data = await this.fetchFromAPI(apiName, symbol, timeframe, limit, startTime);
        
        if (this.validator.validateCandleData(data)) {
          this.rateLimiter.recordRequest(apiName);
          this.cache.set(cacheKey, data);
          console.log(`✅ TRADINGVIEW - Data fetched from ${apiName}: ${data.length} candles`);
          return data;
        } else {
          console.warn(`⚠️ TRADINGVIEW - Invalid data from ${apiName}, trying next API`);
        }
      } catch (error) {
        console.warn(`❌ TRADINGVIEW - ${apiName} failed:`, error);
        continue;
      }
    }

    // 3. Se todas as APIs falharam
    throw new Error('Todas as APIs falharam - dados indisponíveis por segurança');
  }
}
```

### 🔄 **Configuração de APIs**

```typescript
const API_CONFIG = {
  tradingview: {
    baseUrl: '/api/tradingview',
    priority: 1,
    timeout: 15000,
    rateLimit: { requests: 100, window: 60000 }
  },
  binance: {
    baseUrl: 'https://api.binance.com',
    priority: 2,
    timeout: 10000,
    rateLimit: { requests: 1200, window: 60000 }
  },
  coingecko: {
    baseUrl: 'https://api.coingecko.com',
    priority: 3,
    timeout: 10000,
    rateLimit: { requests: 50, window: 60000 }
  }
};
```

---

## 3. **HOOK useHistoricalData**

### 🎯 **Interface e Props**

```typescript
interface UseHistoricalDataProps {
  symbol: string;
  timeframe: string;
  initialLimit?: number;
  maxDataPoints?: number;
  loadThreshold?: number;
}

interface UseHistoricalDataReturn {
  candleData: CandlestickPoint[] | undefined;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  oldestTimestamp: number | null;
  newestTimestamp: number | null;
  loadMoreHistorical: () => Promise<void>;
  loadDataForRange: (startTime: number, endTime: number) => Promise<void>;
  getDataRange: () => { start: number | null; end: number | null };
  isDataAvailable: (time: number) => boolean;
  loadInitialData: () => Promise<void>;
}
```

### 🔄 **Estado e Cache**

```typescript
export const useHistoricalData = ({
  symbol,
  timeframe,
  initialLimit = 168,
  maxDataPoints = 10000,
  loadThreshold = 20
}: UseHistoricalDataProps): UseHistoricalDataReturn => {
  const [candleData, setCandleData] = useState<CandlestickPoint[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oldestTimestamp, setOldestTimestamp] = useState<number | null>(null);
  const [newestTimestamp, setNewestTimestamp] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Cache inteligente para dados históricos
  const dataCacheRef = useRef<Map<string, CandlestickPoint[]>>(new Map());
  const loadingRef = useRef(false);
```

### 📦 **Sistema de Cache**

```typescript
  // Funções de cache
  const getCacheKey = useCallback((symbol: string, timeframe: string, limit: number, startTime?: number) => {
    return `${symbol}_${timeframe}_${limit}_${startTime || 'latest'}`;
  }, []);

  const addToCache = useCallback((key: string, data: CandlestickPoint[]) => {
    dataCacheRef.current.set(key, data);
  }, []);

  const getFromCache = useCallback((key: string): CandlestickPoint[] | null => {
    return dataCacheRef.current.get(key) || null;
  }, []);
```

### 🚀 **Carregamento Inicial**

```typescript
  const loadInitialData = async () => {
    console.log('🔄 HISTORICAL - Loading initial data:', { symbol, timeframe, limit: initialLimit });
    
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
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
      if (sortedData.length > 0) {
        setOldestTimestamp(sortedData[0].time);
        setNewestTimestamp(sortedData[sortedData.length - 1].time);
        
        // Adicionar ao cache
        const cacheKey = getCacheKey(symbol, timeframe, initialLimit);
        addToCache(cacheKey, sortedData);
      }
      
      console.log('✅ HISTORICAL - Initial data loaded successfully:', {
        count: sortedData.length,
        oldestTimestamp: sortedData[0]?.time,
        newestTimestamp: sortedData[sortedData.length - 1]?.time
      });
      
    } catch (err: any) {
      console.error('❌ HISTORICAL - Error loading initial data:', err);
      setError(err.message || 'Failed to load historical data');
      setCandleData(undefined);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  };
```

### 📈 **Carregamento de Mais Dados**

```typescript
  const loadMoreHistorical = useCallback(async () => {
    if (!oldestTimestamp || loadingRef.current) {
      console.log('⚠️ HISTORICAL - Cannot load more data:', { 
        hasOldestTimestamp: !!oldestTimestamp, 
        isLoading: loadingRef.current 
      });
      return;
    }

    setIsLoadingMore(true);
    loadingRef.current = true;
    
    try {
      console.log('🔄 HISTORICAL - Loading more historical data...');
      
      // Calcular timestamp de início para dados mais antigos
      const startTime = oldestTimestamp - (initialLimit * getTimeframeMs(timeframe));
      
      // Verificar cache primeiro
      const cacheKey = getCacheKey(symbol, timeframe, initialLimit, startTime);
      const cachedData = getFromCache(cacheKey);
      
      if (cachedData) {
        console.log('📦 HISTORICAL - Using cached data for historical range');
        setCandleData(prev => {
          if (!prev) return cachedData;
          
          // Combinar dados existentes com dados em cache
          const combined = [...cachedData, ...prev];
          const unique = combined.reduce((acc, current) => {
            const existingIndex = acc.findIndex(item => item.time === current.time);
            if (existingIndex === -1) {
              acc.push(current);
            } else {
              acc[existingIndex] = current;
            }
            return acc;
          }, [] as CandlestickPoint[]);
          
          const sorted = unique.sort((a, b) => a.time - b.time);
          
          // Limitar dados em memória
          if (sorted.length > maxDataPoints) {
            const trimmed = sorted.slice(0, maxDataPoints);
            setOldestTimestamp(trimmed[0].time);
            return trimmed;
          }
          
          setOldestTimestamp(sorted[0].time);
          return sorted;
        });
        
        setIsLoadingMore(false);
        loadingRef.current = false;
        return;
      }
      
      // Buscar dados do servidor
      const rawData = await marketDataService.getHistoricalDataFromBinance(
        symbol, 
        timeframe, 
        initialLimit, 
        startTime
      );
      
      const mappedData: CandlestickPoint[] = rawData.map((candle) => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close
      }));
      
      // Adicionar ao cache
      addToCache(cacheKey, mappedData);
      
      setCandleData(prev => {
        if (!prev) return mappedData;
        
        // Combinar e deduplicar
        const combined = [...mappedData, ...prev];
        const unique = combined.reduce((acc, current) => {
          const existingIndex = acc.findIndex(item => item.time === current.time);
          if (existingIndex === -1) {
            acc.push(current);
          } else {
            acc[existingIndex] = current;
          }
          return acc;
        }, [] as CandlestickPoint[]);
        
        const sorted = unique.sort((a, b) => a.time - b.time);
        
        // Limitar dados em memória
        if (sorted.length > maxDataPoints) {
          const trimmed = sorted.slice(0, maxDataPoints);
          setOldestTimestamp(trimmed[0].time);
          return trimmed;
        }
        
        setOldestTimestamp(sorted[0].time);
        return sorted;
      });
      
      console.log('✅ HISTORICAL - More data loaded:', {
        newCount: mappedData.length,
        totalCount: candleData?.length || 0
      });
      
    } catch (err: any) {
      console.error('❌ HISTORICAL - Error loading more data:', err);
      setError(err.message || 'Failed to load more historical data');
    } finally {
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [symbol, timeframe, initialLimit, oldestTimestamp, maxDataPoints, getCacheKey, addToCache, getFromCache]);
```

---

## 4. **COMPONENTE LightweightLiquidationChart**

### 🎯 **Interface e Props**

```typescript
interface LightweightLiquidationChartProps {
  symbol?: string;
  timeframe?: string;
  useApiData?: boolean;
  candleData?: CandlestickPoint[];
  liquidationLines?: LiquidationLine[];
  takeProfitLines?: TakeProfitLine[];
  onTimeframeChange?: (timeframe: string) => void;
  className?: string;
}

interface LiquidationLine {
  price: number;
  color?: string;
  style?: LineStyle;
  width?: number;
}

interface TakeProfitLine {
  price: number;
  color?: string;
  style?: LineStyle;
  width?: number;
}
```

### 🎨 **Configuração do Chart**

```typescript
const LightweightLiquidationChart: React.FC<LightweightLiquidationChartProps> = ({
  symbol = 'BTCUSDT',
  timeframe = '1h',
  useApiData = true,
  candleData: propCandleData,
  liquidationLines = [],
  takeProfitLines = [],
  onTimeframeChange,
  className
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const liquidationSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const takeProfitSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  const [currentTimeframe, setCurrentTimeframe] = useState(timeframe);
  const isInitialLoad = useRef(true);

  // Hook para dados históricos com lazy loading
  const {
    candleData: historicalData,
    isLoading: historicalLoading,
    error: historicalError,
    loadMoreHistorical,
    loadDataForRange,
    getDataRange,
    isDataAvailable,
    loadInitialData
  } = useHistoricalData({
    symbol,
    timeframe: currentTimeframe,
    initialLimit: 168, // 7 dias para timeframe 1h
    maxDataPoints: currentTimeframe === '1h' ? 10000 : 5000,
    loadThreshold: currentTimeframe === '1h' ? 50 : 20
  });

  // Determinar dados efetivos para exibição
  const effectiveCandleData = useApiData ? historicalData : propCandleData;
```

### ⚙️ **Configuração das Opções**

```typescript
  // Configuração do chart com opções otimizadas
  const chartOptions: DeepPartial<IChartApiOptions> = {
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: '#d1d5db',
    },
    grid: {
      vertLines: { color: '#374151', style: LineStyle.Solid, visible: true },
      horzLines: { color: '#374151', style: LineStyle.Solid, visible: true },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: {
        color: '#6b7280',
        width: 1,
        style: LineStyle.Solid,
        labelBackgroundColor: '#1f2937',
      },
      horzLine: {
        color: '#6b7280',
        width: 1,
        style: LineStyle.Solid,
        labelBackgroundColor: '#1f2937',
      },
    },
    rightPriceScale: {
      borderColor: '#374151',
      scaleMargins: {
        top: 0.1,
        bottom: 0.1,
      },
    },
    timeScale: {
      borderColor: '#374151',
      timeVisible: true,
      secondsVisible: false,
      rightOffset: 0,
      fixRightEdge: true,
      fixLeftEdge: false,
      tickMarkFormatter: (time: Time, tickMarkType: TickMarkType, locale: string) => {
        const date = new Date(time as number);
        
        switch (tickMarkType) {
          case TickMarkType.Hour:
            return date.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            });
          case TickMarkType.Day:
            return date.getDate().toString();
          case TickMarkType.Month:
            return `${date.getDate()} • ${date.toLocaleDateString('en-US', { month: 'short' })}`;
          default:
            return '';
        }
      }
    },
  };
```

### 🔄 **Inicialização do Chart**

```typescript
  // Inicializar chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    // Criar série de candlesticks
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#10b981',
      wickDownColor: '#ef4444',
      wickUpColor: '#10b981',
    });
    seriesRef.current = candlestickSeries;

    // Criar série para linhas de liquidação
    const liquidationSeries = chart.addLineSeries({
      color: '#f59e0b',
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
    });
    liquidationSeriesRef.current = liquidationSeries;

    // Criar série para linhas de take profit
    const takeProfitSeries = chart.addLineSeries({
      color: '#8b5cf6',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
    });
    takeProfitSeriesRef.current = takeProfitSeries;

    // Configurar handlers de scroll e zoom
    const handleScroll = () => {
      const timeScale = chart.timeScale();
      const visibleRange = timeScale.getVisibleRange();
      
      if (visibleRange && effectiveCandleData && effectiveCandleData.length > 0) {
        const dataStart = effectiveCandleData[0].time;
        const dataEnd = effectiveCandleData[effectiveCandleData.length - 1].time;
        
        // Calcular threshold dinâmico baseado no timeframe
        const dynamicThreshold = currentTimeframe === '1h' ? 50 : 20;
        
        if (visibleRange.from <= dataStart + dynamicThreshold) {
          console.log('🔄 SCROLL - Near beginning, loading more data...');
          loadMoreHistorical();
        }
      }
    };

    const handleVisibleRangeChange = (timeRange: TimeRange | null) => {
      if (!timeRange || !effectiveCandleData) return;
      
      const { from, to } = timeRange;
      const dataRange = getDataRange();
      
      if (dataRange.start && dataRange.end) {
        // Verificar se o usuário está navegando fora do range disponível
        if (from < dataRange.start || to > dataRange.end) {
          console.log('🔄 RANGE - User navigating outside available data, loading...');
          loadDataForRange(from as number, to as number);
        }
      }
    };

    // Adicionar event listeners
    chart.subscribeCrosshairMove(handleScroll);
    chart.timeScale().subscribeVisibleTimeRangeChange(handleVisibleRangeChange);

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      liquidationSeriesRef.current = null;
      takeProfitSeriesRef.current = null;
    };
  }, [symbol, currentTimeframe]);
```

### 📊 **Atualização de Dados**

```typescript
  // Atualizar dados do chart
  useEffect(() => {
    if (!seriesRef.current || !effectiveCandleData || effectiveCandleData.length === 0) {
      return;
    }

    console.log('🔄 DATA UPDATE - useEffect triggered:', {
      hasSeriesRef: !!seriesRef.current,
      hasEffectiveData: !!effectiveCandleData,
      dataLength: effectiveCandleData?.length || 0,
      isInitialLoad: isInitialLoad.current
    });

    try {
      // Deduplicação adicional para garantir integridade
      const uniqueData = effectiveCandleData.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.time === current.time);
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          acc[existingIndex] = current;
        }
        return acc;
      }, [] as CandlestickPoint[]);

      console.log(`🔄 CHART - Data deduplication: ${effectiveCandleData.length} -> ${uniqueData.length} unique points`);

      // Atualizar dados da série
      seriesRef.current.setData(uniqueData);
      
      console.log('✅ DATA UPDATE - Candlestick data set:', uniqueData.length);
      
      // Aplicar zoom inicial apenas no primeiro carregamento
      if (isInitialLoad.current && uniqueData.length > 0) {
        const visibleRange = chartRef.current?.timeScale().getVisibleRange();
        if (visibleRange) {
          const dataLength = uniqueData.length;
          const startTime = uniqueData[Math.max(0, dataLength - 168)].time; // Mostrar últimos 7 dias
          const endTime = uniqueData[dataLength - 1].time;
          
          chartRef.current?.timeScale().setVisibleRange({
            from: startTime as Time,
            to: endTime as Time
          });
          
          isInitialLoad.current = false;
          console.log('📊 DATA - Initial zoom applied:', { startTime, endTime });
        }
      } else {
        console.log('📊 DATA - Updated series data without resetting zoom:', {
          dataLength: uniqueData.length,
          isInitialLoad: isInitialLoad.current
        });
      }
      
    } catch (error) {
      console.error('⚠️ DATA - Error updating series data:', error);
    }
  }, [effectiveCandleData, isInitialLoad]);
```

---

## 5. **SISTEMA DE LAZY LOADING**

### 🎯 **Detecção de Scroll**

```typescript
const handleScroll = () => {
  const timeScale = chart.timeScale();
  const visibleRange = timeScale.getVisibleRange();
  
  if (visibleRange && effectiveCandleData && effectiveCandleData.length > 0) {
    const dataStart = effectiveCandleData[0].time;
    const dataEnd = effectiveCandleData[effectiveCandleData.length - 1].time;
    
    // Calcular threshold dinâmico baseado no timeframe
    const dynamicThreshold = currentTimeframe === '1h' ? 50 : 20;
    
    if (visibleRange.from <= dataStart + dynamicThreshold) {
      console.log('🔄 SCROLL - Near beginning, loading more data...');
      loadMoreHistorical();
    }
  }
};
```

### 📈 **Carregamento por Range**

```typescript
const loadDataForRange = useCallback(async (startTime: number, endTime: number) => {
  if (loadingRef.current) return;
  
  console.log('🔄 HISTORICAL - Loading data for range:', { startTime, endTime });
  
  loadingRef.current = true;
  setIsLoadingMore(true);
  
  try {
    // Calcular quantos dados precisamos
    const timeframeMs = getTimeframeMs(currentTimeframe);
    const dataPointsNeeded = Math.ceil((endTime - startTime) / timeframeMs);
    
    // Buscar dados
    const rawData = await marketDataService.getHistoricalDataFromBinance(
      symbol,
      currentTimeframe,
      Math.min(dataPointsNeeded, 1000), // Limitar a 1000 pontos
      startTime
    );
    
    const mappedData: CandlestickPoint[] = rawData.map((candle) => ({
      time: candle.time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close
    }));
    
    // Combinar com dados existentes
    setCandleData(prev => {
      if (!prev) return mappedData;
      
      const combined = [...prev, ...mappedData];
      const unique = combined.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.time === current.time);
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          acc[existingIndex] = current;
        }
        return acc;
      }, [] as CandlestickPoint[]);
      
      return unique.sort((a, b) => a.time - b.time);
    });
    
    console.log('✅ HISTORICAL - Range data loaded:', mappedData.length);
    
  } catch (err: any) {
    console.error('❌ HISTORICAL - Error loading range data:', err);
    setError(err.message || 'Failed to load range data');
  } finally {
    setIsLoadingMore(false);
    loadingRef.current = false;
  }
}, [symbol, currentTimeframe, getTimeframeMs]);
```

---

## 6. **DEDUPLICAÇÃO E VALIDAÇÃO**

### 🔍 **Validação de Dados**

```typescript
export class DataValidator {
  static validateCandleData(candles: CandleData[]): boolean {
    if (!Array.isArray(candles) || candles.length === 0) {
      return false;
    }

    return candles.every(candle => 
      typeof candle.time === 'number' &&
      typeof candle.open === 'number' &&
      typeof candle.high === 'number' &&
      typeof candle.low === 'number' &&
      typeof candle.close === 'number' &&
      candle.high >= Math.max(candle.open, candle.close) &&
      candle.low <= Math.min(candle.open, candle.close)
    );
  }
}
```

### 🔄 **Deduplicação Inteligente**

```typescript
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
```

---

## 7. **CONFIGURAÇÃO DO CHART**

### 🎨 **Formatação de Tempo**

```typescript
tickMarkFormatter: (time: Time, tickMarkType: TickMarkType, locale: string) => {
  const date = new Date(time as number);
  
  switch (tickMarkType) {
    case TickMarkType.Hour:
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    case TickMarkType.Day:
      return date.getDate().toString();
    case TickMarkType.Month:
      return `${date.getDate()} • ${date.toLocaleDateString('en-US', { month: 'short' })}`;
    default:
      return '';
  }
}
```

### 🎯 **Zoom Inteligente**

```typescript
// Aplicar zoom inicial apenas no primeiro carregamento
if (isInitialLoad.current && uniqueData.length > 0) {
  const visibleRange = chartRef.current?.timeScale().getVisibleRange();
  if (visibleRange) {
    const dataLength = uniqueData.length;
    const startTime = uniqueData[Math.max(0, dataLength - 168)].time; // Mostrar últimos 7 dias
    const endTime = uniqueData[dataLength - 1].time;
    
    chartRef.current?.timeScale().setVisibleRange({
      from: startTime as Time,
      to: endTime as Time
    });
    
    isInitialLoad.current = false;
    console.log('📊 DATA - Initial zoom applied:', { startTime, endTime });
  }
}
```

---

## 8. **LINHAS DE LIQUIDAÇÃO E TAKE PROFIT**

### 📏 **Renderização de Linhas**

```typescript
// Atualizar linhas de liquidação
useEffect(() => {
  if (!liquidationSeriesRef.current || liquidationLines.length === 0) return;

  const liquidationData = liquidationLines.map(line => ({
    time: effectiveCandleData?.[0]?.time || Date.now(),
    value: line.price
  }));

  liquidationSeriesRef.current.setData(liquidationData);
}, [liquidationLines, effectiveCandleData]);

// Atualizar linhas de take profit
useEffect(() => {
  if (!takeProfitSeriesRef.current || takeProfitLines.length === 0) return;

  const takeProfitData = takeProfitLines.map(line => ({
    time: effectiveCandleData?.[0]?.time || Date.now(),
    value: line.price
  }));

  takeProfitSeriesRef.current.setData(takeProfitData);
}, [takeProfitLines, effectiveCandleData]);
```

---

## 9. **SISTEMA DE CACHE INTELIGENTE**

### 📦 **IntelligentCache**

```typescript
class IntelligentCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 30000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  isCacheValid(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    return Date.now() - entry.timestamp <= entry.ttl;
  }

  getCacheStats() {
    return {
      entries: this.cache.size,
      hitRate: this.calculateHitRate()
    };
  }
}
```

---

## 10. **TRATAMENTO DE ERROS**

### 🚨 **Timeout e Fallbacks**

```typescript
// Timeout de 15 segundos para evitar travamento
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000);
});

const dataPromise = marketDataService.getHistoricalDataFromBinance(symbol, timeframe, initialLimit);

const rawData = await Promise.race([dataPromise, timeoutPromise]);
```

### 🔄 **Retry Logic**

```typescript
// Tentar APIs em ordem de prioridade
for (const apiName of apis) {
  try {
    if (!this.rateLimiter.canMakeRequest(apiName)) {
      console.warn(`⏳ TRADINGVIEW - Rate limit reached for ${apiName}`);
      continue;
    }

    const data = await this.fetchFromAPI(apiName, symbol, timeframe, limit, startTime);
    
    if (this.validator.validateCandleData(data)) {
      this.rateLimiter.recordRequest(apiName);
      this.cache.set(cacheKey, data);
      return data;
    }
  } catch (error) {
    console.warn(`❌ TRADINGVIEW - ${apiName} failed:`, error);
    continue;
  }
}

// Se todas as APIs falharam
throw new Error('Todas as APIs falharam - dados indisponíveis por segurança');
```

---

## 📝 **RESUMO DA IMPLEMENTAÇÃO**

### 🎯 **Características Principais**

1. **Infinite Historical Data**: Carregamento infinito conforme navegação
2. **Lazy Loading**: Dados carregados sob demanda
3. **Cache Inteligente**: Cache de 30s com validação rigorosa
4. **Deduplicação**: Remoção automática de timestamps duplicados
5. **Fallbacks Robustos**: TradingView → Binance → CoinGecko
6. **Zoom Inteligente**: Zoom inicial de 7 dias, preservação durante navegação
7. **Linhas Dinâmicas**: Liquidação e take profit baseadas em posições
8. **Performance**: Limite de dados em memória (10k pontos)

### 🛡️ **Segurança**

- **Cache máximo**: 30 segundos
- **Validação rigorosa**: Estrutura e timestamps
- **Timeout**: 15 segundos por requisição
- **Rate limiting**: Controle de requisições por API
- **Zero dados antigos**: Erro em vez de dados desatualizados

### 📊 **Monitoramento**

- **Logs estruturados**: Debugging detalhado
- **Estatísticas de cache**: Hit rate e entries
- **Rate limiting stats**: Controle de requisições
- **Error tracking**: Tratamento específico por tipo de erro

---

**Documento**: Implementação de Gráficos de Candles  
**Versão**: 1.0.0  
**Última Atualização**: 2025-01-21  
**Responsável**: Equipe de Desenvolvimento
