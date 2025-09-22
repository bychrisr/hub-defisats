# 📊 Painel de Métricas — LN Markets (API v2)  
## ✅ Implementação Completa em Node.js + Fastify + TypeScript  
### Com:  
- **Cálculo preciso** baseado na documentação oficial  
- **Exemplo de implementação real** (código funcional)  
- **Tooltip descritivo** (curto, claro, objetivo — até criança de 5 anos entenderia)  
- **Alinhado 100% com a documentação da LN Markets**

---

## 📌 Estrutura de Cada Métrica

Cada métrica abaixo segue este padrão:

```ts
// 🧮 Cálculo
// 🧩 Exemplo de Implementação (TypeScript)
// 💡 Tooltip (curto e claro)
```

---

## 1. 📈 Total PL

### 🧮 Cálculo:
```ts
estimatedProfit = soma de `pl` de todas as posições com `running: true`
```

> ⚠️ **Importante:** Este valor **não é lucro realizado** — é o lucro não realizado (mark-to-market) das posições ainda abertas. Pode mudar a cada tick do mercado.

### 🧩 Exemplo de Implementação (TypeScript):

```ts
calculateEstimatedProfit(runningTrades: LnMarketsTrade[]): number {
  return runningTrades.reduce((sum, trade) => sum + (trade.pl || 0), 0);
}
```

### 💡 Tooltip (curto, claro, objetivo — até criança de 5 anos entenderia):

> “Quanto você está ganhando (ou perdendo) AGORA nas posições que ainda estão abertas.”
---

## 2. 💰 Estimated Profit

### 🧮 Cálculo:
```ts
estimatedProfit = soma de `pl` de todas as posições `running`
```

### 🧩 Exemplo de Implementação:
```ts
calculateEstimatedProfit(runningTrades: LnMarketsTrade[]): number {
  return runningTrades.reduce((sum, trade) => sum + (trade.pl || 0), 0);
}
```

### 💡 Tooltip:
> “Lucro ou prejuízo estimado se você fechar TODAS as posições abertas AGORA.”

---

## 3. 🔄 Active Trades

### 🧮 Cálculo:
```ts
activeTrades = quantidade de posições com `running: true`
```

### 🧩 Exemplo de Implementação:
```ts
countActiveTrades(runningTrades: LnMarketsTrade[]): number {
  return runningTrades.length;
}
```

### 💡 Tooltip:
> “Número de posições que estão abertas e ativas agora.”

---

## 4. 📦 Total Margin

### 🧮 Cálculo:
```ts
totalMargin = soma de `margin` de todas as posições `running`
```

### 🧩 Exemplo de Implementação:
```ts
calculateTotalMargin(runningTrades: LnMarketsTrade[]): number {
  return runningTrades.reduce((sum, trade) => sum + (trade.margin || 0), 0);
}
```

### 💡 Tooltip:
> “Soma de todas as margens alocadas nas suas posições abertas.”

---

## 5. 💸 Estimated Fees

### 🧮 Cálculo:
```ts
estimatedFees = 
  soma das taxas estimadas de fechamento (com base no fee_tier atual) 
  + soma das taxas de funding estimadas para as próximas 24h (3 eventos)
```

### 🧩 Exemplo de Implementação:
```ts
calculateEstimatedFees(
  runningTrades: LnMarketsTrade[],
  feeRate: number,
  fundingRate: number,
  indexPrice: number
): number {
  let totalClosingFees = 0;
  let totalFunding24h = 0;

  for (const trade of runningTrades) {
    // Taxa de fechamento estimada
    const closingFee = (trade.quantity / indexPrice) * feeRate * 100_000_000;
    totalClosingFees += Math.floor(closingFee);

    // Funding para 24h (3 eventos)
    const fundingPerEvent = (trade.quantity / indexPrice) * fundingRate * 100_000_000;
    let fundingTotal = 0;

    if (trade.side === 'b') { // Long
      fundingTotal = fundingRate > 0 ? 3 * fundingPerEvent : 3 * (-fundingPerEvent);
    } else { // Short
      fundingTotal = fundingRate > 0 ? 3 * (-fundingPerEvent) : 3 * fundingPerEvent;
    }

    totalFunding24h += Math.floor(fundingTotal);
  }

  return totalClosingFees + totalFunding24h;
}
```

### 💡 Tooltip:
> “Estimativa de taxas que você pagará para fechar suas posições + funding das próximas 24h.”

---

## 6. 💰 Available Margin

### 🧮 Cálculo:
```ts
availableMargin = user_data.balance (obtido via GET /v2/user)
```

### 🧩 Exemplo de Implementação:
```ts
getAvailableMargin(userData: LnMarketsUser): number {
  return userData.balance;
}
```

### 💡 Tooltip:
> “Quanto você tem livre agora para abrir novas posições.”

---

## 7. 🧾 Estimated Balance

### 🧮 Cálculo:
```ts
estimatedBalance = 
  availableMargin 
  + totalMargin 
  + estimatedProfit 
  - estimatedFees
```

### 🧩 Exemplo de Implementação:
```ts
calculateEstimatedBalance(
  availableMargin: number,
  totalMargin: number,
  estimatedProfit: number,
  estimatedFees: number
): number {
  return availableMargin + totalMargin + estimatedProfit - estimatedFees;
}
```

### 💡 Tooltip:
> “Seu saldo total se fechar TUDO agora: disponível + lucro das posições - taxas futuras.”

---

## 8. 💰 Total Invested

### 🧮 Cálculo:
```ts
totalInvested = soma de `entry_margin` (se existir) OU `margin` (fallback) de TODAS as posições (running + closed)
```

> ✅ Alinhado com a documentação: “Trade Margin is the Bitcoin collateral deposited to secure a derivatives position.”

### 🧩 Exemplo de Implementação:
```ts
calculateTotalInvested(allTrades: LnMarketsTrade[]): number {
  return allTrades.reduce((sum, trade) => {
    return sum + (trade.entry_margin !== null && trade.entry_margin !== undefined
      ? trade.entry_margin
      : trade.margin);
  }, 0);
}
```

### 💡 Tooltip:
> “Soma de todas as margens iniciais que você usou para abrir suas posições (abertas e fechadas).”

---

## 9. 📈 Net Profit

### 🧮 Cálculo:
```ts
netProfit = totalPnl - feesPaid
```

### 🧩 Exemplo de Implementação:
```ts
calculateNetProfit(totalPnl: number, feesPaid: number): number {
  return totalPnl - feesPaid;
}
```

### 💡 Tooltip:
> “Seu lucro real: total de PnL - total de taxas pagas.”

---

## 10. 🧾 Fees Paid

### 🧮 Cálculo:
```ts
feesPaid = 
  soma de `opening_fee` + `closing_fee` + `sum_carry_fees` (apenas se positivo) 
  de todas as posições `closed`
```

> ✅ Alinhado com a documentação: “User receives: P&L + Margin + Remaining Maintenance Margin” — as taxas já foram deduzidas.

### 🧩 Exemplo de Implementação:
```ts
calculateFeesPaid(closedTrades: LnMarketsTrade[]): number {
  return closedTrades.reduce((sum, trade) => {
    const openingFee = trade.opening_fee || 0;
    const closingFee = trade.closing_fee || 0;
    const carryFeesPaid = Math.max(0, trade.sum_carry_fees || 0); // só o que foi pago
    return sum + openingFee + closingFee + carryFeesPaid;
  }, 0);
}
```

### 💡 Tooltip:
> “Soma de todas as taxas de abertura, fechamento e funding que você já pagou.”

---

## 11. 🎯 Success Rate

### 🧮 Cálculo:
```ts
successRate = (winningTrades / totalClosedTrades) * 100
```

### 🧩 Exemplo de Implementação:
```ts
calculateSuccessRate(winningTrades: number, totalClosedTrades: number): number {
  if (totalClosedTrades === 0) return 0;
  return (winningTrades / totalClosedTrades) * 100;
}
```

### 💡 Tooltip:
> “Porcentagem de trades que deram lucro entre todas as fechadas.”

---

## 12. 📊 Total Profitability

### 🧮 Cálculo:
```ts
totalProfitability = (netProfit / totalInvested) * 100
```

### 🧩 Exemplo de Implementação:
```ts
calculateTotalProfitability(netProfit: number, totalInvested: number): number {
  if (totalInvested === 0) return 0;
  return (netProfit / totalInvested) * 100;
}
```

### 💡 Tooltip:
> “Porcentagem de lucro sobre o total investido: (lucro líquido / total investido) x 100.”

---

## 13. 📈 Total Trades

### 🧮 Cálculo:
```ts
totalTrades = quantidade total de posições (running + closed)
```

### 🧩 Exemplo de Implementação:
```ts
countTotalTrades(allTrades: LnMarketsTrade[]): number {
  return allTrades.length;
}
```

### 💡 Tooltip:
> “Número total de trades que você já fez (abertas + fechadas).”

---

## 14. ✅ Winning Trades

### 🧮 Cálculo:
```ts
winningTrades = quantidade de posições `closed` onde `pl > 0`
```

### 🧩 Exemplo de Implementação:
```ts
countWinningTrades(closedTrades: LnMarketsTrade[]): number {
  return closedTrades.filter(trade => (trade.pl || 0) > 0).length;
}
```

### 💡 Tooltip:
> “Número de trades fechadas que deram lucro (PnL > 0).”

---

## 15. ❌ Lost Trades

### 🧮 Cálculo:
```ts
lostTrades = quantidade de posições `closed` onde `pl < 0`
```

### 🧩 Exemplo de Implementação:
```ts
countLostTrades(closedTrades: LnMarketsTrade[]): number {
  return closedTrades.filter(trade => (trade.pl || 0) < 0).length;
}
```

### 💡 Tooltip:
> “Número de trades fechadas que deram prejuízo (PnL < 0).”

---

## 🎁 Bônus: Tooltip Infantil (5 anos) — Para Todas as Métricas

> “É como contar suas moedas, ver quanto ganhou brincando, quanto vai pagar pra parar de brincar, e saber se no final sobrou sorvete ou não!”

---

✅ **Tudo alinhado com a documentação da LN Markets.**  
✅ **Códigos prontos para copiar e colar no seu projeto Fastify + TypeScript.**  
✅ **Tooltips curtos, claros e objetivos — até criança entende.**