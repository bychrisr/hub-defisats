# 📊 Painel de Métricas — LN Markets (API v2)

> **Objetivo:** Calcular, exibir e explicar métricas essenciais para o trader, com base nos dados retornados pela API da LN Markets.

---

## 1. 🧮 Total PnL (Profit and Loss)

### 💡 Tooltip:
> “Soma de todos os lucros e prejuízos das suas posições fechadas. Verde = lucro, vermelho = prejuízo.”

### 📐 Cálculo:
```python
total_pnl = sum(trade["pl"] for trade in closed_trades)
```

### 🧩 Exemplo de Implementação:
```python
def calculate_total_pnl(closed_trades):
    return sum(trade.get("pl", 0) for trade in closed_trades)
```

---

## 2. 💰 Estimated Profit (Lucro Estimado Atual)

### 💡 Tooltip:
> “Lucro ou prejuízo estimado se você fechar TODAS as posições abertas AGORA.”

### 📐 Cálculo:
```python
estimated_profit = sum(trade["pl"] for trade in running_trades)
```

### 🧩 Exemplo de Implementação:
```python
def calculate_estimated_profit(running_trades):
    return sum(trade.get("pl", 0) for trade in running_trades)
```

---

## 3. 🔄 Active Trades (Posições Ativas)

### 💡 Tooltip:
> “Número de posições que estão abertas e ativas agora.”

### 📐 Cálculo:
```python
active_trades = len(running_trades)
```

### 🧩 Exemplo de Implementação:
```python
def count_active_trades(running_trades):
    return len(running_trades)
```

---

## 4. 📦 Total Margin (Margem Total em Uso)

### 💡 Tooltip:
> “Soma de todas as margens alocadas nas suas posições abertas.”

### 📐 Cálculo:
```python
total_margin = sum(trade["margin"] for trade in running_trades)
```

### 🧩 Exemplo de Implementação:
```python
def calculate_total_margin(running_trades):
    return sum(trade.get("margin", 0) for trade in running_trades)
```

---

## 5. 💸 Estimated Fees (Taxas Estimadas Futuras)

### 💡 Tooltip:
> “Estimativa de taxas que você pagará para fechar suas posições + funding das próximas 24h.”

### 📐 Cálculo:
```python
estimated_fees = (
    sum(calcular_taxa_fechamento_estimada(trade, fee_rate_atual) for trade in running_trades)
    + sum(calcular_funding_estimado_24h(trade, funding_rate, index_price) for trade in running_trades)
)
```

### 🧩 Exemplo de Implementação:
```python
def calculate_estimated_fees(running_trades, fee_rate, funding_rate, index_price):
    total_closing_fees = sum(
        int((trade["quantity"] / get_last_price()) * fee_rate * 100_000_000)
        for trade in running_trades
    )
    total_funding_24h = sum(
        int((trade["quantity"] / index_price) * funding_rate * 100_000_000 * 3)
        for trade in running_trades
    )
    return total_closing_fees + total_funding_24h
```

---

## 6. 💰 Available Margin (Margem Disponível)

### 💡 Tooltip:
> “Quanto você tem livre agora para abrir novas posições.”

### 📐 Cálculo:
```python
available_margin = user_data["balance"]
```

> ⚠️ Obtido diretamente de `GET /v2/user → "balance"`

### 🧩 Exemplo de Implementação:
```python
def get_available_margin(user_data):
    return user_data.get("balance", 0)
```

---

## 7. 🧾 Estimated Balance (Saldo Estimado Total)

### 💡 Tooltip:
> “Seu saldo total se fechar TUDO agora: disponível + lucro das posições - taxas futuras.”

### 📐 Cálculo:
```python
estimated_balance = (
    available_margin
    + total_margin + estimated_profit  # valor bruto das posições
    - estimated_fees                   # menos custos futuros
)
```

### 🧩 Exemplo de Implementação:
```python
def calculate_estimated_balance(available_margin, total_margin, estimated_profit, estimated_fees):
    return available_margin + total_margin + estimated_profit - estimated_fees
```

---

## 8. 💰 Total Invested (Total Investido)

### 💡 Tooltip:
> “Soma de todas as margens iniciais que você usou para abrir suas posições (abertas e fechadas).”

### 📐 Cálculo:
```python
total_invested = sum(
    trade.get("entry_margin", trade.get("margin", 0))
    for trade in all_trades  # running + closed
)
```

> ✅ Usa `entry_margin` se disponível, senão usa `margin` como fallback.

### 🧩 Exemplo de Implementação:
```python
def calculate_total_invested(all_trades):
    return sum(
        trade.get("entry_margin") if trade.get("entry_margin") is not None else trade.get("margin", 0)
        for trade in all_trades
    )
```

---

## 9. 📈 Net Profit (Lucro Líquido)

### 💡 Tooltip:
> “Seu lucro real: total de PnL - total de taxas pagas.”

### 📐 Cálculo:
```python
net_profit = total_pnl - total_fees_paid
```

### 🧩 Exemplo de Implementação:
```python
def calculate_net_profit(total_pnl, total_fees_paid):
    return total_pnl - total_fees_paid
```

---

## 10. 🧾 Fees Paid (Taxas Pagas)

### 💡 Tooltip:
> “Soma de todas as taxas de abertura, fechamento e funding que você já pagou.”

### 📐 Cálculo:
```python
fees_paid = sum(
    trade["opening_fee"] + trade["closing_fee"] + max(0, trade["sum_carry_fees"])
    for trade in closed_trades
)
```

> ⚠️ `sum_carry_fees` positivo = pagou funding; negativo = recebeu → só somamos o que foi pago.

### 🧩 Exemplo de Implementação:
```python
def calculate_fees_paid(closed_trades):
    return sum(
        trade.get("opening_fee", 0) +
        trade.get("closing_fee", 0) +
        max(0, trade.get("sum_carry_fees", 0))
        for trade in closed_trades
    )
```

---

## 11. 🎯 Success Rate (Taxa de Acerto)

### 💡 Tooltip:
> “Porcentagem de trades que deram lucro entre todas as fechadas.”

### 📐 Cálculo:
```python
success_rate = (winning_trades / total_trades_closed) * 100 if total_trades_closed > 0 else 0
```

### 🧩 Exemplo de Implementação:
```python
def calculate_success_rate(winning_trades, total_trades_closed):
    if total_trades_closed == 0:
        return 0
    return (winning_trades / total_trades_closed) * 100
```

---

## 12. 📊 Total Profitability (Rentabilidade Total)

### 💡 Tooltip:
> “Porcentagem de lucro sobre o total investido: (lucro líquido / total investido) x 100.”

### 📐 Cálculo:
```python
total_profitability = (net_profit / total_invested) * 100 if total_invested > 0 else 0
```

### 🧩 Exemplo de Implementação:
```python
def calculate_total_profitability(net_profit, total_invested):
    if total_invested == 0:
        return 0
    return (net_profit / total_invested) * 100
```

---

## 13. 📈 Total Trades (Total de Operações)

### 💡 Tooltip:
> “Número total de trades que você já fez (abertas + fechadas).”

### 📐 Cálculo:
```python
total_trades = len(all_trades)
```

### 🧩 Exemplo de Implementação:
```python
def count_total_trades(all_trades):
    return len(all_trades)
```

---

## 14. ✅ Winning Trades (Trades Vencedoras)

### 💡 Tooltip:
> “Número de trades fechadas que deram lucro (PnL > 0).”

### 📐 Cálculo:
```python
winning_trades = sum(1 for trade in closed_trades if trade["pl"] > 0)
```

### 🧩 Exemplo de Implementação:
```python
def count_winning_trades(closed_trades):
    return sum(1 for trade in closed_trades if trade.get("pl", 0) > 0)
```

---

## 15. ❌ Lost Trades (Trades Perdedoras)

### 💡 Tooltip:
> “Número de trades fechadas que deram prejuízo (PnL < 0).”

### 📐 Cálculo:
```python
lost_trades = sum(1 for trade in closed_trades if trade["pl"] < 0)
```

### 🧩 Exemplo de Implementação:
```python
def count_lost_trades(closed_trades):
    return sum(1 for trade in closed_trades if trade.get("pl", 0) < 0)
```

---

# ✅ Exemplo de Uso Completo (Python)

```python
# Suponha que você já tenha obtido:
# - user_data: resposta de GET /v2/user
# - running_trades: GET /v2/futures/trades?type=running
# - closed_trades: GET /v2/futures/trades?type=closed
# - ticker_data: GET /v2/futures/ticker → lastPrice, index, carryFeeRate
# - fee_rate_atual: mapeado a partir de user_data["fee_tier"]

all_trades = running_trades + closed_trades

# Cálculos
total_pnl = calculate_total_pnl(closed_trades)
estimated_profit = calculate_estimated_profit(running_trades)
active_trades = count_active_trades(running_trades)
total_margin = calculate_total_margin(running_trades)
available_margin = get_available_margin(user_data)
estimated_fees = calculate_estimated_fees(running_trades, fee_rate_atual, ticker_data["carryFeeRate"], ticker_data["index"])
estimated_balance = calculate_estimated_balance(available_margin, total_margin, estimated_profit, estimated_fees)
total_invested = calculate_total_invested(all_trades)
fees_paid = calculate_fees_paid(closed_trades)
net_profit = calculate_net_profit(total_pnl, fees_paid)
total_trades = count_total_trades(all_trades)
winning_trades = count_winning_trades(closed_trades)
lost_trades = count_lost_trades(closed_trades)
success_rate = calculate_success_rate(winning_trades, len(closed_trades))
total_profitability = calculate_total_profitability(net_profit, total_invested)

# Exibir
print(f"Total PnL: {total_pnl} sats")
print(f"Estimated Profit: {estimated_profit} sats")
print(f"Active Trades: {active_trades}")
print(f"Total Margin: {total_margin} sats")
print(f"Available Margin: {available_margin} sats")
print(f"Estimated Fees: {estimated_fees} sats")
print(f"Estimated Balance: {estimated_balance} sats")
print(f"Total Invested: {total_invested} sats")
print(f"Net Profit: {net_profit} sats")
print(f"Fees Paid: {fees_paid} sats")
print(f"Success Rate: {success_rate:.2f}%")
print(f"Total Profitability: {total_profitability:.2f}%")
print(f"Total Trades: {total_trades}")
print(f"Winning Trades: {winning_trades}")
print(f"Lost Trades: {lost_trades}")
```

---