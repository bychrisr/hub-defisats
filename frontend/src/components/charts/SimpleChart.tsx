import React, { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

const SimpleChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Obter cores do tema atual
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#ffffff' : '#000000';
    const borderColor = isDark ? '#374151' : '#e5e7eb';
    const backgroundColor = 'transparent';

    const chart = createChart(chartContainerRef.current, {
      width: 400,
      height: 300,
      layout: {
        background: { color: backgroundColor },
        textColor: textColor,
      },
      grid: {
        vertLines: { color: borderColor },
        horzLines: { color: borderColor },
      },
      rightPriceScale: {
        borderColor: borderColor,
      },
      timeScale: {
        borderColor: borderColor,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: isDark ? '#10b981' : '#059669',
      downColor: isDark ? '#ef4444' : '#dc2626',
      borderVisible: false,
      wickUpColor: isDark ? '#10b981' : '#059669',
      wickDownColor: isDark ? '#ef4444' : '#dc2626',
    });

    // Dados de exemplo
    const data = [
      { time: '2023-01-01', open: 100, high: 110, low: 95, close: 105 },
      { time: '2023-01-02', open: 105, high: 115, low: 100, close: 110 },
      { time: '2023-01-03', open: 110, high: 120, low: 105, close: 115 },
    ];

    candlestickSeries.setData(data);

    return () => {
      chart.remove();
    };
  }, []);

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Teste do Gráfico</h3>
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
};

export default SimpleChart;
