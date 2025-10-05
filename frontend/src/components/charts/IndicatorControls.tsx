// src/components/charts/IndicatorControls.tsx
import React from 'react';
import { useChartStore } from '@/store/chartStore';

export default function IndicatorControls() {
  const active = useChartStore(s => s.active);
  const toggle = useChartStore(s => s.toggleIndicator);

  return (
    <div className="flex gap-3 items-center p-2 bg-gray-800 rounded-lg">
      <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
        <input 
          type="checkbox" 
          checked={active.volume} 
          onChange={() => toggle('volume')}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        Volume (fixed)
      </label>
      <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
        <input 
          type="checkbox" 
          checked={active.ema} 
          onChange={() => toggle('ema')}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        EMA (overlay)
      </label>
      <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
        <input 
          type="checkbox" 
          checked={active.bb} 
          onChange={() => toggle('bb')}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        Bollinger Bands (overlay)
      </label>
      <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
        <input 
          type="checkbox" 
          checked={active.rsi} 
          onChange={() => toggle('rsi')}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        RSI (pane)
      </label>
      <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
        <input 
          type="checkbox" 
          checked={active.macd} 
          onChange={() => toggle('macd')}
          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
        />
        MACD (pane)
      </label>
    </div>
  );
}
