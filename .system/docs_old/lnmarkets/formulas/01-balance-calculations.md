# LN Markets - Cálculos de Saldo

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 2.0.0  
> **Responsável**: Sistema LN Markets API v2  

## Índice

- [Visão Geral](#visão-geral)
- [Tipos de Saldo](#tipos-de-saldo)
- [Fórmulas de Cálculo](#fórmulas-de-cálculo)
- [Implementação](#implementação)
- [Exemplos Práticos](#exemplos-práticos)

## Visão Geral

Este documento detalha os cálculos de saldo utilizados na integração com a LN Markets, incluindo saldo disponível, saldo em uso e saldo total.

## Tipos de Saldo

### 1. Balance (Saldo Total)
- **Definição**: Saldo total da conta em sats
- **Fonte**: `user.getUser().balance`
- **Uso**: Saldo bruto disponível na conta

### 2. Synthetic USD Balance
- **Definição**: Equivalente em USD do saldo
- **Fonte**: `user.getUser().synthetic_usd_balance`
- **Uso**: Conversão para visualização em USD

### 3. Available Balance (Saldo Disponível)
- **Definição**: Saldo disponível para novas posições
- **Cálculo**: `Balance - Total Margin Used`
- **Uso**: Determinar quanto pode ser usado em novas posições

### 4. Margin Used (Margem em Uso)
- **Definição**: Margem total utilizada em posições ativas
- **Cálculo**: `Sum of all position margins`
- **Uso**: Calcular exposição total

## Fórmulas de Cálculo

### 1. Saldo Disponível

```typescript
function calculateAvailableBalance(user: LNMarketsUser, positions: LNMarketsPosition[]): number {
  const totalMarginUsed = positions.reduce((sum, position) => sum + position.margin, 0);
  return user.balance - totalMarginUsed;
}
```

### 2. Margem Total Utilizada

```typescript
function calculateTotalMarginUsed(positions: LNMarketsPosition[]): number {
  return positions.reduce((sum, position) => {
    return sum + position.margin;
  }, 0);
}
```

### 3. PnL Total

```typescript
function calculateTotalPnL(positions: LNMarketsPosition[]): number {
  return positions.reduce((sum, position) => {
    return sum + position.pnl;
  }, 0);
}
```

### 4. Margem por Posição

```typescript
function calculatePositionMargin(
  quantity: number,
  entryPrice: number,
  leverage: number
): number {
  return (quantity * entryPrice) / leverage;
}
```

### 5. Ratio de Margem

```typescript
function calculateMarginRatio(
  totalMarginUsed: number,
  totalBalance: number
): number {
  return totalMarginUsed / totalBalance;
}
```

### 6. Conversão USD

```typescript
function convertSatsToUSD(sats: number, btcPrice: number): number {
  return (sats / 100000000) * btcPrice; // Convert sats to BTC, then to USD
}

function convertUSDTosats(usd: number, btcPrice: number): number {
  return Math.floor((usd / btcPrice) * 100000000); // Convert USD to BTC, then to sats
}
```

## Implementação

### Balance Calculator Class

```typescript
export class BalanceCalculator {
  /**
   * Calcula saldo disponível para novas posições
   */
  static calculateAvailableBalance(
    user: LNMarketsUser,
    positions: LNMarketsPosition[]
  ): number {
    const totalMarginUsed = this.calculateTotalMarginUsed(positions);
    return Math.max(0, user.balance - totalMarginUsed);
  }

  /**
   * Calcula margem total utilizada
   */
  static calculateTotalMarginUsed(positions: LNMarketsPosition[]): number {
    return positions.reduce((sum, position) => sum + position.margin, 0);
  }

  /**
   * Calcula PnL total
   */
  static calculateTotalPnL(positions: LNMarketsPosition[]): number {
    return positions.reduce((sum, position) => sum + position.pnl, 0);
  }

  /**
   * Calcula ratio de margem
   */
  static calculateMarginRatio(
    totalMarginUsed: number,
    totalBalance: number
  ): number {
    if (totalBalance === 0) return 0;
    return totalMarginUsed / totalBalance;
  }

  /**
   * Calcula margem necessária para nova posição
   */
  static calculateRequiredMargin(
    quantity: number,
    entryPrice: number,
    leverage: number
  ): number {
    return (quantity * entryPrice) / leverage;
  }

  /**
   * Verifica se há saldo suficiente para nova posição
   */
  static hasSufficientBalance(
    availableBalance: number,
    requiredMargin: number
  ): boolean {
    return availableBalance >= requiredMargin;
  }

  /**
   * Calcula saldo estimado após nova posição
   */
  static calculateEstimatedBalanceAfterPosition(
    currentBalance: number,
    requiredMargin: number
  ): number {
    return currentBalance - requiredMargin;
  }

  /**
   * Converte sats para USD
   */
  static convertSatsToUSD(sats: number, btcPriceUSD: number): number {
    const btc = sats / 100000000;
    return btc * btcPriceUSD;
  }

  /**
   * Converte USD para sats
   */
  static convertUSDTosats(usd: number, btcPriceUSD: number): number {
    const btc = usd / btcPriceUSD;
    return Math.floor(btc * 100000000);
  }

  /**
   * Calcula métricas completas de saldo
   */
  static calculateBalanceMetrics(
    user: LNMarketsUser,
    positions: LNMarketsPosition[],
    btcPriceUSD?: number
  ): BalanceMetrics {
    const totalMarginUsed = this.calculateTotalMarginUsed(positions);
    const availableBalance = this.calculateAvailableBalance(user, positions);
    const totalPnL = this.calculateTotalPnL(positions);
    const marginRatio = this.calculateMarginRatio(totalMarginUsed, user.balance);

    const metrics: BalanceMetrics = {
      totalBalance: user.balance,
      availableBalance,
      totalMarginUsed,
      totalPnL,
      marginRatio,
      syntheticUSD: user.synthetic_usd_balance,
      positionsCount: positions.length
    };

    if (btcPriceUSD) {
      metrics.totalBalanceUSD = this.convertSatsToUSD(user.balance, btcPriceUSD);
      metrics.availableBalanceUSD = this.convertSatsToUSD(availableBalance, btcPriceUSD);
      metrics.totalPnLUSD = this.convertSatsToUSD(totalPnL, btcPriceUSD);
    }

    return metrics;
  }
}

interface BalanceMetrics {
  totalBalance: number;
  availableBalance: number;
  totalMarginUsed: number;
  totalPnL: number;
  marginRatio: number;
  syntheticUSD: number;
  positionsCount: number;
  totalBalanceUSD?: number;
  availableBalanceUSD?: number;
  totalPnLUSD?: number;
}
```

## Exemplos Práticos

### Exemplo 1: Cálculo Básico de Saldo

```typescript
// Dados do usuário
const user = {
  balance: 100000, // 100k sats
  synthetic_usd_balance: 45.50,
  uid: 'user123',
  username: 'trader123'
};

// Posições ativas
const positions = [
  {
    id: 'pos1',
    margin: 10000, // 10k sats
    pnl: 500, // +500 sats
    quantity: 100,
    leverage: 10
  },
  {
    id: 'pos2',
    margin: 5000, // 5k sats
    pnl: -200, // -200 sats
    quantity: 50,
    leverage: 10
  }
];

// Cálculos
const totalMarginUsed = BalanceCalculator.calculateTotalMarginUsed(positions);
// Resultado: 15000 sats

const availableBalance = BalanceCalculator.calculateAvailableBalance(user, positions);
// Resultado: 85000 sats (100000 - 15000)

const totalPnL = BalanceCalculator.calculateTotalPnL(positions);
// Resultado: 300 sats (500 - 200)

const marginRatio = BalanceCalculator.calculateMarginRatio(totalMarginUsed, user.balance);
// Resultado: 0.15 (15%)
```

### Exemplo 2: Verificação de Saldo para Nova Posição

```typescript
// Parâmetros da nova posição
const newPosition = {
  quantity: 200,
  entryPrice: 45000,
  leverage: 10
};

// Calcular margem necessária
const requiredMargin = BalanceCalculator.calculateRequiredMargin(
  newPosition.quantity,
  newPosition.entryPrice,
  newPosition.leverage
);
// Resultado: 900000 sats (200 * 45000 / 10)

// Verificar se há saldo suficiente
const hasBalance = BalanceCalculator.hasSufficientBalance(
  availableBalance, // 85000 sats
  requiredMargin   // 900000 sats
);
// Resultado: false (não há saldo suficiente)

// Calcular saldo após posição (se fosse possível)
const estimatedBalance = BalanceCalculator.calculateEstimatedBalanceAfterPosition(
  user.balance,     // 100000 sats
  requiredMargin    // 900000 sats
);
// Resultado: -800000 sats (saldo insuficiente)
```

### Exemplo 3: Conversão de Moedas

```typescript
const btcPriceUSD = 45000; // $45,000 por BTC

// Converter saldo para USD
const balanceUSD = BalanceCalculator.convertSatsToUSD(
  user.balance,    // 100000 sats
  btcPriceUSD      // $45,000
);
// Resultado: $45.00

// Converter PnL para USD
const pnlUSD = BalanceCalculator.convertSatsToUSD(
  totalPnL,        // 300 sats
  btcPriceUSD      // $45,000
);
// Resultado: $0.135

// Converter USD para sats
const satsFromUSD = BalanceCalculator.convertUSDTosats(
  100,             // $100
  btcPriceUSD      // $45,000
);
// Resultado: 222222 sats
```

### Exemplo 4: Métricas Completas

```typescript
const metrics = BalanceCalculator.calculateBalanceMetrics(
  user,
  positions,
  btcPriceUSD
);

console.log('📊 Balance Metrics:', {
  totalBalance: `${metrics.totalBalance} sats ($${metrics.totalBalanceUSD?.toFixed(2)})`,
  availableBalance: `${metrics.availableBalance} sats ($${metrics.availableBalanceUSD?.toFixed(2)})`,
  totalMarginUsed: `${metrics.totalMarginUsed} sats`,
  totalPnL: `${metrics.totalPnL} sats ($${metrics.totalPnLUSD?.toFixed(2)})`,
  marginRatio: `${(metrics.marginRatio * 100).toFixed(2)}%`,
  positionsCount: metrics.positionsCount
});

// Output:
// 📊 Balance Metrics: {
//   totalBalance: '100000 sats ($45.00)',
//   availableBalance: '85000 sats ($38.25)',
//   totalMarginUsed: '15000 sats',
//   totalPnL: '300 sats ($0.14)',
//   marginRatio: '15.00%',
//   positionsCount: 2
// }
```

## Referências

- [Cálculo de Taxas](./02-fee-calculations.md)
- [Cálculo de Posições](./03-position-calculations.md)
- [API v2 - User Endpoints](../external-api/03-endpoints.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
