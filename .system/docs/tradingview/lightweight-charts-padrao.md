# Padrão de Gráfico Lightweight Charts - Hub DeFiSats

Este documento define o padrão oficial do componente `LightweightLiquidationChart` para futuras implementações no projeto Hub DeFiSats.

## 📋 Visão Geral

O `LightweightLiquidationChart` é o componente padrão para visualização de dados financeiros com linhas personalizadas, indicadores técnicos e dados em tempo real.

## 🏗️ Arquitetura Padrão

### Componente Principal
- **Arquivo**: `frontend/src/components/charts/LightweightLiquidationChart.tsx`
- **Biblioteca**: `lightweight-charts`
- **Tema**: Transparente com adaptação automática (dark/light)

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

## 🎯 Padrões de Implementação

### 1. Toolbar TradingView-style
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

### 2. Configuração do Gráfico
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

### 3. Renderização de Linhas Personalizadas
```typescript
// Padrão para linhas de liquidação
for (const [idx, ln] of liquidationLinesData.entries()) {
  const price = Number(ln.price);
  if (!Number.isFinite(price) || price <= 0) continue;
  
  const color = ln.color || '#ff4444';
  const label = ln.label || `Liquidação${liquidationLinesData.length > 1 ? ` #${idx+1}` : ''}: $${price.toLocaleString()}`;
  
  const pl = series?.createPriceLine({
    price,
    color,
    lineStyle: LineStyle.Solid,
    lineWidth: 2,
    axisLabelVisible: true,
    title: label,
  });
  if (pl) createdLines.push(pl);
}

// Padrão para linhas de Take Profit
for (const [idx, tp] of takeProfitLinesData.entries()) {
  const price = Number(tp.price);
  if (!Number.isFinite(price) || price <= 0) continue;
  
  const color = tp.color || '#22c55e';
  const label = tp.label || `Take Profit #${idx+1}: $${price.toLocaleString()}`;
  
  const pl = series?.createPriceLine({
    price,
    color,
    lineStyle: LineStyle.Solid,
    lineWidth: 2,
    axisLabelVisible: true,
    title: label,
  });
  if (pl) createdLines.push(pl);
}
```

### 4. Auto-range Inteligente
```typescript
// Auto-range para incluir todas as priceLines
try {
  const allPrices = [
    ...liquidationLinesData.map(l => l.price),
    ...takeProfitLinesData.map(tp => tp.price)
  ];
  if (allPrices.length > 0) {
    const min = Math.min(...allPrices);
    const max = Math.max(...allPrices);
    if (Number.isFinite(min) && Number.isFinite(max) && min < max) {
      chart.priceScale('right').setVisibleLogicalRange({ from: min, to: max } as any);
    }
  }
} catch {}
```

## 🎨 Padrões Visuais

### Cores Padrão
- **Liquidação**: `#ff4444` (vermelho)
- **Take Profit**: `#22c55e` (verde)
- **Stop Loss**: `#f59e0b` (laranja) - futuro
- **Entrada**: `#3b82f6` (azul) - futuro
- **Indicadores**: Cores específicas por tipo

### Estilos de Linha
- **Espessura**: 2px
- **Estilo**: `LineStyle.Solid`
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

### Logs Padrão
```typescript
console.log('📊 DASHBOARD - liquidationLines calculadas:', {
  positionsCount: src?.length ?? 0,
  sample: Array.isArray(src) ? src.slice(0, 3) : src,
  fromOptimized: Array.isArray(optimizedPositions) ? optimizedPositions.length : 'n/a',
  fromMarketDataKeys: marketData ? Object.keys(marketData as any) : 'n/a',
  lines
});
```

## 🚀 Roadmap de Extensões

### Próximas Implementações
- [ ] **Stop Loss**: Linhas laranjas (`#f59e0b`)
- [ ] **Entrada**: Linhas azuis (`#3b82f6`)
- [ ] **Marcações de PnL**: Linhas pontilhadas
- [ ] **Suporte/Resistência**: Linhas cinza
- [ ] **Alertas visuais**: Pulsação, animação
- [ ] **Agrupamento**: Colapso de linhas por ativo
- [ ] **Tooltips**: Metadados detalhados

### Padrões para Novas Linhas
1. **Cor única** por tipo de linha
2. **Label informativo** com contexto
3. **Validação** de valores numéricos
4. **Auto-range** incluindo todas as linhas
5. **Cleanup** adequado no useEffect

## ✅ Checklist de Implementação

### Para Novas Funcionalidades
- [ ] Seguir padrão de props definido
- [ ] Implementar validação de dados
- [ ] Adicionar logs de debugging
- [ ] Atualizar documentação
- [ ] Testar com dados reais
- [ ] Verificar responsividade
- [ ] Validar tema dark/light
- [ ] Commit com Conventional Commits

### Para Novas Linhas
- [ ] Definir cor padrão única
- [ ] Criar label informativo
- [ ] Implementar renderização
- [ ] Adicionar ao auto-range
- [ ] Documentar na API
- [ ] Atualizar roadmap
- [ ] Testar com múltiplas linhas

---

**Versão**: 1.0  
**Data**: 2025-01-09  
**Status**: Padrão Oficial  
**Última Atualização**: Implementação de Take Profit (v2.3.9)
