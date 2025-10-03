# TradingView Chart - Guia de Solução de Problemas v5.0.9

## 🚨 **ERROS COMUNS E SOLUÇÕES**

### **🔧 PROBLEMAS ESPECÍFICOS DA v5.0.9**

#### 1. **Erro: "LineSeries is not exported from lightweight-charts"**

**Causa**: Versão incorreta da biblioteca instalada
**Soluções**:
```bash
# ✅ SOLUÇÃO 1: Verificar versão instalada
npm ls lightweight-charts

# ✅ SOLUÇÃO 2: Forçar instalação da v5.0.9
npm install lightweight-charts@5.0.9 --save --force

# ✅ SOLUÇÃO 3: Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
npm install lightweight-charts@5.0.9 --save --force
```

#### 2. **Erro: "chart.addSeries is not a function"**

**Causa**: Usando API v4.2.3 com código v5.0.9
**Soluções**:
```typescript
// ❌ ERRO: API v4.2.3
const series = chart.addCandlestickSeries({...});

// ✅ CORREÇÃO: API v5.0.9
import { CandlestickSeries } from 'lightweight-charts';
const series = chart.addSeries(CandlestickSeries, {...});
```

#### 3. **Erro: "chart.addPane is not a function"**

**Causa**: Tentando usar panes nativos com versão incorreta
**Soluções**:
```typescript
// ❌ ERRO: Panes não disponíveis na v4.2.3
const pane = chart.addPane();

// ✅ CORREÇÃO: Verificar versão e usar API correta
if (typeof chart.addPane === 'function') {
  const pane = chart.addPane();
} else {
  // Fallback para v4.2.3
  const series = chart.addLineSeries({ priceScaleId: 'rsi' });
}
```

#### 4. **Erro: "Type 'number' is not assignable to type 'Time'"**

**Causa**: Type assertions desnecessários na v5.0.9
**Soluções**:
```typescript
// ❌ ERRO: Type assertion desnecessário
const data = [{ time: Date.now() as Time, value: 100 }];

// ✅ CORREÇÃO: Remover type assertion
const data = [{ time: Date.now(), value: 100 }];
```

#### 5. **Erro: "Cannot read property 'index' of undefined"**

**Causa**: Tentando usar `pane.index()` antes de criar o pane
**Soluções**:
```typescript
// ❌ ERRO: Usar index antes de criar
const series = chart.addSeries(LineSeries, {
  paneIndex: pane.index() // ERRO!
});

// ✅ CORREÇÃO: Criar pane primeiro
const pane = chart.addPane();
const series = chart.addSeries(LineSeries, {
  paneIndex: pane.index() // OK!
});
```

#### 6. **Erro: "chart.removePane is not a function"**

**Causa**: Tentando usar cleanup da v5.0.9 com versão incorreta
**Soluções**:
```typescript
// ✅ CORREÇÃO: Cleanup compatível
return () => {
  try {
    // Remover séries
    if (seriesRef.current) {
      chart.removeSeries(seriesRef.current);
    }
    
    // Remover pane (apenas se disponível)
    if (paneRef.current && typeof chart.removePane === 'function') {
      chart.removePane(paneRef.current);
    }
    
    // Remover chart
    chart.remove();
  } catch (error) {
    console.error('Cleanup error:', error);
  }
};
```

## 🚨 **ERROS COMUNS E SOLUÇÕES**

### 1. **Erro: "Erro ao carregar script TradingView"**

**Causa**: Script não consegue carregar da URL
**Soluções**:
```typescript
// ✅ SOLUÇÃO 1: Verificar URL
script.src = 'https://s3.tradingview.com/tv.js'; // URL principal
script.src = 'https://static.tradingview.com/tv.js'; // URL alternativa
script.src = 'https://cdn.tradingview.com/tv.js'; // URL alternativa

// ✅ SOLUÇÃO 2: Adicionar timeout
setTimeout(() => {
  if (!window.TradingView) {
    setError('Timeout ao carregar script TradingView');
  }
}, 10000);

// ✅ SOLUÇÃO 3: Verificar conectividade
script.onerror = (error) => {
  console.error('Script load error:', error);
  // Tentar próxima URL
};
```

### 2. **Erro: "Erro ao inicializar widget TradingView"**

**Causa**: `window.TradingView.widget` não está disponível
**Soluções**:
```typescript
// ✅ SOLUÇÃO 1: Verificar se TradingView existe
if (!window.TradingView) {
  setError('TradingView não carregado');
  return;
}

// ✅ SOLUÇÃO 2: Verificar se widget existe
if (!window.TradingView.widget) {
  setError('TradingView.widget não disponível');
  return;
}

// ✅ SOLUÇÃO 3: Aguardar carregamento completo
script.onload = () => {
  // Aguardar um pouco mais
  setTimeout(() => {
    setIsScriptLoaded(true);
  }, 100);
};
```

### 3. **Erro: "Cannot access 'calculateFeesPaid' before initialization"**

**Causa**: Ordem de declaração incorreta
**Solução**:
```typescript
// ❌ ERRO: Usar antes de declarar
const calculateNetProfit = useCallback(() => {
  const feesPaid = calculateFeesPaid(); // ERRO!
  return totalPnl - feesPaid;
}, [totalPL, calculateFeesPaid]);

const calculateFeesPaid = useCallback(() => {
  return estimatedBalance.data?.total_fees || 0;
}, [estimatedBalance.data?.total_fees]);

// ✅ CORREÇÃO: Declarar antes de usar
const calculateFeesPaid = useCallback(() => {
  return estimatedBalance.data?.total_fees || 0;
}, [estimatedBalance.data?.total_fees]);

const calculateNetProfit = useCallback(() => {
  const feesPaid = calculateFeesPaid(); // OK!
  return totalPnl - feesPaid;
}, [totalPL, calculateFeesPaid]);
```

### 4. **Erro: Loop infinito de renderização**

**Causa**: Funções sendo recriadas a cada render
**Solução**:
```typescript
// ❌ ERRO: Função recriada a cada render
const calculateTotal = () => {
  return data.reduce((sum, item) => sum + item.value, 0);
};

// ✅ CORREÇÃO: Memoizar com useCallback
const calculateTotal = useCallback(() => {
  return data.reduce((sum, item) => sum + item.value, 0);
}, [data]);
```

### 5. **Erro: "Only a void function can be called with the 'new' keyword"**

**Causa**: TypeScript não reconhece `window.TradingView.widget` como construtor
**Solução**:
```typescript
// ❌ ERRO: TypeScript não reconhece como construtor
widgetRef.current = new window.TradingView.widget(config);

// ✅ CORREÇÃO: Type assertion
widgetRef.current = new (window.TradingView.widget as any)(config);
```

## 🔧 **IMPLEMENTAÇÃO UNITÁRIA**

### **Fase 1: Script Básico**
```typescript
// ✅ VERSÃO MÍNIMA FUNCIONAL
useEffect(() => {
  if (window.TradingView) {
    setIsScriptLoaded(true);
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/tv.js';
  script.async = true;
  script.onload = () => setIsScriptLoaded(true);
  script.onerror = () => setError('Erro ao carregar script');
  
  document.head.appendChild(script);
}, []);
```

### **Fase 2: Widget Básico**
```typescript
// ✅ WIDGET MÍNIMO
useEffect(() => {
  if (!isScriptLoaded || !containerRef.current || !window.TradingView) return;

  try {
    const containerId = `tradingview_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    if (!document.getElementById(containerId)) {
      const container = document.createElement('div');
      container.id = containerId;
      container.style.width = width;
      container.style.height = `${height}px`;
      containerRef.current.appendChild(container);
    }

    widgetRef.current = new (window.TradingView.widget as any)({
      container_id: containerId,
      width: width,
      height: height,
      symbol: symbol,
      interval: interval,
      theme: theme
    });

    widgetRef.current.onChartReady(() => {
      setIsLoading(false);
    });
  } catch (err) {
    setError('Erro ao inicializar widget TradingView');
    setIsLoading(false);
  }
}, [isScriptLoaded, symbol, interval, theme, height, width]);
```

### **Fase 3: Configurações Avançadas**
```typescript
// ✅ CONFIGURAÇÕES COMPLETAS
const widgetConfig = {
  container_id: containerId,
  width: width,
  height: height,
  symbol: symbol,
  interval: interval,
  timezone: 'Etc/UTC',
  theme: theme,
  style: '1',
  locale: 'en',
  toolbar_bg: theme === 'dark' ? '#1e1e1e' : '#f1f3f6',
  enable_publishing: false,
  allow_symbol_change: false,
  details: false,
  hotlist: false,
  calendar: false,
  hide_side_toolbar: true,
  hide_top_toolbar: false,
  hide_legend: false,
  studies: [],
  show_popup_button: true,
  popup_width: '1000',
  popup_height: '650'
};
```

### **Fase 4: Linhas Personalizadas**
```typescript
// ✅ ADICIONAR LINHAS (APÓS WIDGET FUNCIONAR)
const addLiquidationLine = (price: number) => {
  if (widgetRef.current && widgetRef.current.chart) {
    try {
      widgetRef.current.chart().createShape(
        { time: Date.now() / 1000, price: price },
        {
          shape: 'horizontal_line',
          text: `Liquidação: $${price.toLocaleString()}`,
          overrides: {
            linecolor: '#ff4444',
            linewidth: 2,
            linestyle: 1,
            textcolor: '#ffffff',
            fontSize: 10
          }
        }
      );
    } catch (error) {
      console.warn('Erro ao adicionar linha:', error);
    }
  }
};
```

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO**

### **✅ Fase 1: Script Básico**
- [ ] Script carrega sem erros
- [ ] `window.TradingView` existe após carregamento
- [ ] `window.TradingView.widget` está disponível

### **✅ Fase 2: Widget Básico**
- [ ] Container é criado corretamente
- [ ] Widget é inicializado sem erros
- [ ] `onChartReady` é chamado
- [ ] Gráfico aparece na tela

### **✅ Fase 3: Configurações**
- [ ] Tema aplicado corretamente
- [ ] Símbolo correto exibido
- [ ] Intervalo funcionando
- [ ] Toolbar configurada

### **✅ Fase 4: Linhas Personalizadas**
- [ ] Linhas de liquidação funcionando
- [ ] Marcadores de posições funcionando
- [ ] Cores e estilos corretos
- [ ] Textos legíveis

## 🎯 **ESTRATÉGIA DE DEBUGGING**

1. **Implementar fase por fase**
2. **Testar cada fase isoladamente**
3. **Adicionar logs apenas quando necessário**
4. **Manter versão estável como backup**
5. **Documentar cada mudança**

## 🔄 **PRÓXIMOS PASSOS**

1. **Voltar à versão estável** (sem linhas personalizadas)
2. **Testar funcionalidade básica**
3. **Implementar melhorias unitariamente**
4. **Adicionar linhas personalizadas gradualmente**
5. **Testar cada adição isoladamente**

## 🚀 **TROUBLESHOOTING ESPECÍFICO DA v5.0.9**

### **Verificação de Versão**
```bash
# Verificar versão instalada
npm ls lightweight-charts

# Verificar no container Docker
docker compose -f config/docker/docker-compose.dev.yml exec frontend npm ls lightweight-charts

# Verificar versão no runtime
node -e "console.log('Lightweight Charts version:', require('lightweight-charts/package.json').version)"
```

### **Migração de v4.2.3 para v5.0.9**
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

### **Panes Nativos v5.0.9**
```typescript
// ✅ Criar pane para RSI
const rsiPane = chart.addPane();
rsiPane.setHeight(100);

// ✅ Criar série no pane
const rsiSeries = chart.addSeries(LineSeries, {
  color: '#8b5cf6',
  paneIndex: rsiPane.index(),
  priceFormat: { type: 'percent' as const, precision: 2 }
});

// ✅ Controle de visibilidade
const toggleRSI = (visible: boolean) => {
  if (rsiPane) {
    rsiPane.setHeight(visible ? 100 : 0);
  }
};

// ✅ Cleanup
if (rsiPane) {
  chart.removePane(rsiPane);
}
```

### **Type Safety v5.0.9**
```typescript
// ❌ v4.2.3 - Type assertions necessários
const data = [{ time: Date.now() as Time, value: 100 }];
const series = chart.addCandlestickSeries({...}) as ISeriesApi;

// ✅ v5.0.9 - Type safety melhorado
const data = [{ time: Date.now(), value: 100 }];
const series = chart.addSeries(CandlestickSeries, {...});
```

### **Docker e Build v5.0.9**
```dockerfile
# Dockerfile.dev - Forçar instalação da v5.0.9
RUN npm ci && \
    npm install lightweight-charts@5.0.9 --save --force
```

### **Logs de Debugging v5.0.9**
```typescript
// ✅ Logs específicos da v5.0.9
console.log('✅ MAIN SERIES - Candlestick series criada com API v5.0.9');
console.log('🚀 RSI SERIES - Séries RSI criadas com API v5.0.9 e pane nativo');
console.log('🧹 CHART CLEANUP - Limpando gráfico com API v5.0.9');
console.log('✅ CHART CLEANUP - Chart removido com sucesso usando API v5.0.9');
```

### **Checklist de Migração v5.0.9**
- [ ] **Dependência**: `lightweight-charts@5.0.9` instalada
- [ ] **Importações**: `CandlestickSeries`, `LineSeries`, `HistogramSeries` importados
- [ ] **API**: `chart.addSeries()` substitui métodos específicos
- [ ] **Panes**: `chart.addPane()` para RSI e indicadores
- [ ] **Type assertions**: Removidos `as Time`, `as ISeriesApi`, etc.
- [ ] **Cleanup**: `chart.removePane()` adicionado
- [ ] **Compilação**: TypeScript sem erros
- [ ] **Build**: Compilação bem-sucedida
- [ ] **Runtime**: Gráficos funcionando corretamente

### **Fallback para v4.2.3**
```typescript
// ✅ Detecção de versão e fallback
const isV5 = typeof chart.addSeries === 'function';

if (isV5) {
  // API v5.0.9
  const series = chart.addSeries(CandlestickSeries, {...});
} else {
  // API v4.2.3
  const series = chart.addCandlestickSeries({...});
}
```
