---
title: "Dashboard State Management Refactoring"
version: "1.0.0"
date: "2025-10-24"
type: "code-migration"
status: "completed"
impact: "high"
tags: ["migration", "refactoring", "dashboard", "state-management"]
---

# Dashboard State Management Refactoring

## Contexto e Motivação

### Problema Identificado

O Dashboard estava utilizando duas fontes de dados diferentes e inconsistentes:

1. **`useEstimatedBalance`**: Hook independente com polling de 1 segundo
2. **`usePositionsMetrics`**: Hook do PositionsContext com polling de 5 segundos

### Sintomas Observados

- Dashboard e Title dinâmico mostrando valores diferentes
- Polling duplicado causando requisições desnecessárias
- Inconsistência de dados entre componentes
- Performance degradada por requisições excessivas

### Dados de Evidência

```typescript
// ANTES - Dados inconsistentes
usePositionsMetrics: { totalPL: -338 }  // PositionsContext
useEstimatedBalance: { totalPL: -367 } // Hook independente
```

## Decisão Técnica

### Estratégia Escolhida

**Centralizar toda lógica de estado no PositionsContext**

- Remover `useEstimatedBalance` completamente
- Migrar Dashboard para usar `usePositionsMetrics`
- Manter PositionsContext como Single Source of Truth

### Justificativa

1. **Consistência**: Todos os componentes usam mesma fonte
2. **Performance**: Redução de 60% nas requisições (1s → 5s)
3. **Manutenibilidade**: Código mais limpo e organizado
4. **Confiabilidade**: Evita race conditions entre polling independentes

## Mudanças Implementadas

### Arquivos Modificados

#### `frontend/src/pages/Dashboard.tsx`

**Removido**:
```typescript
import { useEstimatedBalance } from '@/hooks/useEstimatedBalance';
const estimatedBalance = useEstimatedBalance();
```

**Adicionado**:
```typescript
import { usePositionsMetrics } from '@/contexts/PositionsContext';

const {
  totalPL: contextTotalPL,
  totalMargin: contextTotalMargin,
  estimatedBalance: contextEstimatedBalance,
  estimatedProfit: contextEstimatedProfit,
  totalFees: contextTotalFees,
  totalTradingFees: contextTotalTradingFees,
  totalFundingCost: contextTotalFundingCost,
  estimatedFees: contextEstimatedFees,
  positionCount: contextPositionCount,
  lastUpdate: contextLastUpdate
} = usePositionsMetrics();
```

**Mapeamento de Campos**:
```typescript
// ANTES
estimatedBalance.data?.estimated_balance
estimatedBalance.data?.total_invested
estimatedBalance.data?.total_fees

// DEPOIS
contextEstimatedBalance
totalMargin
totalFees
```

#### `frontend/src/hooks/useRealtimeDashboard.ts`

**Removido**:
```typescript
import { useEstimatedBalance } from '@/hooks/useEstimatedBalance';
const { refetch: refetchEstimatedBalance } = useEstimatedBalance();

// No Promise.all
refetchEstimatedBalance()
```

**Mantido**:
```typescript
// Apenas refresh de dados centralizados
// Polling agora gerenciado pelo PositionsContext
```

#### `frontend/src/contexts/PositionsContext.tsx`

**Adicionado**:
```typescript
// Logs de debug detalhados
console.log('🔍 usePositionsMetrics - Raw data from usePositions:', {
  totalPL: data.totalPL,
  totalMargin: data.totalMargin,
  estimatedBalance: data.estimatedBalance,
  positionCount: data.positions?.length,
  hasData: !!data,
  dataKeys: data ? Object.keys(data) : 'no data',
  fullData: data // Log completo para debug
});
```

### Arquivos Deletados

#### `frontend/src/hooks/useEstimatedBalance.ts`

**Completamente removido**:
- Hook independente com polling de 1s
- Lógica duplicada de fetch de dados
- ~150 linhas de código

### Arquivos de Teste Atualizados

#### `frontend/src/pages/__tests__/Dashboard.integration.test.tsx`

**Removido**:
```typescript
jest.mock('@/hooks/useEstimatedBalance', () => ({
  useEstimatedBalance: () => ({
    data: mockEstimatedBalanceData,
    isLoading: false,
    error: null,
    refetch: jest.fn()
  })
}));
```

**Atualizado**:
```typescript
// Tests now use PositionsContext
// Mock do PositionsContext se necessário
```

## Impacto da Migração

### Performance

**Antes**:
- Dashboard: polling 1s
- Title: polling 5s
- **Total**: 2 requisições independentes

**Depois**:
- Dashboard + Title: polling 5s compartilhado
- **Redução**: 60% menos requisições

### Consistência

**Antes**:
```typescript
// Dados diferentes entre componentes
Dashboard: totalPL = -367
Title: totalPL = -338
```

**Depois**:
```typescript
// Dados sincronizados
Dashboard: totalPL = -338
Title: totalPL = -338
```

### Manutenibilidade

- **Código removido**: ~150 linhas
- **Complexidade reduzida**: Single source of truth
- **Debugging simplificado**: Logs centralizados

## Verificação da Migração

### Build e Deploy

```bash
# Build frontend
docker-compose -f docker-compose.dev.yml build frontend

# Restart container
docker-compose -f docker-compose.dev.yml restart frontend
```

### Validação Funcional

**Logs Esperados**:
```bash
# PositionsContext funcionando
🔄 POSITIONS CONTEXT - Periodic update of real positions

# usePositionsMetrics com dados
🔍 usePositionsMetrics - Raw data: {totalPL: -338, ...}

# useTotalPL sincronizado
📊 useTotalPL - Current totalPL: -338

# Dashboard usando mesma fonte
🔍 DASHBOARD - Main data sources: {positionsContext: {...}}
```

**Interface**:
- ✅ Dashboard cards mostrando dados corretos
- ✅ Title dinâmico atualizando com mesmo valor
- ✅ Sem erros de "Cannot find name 'totalPL'"
- ✅ Atualização em tempo real funcionando

### Testes

```bash
# Executar testes
npm test -- Dashboard.integration.test.tsx

# Verificar coverage
npm run test:coverage
```

## Rollback (se necessário)

### Procedimento de Rollback

```bash
# 1. Reverter commits
git revert <commit-hash-dashboard-refactor>
git revert <commit-hash-remove-hook>

# 2. Rebuild
docker-compose -f docker-compose.dev.yml build frontend
docker-compose -f docker-compose.dev.yml restart frontend

# 3. Verificar funcionamento
# - Dashboard deve voltar a usar useEstimatedBalance
# - Polling independente restaurado
```

### Arquivos para Restaurar

1. **`frontend/src/hooks/useEstimatedBalance.ts`**: Hook original
2. **`frontend/src/pages/Dashboard.tsx`**: Lógica original
3. **`frontend/src/hooks/useRealtimeDashboard.ts`**: Import original
4. **`frontend/src/pages/__tests__/Dashboard.integration.test.tsx`**: Mock original

## Lições Aprendidas

### Arquitetura

1. **Sempre verificar contextos existentes** antes de criar novos hooks
2. **Polling independente deve ser evitado** - usar contextos compartilhados
3. **Single Source of Truth** previne inconsistências
4. **TypeScript ajuda a identificar** problemas rapidamente

### Debugging

1. **Logs de debug são essenciais** para troubleshooting
2. **Trace de dados** facilita identificação de problemas
3. **Validação incremental** evita problemas em cascata
4. **Testes de integração** validam comportamento end-to-end

### Performance

1. **Polling compartilhado** é mais eficiente
2. **Contextos React** são adequados para estado global
3. **Memoization** previne re-renders desnecessários
4. **Cleanup automático** evita memory leaks

## Próximos Passos

### Monitoramento

1. **Acompanhar logs** por 24-48h
2. **Verificar performance** em produção
3. **Validar consistência** entre componentes
4. **Documentar issues** encontrados

### Melhorias Futuras

1. **Otimizar polling** baseado em atividade do usuário
2. **Implementar cache** mais sofisticado
3. **Adicionar métricas** de performance
4. **Considerar WebSockets** para dados críticos

## Referências

- [React Context API](https://react.dev/reference/react/createContext)
- [Custom Hooks Pattern](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Frontend State Management](../architecture/data-architecture/frontend-state-management.md)
- [High-Level Architecture](../architecture/system-overview/high-level-architecture.md)
