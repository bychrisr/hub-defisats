// src/components/charts/TradingChart.tsx
import React, { useEffect, useRef, useCallback } from 'react';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { useChartStore } from '@/store/chartStore';
import { computeEMAFromBars, computeRSI, computeMACD, computeBollinger, buildVolumeHistogram } from '@/utils/indicators';
import IndicatorControls from './IndicatorControls';

export default function TradingChart() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const volumeRef = useRef<HTMLDivElement | null>(null);
  const indicatorsRef = useRef<HTMLDivElement | null>(null);

  const chartApiRef = useRef<IChartApi | null>(null);
  const volumeChartRef = useRef<IChartApi | null>(null);
  const indicatorChartsRef = useRef<Record<string, IChartApi>>({});

  // Series references for data updates
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbMiddleSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdSignalSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const macdHistogramSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const normalized = useChartStore(s => s.normalized);
  const active = useChartStore(s => s.active);

  // Sync visible range across charts
  const syncVisibleRange = useCallback((range: any) => {
    try {
      if (volumeChartRef.current) {
        volumeChartRef.current.timeScale().setVisibleLogicalRange(range);
      }
      Object.values(indicatorChartsRef.current).forEach(chart => {
        try {
          chart.timeScale().setVisibleLogicalRange(range);
        } catch (e) {
          console.warn('Failed to sync range to indicator chart:', e);
        }
      });
    } catch (e) {
      console.warn('Failed to sync visible range:', e);
    }
  }, []);

  // Create charts once
  useEffect(() => {
    if (!mainRef.current || !volumeRef.current || !containerRef.current) return;

    // Main chart (price)
    const mainChart = createChart(mainRef.current, {
      width: containerRef.current.clientWidth,
      height: 400,
      layout: { 
        background: { color: '#0b1720' }, 
        textColor: '#d1d9e0' 
      },
      timeScale: { 
        timeVisible: true, 
        secondsVisible: true, 
        rightOffset: 2,
        tickMarkFormatter: (time: number | { year: number; month: number; day: number }, tickMarkType, locale) => {
          if (typeof time === 'number') {
            const d = new Date(time * 1000);
            switch (tickMarkType) {
              case 4: // TimeWithSeconds
                return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              case 3: // Time
                return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
              case 2: // DayOfMonth
                return d.toLocaleDateString(locale, { day: '2-digit', month: 'short' });
              case 1: // Month
                return d.toLocaleDateString(locale, { month: 'short', year: 'numeric' });
              case 0: // Year
                return String(d.getFullYear());
              default:
                return d.toLocaleString(locale);
            }
          } else if (typeof time === 'object' && 'day' in time) {
            return `${String(time.day).padStart(2, '0')}/${String(time.month).padStart(2, '0')}`;
          }
          return '';
        }
      },
    });
    chartApiRef.current = mainChart;

    // Add candlestick series
    const candleSeries = mainChart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      borderVisible: false,
    });
    candleSeriesRef.current = candleSeries;

    // Volume chart (fixed below)
    const volumeChart = createChart(volumeRef.current, {
      width: containerRef.current.clientWidth,
      height: 120,
      layout: { 
        background: { color: '#0b1720' }, 
        textColor: '#d1d9e0' 
      },
      timeScale: { visible: false } // sync with main timeScale
    });
    volumeChartRef.current = volumeChart;

    // Add volume series
    const volumeSeries = volumeChart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      scaleMargins: { top: 0.85, bottom: 0 }
    });
    volumeSeriesRef.current = volumeSeries;

    // Sync visible range from main -> others
    mainChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      syncVisibleRange(range);
    });

    // Responsive resize
    const resizeObserver = new ResizeObserver(() => {
      const w = containerRef.current!.clientWidth;
      mainChart.applyOptions({ width: w });
      volumeChart.applyOptions({ width: w });
      Object.values(indicatorChartsRef.current).forEach(ch => {
        ch.applyOptions({ width: w });
      });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      mainChart.remove();
      volumeChart.remove();
      Object.values(indicatorChartsRef.current).forEach(ch => ch.remove());
    };
  }, [syncVisibleRange]);

  // Update price & volume data when normalized changes
  useEffect(() => {
    const mainChart = chartApiRef.current;
    const volumeChart = volumeChartRef.current;
    if (!mainChart || !volumeChart || !normalized.length) return;

    // Set candle data
    if (candleSeriesRef.current) {
      candleSeriesRef.current.setData(normalized as any);
    }

    // Build and set volume histogram
    const volumeHistogram = buildVolumeHistogram(normalized);
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(volumeHistogram as any);
    }

    // Update overlays (EMA, Bollinger Bands)
    if (active.ema) {
      const ema12 = computeEMAFromBars(normalized, 12);
      if (emaSeriesRef.current) {
        emaSeriesRef.current.setData(ema12);
      } else if (mainChart) {
        emaSeriesRef.current = mainChart.addLineSeries({
          color: '#f39c12',
          lineWidth: 2,
          title: 'EMA 12'
        });
        emaSeriesRef.current.setData(ema12);
      }
    } else if (emaSeriesRef.current) {
      mainChart?.removeSeries(emaSeriesRef.current);
      emaSeriesRef.current = null;
    }

    if (active.bb) {
      const bb = computeBollinger(normalized, 20, 2);
      if (bbUpperSeriesRef.current) {
        bbUpperSeriesRef.current.setData(bb.upper);
        bbMiddleSeriesRef.current?.setData(bb.middle);
        bbLowerSeriesRef.current?.setData(bb.lower);
      } else if (mainChart) {
        bbUpperSeriesRef.current = mainChart.addLineSeries({
          color: '#9c27b0',
          lineWidth: 1,
          title: 'BB Upper'
        });
        bbMiddleSeriesRef.current = mainChart.addLineSeries({
          color: '#9c27b0',
          lineWidth: 1,
          lineStyle: 2, // dashed
          title: 'BB Middle'
        });
        bbLowerSeriesRef.current = mainChart.addLineSeries({
          color: '#9c27b0',
          lineWidth: 1,
          title: 'BB Lower'
        });
        bbUpperSeriesRef.current.setData(bb.upper);
        bbMiddleSeriesRef.current.setData(bb.middle);
        bbLowerSeriesRef.current.setData(bb.lower);
      }
    } else {
      if (bbUpperSeriesRef.current) {
        mainChart?.removeSeries(bbUpperSeriesRef.current);
        mainChart?.removeSeries(bbMiddleSeriesRef.current!);
        mainChart?.removeSeries(bbLowerSeriesRef.current!);
        bbUpperSeriesRef.current = null;
        bbMiddleSeriesRef.current = null;
        bbLowerSeriesRef.current = null;
      }
    }
  }, [normalized, active.ema, active.bb]);

  // Dynamically create/remove panes for RSI/MACD based on `active`
  useEffect(() => {
    const mainChart = chartApiRef.current;
    if (!mainChart) return;

    // RSI
    if (active.rsi && !indicatorChartsRef.current['rsi']) {
      const node = document.createElement('div');
      node.style.width = '100%';
      node.style.height = '120px';
      node.style.marginTop = '4px';
      indicatorsRef.current!.appendChild(node);
      
      const rsiChart = createChart(node, {
        width: containerRef.current!.clientWidth,
        height: 120,
        layout: { 
          background: { color: '#0b1720' }, 
          textColor: '#d1d9e0' 
        },
        timeScale: { visible: false }
      });
      
      const rsiData = computeRSI(normalized, 14);
      const rsiSeries = rsiChart.addLineSeries({ 
        color: '#f39c12', 
        lineWidth: 2,
        title: 'RSI 14'
      });
      rsiSeries.setData(rsiData);
      rsiSeriesRef.current = rsiSeries;
      
      indicatorChartsRef.current['rsi'] = rsiChart;
      
      // Sync visible range
      const vr = mainChart.timeScale().getVisibleRange();
      if (vr) rsiChart.timeScale().setVisibleLogicalRange(vr);
      
    } else if (!active.rsi && indicatorChartsRef.current['rsi']) {
      const rc = indicatorChartsRef.current['rsi'];
      rc.remove();
      delete indicatorChartsRef.current['rsi'];
      rsiSeriesRef.current = null;
      
      // Remove DOM node
      const rsiNode = indicatorsRef.current?.querySelector('[data-rsi-chart]');
      if (rsiNode) rsiNode.remove();
    }

    // MACD
    if (active.macd && !indicatorChartsRef.current['macd']) {
      const node = document.createElement('div');
      node.style.width = '100%';
      node.style.height = '160px';
      node.style.marginTop = '4px';
      indicatorsRef.current!.appendChild(node);
      
      const macdChart = createChart(node, {
        width: containerRef.current!.clientWidth,
        height: 160,
        layout: { 
          background: { color: '#0b1720' }, 
          textColor: '#d1d9e0' 
        },
        timeScale: { visible: false }
      });
      
      const macdRes = computeMACD(normalized);
      const macdSeries = macdChart.addLineSeries({ 
        color: '#4caf50',
        lineWidth: 2,
        title: 'MACD'
      });
      const signalSeries = macdChart.addLineSeries({ 
        color: '#f44336',
        lineWidth: 2,
        title: 'Signal'
      });
      const histogramSeries = macdChart.addHistogramSeries({ 
        color: '#3498db',
        title: 'Histogram'
      });
      
      macdSeries.setData(macdRes.macdLine);
      signalSeries.setData(macdRes.signalLine);
      histogramSeries.setData(macdRes.histogram as any);
      
      macdSeriesRef.current = macdSeries;
      macdSignalSeriesRef.current = signalSeries;
      macdHistogramSeriesRef.current = histogramSeries;
      
      indicatorChartsRef.current['macd'] = macdChart;
      
      const vr = mainChart.timeScale().getVisibleRange();
      if (vr) macdChart.timeScale().setVisibleLogicalRange(vr);
      
    } else if (!active.macd && indicatorChartsRef.current['macd']) {
      const mc = indicatorChartsRef.current['macd'];
      mc.remove();
      delete indicatorChartsRef.current['macd'];
      macdSeriesRef.current = null;
      macdSignalSeriesRef.current = null;
      macdHistogramSeriesRef.current = null;
      
      // Remove DOM node
      const macdNode = indicatorsRef.current?.querySelector('[data-macd-chart]');
      if (macdNode) macdNode.remove();
    }

  }, [active.rsi, active.macd, normalized]);

  return (
    <div ref={containerRef} className="w-full bg-gray-900 p-4 rounded-lg">
      <IndicatorControls />
      <div ref={mainRef} id="chart-main" className="border border-gray-700 rounded" />
      <div ref={volumeRef} id="chart-volume" className="border border-gray-700 rounded mt-1" />
      <div ref={indicatorsRef} id="chart-indicators" />
    </div>
  );
}