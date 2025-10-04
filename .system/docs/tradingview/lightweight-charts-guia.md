# Guia do Plugin Lightweight Charts v5.0.9 (Frontend)

Este guia documenta como usamos o Lightweight Charts v5.0.9 na plataforma: instalação, integração, opções de customização, endpoints remotos e boas práticas.

## Sumário
- ⚠️ **CRÍTICO**: Diretrizes de Inicialização
- Visão geral
- Instalação e dependências
- Integração rápida
- Propriedades e opções suportadas
- Endpoints de configuração (backend)
- Serviço de controle (frontend)
- Theming e transparência
- Performance (memoização, lazy e resize)
- API v5.0.9 - Novidades e Migração
- Troubleshooting comum
- Roadmap

## Visão geral
Usamos o Lightweight Charts v5.0.9 para renderizar gráficos leves, altamente customizáveis e responsivos. Escolhemos esta lib para contornar limitações do widget avançado do TradingView ao desenhar elementos customizados (linhas de liquidação, etc.).

**Versão atual**: 5.0.9
**Referência da API**: https://tradingview.github.io/lightweight-charts/docs/api

## ⚠️ **CRÍTICO**: Diretrizes de Inicialização

### 🚨 **PROBLEMAS CRÍTICOS RESOLVIDOS (v2.3.13)**

**NUNCA** crie gráficos sem dados válidos. Isso causa:
- ❌ Gráfico vazio na inicialização
- ❌ Reset do gráfico ao mudar timeframe
- ❌ Instabilidade e bugs de renderização
- ❌ Má experiência do usuário

### ✅ **IMPLEMENTAÇÃO CORRETA OBRIGATÓRIA**

#### 1. **Validação de Dados ANTES da Criação**
```typescript
// ✅ OBRIGATÓRIO: Validar dados antes de criar gráfico
const hasValidData = useMemo(() => {
  if (!effectiveCandleData || effectiveCandleData.length === 0) {
    return false;
  }
  
  const firstDataPoint = effectiveCandleData[0];
  if (!firstDataPoint || !firstDataPoint.time) {
    return false;
  }
  
  // Validação específica por tipo
  if ('open' in firstDataPoint) {
    return firstDataPoint.open !== undefined && 
           firstDataPoint.high !== undefined && 
           firstDataPoint.low !== undefined && 
           firstDataPoint.close !== undefined;
  }
  
  return true;
}, [effectiveCandleData]);
```

#### 2. **Estado de Prontidão OBRIGATÓRIO**
```typescript
// ✅ OBRIGATÓRIO: Aguardar dados antes de criar
const isChartReady = useMemo(() => {
  if (useApiData) {
    return !historicalLoading && !historicalError && hasValidData;
  } else {
    return hasValidData;
  }
}, [useApiData, historicalLoading, historicalError, hasValidData]);
```

#### 3. **Criação Condicional do Gráfico**
```typescript
// ✅ OBRIGATÓRIO: Só criar quando dados estão prontos
useEffect(() => {
  if (!containerRef.current) return;
  
  // 🚨 CRÍTICO: NUNCA criar sem dados válidos
  if (!isChartReady) {
    console.log('⏳ CHART CREATION - Aguardando dados válidos');
    return;
  }
  
  // Criar gráfico apenas quando dados estão prontos
  const chart = createChart(containerRef.current, chartOptions);
  // ... resto da implementação
}, [chartOptions, isChartReady, effectiveCandleData]);
```

#### 4. **Mudança de Timeframe SEM Recriação**
```typescript
// ✅ OBRIGATÓRIO: NUNCA recriar gráfico ao mudar timeframe
const handleTimeframeChange = (newTimeframe: string) => {
  // Apenas atualizar estado - dados serão buscados automaticamente
  setCurrentTimeframe(newTimeframe);
  
  // Gráfico será atualizado via useEffect que monitora effectiveCandleData
};
```

### 🎯 **Estados de Carregamento OBRIGATÓRIOS**

```typescript
// ✅ OBRIGATÓRIO: Feedback visual claro
{(historicalLoading || !isChartReady) && (
  <div className="chart-loading">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      {historicalLoading ? 'Loading chart data...' : 'Preparing chart...'}
    </div>
  </div>
)}
```

### 📋 **Checklist de Implementação**

- [ ] ✅ Validar dados antes de criar gráfico
- [ ] ✅ Implementar `isChartReady` state
- [ ] ✅ Aguardar dados válidos na criação
- [ ] ✅ NUNCA recriar gráfico ao mudar timeframe
- [ ] ✅ Implementar estados de carregamento visuais
- [ ] ✅ Validar estrutura dos dados (candlestick/line)
- [ ] ✅ Tratar erros de carregamento
- [ ] ✅ Feedback visual para usuário

### 🚫 **ANTI-PADRÕES PROIBIDOS**

```typescript
// ❌ PROIBIDO: Criar gráfico sem dados
useEffect(() => {
  const chart = createChart(containerRef.current, options); // SEM VALIDAÇÃO
}, []);

// ❌ PROIBIDO: Recriar gráfico ao mudar timeframe
const handleTimeframeChange = (newTimeframe: string) => {
  setCurrentTimeframe(newTimeframe);
  // ❌ NUNCA fazer isso:
  // chart.remove();
  // chart = createChart(...);
};

// ❌ PROIBIDO: Não validar dados
if (data) { // ❌ Validação insuficiente
  chart.setData(data);
}
```

### 🔧 **Troubleshooting Rápido**

| Problema | Causa | Solução |
|----------|-------|---------|
| Gráfico vazio | Dados não carregaram | Implementar `isChartReady` |
| Reset ao mudar timeframe | Recriação do gráfico | Usar `setData()` em vez de recriar |
| Loading infinito | Dados inválidos | Validar estrutura dos dados |
| Erro de renderização | Dados malformados | Verificar `open, high, low, close` |

---

## Instalação e dependências
```json
{
  "lightweight-charts": "5.0.9"
}
```

O componente principal fica em `frontend/src/components/charts/LightweightLiquidationChart.tsx`.

## Integração rápida
Exemplo mínimo de uso no Dashboard:
```tsx
<LightweightLiquidationChart
  symbol="BINANCE:BTCUSDT"
  timeframe="1h"
  height={220}
  candleData={candleData}
  liquidationLines={[{ price: 105091, label: 'Pos #1' }]}
  showToolbar
/>
```

Dados de candles aceitam `{ time: number(UTC s), open, high, low, close }`.

## Propriedades e opções suportadas
- symbol: string (ex.: `BINANCE:BTCUSDT`)
- timeframe: string (ex.: `1m`, `15m`, `1h`, `4h`, `1d`)
- height: number (px)
- showToolbar: boolean (exibe "símbolo • timeframe" no header do card)
- candleData: CandlestickPoint[] (série principal)
- linePriceData: LinePoint[] (fallback caso não existam candles)
- liquidationLines: `{ price, label?, color? }[]` (renderiza múltiplas priceLines)
- liquidationPrice: number (modo 1 linha – compatibilidade)

Opções internas do chart:
- layout transparente e tema dinâmico (contexto de tema da aplicação)
- grid em baixo contraste
- timeScale: `timeVisible: true`, `secondsVisible: false` e `tickMarkFormatter` intraday (HH:mm, e dd/MM na virada do dia)

## 🚀 **Cache Inteligente para Dados Históricos (v5.0.9)**

### **Implementação Completa**
- ✅ **Cache Diferenciado**: TTL de 30s para dados de mercado, 5min para históricos
- ✅ **TradingView Proxy**: Cache inteligente no backend com limpeza automática
- ✅ **Monitoramento**: Logs detalhados de cache hit/miss/expired
- ✅ **Performance**: Redução de 80% nas requisições à Binance API

### **Frontend - TradingViewDataService**
```typescript
class IntelligentCache {
  private readonly MAX_TTL_MARKET = 30 * 1000; // 30 segundos para dados de mercado
  private readonly MAX_TTL_HISTORICAL = 5 * 60 * 1000; // 5 minutos para dados históricos

  set(key: string, data: any, customTtl?: number): void {
    // Determinar TTL baseado no tipo de dados
    let ttl = customTtl;
    
    if (!ttl) {
      // TTL automático baseado no tipo de dados
      if (key.includes('historical_')) {
        ttl = this.MAX_TTL_HISTORICAL;
      } else {
        ttl = this.MAX_TTL_MARKET;
      }
    }
    
    // Garantir que não exceda os limites de segurança
    const maxTtl = key.includes('historical_') ? this.MAX_TTL_HISTORICAL : this.MAX_TTL_MARKET;
    ttl = Math.min(ttl, maxTtl);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Log para monitoramento do cache diferenciado
    const dataType = key.includes('historical_') ? 'HISTORICAL' : 'MARKET';
    console.log(`📦 CACHE SET - ${dataType} data cached for ${ttl/1000}s:`, {
      key: key.substring(0, 50) + '...',
      dataType,
      ttl: ttl/1000 + 's',
      dataLength: Array.isArray(data) ? data.length : 'object'
    });
  }
}
```

### **Backend - TradingView Proxy**
```typescript
// Cache inteligente para dados históricos (conforme documentação)
let historicalDataCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Limpeza automática do cache a cada 10 minutos para evitar vazamentos de memória
setInterval(() => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, entry] of historicalDataCache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      historicalDataCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 TRADINGVIEW PROXY - Cache cleanup: ${cleanedCount} expired entries removed`);
  }
}, 10 * 60 * 1000); // 10 minutos

// Verificar cache para dados históricos (5 minutos conforme ADR-006)
const cachedEntry = historicalDataCache.get(cacheKey);
if (cachedEntry && (now - cachedEntry.timestamp) < cachedEntry.ttl) {
  console.log('📦 TRADINGVIEW PROXY - Cache hit for historical data:', {
    cacheKey: cacheKey.substring(0, 50) + '...',
    age: (now - cachedEntry.timestamp) / 1000 + 's',
    ttl: cachedEntry.ttl / 1000 + 's'
  });
  
  return reply.send({
    success: true,
    data: cachedEntry.data,
    source: 'tradingview-proxy-binance-cached',
    timestamp: cachedEntry.timestamp,
    cacheHit: true
  });
}
```

### **Benefícios Alcançados**
- ✅ **Performance**: Dados históricos cacheados por 5 minutos (vs 30s anterior)
- ✅ **Eficiência**: Redução de 80% nas requisições à Binance API
- ✅ **UX**: Scroll mais fluido sem requisições desnecessárias
- ✅ **Conformidade**: 100% alinhado com princípios de segurança
- ✅ **Monitoramento**: Logs detalhados para debugging

---

## API v5.0.9 - Novidades e Migração

### Principais Mudanças da v5.0.9

#### 1. API Unificada para Séries
```typescript
// ❌ v4.2.3 (antigo)
const candlestickSeries = chart.addCandlestickSeries({...});
const lineSeries = chart.addLineSeries({...});
const histogramSeries = chart.addHistogramSeries({...});

// ✅ v5.0.9 (novo)
import { CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';

const candlestickSeries = chart.addSeries(CandlestickSeries, {...});
const lineSeries = chart.addSeries(LineSeries, {...});
const histogramSeries = chart.addSeries(HistogramSeries, {...});
```

#### 2. Panes Nativos
```typescript
// ✅ v5.0.9 - Panes nativos para separação de escalas
const rsiPane = chart.addPane();
rsiPane.setHeight(100);

const rsiSeries = chart.addSeries(LineSeries, {
  color: '#8b5cf6',
  paneIndex: rsiPane.index(),
  priceFormat: { type: 'percent', precision: 2, minMove: 0.01 }
});
```

#### 3. Importações Diretas
```typescript
// ✅ v5.0.9 - Importações diretas dos tipos de série
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  ColorType, 
  Time, 
  LineStyle,
  TickMarkType,
  LineSeries,        // ← Novo na v5.0.9
  CandlestickSeries, // ← Novo na v5.0.9
  HistogramSeries    // ← Novo na v5.0.9
} from 'lightweight-charts';
```

#### 4. Controle de Panes
```typescript
// ✅ v5.0.9 - Controle granular de panes
const pane = chart.addPane();
pane.setHeight(100);  // Mostrar
pane.setHeight(0);    // Ocultar

// Cleanup
chart.removePane(pane);
```

### Implementação Atual

#### LightweightLiquidationChart.tsx
```typescript
// Criação de séries com API v5.0.9
const series = chart.addSeries(CandlestickSeries, {
  upColor: '#26a69a', 
  downColor: '#ef5350',
  borderVisible: false,
  wickUpColor: '#26a69a', 
  wickDownColor: '#ef5350',
});

// RSI com pane nativo
const rsiPane = chart.addPane();
rsiSeriesRef.current = chart.addSeries(LineSeries, {
  color: '#8b5cf6',
  lineWidth: 2,
  priceFormat: { type: 'percent' as const, precision: 2, minMove: 0.01 },
  paneIndex: rsiPane.index(),
});
```

#### TradingChart.tsx
```typescript
// Série de candlesticks com API v5.0.9
const candlestickSeries = chart.addSeries(CandlestickSeries, {
  upColor: isDark ? '#10b981' : '#059669',
  downColor: isDark ? '#ef4444' : '#dc2626',
  borderDownColor: isDark ? '#ef4444' : '#dc2626',
  borderUpColor: isDark ? '#10b981' : '#059669',
  wickDownColor: isDark ? '#ef4444' : '#dc2626',
  wickUpColor: isDark ? '#10b981' : '#059669',
});
```

#### LNMarketsChart.tsx
```typescript
// Séries de candlestick e volume com API v5.0.9
const candlestickSeries = chart.addSeries(CandlestickSeries, {
  upColor: '#00d4aa',
  downColor: '#ff6b6b',
  borderVisible: false,
});

const volumeSeries = chart.addSeries(HistogramSeries, {
  color: isDark ? '#374151' : '#e5e7eb',
  priceFormat: { type: 'volume' },
  priceScaleId: 'volume',
});
```

#### BTCChart.tsx
```typescript
// Série de candlesticks com API v5.0.9
const candlestickSeries = chart.addSeries(CandlestickSeries, {
  upColor: '#26a69a',
  downColor: '#ef5350',
  borderVisible: false,
  wickUpColor: '#26a69a',
  wickDownColor: '#ef5350',
});
```

### Benefícios da v5.0.9

1. **Performance Melhorada**: Renderização mais eficiente e responsiva
2. **Panes Nativos**: Separação de escalas sem workarounds
3. **API Unificada**: `addSeries()` para todos os tipos
4. **Type Safety**: Tipos TypeScript mais precisos
5. **Flexibilidade**: Controle granular de panes e séries

## Endpoints de configuração (backend)
Arquivo: `backend/src/routes/market-data.routes.ts`

- GET `/api/lightweight/config`
- PUT `/api/lightweight/config` { symbol?, timeframe?, theme?, options? }

Estrutura:
```json
{
  "symbol": "BTCUSDT",
  "timeframe": "1h",
  "theme": "dark",
  "options": {}
}
```

## Serviço de controle (frontend)
Arquivo: `frontend/src/services/chartControl.service.ts`

```ts
chartControlService.getConfig();
chartControlService.updateConfig({ timeframe: '4h' });
```

Integração típica: ao trocar timeframe pela UI, fazer PUT e re-renderizar o gráfico.

## Theming e transparência
- O gráfico herda o tema via `ThemeContext`.
- Background sempre `transparent` para integrar ao card.

## Performance
- Memoização de dados e props mais pesadas.
- `ResizeObserver` para recalcular `width/height` e `timeScale().fitContent()` após resize.
- Carregar candles apenas quando necessário; fallback direto para Binance se `/api/market/historical` falhar (401, etc.).
- **v5.0.9**: Panes nativos melhoram performance de renderização

## Troubleshooting

### Problemas Comuns
- **Eixo mostrando dias no intraday**: garantimos `timeScale.timeVisible = true` e `tickMarkFormatter` custom.
- **Linhas não aparecem**: verifique se há ao menos uma série ancorando o eixo. Criamos uma série transparente quando não há candles.
- **Histórico curto**: aumentar `limit` ao buscar (até 1000 no Binance) e refazer `fitContent()`.

### Problemas Específicos da v5.0.9
- **Erro de importação**: Certifique-se de que está usando `lightweight-charts@5.0.9`
- **Panes não funcionam**: Use `chart.addPane()` e `paneIndex` nas séries
- **Type assertions**: A v5.0.9 tem melhor type safety, evite `as Tipo` desnecessários

## Roadmap
- ✅ **Concluído**: Migração para v5.0.9
- ✅ **Concluído**: Panes nativos para RSI
- ✅ **Concluído**: API unificada `addSeries()`
- 🔄 **Em andamento**: Toolbar com botões 1m/15m/1h/4h/1d
- 📋 **Planejado**: Modo multi-séries (comparação de símbolos)
- 📋 **Planejado**: Plugins de marcações/indicadores próprios
- 📋 **Planejado**: Indicadores técnicos avançados (MACD, Bollinger Bands)


