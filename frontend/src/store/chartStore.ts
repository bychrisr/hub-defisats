// src/store/chartStore.ts
import { create } from 'zustand';
import { RawBar, LwcBar, IndicatorKey } from '@/types/chart';
import { normalizeBars } from '@/utils/time';

type ChartState = {
  rawBars: RawBar[];
  normalized: LwcBar[];
  active: Record<IndicatorKey, boolean>;
  setRawBars: (bars: RawBar[]) => void;
  toggleIndicator: (k: IndicatorKey, v?: boolean) => void;
  setActive: (next: Record<IndicatorKey, boolean>) => void;
};

export const useChartStore = create<ChartState>((set) => ({
  rawBars: [],
  normalized: [],
  active: { 
    volume: true, 
    rsi: false, 
    macd: false, 
    ema: true, 
    bb: false 
  },
  setRawBars: (bars) =>
    set((state) => {
      // normalize here using utility
      const normalized = normalizeBars(bars);
      return { rawBars: bars, normalized };
    }),
  toggleIndicator: (k, v) => 
    set((state) => ({ 
      active: { 
        ...state.active, 
        [k]: typeof v === 'boolean' ? v : !state.active[k] 
      } 
    })),
  setActive: (next) => set({ active: next }),
}));
