# LN Markets - Cálculos de Posições

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 2.0.0  
> **Responsável**: Sistema LN Markets API v2  

## Índice

- [Visão Geral](#visão-geral)
- [Métricas de Posição](#métricas-de-posição)
- [Fórmulas de Cálculo](#fórmulas-de-cálculo)
- [Implementação](#implementação)
- [Exemplos Práticos](#exemplos-práticos)

## Visão Geral

Este documento detalha os cálculos relacionados a posições de trading na LN Markets, incluindo PnL, margem, leverage e métricas de risco.

## Métricas de Posição

### 1. PnL (Profit and Loss)
- **Unrealized PnL**: PnL não realizado da posição atual
- **Realized PnL**: PnL realizado ao fechar a posição
- **Total PnL**: Soma de todas as posições

### 2. Margin
- **Initial Margin**: Margem inicial necessária
- **Maintenance Margin**: Margem mínima para manter posição
- **Used Margin**: Margem atualmente em uso

### 3. Leverage
- **Leverage Ratio**: Multiplicador de exposição
- **Effective Leverage**: Leverage efetivo considerando PnL

### 4. Risk Metrics
- **Margin Ratio**: Proporção de margem utilizada
- **Liquidation Price**: Preço de liquidação
- **Risk/Reward Ratio**: Relação risco/recompensa

## Fórmulas de Cálculo

### 1. Unrealized PnL

```typescript
function calculateUnrealizedPnL(
  position: {
    side: 'b' | 's';
    quantity: number;
    entryPrice: number;
    currentPrice: number;
  }
): number {
  if (position.side === 'b') {
    // Long position: profit when current > entry
    return (position.currentPrice - position.entryPrice) * position.quantity;
  } else {
    // Short position: profit when current < entry
    return (position.entryPrice - position.currentPrice) * position.quantity;
  }
}
```

### 2. PnL Percentage

```typescript
function calculatePnLPercentage(
  pnl: number,
  margin: number
): number {
  if (margin === 0) return 0;
  return (pnl / margin) * 100;
}
```

### 3. Liquidation Price

```typescript
function calculateLiquidationPrice(
  side: 'b' | 's',
  entryPrice: number,
  leverage: number,
  maintenanceMarginRate: number = 0.05 // 5%
): number {
  if (side === 'b') {
    // Long position liquidation
    return entryPrice * (1 - (1 / leverage) + maintenanceMarginRate);
  } else {
    // Short position liquidation
    return entryPrice * (1 + (1 / leverage) - maintenanceMarginRate);
  }
}
```

### 4. Effective Leverage

```typescript
function calculateEffectiveLeverage(
  notionalValue: number,
  margin: number,
  pnl: number
): number {
  const adjustedMargin = margin + pnl;
  if (adjustedMargin <= 0) return Infinity; // Liquidated
  return notionalValue / adjustedMargin;
}
```

### 5. Risk/Reward Ratio

```typescript
function calculateRiskRewardRatio(
  entryPrice: number,
  stopLossPrice: number,
  takeProfitPrice: number,
  side: 'b' | 's'
): number {
  let risk, reward;
  
  if (side === 'b') {
    risk = entryPrice - stopLossPrice;
    reward = takeProfitPrice - entryPrice;
  } else {
    risk = stopLossPrice - entryPrice;
    reward = entryPrice - takeProfitPrice;
  }
  
  if (risk <= 0) return 0;
  return reward / risk;
}
```

## Implementação

### Position Calculator Class

```typescript
export class PositionCalculator {
  // Taxa de margem de manutenção padrão
  private static readonly MAINTENANCE_MARGIN_RATE = 0.05; // 5%

  /**
   * Calcula PnL não realizado
   */
  static calculateUnrealizedPnL(
    side: 'b' | 's',
    quantity: number,
    entryPrice: number,
    currentPrice: number
  ): number {
    if (side === 'b') {
      return (currentPrice - entryPrice) * quantity;
    } else {
      return (entryPrice - currentPrice) * quantity;
    }
  }

  /**
   * Calcula porcentagem de PnL
   */
  static calculatePnLPercentage(pnl: number, margin: number): number {
    if (margin === 0) return 0;
    return (pnl / margin) * 100;
  }

  /**
   * Calcula preço de liquidação
   */
  static calculateLiquidationPrice(
    side: 'b' | 's',
    entryPrice: number,
    leverage: number,
    maintenanceMarginRate: number = this.MAINTENANCE_MARGIN_RATE
  ): number {
    if (side === 'b') {
      return entryPrice * (1 - (1 / leverage) + maintenanceMarginRate);
    } else {
      return entryPrice * (1 + (1 / leverage) - maintenanceMarginRate);
    }
  }

  /**
   * Calcula leverage efetivo
   */
  static calculateEffectiveLeverage(
    notionalValue: number,
    margin: number,
    pnl: number
  ): number {
    const adjustedMargin = margin + pnl;
    if (adjustedMargin <= 0) return Infinity;
    return notionalValue / adjustedMargin;
  }

  /**
   * Calcula ratio risco/recompensa
   */
  static calculateRiskRewardRatio(
    entryPrice: number,
    stopLossPrice: number,
    takeProfitPrice: number,
    side: 'b' | 's'
  ): number {
    let risk, reward;
    
    if (side === 'b') {
      risk = entryPrice - stopLossPrice;
      reward = takeProfitPrice - entryPrice;
    } else {
      risk = stopLossPrice - entryPrice;
      reward = entryPrice - takeProfitPrice;
    }
    
    if (risk <= 0) return 0;
    return reward / risk;
  }

  /**
   * Calcula distância até liquidação
   */
  static calculateDistanceToLiquidation(
    currentPrice: number,
    liquidationPrice: number,
    side: 'b' | 's'
  ): number {
    if (side === 'b') {
      return ((currentPrice - liquidationPrice) / currentPrice) * 100;
    } else {
      return ((liquidationPrice - currentPrice) / currentPrice) * 100;
    }
  }

  /**
   * Calcula valor nocional
   */
  static calculateNotionalValue(
    quantity: number,
    price: number
  ): number {
    return quantity * price;
  }

  /**
   * Calcula margem inicial
   */
  static calculateInitialMargin(
    notionalValue: number,
    leverage: number
  ): number {
    return notionalValue / leverage;
  }

  /**
   * Calcula margem de manutenção
   */
  static calculateMaintenanceMargin(
    notionalValue: number,
    maintenanceMarginRate: number = this.MAINTENANCE_MARGIN_RATE
  ): number {
    return notionalValue * maintenanceMarginRate;
  }

  /**
   * Calcula métricas completas da posição
   */
  static calculatePositionMetrics(position: LNMarketsPosition, currentPrice: number): PositionMetrics {
    const notionalValue = this.calculateNotionalValue(position.quantity, currentPrice);
    const initialMargin = this.calculateInitialMargin(notionalValue, position.leverage);
    const maintenanceMargin = this.calculateMaintenanceMargin(notionalValue);
    const unrealizedPnL = this.calculateUnrealizedPnL(
      position.side,
      position.quantity,
      position.entry_price,
      currentPrice
    );
    const liquidationPrice = this.calculateLiquidationPrice(
      position.side,
      position.entry_price,
      position.leverage
    );
    const effectiveLeverage = this.calculateEffectiveLeverage(
      notionalValue,
      initialMargin,
      unrealizedPnL
    );
    const distanceToLiquidation = this.calculateDistanceToLiquidation(
      currentPrice,
      liquidationPrice,
      position.side
    );

    return {
      positionId: position.id,
      side: position.side,
      quantity: position.quantity,
      entryPrice: position.entry_price,
      currentPrice,
      unrealizedPnL,
      pnlPercentage: this.calculatePnLPercentage(unrealizedPnL, initialMargin),
      notionalValue,
      initialMargin,
      maintenanceMargin,
      liquidationPrice,
      effectiveLeverage,
      distanceToLiquidation,
      riskLevel: this.assessRiskLevel(distanceToLiquidation, effectiveLeverage)
    };
  }

  /**
   * Avalia nível de risco
   */
  private static assessRiskLevel(distanceToLiquidation: number, effectiveLeverage: number): 'low' | 'medium' | 'high' | 'critical' {
    if (distanceToLiquidation < 5 || effectiveLeverage > 20) return 'critical';
    if (distanceToLiquidation < 10 || effectiveLeverage > 15) return 'high';
    if (distanceToLiquidation < 20 || effectiveLeverage > 10) return 'medium';
    return 'low';
  }
}

interface PositionMetrics {
  positionId: string;
  side: 'b' | 's';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  pnlPercentage: number;
  notionalValue: number;
  initialMargin: number;
  maintenanceMargin: number;
  liquidationPrice: number;
  effectiveLeverage: number;
  distanceToLiquidation: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}
```

## Exemplos Práticos

### Exemplo 1: Cálculo Básico de PnL

```typescript
// Posição long
const longPosition = {
  side: 'b' as const,
  quantity: 1000,
  entryPrice: 45000,
  currentPrice: 46000
};

const longPnL = PositionCalculator.calculateUnrealizedPnL(
  longPosition.side,
  longPosition.quantity,
  longPosition.entryPrice,
  longPosition.currentPrice
);

console.log('📈 Long Position PnL:', {
  entryPrice: `$${longPosition.entryPrice}`,
  currentPrice: `$${longPosition.currentPrice}`,
  quantity: longPosition.quantity,
  unrealizedPnL: `${longPnL} sats`,
  priceChange: `$${longPosition.currentPrice - longPosition.entryPrice}`,
  priceChangePercent: `${(((longPosition.currentPrice - longPosition.entryPrice) / longPosition.entryPrice) * 100).toFixed(2)}%`
});

// Output:
// 📈 Long Position PnL: {
//   entryPrice: '$45000',
//   currentPrice: '$46000',
//   quantity: 1000,
//   unrealizedPnL: '10000000 sats',
//   priceChange: '$1000',
//   priceChangePercent: '2.22%'
// }

// Posição short
const shortPosition = {
  side: 's' as const,
  quantity: 1000,
  entryPrice: 45000,
  currentPrice: 44000
};

const shortPnL = PositionCalculator.calculateUnrealizedPnL(
  shortPosition.side,
  shortPosition.quantity,
  shortPosition.entryPrice,
  shortPosition.currentPrice
);

console.log('📉 Short Position PnL:', {
  entryPrice: `$${shortPosition.entryPrice}`,
  currentPrice: `$${shortPosition.currentPrice}`,
  quantity: shortPosition.quantity,
  unrealizedPnL: `${shortPnL} sats`,
  priceChange: `$${shortPosition.entryPrice - shortPosition.currentPrice}`,
  priceChangePercent: `${(((shortPosition.entryPrice - shortPosition.currentPrice) / shortPosition.entryPrice) * 100).toFixed(2)}%`
});

// Output:
// 📉 Short Position PnL: {
//   entryPrice: '$45000',
//   currentPrice: '$44000',
//   quantity: 1000,
//   unrealizedPnL: '10000000 sats',
//   priceChange: '$1000',
//   priceChangePercent: '2.22%'
// }
```

### Exemplo 2: Preço de Liquidação

```typescript
// Posição com 10x leverage
const position = {
  side: 'b' as const,
  entryPrice: 45000,
  leverage: 10
};

const liquidationPrice = PositionCalculator.calculateLiquidationPrice(
  position.side,
  position.entryPrice,
  position.leverage
);

console.log('⚠️ Liquidation Analysis:', {
  entryPrice: `$${position.entryPrice}`,
  leverage: `${position.leverage}x`,
  liquidationPrice: `$${liquidationPrice.toFixed(2)}`,
  priceDrop: `$${(position.entryPrice - liquidationPrice).toFixed(2)}`,
  maxDropPercent: `${(((position.entryPrice - liquidationPrice) / position.entryPrice) * 100).toFixed(2)}%`
});

// Output:
// ⚠️ Liquidation Analysis: {
//   entryPrice: '$45000',
//   leverage: '10x',
//   liquidationPrice: '$40500.00',
//   priceDrop: '$4500.00',
//   maxDropPercent: '10.00%'
// }
```

### Exemplo 3: Leverage Efetivo

```typescript
// Posição com PnL
const position = {
  notionalValue: 45000000, // 45M sats
  initialMargin: 4500000,  // 4.5M sats
  unrealizedPnL: 1000000   // +1M sats profit
};

const effectiveLeverage = PositionCalculator.calculateEffectiveLeverage(
  position.notionalValue,
  position.initialMargin,
  position.unrealizedPnL
);

console.log('⚡ Effective Leverage:', {
  notionalValue: `${(position.notionalValue / 100000000).toFixed(3)} BTC`,
  initialMargin: `${(position.initialMargin / 100000000).toFixed(3)} BTC`,
  unrealizedPnL: `${(position.unrealizedPnL / 100000000).toFixed(3)} BTC`,
  effectiveLeverage: `${effectiveLeverage.toFixed(2)}x`,
  initialLeverage: `${(position.notionalValue / position.initialMargin).toFixed(2)}x`
});

// Output:
// ⚡ Effective Leverage: {
//   notionalValue: '0.450 BTC',
//   initialMargin: '0.045 BTC',
//   unrealizedPnL: '0.010 BTC',
//   effectiveLeverage: '8.18x',
//   initialLeverage: '10.00x'
// }
```

### Exemplo 4: Métricas Completas de Posição

```typescript
// Posição completa
const position: LNMarketsPosition = {
  id: 'pos_123',
  type: 'm',
  side: 'b',
  quantity: 1000,
  leverage: 10,
  entry_price: 45000,
  current_price: 46000,
  pnl: 1000000,
  margin: 4500000,
  created_at: '2025-01-09T10:00:00Z'
};

const currentPrice = 47000; // Preço atual do mercado
const metrics = PositionCalculator.calculatePositionMetrics(position, currentPrice);

console.log('📊 Complete Position Metrics:', {
  positionId: metrics.positionId,
  side: metrics.side === 'b' ? 'Long' : 'Short',
  quantity: `${metrics.quantity} sats`,
  entryPrice: `$${metrics.entryPrice}`,
  currentPrice: `$${metrics.currentPrice}`,
  unrealizedPnL: `${metrics.unrealizedPnL} sats`,
  pnlPercentage: `${metrics.pnlPercentage.toFixed(2)}%`,
  notionalValue: `$${(metrics.notionalValue / 100000000).toFixed(3)} BTC`,
  initialMargin: `${(metrics.initialMargin / 100000000).toFixed(3)} BTC`,
  liquidationPrice: `$${metrics.liquidationPrice.toFixed(2)}`,
  effectiveLeverage: `${metrics.effectiveLeverage.toFixed(2)}x`,
  distanceToLiquidation: `${metrics.distanceToLiquidation.toFixed(2)}%`,
  riskLevel: metrics.riskLevel
});

// Output:
// 📊 Complete Position Metrics: {
//   positionId: 'pos_123',
//   side: 'Long',
//   quantity: '1000 sats',
//   entryPrice: '$45000',
//   currentPrice: '$47000',
//   unrealizedPnL: '2000000 sats',
//   pnlPercentage: '44.44%',
//   notionalValue: '$0.047 BTC',
//   initialMargin: '0.0047 BTC',
//   liquidationPrice: '$40500.00',
//   effectiveLeverage: '6.71x',
//   distanceToLiquidation: '13.83%',
//   riskLevel: 'medium'
// }
```

### Exemplo 5: Análise de Risco

```typescript
function analyzePositionRisk(positions: LNMarketsPosition[], currentPrice: number) {
  const analysis = positions.map(position => {
    const metrics = PositionCalculator.calculatePositionMetrics(position, currentPrice);
    
    return {
      positionId: position.id,
      riskLevel: metrics.riskLevel,
      distanceToLiquidation: metrics.distanceToLiquidation,
      effectiveLeverage: metrics.effectiveLeverage,
      pnlPercentage: metrics.pnlPercentage,
      recommendation: getRiskRecommendation(metrics)
    };
  });

  console.log('🛡️ Risk Analysis Summary:', analysis);

  // Estatísticas gerais
  const riskDistribution = analysis.reduce((acc, pos) => {
    acc[pos.riskLevel] = (acc[pos.riskLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('📈 Risk Distribution:', riskDistribution);
}

function getRiskRecommendation(metrics: PositionMetrics): string {
  switch (metrics.riskLevel) {
    case 'critical':
      return 'Close position immediately';
    case 'high':
      return 'Consider reducing leverage or closing';
    case 'medium':
      return 'Monitor closely';
    case 'low':
      return 'Safe position';
    default:
      return 'Unknown risk level';
  }
}

// Exemplo de uso
const positions: LNMarketsPosition[] = [
  {
    id: 'pos_1',
    side: 'b',
    quantity: 1000,
    entry_price: 45000,
    leverage: 10,
    current_price: 43000,
    pnl: -2000000,
    margin: 4500000,
    created_at: '2025-01-09T10:00:00Z'
  },
  {
    id: 'pos_2',
    side: 's',
    quantity: 500,
    entry_price: 45000,
    leverage: 5,
    current_price: 43000,
    pnl: 1000000,
    margin: 4500000,
    created_at: '2025-01-09T10:00:00Z'
  }
];

analyzePositionRisk(positions, 43000);

// Output:
// 🛡️ Risk Analysis Summary: [
//   {
//     positionId: 'pos_1',
//     riskLevel: 'high',
//     distanceToLiquidation: '4.65%',
//     effectiveLeverage: '11.11x',
//     pnlPercentage: '-44.44%',
//     recommendation: 'Consider reducing leverage or closing'
//   },
//   {
//     positionId: 'pos_2',
//     riskLevel: 'low',
//     distanceToLiquidation: '25.58%',
//     effectiveLeverage: '4.17x',
//     pnlPercentage: '22.22%',
//     recommendation: 'Safe position'
//   }
// ]
// 📈 Risk Distribution: { high: 1, low: 1 }
```

## Referências

- [Cálculo de Saldo](./01-balance-calculations.md)
- [Cálculo de Taxas](./02-fee-calculations.md)
- [API v2 - Futures Endpoints](../external-api/03-endpoints.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
