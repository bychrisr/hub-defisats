// src/components/charts/TradingChartDemo.tsx
import React, { useEffect } from 'react';
import { useChartStore } from '@/store/chartStore';
import TradingChart from './TradingChart';

// Demo component with sample data
export default function TradingChartDemo() {
  const setRawBars = useChartStore(s => s.setRawBars);

  useEffect(() => {
    // Generate sample data for demonstration
    const generateSampleData = () => {
      const bars = [];
      let price = 50000; // Starting BTC price
      const now = Date.now() / 1000;
      
      // Generate 200 hours of data (1h timeframe)
      for (let i = 0; i < 200; i++) {
        const time = now - (200 - i) * 3600; // 1 hour intervals
        const change = (Math.random() - 0.5) * 1000; // Random price change
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.random() * 200;
        const low = Math.min(open, close) - Math.random() * 200;
        const volume = Math.random() * 1000000;
        
        bars.push({
          time: Math.floor(time),
          open,
          high,
          low,
          close,
          volume
        });
        
        price = close;
      }
      
      return bars;
    };

    const sampleData = generateSampleData();
    setRawBars(sampleData);
  }, [setRawBars]);

  return (
    <div className="w-full h-full bg-gray-900 p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">Trading Chart Demo</h2>
        <p className="text-gray-400">
          Interactive chart with technical indicators. Toggle indicators using the controls above.
        </p>
      </div>
      
      <TradingChart />
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Features:</p>
        <ul className="list-disc list-inside ml-4">
          <li>Real-time candlestick chart with volume</li>
          <li>Technical indicators: EMA, RSI, MACD, Bollinger Bands</li>
          <li>Synchronized zoom and pan across all panes</li>
          <li>Responsive design with resize handling</li>
          <li>Professional dark theme</li>
        </ul>
      </div>
    </div>
  );
}
