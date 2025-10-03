import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  Time,
  LineSeries,
  CandlestickSeries,
  HistogramSeries
} from 'lightweight-charts';
import { useBTCData } from '@/hooks/useBTCData';

interface BTCChartProps {
  className?: string;
  height?: number;
}

interface CandlestickDataPoint {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

export const BTCChart: React.FC<BTCChartProps> = ({ 
  className = '', 
  height = 400 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const { btcData, isLoading, error, refetch } = useBTCData();


  // Criar o gráfico uma vez
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: '#1e1e1e' },
        textColor: '#d1d4dc',
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: { color: '#2B2B43' },
        horzLines: { color: '#2B2B43' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#485158',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#485158',
        timeVisible: true,
        secondsVisible: false,
        // ✅ CONFIGURAÇÕES PARA EVITAR "SAMBANDO" - TRAVAR À DIREITA
        rightOffset: 12, // Margem em barras da borda direita
        fixRightEdge: true, // Prevenir scroll além da barra mais recente
        rightBarStaysOnScroll: true, // Manter barra hovered fixa durante scroll
        lockVisibleTimeRangeOnResize: true, // Manter range visível ao redimensionar
        shiftVisibleRangeOnNewBar: true, // Shift automático quando nova barra é adicionada
        allowShiftVisibleRangeOnWhitespaceReplacement: true, // Permitir shift em espaços vazios
      },
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart) {
        chart.remove();
      }
    };
  }, [height]);

  // Atualizar dados quando btcData mudar
  useEffect(() => {
    if (btcData && seriesRef.current) {
      seriesRef.current.setData(btcData.data);
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    }
  }, [btcData]);

  return (
    <div className={`relative ${className}`}>
      {/* Header do gráfico */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-vibrant">BTCUSD: LNM Futures (Lightweight Charts v5.0.9)</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-vibrant-secondary">1h</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-right">
            <div className="text-vibrant font-semibold">
              {btcData ? btcData.currentPrice.toLocaleString('en-US', { 
                minimumFractionDigits: 1, 
                maximumFractionDigits: 1 
              }) : '--'}
            </div>
            <div className={`${btcData && btcData.priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {btcData ? `${btcData.priceChange >= 0 ? '+' : ''}${btcData.priceChange.toFixed(1)} (${btcData.priceChangePercent.toFixed(2)}%)` : '--'}
            </div>
          </div>
          <div className="text-vibrant-secondary">
            <div>O {btcData ? btcData.ohlc.open.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '--'}</div>
            <div>H {btcData ? btcData.ohlc.high.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '--'}</div>
            <div>L {btcData ? btcData.ohlc.low.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '--'}</div>
            <div>C {btcData ? btcData.ohlc.close.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '--'}</div>
          </div>
        </div>
      </div>

      {/* Container do gráfico */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-vibrant-secondary">Carregando gráfico...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️</div>
              <div className="text-vibrant-secondary">{error}</div>
            </div>
          </div>
        )}
        
        <div 
          ref={chartContainerRef} 
          className="w-full"
          style={{ height: `${height}px` }}
        />
      </div>

      {/* Footer com informações adicionais */}
      <div className="flex items-center justify-between p-3 border-t border-border bg-card/50">
        <div className="flex items-center space-x-4 text-sm text-vibrant-secondary">
          <span>Volume: {btcData ? `${btcData.volume} M` : '--'}</span>
          <span>•</span>
          <span>{new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })} UTC</span>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 text-xs border border-border rounded hover:bg-card/50 transition-colors">
            5y
          </button>
          <button className="px-3 py-1 text-xs border border-border rounded hover:bg-card/50 transition-colors">
            1y
          </button>
          <button className="px-3 py-1 text-xs border border-border rounded hover:bg-card/50 transition-colors">
            6m
          </button>
          <button className="px-3 py-1 text-xs border border-border rounded hover:bg-card/50 transition-colors">
            3m
          </button>
          <button className="px-3 py-1 text-xs border border-border rounded hover:bg-card/50 transition-colors">
            1m
          </button>
          <button className="px-3 py-1 text-xs border border-border rounded hover:bg-card/50 transition-colors">
            5d
          </button>
          <button className="px-3 py-1 text-xs border border-border rounded hover:bg-card/50 transition-colors bg-primary text-white">
            1d
          </button>
        </div>
      </div>
    </div>
  );
};

export default BTCChart;
