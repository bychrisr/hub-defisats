---
title: "Demo Mode"
category: features
subcategory: user-experience
tags: [demo, onboarding, user-experience, data]
priority: high
status: active
last_updated: 2025-01-22
version: "1.0"
authors: ["Axisor Team"]
---

# Demo Mode

## Summary

Demo mode provides unverified users with a realistic preview of the platform using static demo data. Users can explore features, run backtests, and understand the platform's value before committing to email verification.

## Demo Data Structure

### Static JSON Files

```typescript
// /public/demo/ohlcv_BTCUSD_1h.json
[
  [1704067200, 42500, 42800, 42300, 42650, 1234.5],
  [1704070800, 42650, 42900, 42500, 42750, 1567.2],
  // ... more OHLCV data
]

// /public/demo/metrics.json
{
  "totalPnL": 12.4,
  "totalPnLSats": 124000,
  "winRate": 58.3,
  "totalTrades": 47,
  "winningTrades": 27,
  "losingTrades": 20
}

// /public/demo/bots.json
[
  {
    "id": "demo-bot-1",
    "name": "EMA Crossover 9/21",
    "status": "draft",
    "type": "ema_crossover"
  }
]

// /public/demo/positions.json
[
  {
    "id": "demo-pos-1",
    "side": "long",
    "quantity": 0.05,
    "entryPrice": 42500,
    "currentPrice": 43200,
    "pnl": 3.2
  }
]
```

## Demo Service Implementation

```typescript
export interface DemoData {
  ohlcv: number[][];
  metrics: any;
  bots: any[];
  positions: any[];
}

export async function loadDemoData(): Promise<DemoData> {
  const [ohlcv, metrics, bots, positions] = await Promise.all([
    fetch('/demo/ohlcv_BTCUSD_1h.json').then(r => r.json()),
    fetch('/demo/metrics.json').then(r => r.json()),
    fetch('/demo/bots.json').then(r => r.json()),
    fetch('/demo/positions.json').then(r => r.json())
  ]);
  
  return { ohlcv, metrics, bots, positions };
}
```

## Demo Mode UX

### Demo Banner

```typescript
<div className="demo-banner">
  <span>🎯 Demo Mode</span>
  <span>You're viewing demo data. Verify your email to access real features.</span>
  <button onClick={verifyEmail}>Verify Email</button>
</div>
```

### Demo Indicators

- Clear "DEMO" labels on all data
- Different styling for demo vs real data
- Upgrade prompts at key interaction points
- Progress indicators showing demo limitations

## Integration with Dashboard

```typescript
// Dashboard component with demo support
function Dashboard() {
  const { entitlements } = useEntitlements();
  const isDemoMode = entitlements?.demo_mode;
  
  if (isDemoMode) {
    return <DemoDashboard />;
  }
  
  return <RealDashboard />;
}
```

## Related Documentation

- [Registration Verification Flow](./registration-verification-flow.md)
- [Entitlements System](./entitlements-system.md)
- [Plan Gate System](./plan-gate-system.md)
