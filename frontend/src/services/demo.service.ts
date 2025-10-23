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
