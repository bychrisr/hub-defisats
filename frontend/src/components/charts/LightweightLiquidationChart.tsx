import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, ISeriesApi, LineStyle } from 'lightweight-charts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';

type CandlestickPoint = { time: number; open: number; high: number; low: number; close: number };
type LinePoint = { time: number; value: number };

interface LightweightLiquidationChartProps {
  symbol?: string;
  height?: number;
  className?: string;
  liquidationPrice: number;
  /**
   * Série de preços para exibir contexto (opcional). Se ausente, mostramos apenas a linha de liquidação no eixo.
   */
  linePriceData?: LinePoint[];
  candleData?: CandlestickPoint[];
}

const LightweightLiquidationChart: React.FC<LightweightLiquidationChartProps> = ({
  symbol = 'BINANCE:BTCUSDT',
  height = 220,
  className = '',
  liquidationPrice,
  linePriceData,
  candleData
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null>(null);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        textColor: isDark ? '#e5e7eb' : '#111827',
        background: { type: ColorType.Solid, color: 'transparent' },
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
        horzLines: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
      },
      rightPriceScale: { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' },
      timeScale: { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)', secondsVisible: false },
      crosshair: { mode: 1 },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    // Série principal (preferir candles, senão linha)
    if (candleData && candleData.length > 0) {
      const s = chart.addCandlestickSeries({
        upColor: '#26a69a', downColor: '#ef5350',
        wickUpColor: '#26a69a', wickDownColor: '#ef5350',
        borderVisible: false,
      });
      s.setData(candleData as any);
      seriesRef.current = s;
    } else if (linePriceData && linePriceData.length > 0) {
      const s = chart.addLineSeries({ color: isDark ? '#93c5fd' : '#2563eb', lineWidth: 2 });
      s.setData(linePriceData);
      seriesRef.current = s;
    } else {
      // Sem dados: adicionar uma série vazia apenas para ancorar o eixo
      const s = chart.addLineSeries({ color: 'transparent', lineWidth: 1 });
      s.setData([{ time: Math.floor(Date.now() / 1000) - 3600, value: liquidationPrice }, { time: Math.floor(Date.now() / 1000), value: liquidationPrice }]);
      seriesRef.current = s;
    }

    // Linha de liquidação (horizontal price line)
    // Lightweight Charts não tem API nativa para linha horizontal infinita com label fora da série,
    // mas podemos usar priceLine na(s) série(s) visível(is):
    seriesRef.current?.createPriceLine({
      price: liquidationPrice,
      color: '#ff4444',
      lineStyle: LineStyle.Solid,
      lineWidth: 2,
      axisLabelVisible: true,
      title: `Liquidação: $${Number(liquidationPrice).toLocaleString()}`,
    });

    // Fit content inicial
    chart.timeScale().fitContent();

    // Resize
    const ro = new ResizeObserver(() => {
      if (!containerRef.current) return;
      chart.applyOptions({ width: containerRef.current.clientWidth, height });
      chart.timeScale().fitContent();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [height, isDark, liquidationPrice, JSON.stringify(linePriceData?.slice(-50)), JSON.stringify(candleData?.slice(-200))]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Linha de Liquidação</CardTitle>
        <CardDescription>
          {symbol} — preço de liquidação em {`$${Number(liquidationPrice).toLocaleString()}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full rounded-lg overflow-hidden" style={{ height }} />
      </CardContent>
    </Card>
  );
};

export default LightweightLiquidationChart;


