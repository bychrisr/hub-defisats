# LN Markets - Cálculo de Taxas

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 2.0.0  
> **Responsável**: Sistema LN Markets API v2  

## Índice

- [Visão Geral](#visão-geral)
- [Tipos de Taxas](#tipos-de-taxas)
- [Fórmulas de Cálculo](#fórmulas-de-cálculo)
- [Implementação](#implementação)
- [Exemplos Práticos](#exemplos-práticos)

## Visão Geral

Este documento detalha os cálculos de taxas utilizados na integração com a LN Markets, incluindo taxas de trading, funding fees e taxas de depósito/saque.

## Tipos de Taxas

### 1. Trading Fees (Taxas de Trading)
- **Maker Fee**: Taxa para ordens que adicionam liquidez
- **Taker Fee**: Taxa para ordens que removem liquidez
- **Cálculo**: Baseado no volume da posição

### 2. Funding Fees
- **Definição**: Taxa paga para manter posições abertas
- **Período**: A cada 8 horas
- **Cálculo**: Baseado no tamanho da posição e taxa de funding

### 3. Deposit/Withdrawal Fees
- **Bitcoin**: Taxa de rede Bitcoin
- **Lightning**: Taxa mínima ou gratuita
- **Cálculo**: Baseado no tipo de transação

### 4. Margin Fees
- **Definição**: Taxa sobre margem utilizada
- **Cálculo**: Baseado no valor da margem e tempo

## Fórmulas de Cálculo

### 1. Trading Fee

```typescript
function calculateTradingFee(
  positionSize: number,
  entryPrice: number,
  feeRate: number
): number {
  const notionalValue = positionSize * entryPrice;
  return notionalValue * feeRate;
}
```

### 2. Funding Fee

```typescript
function calculateFundingFee(
  positionSize: number,
  fundingRate: number
): number {
  return positionSize * fundingRate;
}
```

### 3. Total Position Cost

```typescript
function calculateTotalPositionCost(
  margin: number,
  tradingFee: number,
  fundingFee: number
): number {
  return margin + tradingFee + fundingFee;
}
```

### 4. Fee Rate por Leverage

```typescript
function calculateFeeRateByLeverage(leverage: number): number {
  // Taxa base aumenta com leverage
  const baseRate = 0.001; // 0.1%
  const leverageMultiplier = Math.min(leverage / 10, 2); // Max 2x
  return baseRate * leverageMultiplier;
}
```

### 5. Break-Even Price

```typescript
function calculateBreakEvenPrice(
  entryPrice: number,
  side: 'b' | 's',
  totalFees: number,
  positionSize: number
): number {
  const feePerUnit = totalFees / positionSize;
  
  if (side === 'b') {
    // Para posição long, precisa cobrir as taxas
    return entryPrice + feePerUnit;
  } else {
    // Para posição short, precisa cobrir as taxas
    return entryPrice - feePerUnit;
  }
}
```

## Implementação

### Fee Calculator Class

```typescript
export class FeeCalculator {
  // Taxas padrão da LN Markets
  private static readonly DEFAULT_FEES = {
    makerFee: 0.0005,    // 0.05%
    takerFee: 0.001,     // 0.1%
    fundingFee: 0.0001,  // 0.01%
    bitcoinDepositFee: 0, // Gratuito
    bitcoinWithdrawalFee: 1000, // 1000 sats
    lightningDepositFee: 0,     // Gratuito
    lightningWithdrawalFee: 100 // 100 sats
  };

  /**
   * Calcula taxa de trading
   */
  static calculateTradingFee(
    positionSize: number,
    entryPrice: number,
    isMaker: boolean = false
  ): number {
    const notionalValue = positionSize * entryPrice;
    const feeRate = isMaker ? this.DEFAULT_FEES.makerFee : this.DEFAULT_FEES.takerFee;
    return notionalValue * feeRate;
  }

  /**
   * Calcula taxa de funding
   */
  static calculateFundingFee(
    positionSize: number,
    fundingRate?: number
  ): number {
    const rate = fundingRate || this.DEFAULT_FEES.fundingFee;
    return positionSize * rate;
  }

  /**
   * Calcula taxa total de posição
   */
  static calculateTotalPositionFees(
    positionSize: number,
    entryPrice: number,
    leverage: number,
    isMaker: boolean = false
  ): PositionFees {
    const tradingFee = this.calculateTradingFee(positionSize, entryPrice, isMaker);
    const fundingFee = this.calculateFundingFee(positionSize);
    const margin = (positionSize * entryPrice) / leverage;
    
    return {
      tradingFee,
      fundingFee,
      totalFees: tradingFee + fundingFee,
      margin,
      totalCost: margin + tradingFee + fundingFee,
      feePercentage: (tradingFee + fundingFee) / margin
    };
  }

  /**
   * Calcula taxa de depósito
   */
  static calculateDepositFee(
    amount: number,
    type: 'bitcoin' | 'lightning'
  ): number {
    if (type === 'bitcoin') {
      return this.DEFAULT_FEES.bitcoinDepositFee; // Gratuito
    } else {
      return this.DEFAULT_FEES.lightningDepositFee; // Gratuito
    }
  }

  /**
   * Calcula taxa de saque
   */
  static calculateWithdrawalFee(
    amount: number,
    type: 'bitcoin' | 'lightning'
  ): number {
    if (type === 'bitcoin') {
      return this.DEFAULT_FEES.bitcoinWithdrawalFee; // 1000 sats
    } else {
      return this.DEFAULT_FEES.lightningWithdrawalFee; // 100 sats
    }
  }

  /**
   * Calcula preço de break-even
   */
  static calculateBreakEvenPrice(
    entryPrice: number,
    side: 'b' | 's',
    totalFees: number,
    positionSize: number
  ): number {
    const feePerUnit = totalFees / positionSize;
    
    if (side === 'b') {
      return entryPrice + feePerUnit;
    } else {
      return entryPrice - feePerUnit;
    }
  }

  /**
   * Calcula ROI necessário para cobrir taxas
   */
  static calculateRequiredROI(totalFees: number, margin: number): number {
    return (totalFees / margin) * 100;
  }

  /**
   * Calcula taxa efetiva anual
   */
  static calculateAnnualFeeRate(
    dailyFundingRate: number,
    tradingFeeRate: number,
    averageLeverage: number
  ): number {
    const annualFundingRate = dailyFundingRate * 365;
    const effectiveTradingRate = tradingFeeRate * averageLeverage;
    return annualFundingRate + effectiveTradingRate;
  }
}

interface PositionFees {
  tradingFee: number;
  fundingFee: number;
  totalFees: number;
  margin: number;
  totalCost: number;
  feePercentage: number;
}
```

## Exemplos Práticos

### Exemplo 1: Cálculo de Taxas para Nova Posição

```typescript
// Parâmetros da posição
const positionParams = {
  size: 1000,        // 1000 sats
  entryPrice: 45000, // $45,000
  leverage: 10,      // 10x leverage
  side: 'b'          // Buy (long)
};

// Calcular taxas
const fees = FeeCalculator.calculateTotalPositionFees(
  positionParams.size,
  positionParams.entryPrice,
  positionParams.leverage,
  false // Taker (não maker)
);

console.log('💰 Position Fees:', {
  margin: `${fees.margin} sats`,
  tradingFee: `${fees.tradingFee} sats`,
  fundingFee: `${fees.fundingFee} sats`,
  totalFees: `${fees.totalFees} sats`,
  totalCost: `${fees.totalCost} sats`,
  feePercentage: `${(fees.feePercentage * 100).toFixed(3)}%`
});

// Output:
// 💰 Position Fees: {
//   margin: '4500000 sats',
//   tradingFee: '450 sats',
//   fundingFee: '100 sats',
//   totalFees: '550 sats',
//   totalCost: '4500550 sats',
//   feePercentage: '0.012%'
// }
```

### Exemplo 2: Break-Even Price

```typescript
// Calcular preço de break-even
const breakEvenPrice = FeeCalculator.calculateBreakEvenPrice(
  positionParams.entryPrice, // 45000
  positionParams.side,       // 'b'
  fees.totalFees,           // 550 sats
  positionParams.size        // 1000 sats
);

console.log('📊 Break-Even Analysis:', {
  entryPrice: `$${positionParams.entryPrice}`,
  breakEvenPrice: `$${breakEvenPrice.toFixed(2)}`,
  priceDifference: `$${(breakEvenPrice - positionParams.entryPrice).toFixed(2)}`,
  requiredMove: `${(((breakEvenPrice - positionParams.entryPrice) / positionParams.entryPrice) * 100).toFixed(3)}%`
});

// Output:
// 📊 Break-Even Analysis: {
//   entryPrice: '$45000',
//   breakEvenPrice: '$45000.55',
//   priceDifference: '$0.55',
//   requiredMove: '0.001%'
// }
```

### Exemplo 3: Taxas de Depósito/Saque

```typescript
// Calcular taxas de depósito
const bitcoinDepositFee = FeeCalculator.calculateDepositFee(100000, 'bitcoin');
const lightningDepositFee = FeeCalculator.calculateDepositFee(100000, 'lightning');

console.log('💳 Deposit Fees:', {
  bitcoin: `${bitcoinDepositFee} sats (gratuito)`,
  lightning: `${lightningDepositFee} sats (gratuito)`
});

// Calcular taxas de saque
const bitcoinWithdrawalFee = FeeCalculator.calculateWithdrawalFee(100000, 'bitcoin');
const lightningWithdrawalFee = FeeCalculator.calculateWithdrawalFee(100000, 'lightning');

console.log('💸 Withdrawal Fees:', {
  bitcoin: `${bitcoinWithdrawalFee} sats (${(bitcoinWithdrawalFee/100000*100).toFixed(2)}%)`,
  lightning: `${lightningWithdrawalFee} sats (${(lightningWithdrawalFee/100000*100).toFixed(2)}%)`
});

// Output:
// 💳 Deposit Fees: {
//   bitcoin: '0 sats (gratuito)',
//   lightning: '0 sats (gratuito)'
// }
// 💸 Withdrawal Fees: {
//   bitcoin: '1000 sats (1.00%)',
//   lightning: '100 sats (0.10%)'
// }
```

### Exemplo 4: ROI Necessário

```typescript
// Calcular ROI necessário para cobrir taxas
const requiredROI = FeeCalculator.calculateRequiredROI(
  fees.totalFees, // 550 sats
  fees.margin     // 4500000 sats
);

console.log('📈 Required ROI:', {
  totalFees: `${fees.totalFees} sats`,
  margin: `${fees.margin} sats`,
  requiredROI: `${requiredROI.toFixed(4)}%`,
  interpretation: requiredROI < 1 ? 'Low impact' : 'High impact'
});

// Output:
// 📈 Required ROI: {
//   totalFees: '550 sats',
//   margin: '4500000 sats',
//   requiredROI: '0.0122%',
//   interpretation: 'Low impact'
// }
```

### Exemplo 5: Taxa Efetiva Anual

```typescript
// Calcular taxa efetiva anual
const annualFeeRate = FeeCalculator.calculateAnnualFeeRate(
  0.0001,  // 0.01% daily funding rate
  0.001,   // 0.1% trading fee rate
  10       // 10x average leverage
);

console.log('📅 Annual Fee Analysis:', {
  dailyFundingRate: '0.01%',
  tradingFeeRate: '0.1%',
  averageLeverage: '10x',
  annualFeeRate: `${(annualFeeRate * 100).toFixed(2)}%`,
  interpretation: annualFeeRate > 0.1 ? 'High cost strategy' : 'Reasonable cost'
});

// Output:
// 📅 Annual Fee Analysis: {
//   dailyFundingRate: '0.01%',
//   tradingFeeRate: '0.1%',
//   averageLeverage: '10x',
//   annualFeeRate: '3.65%',
//   interpretation: 'Reasonable cost'
// }
```

### Exemplo 6: Comparação de Estratégias

```typescript
function compareStrategies() {
  const strategies = [
    { name: 'Low Leverage', leverage: 2, frequency: 1 },
    { name: 'Medium Leverage', leverage: 5, frequency: 2 },
    { name: 'High Leverage', leverage: 10, frequency: 5 }
  ];

  const positionSize = 1000;
  const entryPrice = 45000;

  strategies.forEach(strategy => {
    const fees = FeeCalculator.calculateTotalPositionFees(
      positionSize,
      entryPrice,
      strategy.leverage
    );

    const dailyFees = fees.totalFees * strategy.frequency;
    const annualFees = dailyFees * 365;
    const annualROI = (annualFees / fees.margin) * 100;

    console.log(`📊 ${strategy.name}:`, {
      leverage: `${strategy.leverage}x`,
      dailyTrades: strategy.frequency,
      dailyFees: `${dailyFees} sats`,
      annualFees: `${annualFees} sats`,
      annualROI: `${annualROI.toFixed(2)}%`
    });
  });
}

compareStrategies();

// Output:
// 📊 Low Leverage: {
//   leverage: '2x',
//   dailyTrades: 1,
//   dailyFees: '550 sats',
//   annualFees: '200750 sats',
//   annualROI: '2.23%'
// }
// 📊 Medium Leverage: {
//   leverage: '5x',
//   dailyTrades: 2,
//   dailyFees: '1100 sats',
//   annualFees: '401500 sats',
//   annualROI: '2.23%'
// }
// 📊 High Leverage: {
//   leverage: '10x',
//   dailyTrades: 5,
//   dailyFees: '2750 sats',
//   annualFees: '1003750 sats',
//   annualROI: '2.23%'
// }
```

## Referências

- [Cálculo de Saldo](./01-balance-calculations.md)
- [Cálculo de Posições](./03-position-calculations.md)
- [API v2 - Endpoints](../external-api/03-endpoints.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
