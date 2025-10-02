# 📊 **DOCUMENTAÇÃO COMPLETA DO FLUXO DE DADOS DE API**

## 📋 **ÍNDICE**

1. [Visão Geral do Sistema de Dados](#1-visão-geral-do-sistema-de-dados)
2. [Arquitetura de Dados Centralizada](#2-arquitetura-de-dados-centralizada)
3. [Fluxo de Dados do Header de Índice](#3-fluxo-de-dados-do-header-de-índice)
4. [Fluxo de Dados da Dashboard](#4-fluxo-de-dados-da-dashboard)
5. [Fluxo de Dados dos Gráficos de Candles](#5-fluxo-de-dados-dos-gráficos-de-candles)
6. [Sistema de Cache e Segurança](#6-sistema-de-cache-e-segurança)
7. [Tratamento de Erros e Fallbacks](#7-tratamento-de-erros-e-fallbacks)
8. [Monitoramento e Debugging](#8-monitoramento-e-debugging)

---

## 1. **VISÃO GERAL DO SISTEMA DE DADOS**

### 🎯 **Princípios Fundamentais**

O Hub DeFiSats implementa uma **arquitetura centralizada de dados** baseada em três pilares:

1. **Segurança em Mercados Voláteis**: Cache máximo de 30 segundos, zero tolerância a dados antigos
2. **Centralização Inteligente**: Uma única requisição para múltiplos dados de mercado
3. **Fallback Robusto**: TradingView → Binance → CoinGecko com validação rigorosa

### 🏗️ **Arquitetura de Dados**

```mermaid
graph TB
    subgraph "Frontend"
        A[MarketDataContext] --> B[useMarketData]
        A --> C[useOptimizedPositions]
        A --> D[useOptimizedDashboardMetrics]
        A --> E[useBtcPrice]
        
        F[PositionsContext] --> G[usePositions]
        F --> H[usePositionsMetrics]
        
        I[useHistoricalData] --> J[LightweightLiquidationChart]
        I --> K[TradingViewDataService]
    end
    
    subgraph "Backend APIs"
        L[/api/market/index/public] --> M[LN Markets API]
        L --> N[Binance API]
        L --> O[CoinGecko API]
        
        P[/api/lnmarkets-robust/dashboard] --> Q[LN Markets API v2]
        
        R[/api/tradingview/scanner] --> S[TradingView Proxy]
        S --> T[Binance Klines]
    end
    
    subgraph "Data Sources"
        M --> U[LN Markets]
        N --> V[Binance]
        O --> W[CoinGecko]
        T --> V
    end
    
    B --> L
    B --> P
    I --> R
```

---

## 2. **ARQUITETURA DE DADOS CENTRALIZADA**

### 🎯 **MarketDataContext - Coração do Sistema**

O `MarketDataContext` é o **componente central** que consolida todas as requisições de dados de mercado:

```typescript
// frontend/src/contexts/MarketDataContext.tsx
interface MarketData {
  // Dados do mercado
  btcPrice: number;
  marketIndex: any;
  ticker: any;
  
  // Dados de posições
  positions: any[];
  
  // Dados de saldo
  balance: any;
  estimatedBalance: any;
  
  // Metadados
  lastUpdate: number;
  isLoading: boolean;
  error: string | null;
  cacheHit: boolean;
}
```

### 🔄 **Fluxo de Consolidação**

```typescript
// ✅ REQUISIÇÃO ÚNICA: Buscar todos os dados de uma vez
const [dashboardResponse, marketResponse] = await Promise.all([
  api.get('/api/lnmarkets-robust/dashboard'),
  api.get('/api/market/index/public')
]);

// ✅ CONSOLIDAR TODOS OS DADOS EM UM ÚNICO OBJETO
const consolidatedData: MarketData = {
  // Dados do mercado
  btcPrice: marketData.data?.index || 0,
  marketIndex: marketData.data,
  ticker: marketData.data,
  
  // Dados de posições (CORRIGIDO: usar lnMarkets.positions)
  positions: dashboardData.data?.lnMarkets?.positions || [],
  
  // Dados de saldo (CORRIGIDO: usar lnMarkets.balance)
  balance: dashboardData.data?.lnMarkets?.balance,
  estimatedBalance: dashboardData.data?.lnMarkets?.balance,
  
  // Metadados
  lastUpdate: Date.now(),
  isLoading: false,
  error: null,
  cacheHit: false
};
```

### 📊 **Hooks Derivados**

```typescript
// Hooks específicos para diferentes necessidades
export const useOptimizedPositions = () => {
  const { data } = useMarketData();
  return {
    positions: data?.positions || [],
    isLoading: data?.isLoading,
    error: data?.error
  };
};

export const useOptimizedDashboardMetrics = () => {
  const { data } = useMarketData();
  
  if (!data) {
    return { totalPL: 0, totalMargin: 0, positionCount: 0 };
  }

  // Calcular métricas das posições
  const totalPL = data.positions.reduce((sum, pos) => sum + (pos.pl || 0), 0);
  const totalMargin = data.positions.reduce((sum, pos) => sum + (pos.margin || 0), 0);
  const positionCount = data.positions.length;

  return { totalPL, totalMargin, positionCount };
};
```

---

## 3. **FLUXO DE DADOS DO HEADER DE ÍNDICE**

### 🎯 **Componente Principal**

O header utiliza o `LNMarketsHeader` que consome dados do `PositionsContext`:

```typescript
// frontend/src/components/layout/LNMarketsHeader.tsx
const LNMarketsHeader: React.FC = () => {
  const { data } = usePositions();
  const lnMarketsData = data.marketIndex;
  const lnMarketsError = data.marketIndexError;
  
  // Memoizar dados do mercado para evitar re-renders desnecessários
  const memoizedMarketData = useMemo(() => {
    if (lnMarketsData) {
      return {
        index: lnMarketsData.index,
        index24hChange: lnMarketsData.index24hChange,
        tradingFees: lnMarketsData.tradingFees,
        nextFunding: lnMarketsData.nextFunding,
        rate: lnMarketsData.rate,
        rateChange: lnMarketsData.rateChange,
        lastUpdate: new Date(lnMarketsData.timestamp),
        source: lnMarketsData.source
      };
    }
    return null;
  }, [lnMarketsData]);
```

### 🔄 **Backend - Endpoint Público**

```typescript
// backend/src/routes/market-data.routes.ts
fastify.get('/market/index/public', async (request, reply) => {
  // 1. Verificar cache apenas para evitar spam (30 segundos máximo)
  const now = Date.now();
  if (marketDataCache.data && (now - marketDataCache.timestamp) < marketDataCache.ttl) {
    return reply.status(200).send({
      success: true,
      data: marketDataCache.data
    });
  }

  // 2. Tentar LN Markets com retry
  let lnMarketsData = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch('https://api.lnmarkets.com/v2/futures/ticker', {
        timeout: 15000
      });
      
      if (response.ok) {
        const data = await response.json();
        lnMarketsData = {
          index: data.index || data.price || data.lastPrice,
          source: 'lnmarkets'
        };
        break;
      }
    } catch (lnMarketsError) {
      // Retry logic
    }
  }

  // 3. Calcular 24h change usando Binance
  let change24hData = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const tickerResponse = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT');
      
      if (tickerResponse.ok) {
        const tickerData = await tickerResponse.json();
        const priceChangePercent = parseFloat(tickerData.priceChangePercent);
        
        change24hData = {
          change24h: parseFloat(priceChangePercent.toFixed(3))
        };
        break;
      }
    } catch (binanceError) {
      // Retry logic
    }
  }

  // 4. Combinar dados e calcular Next Funding
  const marketData = {
    index: lnMarketsData?.index || 0,
    change24h: change24hData?.change24h || 0,
    source: lnMarketsData?.source || 'fallback'
  };

  // Calcular Next Funding (LN Markets funding every 8h: 00:00, 08:00, 16:00 UTC)
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  const currentSecond = now.getUTCSeconds();
  
  let nextFundingHour;
  if (currentHour < 8) {
    nextFundingHour = 8;
  } else if (currentHour < 16) {
    nextFundingHour = 16;
  } else {
    nextFundingHour = 24; // Next day 00:00
  }
  
  const hoursToNext = Math.floor((nextFundingHour * 60 - (currentHour * 60 + currentMinute)) / 60);
  const minutesToNext = (nextFundingHour * 60 - (currentHour * 60 + currentMinute)) % 60;
  const secondsToNext = 60 - currentSecond;
  
  const nextFunding = hoursToNext === 0
    ? `${minutesToNext}m ${secondsToNext}s`
    : `${hoursToNext}h ${minutesToNext}m ${secondsToNext}s`;

  const responseData = {
    index: Math.round(marketData.index),
    index24hChange: parseFloat(marketData.change24h.toFixed(3)),
    tradingFees: 0.1, // LN Markets standard fee
    nextFunding: nextFunding,
    rate: 0.00006, // 0.0060% in decimal
    timestamp: new Date().toISOString(),
    source: marketData.source
  };

  // Atualizar cache (apenas 30 segundos)
  marketDataCache = {
    data: responseData,
    timestamp: now,
    ttl: 30 * 1000
  };

  return reply.status(200).send({
    success: true,
    data: responseData
  });
});
```

### 📊 **Exibição no Header**

```typescript
// Renderização condicional baseada no estado dos dados
{lnMarketsError ? (
  <div className="flex items-center space-x-1">
    <span className="text-red-400 text-sm">Error</span>
  </div>
) : marketData ? (
  <div className="flex flex-col items-start space-y-1">
    <div className="flex items-center space-x-2">
      <span className="text-white font-bold font-mono">
        ${formatIndex(marketData.index)}
      </span>
      <Badge 
        variant={marketData.index24hChange >= 0 ? "success" : "danger"}
        className="text-xs font-mono"
      >
        {marketData.index24hChange >= 0 ? (
          <TrendingUp className="w-3 h-3 mr-1" />
        ) : (
          <TrendingDown className="w-3 h-3 mr-1" />
        )}
        {format24hChange(marketData.index24hChange)}
      </Badge>
    </div>
    {marketData.source === 'coingecko' && (
      <span className="text-xs text-gray-400 font-mono">CoinGecko</span>
    )}
  </div>
) : (
  <div className="flex items-center space-x-1">
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-text-primary"></div>
    <span className="text-text-secondary text-sm">Loading...</span>
  </div>
)}
```

---

## 4. **FLUXO DE DADOS DA DASHBOARD**

### 🎯 **Cards Principais**

A dashboard utiliza dados centralizados do `MarketDataContext` para exibir métricas:

```typescript
// frontend/src/pages/Dashboard.tsx
export default function Dashboard() {
  // Hook otimizado para dados da dashboard
  const { 
    data: marketData, 
    isLoading: marketLoading, 
    error: marketError, 
    refresh: refreshMarket,
    lastUpdate,
    cacheHit
  } = useMarketData();
  
  // Métricas otimizadas da dashboard
  const {
    totalPL,
    totalMargin,
    positionCount
  } = useOptimizedDashboardMetrics();
  
  // Dados de posições otimizados
  const { positions: optimizedPositions } = useOptimizedPositions();
```

### 📊 **Renderização dos Cards**

```typescript
// Cards com degradês coloridos - Layout responsivo
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
  {/* Card PnL Total com cores dinâmicas */}
  <div className="relative group">
    <div className="absolute -top-3 -right-3 z-30 group-hover:icon-float">
      {(() => {
        const colors = getCardIconColors('total-pnl', totalPL || 0);
        return (
          <div className={`w-8 h-8 sm:w-12 sm:h-12 backdrop-blur-sm border rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-500 ease-out ${colors.bg} ${colors.border} ${colors.shadow}`}>
            <TrendingUp className={`w-4 h-4 sm:w-6 sm:h-6 stroke-2 group-hover:transition-colors duration-500 ${colors.icon}`} />
          </div>
        );
      })()}
    </div>
    
    <Card className={cn(
      "gradient-card backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl",
      getCardGradient('total-pnl', totalPL || 0)
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-text-primary">
          <SatsIcon 
            value={totalPL || 0} 
            variant="auto"
            size={20}
          />
        </div>
        <p className="text-xs text-text-secondary mt-1">
          Unrealized profit/loss
        </p>
      </CardContent>
    </Card>
  </div>
```

### 🔄 **Backend - Dashboard Unificada**

```typescript
// backend/src/routes/lnmarkets-robust.routes.ts
fastify.get('/dashboard', {
  preHandler: [authenticate],
  handler: dashboardController.getDashboardData
});

// Controller consolida dados de múltiplas fontes
export const getDashboardData = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = (request as any).user;
    
    // Buscar dados de posições, saldo e mercado em paralelo
    const [positions, balance, marketIndex] = await Promise.all([
      lnMarketsService.getUserPositions(),
      lnMarketsService.getUserBalance(),
      lnMarketsService.getMarketIndex()
    ]);

    // Consolidar dados em estrutura unificada
    const dashboardData = {
      lnMarkets: {
        positions,
        balance,
        marketIndex
      },
      timestamp: Date.now(),
      success: true
    };

    return reply.status(200).send({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    return reply.status(500).send({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to get dashboard data'
    });
  }
};
```

---

## 5. **FLUXO DE DADOS DOS GRÁFICOS DE CANDLES**

### 🎯 **Arquitetura TradingView-First**

O sistema implementa uma arquitetura **TradingView-first** com fallbacks robustos:

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

### 🔄 **Hook useHistoricalData**

```typescript
// frontend/src/hooks/useHistoricalData.ts
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

### 🎨 **Componente LightweightLiquidationChart**

```typescript
// frontend/src/components/charts/LightweightLiquidationChart.tsx
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
    timeframe,
    initialLimit: 168, // 7 dias para timeframe 1h
    maxDataPoints: currentTimeframe === '1h' ? 10000 : 5000,
    loadThreshold: currentTimeframe === '1h' ? 50 : 20
  });

  // Determinar dados efetivos para exibição
  const effectiveCandleData = useApiData ? historicalData : propCandleData;
  
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

### 🔄 **Backend Proxy TradingView**

```typescript
// backend/src/routes/tradingview.routes.ts
fastify.get('/scanner', async (request, reply) => {
  try {
    const { symbol = 'BTCUSDT', timeframe = '1h', limit = '100' } = request.query as any;
    
    console.log('🔄 TRADINGVIEW PROXY - Request:', { symbol, timeframe, limit });

    // Por enquanto, usar Binance como fonte (transparente para o frontend)
    const binanceResponse = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${timeframe}&limit=${limit}`
    );

    if (!binanceResponse.ok) {
      throw new Error(`Binance API error: ${binanceResponse.status}`);
    }

    const binanceData = await binanceResponse.json();
    
    // Converter formato Binance para formato TradingView
    const tradingViewData = binanceData.map((kline: any[]) => ({
      time: kline[0], // timestamp
      open: parseFloat(kline[1]),
      high: parseFloat(kline[2]),
      low: parseFloat(kline[3]),
      close: parseFloat(kline[4]),
      volume: parseFloat(kline[5])
    }));

    console.log('✅ TRADINGVIEW PROXY - Data converted:', {
      count: tradingViewData.length,
      source: 'binance-via-proxy'
    });

    return reply.status(200).send({
      success: true,
      data: tradingViewData,
      source: 'tradingview-proxy-binance',
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('❌ TRADINGVIEW PROXY - Error:', error);
    return reply.status(500).send({
      success: false,
      error: 'PROXY_ERROR',
      message: error.message
    });
  }
});
```

---

## 6. **SISTEMA DE CACHE E SEGURANÇA**

### 🛡️ **Princípios de Segurança**

Seguindo o documento `_VOLATILE_MARKET_SAFETY.md`, o sistema implementa:

1. **Cache máximo de 30 segundos**
2. **Zero tolerância a dados antigos**
3. **Nenhum fallback com dados simulados**
4. **Validação rigorosa de timestamps**

### 📦 **Implementação do Cache**

```typescript
// Cache para dados de mercado (30 segundos - apenas para evitar spam de requisições)
let marketDataCache = {
  data: null,
  timestamp: 0,
  ttl: 30 * 1000 // 30 segundos - dados devem ser muito recentes
};

// Verificar cache apenas para evitar spam (30 segundos máximo)
const now = Date.now();
if (marketDataCache.data && (now - marketDataCache.timestamp) < marketDataCache.ttl) {
  console.log('✅ PUBLIC MARKET INDEX - Using recent cached data (30s)');
  return reply.status(200).send({
    success: true,
    data: marketDataCache.data
  });
}

// NUNCA usar cache em caso de erro - dados podem estar desatualizados
if (apiFails) {
  return reply.status(503).send({
    success: false,
    error: 'SERVICE_UNAVAILABLE',
    message: 'Market data temporarily unavailable. Please try again later.'
  });
}
```

### 🔍 **Validação de Dados**

```typescript
// frontend/src/services/tradingViewData.service.ts
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

---

## 7. **TRATAMENTO DE ERROS E FALLBACKS**

### 🔄 **Hierarquia de Fallbacks**

```typescript
// 1. TradingView (Principal) - via proxy backend
// 2. Binance (Fallback) - direto
// 3. CoinGecko (Backup) - último recurso

const apis = Object.entries(API_CONFIG)
  .sort(([,a], [,b]) => a.priority - b.priority)
  .map(([name]) => name);

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
      console.log(`✅ TRADINGVIEW - Data fetched from ${apiName}: ${data.length} candles`);
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

### 🚨 **Tratamento de Erros no Frontend**

```typescript
// Tratamento de erros com fallback transparente
try {
  const data = await marketDataService.getHistoricalDataFromBinance(symbol, timeframe, initialLimit);
  setCandleData(data);
} catch (err: any) {
  console.error('❌ HISTORICAL - Error loading initial data:', err);
  setError(err.message || 'Failed to load historical data');
  setCandleData(undefined);
  
  // Não usar dados antigos - mostrar erro
  if (err.message.includes('timeout')) {
    setError('Request timeout - please try again');
  } else if (err.message.includes('API')) {
    setError('Data source unavailable - please try again later');
  } else {
    setError('Failed to load chart data');
  }
}
```

---

## 8. **MONITORAMENTO E DEBUGGING**

### 📊 **Logs Estruturados**

```typescript
// Logs detalhados para debugging
console.log('🔍 MARKET DATA - fetchAllMarketData called:', {
  isAuthenticated,
  userId: user?.id,
  isAdmin: user?.is_admin,
  hasToken: !!localStorage.getItem('access_token')
});

console.log('📊 MARKET DATA - Data received:', {
  dashboardSuccess: dashboardData.success,
  marketSuccess: marketData.success,
  positionsCount: dashboardData.data?.lnMarkets?.positions?.length || 0,
  hasBalance: !!dashboardData.data?.lnMarkets?.balance,
  btcPrice: marketData.data?.index || 0,
  lnMarketsStructure: Object.keys(dashboardData.data?.lnMarkets || {})
});

console.log('✅ MARKET DATA - All data consolidated successfully:', {
  positionsCount: consolidatedData.positions.length,
  btcPrice: consolidatedData.btcPrice,
  hasBalance: !!consolidatedData.balance,
  timestamp: new Date().toISOString()
});
```

### 🔍 **Componente de Monitoramento**

```typescript
// frontend/src/components/TradingViewMonitor.tsx
const TradingViewMonitor: React.FC = () => {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [rateLimitStats, setRateLimitStats] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      // Atualizar estatísticas de cache e rate limiting
      setCacheStats(tradingViewDataService.getCacheStats());
      setRateLimitStats(tradingViewDataService.getRateLimitStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          TradingView Data Service
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cache Statistics */}
        <div>
          <h4 className="font-semibold mb-2">Cache Status</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Entries: {cacheStats?.entries || 0}</div>
            <div>Hit Rate: {cacheStats?.hitRate || 0}%</div>
          </div>
        </div>

        {/* Rate Limiting */}
        <div>
          <h4 className="font-semibold mb-2">Rate Limiting</h4>
          <div className="space-y-1 text-sm">
            {rateLimitStats && Object.entries(rateLimitStats).map(([api, stats]: [string, any]) => (
              <div key={api} className="flex justify-between">
                <span>{api}:</span>
                <span>{stats.requests}/{stats.limit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Order */}
        <div>
          <h4 className="font-semibold mb-2">Ordem de Prioridade</h4>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
              TradingView (Principal)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
              Binance (Fallback)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
              CoinGecko (Backup)
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Security Notice:</strong> TradingView como principal (dados agregados), 
            Binance e CoinGecko como fallbacks. Cache de 30s máximo para segurança em mercados voláteis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 📝 **RESUMO DOS FLUXOS**

### 🎯 **Fluxo do Header de Índice**
1. `LNMarketsHeader` → `usePositions` → `PositionsContext`
2. `PositionsContext` → `/api/market/index/public`
3. Backend: LN Markets → Binance (24h change) → Cache 30s
4. Frontend: Exibição com badges de mudança e fonte

### 🎯 **Fluxo da Dashboard**
1. `Dashboard` → `useMarketData` → `MarketDataContext`
2. `MarketDataContext` → `/api/lnmarkets-robust/dashboard` + `/api/market/index/public`
3. Backend: Consolidação de posições, saldo e mercado
4. Frontend: Cards com métricas calculadas e cores dinâmicas

### 🎯 **Fluxo dos Gráficos de Candles**
1. `LightweightLiquidationChart` → `useHistoricalData` → `TradingViewDataService`
2. `TradingViewDataService` → `/api/tradingview/scanner` (proxy)
3. Backend Proxy: Binance Klines → Formato TradingView
4. Frontend: Chart com lazy loading, deduplicação e zoom inteligente

### 🛡️ **Princípios de Segurança**
- **Cache máximo**: 30 segundos
- **Zero dados antigos**: Erro em vez de dados desatualizados
- **Validação rigorosa**: Timestamps e estrutura de dados
- **Fallbacks transparentes**: TradingView → Binance → CoinGecko

---

**Documento**: Fluxo de Dados de API  
**Versão**: 1.0.0  
**Última Atualização**: 2025-01-21  
**Responsável**: Equipe de Desenvolvimento
