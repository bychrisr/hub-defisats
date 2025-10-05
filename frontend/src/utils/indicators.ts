// src/utils/indicators.ts
import { LwcBar, LinePoint, HistogramPoint, MACDResult, BollingerResult } from '@/types/chart';

// 3.1 EMA (Exponential Moving Average)
export function computeEMAFromBars(bars: LwcBar[], period: number): LinePoint[] {
  if (!bars || bars.length < period) return [];

  const k = 2 / (period + 1);
  const closes = bars.map(b => b.close);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += closes[i];
  let prevEma = sum / period; // first EMA = SMA of first period
  const out: LinePoint[] = [];
  // align: first EMA corresponds to index period-1
  out.push({ time: bars[period - 1].time, value: prevEma });

  for (let i = period; i < bars.length; i++) {
    const ema = (closes[i] - prevEma) * k + prevEma;
    prevEma = ema;
    out.push({ time: bars[i].time, value: ema });
  }
  return out;
}

// 3.2 SMA (Simple Moving Average) — utilitário usado por Bollinger e inicial EMA
export function computeSMAFromBars(bars: LwcBar[], period: number): LinePoint[] {
  const out: LinePoint[] = [];
  if (bars.length < period) return out;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += bars[i].close;
  out.push({ time: bars[period - 1].time, value: sum / period });
  for (let i = period; i < bars.length; i++) {
    sum += bars[i].close - bars[i - period].close;
    out.push({ time: bars[i].time, value: sum / period });
  }
  return out;
}

// 3.3 RSI (Wilder smoothing) — padrão 14
export function computeRSI(bars: LwcBar[], period = 14): LinePoint[] {
  if (bars.length <= period) return [];

  const out: LinePoint[] = [];
  // initial avg gain/loss:
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = bars[i].close - bars[i - 1].close;
    if (diff >= 0) gain += diff;
    else loss += -diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  // first RSI time is bars[period]
  const rsFirst = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  const rsiFirst = avgLoss === 0 ? 100 : 100 - 100 / (1 + rsFirst);
  out.push({ time: bars[period].time, value: rsiFirst });

  for (let i = period + 1; i < bars.length; i++) {
    const change = bars[i].close - bars[i - 1].close;
    const thisGain = change > 0 ? change : 0;
    const thisLoss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + thisGain) / period;
    avgLoss = (avgLoss * (period - 1) + thisLoss) / period;
    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);
    out.push({ time: bars[i].time, value: rsi });
  }
  return out;
}

// 3.4 MACD (12,26,9) — retorna MACD line, signal, histogram
export function computeMACD(bars: LwcBar[], fast = 12, slow = 26, signal = 9): MACDResult {
  // compute fast and slow EMAs aligned; each returns array starting at index (period-1)
  const emaFast = computeEMAFromBars(bars, fast); // times start at fast-1
  const emaSlow = computeEMAFromBars(bars, slow); // times start at slow-1
  // align: MACD value exists when both fast and slow exist (i >= slow-1)
  // build macdLine points using bars index >= slow-1
  const macdLine: LinePoint[] = [];
  const timesToEmaFast = new Map(emaFast.map(p => [String(p.time), p.value]));
  const timesToEmaSlow = new Map(emaSlow.map(p => [String(p.time), p.value]));
  // iterate bars where slow EMA exists
  for (const p of emaSlow) {
    const tStr = String(p.time);
    const ef = timesToEmaFast.get(tStr);
    const es = p.value;
    if (ef !== undefined) {
      macdLine.push({ time: p.time, value: ef - es });
    }
  }
  // signal = EMA of macdLine values
  // to compute EMA, reuse computeEMAFromBars style but on the macd numeric array
  function computeEMAFromNumericSeries(series: LinePoint[], periodNum: number): LinePoint[] {
    if (series.length < periodNum) return [];
    const out: LinePoint[] = [];
    let sum = 0;
    for (let i = 0; i < periodNum; i++) sum += series[i].value;
    let prev = sum / periodNum;
    out.push({ time: series[periodNum - 1].time, value: prev });
    for (let i = periodNum; i < series.length; i++) {
      const curr = (series[i].value - prev) * (2 / (periodNum + 1)) + prev;
      prev = curr;
      out.push({ time: series[i].time, value: curr });
    }
    return out;
  }
  const signalLine = computeEMAFromNumericSeries(macdLine, signal);
  // build histogram aligned: histogram time points are where both macd and signal exist
  const signalMap = new Map(signalLine.map(p => [String(p.time), p.value]));
  const histogram: LinePoint[] = [];
  const macdMap = new Map(macdLine.map(p => [String(p.time), p.value]));
  // align where signal exists
  for (const s of signalLine) {
    const t = String(s.time);
    const m = macdMap.get(t);
    if (m !== undefined) {
      histogram.push({ time: s.time, value: m - s.value });
    }
  }
  return { macdLine, signalLine, histogram };
}

// 3.5 Bollinger Bands (SMA ± k*std) — default: period 20, k=2
export function computeBollinger(bars: LwcBar[], period = 20, k = 2): BollingerResult {
  if (bars.length < period) return { middle: [], upper: [], lower: [] };
  const middle = computeSMAFromBars(bars, period);
  const upper: LinePoint[] = [];
  const lower: LinePoint[] = [];
  for (let i = period - 1; i < bars.length; i++) {
    // compute stddev of closes[i-period+1 .. i]
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += bars[j].close;
    const mean = sum / period;
    let variance = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const d = bars[j].close - mean;
      variance += d * d;
    }
    variance = variance / period;
    const std = Math.sqrt(variance);
    const t = bars[i].time;
    upper.push({ time: t, value: mean + k * std });
    lower.push({ time: t, value: mean - k * std });
  }
  return { middle, upper, lower };
}

// 4 — Regras de cor do Volume (histograma colorido)
export function buildVolumeHistogram(bars: LwcBar[]): HistogramPoint[] {
  return bars.map(b => {
    let color = '#6b7280'; // neutral
    if (b.close > b.open) color = '#26a69a'; // up
    else if (b.close < b.open) color = '#ef5350'; // down
    return { time: b.time, value: b.volume ?? 0, color };
  });
}
