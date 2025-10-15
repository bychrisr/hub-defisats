# Docs LN Markets (API v2)

# 1. Get Started

## 1.1 How to Deposit Funds?

You can only deposit **BTC**, either via **on-chain** transaction or through a **Lightning Network** payment.

---

## 1.2 What Can I Trade?

You can trade **LNM Futures** and **Bitcoin Options**. Your position is opened immediately after paying a margin in BTC.

---

## 1.3 What Is the Margin?

### 1.3.1 Trade Margin

Trade margin is the **Bitcoin collateral** deposited to secure a derivatives position. On LN Markets, each position has its own dedicated trade margin, allowing traders to manage multiple positions with different margin policies.

For a given trade margin and leverage, the position size (quantity) and liquidation price are automatically calculated:

```
Quantity = (Trade Margin × Leverage) / Price

```

> Trade margin is denominated in satoshis (sats), where 1 BTC = 100,000,000 sats.
> 

---

### 1.3.2 Maintenance Margin

The maintenance margin is the **minimum balance required** to keep a position or order active. It includes a reserve to cover the costs of opening and closing the position.

---

### 1.3.3 Total Margin

The total margin required to open a position consists of:

```
Total Margin = Trade Margin + Maintenance Margin

```

- When orders are executed, fees are deducted from the maintenance margin.
- For market orders, fees are deducted immediately upon placement due to instant execution.

---

## 1.4 Trading Fees

Trading fees are **tier-based**, decreasing as your trading volume increases.

Your tier is based on your **30-day cumulative volume** — check your Profile to view your current Tier.

### 1.4.1 Current Tiers:

| Tier | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
| --- | --- | --- | --- | --- |
| 30-day volume | $0 | >$250k | >$1,000k | >$5,000k |
| Trading Fee | 0.1% | 0.08% | 0.07% | 0.06% |

> Check your Profile to view your current Tier.
> 

---

### 1.4.2 Trading Fee Calculation Process

### Initial Setup:

```
Total fee paid = 0
Maintenance margin = Opening fee reserved + Closing fee reserved

Opening fee reserved = (Quantity / Entry price) × Tier 1 fee
Closing fee reserved = (Quantity / Initial liquidation price) × Tier 1 fee

```

### At Position Opening:

```
Total fee paid = Opening fee
Maintenance margin = Opening fee reserved + Closing fee reserved - Opening fee

```

*(Opening fee reserved and opening fee may differ if tier changes)*

### At Position Closing:

```
Total fee paid = Opening fee + Closing fee
Maintenance margin = Opening fee reserved + Closing fee reserved - (Opening fee + Closing fee)

```

*(Reserved fees may differ if tier changes)*

> User receives: P&L + Margin + Remaining Maintenance Margin
> 

---

### 1.4.2.1 Example:

**Long position with:**

- Quantity: $60
- Trade margin: 10,000 sats
- Leverage: 10x
- Entry price: $60,000
- Initial liquidation price: $54,545

**Calculation:**

```
Opening fee reserved = 100,000,000 × (60 / 60,000) × 0.1% = 100 sats
Closing fee reserved = 100,000,000 × (60 / 54,545) × 0.1% ≈ 110 sats

```

➡️ **At opening (no tier change):**

Total fee paid = 100 sats

Maintenance margin = 100 + 110 - 100 = 110 sats

➡️ **At closing (no tier change):**

Total fee paid = 100 + 110 = 210 sats

Maintenance margin = 0

---

## 1.5 Funding Fees

Funding fees in perpetual futures maintain the contract price close to the underlying asset’s spot price. Without an expiry date, this mechanism aligns the contract price with the market price.

The funding rate is an aggregation of individual rates, using the same methodology employed to construct the price index.

---

### 1.5.1 Funding Rate Calculation Example:

| Exchange | BitMEX | Bybit | Binance | Deribit | LNM |
| --- | --- | --- | --- | --- | --- |
| Weight | 25% | 25% | 25% | 25% | — |
| Funding Rate | 0.02% | 0.05% | 0.03% | 0.05% | 0.0375% |

---

### 1.5.2 How It Works

Funding fees are payments exchanged between traders holding **long (buy)** and **short (sell)** positions:

- **Positive funding rate:**
    - Longs pay the fee
    - Shorts receive the fee
- **Negative funding rate:**
    - Longs receive the fee
    - Shorts pay the fee

> This mechanism helps maintain price alignment and indicates market sentiment:
> 
> - Positive rate → bullish market
> - Negative rate → bearish market

---

### 1.5.3 Funding Fee Details:

- Updated every **8 hours** (00:00, 08:00, 16:00 UTC)
- Applied **only to open positions**
- Deducted from position margin (if paying)
- Added to your balance (if receiving)
- Visible in the **Funding** section of your wallet

---

### 1.5.3.1 Example:

**Funding rate: +0.01% (positive)**

**Quantity: $10,000**

**BTCUSD rate: $60,000**

```
Funding fee = (10,000 / 60,000) × 0.01% × 100,000,000 = 1,667 sats

```

➡️ **Long:** pays 1,667 sats

➡️ **Short:** receives 1,667 sats

**Funding rate: -0.01% (negative)**

➡️ **Long:** receives 1,667 sats

➡️ **Short:** pays 1,667 sats

---

## 1.6 How to Withdraw Funds?

You can withdraw **BTC**, either via **on-chain** transaction or through a **Lightning Network** payment.

> ⚠️ On-chain Bitcoin withdrawals are processed manually.
> 

---

## 1.7 Are There Trading Limits on LN Markets?

Yes, currently:

- **Maximum per trade:** USD 500,000 (quantity traded, each contract = USD 1)
- **Maximum per account:** USD 10,000,000

---

## 1.8 Are There Any Geographical Restrictions to Use LN Markets?

Yes. There is an **IP address block for US residents**.

---

## 1.9 Disclaimer

> LN Markets is an alpha software under active development since March 11, 2020.
> 
> 
> Please use with care. **LN Markets comes with no guarantees** — use it preferably on Testnet or at your own risk.
> 

# 2. Futures

## 2.1 LNM Futures Overview

LNM Futures is a derivative perpetual futures contract whose underlying asset is a weighted basket of BTCUSD perpetual futures from multiple exchanges, such as Bybit, Binance, Deribit, and BitMEX.

It is designed to capture the performance of various BTC/USD perpetual contracts across different exchanges or platforms.

---

## 2.2 Key Characteristics

### 2.2.1 Diversification of Exchange Risk

This construction helps mitigate risks associated with any single exchange. If a particular exchange experiences disruptions, LNM Futures would still be exposed to the performance of BTC/USD on other exchanges.

### 2.2.2 Reduced Impact of Funding Rates

Since perpetual futures have a funding rate to maintain price parity with the spot market, an aggregated basket balances out extreme funding rate variations across platforms.

### 2.2.3 Efficient Exposure to Market-Wide BTC/USD

Traders have a single product that gives them exposure to a broader market view of BTC, instead of betting on the price from a single exchange, which might have unique influences (liquidity, trader sentiment, etc.).

### 2.2.4 Improved Liquidity

Since the trade is executed across a basket of order books, LN Markets can provide significantly better liquidity than what a trader would typically find on a single exchange.

---

## 2.3 Price Reference

The **BTCUSD Basket Last Price** serves as the benchmark for calculating profit and loss (P&L) and triggering events such as liquidation, take profit, or stop loss. It is a weighted average of the last traded prices of BTC/USD perpetual futures from the exchanges included in LN Markets’ selected basket.

### 2.3.1 Current Basket Composition:

| Exchange | Weight |
| --- | --- |
| BitMEX | 20% |
| Bybit | 30% |
| Deribit | 10% |
| Binance | 40% |

> This composition may be modified without prior notice.
> 

---

## 2.4 Market Liquidity

LN Markets provides continuous pricing for buying or selling any quantity of LNM Futures. However, liquidity available for different quantities can fluctuate based on market conditions. This means the price quoted by LN Markets may vary depending on trade size — larger quantities may impact the offered price.

To help traders understand this variation, the **volume ladder** is a visual tool that displays immediate liquidity available on LN Markets. It shows how much can be bought or sold at different price levels in real time, giving insight into how order size might affect price.

> Any trading event is affected by market liquidity.
> 

---

### 2.4.1 Liquidation Example:

Consider a trader holding a **long position worth USD 150,000**, with a liquidation level set at **$92,000**. The Price Reference (determining position value) is currently at **$92,030**. The volume ladder indicates the highest available bid for this quantity is at **$92,010**.

If market liquidity changes and the bid price for this quantity drops below the liquidation threshold of **$92,000**, the position is automatically liquidated — as the market can no longer support the position without additional margin.

This ensures the platform minimizes losses by closing positions before their value falls further below margin requirements, highlighting how liquidity variations impact large positions near critical thresholds.

---

## 2.5 LNM Futures Contract Specification

| Description | Value |
| --- | --- |
| Max Leverage | x100 |
| Max Quantity per Trade | USD 500,000 |
| Max Quantity per Account | USD 10,000,000 |

---

## 2.6 Leverage

Leverage in trading is an investment strategy allowing exposure to a financial asset with smaller upfront capital (margin).

> Leverage is a double-edged sword:
> 
> - With leverage of 1x: P&L moves 1:1 with underlying asset.
> - With leverage of 2x (long): if asset ↑1%, P&L ↑2%; if asset ↓1%, P&L ↓2%.
> - Reverse for short positions.

On LN Markets, leverage is limited to **x100**.

---

## 2.7 Margin

### 2.7.1 Margin Modes

When trading derivatives, you can choose between two margin modes: **Isolated Margin** and **Cross Margin**. Understanding the difference is essential for risk management.

---

### 2.7.2 Isolated Margin

### 2.7.2.1 Definition

In Isolated Margin mode, the margin allocated to a specific position is kept separate from the rest of your account balance. Only the funds assigned to that position are at risk.

### 2.7.2.2 How It Works

- Each position has its own margin allocation.
- If the position moves against you and margin is depleted, only that position’s funds are liquidated.
- Other funds and positions remain unaffected.
- You can manually add or remove margin per position.
    - Adding margin → decreases leverage.
    - Removing margin → increases leverage.

### 2.7.2.3 Use Case

Ideal for traders who want to strictly limit risk on individual trades and prevent one position’s losses from affecting the entire account.

### 2.7.2.4 Example

You open a long position with **100,000 sats** in Isolated Margin. If the market moves against you and margin is exhausted, only the 100,000 sats are at risk — other funds remain safe.

---

### 2.7.3 Cross Margin

### 2.7.3.1 Definition

In Cross Margin mode, all available funds in your cross margin account are shared across all open positions. Your entire cross margin account balance acts as a buffer to prevent liquidation.

### 2.7.3.2 How It Works

- Must first transfer funds from available balance to cross margin account.
- Margin is shared among all open positions.
- Leverage is fixed when opening each position — does not change based on total account margin.
- Cross margin account serves as collateral buffer but does not affect individual position leverage.
- If one position is losing, platform uses available funds from cross margin account to maintain margin and avoid liquidation.
- If total cross margin account balance is depleted, all positions may be liquidated.

> Key distinction: Cross margin account balance ≠ running margin. Running margin is actual margin allocated to active positions; cross margin account acts as additional collateral.
> 

### 2.7.3.3 Use Case

Suitable for experienced traders who want to maximize capital efficiency and are comfortable with the risk that losses from one position can affect the entire account.

### 2.7.3.4 Example

You have **1,000,000 sats** in your cross margin account and open a position with **10x leverage** using **100,000 sats** as running margin. The position’s leverage remains 10x regardless of your remaining 900,000 sats. If the position moves against you, the platform uses remaining funds to support it. If total account balance drops too low, all positions are at risk.

---

### 2.7.4 Summary Table: Isolated vs Cross Margin

| Feature | Isolated Margin | Cross Margin |
| --- | --- | --- |
| Margin Allocation | Per position | Shared across all positions |
| Leverage Control | Adjustable per position | Fixed when position opened |
| Collateral Source | Only position margin | Entire account balance |
| Risk Exposure | Limited to position margin | Entire account balance at risk |
| Liquidation Impact | Only affects that position | Can affect all positions |
| Capital Efficiency | Lower (funds locked per position) | Higher (shared collateral) |

> 💡 Tip: Choose the margin mode that best fits your risk tolerance and trading style. You can switch between Isolated and Cross Margin before opening a position.
> 

---

## 2.8 Trade Margin

When buyers and sellers enter a Bitcoin derivatives position, exchanges require them to deposit and maintain Bitcoin as collateral — this is called **trade margin**.

For a given trade margin and leverage, quantity and liquidation price are automatically computed:

```
Quantity = (Trade Margin × Leverage) / Price

```

On LN Markets, each trade margin is dedicated to a specific position — allowing different positions with different margin policies.

> Trade margin is expressed in sats (1 BTC = 100,000,000 satoshis).
> 

---

## 2.9 Maintenance Margin

The **maintenance margin** is the minimum balance required to keep a position or order active. It includes a reserve to cover costs of opening and closing the position.

---

## 2.10 Total Margin

The total margin required to open a position consists of:

```
Total Margin = Trade Margin + Maintenance Margin

```

- When orders are executed, fees are deducted from the maintenance margin.
- For market orders, fees are deducted immediately upon placement due to instant execution.

---

## 2.11 Trading Fees

### 2.11.1 Trading Fees Overview

Trading fees are tier-based, decreasing as your trading volume increases.

Your tier is based on your **30-day cumulative volume** — check your Profile to view your current Tier.

### 2.11.1.1 Current Tiers:

| Tier | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
| --- | --- | --- | --- | --- |
| 30-day volume | $0 | >$250k | >$1,000k | >$5,000k |
| Trading Fee | 0.1% | 0.08% | 0.07% | 0.06% |

---

### 2.11.2 Trading Fee Calculation Process

### 2.11.2.1 Initial Setup:

```
Total fee paid = 0
Maintenance margin = Opening fee reserved + Closing fee reserved

Opening fee reserved = (Quantity / Entry price) × Tier 1 fee
Closing fee reserved = (Quantity / Initial liquidation price) × Tier 1 fee

```

### 2.11.2.2 At Position Opening:

```
Total fee paid = Opening fee
Maintenance margin = Opening fee reserved + Closing fee reserved - Opening fee

```

*(Opening fee reserved and opening fee may differ if tier changes)*

### 2.11.2.3 At Position Closing:

```
Total fee paid = Opening fee + Closing fee
Maintenance margin = Opening fee reserved + Closing fee reserved - (Opening fee + Closing fee)

```

*(Reserved fees may differ if tier changes)*

> User receives: P&L + Margin + Remaining Maintenance Margin
> 

---

### 2.11.2.4 Example:

**Long position with:**

- Quantity: $60
- Trade margin: 10,000 sats
- Leverage: 10x
- Entry price: $60,000
- Initial liquidation price: $54,545

**Calculation:**

```
Opening fee reserved = 100,000,000 × (60 / 60,000) × 0.1% = 100 sats
Closing fee reserved = 100,000,000 × (60 / 54,545) × 0.1% ≈ 110 sats

```

➡️ **At opening (no tier change):**

Total fee paid = 100 sats

Maintenance margin = 100 + 110 - 100 = 110 sats

➡️ **At closing (no tier change):**

Total fee paid = 100 + 110 = 210 sats

Maintenance margin = 0

---

## 2.12 Funding Fees

Funding fees in perpetual futures maintain the contract price close to the underlying asset’s spot price. Without an expiry date, this mechanism aligns the contract price with the market price.

The funding rate is an aggregation of individual rates, using the same methodology employed to construct the price index.

---

### 2.12.1 Funding Rate Calculation Example:

| Exchange | BitMEX | Bybit | Binance | Deribit | LNM |
| --- | --- | --- | --- | --- | --- |
| Weight | 25% | 25% | 25% | 25% | — |
| Funding Rate | 0.02% | 0.05% | 0.03% | 0.05% | 0.0375% |

---

### 2.12.2 How It Works

Funding fees are payments exchanged between traders holding **long (buy)** and **short (sell)** positions:

- **Positive funding rate:**
    - Longs pay the fee
    - Shorts receive the fee
- **Negative funding rate:**
    - Longs receive the fee
    - Shorts pay the fee

> This mechanism helps maintain price alignment and indicates market sentiment:
> 
> - Positive rate → bullish market
> - Negative rate → bearish market

---

### 2.12.3 Funding Fee Details:

- Updated every **8 hours** (00:00, 08:00, 16:00 UTC)
- Applied **only to open positions**
- Deducted from position margin (if paying)
- Added to your balance (if receiving)
- Visible in the **Funding** section of your wallet

---

### 2.12.3.1 Example:

**Funding rate: +0.01% (positive)**

**Quantity: $10,000**

**BTCUSD rate: $60,000**

```
Funding fee = (10,000 / 60,000) × 0.01% × 100,000,000 = 1,667 sats

```

➡️ **Long:** pays 1,667 sats

➡️ **Short:** receives 1,667 sats

**Funding rate: -0.01% (negative)**

➡️ **Long:** receives 1,667 sats

➡️ **Short:** pays 1,667 sats

> Users can track all funding fees paid/received in the Funding section of their wallet.
> 

---

## 2.13 How To...

### 2.13.1 Add Margin

You can add margin to running positions at any time by clicking the **“+”** button in the Actions section of the Running Positions blotter.

> Adding margin reduces leverage, decreasing liquidation risk.
> 

### 2.13.1.1 Effects of Adding Margin:

- Leverage decreases
- Liquidation price moves further from current price
- Account balance decreases by added amount

---

### 2.13.2 Cash In

You can cash in from running positions at any time by clicking the **“-”** button in the Actions section of the Running Positions blotter.

> Funds are first deducted from P&L (if positive), then from margin. Cashing in increases leverage — not all margin may be available due to leverage limits.
> 

### 2.13.2.1 Effects of Cashing In:

**From positive P&L:**

- Entry Price changes
- P&L decreases

**From margin:**

- Liquidation price moves closer to current price
- Leverage increases

**In both cases:**

- Account balance increases by removed amount

---

### 2.13.3 Group Trades

You can organize trades in the Running Blotter for efficient management. When grouped, you can set take profit, stop loss, or close orders that apply to the entire group. You can ungroup trades at any time.

---

## 2.14 What Is...?

### 2.14.1 Index Price

The **Index Price** is a weighted average of the last price of the underlying asset’s market consensus price for each constituent exchange.

---

### 2.14.2 Entry Price

The price at which a position is opened.

---

### 2.14.3 Exit Price

The price at which a position is closed.

---

### 2.14.4 Quantity

The number of contracts you want to trade.

> On LN Markets, each contract is worth $1. Margin and P&L are expressed in sats (1 BTC = 100,000,000 sats).
> 

---

### 2.14.5 Liquidation

Forced closure of a running position. Occurs when:

- For **long positions**: Futures price falls below liquidation level.
- For **short positions**: Futures price rises above liquidation level.

---

### 2.14.6 Margin Ratio

When margin ratio reaches **100%**, your position is liquidated.

```
Margin Ratio = (Maintenance Margin - Opening Fee) / (Maintenance Margin - Opening Fee + Current Margin + P&L)

```

---

### 2.14.7 Market Order

A buy or sell order executed immediately at the current ask or bid price.

---

### 2.14.8 Limit Order

An order to buy or sell at a specific price. Not guaranteed to execute — can be canceled anytime before execution.

---

### 2.14.9 Take Profit

An optional order specifying the exact price to close an open position for profit.

- For **buy orders**: take profit must be **above** current price.
- For **sell orders**: take profit must be **below** current price.

---

### 2.14.10 Stop Loss

An optional order specifying the exact price to close an open position to limit loss.

- For **buy orders**: stop loss must be **above liquidation price** and **below bid price**.
- For **sell orders**: stop loss must be **above offer price** and **below liquidation price**.

---

### 2.14.11 Balance

Sum of:

- Margin available (to enter future positions)
- Margin used (in open positions)
- P&L in open positions

---

### 2.14.12 Margin Available

The amount you can use to enter future trading positions.

# 2. Options

## 2.1 What Is an Option?

An option is a financial contract that gives the buyer the right, but not the obligation, to buy or sell an underlying asset. The option contract specifies:

- **Strike price**: the price at which the underlying asset can be bought or sold upon exercise.
- **Expiry date**: the date when the option contract ends.

The price of an option is called the **premium**. It is typically calculated using the **Black-Scholes model**, which requires two key market parameters:

- Forward price of the underlying asset at expiry
- Volatility

On LN Markets, this premium is referred to as **margin**, by analogy with Futures.

---

## 2.2 Why Trade Options?

Trading options is particularly useful in **choppy or volatile markets**. Unlike futures — which are path-dependent and can be liquidated before the market moves in your favor — options buyers only care about the **price of the underlying asset at expiry**.

This makes options ideal for traders who:

- Expect volatility but are unsure of direction → can buy a **straddle**
- Want defined risk (maximum loss = premium paid)
- Seek non-linear payoffs based on price movement at expiry

---

## 2.3 What Are the Characteristics of the Options Listed on LN Markets?

When designing the options offering, LN Markets prioritized **simplicity and accessibility**. Key characteristics include:

- ✅ **Buy-only**: You can only buy options (not sell/write them).
- ✅ **Two types available**:
    - **Call option**: Gives the right to enter a **long position**.
    - **Put option**: Gives the right to enter a **short position**.
    - **Straddle**: Combination of a call and a put at the same strike — ideal for betting on volatility regardless of direction.
- ⏱️ **24-hour expiry**: All options expire exactly 24 hours after opening (but can be closed anytime before expiry).
- 🎯 **Underlying asset**: The **LNM Perpetual Future**.
- 📈 **Forward price**: The price of the future discounted to expiry. Since expiry is only 24h away, the forward is very close (often equal) to the current futures price.

> 💡 LN Markets quotes options with BTC as the domestic currency (like inverse futures).
> 
> - Forward and Strike prices are internally calculated in **USD/BTC**, but displayed as **BTC/USD** for user simplicity.

---

### 2.3.1 Strike Selection

LN Markets lists the following strikes:

- **Calls**: Next thousand **down**, and two next thousands **up**.
- **Puts**: Next thousand **up**, and two next thousands **down**.
- **Straddles**: Two strikes **common to both calls and puts**.

### 2.3.1.1 Example:

If current bid = $45,684.50 and offer = $45,749.86:

- **Call strikes**: $45,000 | $46,000 | $47,000
- **Put strikes**: $46,000 | $45,000 | $44,000
- **Straddle strikes**: $45,000 | $46,000

---

### 2.3.2 Key Metrics Displayed

- **Volatility (%)**: Implied volatility computed from market prices — indicates expected movement of the underlying.
- **Delta**: Risk metric estimating how much the option’s price changes per 1-unit move in the underlying.
→ Expressed in **USD** (since BTC is domestic currency).
→ Represents the number of BTCUSD futures contracts needed to hedge the position.
- **Margin**: The **premium + maintenance margin**, expressed in **sats**.
→ Deducted from **Margin Available** and added to **Margin Used**.
- **Expiry**: Exact timestamp — 24 hours after position opening.

---

## 2.4 How to Trade Options?

To trade options on LN Markets:

1. **Choose your direction**:
    - Buy a **Call** → if you expect price to rise.
    - Buy a **Put** → if you expect price to fall.
    - Buy a **Straddle** → if you expect high volatility (direction unknown).
2. **Set Quantity**: Enter the notional amount in **USD** (e.g., $100).
3. **Select Strike Price**: Pick from available strikes.
4. **Click “Buy”**: Pay the required margin (in sats) → position is opened.

---

## 2.5 How to Follow the Life of an Option?

After purchase, your option appears in the **Running section** of the deal blotter. Each option displays:

- **Type**: Call or Put
- **Quantity**: in USD
- **Strike**: Chosen strike price
- **Expiry**: Timestamp of expiry
- **Delta**: Current delta of the position
- **Breakeven**: Price at which P&L = 0
- **Volatility**: Current implied volatility (%)
- **Margin**: Paid premium + maintenance
- **P&L**: Mark-to-Market value minus margin paid
→ Mark-to-Market = option’s theoretical value using current volatility, all else constant
- **Maintenance Margin**: Minimum amount to keep position open (includes closing fees)

In the **Risk section** (lower left of screen), you can monitor:

- **Global P&L**: Sum of all options’ P&L
- **Global Delta**: Sum of all options’ Deltas

---

## 2.6 What Is the Option Payoff at Expiry?

At expiry, an option is either:

- **In-The-Money (ITM)**: Strike price is favorable vs. underlying price → has intrinsic value.
- **Out-of-The-Money (OTM)**: Strike price is unfavorable → expires worthless.

---

### 2.6.1 Payoff Formulas (BTC as domestic currency)

> All payoffs calculated in sats.
> 
> 
> Formula: `Payoff = (1 / Strike - 1 / Underlying) × Quantity × 100,000,000`
> 

---

### 2.6.1.1 Long Call Example:

- Quantity: $1
- Margin paid: 30 sats
- Strike: $42,000

✅ **If underlying at expiry = $43,000 (ITM):**

Payoff = (1/42,000 - 1/43,000) × 1 × 100,000,000 ≈ **55 sats**

P&L = 55 - 30 = **+25 sats**

❌ **If underlying at expiry = $41,000 (OTM):**

Payoff = 0 (since 1/42,000 < 1/41,000 → no intrinsic value)

P&L = 0 - 30 = **-30 sats**

---

### 2.6.1.2 Long Put Example:

- Quantity: $1
- Margin paid: 30 sats
- Strike: $42,000

✅ **If underlying at expiry = $41,000 (ITM):**

Payoff = (1/41,000 - 1/42,000) × 1 × 100,000,000 ≈ **55 sats**

P&L = 55 - 30 = **+25 sats**

❌ **If underlying at expiry = $43,000 (OTM):**

Payoff = 0

P&L = 0 - 30 = **-30 sats**

> For quantity = $100 → multiply payoff by 100 → e.g., 55 sats × 100 = 5,500 sats.
> 

---

## 2.7 What Happens at the Option Expiry?

At expiry:

- If the option is **In-The-Money (ITM)**:
→ You receive: **P&L + Initial Margin Paid**
    
    → This amount is added to your **Margin Available**
    
- If the option is **Out-of-The-Money (OTM)**:
→ You lose the entire margin paid
    
    → Position closes with zero value
    

> No action is required — settlement is automatic.
> 

# 2.3 Synthetic USD

## 2.3.1 Overview

Click on **Swap** to easily convert your BTC balance to a **synthetic USD balance** — and vice versa. This enables you to better manage your risk.

When you swap your BTC balance for synthetic USD, what happens under the hood is that you **short a BTCUSD futures contract with 1x leverage**.

> We do not charge funding fees for this service.
> 

---

## 2.3.2 Convert BTC to Synthetic USD

### 2.3.2.1 Example 1:

- Your BTC balance: **1,000,000 sats**
- BTCUSD bid-offer: **19,995 – 20,005 USD**

→ Convert to synthetic USD:

```
1,000,000 × 19,995 ÷ 100,000,000 = 199.95 USD (synthetic balance)

```

---

### 2.3.2.2 Example 2:

- Your synthetic USD balance: **100 USD**
- BTCUSD bid-offer: **19,995 – 20,005 USD**

→ Convert back to BTC:

```
(100 ÷ 20,005) × 100,000,000 = 499,875 sats (BTC balance)

```

# 2.4 Lightning Network

## 2.4.1 What Is the Lightning Network?

The Lightning Network (LN) is a payment protocol that operates on top of Bitcoin — it is a network of Bitcoin nodes designed to enable instant transfer of bitcoins between participants.

The Lightning Network leverages Bitcoin smart contracts to minimize the need for blockchain transactions. Before LN’s deployment in early 2018, sending bitcoins required recording each transaction on the Bitcoin blockchain — a process that, while secure, is slower and more expensive.

In contrast, Lightning transactions do not need to be recorded on the Bitcoin blockchain to guarantee their existence, validity, or the sender’s solvency — resulting in minimal transaction fees and near-instant execution.

---

## 2.4.2 How Does the Lightning Network Work?

Suppose Alice and Bob want to start using the Lightning Network for fast, low-cost bitcoin payments. They can open a **bidirectional payment channel** by following these steps:

1. **Create a multi-signature wallet** — a wallet accessible by both Alice and Bob using their respective private keys.
2. **Perform a funding transaction** — deposit a certain amount of bitcoin into this shared wallet.

Once the channel is open, Alice and Bob can send each other funds via **commitment transactions**. The total value of all commitment transactions cannot exceed the initial funding amount.

The channel can remain open indefinitely. Commitment transactions do not affect on-chain bitcoin balances until the channel is closed via a **settlement transaction**.

---

### 2.4.2.1 From Channels to Network

Now, suppose Alice wants to send bitcoin to Charlie — but they don’t have a direct channel. However, Bob has an open channel with Charlie.

If Alice’s channel with Bob is still open, her Lightning node can **route the payment through Bob’s node** to reach Charlie.

If Alice and Bob’s channel is closed, Alice’s node will attempt to find another route through other connected nodes.

If no route exists, Alice and Charlie must open a **direct bidirectional payment channel**.

---

## 2.4.3 What Is a Lightning Network Node?

A Lightning Network node is software that connects to the Lightning Network to send and receive bitcoin from other nodes.

The Lightning Network is a peer-to-peer network composed of these interconnected nodes. The more nodes participating — and the more payment channels they open — the greater the network’s total liquidity, enabling more users to send larger amounts to more recipients.

A Lightning node is responsible for:

- Monitoring the underlying Bitcoin blockchain
- Interacting with other nodes to route payments

All **non-custodial Lightning wallets** run their own Lightning node.

---

## 2.4.4 What Is a Lightning Network Wallet?

A wallet is the most common user interface for interacting with Bitcoin and Lightning Networks — much like a web browser is for HTTP.

- A **Bitcoin wallet** enables you to send and receive bitcoin.
- A **Lightning-enabled wallet** allows you to interact with the Lightning Network.

Wallets manage public/private keys, track balances, and create/sign transactions. Keys are typically stored on the user’s device (computer or smartphone). **Possession of the private key is the only requirement to spend bitcoin.**

---

### 2.4.4.1 Custodial vs Non-Custodial Wallets

- **Custodial wallet**: Private keys are held by a third party → the third party controls your funds.
- **Non-custodial wallet**: You control your private keys → you control your funds.

> Choosing between custodial and non-custodial often involves a trade-off:
> 
> - **Security**: “Not your keys, not your bitcoin.”
> - **Convenience**: Non-custodial wallets (like Phoenix or Breez) now offer excellent UX while preserving control.

---

### 2.4.4.2 Types of Lightning Wallets

Most commonly used types:

- **Desktop wallets** (Windows, macOS, Linux)
- **Mobile wallets** (iOS, Android)
- **Hardware wallets** (self-hosted Bitcoin + Lightning node)

---

### 2.4.4.3 Popular Lightning Wallets

| Wallet | Type | Environment | Direct Auth (lnurl-auth) | Direct Withdraw (lnurl-withdraw) |
| --- | --- | --- | --- | --- |
| Blue Wallet | Custodial | Desktop, iOS, Android | ✅ | ❌ |
| Breez | Non-custodial | iOS, Android | ✅ | ✅ |
| Electrum | Non-custodial | Desktop | ✅ | ✅ |
| Phoenix | Non-custodial | iOS, Android | ✅ | ✅ |
| Wallet of Satoshi | Custodial | iOS, Android | ✅ | ❌ |
| ZAP | Non-custodial | Desktop, iOS, Android | ✅ | ✅ |
| Zeus | Non-custodial | iOS, Android | ✅ | ✅ |

---

## 2.4.5 How to Get a Lightning Network Wallet?

The easiest way to get started is to **download a Lightning wallet app** on your desktop or mobile device.

Advanced users may prefer **hardware wallets** (self-hosted nodes).

---

## 2.4.6 How Can I Get Bitcoins?

Several ways to acquire bitcoin:

- **Bitcoin exchanges** — most common method (choose carefully; compare security and fees).
- **Peer-to-peer (P2P) directories** — platforms with user reviews (e.g., by country).
- **Bitcoin ATMs** — deposit/withdraw cash to buy/sell bitcoin (find via interactive maps).
- **Accept bitcoin as payment** — for goods or services.

---

## 2.4.7 How to Receive Your First Sats to Your Bitcoin Wallet?

To receive sats into your Lightning wallet:

1. Click **“Receive Funds”** in your wallet.
2. Your wallet will generate a **QR code** and/or a **Bitcoin/Lightning address**.
3. Share this with the sender to receive funds.

> Terminology may vary slightly by wallet.
> 

---

## 2.4.8 How to Send Payments on the Lightning Network?

To send a Lightning payment:

1. Click **“Send Funds”**.
2. Paste a **Lightning invoice** (payment request for a specific satoshi amount) — or scan its QR code.
3. Confirm and send.

---

## 2.4.9 How to Receive Payments on the Lightning Network?

To receive a Lightning payment:

1. Click **“Receive Funds”**.
2. Enter the amount of sats you wish to receive.
3. Generate an **invoice** (payment request).
4. Send this invoice to the payer.

---

## 2.4.10 How Are Payments Routed on the Lightning Network?

- If you have a **direct open channel** with the recipient → payment is instant and capped by the channel’s balance.
- If no direct channel exists → your wallet finds a **multi-hop route** through other nodes in the network.

---

## 2.4.11 How to Open a Bidirectional Payment Channel with Another Party?

To open a channel:

1. Click **“Open New Channel”** in your wallet.
2. Enter the recipient’s **node URI** or **PubKey** — or scan their QR code.
3. Fund the channel with bitcoin.
4. Channel is now open for bidirectional payments.

> Exact steps may vary by wallet interface.
> 

# 3. REST API

## 3.1 Overview

LN Markets provides a **REST API** and a **WebSocket API** to integrate with your program or trading bot.

This API reference includes information on available endpoints and how to interact with them.

You can find ready-to-use SDKs here:

- [TypeScript SDK](https://github.com/ln-markets/sdk-js)
- [Python SDK](https://github.com/ln-markets/sdk-python)

---

## 3.2 Signature

The `LNM-ACCESS-SIGNATURE` header is generated by creating a **SHA256 HMAC** using your secret key on the prehash string:

`timestamp + method + path + params`

*(where `+` represents string concatenation)*, then encoding the result in **Base64**.

### Requirements:

- `method`: MUST be **UPPER CASE** (e.g., `GET`, `POST`, `PUT`, `DELETE`)
- `path`: the request path (e.g., `/v2/user`)
- `timestamp`: same as `LNM-ACCESS-TIMESTAMP` header — number of **milliseconds since Unix Epoch in UTC**, must be within **30 seconds** of API server time
- `params`:
    - For `GET`/`DELETE`: URL query string (e.g., `key1=value1&key2=value2`)
    - For `POST`/`PUT`: request body as **JSON string with no spaces or line returns**
    - If no data: use empty string `""`

---

### 3.2.1 Examples

### JavaScript

```jsx
const { createHmac } = require('crypto');
const { URLSearchParams } = require('url');

let params;
if (method.match(/^(GET|DELETE)$/)) {
  params = new URLSearchParams(data).toString();
} else {
  params = JSON.stringify(data);
}

const signature = createHmac('sha256', secret)
  .update(`${timestamp}${method}${path}${params}`)
  .digest('base64');

```

### Python

```python
import hmac
import base64
import json
import urllib.parse

params = ""
if method in ['GET', 'DELETE']:
    params = urllib.parse.urlencode(data)
elif method in ['POST', 'PUT']:
    params = json.dumps(data, separators=(',', ':'))

signature = base64.b64encode(
    hmac.new(
        secret.encode('utf-8'),
        f"{timestamp}{method}{path}{params}".encode('utf-8'),
        'sha256'
    ).digest()
).decode('utf-8')

```

### Bash

```bash
signature=$(echo -n "${timestamp}${method}${path}${params}" | openssl dgst -sha256 -hmac "${secret}" -binary | base64)

```

---

## 3.3 REST API

### 3.3.1 Endpoints

- **Mainnet**: `https://api.lnmarkets.com/v2`
- **Testnet**: `https://api.testnet4.lnmarkets.com/v2`

---

## 3.4 REST Authentication

API key authentication requires each request to be signed (enhanced security).

You can create and activate new API keys in your [Profile](https://lnmarkets.com/profile).

---

## 3.5 Making a Request

All REST requests **must** include these headers:

| Header | Description |
| --- | --- |
| `LNM-ACCESS-KEY` | Your API key (string) |
| `LNM-ACCESS-SIGNATURE` | Generated signature (see above) |
| `LNM-ACCESS-PASSPHRASE` | API key passphrase |
| `LNM-ACCESS-TIMESTAMP` | Timestamp in milliseconds (UTC) |

### Content-Type Rules:

- `POST` and `PUT` requests:
→ Must include `Content-Type: application/json`
→ Body must be valid JSON
- `GET` and `DELETE` requests:
→ Must **not** include `Content-Type: application/json`
→ Must **not** have a body

---

## 3.6 WebSocket API

### 3.6.1 Endpoints

- **Mainnet**: `wss://api.lnmarkets.com`
- **Testnet**: `wss://api.testnet4.lnmarkets.com`

This API follows the **JSON-RPC 2.0** specification.

---

### 3.6.2 Request Format

```json
{
  "jsonrpc": "2.0",
  "method": "debug/echo",
  "id": "faffssdfsdf432", // Random unique ID
  "params": {
    "hello": "world"
  }
}

```

### 3.6.3 Response Format

```json
{
  "jsonrpc": "2.0",
  "id": "faffssdfsdf432", // Same ID as request
  "result": {
    "hello": "world"
  }
}

```

> You must listen for the id you provided in the request to match responses.
> 

---

## 3.7 Heartbeats

To detect silent disconnections, implement this flow:

1. After receiving any message, set a **5-second timer**.
2. If any message arrives before timer fires → **restart timer**.
3. When timer fires (no messages in 5s) → send a **raw ping frame**.
4. Expect a **raw pong frame** in response.
5. If no pong within 5s → **reconnect or throw error**.

---

## 3.8 Subscription

Subscribe to real-time events using the `subscribe` method.

Unsubscribe using `unsubscribe` with the event name.

### 3.8.1 Available Subscriptions:

```json
[
  "futures:btc_usd:index",
  "futures:btc_usd:last-price",
  "options:btc_usd:volatility-index",
  "options:instruments:disable",
  "options:instruments:enable",
  "options:instruments:removed"
]

```

---

## 3.9 Limits

### 3.9.1 Position Limits

- **Futures**: Max **100 open positions** per account
- **Options**: Max **50 open trades** per account

### 3.9.2 Rate Limits

- Authenticated endpoints: **1 request per second**
- Public endpoints (no auth): **30 requests per minute**

### Rate Limit Headers:

| Header | Description |
| --- | --- |
| `Retry-After` | Seconds to wait if rate limit exceeded |
| `X-Ratelimit-Remaining` | Requests remaining before being blocked |
| `X-Ratelimit-Reset` | Timestamp (ms) when rate limit resets |

> If you generate too many errors (4XX or 5XX), your IP may be temporarily banned.
> 

---

## 3.10 Errors

| Code | Meaning |
| --- | --- |
| 400 | Bad Request — invalid request format |
| 401 | Unauthorized — invalid API key or scope |
| 403 | Forbidden — API key lacks required scope |
| 404 | Not Found |
| 405 | Method Not Allowed |
| 418 | I’m a teapot |
| 429 | Too Many Requests — rate limited |
| 500 | Internal Server Error |
| 503 | Service Unavailable — maintenance mode |

---

> OpenAPI version: 3.0.2
> 

# 3.2 Futures - Add Margin

## 3.2.1 Overview

Add margin to a running trade.

---

## 3.2.2 Request Body

### 3.2.2.1 Body (application/json)

```json
{
  "id": "d0b9f9a0-4f6e-4a5a-8b7a-7f0f5f9a8a1e",
  "amount": 1000
}

```

### Parameters:

- **`id`** *(string, uuid, required)*
    
    Unique identifier of the trade to which margin will be added.
    
- **`amount`** *(integer, required)*
    
    Amount of margin (in sats) to add to the position.
    

---

## 3.2.3 Responses

### 3.2.3.1 200 OK

Successful response returns the updated trade details.

```json
{
  "uid": "821f4a4d-5fad-4cdb-ac89-60d4a1a9795b",
  "type": "m",
  "id": "d0b9f9a0-4f6e-4a5a-8b7a-7f0f5f9a8a7e",
  "side": "b",
  "opening_fee": 108,
  "closing_fee": 100,
  "maintenance_margin": 200,
  "quantity": 108,
  "margin": 1000,
  "leverage": 10,
  "price": 20000,
  "liquidation": 18000,
  "pl": 80,
  "creation_ts": 1629782480000,
  "market_filled_ts": 1629782400000,
  "closed_ts": null,
  "entry_price": 19500,
  "entry_margin": 950,
  "open": false,
  "running": true,
  "canceled": false,
  "closed": false,
  "sum_carry_fees": 50
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `uid` | string | Yes | uuid | User ID |
| `type` | string | Yes | `"m"` | Trade type |
| `id` | string | Yes | uuid | Trade ID |
| `side` | string | Yes | `"b"` (buy), `"s"` (sell) | Trade direction |
| `opening_fee` | integer | Yes | ±9e15 | Fee paid at opening |
| `closing_fee` | integer | Yes | ±9e15 | Reserved fee for closing |
| `maintenance_margin` | integer | Yes | ±9e15 | Current maintenance margin |
| `quantity` | number | Yes | ±9e15 | Position size in USD |
| `margin` | integer | Yes | ±9e15 | Current trade margin (in sats) |
| `leverage` | number | Yes | ±9e15 | Current leverage |
| `price` | number | Yes | ±9e15 | Current market price |
| `liquidation` | number | Yes | ±9e15 | Liquidation price |
| `stoploss` | number | Yes | ±9e15 | Stop loss price (if set) |
| `takeprofit` | number | Yes | ±9e15 | Take profit price (if set) |
| `exit_price` | number | Yes | nullable, ±9e15 | Exit price (if closed) |
| `pl` | integer | Yes | ±9e15 | Current Profit & Loss (in sats) |
| `creation_ts` | number | Yes | — | Timestamp of trade creation (ms) |
| `market_filled_ts` | number | Yes | — | Timestamp when trade was filled (ms) |
| `closed_ts` | string | Yes | nullable | Timestamp when trade was closed (ms) |
| `entry_price` | number | Yes | nullable, ±9e15 | Price at which position was opened |
| `entry_margin` | integer | Yes | nullable, ±9e15 | Initial margin at entry |
| `open` | boolean | Yes | — | Whether trade is open |
| `running` | boolean | Yes | — | Whether trade is currently active |
| `canceled` | boolean | Yes | — | Whether trade was canceled |
| `closed` | boolean | Yes | — | Whether trade is fully closed |
| `sum_carry_fees` | integer | Yes | ±9e15 | Total carry/funding fees accrued |

---

### 3.2.3.2 400 Bad Request

Returned if request is malformed or parameters are invalid.

```json
{
  "error": "Invalid request body"
}

```

# 3.3 Futures - Cancel All Trades

## 3.3.1 Overview

Cancel all open trades.

---

## 3.3.2 Responses

### 3.3.2.1 200 OK

Returns an array of the canceled trades.

```json
{
  "trades": [
    {
      "uid": "827f4a4d-5fad-4cdb-ac89-60d4a7a9795b",
      "type": "m",
      "id": "d0b9f9a0-4f6e-4a5a-8b7a-7f0f5f9a8a1e",
      "side": "b",
      "opening_fee": 10,
      "closing_fee": 0,
      "maintenance_margin": 9,
      "quantity": 100,
      "margin": 1080,
      "leverage": 10,
      "price": 20000,
      "liquidation": 18000,
      "pl": 0,
      "creation_ts": 1629782400000,
      "market_filled_ts": 1629782480000,
      "open": false,
      "running": false,
      "canceled": true,
      "closed": false,
      "sum_carry_fees": 0
    }
  ]
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `uid` | string | Yes | uuid | User ID |
| `type` | string | Yes | `"m"` | Trade type |
| `id` | string | Yes | uuid | Trade ID |
| `side` | string | Yes | `"b"` (buy), `"s"` (sell) | Trade direction |
| `opening_fee` | integer | Yes | ±9e15 | Fee paid at opening |
| `closing_fee` | integer | Yes | ±9e15 | Reserved fee for closing |
| `maintenance_margin` | integer | Yes | ±9e15 | Current maintenance margin |
| `quantity` | number | Yes | ±9e15 | Position size in USD |
| `margin` | integer | Yes | ±9e15 | Current trade margin (in sats) |
| `leverage` | number | Yes | ±9e15 | Current leverage |
| `price` | number | Yes | ±9e15 | Current market price |
| `liquidation` | number | Yes | ±9e15 | Liquidation price |
| `pl` | integer | Yes | ±9e15 | Current Profit & Loss (in sats) |
| `creation_ts` | number | Yes | — | Timestamp of trade creation (ms) |
| `market_filled_ts` | number | Yes | — | Timestamp when trade was filled (ms) |
| `open` | boolean | Yes | — | Whether trade is open |
| `running` | boolean | Yes | — | Whether trade is currently active |
| `canceled` | boolean | Yes | — | Whether trade was canceled |
| `closed` | boolean | Yes | — | Whether trade is fully closed |
| `sum_carry_fees` | integer | Yes | ±9e15 | Total carry/funding fees accrued |

---

### 3.3.2.2 400 Bad Request

Returned if the request is malformed or invalid.

```json
{
  "error": "Invalid request"
}

```

# 3.4 Futures - Cancel

## 3.4.1 Overview

Cancel an open trade.

---

## 3.4.2 Request Body

### 3.4.2.1 Body (application/json)

```json
{
  "id": "d0b9f9a0-4f6e-4a5a-8b7a-7f0f5f9a8a7e"
}

```

### Parameters:

- **`id`** *(string, uuid, required)*
Unique identifier of the trade to cancel.

---

## 3.4.3 Responses

### 3.4.3.1 200 OK

Returns the canceled trade details.

```json
{
  "uid": "821f4a4d-5fad-4cdb-ac89-60d4a1a9795b",
  "type": "m",
  "id": "d0b9f9a0-4f6e-4a5a-8b7a-7f0f5f9a8a7e",
  "side": "b",
  "opening_fee": 10,
  "closing_fee": 0,
  "maintenance_margin": 0,
  "quantity": 1000,
  "margin": 1000,
  "leverage": 10,
  "price": 20000,
  "liquidation": 18000,
  "pl": 0,
  "creation_ts": 1629782480000,
  "market_filled_ts": 1629782400000,
  "open": false,
  "running": false,
  "canceled": true,
  "closed": false,
  "sum_carry_fees": 0
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `uid` | string | Yes | uuid | User ID |
| `type` | string | Yes | `"m"` | Trade type |
| `id` | string | Yes | uuid | Trade ID |
| `side` | string | Yes | `"b"` (buy), `"s"` (sell) | Trade direction |
| `opening_fee` | integer | Yes | ±9e15 | Fee paid at opening |
| `closing_fee` | integer | Yes | ±9e15 | Reserved fee for closing |
| `maintenance_margin` | integer | Yes | ±9e15 | Current maintenance margin |
| `quantity` | number | Yes | ±9e15 | Position size in USD |
| `margin` | integer | Yes | ±9e15 | Current trade margin (in sats) |
| `leverage` | number | Yes | ±9e15 | Current leverage |
| `price` | number | Yes | ±9e15 | Current market price |
| `liquidation` | number | Yes | ±9e15 | Liquidation price |
| `pl` | integer | Yes | ±9e15 | Current Profit & Loss (in sats) |
| `creation_ts` | number | Yes | — | Timestamp of trade creation (ms) |
| `market_filled_ts` | number | Yes | — | Timestamp when trade was filled (ms) |
| `open` | boolean | Yes | — | Whether trade is open |
| `running` | boolean | Yes | — | Whether trade is currently active |
| `canceled` | boolean | Yes | — | Whether trade was canceled |
| `closed` | boolean | Yes | — | Whether trade is fully closed |
| `sum_carry_fees` | integer | Yes | ±9e15 | Total carry/funding fees accrued |

---

### 3.4.3.2 400 Bad Request

Returned if request is malformed or parameters are invalid.

```json
{
  "error": "Invalid trade ID"
}

```

# 3.5 Futures - Cash-In

## 3.5.1 Overview

Cash-in (i.e., "remove money") from a trade. Funds are first removed from the trade’s P&L (if any), then from the trade’s margin. Note that cashing-in increases the trade’s leverage; the whole margin hence isn’t available since leverage is bounded.

---

## 3.5.2 Request Body

### 3.5.2.1 Body (application/json)

```json
{
  "id": "d0b9f9a0-4f6e-4a5a-8b7a-7f0f5f9a8a1e",
  "amount": 100
}

```

### Parameters:

- **`id`** *(string, uuid, required)*
    
    Unique identifier of the trade to cash in from.
    
- **`amount`** *(integer, required)*
    
    Amount (in sats) to remove from the position.
    

---

## 3.5.3 Responses

### 3.5.3.1 200 OK

Returns the updated trade details after cash-in.

```json
{
  "uid": "821f4a4d-5fad-4cdb-ac89-60d4a1a9795b",
  "type": "m",
  "id": "d0b9f9a0-4f6e-4a5a-8b7a-7f0f5f9a8a1e",
  "side": "b",
  "opening_fee": 10,
  "closing_fee": 0,
  "maintenance_margin": 0,
  "quantity": 1000,
  "margin": 900,
  "leverage": 10,
  "price": 20000,
  "liquidation": 18000,
  "pl": 0,
  "creation_ts": 1629782480000,
  "market_filled_ts": 1629782400000,
  "open": false,
  "running": true,
  "canceled": false,
  "closed": false,
  "sum_carry_fees": 0
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `uid` | string | Yes | uuid | User ID |
| `type` | string | Yes | `"m"` | Trade type |
| `id` | string | Yes | uuid | Trade ID |
| `side` | string | Yes | `"b"` (buy), `"s"` (sell) | Trade direction |
| `opening_fee` | integer | Yes | ±9e15 | Fee paid at opening |
| `closing_fee` | integer | Yes | ±9e15 | Reserved fee for closing |
| `maintenance_margin` | integer | Yes | ±9e15 | Current maintenance margin |
| `quantity` | number | Yes | ±9e15 | Position size in USD |
| `margin` | integer | Yes | ±9e15 | Current trade margin (in sats) |
| `leverage` | number | Yes | ±9e15 | Current leverage |
| `price` | number | Yes | ±9e15 | Current market price |
| `liquidation` | number | Yes | ±9e15 | Liquidation price |
| `pl` | integer | Yes | ±9e15 | Current Profit & Loss (in sats) |
| `creation_ts` | number | Yes | — | Timestamp of trade creation (ms) |
| `market_filled_ts` | number | Yes | — | Timestamp when trade was filled (ms) |
| `open` | boolean | Yes | — | Whether trade is open |
| `running` | boolean | Yes | — | Whether trade is currently active |
| `canceled` | boolean | Yes | — | Whether trade was canceled |
| `closed` | boolean | Yes | — | Whether trade is fully closed |
| `sum_carry_fees` | integer | Yes | ±9e15 | Total carry/funding fees accrued |

---

### 3.5.3.2 400 Bad Request

Returned if request is malformed or parameters are invalid.

```json
{
  "error": "Invalid trade ID or amount"
}

```

# 3.6 Futures - Close All Trades

## 3.6.1 Overview

Close all running trades.

---

## 3.6.2 Responses

### 3.6.2.1 200 OK

Returns an array of the closed trades.

```json
{
  "trades": [
    {
      "uid": "827f4a4d-5fad-4cdb-ac89-60d4a7a9795b",
      "type": "m",
      "id": "d0b9f9a0-4f6e-4a5a-8b7a-7f0f5f9a8a1e",
      "side": "b",
      "opening_fee": 10,
      "closing_fee": 10,
      "maintenance_margin": 0,
      "quantity": 100,
      "margin": 1080,
      "leverage": 10,
      "price": 20000,
      "liquidation": 18000,
      "pl": 150,
      "creation_ts": 1629782400000,
      "market_filled_ts": 1629782480000,
      "closed_ts": 1630208000000,
      "open": false,
      "running": false,
      "canceled": false,
      "closed": true,
      "sum_carry_fees": 234
    }
  ]
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `uid` | string | Yes | uuid | User ID |
| `type` | string | Yes | `"m"` | Trade type |
| `id` | string | Yes | uuid | Trade ID |
| `side` | string | Yes | `"b"` (buy), `"s"` (sell) | Trade direction |
| `opening_fee` | integer | Yes | ±9e15 | Fee paid at opening |
| `closing_fee` | integer | Yes | ±9e15 | Fee paid at closing |
| `maintenance_margin` | integer | Yes | ±9e15 | Final maintenance margin |
| `quantity` | number | Yes | ±9e15 | Position size in USD |
| `margin` | integer | Yes | ±9e15 | Final trade margin (in sats) |
| `leverage` | number | Yes | ±9e15 | Leverage at closure |
| `price` | number | Yes | ±9e15 | Market price at closure |
| `liquidation` | number | Yes | ±9e15 | Liquidation price |
| `pl` | integer | Yes | ±9e15 | Final Profit & Loss (in sats) |
| `creation_ts` | number | Yes | — | Timestamp of trade creation (ms) |
| `market_filled_ts` | number | Yes | — | Timestamp when trade was filled (ms) |
| `closed_ts` | number | Yes | — | Timestamp when trade was closed (ms) |
| `open` | boolean | Yes | — | Whether trade is open |
| `running` | boolean | Yes | — | Whether trade is currently active |
| `canceled` | boolean | Yes | — | Whether trade was canceled |
| `closed` | boolean | Yes | — | Whether trade is fully closed |
| `sum_carry_fees` | integer | Yes | ±9e15 | Total carry/funding fees accrued |

---

### 3.6.2.2 400 Bad Request

Returned if the request is malformed or invalid.

```json
{
  "error": "Invalid request"
}

```

# 3.7 Futures - Get Trades

## 3.7.1 Overview

Fetch a user’s trades.

---

## 3.7.2 Query Parameters

### 3.7.2.1 Parameters

- **`type`** *(string, required)*
    
    Filter trades by status.
    
    Allowed values: `running`, `open`, `closed`
    
- **`from`** *(integer, optional)*
    
    Timestamp (in milliseconds) to fetch trades from.
    
- **`to`** *(integer, optional)*
    
    Timestamp (in milliseconds) to fetch trades up to.
    
- **`limit`** *(integer, optional, default: 100, min: 1, max: 1000)*
    
    Maximum number of trades to return.
    

---

## 3.7.3 Responses

### 3.7.3.1 200 OK

Returns an array of trade objects matching the query.

```json
[
  {
    "uid": "821f4a4d-5fad-4cdb-ac89-60d4a1a9795b",
    "type": "m",
    "id": "d0b9f9a0-4f6e-4a5a-8b7a-7f0f5f9a8a1e",
    "side": "b",
    "opening_fee": 10,
    "closing_fee": 10,
    "maintenance_margin": 0,
    "quantity": 100,
    "margin": 1000,
    "leverage": 10,
    "price": 20000,
    "liquidation": 18000,
    "pl": 150,
    "creation_ts": 1629782400000,
    "market_filled_ts": 1629782400000,
    "closed_ts": 1630200000000,
    "open": false,
    "running": false,
    "canceled": false,
    "closed": true,
    "sum_carry_fees": 23400
  }
]

```

### Fields (per trade object):

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `uid` | string | Yes | uuid | User ID |
| `type` | string | Yes | `"m"` | Trade type |
| `id` | string | Yes | uuid | Trade ID |
| `side` | string | Yes | `"b"` (buy), `"s"` (sell) | Trade direction |
| `opening_fee` | integer | Yes | ±9e15 | Fee paid at opening |
| `closing_fee` | integer | Yes | ±9e15 | Fee paid at closing |
| `maintenance_margin` | integer | Yes | ±9e15 | Final maintenance margin |
| `quantity` | number | Yes | ±9e15 | Position size in USD |
| `margin` | integer | Yes | ±9e15 | Final trade margin (in sats) |
| `leverage` | number | Yes | ±9e15 | Leverage at closure |
| `price` | number | Yes | ±9e15 | Market price at closure |
| `liquidation` | number | Yes | ±9e15 | Liquidation price |
| `pl` | integer | Yes | ±9e15 | Final Profit & Loss (in sats) |
| `creation_ts` | number | Yes | — | Timestamp of trade creation (ms) |
| `market_filled_ts` | number | Yes | — | Timestamp when trade was filled (ms) |
| `closed_ts` | number | Yes | nullable | Timestamp when trade was closed (ms) |
| `open` | boolean | Yes | — | Whether trade is open |
| `running` | boolean | Yes | — | Whether trade is currently active |
| `canceled` | boolean | Yes | — | Whether trade was canceled |
| `closed` | boolean | Yes | — | Whether trade is fully closed |
| `sum_carry_fees` | integer | Yes | ±9e15 | Total carry/funding fees accrued |

---

### 3.7.3.2 400 Bad Request

Returned if query parameters are invalid or malformed.

```json
{
  "error": "Invalid parameter: type"
}

```

# 3.8 Futures - Update Trade

## 3.8.1 Overview

Allows user to modify `stoploss` or `takeprofit` on a trade.

---

## 3.8.2 Request Body

### 3.8.2.1 Body (application/json)

```json
{
  "id": "d0b9f9a0-4f6e-4a5a-8b7a-7f0f5f9a8a1e",
  "type": "stoploss",
  "value": 19000
}

```

### Parameters:

- **`id`** *(string, uuid, required)*
    
    Unique identifier of the trade to update.
    
- **`type`** *(string, required)*
    
    Type of update to perform.
    
    Allowed values: `"stoploss"`, `"takeprofit"`
    
- **`value`** *(number, required)*
    
    New price value for the stop loss or take profit.
    

---

## 3.8.3 Responses

### 3.8.3.1 200 OK

Returns the updated trade object.

```json
{
  "uid": "821f4a4d-5fad-4cdb-ac89-60d4a1a9795b",
  "type": "m",
  "id": "d0b9f9a0-4f6e-4a5a-8b7a-7f0f5f9a8a1e",
  "side": "b",
  "opening_fee": 10,
  "closing_fee": 0,
  "maintenance_margin": 0,
  "quantity": 1000,
  "margin": 1000,
  "leverage": 10,
  "price": 20000,
  "liquidation": 18000,
  "stoploss": 19000,
  "takeprofit": null,
  "pl": 0,
  "creation_ts": 1629782480000,
  "market_filled_ts": 1629782400000,
  "open": false,
  "running": true,
  "canceled": false,
  "closed": false,
  "sum_carry_fees": 0
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `uid` | string | Yes | uuid | User ID |
| `type` | string | Yes | `"m"` | Trade type |
| `id` | string | Yes | uuid | Trade ID |
| `side` | string | Yes | `"b"` (buy), `"s"` (sell) | Trade direction |
| `opening_fee` | integer | Yes | ±9e15 | Fee paid at opening |
| `closing_fee` | integer | Yes | ±9e15 | Reserved fee for closing |
| `maintenance_margin` | integer | Yes | ±9e15 | Current maintenance margin |
| `quantity` | number | Yes | ±9e15 | Position size in USD |
| `margin` | integer | Yes | ±9e15 | Current trade margin (in sats) |
| `leverage` | number | Yes | ±9e15 | Current leverage |
| `price` | number | Yes | ±9e15 | Current market price |
| `liquidation` | number | Yes | ±9e15 | Liquidation price |
| `stoploss` | number | Yes | nullable, ±9e15 | Updated stop loss price |
| `takeprofit` | number | Yes | nullable, ±9e15 | Updated take profit price |
| `exit_price` | number | Yes | nullable, ±9e15 | Exit price (if closed) |
| `pl` | integer | Yes | ±9e15 | Current Profit & Loss (in sats) |
| `creation_ts` | number | Yes | — | Timestamp of trade creation (ms) |
| `market_filled_ts` | number | Yes | — | Timestamp when trade was filled (ms) |
| `closed_ts` | string | Yes | nullable | Timestamp when trade was closed (ms) |
| `entry_price` | number | Yes | nullable, ±9e15 | Price at which position was opened |
| `entry_margin` | integer | Yes | nullable, ±9e15 | Initial margin at entry |
| `open` | boolean | Yes | — | Whether trade is open |
| `running` | boolean | Yes | — | Whether trade is currently active |
| `canceled` | boolean | Yes | — | Whether trade was canceled |
| `closed` | boolean | Yes | — | Whether trade is fully closed |
| `sum_carry_fees` | integer | Yes | ±9e15 | Total carry/funding fees accrued |

---

### 3.8.3.2 400 Bad Request

Returned if request is malformed or parameters are invalid.

```json
{
  "error": "Invalid trade ID or update type"
}

```

# 3.9 Futures - Create a New Trade

## 3.9.1 Overview

Send the order form parameters to add a new trade in the database.

- If `type = "l"` (limit order), the `price` property must be included to determine when the trade should be filled.
- You can choose to specify either `margin` or `quantity` — the other will be calculated automatically based on your input.

---

## 3.9.2 Request Body

### 3.9.2.1 Body (application/json)

```json
{
  "type": "l",
  "side": "b",
  "leverage": 10,
  "quantity": 1000,
  "margin": 1000,
  "price": 20000,
  "stoploss": 18000,
  "takeprofit": 22000
}

```

### Parameters:

- **`type`** *(string, required)*
    
    Order type.
    
    Allowed values: `"m"` (market), `"l"` (limit)
    
- **`side`** *(string, required)*
    
    Trade direction.
    
    Allowed values: `"b"` (buy/long), `"s"` (sell/short)
    
- **`leverage`** *(number, required)*
    
    Leverage multiplier for the position.
    
- **`stoploss`** *(number, optional)*
    
    Stop loss price. Must be a multiple of 0.5.
    
- **`takeprofit`** *(number, optional)*
    
    Take profit price. Must be a multiple of 0.5.
    
- **`quantity`** *(integer, optional, required if `margin` not provided)*
    
    Position size in USD. Must be > 0.
    
- **`margin`** *(integer, optional, required if `quantity` not provided)*
    
    Margin amount in sats. Must be > 0.
    
- **`price`** *(number, required if `type = "l"`)*
    
    Limit price. Must be > 0 and a multiple of 0.5.
    

> ⚠️ You must provide either quantity or margin — not both. The system calculates the missing one.
> 

---

## 3.9.3 Responses

### 3.9.3.1 200 OK

Returns the newly created trade object.

```json
{
  "uid": "821f4a4d-5fad-4cdb-ac89-60d4a1a9795b",
  "type": "l",
  "id": "d0b9f9a0-4f6e-4a5a-8b7a-7f0f5f9a8a1e",
  "side": "b",
  "opening_fee": 10,
  "closing_fee": 0,
  "maintenance_margin": 0,
  "quantity": 1000,
  "margin": 1000,
  "leverage": 10,
  "price": 20000,
  "liquidation": 18000,
  "stoploss": 18000,
  "takeprofit": 22000,
  "pl": 0,
  "creation_ts": 1629782480000,
  "market_filled_ts": null,
  "closed_ts": null,
  "entry_price": null,
  "entry_margin": null,
  "open": true,
  "running": false,
  "canceled": false,
  "closed": false,
  "sum_carry_fees": 0
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `uid` | string | Yes | uuid | User ID |
| `type` | string | Yes | `"m"`, `"l"` | Order type |
| `id` | string | Yes | uuid | Trade ID |
| `side` | string | Yes | `"b"`, `"s"` | Trade direction |
| `opening_fee` | integer | Yes | ±9e15 | Fee paid at opening |
| `closing_fee` | integer | Yes | ±9e15 | Reserved fee for closing |
| `maintenance_margin` | integer | Yes | ±9e15 | Current maintenance margin |
| `quantity` | number | Yes | ±9e15 | Position size in USD |
| `margin` | integer | Yes | ±9e15 | Trade margin (in sats) |
| `leverage` | number | Yes | ±9e15 | Leverage multiplier |
| `price` | number | Yes | ±9e15 | Limit price (if applicable) |
| `liquidation` | number | Yes | ±9e15 | Liquidation price |
| `stoploss` | number | Yes | nullable, ±9e15 | Stop loss price |
| `takeprofit` | number | Yes | nullable, ±9e15 | Take profit price |
| `exit_price` | number | Yes | nullable, ±9e15 | Exit price (if closed) |
| `pl` | integer | Yes | ±9e15 | Current Profit & Loss (in sats) |
| `creation_ts` | number | Yes | — | Timestamp of trade creation (ms) |
| `market_filled_ts` | string | Yes | nullable | Timestamp when trade was filled (ms) |
| `closed_ts` | string | Yes | nullable | Timestamp when trade was closed (ms) |
| `entry_price` | number | Yes | nullable, ±9e15 | Price at which position was opened |
| `entry_margin` | integer | Yes | nullable, ±9e15 | Initial margin at entry |
| `open` | boolean | Yes | — | Whether trade is open |
| `running` | boolean | Yes | — | Whether trade is currently active |
| `canceled` | boolean | Yes | — | Whether trade was canceled |
| `closed` | boolean | Yes | — | Whether trade is fully closed |
| `sum_carry_fees` | integer | Yes | ±9e15 | Total carry/funding fees accrued |

---

### 3.9.3.2 400 Bad Request

Returned if request is malformed, parameters are invalid, or required fields are missing.

```json
{
  "error": "Invalid parameters: missing 'price' for limit order"
}

```

# 3.10 Futures - Close

## 3.10.1 Overview

Close a user’s trade. The P&L will be calculated against the current last price, depending on the side of the trade.

---

## 3.10.2 Query Parameters

### 3.10.2.1 Parameters

- **`id`** *(string, uuid, required)*
Unique identifier of the trade to close.

---

## 3.10.3 Responses

### 3.10.3.1 200 OK

Returns the closed trade object.

```json
{
  "uid": "821f4a4d-5fad-4cdb-ac89-60d4a1a9795b",
  "type": "m",
  "id": "d0b9f9a0-4f6e-4a5a-8b7a-7f0f5f9a8a1e",
  "side": "b",
  "opening_fee": 10,
  "closing_fee": 10,
  "maintenance_margin": 0,
  "quantity": 100,
  "margin": 1000,
  "leverage": 10,
  "price": 20000,
  "liquidation": 18000,
  "pl": 150,
  "creation_ts": 1629782480000,
  "market_filled_ts": 1629782400000,
  "closed_ts": 1630200000000,
  "open": false,
  "running": false,
  "canceled": false,
  "closed": true,
  "sum_carry_fees": 23400
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `uid` | string | Yes | uuid | User ID |
| `type` | string | Yes | `"m"` | Trade type |
| `id` | string | Yes | uuid | Trade ID |
| `side` | string | Yes | `"b"` (buy), `"s"` (sell) | Trade direction |
| `opening_fee` | integer | Yes | ±9e15 | Fee paid at opening |
| `closing_fee` | integer | Yes | ±9e15 | Fee paid at closing |
| `maintenance_margin` | integer | Yes | ±9e15 | Final maintenance margin |
| `quantity` | number | Yes | ±9e15 | Position size in USD |
| `margin` | integer | Yes | ±9e15 | Final trade margin (in sats) |
| `leverage` | number | Yes | ±9e15 | Leverage at closure |
| `price` | number | Yes | ±9e15 | Market price at closure |
| `liquidation` | number | Yes | ±9e15 | Liquidation price |
| `pl` | integer | Yes | ±9e15 | Final Profit & Loss (in sats) |
| `creation_ts` | number | Yes | — | Timestamp of trade creation (ms) |
| `market_filled_ts` | number | Yes | — | Timestamp when trade was filled (ms) |
| `closed_ts` | number | Yes | — | Timestamp when trade was closed (ms) |
| `open` | boolean | Yes | — | Whether trade is open |
| `running` | boolean | Yes | — | Whether trade is currently active |
| `canceled` | boolean | Yes | — | Whether trade was canceled |
| `closed` | boolean | Yes | — | Whether trade is fully closed |
| `sum_carry_fees` | integer | Yes | ±9e15 | Total carry/funding fees accrued |

---

### 3.10.3.2 400 Bad Request

Returned if the trade ID is invalid or the request is malformed.

```json
{
  "error": "Invalid trade ID"
}

```

# 3.11 Futures - Carry Fees History

## 3.11.1 Overview

Retrieve carry fees history for user.

---

## 3.11.2 Query Parameters

### 3.11.2.1 Parameters

- **`from`** *(integer, required)*
    
    Start timestamp (in milliseconds) to fetch carry fees from.
    
- **`to`** *(integer, required)*
    
    End timestamp (in milliseconds) to fetch carry fees up to.
    
- **`limit`** *(integer, optional, default: 100, min: 1, max: 1000)*
    
    Maximum number of records to return.
    

---

## 3.11.3 Responses

### 3.11.3.1 200 OK

Returns an array of carry fee records.

```json
[
  {
    "ts": 1689302888432,
    "id": "d0b9f9a0-4f6e-4a5a-8b7a-7f0f5f9a8a1e",
    "fixing_id": "012cd6eb-1fad-4631-aca5-f904e7b3a1c2",
    "fee": 10
  }
]

```

### Fields (per record):

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `ts` | integer | Yes | Timestamp of the fee (ms) |
| `id` | string | Yes | Trade ID associated with the fee |
| `fixing_id` | string | Yes | Unique identifier of the funding fix |
| `fee` | integer | Yes | Fee amount (in sats) |

---

### 3.11.3.2 400 Bad Request

Returned if query parameters are invalid or malformed.

```json
{
  "error": "Invalid parameter: from"
}

```

# 3.12 Futures - Fixing History

## 3.12.1 Overview

Retrieve funding fee (fixing) history — at most 1000 entries between two given timestamps.

---

## 3.12.2 Query Parameters

### 3.12.2.1 Parameters

- **`from`** *(integer, required)*
    
    Start timestamp (in milliseconds) to fetch funding history from.
    
- **`to`** *(integer, required)*
    
    End timestamp (in milliseconds) to fetch funding history up to.
    
- **`limit`** *(integer, optional, default: 100, min: 1, max: 1000)*
    
    Maximum number of records to return.
    

---

## 3.12.3 Responses

### 3.12.3.1 200 OK

Returns an array of funding fee (fixing) records.

```json
[
  {
    "id": "46b6cd74-d91d-4f25-8a55-1cde32a9341c",
    "time": 1684857591929,
    "price": 15885,
    "fee_rate": 0.0001
  }
]

```

### Fields (per record):

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Unique identifier of the funding fix |
| `time` | integer | Yes | Timestamp of the funding event (ms) |
| `price` | number | Yes | BTCUSD index price at funding time |
| `fee_rate` | number | Yes | Funding rate applied (e.g., 0.0001 = 0.01%) |

---

### 3.12.3.2 400 Bad Request

Returned if query parameters are invalid or malformed.

```json
{
  "error": "Invalid parameter: from"
}

```

# 3.13 Futures - Index History

## 3.13.1 Overview

Retrieve index price history — at most 1000 entries between two given timestamps.

---

## 3.13.2 Query Parameters

### 3.13.2.1 Parameters

- **`from`** *(integer, required)*
    
    Start timestamp (in milliseconds) to fetch index history from.
    
- **`to`** *(integer, required)*
    
    End timestamp (in milliseconds) to fetch index history up to.
    
- **`limit`** *(integer, optional, default: 100, min: 1, max: 1000)*
    
    Maximum number of records to return.
    

---

## 3.13.3 Responses

### 3.13.3.1 200 OK

Returns an array of index price records.

```json
[
  {
    "time": 1684835577863,
    "value": 42088
  },
  {
    "time": 1684835597656,
    "value": 69088
  }
]

```

### Fields (per record):

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `time` | integer | Yes | Timestamp of the index (ms) |
| `value` | number | Yes | Index price at that timestamp |

---

### 3.13.3.2 400 Bad Request

Returned if query parameters are invalid or malformed.

```json
{
  "error": "Invalid parameter: from"
}

```

# 3.14 Futures - Price History

## 3.14.1 Overview

Retrieve price history — at most 1000 entries between two given timestamps.

---

## 3.14.2 Query Parameters

### 3.14.2.1 Parameters

- **`from`** *(integer, required)*
    
    Start timestamp (in milliseconds) to fetch price history from.
    
- **`to`** *(integer, required)*
    
    End timestamp (in milliseconds) to fetch price history up to.
    
- **`limit`** *(integer, optional, default: 100, min: 1, max: 1000)*
    
    Maximum number of records to return.
    

---

## 3.14.3 Responses

### 3.14.3.1 200 OK

Returns an array of price records.

```json
[
  {
    "time": 1684835577863,
    "value": 42088
  },
  {
    "time": 1684835597656,
    "value": 69088
  }
]

```

### Fields (per record):

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `time` | integer | Yes | Timestamp of the price (ms) |
| `value` | number | Yes | Price at that timestamp |

---

### 3.14.3.2 400 Bad Request

Returned if query parameters are invalid or malformed.

```json
{
  "error": "Invalid parameter: from"
}

```

# 3.15 Futures - Leaderboard

## 3.15.1 Overview

Get the top 10 users by P&L, broken down by day / week / month / all-time.

---

## 3.15.2 Responses

### 3.15.2.1 200 OK

Returns an object containing four arrays: `daily`, `weekly`, `monthly`, `all_time`, each listing top 10 users.

```json
{
  "daily": [
    {
      "username": "bob",
      "pl": 4242424242,
      "direction": 1
    }
  ],
  "weekly": [
    {
      "username": "kevin",
      "pl": 3491941,
      "direction": 1
    },
    {
      "username": "roger",
      "pl": 24013441,
      "direction": 1
    },
    {
      "username": "laura",
      "pl": 23126094,
      "direction": 1
    },
    {
      "username": "marcus",
      "pl": 1414819,
      "direction": 1
    },
    {
      "username": "charles",
      "pl": 242918,
      "direction": -2
    },
    {
      "username": "antoine",
      "pl": 999999,
      "direction": -7
    },
    {
      "username": "beau-du-74",
      "pl": 61491,
      "direction": 1
    },
    {
      "username": "crypto-king",
      "pl": 110088,
      "direction": 0
    },
    {
      "username": "hey",
      "pl": 3,
      "direction": 0
    }
  ],
  "monthly": [],
  "all_time": []
}

```

### Fields (per user object):

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | string | Yes | Trader’s public username |
| `pl` | integer | Yes | Profit & Loss in sats |
| `direction` | integer | Yes | Trade direction: `1` = net long, `-1` = net short, `0` = flat |

> Each array contains up to 10 ranked users. Arrays may be empty if no data exists for that period.
> 

---

### 3.15.2.2 400 Bad Request

Returned if the request is malformed.

```json
{
  "error": "Invalid request"
}

```

# 3.16 Futures - Futures Market

## 3.16.1 Overview

Get the futures market details.

---

## 3.16.2 Responses

### 3.16.2.1 200 OK

Returns market configuration including active status, limits, and fees.

```json
{
  "active": true,
  "limits": {
    "quantity": {
      "min": 0,
      "max": 1000000000
    },
    "trade": 100,
    "leverage": {
      "min": 1,
      "max": 100
    },
    "count": {
      "max": 100
    }
  },
  "fees": {
    "carry": {
      "min": 0.0001,
      "hours": [0, 8, 16]
    },
    "trading": {
      "tiers": [
        {
          "minVolume": 0,
          "fees": 0.001
        },
        {
          "minVolume": 250000,
          "fees": 0.0008
        },
        {
          "minVolume": 1000000,
          "fees": 0.0007
        },
        {
          "minVolume": 5000000,
          "fees": 0.0006
        }
      ]
    }
  }
}

```

### Fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `active` | boolean | Yes | Whether futures market is currently active |
| `limits.quantity.min` | number | Yes | Minimum trade quantity (USD) |
| `limits.quantity.max` | number | Yes | Maximum trade quantity per account (USD) |
| `limits.trade` | integer | Yes | Maximum quantity per single trade (USD) |
| `limits.leverage.min` | number | Yes | Minimum allowed leverage |
| `limits.leverage.max` | number | Yes | Maximum allowed leverage |
| `limits.count.max` | integer | Yes | Maximum number of open positions per account |
| `fees.carry.min` | number | Yes | Minimum funding fee rate |
| `fees.carry.hours` | array | Yes | Hours (UTC) when funding fees are applied |
| `fees.trading.tiers` | array | Yes | Tiered trading fee structure |

Each tier in `fees.trading.tiers` contains:

| Field | Type | Description |
| --- | --- | --- |
| `minVolume` | number | Minimum 30-day volume for this tier |
| `fees` | number | Trading fee rate (e.g., 0.001 = 0.1%) |

---

### 3.16.2.2 400 Bad Request

Returned if the request is malformed.

```json
{
  "error": "Invalid request"
}

```

# 3.17 Futures - Ticker

## 3.17.1 Overview

Get the futures ticker.

---

## 3.17.2 Responses

### 3.17.2.1 200 OK

Returns current market ticker data.

```json
{
  "index": 1337,
  "lastPrice": 69420,
  "askPrice": 69420,
  "bidPrice": 442869,
  "carryFeeRate": 0.0001,
  "carryFeeTimestamp": 1684857591929,
  "exchangesWeights": {
    "binance": 0.2,
    "bitmex": 0.2,
    "bybit": 0.2,
    "deribit": 0.2
  }
}

```

### Fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `index` | number | Yes | Current index price |
| `lastPrice` | number | Yes | Last traded price |
| `askPrice` | number | Yes | Current best ask (sell) price |
| `bidPrice` | number | Yes | Current best bid (buy) price |
| `carryFeeRate` | number | Yes | Current funding rate |
| `carryFeeTimestamp` | number | Yes | Timestamp (ms) of last funding rate application |
| `exchangesWeights` | object | Yes | Weight distribution per exchange |

Each key in `exchangesWeights` represents an exchange, with its assigned weight as value.

---

### 3.17.2.2 400 Bad Request

Returned if the request is malformed.

```json
{
  "error": "Invalid request"
}

```

# 3.18 Futures - Get Trade

## 3.18.1 Overview

Get a trade by ID.

---

## 3.18.2 Path Parameters

### 3.18.2.1 Parameters

- **`id`** *(string, uuid, required)*
Unique identifier of the trade to retrieve.

---

## 3.18.3 Responses

### 3.18.3.1 200 OK

Returns the trade object matching the provided ID.

```json
{
  "uid": "821f4a4d-5fad-4cdb-ac89-60d4a1a9795b",
  "type": "m",
  "id": "d0b9f9a0-4f6e-4a5a-8b7a-7f0f5f9a8a1e",
  "side": "b",
  "opening_fee": 10,
  "closing_fee": 0,
  "maintenance_margin": 0,
  "quantity": 1000,
  "margin": 1000,
  "leverage": 10,
  "price": 20000,
  "liquidation": 18000,
  "pl": 0,
  "creation_ts": 1629782480000,
  "market_filled_ts": 1629782400000,
  "open": false,
  "running": true,
  "canceled": false,
  "closed": false,
  "sum_carry_fees": 0
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `uid` | string | Yes | uuid | User ID |
| `type` | string | Yes | `"m"` | Trade type |
| `id` | string | Yes | uuid | Trade ID |
| `side` | string | Yes | `"b"` (buy), `"s"` (sell) | Trade direction |
| `opening_fee` | integer | Yes | ±9e15 | Fee paid at opening |
| `closing_fee` | integer | Yes | ±9e15 | Reserved fee for closing |
| `maintenance_margin` | integer | Yes | ±9e15 | Current maintenance margin |
| `quantity` | number | Yes | ±9e15 | Position size in USD |
| `margin` | integer | Yes | ±9e15 | Current trade margin (in sats) |
| `leverage` | number | Yes | ±9e15 | Current leverage |
| `price` | number | Yes | ±9e15 | Current market price |
| `liquidation` | number | Yes | ±9e15 | Liquidation price |
| `pl` | integer | Yes | ±9e15 | Current Profit & Loss (in sats) |
| `creation_ts` | number | Yes | — | Timestamp of trade creation (ms) |
| `market_filled_ts` | number | Yes | — | Timestamp when trade was filled (ms) |
| `open` | boolean | Yes | — | Whether trade is open |
| `running` | boolean | Yes | — | Whether trade is currently active |
| `canceled` | boolean | Yes | — | Whether trade was canceled |
| `closed` | boolean | Yes | — | Whether trade is fully closed |
| `sum_carry_fees` | integer | Yes | ±9e15 | Total carry/funding fees accrued |

---

### 3.18.3.2 400 Bad Request

Returned if the trade ID is invalid or the request is malformed.

```json
{
  "error": "Invalid trade ID"
}

```

# 3.19 Futures - OHLCs History

## 3.19.1 Overview

Retrieve OHLC (Open, High, Low, Close) history — at most 1000 entries between two given timestamps.

---

## 3.19.2 Query Parameters

### 3.19.2.1 Parameters

- **`from`** *(integer, required)*
    
    Start timestamp (in milliseconds) to fetch OHLC history from.
    
- **`to`** *(integer, required)*
    
    End timestamp (in milliseconds) to fetch OHLC history up to.
    
- **`limit`** *(integer, optional, default: 100, min: 1, max: 1000)*
    
    Maximum number of records to return.
    
- **`range`** *(string, required)*
    
    Timeframe for OHLC aggregation.
    
    Allowed values: `"1"`, `"5"`, `"15"`, `"30"`, `"45"`, `"60"`, `"720"`, `"1440"`, `"1D"`, `"1W"`, `"1M"`, `"3M"`
    

---

## 3.19.3 Responses

### 3.19.3.1 200 OK

Returns an array of OHLC records.

```json
[
  {
    "time": 1684835577863,
    "open": 100,
    "high": 180,
    "low": 100,
    "close": 100,
    "volume": 100
  },
  {
    "time": 1684835597656,
    "open": 100,
    "high": 120,
    "low": 100,
    "close": 120,
    "volume": 500
  }
]

```

### Fields (per record):

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `time` | integer | Yes | Timestamp of the OHLC bar (ms) |
| `open` | number | Yes | Opening price of the bar |
| `high` | number | Yes | Highest price during the bar |
| `low` | number | Yes | Lowest price during the bar |
| `close` | number | Yes | Closing price of the bar |
| `volume` | number | Yes | Total volume traded during the bar |

---

### 3.19.3.2 400 Bad Request

Returned if query parameters are invalid or malformed.

```json
{
  "error": "Invalid parameter: range"
}

```

# 4.1 Options - Close All Trades

## 4.1.1 Overview

Close all of the user’s option trades. The P&L will be calculated against the current last price, depending on the type of the options.

---

## 4.1.2 Responses

### 4.1.2.1 200 OK

Returns an array of the closed option trades.

```json
{
  "trades": [
    {
      "id": "49d4f418-5190-48b9-9c32-856381dc8aa2",
      "uid": "c6c1a624-f2b4-48c9-b07a-7fd037770bd2",
      "forward": 29840,
      "forward_point": 6,
      "domestic": "BTC",
      "settlement": "cash",
      "fixing_price": 29840,
      "creation_ts": 1689695082638,
      "expiry_ts": 1689753600000,
      "closed_ts": 1689695087302,
      "leg_id": "a6a05452-d445-4d08-a39a-c73126faa098",
      "side": "b",
      "type": "c",
      "quantity": 100,
      "strike": 29000,
      "volatility": 1.1670000553131104,
      "margin": 12744,
      "pl": -2744,
      "maintenance_margin": 0,
      "opening_fee": 172,
      "closing_fee": 172,
      "running": false,
      "closed": true,
      "expired": false,
      "exercised": false
    }
  ]
}

```

### Fields (per trade object):

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Unique trade identifier (uuid) |
| `uid` | string | Yes | User identifier (uuid) |
| `forward` | number | Yes | Forward price of underlying at trade creation |
| `forward_point` | integer | Yes | Decimal precision point for forward price |
| `domestic` | string | Yes | Settlement currency — always `"BTC"` |
| `settlement` | string | Yes | Settlement type — always `"cash"` |
| `fixing_price` | number | Yes | Price of underlying at closure |
| `creation_ts` | number | Yes | Timestamp of trade creation (ms) |
| `expiry_ts` | number | Yes | Timestamp of option expiry (ms) |
| `closed_ts` | number | Yes | Timestamp when trade was closed (ms) |
| `leg_id` | string | Yes | Identifier of the option leg (uuid) |
| `side` | string | Yes | `"b"` (buy) — options can only be bought |
| `type` | string | Yes | Option type: `"c"` (call), `"p"` (put), `"s"` (straddle) |
| `quantity` | number | Yes | Notional amount in USD |
| `strike` | number | Yes | Strike price (displayed as BTC/USD) |
| `volatility` | number | Yes | Implied volatility (%) at trade time |
| `margin` | integer | Yes | Total margin paid (premium + maintenance, in sats) |
| `pl` | integer | Yes | Profit & Loss at closure (in sats) |
| `maintenance_margin` | integer | Yes | Remaining maintenance margin (usually 0 after close) |
| `opening_fee` | integer | Yes | Fee paid at trade opening (in sats) |
| `closing_fee` | integer | Yes | Fee paid at trade closing (in sats) |
| `running` | boolean | Yes | Whether trade was active before closure |
| `closed` | boolean | Yes | Whether trade is now closed |
| `expired` | boolean | Yes | Whether trade reached expiry |
| `exercised` | boolean | Yes | Whether option was exercised (always `false` for LN Markets) |

---

### 4.1.2.2 400 Bad Request

Returned if the request is malformed or invalid.

```json
{
  "error": "Invalid request"
}

```

# 4.2 Options - Trades

## 4.2.1 Overview

Get user’s vanilla options trades.

---

## 4.2.2 Query Parameters

### 4.2.2.1 Parameters

- **`type`** *(string, required)*
    
    Filter trades by status.
    
    Allowed values: `running`, `open`, `closed`
    
- **`from`** *(integer, optional)*
    
    Timestamp (in milliseconds) to fetch trades from.
    
- **`to`** *(integer, optional)*
    
    Timestamp (in milliseconds) to fetch trades up to.
    
- **`limit`** *(integer, optional, default: 100, min: 1, max: 1000)*
    
    Maximum number of trades to return.
    

---

## 4.2.3 Responses

### 4.2.3.1 200 OK

Returns an array of option trade objects matching the query.

```json
[
  {
    "id": "49d4f418-5190-48b9-9c32-856381dc8aa2",
    "uid": "c6c1a624-f2b4-48c9-b07a-7fd037770bd2",
    "forward": 29840,
    "forward_point": 6,
    "domestic": "BTC",
    "settlement": "cash",
    "fixing_price": 29840,
    "creation_ts": 1689695082638,
    "expiry_ts": 1689753600000,
    "closed_ts": 1689695087302,
    "leg_id": "a6a05452-d445-4d08-a39a-c73126faa098",
    "side": "b",
    "type": "c",
    "quantity": 100,
    "strike": 29000,
    "volatility": 1.1670000553131104,
    "margin": 12744,
    "pl": -2744,
    "maintenance_margin": 0,
    "opening_fee": 172,
    "closing_fee": 172,
    "running": false,
    "closed": true,
    "expired": false,
    "exercised": false
  }
]

```

### Fields (per trade object):

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Unique trade identifier (uuid) |
| `uid` | string | Yes | User identifier (uuid) |
| `forward` | number | Yes | Forward price of underlying at trade creation |
| `forward_point` | integer | Yes | Decimal precision point for forward price |
| `domestic` | string | Yes | Settlement currency — always `"BTC"` |
| `settlement` | string | Yes | Settlement type — always `"cash"` |
| `fixing_price` | number | Yes | Price of underlying at closure or expiry |
| `creation_ts` | number | Yes | Timestamp of trade creation (ms) |
| `expiry_ts` | number | Yes | Timestamp of option expiry (ms) |
| `closed_ts` | number | Yes | Timestamp when trade was closed (ms) |
| `leg_id` | string | Yes | Identifier of the option leg (uuid) |
| `side` | string | Yes | `"b"` (buy) — options can only be bought |
| `type` | string | Yes | Option type: `"c"` (call), `"p"` (put), `"s"` (straddle) |
| `quantity` | number | Yes | Notional amount in USD |
| `strike` | number | Yes | Strike price (displayed as BTC/USD) |
| `volatility` | number | Yes | Implied volatility (%) at trade time |
| `margin` | integer | Yes | Total margin paid (premium + maintenance, in sats) |
| `pl` | integer | Yes | Profit & Loss at closure (in sats) |
| `maintenance_margin` | integer | Yes | Remaining maintenance margin |
| `opening_fee` | integer | Yes | Fee paid at trade opening (in sats) |
| `closing_fee` | integer | Yes | Fee paid at trade closing (in sats) |
| `running` | boolean | Yes | Whether trade is currently active |
| `closed` | boolean | Yes | Whether trade is now closed |
| `expired` | boolean | Yes | Whether trade reached expiry |
| `exercised` | boolean | Yes | Whether option was exercised (always `false` for LN Markets) |

---

### 4.2.3.2 400 Bad Request

Returned if query parameters are invalid or malformed.

```json
{
  "error": "Invalid parameter: type"
}

```

# 4.3 Options - Update Trade

## 4.3.1 Overview

Allows user to update settlement parameter in running option trade.

---

## 4.3.2 Request Body

### 4.3.2.1 Body (application/json)

```json
{
  "id": "49d4f418-5190-48b9-9c32-856381dc8aa2",
  "settlement": "cash"
}

```

### Parameters:

- **`id`** *(string, uuid, required)*
    
    Unique identifier of the option trade to update.
    
- **`settlement`** *(string, required)*
    
    Settlement type to update.
    
    Allowed values: `"physical"`, `"cash"`
    

---

## 4.3.3 Responses

### 4.3.3.1 200 OK

Returns the updated option trade object.

```json
{
  "id": "49d4f418-5190-48b9-9c32-856381dc8aa2",
  "uid": "c6c1a624-f2b4-48c9-b07a-7fd037770bd2",
  "forward": 100000,
  "forward_point": 0,
  "domestic": "BTC",
  "settlement": "physical",
  "creation_ts": 1689695082638,
  "expiry_ts": 1689753600000,
  "leg_id": "fee73168-9be7-49ff-8e26-707053c0178b",
  "side": "b",
  "type": "c",
  "quantity": 100,
  "strike": 10000,
  "volatility": 0.88,
  "margin": 1337,
  "pl": 0,
  "maintenance_margin": 1011,
  "opening_fee": 1011,
  "closing_fee": 0,
  "running": true,
  "closed": false,
  "expired": true,
  "exercised": false
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `id` | string | Yes | uuid | Unique trade identifier |
| `uid` | string | Yes | uuid | User identifier |
| `forward` | number | Yes | ±9e15 | Forward price of underlying at trade creation |
| `forward_point` | integer | Yes | ±9e15 | Decimal precision point for forward price |
| `domestic` | string | Yes | max 8 chars | Settlement currency — always `"BTC"` |
| `settlement` | string | Yes | `"physical"`, `"cash"` | Updated settlement type |
| `creation_ts` | number | Yes | — | Timestamp of trade creation (ms) |
| `expiry_ts` | number | Yes | — | Timestamp of option expiry (ms) |
| `leg_id` | string | Yes | uuid | Identifier of the option leg |
| `side` | string | Yes | `"b"` | Side — always buy for options |
| `type` | string | Yes | `"c"`, `"p"`, `"s"` | Option type: call, put, straddle |
| `quantity` | integer | Yes | ±9e15 | Notional amount in USD |
| `strike` | integer | Yes | ±9e15 | Strike price |
| `volatility` | number | Yes | ±9e15 | Implied volatility (%) |
| `margin` | integer | Yes | ±9e15 | Total margin paid (premium + maintenance, in sats) |
| `pl` | integer | Yes | ±9e15 | Current Profit & Loss (in sats) |
| `maintenance_margin` | integer | Yes | ±9e15 | Current maintenance margin |
| `opening_fee` | integer | Yes | ±9e15 | Fee paid at opening |
| `closing_fee` | integer | Yes | ±9e15 | Reserved fee for closing |
| `running` | boolean | Yes | — | Whether trade is currently active |
| `closed` | boolean | Yes | — | Whether trade is closed |
| `expired` | boolean | Yes | — | Whether trade has reached expiry |
| `exercised` | boolean | Yes | — | Whether option was exercised |

---

### 4.3.3.2 400 Bad Request

Returned if request is malformed or parameters are invalid.

```json
{
  "error": "Invalid settlement type or trade ID"
}

```

# 4.4 Options - New Trade

## 4.4.1 Overview

Create a new options trade.

---

## 4.4.2 Request Body

### 4.4.2.1 Body (application/json)

```json
{
  "side": "b",
  "quantity": 100,
  "settlement": "physical",
  "instrument_name": "BTC.2023-01-27.10000.C"
}

```

### Parameters:

- **`side`** *(string, required)*
    
    Trade direction — only buy is supported.
    
    Allowed value: `"b"`
    
- **`quantity`** *(number, required)*
    
    Notional amount in USD. Must be > 0.
    
- **`settlement`** *(string, required)*
    
    Settlement type.
    
    Allowed values: `"physical"`, `"cash"`
    
- **`instrument_name`** *(string, required)*
    
    Name of the option instrument to trade.
    

---

## 4.4.3 Responses

### 4.4.3.1 200 OK

Returns the newly created option trade object.

```json
{
  "id": "49d4f418-5190-48b9-9c32-856381dc8aa2",
  "uid": "c6c1a624-f2b4-48c9-b07a-7fd037770bd2",
  "forward": 100000,
  "forward_point": 0,
  "domestic": "BTC",
  "settlement": "physical",
  "creation_ts": 1689695082638,
  "expiry_ts": 1689753600000,
  "leg_id": "fee73168-9be7-49ff-8e26-707053c0178b",
  "side": "b",
  "type": "c",
  "quantity": 100,
  "strike": 10000,
  "volatility": 0.88,
  "margin": 1337,
  "pl": 0,
  "maintenance_margin": 1011,
  "opening_fee": 1011,
  "closing_fee": 0,
  "running": true,
  "closed": false,
  "expired": true,
  "exercised": false
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `id` | string | Yes | uuid | Unique trade identifier |
| `uid` | string | Yes | uuid | User identifier |
| `forward` | number | Yes | ±9e15 | Forward price of underlying at trade creation |
| `forward_point` | integer | Yes | ±9e15 | Decimal precision point for forward price |
| `domestic` | string | Yes | max 8 chars | Settlement currency — always `"BTC"` |
| `settlement` | string | Yes | `"physical"`, `"cash"` | Settlement type |
| `creation_ts` | number | Yes | — | Timestamp of trade creation (ms) |
| `expiry_ts` | number | Yes | — | Timestamp of option expiry (ms) |
| `leg_id` | string | Yes | uuid | Identifier of the option leg |
| `side` | string | Yes | `"b"` | Side — always buy for options |
| `type` | string | Yes | `"c"`, `"p"`, `"s"` | Option type: call, put, straddle |
| `quantity` | integer | Yes | ±9e15 | Notional amount in USD |
| `strike` | integer | Yes | ±9e15 | Strike price |
| `volatility` | number | Yes | ±9e15 | Implied volatility (%) |
| `margin` | integer | Yes | ±9e15 | Total margin paid (premium + maintenance, in sats) |
| `pl` | integer | Yes | ±9e15 | Current Profit & Loss (in sats) |
| `maintenance_margin` | integer | Yes | ±9e15 | Current maintenance margin |
| `opening_fee` | integer | Yes | ±9e15 | Fee paid at opening |
| `closing_fee` | integer | Yes | ±9e15 | Reserved fee for closing |
| `running` | boolean | Yes | — | Whether trade is currently active |
| `closed` | boolean | Yes | — | Whether trade is closed |
| `expired` | boolean | Yes | — | Whether trade has reached expiry |
| `exercised` | boolean | Yes | — | Whether option was exercised |

---

### 4.4.3.2 400 Bad Request

Returned if request is malformed or parameters are invalid.

```json
{
  "error": "Invalid instrument name or settlement type"
}

```

# 4.5 Options - Close

## 4.5.1 Overview

Close an option trade.

---

## 4.5.2 Query Parameters

### 4.5.2.1 Parameters

- **`id`** *(string, uuid, required)*
Unique identifier of the option trade to close.

---

## 4.5.3 Responses

### 4.5.3.1 200 OK

Returns the closed option trade object.

```json
{
  "id": "49d4f418-5190-48b9-9c32-856381dc8aa2",
  "uid": "c6c1a624-f2b4-48c9-b07a-7fd037770bd2",
  "forward": 29840,
  "forward_point": 6,
  "domestic": "BTC",
  "settlement": "cash",
  "fixing_price": 29840,
  "creation_ts": 1689695082638,
  "expiry_ts": 1689753600000,
  "closed_ts": 1689695087302,
  "leg_id": "a6a05452-d445-4d08-a39a-c73126faa098",
  "side": "b",
  "type": "c",
  "quantity": 100,
  "strike": 29000,
  "volatility": 1.1670000553131104,
  "margin": 12744,
  "pl": -2744,
  "maintenance_margin": 0,
  "opening_fee": 172,
  "closing_fee": 172,
  "running": false,
  "closed": true,
  "expired": false,
  "exercised": false
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `id` | string | Yes | uuid | Unique trade identifier |
| `uid` | string | Yes | uuid | User identifier |
| `forward` | number | Yes | ±9e15 | Forward price of underlying at trade creation |
| `forward_point` | integer | Yes | ±9e15 | Decimal precision point for forward price |
| `domestic` | string | Yes | max 8 chars | Settlement currency — always `"BTC"` |
| `settlement` | string | Yes | `"physical"`, `"cash"` | Settlement type |
| `fixing_price` | number | Yes | nullable, ±9e15 | Price of underlying at closure |
| `creation_ts` | number | Yes | — | Timestamp of trade creation (ms) |
| `expiry_ts` | number | Yes | — | Timestamp of option expiry (ms) |
| `closed_ts` | number | Yes | — | Timestamp when trade was closed (ms) |
| `leg_id` | string | Yes | uuid | Identifier of the option leg |
| `side` | string | Yes | `"b"` | Side — always buy for options |
| `type` | string | Yes | `"c"`, `"p"`, `"s"` | Option type: call, put, straddle |
| `quantity` | integer | Yes | ±9e15 | Notional amount in USD |
| `strike` | integer | Yes | ±9e15 | Strike price |
| `volatility` | number | Yes | ±9e15 | Implied volatility (%) |
| `margin` | integer | Yes | ±9e15 | Total margin paid (premium + maintenance, in sats) |
| `pl` | integer | Yes | ±9e15 | Profit & Loss at closure (in sats) |
| `maintenance_margin` | integer | Yes | ±9e15 | Remaining maintenance margin |
| `opening_fee` | integer | Yes | ±9e15 | Fee paid at opening |
| `closing_fee` | integer | Yes | ±9e15 | Fee paid at closing |
| `running` | boolean | Yes | — | Whether trade was active before closure |
| `closed` | boolean | Yes | — | Whether trade is now closed |
| `expired` | boolean | Yes | — | Whether trade reached expiry |
| `exercised` | boolean | Yes | — | Whether option was exercised |

---

### 4.5.3.2 400 Bad Request

Returned if the trade ID is invalid or the request is malformed.

```json
{
  "error": "Invalid trade ID"
}

```

# 4.6 Options - Get Instrument

## 4.6.1 Overview

Returns the volatility of the given option instrument.

---

## 4.6.2 Query Parameters

### 4.6.2.1 Parameters

- **`instrument_name`** *(string, required)*
Name of the option instrument to retrieve volatility for.

---

## 4.6.3 Responses

### 4.6.3.1 200 OK

Returns the volatility value for the specified instrument.

```json
{
  "volatility": 0.88
}

```

### Fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `volatility` | number | Yes | Implied volatility (%) |

---

### 4.6.3.2 400 Bad Request

Returned if the instrument name is invalid or the request is malformed.

```json
{
  "error": "Invalid instrument name"
}

```

# 4.7 Options - Instruments

## 4.7.1 Overview

Returns the list of available option instruments.

---

## 4.7.2 Responses

### 4.7.2.1 200 OK

Returns an array of instrument names.

```json
[
  "BTC.2023-01-27.10000.C",
  "BTC.2023-01-27.10000.P",
  "BTC.2023-01-27.20000.C"
]

```

### Fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| Array | array of string | Yes | List of available instrument names |

Each string represents a unique option instrument identifier, typically following the format:

`BTC.<EXPIRY_DATE>.<STRIKE_PRICE>.<TYPE>`

Where `<TYPE>` is `"C"` for Call or `"P"` for Put.

---

### 4.7.2.2 400 Bad Request

Returned if the request is malformed.

```json
{
  "error": "Invalid request"
}

```

# 4.8 Options - Get Trade

## 4.8.1 Overview

Get an option trade by ID.

---

## 4.8.2 Path Parameters

### 4.8.2.1 Parameters

- **`id`** *(string, uuid, required)*
Unique identifier of the option trade to retrieve.

---

## 4.8.3 Responses

### 4.8.3.1 200 OK

Returns the option trade object matching the provided ID.

```json
{
  "id": "49d4f418-5190-48b9-9c32-856381dc8aa2",
  "uid": "c6c1a624-f2b4-48c9-b07a-7fd037770bd2",
  "forward": 29840,
  "forward_point": 6,
  "domestic": "BTC",
  "settlement": "cash",
  "fixing_price": 29840,
  "creation_ts": 1689695082638,
  "expiry_ts": 1689753600000,
  "closed_ts": 1689695087302,
  "leg_id": "a6a05452-d445-4d08-a39a-c73126faa098",
  "side": "b",
  "type": "c",
  "quantity": 100,
  "strike": 29000,
  "volatility": 1.1670000553131104,
  "margin": 12744,
  "pl": -2744,
  "maintenance_margin": 0,
  "opening_fee": 172,
  "closing_fee": 172,
  "running": false,
  "closed": true,
  "expired": false,
  "exercised": false
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `id` | string | Yes | uuid | Unique trade identifier |
| `uid` | string | Yes | uuid | User identifier |
| `forward` | number | Yes | ±9e15 | Forward price of underlying at trade creation |
| `forward_point` | integer | Yes | ±9e15 | Decimal precision point for forward price |
| `domestic` | string | Yes | max 8 chars | Settlement currency — always `"BTC"` |
| `settlement` | string | Yes | `"physical"`, `"cash"` | Settlement type |
| `fixing_price` | number | Yes | nullable, ±9e15 | Price of underlying at closure or expiry |
| `creation_ts` | number | Yes | — | Timestamp of trade creation (ms) |
| `expiry_ts` | number | Yes | — | Timestamp of option expiry (ms) |
| `closed_ts` | number | Yes | — | Timestamp when trade was closed (ms) |
| `leg_id` | string | Yes | uuid | Identifier of the option leg |
| `side` | string | Yes | `"b"` | Side — always buy for options |
| `type` | string | Yes | `"c"`, `"p"`, `"s"` | Option type: call, put, straddle |
| `quantity` | integer | Yes | ±9e15 | Notional amount in USD |
| `strike` | integer | Yes | ±9e15 | Strike price |
| `volatility` | number | Yes | ±9e15 | Implied volatility (%) |
| `margin` | integer | Yes | ±9e15 | Total margin paid (premium + maintenance, in sats) |
| `pl` | integer | Yes | ±9e15 | Profit & Loss at closure (in sats) |
| `maintenance_margin` | integer | Yes | ±9e15 | Remaining maintenance margin |
| `opening_fee` | integer | Yes | ±9e15 | Fee paid at opening |
| `closing_fee` | integer | Yes | ±9e15 | Fee paid at closing |
| `running` | boolean | Yes | — | Whether trade is currently active |
| `closed` | boolean | Yes | — | Whether trade is now closed |
| `expired` | boolean | Yes | — | Whether trade reached expiry |
| `exercised` | boolean | Yes | — | Whether option was exercised |

---

### 4.8.3.2 400 Bad Request

Returned if the trade ID is invalid or the request is malformed.

```json
{
  "error": "Invalid trade ID"
}

```

# 4.9 Options - Volatility

## 4.9.1 Overview

Retrieve the current volatility index for options.

---

## 4.9.2 Responses

### 4.9.2.1 200 OK

Returns the current volatility index value.

```json
{
  "volatilityIndex": 1.337
}

```

### Fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `volatilityIndex` | number | Yes | Current implied volatility index (%) |

---

### 4.9.2.2 400 Bad Request

Returned if the request is malformed.

```json
{
  "error": "Invalid request"
}

```

# 4.10 Options - Options Market

## 4.10.1 Overview

Get the options market details.

---

## 4.10.2 Responses

### 4.10.2.1 200 OK

Returns market configuration including active status, limits, and fees.

```json
{
  "active": true,
  "limits": {
    "margin": {
      "min": 0,
      "max": 500000
    },
    "quantity": {
      "min": 1,
      "max": 2200000
    },
    "count": {
      "max": 50
    }
  },
  "fees": {
    "trading": 0.0005
  }
}

```

### Fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `active` | boolean | Yes | Whether options market is currently active |
| `limits.margin.min` | integer | Yes | Minimum margin per trade (in sats) |
| `limits.margin.max` | integer | Yes | Maximum margin per trade (in sats) |
| `limits.quantity.min` | integer | Yes | Minimum trade quantity (USD) |
| `limits.quantity.max` | integer | Yes | Maximum trade quantity (USD) |
| `limits.count.max` | integer | Yes | Maximum number of open trades per account |
| `fees.trading` | number | Yes | Flat trading fee rate (e.g., 0.0005 = 0.05%) |

---

### 4.10.2.2 400 Bad Request

Returned if the request is malformed.

```json
{
  "error": "Invalid request"
}

```

# 5.1 Swaps - Swaps

## 5.1.1 Overview

Fetch user’s swaps.

---

## 5.1.2 Responses

### 5.1.2.1 200 OK

Returns an array of swap records.

```json
[
  {
    "id": "7bcf37dd-289a-4779-ab02-64eade8c50fd",
    "in_asset": "BTC",
    "out_asset": "USD",
    "in_amount": 1337,
    "out_amount": 0.5969,
    "ts": 1715136000000
  }
]

```

### Fields (per swap object):

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Unique swap identifier (uuid) |
| `in_asset` | string | Yes | Asset swapped from (e.g., `"BTC"`) |
| `out_asset` | string | Yes | Asset swapped to (e.g., `"USD"`) |
| `in_amount` | number | Yes | Amount of input asset |
| `out_amount` | number | Yes | Amount of output asset |
| `ts` | number | Yes | Timestamp of swap (ms) |

---

### 5.1.2.2 400 Bad Request

Returned if the request is malformed.

```json
{
  "error": "Invalid request"
}

```

# 5.2 Swaps - Create a New Swap

## 5.2.1 Overview

Create a new synthetic USD ↔ BTC swap.

---

## 5.2.2 Request Body

### 5.2.2.1 Body (application/json)

```json
{
  "in_asset": "BTC",
  "out_asset": "USD",
  "in_amount": 1337
}

```

### Parameters:

- **`in_asset`** *(string, required)*
    
    Asset to swap from.
    
    Allowed values: `"BTC"`, `"USD"`
    
- **`out_asset`** *(string, required)*
    
    Asset to swap to.
    
    Allowed values: `"BTC"`, `"USD"`
    
- **`in_amount`** *(number, required)*
    
    Amount of input asset to swap. Must be > 0.
    

---

## 5.2.3 Responses

### 5.2.3.1 200 OK

Returns details of the created swap.

```json
{
  "inAmount": 1337,
  "inAsset": "BTC",
  "outAmount": 0.5969,
  "outAsset": "USD"
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `inAmount` | number | Yes | > 0 | Input amount swapped |
| `inAsset` | string | Yes | `"BTC"`, `"USD"` | Input asset symbol |
| `outAmount` | number | Yes | > 0 | Output amount received |
| `outAsset` | string | Yes | `"BTC"`, `"USD"` | Output asset symbol |

---

### 5.2.3.2 400 Bad Request

Returned if request is malformed or parameters are invalid.

```json
{
  "error": "Invalid asset pair or amount"
}

```

# 5.3 Swaps - Get Swap

## 5.3.1 Overview

Get a specific swap by ID.

---

## 5.3.2 Path Parameters

### 5.3.2.1 Parameters

- **`id`** *(string, uuid, required)*
Unique identifier of the swap to retrieve.

---

## 5.3.3 Responses

### 5.3.3.1 200 OK

Returns the swap object matching the provided ID.

```json
{
  "id": "7bcf37dd-289a-4779-ab02-64eade8c50fd",
  "in_asset": "BTC",
  "out_asset": "USD",
  "in_amount": 1337,
  "out_amount": 0.5969,
  "ts": 1715136000000
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `id` | string | Yes | uuid | Unique swap identifier |
| `in_asset` | string | Yes | max 4 chars | Asset swapped from |
| `out_asset` | string | Yes | max 4 chars | Asset swapped to |
| `in_amount` | number | Yes | ±9e15 | Amount of input asset |
| `out_amount` | number | Yes | ±9e15 | Amount of output asset |
| `ts` | number | Yes | — | Timestamp of swap (ms) |

---

### 5.3.3.2 400 Bad Request

Returned if the swap ID is invalid or the request is malformed.

```json
{
  "error": "Invalid swap ID"
}

```

# 6.1 User - Get User

## 6.1.1 Overview

Get user information.

---

## 6.1.2 Responses

### 6.1.2.1 200 OK

Returns the authenticated user’s profile data.

```json
{
  "uid": "1602a190-9dc0-48ff-9fb9-4662f7270907",
  "role": "user",
  "balance": 69420,
  "username": "satoshi",
  "synthetic_usd_balance": 0,
  "linking_public_key": "037b7c2587f823de3c62a639369b8c939bfb8f0bd40df58e9c1b6df63bcc88df4f",
  "show_leaderboard": true,
  "email": null,
  "email_confirmed": false,
  "use_taproot_addresses": false,
  "account_type": "lnurl",
  "auto_withdraw_enabled": false,
  "auto_withdraw_lightning_address": null,
  "totp_enabled": false,
  "webauthn_enabled": false,
  "fee_tier": 0
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `uid` | string | Yes | uuid | Unique user identifier |
| `role` | string | Yes | enum | User role: `"user"`, `"mod"`, `"operator"`, `"admin"` |
| `balance` | number | Yes | ±9e15 | BTC balance in sats |
| `username` | string | Yes | max 64 chars | Public username |
| `synthetic_usd_balance` | number | Yes | ±9e15 | Synthetic USD balance |
| `linking_public_key` | string | Yes | nullable | Public key for account linking |
| `show_leaderboard` | boolean | Yes | — | Whether user appears on public leaderboard |
| `email` | string | Yes | nullable, max 318 chars | User email address |
| `email_confirmed` | boolean | Yes | — | Whether email is verified |
| `use_taproot_addresses` | boolean | Yes | — | Whether user prefers Taproot deposit addresses |
| `account_type` | string | Yes | max 64 chars | Account type (e.g., `"lnurl"`) |
| `auto_withdraw_enabled` | boolean | Yes | — | Whether auto-withdraw is enabled |
| `auto_withdraw_lightning_address` | string | Yes | nullable, max 700 chars | Lightning address for auto-withdrawals |
| `totp_enabled` | boolean | Yes | — | Whether TOTP 2FA is enabled |
| `webauthn_enabled` | boolean | Yes | — | Whether WebAuthn 2FA is enabled |
| `fee_tier` | integer | Yes | ±2,147,483,647 | Current trading fee tier |

---

### 6.1.2.2 400 Bad Request

Returned if the request is malformed.

```json
{
  "error": "Invalid request"
}

```

# 6.2 User - Update User

## 6.2.1 Overview

Update user information. To enable automatic withdrawals, both `auto_withdraw_enabled` and `auto_withdraw_lightning_address` must be provided.

---

## 6.2.2 Request Body

### 6.2.2.1 Body (application/json)

```json
{
  "show_leaderboard": false
}

```

### Parameters (all optional):

- **`auto_withdraw_enabled`** *(boolean, optional)*
    
    Enable or disable automatic withdrawals.
    
- **`auto_withdraw_lightning_address`** *(string, optional)*
    
    Lightning address for auto-withdrawals. Required if `auto_withdraw_enabled = true`.
    
- **`username`** *(string, optional)*
    
    Public username (max 64 chars).
    
- **`use_taproot_addresses`** *(boolean, optional)*
    
    Whether to use Taproot addresses for deposits.
    
- **`show_leaderboard`** *(boolean, optional)*
    
    Whether to appear on public leaderboard.
    

---

## 6.2.3 Responses

### 6.2.3.1 200 OK

Returns the updated user profile.

```json
{
  "uid": "1602a190-9dc0-48ff-9fb9-4b62f7270007",
  "role": "user",
  "balance": 69420,
  "username": "alice",
  "synthetic_usd_balance": 0,
  "linking_public_key": "037b7c2587f823de3c62a639369b8c939bfb8f0bd40df58e9c1b6df63bcc88df4f",
  "show_leaderboard": false,
  "email": null,
  "email_confirmed": false,
  "use_taproot_addresses": false,
  "account_type": "lnurl",
  "auto_withdraw_enabled": false,
  "auto_withdraw_lightning_address": null,
  "totp_enabled": false,
  "webauthn_enabled": false,
  "fee_tier": 0
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `uid` | string | Yes | uuid | Unique user identifier |
| `role` | string | Yes | enum | User role: `"user"`, `"mod"`, `"operator"`, `"admin"` |
| `balance` | number | Yes | ±9e15 | BTC balance in sats |
| `username` | string | Yes | max 64 chars | Public username |
| `synthetic_usd_balance` | number | Yes | ±9e15 | Synthetic USD balance |
| `linking_public_key` | string | Yes | nullable | Public key for account linking |
| `show_leaderboard` | boolean | Yes | — | Whether user appears on public leaderboard |
| `email` | string | Yes | nullable, max 318 chars | User email address |
| `email_confirmed` | boolean | Yes | — | Whether email is verified |
| `use_taproot_addresses` | boolean | Yes | — | Whether user prefers Taproot deposit addresses |
| `account_type` | string | Yes | max 64 chars | Account type (e.g., `"lnurl"`) |
| `auto_withdraw_enabled` | boolean | Yes | — | Whether auto-withdraw is enabled |
| `auto_withdraw_lightning_address` | string | Yes | nullable, max 700 chars | Lightning address for auto-withdrawals |
| `totp_enabled` | boolean | Yes | — | Whether TOTP 2FA is enabled |
| `webauthn_enabled` | boolean | Yes | — | Whether WebAuthn 2FA is enabled |
| `fee_tier` | integer | Yes | ±2,147,483,647 | Current trading fee tier |

---

### 6.2.3.2 400 Bad Request

Returned if request is malformed or parameters are invalid.

```json
{
  "error": "Invalid parameters"
}

```

# 6.3 User - Get Bitcoin Addresses

## 6.3.1 Overview

Get user’s created Bitcoin addresses.

---

## 6.3.2 Responses

### 6.3.2.1 200 OK

Returns an array of Bitcoin address objects.

```json
[
  {
    "address": "bc1pzdg8s93p0mc019j5zjcrwtygyvs89rejkyqu7xButhy6vxf3qyhq90a4w",
    "creation_ts": 1675798700000,
    "is_used": true
  }
]

```

### Fields (per address object):

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `address` | string | Yes | Bitcoin deposit address |
| `creation_ts` | number | Yes | Timestamp of address creation (ms) |
| `is_used` | boolean | Yes | Whether address has received funds |

---

### 6.3.2.2 400 Bad Request

Returned if the request is malformed.

```json
{
  "error": "Invalid request"
}

```

# 6.4 User - New Bitcoin Address

## 6.4.1 Overview

Create a new Bitcoin deposit address.

---

## 6.4.2 Request Body

### 6.4.2.1 Body (application/json)

```json
{
  "format": "p2wpkh"
}

```

### Parameters:

- **`format`** *(string, required)*
Address format type.
Allowed values: `"p2wpkh"`, `"p2tr"`

---

## 6.4.3 Responses

### 6.4.3.1 200 OK

Returns the newly created Bitcoin address and its creation timestamp.

```json
{
  "address": "bc1pzdg8s93p0mc019j5zjcrwtygyvs89rejkyqu7xButhy6vxf3qyhq90a4w",
  "creation_ts": 1675790780000
}

```

### Fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `address` | string | Yes | Newly generated Bitcoin deposit address |
| `creation_ts` | number | Yes | Timestamp of address creation (ms) |

---

### 6.4.3.2 400 Bad Request

Returned if request is malformed or parameters are invalid.

```json
{
  "error": "Invalid address format"
}

```

# 6.5 User - Get Deposit

## 6.5.1 Overview

Get deposit by ID.

---

## 6.5.2 Path Parameters

### 6.5.2.1 Parameters

- **`id`** *(string, uuid, required)*
Unique identifier of the deposit to retrieve.

---

## 6.5.3 Responses

### 6.5.3.1 200 OK

Returns the deposit object matching the provided ID.

```json
{
  "id": "string",
  "amount": 0,
  "tx_id": "string",
  "is_confirmed": true,
  "ts": 0,
  "type": "bitcoin"
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `id` | string | Yes | uuid | Unique deposit identifier |
| `amount` | integer | Yes | ±9e15 | Deposit amount in sats |
| `tx_id` | string | Yes | max 64 chars | Blockchain transaction ID |
| `is_confirmed` | boolean | Yes | — | Whether deposit is confirmed on-chain |
| `ts` | number | Yes | — | Timestamp of deposit (ms) |
| `type` | string | Yes | `"bitcoin"` | Deposit type |

---

### 6.5.3.2 400 Bad Request

Returned if the deposit ID is invalid or the request is malformed.

```json
{
  "error": "Invalid deposit ID"
}

```

# 6.6 User - Get Deposits

## 6.6.1 Overview

Get multiple deposits. The `types` query parameter is optional and consists of a comma-separated list of deposit types: `bitcoin`, `internal`, `lightning`.

---

## 6.6.2 Query Parameters

### 6.6.2.1 Parameters

- **`types`** *(string, optional)*
Comma-separated list of deposit types to filter by.
Allowed values: `"bitcoin"`, `"internal"`, `"lightning"`

---

## 6.6.3 Responses

### 6.6.3.1 200 OK

Returns an array of deposit objects.

```json
[
  {
    "id": "69c09d09-8ce9-446b-a3c6-455fed8b3048",
    "amount": 1100000,
    "payment_hash": "d0956532e24bb5bff336e5b13027bb388569455e18ba8855411a3572e4a5b221",
    "success": false,
    "ts": 1707317892272,
    "type": "lightning"
  },
  {
    "id": "5a0ff213-045d-4a49-b8d2-aad12d1a8853",
    "amount": 1100000,
    "payment_hash": "72136991553e8df3a62e68e2534ca01e0883a49f0851c4bb6e33ce3245d5376a",
    "success": true,
    "ts": 1707317875537,
    "type": "lightning"
  }
]

```

### Fields (per deposit object):

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `id` | string | Yes | uuid | Unique deposit identifier |
| `amount` | integer | Yes | ±9e15 | Deposit amount in sats |
| `payment_hash` | string | Yes | max 64 chars | Hash of the payment (for Lightning) |
| `success` | boolean | Yes | — | Whether deposit was successful |
| `ts` | number | Yes | — | Timestamp of deposit (ms) |
| `type` | string | Yes | enum | Deposit type: `"bitcoin"`, `"internal"`, `"lightning"` |

---

### 6.6.3.2 400 Bad Request

Returned if the request is malformed or parameters are invalid.

```json
{
  "error": "Invalid deposit type"
}

```

# 6.7 User - Deposit

## 6.7.1 Overview

Create a new deposit.

---

## 6.7.2 Request Body

### 6.7.2.1 Body (application/json)

```json
{
  "amount": 1337
}

```

### Parameters:

- **`amount`** *(integer, required)*
Deposit amount in sats. Must be > 0.

---

## 6.7.3 Responses

### 6.7.3.1 200 OK

Returns details of the created deposit request.

```json
{
  "depositId": "66d68e66-b450-4ce2-a402-fd8e8dab828e",
  "paymentRequest": "lnbc73370n7pjufyndpp5p96cfwq662q0mkn7a0vy4h8rq5z6kw5q0l68udwrhg8na909wwsdzcf38zqntpwf4k2arnypzx2ur0wd5hggp4x9jk2vp4ve6z6dtxx4mz6dryxqez6wpsxumz6cejvemnzc3nxs6nwdeheqzzsxgzz6rzjqvk2judrj9wwqukxqpqdy3vrfdx4dueytinx4hpf70uf0r7ew1hmjuqqzpcqqqqgqqqqqgqlgqqqqqqgq2qsp5aynr4rr94ytesyx7pep2024ssdqjx7dj6m6ncckt0wt6nkcydp6q9qyyssqxx0r3nxy84ym9t5d4nrj2h90elhmmt5q7av3wg0tdcdxzpvu6fwpp96ejfkdg2fm8kuzkfp72qwxw24g4k73dalcn2gqzvmp3q369mqpydqr3r",
  "expiry": 90
}

```

### Fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `depositId` | string | Yes | Unique deposit identifier |
| `paymentRequest` | string | Yes | Lightning invoice (BOLT11) |
| `expiry` | number | Yes | Expiry time in seconds |

---

### 6.7.3.2 400 Bad Request

Returned if request is malformed or parameters are invalid.

```json
{
  "error": "Invalid amount"
}

```

# 6.8 User - Get Withdrawal

## 6.8.1 Overview

Get withdrawal by ID.

---

## 6.8.2 Path Parameters

### 6.8.2.1 Parameters

- **`id`** *(string, uuid, required)*
Unique identifier of the withdrawal to retrieve.

---

## 6.8.3 Responses

### 6.8.3.1 200 OK

Returns the withdrawal object matching the provided ID.

```json
{
  "id": "string",
  "amount": 0,
  "success": true,
  "to_username": "string",
  "ts": 0,
  "type": "internal"
}

```

### Fields:

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `id` | string | Yes | uuid | Unique withdrawal identifier |
| `amount` | number | Yes | ±9e15 | Withdrawal amount in sats |
| `success` | boolean | Yes | — | Whether withdrawal was successful |
| `to_username` | string | Yes | max 64 chars | Recipient’s username (for internal transfers) |
| `ts` | number | Yes | — | Timestamp of withdrawal (ms) |
| `type` | string | Yes | `"internal"` | Withdrawal type |

---

### 6.8.3.2 400 Bad Request

Returned if the withdrawal ID is invalid or the request is malformed.

```json
{
  "error": "Invalid withdrawal ID"
}

```

# 6.9 User - Get Withdrawals

## 6.9.1 Overview

Get multiple withdrawals. The `types` query parameter is optional and consists of a comma-separated list of withdrawal types: `bitcoin`, `internal`, `lightning`.

---

## 6.9.2 Query Parameters

### 6.9.2.1 Parameters

- **`types`** *(string, optional)*
Comma-separated list of withdrawal types to filter by.
Allowed values: `"bitcoin"`, `"internal"`, `"lightning"`

---

## 6.9.3 Responses

### 6.9.3.1 200 OK

Returns an array of withdrawal objects.

```json
[
  {
    "id": "f9cf683b-e028-4886-adbd-8632138adeea",
    "amount": 69420,
    "payment_hash": "247a60d309e023ecec1cc29a7ff589e38a6fe999ec2a10e09a49cdb348f88b79",
    "success": true,
    "fee": 22,
    "ts": 1707381467490,
    "type": "lightning"
  }
]

```

### Fields (per withdrawal object):

| Field | Type | Required | Constraints | Description |
| --- | --- | --- | --- | --- |
| `id` | string | Yes | uuid | Unique withdrawal identifier |
| `amount` | integer | Yes | ±9e15 | Withdrawal amount in sats |
| `payment_hash` | string | Yes | max 64 chars | Hash of the payment (for Lightning) |
| `success` | boolean | Yes | — | Whether withdrawal was successful |
| `fee` | integer | Yes | ±9e15 | Network or service fee paid |
| `ts` | number | Yes | — | Timestamp of withdrawal (ms) |
| `type` | string | Yes | enum | Withdrawal type: `"bitcoin"`, `"internal"`, `"lightning"` |

---

### 6.9.3.2 400 Bad Request

Returned if the request is malformed or parameters are invalid.

```json
{
  "error": "Invalid withdrawal type"
}

```

# 6.10 User - Withdraw

## 6.10.1 Overview

Create a new withdrawal.

---

## 6.10.2 Request Body

### 6.10.2.1 Body (application/json)

```json
{
  "invoice": "lnbc13370n1pjufy72pp5eyxlltyeyzhwppmzqvy2mp7d44xq3vpmgqj90cyszngx..."
}

```

### Parameters:

- **`invoice`** *(string, required)*
Lightning invoice (BOLT11) to withdraw funds to.

---

## 6.10.3 Responses

### 6.10.3.1 200 OK

Returns details of the created withdrawal.

```json
{
  "id": "fbec0da3-1276-4583-9b56-e2cc074db278",
  "paymentHash": "c90dffac9920aec087620308a987cdad4c08b03b402457e09914e1c30a789e98",
  "amount": 1337,
  "fee": 22,
  "successTime": 1707381751702
}

```

### Fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Unique withdrawal identifier |
| `paymentHash` | string | Yes | Hash of the Lightning payment |
| `amount` | number | Yes | Withdrawal amount in sats |
| `fee` | number | Yes | Network fee paid |
| `successTime` | number | Yes | Timestamp of successful withdrawal (ms) |

---

### 6.10.3.2 400 Bad Request

Returned if request is malformed or parameters are invalid.

```json
{
  "error": "Invalid invoice"
}

```

# 7.1 Oracle - Index

## 7.1.1 Overview

Samples index history — at most 100 entries between two given timestamps.

---

## 7.1.2 Query Parameters

### 7.1.2.1 Parameters

- **`from`** *(number, required)*
    
    Start timestamp (in milliseconds) to fetch index history from.
    
- **`to`** *(number, required)*
    
    End timestamp (in milliseconds) to fetch index history up to.
    
- **`limit`** *(integer, optional, default: 100, min: 1, max: 1000)*
    
    Maximum number of records to return.
    

---

## 7.1.3 Responses

### 7.1.3.1 200 OK

Returns an array of index records.

```json
[
  {
    "time": 1628604000000,
    "index": 40088
  },
  {
    "time": 1628603940000,
    "index": 40080
  }
]

```

### Fields (per record):

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `time` | number | Yes | Timestamp of the index (ms) |
| `index` | number | Yes | Index price at that timestamp |

---

### 7.1.3.2 400 Bad Request

Returned if query parameters are invalid or malformed.

```json
{
  "error": "Invalid parameter: from"
}

```

# 7.2 Oracle - Last Price

## 7.2.1 Overview

Samples last price history — at most 100 entries between two given timestamps.

---

## 7.2.2 Query Parameters

### 7.2.2.1 Parameters

- **`from`** *(number, required)*
    
    Start timestamp (in milliseconds) to fetch last price history from.
    
- **`to`** *(number, required)*
    
    End timestamp (in milliseconds) to fetch last price history up to.
    
- **`limit`** *(integer, optional, default: 100, min: 1, max: 1000)*
    
    Maximum number of records to return.
    

---

## 7.2.3 Responses

### 7.2.3.1 200 OK

Returns an array of last price records.

```json
[
  {
    "time": 1628604000000,
    "last_price": 40000
  },
  {
    "time": 1628603940000,
    "last_price": 40000
  }
]

```

### Fields (per record):

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `time` | number | Yes | Timestamp of the last price (ms) |
| `last_price` | number | Yes | Last traded price at that timestamp |

---

### 7.2.3.2 400 Bad Request

Returned if query parameters are invalid or malformed.

```json
{
  "error": "Invalid parameter: from"
}

```

# 8.1 Notification - Fetch Notifications

## 8.1.1 Overview

Get unread notifications.

---

## 8.1.2 Responses

### 8.1.2.1 200 OK

Returns an array of unread notification objects.

```json
[
  {
    "id": "a140cd3f-c211-4700-9c70-1dfec45f8bfd",
    "creation_ts": 1707729495442,
    "event": "deposit/lightning/success",
    "data": {
      "amount": 1337,
      "description": ""
    },
    "read": false
  }
]

```

### Fields (per notification object):

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Unique notification identifier (uuid) |
| `creation_ts` | number | Yes | Timestamp of notification creation (ms) |
| `event` | string | Yes | Type of event that triggered the notification |
| `data` | object | Yes | Event-specific data payload |
| `read` | boolean | Yes | Whether the notification has been read |

---

### 8.1.2.2 400 Bad Request

Returned if the request is malformed.

```json
{
  "error": "Invalid request"
}

```

# 8.2 Notification - Mark All Notifications As Read

## 8.2.1 Overview

Marks all notifications as read.

---

## 8.2.2 Responses

### 8.2.2.1 200 OK

Returns an empty successful response.

```json
{}

```

---

### 8.2.2.2 400 Bad Request

Returned if the request is malformed.

```json
{
  "error": "Invalid request"
}

```