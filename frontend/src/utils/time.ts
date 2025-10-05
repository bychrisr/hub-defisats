// src/utils/time.ts
import { RawBar, LwcBar } from '@/types/chart';

export function normalizeTime(t: number | string | Date): number | string {
  // if Date instance
  if (t instanceof Date) {
    return Math.floor(t.getTime() / 1000);
  }
  if (typeof t === 'number') {
    // heuristic: > 1e12 -> milliseconds; > 1e9 -> seconds
    if (t > 1e12) return Math.floor(t / 1000);
    return Math.floor(t);
  }
  if (typeof t === 'string') {
    // if business-day 'YYYY-MM-DD'
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
    const parsed = Date.parse(t);
    if (!isNaN(parsed)) return Math.floor(parsed / 1000);
    throw new Error('Unsupported time string format: ' + t);
  }
  throw new Error('Unsupported time format: ' + String(t));
}

export function normalizeBars(raw: RawBar[]): LwcBar[] {
  return raw.map(b => ({
    time: normalizeTime(b.time),
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume ?? 0,
  }));
}
