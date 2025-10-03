# Padrão de Gráfico Lightweight Charts v5.0.9 - Hub DeFiSats

Este documento define o padrão oficial do componente `LightweightLiquidationChart` para futuras implementações no projeto Hub DeFiSats usando a API v5.0.9.

## 📋 Visão Geral

O `LightweightLiquidationChart` é o componente padrão para visualização de dados financeiros com linhas personalizadas, indicadores técnicos e dados em tempo real usando a **API v5.0.9** do Lightweight Charts.

**Versão da Biblioteca**: 5.0.9
**API**: Unificada com `addSeries()` e panes nativos

## 🏗️ Arquitetura Padrão

### Componente Principal
- **Arquivo**: `frontend/src/components/charts/LightweightLiquidationChart.tsx`
- **Biblioteca**: `lightweight-charts@5.0.9`
- **Tema**: Transparente com adaptação automática (dark/light)
- **API**: v5.0.9 com panes nativos e `addSeries()` unificado

### Hooks Padrão
- **useCandleData**: Para dados de candles da API
- **useIndicators**: Para gerenciamento de indicadores técnicos
- **useTheme**: Para adaptação de tema

## 🎨 Interface Padrão

### Props Obrigatórias
```typescript
interface LightweightLiquidationChartProps {
  symbol?: string;                    // Ex: 'BINANCE:BTCUSDT'
  height?: number;                   // Altura do gráfico (padrão: 400)
  className?: string;               // Classes CSS adicionais
  useApiData?: boolean;             // Usar dados da API (padrão: true)
}
```

### Props de Linhas Personalizadas
```typescript
// Linhas de Liquidação (vermelhas)
liquidationLines?: Array<{
  price: number;
  label?: string;
  color?: string;  // Padrão: '#ff4444'
}>;

// Linhas de Take Profit (verdes)
takeProfitLines?: Array<{
  price: number;
  label?: string;
  color?: string;  // Padrão: '#22c55e'
}>;
```

### Props de Toolbar
```typescript
showToolbar?: boolean;              // Exibir toolbar (padrão: true)
onTimeframeChange?: (tf: string) => void;
onIndicatorAdd?: (indicator: string) => void;
```

### Props de Personalização Visual
```typescript
displaySymbol?: string;             // Ex: 'XBTUSD'
symbolDescription?: string;        // Ex: 'BTCUSD: LNM FUTURES'
logoUrl?: string;                  // Ex: '/lnm-logo.svg'
```

## 🎯 Padrões de Implementação v5.0.9

### 1. Importações Padrão v5.0.9
```typescript
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

### 2. Criação de Séries com API v5.0.9
```typescript
// ✅ v5.0.9 - API unificada
const candlestickSeries = chart.addSeries(CandlestickSeries, {
  upColor: '#26a69a', 
  downColor: '#ef5350',
  borderVisible: false,
  wickUpColor: '#26a69a', 
  wickDownColor: '#ef5350',
});

const lineSeries = chart.addSeries(LineSeries, {
  color: '#2196F3',
  lineWidth: 2,
});

const volumeSeries = chart.addSeries(HistogramSeries, {
  color: '#374151',
  priceFormat: { type: 'volume' },
  priceScaleId: 'volume',
});
```

### 3. Panes Nativos para RSI
```typescript
// ✅ v5.0.9 - Panes nativos para separação de escalas
const rsiPane = chart.addPane();
rsiPane.setHeight(100);

const rsiSeries = chart.addSeries(LineSeries, {
  color: '#8b5cf6',
  lineWidth: 2,
  priceFormat: { type: 'percent' as const, precision: 2, minMove: 0.01 },
  paneIndex: rsiPane.index(),
});

// Controle de visibilidade do pane
const updateRSIVisibility = useCallback(() => {
  if (rsiPane) {
    if (rsiEnabled) {
      rsiPane.setHeight(100);
    } else {
      rsiPane.setHeight(0);
    }
  }
}, [rsiEnabled]);
```

### 4. Toolbar TradingView-style
```typescript
// Timeframes padrão
const timeframes = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '30m', label: '30m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1d' }
];

// Indicadores padrão
const availableIndicators = [
  { id: 'rsi', name: 'RSI', icon: Activity },
  { id: 'macd', name: 'MACD', icon: TrendingUp },
  { id: 'bollinger', name: 'Bollinger Bands', icon: Target }
];
```

### 5. Configuração do Gráfico v5.0.9
```typescript
const chart = createChart(containerRef.current, {
  height,
  layout: {
    textColor: isDark ? '#d1d5db' : '#374151',
    background: { type: ColorType.Solid, color: 'transparent' },
    fontSize: 12,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  grid: {
    vertLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
    horzLines: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
  },
  rightPriceScale: {
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    textColor: isDark ? '#9ca3af' : '#6b7280',
    scaleMargins: { top: 0.1, bottom: 0.1 },
  },
  timeScale: {
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    timeVisible: true,
    secondsVisible: false,
    textColor: isDark ? '#9ca3af' : '#6b7280',
    tickMarkFormatter: (time) => {
      // Formatação personalizada para HH:mm (intraday) e dd/MM (diário)
    }
  },
  crosshair: { mode: 1 },
  handleScroll: { mouseWheel: true, pressedMouseMove: true },
  handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
});
```

### 6. Renderização de Linhas Personalizadas v5.0.9
```typescript
// Padrão para linhas de liquidação com API v5.0.9
if (liquidationLines && liquidationLines.length > 0) {
  try {
    liquidationSeriesRef.current = chart.addSeries(LineSeries, {
      color: '#ff6b6b',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
    });
    console.log('✅ LIQUIDATION SERIES - Série criada com API v5.0.9');
  } catch (error) {
    console.error('❌ LIQUIDATION SERIES - Erro ao criar série:', error);
  }
}

// Padrão para linhas de Take Profit com API v5.0.9
if (takeProfitLines && takeProfitLines.length > 0) {
  try {
    takeProfitSeriesRef.current = chart.addSeries(LineSeries, {
      color: '#51cf66',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
    });
    console.log('✅ TAKE PROFIT SERIES - Série criada com API v5.0.9');
  } catch (error) {
    console.error('❌ TAKE PROFIT SERIES - Erro ao criar série:', error);
  }
}
```

### 7. Cleanup com API v5.0.9
```typescript
// ✅ v5.0.9 - Cleanup otimizado com panes nativos
return () => {
  console.log('🧹 CHART CLEANUP - Limpando gráfico com API v5.0.9');
  setChartReady(false);
  
  try {
    // Remover todas as séries - API v5.0.9
    if (mainSeriesRef.current) {
      chart.removeSeries(mainSeriesRef.current);
      mainSeriesRef.current = null;
    }
    
    if (liquidationSeriesRef.current) {
      chart.removeSeries(liquidationSeriesRef.current);
      liquidationSeriesRef.current = null;
    }
    
    if (takeProfitSeriesRef.current) {
      chart.removeSeries(takeProfitSeriesRef.current);
      takeProfitSeriesRef.current = null;
    }
    
    if (rsiSeriesRef.current) {
      chart.removeSeries(rsiSeriesRef.current);
      rsiSeriesRef.current = null;
    }
    
    // Remover pane RSI - API v5.0.9
    if (rsiPaneRef.current) {
      chart.removePane(rsiPaneRef.current);
      rsiPaneRef.current = null;
    }
    
    // Remover chart - API v5.0.9
    chart.remove();
    chartRef.current = null;
    
    console.log('✅ CHART CLEANUP - Chart removido com sucesso usando API v5.0.9');
  } catch (error) {
    console.error('❌ CHART CLEANUP - Erro ao remover chart:', error);
  }
};
```

## 🎨 Padrões Visuais

### Cores Padrão
- **Liquidação**: `#ff4444` (vermelho)
- **Take Profit**: `#22c55e` (verde)
- **Stop Loss**: `#f59e0b` (laranja) - futuro
- **Entrada**: `#3b82f6` (azul) - futuro
- **RSI**: `#8b5cf6` (roxo)
- **Indicadores**: Cores específicas por tipo

### Estilos de Linha
- **Espessura**: 2px para séries principais, 1px para linhas auxiliares
- **Estilo**: `LineStyle.Solid` para séries, `LineStyle.Dashed` para linhas auxiliares
- **Visibilidade do eixo**: `axisLabelVisible: true`
- **Título**: Label personalizado

### Tema Adaptativo
- **Fundo**: Transparente
- **Texto**: Adapta automaticamente (dark/light)
- **Grid**: Opacidade baixa para não interferir
- **Bordas**: Opacidade baixa para sutileza

## 📊 Padrões de Dados

### Hook useCandleData
```typescript
const { 
  candleData: apiCandleData, 
  isLoading: candleLoading, 
  error: candleError,
  refetch: refetchCandles
} = useCandleData({
  symbol: symbol.replace('BINANCE:', ''),
  timeframe: currentTimeframe,
  limit: 500,
  enabled: useApiData
});
```

### Hook useIndicators
```typescript
const { indicators, addIndicator, removeIndicator, toggleIndicator } = useIndicators();
```

### Dados de Posições
```typescript
// Padrão para cálculo de linhas no Dashboard
const liquidationLines = useMemo(() => {
  // Extrair posições de múltiplas fontes
  // Filtrar valores válidos
  // Retornar array formatado
}, [optimizedPositions, marketData]);

const takeProfitLines = useMemo(() => {
  // Extrair posições com takeprofit válido
  // Formatar labels informativos
  // Retornar array com cores padrão
}, [optimizedPositions, marketData]);
```

## 🔧 Padrões de Integração

### Uso no Dashboard
```typescript
<LightweightLiquidationChart
  symbol="BINANCE:BTCUSDT"
  height={400}
  liquidationLines={liquidationLines}
  takeProfitLines={takeProfitLines}
  className="w-full"
  showToolbar={true}
  displaySymbol="XBTUSD"
  symbolDescription="BTCUSD: LNM FUTURES"
  logoUrl="/lnm-logo.svg"
  useApiData={true}
  onTimeframeChange={(tf) => {
    console.log('Timeframe changed to:', tf);
  }}
  onIndicatorAdd={(indicator) => {
    console.log('Indicator added:', indicator);
  }}
/>
```

### Estados de Loading
```typescript
// Loading indicator na toolbar
{useApiData && candleLoading && (
  <div className="flex items-center gap-2 text-xs text-blue-500">
    <Loader2 className="h-3 w-3 animate-spin" />
    <span>Loading {currentTimeframe} data...</span>
  </div>
)}

// Error indicator
{useApiData && candleError && (
  <div className="flex items-center gap-2 text-xs text-red-500">
    <span>Error loading data</span>
  </div>
)}
```

## 📚 Padrões de Documentação

### Estrutura de Arquivos
- **Componente**: `frontend/src/components/charts/LightweightLiquidationChart.tsx`
- **Hooks**: `frontend/src/hooks/useCandleData.ts`, `frontend/src/hooks/useIndicators.ts`
- **Documentação**: `.system/docs/tradingview/lightweight-charts-padrao.md`
- **Linhas**: `.system/docs/tradingview/linhas-customizadas.md`

### Logs Padrão v5.0.9
```typescript
console.log('📊 DASHBOARD - liquidationLines calculadas:', {
  positionsCount: src?.length ?? 0,
  sample: Array.isArray(src) ? src.slice(0, 3) : src,
  fromOptimized: Array.isArray(optimizedPositions) ? optimizedPositions.length : 'n/a',
  fromMarketDataKeys: marketData ? Object.keys(marketData as any) : 'n/a',
  lines
});

console.log('✅ MAIN SERIES - Candlestick series criada com API v5.0.9');
console.log('🚀 RSI SERIES - Séries RSI criadas com API v5.0.9 e pane nativo');
```

## 🚀 Roadmap de Extensões

### Próximas Implementações
- [x] **Migração para v5.0.9**: Concluída
- [x] **Panes nativos para RSI**: Concluída
- [x] **API unificada addSeries()**: Concluída
- [ ] **Stop Loss**: Linhas laranjas (`#f59e0b`)
- [ ] **Entrada**: Linhas azuis (`#3b82f6`)
- [ ] **Marcações de PnL**: Linhas pontilhadas
- [ ] **Suporte/Resistência**: Linhas cinza
- [ ] **Alertas visuais**: Pulsação, animação
- [ ] **Agrupamento**: Colapso de linhas por ativo
- [ ] **Tooltips**: Metadados detalhados

### Padrões para Novas Linhas v5.0.9
1. **Usar `chart.addSeries(LineSeries, {...})`** para novas séries
2. **Cor única** por tipo de linha
3. **Label informativo** com contexto
4. **Validação** de valores numéricos
5. **Panes nativos** para separação de escalas
6. **Cleanup** adequado com `chart.removeSeries()` e `chart.removePane()`

## ✅ Checklist de Implementação v5.0.9

### Para Novas Funcionalidades
- [ ] Seguir padrão de props definido
- [ ] Usar API v5.0.9 (`addSeries()` unificado)
- [ ] Implementar validação de dados
- [ ] Adicionar logs de debugging
- [ ] Atualizar documentação
- [ ] Testar com dados reais
- [ ] Verificar responsividade
- [ ] Validar tema dark/light
- [ ] Commit com Conventional Commits

### Para Novas Linhas
- [ ] Usar `chart.addSeries(LineSeries, {...})`
- [ ] Definir cor padrão única
- [ ] Criar label informativo
- [ ] Implementar renderização
- [ ] Adicionar ao auto-range
- [ ] Documentar na API
- [ ] Atualizar roadmap
- [ ] Testar com múltiplas linhas

### Para Novos Indicadores
- [ ] Usar panes nativos (`chart.addPane()`)
- [ ] Configurar `paneIndex` nas séries
- [ ] Implementar controle de visibilidade (`setHeight()`)
- [ ] Adicionar cleanup com `chart.removePane()`

---

**Versão**: 2.0  
**Data**: 2025-10-03  
**Status**: Padrão Oficial v5.0.9  
**Última Atualização**: Migração completa para lightweight-charts v5.0.9
