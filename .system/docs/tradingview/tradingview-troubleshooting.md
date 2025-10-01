# TradingView Chart - Guia de Solução de Problemas

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
