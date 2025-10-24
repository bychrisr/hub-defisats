---
title: "Dashboard Header Sync Issues - Troubleshooting Guide"
version: "2.1.0"
created: "2025-10-24"
updated: "2025-10-24"
author: "Documentation Agent"
status: "active"
tags: ["troubleshooting", "dashboard", "header", "sync", "real-time", "debugging"]
---

# Dashboard Header Sync Issues - Troubleshooting Guide

## Visão Geral

Este guia aborda problemas comuns relacionados à sincronização entre Dashboard, Header e Title dinâmico. Após a refatoração para o padrão de consumo direto, a maioria dos problemas de sincronização foram resolvidos, mas este documento serve como referência para debugging futuro.

## Problemas Comuns

### 1. Dashboard/Header não atualizando

#### Sintomas
- Cards do Dashboard mostram valores estáticos
- Header não reflete mudanças em tempo real
- Title dinâmico não atualiza

#### Verificações

**1. PositionsContext está fetchando?**
```typescript
// Verificar logs no console
console.log('🔍 POSITIONS CONTEXT - Fetching data...');
console.log('🔍 POSITIONS CONTEXT - Data received:', data);
```

**2. usePositionsMetrics() retorna dados válidos?**
```typescript
const { totalPL, totalMargin, totalFees } = usePositionsMetrics();

console.log('🔍 usePositionsMetrics - Values:', {
  totalPL,
  totalMargin,
  totalFees,
  hasData: !!(totalPL || totalMargin || totalFees)
});
```

**3. Component está subscrito ao context?**
```typescript
// Verificar se o componente está dentro do Provider
<PositionsProvider>
  <Dashboard />
  <LNMarketsHeader />
</PositionsProvider>
```

#### Soluções

1. **Verificar polling interval**
   ```typescript
   // PositionsContext deve ter polling ativo
   const interval = useMemo(() => {
     return isActive ? 10000 : 30000; // 10s ou 30s
   }, [isActive]);
   ```

2. **Confirmar que não há erro no backend**
   ```typescript
   // Verificar logs do backend
   console.log('🔍 BACKEND - Dashboard data:', response);
   ```

3. **Validar autenticação**
   ```typescript
   const { isAuthenticated } = useAuthStore();
   console.log('🔍 AUTH - Is authenticated:', isAuthenticated);
   ```

### 2. Valores zerados

#### Sintomas
- Dashboard cards mostram 0
- Header mostra "N/A" ou valores zerados
- Title mostra "P&L: 0"

#### Verificações

**1. Credenciais LN Markets válidas?**
```typescript
// Verificar se credenciais estão configuradas
const { credentialsError } = useCredentialsError();
console.log('🔍 CREDENTIALS - Error:', credentialsError);
```

**2. Conta ativa selecionada?**
```typescript
// Verificar conta ativa
const { accountInfo, hasActiveAccount } = useActiveAccountData();
console.log('🔍 ACCOUNT - Info:', accountInfo);
console.log('🔍 ACCOUNT - Has active:', hasActiveAccount);
```

**3. Backend retornando dados corretos?**
```typescript
// Verificar resposta da API
fetch('/api/lnmarkets-robust/dashboard')
  .then(res => res.json())
  .then(data => {
    console.log('🔍 API - Response:', data);
    console.log('🔍 API - Total PL:', data.totalPL);
    console.log('🔍 API - Total Margin:', data.totalMargin);
  });
```

#### Soluções

1. **Verificar credenciais**
   - Confirmar que API Key, Secret e Passphrase estão corretos
   - Verificar se conta é testnet/mainnet conforme esperado
   - Testar credenciais diretamente na API da LN Markets

2. **Verificar conta ativa**
   ```typescript
   // Garantir que há uma conta ativa
   if (!hasActiveAccount) {
     console.error('❌ No active account selected');
     // Redirecionar para seleção de conta
   }
   ```

3. **Verificar dados do backend**
   ```typescript
   // Backend deve retornar dados válidos
   const expectedData = {
     totalPL: number,
     totalMargin: number,
     totalFees: number,
     totalTradingFees: number,
     totalFundingCost: number,
     lastUpdate: number
   };
   ```

### 3. Header diferente do Dashboard

#### Sintomas
- Header mostra valores diferentes do Dashboard
- Inconsistência entre componentes
- Dados não sincronizados

#### Causa
Provavelmente usando fonte de dados diferente

#### Verificações

**1. Ambos usam usePositionsMetrics()?**
```typescript
// Dashboard
const { totalFees } = usePositionsMetrics();

// Header
const { totalFees } = usePositionsMetrics();

// Verificar se são os mesmos valores
console.log('🔍 SYNC - Dashboard fees:', dashboardFees);
console.log('🔍 SYNC - Header fees:', headerFees);
console.log('🔍 SYNC - Are equal:', dashboardFees === headerFees);
```

**2. Não há cache intermediário?**
```typescript
// ❌ Evitar cache intermediário
const cachedFees = useMemo(() => totalFees, [totalFees]);

// ✅ Usar valor direto
const displayFees = totalFees;
```

#### Solução
**Ambos devem usar `usePositionsMetrics()` diretamente**

```typescript
// Dashboard
const positionsMetrics = usePositionsMetrics();
const contextTotalFees = positionsMetrics.totalFees || 0;

// Header
const { totalFees } = usePositionsMetrics();

// Ambos usam a mesma fonte, garantindo sincronização
```

## Debugging Avançado

### 1. Trace de Dados Completo

```typescript
// Adicionar em cada componente
const Component = () => {
  const { totalPL, totalMargin, totalFees } = usePositionsMetrics();
  
  // Log detalhado
  console.log('🔍 COMPONENT - Data flow:', {
    component: 'ComponentName',
    totalPL,
    totalMargin,
    totalFees,
    timestamp: new Date().toISOString(),
    source: 'usePositionsMetrics'
  });
  
  return <div>{/* JSX */}</div>;
};
```

### 2. Verificação de Re-renders

```typescript
// Verificar se componente está re-renderizando
const Component = () => {
  console.log('🔄 COMPONENT - Re-rendering at:', new Date().toISOString());
  
  const { totalPL } = usePositionsMetrics();
  
  return <div>P&L: {totalPL}</div>;
};
```

### 3. Validação de Context

```typescript
// Verificar se Context está funcionando
const TestComponent = () => {
  const context = useContext(PositionsContext);
  
  console.log('🔍 CONTEXT - Available:', !!context);
  console.log('🔍 CONTEXT - Data:', context?.data);
  console.log('🔍 CONTEXT - Last update:', context?.data?.lastUpdate);
  
  return <div>Context test</div>;
};
```

## Ferramentas de Debug

### 1. React DevTools

- **Profiler**: Verificar re-renders desnecessários
- **Components**: Inspecionar props e state
- **Context**: Verificar valores do Context

### 2. Console Logs

```typescript
// Ativar logs detalhados em desenvolvimento
if (import.meta.env.DEV) {
  console.log('🔍 DEBUG - Component state:', {
    totalPL,
    totalMargin,
    totalFees,
    lastUpdate: new Date(lastUpdate).toISOString()
  });
}
```

### 3. Network Tab

- Verificar requisições para `/api/lnmarkets-robust/dashboard`
- Confirmar que dados estão sendo retornados
- Verificar status codes (200, 401, 500)

## Soluções por Cenário

### Cenário 1: Dados não carregam

```typescript
// Verificar ordem de carregamento
useEffect(() => {
  console.log('🔍 LOADING - Auth:', isAuthenticated);
  console.log('🔍 LOADING - Account:', hasActiveAccount);
  console.log('🔍 LOADING - Data:', !!data);
}, [isAuthenticated, hasActiveAccount, data]);
```

### Cenário 2: Dados carregam mas não atualizam

```typescript
// Verificar polling
useEffect(() => {
  const interval = setInterval(() => {
    console.log('🔄 POLLING - Fetching data...');
    fetchRealPositions();
  }, 10000);
  
  return () => clearInterval(interval);
}, []);
```

### Cenário 3: Dados inconsistentes

```typescript
// Verificar fonte única
const Component1 = () => {
  const { totalPL } = usePositionsMetrics();
  console.log('🔍 COMP1 - Total PL:', totalPL);
};

const Component2 = () => {
  const { totalPL } = usePositionsMetrics();
  console.log('🔍 COMP2 - Total PL:', totalPL);
};
```

## Prevenção

### 1. Padrão Consistente

```typescript
// Sempre usar o mesmo hook
const { totalPL, totalMargin, totalFees } = usePositionsMetrics();
```

### 2. Valores Padrão

```typescript
// Sempre fornecer valores padrão
const safeTotalPL = totalPL || 0;
const safeTotalMargin = totalMargin || 0;
const safeTotalFees = totalFees || 0;
```

### 3. Verificação de Dependências

```typescript
// Verificar se todas as dependências estão corretas
useEffect(() => {
  // Lógica que depende de dados
}, [totalPL, totalMargin, totalFees]); // Dependências corretas
```

## Logs de Referência

### Logs de Sucesso

```
✅ POSITIONS CONTEXT - Data fetched successfully
✅ POSITIONS CONTEXT - Total PL: 1412
✅ POSITIONS CONTEXT - Total Margin: 26504
✅ POSITIONS CONTEXT - Total Fees: 867
✅ DASHBOARD - Cards updated
✅ HEADER - Values updated
✅ TITLE - P&L updated
```

### Logs de Erro

```
❌ POSITIONS CONTEXT - Fetch failed: 401 Unauthorized
❌ POSITIONS CONTEXT - No active account
❌ POSITIONS CONTEXT - Invalid credentials
❌ DASHBOARD - Cards not updating
❌ HEADER - Values static
❌ TITLE - P&L not updating
```

## Referências

- [Frontend State Management](../architecture/data-architecture/frontend-state-management.md)
- [Dashboard Implementation](../architecture/components/dashboard-implementation.md)
- [Header Implementation](../architecture/components/header-implementation.md)
- [Direct Context Consumption Pattern](../architecture/patterns/direct-context-consumption.md)
- [Dashboard State Refactoring](../../migrations/code-migrations/dashboard-state-refactoring.md)
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [React Context API](https://react.dev/reference/react/createContext)
