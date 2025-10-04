# 🚨 Diretrizes Críticas - Lightweight Charts

## ⚠️ **ATENÇÃO: LEIA ANTES DE IMPLEMENTAR**

Este documento contém diretrizes **CRÍTICAS** para implementação de gráficos Lightweight Charts. **NÃO IGNORE** estas diretrizes sob pena de causar bugs graves na aplicação.

---

## 🐛 **Problemas Críticos Resolvidos (v2.3.13)**

### **Problema 1: Gráfico Vazio na Inicialização**
- **Sintoma**: Gráfico aparece vazio quando a página carrega
- **Causa**: Gráfico criado antes dos dados chegarem
- **Impacto**: UX ruim, usuário vê tela vazia

### **Problema 2: Reset ao Mudar Timeframe**
- **Sintoma**: Gráfico "volta" ou reseta ao mudar timeframe
- **Causa**: Recriação desnecessária do gráfico
- **Impacto**: Perda de contexto visual, UX ruim

### **Problema 3: Estados de Carregamento Inadequados**
- **Sintoma**: Usuário não sabe se está carregando
- **Causa**: Falta de feedback visual
- **Impacto**: Confusão do usuário

---

## ✅ **IMPLEMENTAÇÃO OBRIGATÓRIA**

### **1. Validação de Dados ANTES da Criação**

```typescript
// ✅ OBRIGATÓRIO: Sempre validar dados antes de criar gráfico
const hasValidData = useMemo(() => {
  // Verificar se existem dados
  if (!effectiveCandleData || effectiveCandleData.length === 0) {
    return false;
  }
  
  // Verificar estrutura do primeiro ponto
  const firstDataPoint = effectiveCandleData[0];
  if (!firstDataPoint || !firstDataPoint.time) {
    return false;
  }
  
  // Validação específica para candlesticks
  if ('open' in firstDataPoint) {
    return firstDataPoint.open !== undefined && 
           firstDataPoint.high !== undefined && 
           firstDataPoint.low !== undefined && 
           firstDataPoint.close !== undefined;
  }
  
  // Validação para dados de linha
  if ('value' in firstDataPoint) {
    return firstDataPoint.value !== undefined;
  }
  
  return true;
}, [effectiveCandleData]);
```

### **2. Estado de Prontidão OBRIGATÓRIO**

```typescript
// ✅ OBRIGATÓRIO: Aguardar dados antes de criar gráfico
const isChartReady = useMemo(() => {
  if (useApiData) {
    // Para dados da API: aguardar carregamento completo
    return !historicalLoading && !historicalError && hasValidData;
  } else {
    // Para dados estáticos: verificar se existem
    return hasValidData;
  }
}, [useApiData, historicalLoading, historicalError, hasValidData]);
```

### **3. Criação Condicional do Gráfico**

```typescript
// ✅ OBRIGATÓRIO: Só criar gráfico quando dados estão prontos
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

### **4. Mudança de Timeframe SEM Recriação**

```typescript
// ✅ OBRIGATÓRIO: NUNCA recriar gráfico ao mudar timeframe
const handleTimeframeChange = (newTimeframe: string) => {
  // Apenas atualizar estado - dados serão buscados automaticamente
  setCurrentTimeframe(newTimeframe);
  
  // Gráfico será atualizado via useEffect que monitora effectiveCandleData
  // NÃO recriar o gráfico!
};
```

### **5. Estados de Carregamento Visuais**

```typescript
// ✅ OBRIGATÓRIO: Feedback visual claro para o usuário
{(historicalLoading || !isChartReady) && (
  <div className="chart-loading">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      {historicalLoading ? 'Loading chart data...' : 'Preparing chart...'}
    </div>
  </div>
)}
```

---

## 🚫 **ANTI-PADRÕES PROIBIDOS**

### **❌ PROIBIDO: Criar Gráfico Sem Dados**

```typescript
// ❌ NUNCA FAÇA ISSO:
useEffect(() => {
  const chart = createChart(containerRef.current, options); // SEM VALIDAÇÃO!
}, []);
```

### **❌ PROIBIDO: Recriar Gráfico ao Mudar Timeframe**

```typescript
// ❌ NUNCA FAÇA ISSO:
const handleTimeframeChange = (newTimeframe: string) => {
  setCurrentTimeframe(newTimeframe);
  // ❌ NUNCA recriar o gráfico:
  chart.remove();
  chart = createChart(...);
};
```

### **❌ PROIBIDO: Validação Insuficiente**

```typescript
// ❌ NUNCA FAÇA ISSO:
if (data) { // Validação muito simples
  chart.setData(data);
}
```

---

## 📋 **Checklist de Implementação**

Antes de implementar qualquer gráfico Lightweight Charts, verifique:

- [ ] ✅ **Validação de Dados**: Implementei `hasValidData` com validação rigorosa?
- [ ] ✅ **Estado de Prontidão**: Implementei `isChartReady` que aguarda dados?
- [ ] ✅ **Criação Condicional**: Gráfico só é criado quando `isChartReady` é true?
- [ ] ✅ **Timeframe Change**: Mudança de timeframe NÃO recria o gráfico?
- [ ] ✅ **Loading States**: Implementei feedback visual de carregamento?
- [ ] ✅ **Error Handling**: Trato erros de carregamento adequadamente?
- [ ] ✅ **Data Structure**: Valido estrutura específica (candlestick/line)?
- [ ] ✅ **User Feedback**: Usuário sabe o status do carregamento?

---

## 🔧 **Troubleshooting Rápido**

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| Gráfico vazio na inicialização | Dados não carregaram | Implementar `isChartReady` |
| Reset ao mudar timeframe | Recriação do gráfico | Usar `setData()` em vez de recriar |
| Loading infinito | Dados inválidos | Validar estrutura dos dados |
| Erro de renderização | Dados malformados | Verificar `open, high, low, close` |
| Gráfico não aparece | Container não existe | Verificar `containerRef.current` |
| Performance ruim | Recriações desnecessárias | Usar `useMemo` e `useCallback` |

---

## 📚 **Referências**

- **Guia Principal**: `.system/docs/tradingview/lightweight-charts-guia.md`
- **Implementação Atual**: `frontend/src/components/charts/LightweightLiquidationChart.tsx`
- **Versão**: v2.3.13 (Correções críticas implementadas)
- **Data**: 2025-01-26

---

## ⚠️ **LEMBRE-SE**

**NUNCA** implemente gráficos Lightweight Charts sem seguir estas diretrizes. Os problemas são críticos e afetam diretamente a experiência do usuário.

**SEMPRE** valide dados antes de criar gráficos.
**SEMPRE** implemente estados de carregamento.
**NUNCA** recrie gráficos ao mudar timeframe.

---

**Última Atualização**: 2025-01-26  
**Responsável**: Equipe de Desenvolvimento  
**Status**: ✅ Ativo e Obrigatório
