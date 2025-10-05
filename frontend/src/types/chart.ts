// src/types/chart.ts
export type RawBar = {
  // time pode ser number (seconds OR ms) ou ISO string ou 'YYYY-MM-DD'
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type LwcBar = {
  // time normalized to either number (seconds since epoch) or 'YYYY-MM-DD'
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type LinePoint = { 
  time: number | string; 
  value: number; 
};

export type HistogramPoint = { 
  time: number | string; 
  value: number; 
  color?: string; 
};

export type IndicatorKey = 'volume' | 'rsi' | 'macd' | 'ema' | 'bb';

export type ChartState = {
  rawBars: RawBar[];
  normalized: LwcBar[];
  active: Record<IndicatorKey, boolean>;
  setRawBars: (bars: RawBar[]) => void;
  toggleIndicator: (k: IndicatorKey, v?: boolean) => void;
  setActive: (next: Record<IndicatorKey, boolean>) => void;
};

export type MACDResult = {
  macdLine: LinePoint[];
  signalLine: LinePoint[];
  histogram: LinePoint[];
};

export type BollingerResult = {
  middle: LinePoint[];
  upper: LinePoint[];
  lower: LinePoint[];
};
