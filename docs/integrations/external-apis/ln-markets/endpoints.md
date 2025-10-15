---
title: LN Markets API Endpoints Reference
category: integrations
subcategory: external-apis
tags: [ln-markets, api-endpoints, rest-api, trading, futures]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["Backend Team"]
---

# LN Markets API Endpoints Reference

## Summary

Comprehensive reference for all LN Markets API v2 endpoints organized by domain (User, Futures, Market). This document provides detailed information about each endpoint, including parameters, responses, authentication requirements, and usage examples.

## Architecture

```mermaid
graph TB
    A[LN Markets API v2] --> B[User Domain]
    A --> C[Futures Domain]
    A --> D[Market Domain]
    
    B --> B1[GET /user]
    B --> B2[PUT /user]
    B --> B3[GET /user/deposits]
    B --> B4[GET /user/withdrawals]
    B --> B5[POST /user/deposits/bitcoin]
    B --> B6[POST /user/deposits/lightning]
    B --> B7[POST /user/withdrawals]
    
    C --> C1[GET /futures]
    C --> C2[POST /futures]
    C --> C3[GET /futures/{id}]
    C --> C4[DELETE /futures/{id}]
    C --> C5[PUT /futures/{id}/stop-loss-take-profit]
    C --> C6[POST /futures/{id}/add-margin]
    C --> C7[POST /futures/{id}/cash-in]
    C --> C8[GET /futures/carry-fees]
    C --> C9[GET /futures/market]
    
    D --> D1[GET /futures/ticker]
    D --> D2[GET /futures/btc_usd/ticker]
    D --> D3[GET /futures/btc_usd/index]
    D --> D4[GET /futures/btc_usd/price]
    D --> D5[GET /options/btc_usd/volatility-index]
    D --> D6[GET /leaderboard]
    D --> D7[GET /options/market]
```

## User Domain Endpoints

### User Information

#### GET /user
**Description**: Get user information and balance
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const user = await api.user.getUser();

// Response
interface LNMarketsUser {
  id: string;
  username: string;
  email: string;
  balance: number;
  currency: string;
  isTestnet: boolean;
  createdAt: string;
  lastLogin: string;
  preferences: {
    notifications: boolean;
    theme: string;
    language: string;
  };
}
```

#### PUT /user
**Description**: Update user settings and preferences
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const updateData: LNMarketsUserUpdate = {
  preferences: {
    notifications: true,
    theme: 'dark',
    language: 'en'
  }
};

const updatedUser = await api.user.updateUser(updateData);

// Response
{
  "success": true,
  "user": {
    // Updated user object
  }
}
```

### Deposit Management

#### GET /user/deposits
**Description**: Get user deposit history
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const deposits = await api.user.getDeposits({
  limit: 50,
  offset: 0,
  status: 'confirmed'
});

// Response
interface LNMarketsDeposit {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'failed';
  type: 'bitcoin' | 'lightning';
  address?: string;
  invoice?: string;
  txHash?: string;
  createdAt: string;
  confirmedAt?: string;
}
```

#### POST /user/deposits/bitcoin
**Description**: Create new Bitcoin deposit address
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const depositRequest: LNMarketsDepositRequest = {
  amount: 0.001, // Optional minimum amount
  currency: 'BTC'
};

const depositResponse = await api.user.createBitcoinDeposit(depositRequest);

// Response
interface LNMarketsDepositResponse {
  address: string;
  amount: number;
  currency: string;
  expiresAt: string;
  instructions: string[];
}
```

#### POST /user/deposits/lightning
**Description**: Create Lightning Network invoice
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const lightningRequest: LNMarketsLightningDepositRequest = {
  amount: 100000, // Satoshis
  memo: 'Axisor deposit'
};

const lightningResponse = await api.user.createLightningDeposit(lightningRequest);

// Response
interface LNMarketsLightningDepositResponse {
  invoice: string;
  paymentHash: string;
  amount: number;
  expiresAt: string;
  memo: string;
}
```

### Withdrawal Management

#### GET /user/withdrawals
**Description**: Get user withdrawal history
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const withdrawals = await api.user.getWithdrawals({
  limit: 50,
  offset: 0,
  status: 'completed'
});

// Response
interface LNMarketsWithdrawal {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  type: 'bitcoin' | 'lightning';
  address: string;
  txHash?: string;
  fee: number;
  createdAt: string;
  completedAt?: string;
}
```

#### POST /user/withdrawals
**Description**: Create new withdrawal request
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const withdrawalRequest: LNMarketsWithdrawalRequest = {
  amount: 0.001,
  currency: 'BTC',
  address: 'bc1q...',
  type: 'bitcoin'
};

const withdrawalResponse = await api.user.createWithdrawal(withdrawalRequest);

// Response
interface LNMarketsWithdrawalResponse {
  id: string;
  amount: number;
  fee: number;
  total: number;
  address: string;
  status: 'pending';
  estimatedTime: string;
}
```

## Futures Domain Endpoints

### Position Management

#### GET /futures
**Description**: Get user's futures positions
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const positions = await api.futures.getRunningPositions();

// Response
interface LNMarketsFuturesPosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  margin: number;
  leverage: number;
  pnl: number;
  pnlPercentage: number;
  status: 'running' | 'closed';
  createdAt: string;
  updatedAt: string;
  stopLoss?: number;
  takeProfit?: number;
}
```

#### POST /futures
**Description**: Create new futures position
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const orderParams: LNMarketsFuturesParams = {
  symbol: 'BTC_USD',
  side: 'long',
  size: 100, // USD
  leverage: 10,
  type: 'market'
};

const newPosition = await api.futures.createPosition(orderParams);

// Response
{
  "success": true,
  "position": {
    // Position object
  },
  "orderId": "order_123"
}
```

#### GET /futures/{id}
**Description**: Get specific position details
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const position = await api.futures.getPosition('position_123');

// Response
{
  "position": {
    // Detailed position object with history
  }
}
```

#### DELETE /futures/{id}
**Description**: Close futures position
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const result = await api.futures.closePosition('position_123');

// Response
{
  "success": true,
  "position": {
    // Closed position object
  },
  "pnl": 150.75
}
```

### Position Management

#### PUT /futures/{id}/stop-loss-take-profit
**Description**: Update stop loss and take profit levels
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const sltpUpdate: LNMarketsStopLossTakeProfitUpdate = {
  stopLoss: 45000,
  takeProfit: 55000
};

const result = await api.futures.updateStopLossTakeProfit('position_123', sltpUpdate);

// Response
{
  "success": true,
  "position": {
    // Updated position object
  }
}
```

#### POST /futures/{id}/add-margin
**Description**: Add margin to existing position
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const marginRequest: LNMarketsAddMarginRequest = {
  amount: 50 // USD
};

const result = await api.futures.addMargin('position_123', marginRequest);

// Response
{
  "success": true,
  "position": {
    // Updated position with new margin
  }
}
```

#### POST /futures/{id}/cash-in
**Description**: Cash in profits from position
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const cashInRequest: LNMarketsCashInRequest = {
  amount: 100 // USD to cash in
};

const result = await api.futures.cashIn('position_123', cashInRequest);

// Response
{
  "success": true,
  "position": {
    // Updated position after cash in
  },
  "cashedAmount": 100
}
```

### Market Information

#### GET /futures/carry-fees
**Description**: Get current carry fees
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const carryFees = await api.futures.getCarryFees();

// Response
interface LNMarketsCarryFee {
  symbol: string;
  longRate: number; // Annual percentage
  shortRate: number; // Annual percentage
  lastUpdated: string;
}
```

#### GET /futures/market
**Description**: Get futures market information
**Authentication**: Required
**Rate Limit**: 1 req/sec

```typescript
// Request
const marketInfo = await api.futures.getMarketInfo();

// Response
interface LNMarketsMarketInfo {
  symbol: string;
  lastPrice: number;
  indexPrice: number;
  markPrice: number;
  fundingRate: number;
  nextFundingTime: string;
  openInterest: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}
```

## Market Domain Endpoints

### Public Market Data

#### GET /futures/ticker
**Description**: Get current ticker information (public)
**Authentication**: Not required
**Rate Limit**: 10 req/sec

```typescript
// Request
const ticker = await api.market.getTicker();

// Response
interface LNMarketsTicker {
  symbol: string;
  lastPrice: number;
  bid: number;
  ask: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  change24h: number;
  changePercentage24h: number;
  timestamp: string;
}
```

#### GET /futures/btc_usd/ticker
**Description**: Get BTC/USD specific ticker
**Authentication**: Not required
**Rate Limit**: 10 req/sec

```typescript
// Request
const btcTicker = await api.market.getBTCTicker();

// Response
{
  "symbol": "BTC_USD",
  "lastPrice": 43250.50,
  "bid": 43245.00,
  "ask": 43255.00,
  "high24h": 44500.00,
  "low24h": 42800.00,
  "volume24h": 1250000.00,
  "change24h": -1249.50,
  "changePercentage24h": -2.81,
  "timestamp": "2025-01-06T10:30:00Z"
}
```

### Historical Data

#### GET /futures/btc_usd/index
**Description**: Get historical index price data
**Authentication**: Not required
**Rate Limit**: 5 req/sec

```typescript
// Request
const indexData = await api.market.getIndexHistory({
  start: '2025-01-01T00:00:00Z',
  end: '2025-01-06T00:00:00Z',
  interval: '1h'
});

// Response
interface LNMarketsIndexPoint {
  timestamp: string;
  price: number;
  volume?: number;
}
```

#### GET /futures/btc_usd/price
**Description**: Get historical price data
**Authentication**: Not required
**Rate Limit**: 5 req/sec

```typescript
// Request
const priceData = await api.market.getPriceHistory({
  start: '2025-01-01T00:00:00Z',
  end: '2025-01-06T00:00:00Z',
  interval: '1h'
});

// Response
interface LNMarketsPricePoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
```

### Options Data

#### GET /options/btc_usd/volatility-index
**Description**: Get BTC/USD volatility index
**Authentication**: Not required
**Rate Limit**: 5 req/sec

```typescript
// Request
const volatilityIndex = await api.market.getVolatilityIndex();

// Response
interface LNMarketsVolatilityIndex {
  symbol: string;
  index: number;
  change24h: number;
  timestamp: string;
  historicalData: Array<{
    timestamp: string;
    value: number;
  }>;
}
```

#### GET /options/market
**Description**: Get options market information
**Authentication**: Not required
**Rate Limit**: 5 req/sec

```typescript
// Request
const optionsMarket = await api.market.getOptionsMarket();

// Response
interface LNMarketsOptionsMarketInfo {
  symbol: string;
  strikes: Array<{
    strike: number;
    calls: Array<{
      expiry: string;
      bid: number;
      ask: number;
      volume: number;
    }>;
    puts: Array<{
      expiry: string;
      bid: number;
      ask: number;
      volume: number;
    }>;
  }>;
  expiryDates: string[];
  lastUpdated: string;
}
```

### Leaderboard

#### GET /leaderboard
**Description**: Get trading leaderboard
**Authentication**: Not required
**Rate Limit**: 5 req/sec

```typescript
// Request
const leaderboard = await api.market.getLeaderboard({
  period: '24h', // 24h, 7d, 30d, all
  limit: 100
});

// Response
interface LNMarketsLeaderboard {
  period: string;
  rankings: Array<{
    rank: number;
    username: string;
    pnl: number;
    pnlPercentage: number;
    volume: number;
    trades: number;
  }>;
  lastUpdated: string;
}
```

## Error Handling

### Common Error Responses

```typescript
// 400 Bad Request
{
  "error": "Invalid parameters",
  "code": "INVALID_PARAMS",
  "details": {
    "field": "amount",
    "message": "Amount must be greater than 0"
  }
}

// 401 Unauthorized
{
  "error": "Invalid credentials",
  "code": "AUTH_FAILED"
}

// 403 Forbidden
{
  "error": "Insufficient permissions",
  "code": "INSUFFICIENT_PERMISSIONS"
}

// 429 Rate Limited
{
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retry_after": 60
}

// 500 Internal Server Error
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

## Usage Examples

### Complete Trading Flow

```typescript
import { LNMarketsAPIv2 } from './services/lnmarkets/LNMarketsAPIv2.service';

async function tradingExample() {
  const api = new LNMarketsAPIv2({
    credentials: {
      apiKey: process.env.LNMARKETS_API_KEY,
      apiSecret: process.env.LNMARKETS_API_SECRET,
      passphrase: process.env.LNMARKETS_PASSPHRASE,
      isTestnet: true
    },
    logger: winstonLogger
  });

  try {
    // 1. Get user balance
    const user = await api.user.getUser();
    console.log('Balance:', user.balance);

    // 2. Get market data
    const ticker = await api.market.getTicker();
    console.log('Current price:', ticker.lastPrice);

    // 3. Create position
    const position = await api.futures.createPosition({
      symbol: 'BTC_USD',
      side: 'long',
      size: 100,
      leverage: 10,
      type: 'market'
    });

    // 4. Set stop loss and take profit
    await api.futures.updateStopLossTakeProfit(position.id, {
      stopLoss: ticker.lastPrice * 0.95,
      takeProfit: ticker.lastPrice * 1.05
    });

    // 5. Monitor position
    const updatedPosition = await api.futures.getPosition(position.id);
    console.log('Position PnL:', updatedPosition.pnl);

  } catch (error) {
    console.error('Trading error:', error);
  }
}
```

### Historical Data Analysis

```typescript
async function analyzeHistoricalData() {
  const api = new LNMarketsAPIv2({ /* config */ });

  try {
    // Get 7 days of hourly data
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    const priceData = await api.market.getPriceHistory({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      interval: '1h'
    });

    // Calculate simple moving average
    const sma = calculateSMA(priceData.map(p => p.close), 24);
    console.log('24h SMA:', sma);

    // Calculate volatility
    const volatility = calculateVolatility(priceData.map(p => p.close));
    console.log('7-day volatility:', volatility);

  } catch (error) {
    console.error('Analysis error:', error);
  }
}
```

## Rate Limiting Guidelines

### Rate Limits by Endpoint Type

| Endpoint Type | Rate Limit | Burst Limit |
|---------------|------------|-------------|
| Public Market Data | 10 req/sec | 50 req/min |
| Authenticated User | 1 req/sec | 5 req/min |
| Authenticated Futures | 1 req/sec | 5 req/min |
| Historical Data | 5 req/sec | 20 req/min |

### Best Practices

1. **Implement Client-Side Throttling**: Always throttle requests locally
2. **Use Request Queuing**: Queue requests when rate limited
3. **Cache Responses**: Cache market data for 30 seconds
4. **Batch Operations**: Group related requests when possible
5. **Handle 429 Errors**: Implement exponential backoff

## Troubleshooting

### Common Issues

#### 1. Authentication Failures

**Symptoms**: 401 errors, "Invalid credentials"
**Solutions**:
- Verify API key, secret, and passphrase
- Check timestamp synchronization
- Ensure correct signature generation

#### 2. Rate Limiting

**Symptoms**: 429 errors, requests failing
**Solutions**:
- Implement proper rate limiting
- Use exponential backoff
- Cache responses appropriately

#### 3. Network Issues

**Symptoms**: Timeouts, connection errors
**Solutions**:
- Increase timeout values
- Implement retry logic
- Use connection pooling

## How to Use This Document

- **For Developers**: Reference endpoint details when implementing LN Markets integration
- **For API Testing**: Use examples for testing individual endpoints
- **For Error Handling**: Follow error response patterns for robust error handling
- **For Rate Limiting**: Implement client-side throttling based on documented limits

