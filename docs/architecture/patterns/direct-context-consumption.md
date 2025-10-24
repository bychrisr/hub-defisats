---
title: "Direct Context Consumption Pattern"
version: "2.1.0"
created: "2025-10-24"
updated: "2025-10-24"
author: "Documentation Agent"
status: "active"
tags: ["architecture", "patterns", "react", "context", "performance", "simplification"]
---

# Direct Context Consumption Pattern

## Visão Geral

O **Padrão de Consumo Direto de Context** é uma abordagem arquitetural que prioriza simplicidade e consistência ao consumir dados de React Contexts. Este padrão foi adotado após identificar problemas de over-engineering em componentes que implementavam sistemas complexos de cache, debounce e múltiplas fontes de dados.

## Motivação

### Problemas Identificados

1. **Over-engineering Desnecessário**
   - Sistemas complexos de cache/debounce onde não eram necessários
   - Múltiplas fontes de dados causando inconsistências
   - Re-rendering issues por memoização excessiva

2. **Inconsistência entre Componentes**
   - Dashboard, Title e Header mostrando valores diferentes
   - Diferentes padrões de consumo de dados
   - Falta de sincronização automática

3. **Complexidade de Manutenção**
   - Código difícil de entender e debugar
   - Múltiplos pontos de falha
   - Debugging complexo com logs extensivos

### Solução: Consumo Direto

```typescript
// ❌ Sistema complexo (evitado)
const { data: realtimeData } = useUserPositions();
const { data: positionsData } = usePositionsMetrics();
const debouncedValue = useDebouncedHeader(value);
const memoizedData = useMemo(() => {
  // Cálculos complexos...
}, [dependencies]);

// ✅ Consumo direto (preferido)
const { totalPL, totalMargin, totalFees } = usePositionsMetrics();
```

## Quando Usar

### ✅ Casos Ideais

1. **Componentes que precisam de dados em tempo real**
   - Dashboard cards
   - Dynamic page title
   - Header com métricas

2. **Quando não há necessidade de transformação complexa**
   - Dados já processados pelo Context
   - Valores simples (números, strings)
   - Sem cálculos pesados

3. **Para garantir sincronização entre componentes**
   - Múltiplos componentes mostrando mesma informação
   - Necessidade de consistência visual
   - Dados críticos para UX

### ❌ Quando NÃO Usar

1. **Quando há necessidade de debounce para UX**
   - Inputs de usuário
   - Busca em tempo real
   - Filtros interativos

2. **Transformações complexas que custam performance**
   - Cálculos pesados com arrays grandes
   - Processamento de dados complexos
   - Operações que podem ser otimizadas

3. **Quando há necessidade de cache específico**
   - Dados que mudam raramente
   - Informações que podem ser cacheadas localmente
   - Fallbacks para dados offline

## Exemplos de Uso

### Dashboard Cards

```typescript
// frontend/src/pages/Dashboard.tsx
const positionsMetrics = usePositionsMetrics();

const contextTotalPL = positionsMetrics.totalPL || 0;
const contextTotalMargin = positionsMetrics.totalMargin || 0;
const contextTotalFees = positionsMetrics.totalFees || 0;

// Render direto sem transformações
<MetricCard
  title="Total P&L"
  value={formatSats(contextTotalPL)}
  variant={contextTotalPL >= 0 ? 'success' : 'danger'}
/>
```

### Dynamic Page Title

```typescript
// frontend/src/hooks/usePageTitle.ts
export const useTotalPL = () => {
  const { totalPL } = usePositionsMetrics();
  return totalPL || 0;
};

// Uso no componente
const totalPL = useTotalPL();
document.title = `Axisor - P&L: ${formatSats(totalPL)}`;
```

### Header (LNMarketsHeader)

```typescript
// frontend/src/components/layout/LNMarketsHeader.tsx
const { 
  totalFees,
  totalTradingFees,
  totalFundingCost,
  lastUpdate
} = usePositionsMetrics();

// Cálculo direto no render
const marketData = isAuthenticated && totalFees !== undefined ? {
  tradingFees: totalFees, // direto, sem cache/debounce
  nextFunding: publicData?.nextFunding || 'N/A',
  rate: publicData?.rate || 0,
  lastUpdate: new Date(lastUpdate),
  source: 'lnmarkets'
} : publicData;
```

## Anti-padrões Evitados

### 1. Cache/Debounce Desnecessário

```typescript
// ❌ Anti-padrão: Debounce desnecessário
const debouncedTradingFees = useDebouncedHeader(tradingFees);

// ✅ Padrão correto: Consumo direto
const { totalFees } = usePositionsMetrics();
```

### 2. Multiple Sources of Truth

```typescript
// ❌ Anti-padrão: Múltiplas fontes
const { data: realtimeData } = useUserPositions();
const { data: positionsData } = usePositionsMetrics();
const { data: marketData } = useMarketData();

// ✅ Padrão correto: Fonte única
const { totalFees } = usePositionsMetrics();
```

### 3. Memoização Excessiva

```typescript
// ❌ Anti-padrão: useMemo desnecessário
const memoizedData = useMemo(() => {
  return {
    tradingFees: totalFees,
    lastUpdate: new Date(lastUpdate)
  };
}, [totalFees, lastUpdate]);

// ✅ Padrão correto: Cálculo direto
const marketData = {
  tradingFees: totalFees,
  lastUpdate: new Date(lastUpdate)
};
```

### 4. Re-rendering Prevention Excessivo

```typescript
// ❌ Anti-padrão: useRef problemático
const prevData = useRef(marketData);
if (prevData.current !== marketData) {
  // Lógica complexa...
}

// ✅ Padrão correto: Deixar React gerenciar
// React otimiza automaticamente quando necessário
```

## Benefícios

### 1. Simplicidade
- Código mais legível e direto
- Menos pontos de falha
- Debugging facilitado

### 2. Consistência
- Single Source of Truth
- Sincronização automática
- Valores consistentes entre componentes

### 3. Performance
- Eliminação de re-renders desnecessários
- Menos overhead de cache/debounce
- Otimizações automáticas do React

### 4. Manutenibilidade
- Padrão consistente entre componentes
- Menos complexidade arquitetural
- Facilita futuras mudanças

## Implementação

### Estrutura Básica

```typescript
// 1. Import do hook do Context
import { usePositionsMetrics } from '@/contexts/PositionsContext';

// 2. Consumo direto no componente
const Component = () => {
  const { totalPL, totalMargin, totalFees } = usePositionsMetrics();
  
  // 3. Uso direto no render
  return (
    <div>
      <span>P&L: {formatSats(totalPL)}</span>
      <span>Margin: {formatSats(totalMargin)}</span>
      <span>Fees: {formatSats(totalFees)}</span>
    </div>
  );
};
```

### Tratamento de Estados

```typescript
const Component = () => {
  const { totalPL, totalMargin, totalFees, lastUpdate } = usePositionsMetrics();
  
  // Valores padrão para evitar undefined
  const safeTotalPL = totalPL || 0;
  const safeTotalMargin = totalMargin || 0;
  const safeTotalFees = totalFees || 0;
  
  return (
    <div>
      <MetricCard value={formatSats(safeTotalPL)} />
      <MetricCard value={formatSats(safeTotalMargin)} />
      <MetricCard value={formatSats(safeTotalFees)} />
    </div>
  );
};
```

### Fallbacks

```typescript
const Component = () => {
  const { totalFees } = usePositionsMetrics();
  const { data: publicData } = usePublicMarketData(); // fallback
  
  // Lógica de fallback
  const displayFees = totalFees !== undefined ? totalFees : publicData?.tradingFees || 0;
  
  return <span>{formatTradingFees(displayFees)}</span>;
};
```

## Comparação: Antes vs Depois

### Antes (Sistema Complexo)

```typescript
// ❌ Múltiplas fontes + cache + debounce
const { data: realtimeData } = useUserPositions();
const { data: positionsData } = usePositionsMetrics();
const debouncedTradingFees = useDebouncedHeader(tradingFees);
const memoizedMarketData = useMemo(() => {
  // Cálculos complexos com múltiplas dependências
  return {
    tradingFees: debouncedTradingFees,
    lastUpdate: new Date(lastUpdate),
    source: 'hybrid'
  };
}, [realtimeData, positionsData, debouncedTradingFees, forceUpdate]);

// Re-rendering issues
const prevMarketData = useRef(marketData);
```

### Depois (Consumo Direto)

```typescript
// ✅ Fonte única + consumo direto
const { totalFees, lastUpdate } = usePositionsMetrics();
const { data: publicData } = usePublicMarketData();

// Cálculo direto no render
const marketData = isAuthenticated && totalFees !== undefined ? {
  tradingFees: totalFees, // direto, sem cache/debounce
  lastUpdate: new Date(lastUpdate),
  source: 'lnmarkets'
} : publicData;
```

## Troubleshooting

### Problemas Comuns

1. **Componente não atualiza**
   - Verificar se está usando o hook correto
   - Confirmar que o Context está ativo
   - Validar dependências do useEffect

2. **Valores undefined**
   - Adicionar valores padrão (`|| 0`)
   - Verificar se o Context retorna dados
   - Confirmar que não há erro no backend

3. **Performance degradada**
   - Verificar se não há polling duplicado
   - Confirmar que não há re-renders excessivos
   - Analisar se o Context está otimizado

### Debugging

```typescript
// Logs simples para debugging
const { totalPL, totalMargin, totalFees } = usePositionsMetrics();

if (import.meta.env.DEV) {
  console.log('Component data:', { totalPL, totalMargin, totalFees });
}
```

## Migração

### Passos para Migrar

1. **Identificar fontes de dados**
   - Listar todos os hooks/contexts usados
   - Identificar redundâncias
   - Mapear dependências

2. **Simplificar consumo**
   - Remover cache/debounce desnecessário
   - Eliminar múltiplas fontes
   - Usar consumo direto

3. **Testar consistência**
   - Verificar se valores são consistentes
   - Confirmar que atualizações funcionam
   - Validar performance

4. **Limpar código**
   - Remover hooks não utilizados
   - Eliminar logs de debug extensivos
   - Simplificar lógica

### Exemplo de Migração

```typescript
// ANTES: Sistema complexo
const { data: realtimeData } = useUserPositions();
const { data: positionsData } = usePositionsMetrics();
const debouncedValue = useDebouncedHeader(value);
const memoizedData = useMemo(() => {
  // Lógica complexa...
}, [dependencies]);

// DEPOIS: Consumo direto
const { totalFees, totalMargin } = usePositionsMetrics();
// Uso direto no render
```

## Referências

- [React Context API](https://react.dev/reference/react/createContext)
- [Custom Hooks Pattern](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Frontend State Management](../data-architecture/frontend-state-management.md)
- [Dashboard Implementation](../components/dashboard-implementation.md)
- [Header Implementation](../components/header-implementation.md)
- [Dashboard State Refactoring](../../migrations/code-migrations/dashboard-state-refactoring.md)
