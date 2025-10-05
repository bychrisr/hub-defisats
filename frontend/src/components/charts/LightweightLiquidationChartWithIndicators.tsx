// src/components/charts/LightweightLiquidationChartWithIndicators.tsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  ColorType, 
  Time, 
  LineStyle,
  TickMarkType,
  LineSeries,
  CandlestickSeries,
  HistogramSeries
} from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useIndicatorManager } from '@/hooks/useIndicatorManager';
import { TimeframeSelector } from '@/components/ui/timeframe-selector';
import IndicatorControls from '@/components/charts/IndicatorControls';
import { 
  BarChart3, 
  TrendingUp, 
  Settings, 
  X,
  Activity
} from 'lucide-react';
import { IndicatorType, IndicatorConfig } from '@/services/indicatorManager.service';
import { LwcBar } from '@/types/chart';

// Tipos para dados de candlestick
type CandlestickPoint = { 
  time: Time; 
  open: number; 
  high: number; 
  low: number; 
  close: number; 
};

type LinePoint = { 
  time: Time; 
  value: number; 
};

// Props do componente
interface LightweightLiquidationChartWithIndicatorsProps {
  symbol?: string;
  height?: number;
  candleData?: CandlestickPoint[];
  linePriceData?: LinePoint[];
  liquidationLines?: Array<{ price: number; label: string; color?: string }>;
  takeProfitLines?: Array<{ price: number; label: string; color?: string }>;
  liquidationPrice?: number;
  className?: string;
  showToolbar?: boolean;
  displaySymbol?: string;
  symbolDescription?: string;
  logoUrl?: string;
  useApiData?: boolean;
  timeframe?: string;
  showIndicatorControls?: boolean;
  // CORREÇÃO: Adicionar props para indicadores
  indicators?: any;
  enabledIndicators?: string[];
  indicatorConfigs?: any;
}

const LightweightLiquidationChartWithIndicators: React.FC<LightweightLiquidationChartWithIndicatorsProps> = React.memo(({
  symbol = 'BTCUSDT',
  height = 400,
  candleData,
  linePriceData,
  liquidationLines = [],
  takeProfitLines = [],
  liquidationPrice,
  className = '',
  showToolbar = true,
  displaySymbol,
  symbolDescription,
  logoUrl,
  useApiData = false,
  timeframe = '1h',
  showIndicatorControls = true,
  // CORREÇÃO: Adicionar props para indicadores
  indicators: externalIndicators,
  enabledIndicators: externalEnabledIndicators,
  indicatorConfigs: externalIndicatorConfigs
}) => {
  // Referências
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null>(null);
  const priceLinesRef = useRef<Array<{ id: string; priceLine: any }>>([]);
  const isUpdatingRef = useRef(false);
  
  // Refs para indicadores
  const rsiPaneRef = useRef<any>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const emaPaneRef = useRef<any>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Estados
  const [currentTimeframe, setCurrentTimeframe] = useState(timeframe);
  const [chartReady, setChartReady] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Estados para indicadores
  const [enabledIndicators, setEnabledIndicators] = useState<IndicatorType[]>([]);
  const [indicatorConfigs, setIndicatorConfigs] = useState<Record<IndicatorType, IndicatorConfig>>({
    rsi: { enabled: false, period: 14, color: '#8b5cf6', lineWidth: 2, height: 100 },
    ema: { enabled: false, period: 20, color: '#f59e0b', lineWidth: 2, height: 100 },
    macd: { enabled: false, period: 12, color: '#10b981', lineWidth: 2, height: 100 },
    bollinger: { enabled: false, period: 20, color: '#ef4444', lineWidth: 2, height: 100 },
    volume: { enabled: false, period: 1, color: '#6b7280', lineWidth: 2, height: 100 }
  });

  // Hook para dados históricos
  const { 
    candleData: historicalData, 
    isLoading: historicalLoading, 
    error: historicalError,
    hasMoreData,
    loadMoreHistorical,
    isLoadingMore: isLoadingMoreHistorical
  } = useHistoricalData({
    symbol,
    timeframe: currentTimeframe,
    enabled: useApiData,
    initialLimit: 168
  });

  // Converter dados para formato LwcBar
  const barsData = useMemo((): LwcBar[] => {
    const data = useApiData ? historicalData : (candleData || linePriceData);
    if (!data || data.length === 0) return [];

    return data.map(item => ({
      time: item.time,
      open: 'open' in item ? item.open : item.value,
      high: 'high' in item ? item.high : item.value,
      low: 'low' in item ? item.low : item.value,
      close: 'close' in item ? item.close : item.value,
      volume: 'volume' in item ? item.volume : 0
    }));
  }, [useApiData, historicalData, candleData, linePriceData]);

  // Hook para gerenciar indicadores
  const {
    indicators: internalIndicators,
    isLoading: indicatorsLoading,
    error: indicatorsError,
    lastUpdate,
    cacheStats,
    calculateIndicator,
    calculateAllIndicators,
    clearCache,
    refreshIndicator,
    // Persistência
    saveConfig,
    loadConfig,
    saveAllConfigs,
    loadAllConfigs,
    exportConfigs,
    importConfigs,
    clearAllConfigs,
    getStorageInfo
  } = useIndicatorManager({
    bars: barsData,
    enabledIndicators: externalEnabledIndicators || ['rsi'],
    configs: externalIndicatorConfigs || { rsi: { enabled: true, period: 14, color: '#8b5cf6', lineWidth: 2 } },
    autoUpdate: true,
    updateInterval: 5000
  });

  // CORREÇÃO: Usar indicadores externos quando disponíveis
  const indicators = externalIndicators || internalIndicators;
  const enabledIndicators = externalEnabledIndicators || ['rsi'];
  const indicatorConfigs = externalIndicatorConfigs || { rsi: { enabled: true, period: 14, color: '#8b5cf6', lineWidth: 2 } };

  // Dados efetivos para o gráfico
  const effectiveCandleData = useMemo(() => {
    const data = useApiData ? historicalData : (candleData || linePriceData);
    
    console.log('🔄 EFFECTIVE DATA - Dados efetivos calculados:', {
      useApiData,
      historicalDataLength: historicalData?.length || 0,
      candleDataLength: candleData?.length || 0,
      linePriceDataLength: linePriceData?.length || 0,
      effectiveDataLength: data?.length || 0,
      historicalLoading,
      historicalError
    });
    
    return data;
  }, [useApiData, historicalData, candleData, linePriceData, historicalLoading, historicalError]);

  // Validação de dados
  const hasValidData = useMemo(() => {
    if (!effectiveCandleData || effectiveCandleData.length === 0) {
      return false;
    }
    
    const firstDataPoint = effectiveCandleData[0];
    if (!firstDataPoint || !firstDataPoint.time) {
      return false;
    }
    
    if ('open' in firstDataPoint) {
      return firstDataPoint.open !== undefined && 
             firstDataPoint.high !== undefined && 
             firstDataPoint.low !== undefined && 
             firstDataPoint.close !== undefined;
    }
    
    if ('value' in firstDataPoint) {
      return firstDataPoint.value !== undefined;
    }
    
    return true;
  }, [effectiveCandleData]);

  // Estado de prontidão
  const isChartReady = useMemo(() => {
    if (useApiData) {
      return !historicalLoading && !historicalError && hasValidData;
    } else {
      return hasValidData;
    }
  }, [useApiData, historicalLoading, historicalError, hasValidData]);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Configuração do gráfico
  const chartOptions = useMemo(() => ({
    height,
    layout: {
      textColor: isDark ? '#d1d5db' : '#374151',
      background: { type: ColorType.Solid, color: 'transparent' },
      fontSize: 12,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    grid: {
      vertLines: { 
        color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        style: LineStyle.Solid
      },
      horzLines: { 
        color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        style: LineStyle.Solid
      },
    },
    rightPriceScale: { 
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      textColor: isDark ? '#9ca3af' : '#6b7280',
      scaleMargins: {
        top: 0.1,
        bottom: 0.1,
      },
    },
    timeScale: {
      borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
      timeVisible: true,
      secondsVisible: false,
      rightOffset: 12,
      fixRightEdge: true,
      rightBarStaysOnScroll: true,
      lockVisibleTimeRangeOnResize: true,
      shiftVisibleRangeOnNewBar: true,
      allowShiftVisibleRangeOnWhitespaceReplacement: true,
      tickMarkMaxCharacterLength: 8,
      barSpacing: 6,
      minBarSpacing: 0.5,
      tickMarkFormatter: (time: any, tickMarkType: any) => {
        let timestamp: number;
        if (typeof time === 'number') {
          timestamp = time;
        } else {
          timestamp = Date.UTC(time.year, time.month - 1, time.day) / 1000;
        }
        
        const date = new Date(timestamp * 1000);
        
        if (isNaN(date.getTime()) || date.getFullYear() < 1970 || date.getFullYear() > 2100) {
          return 'Invalid';
        }
        
        switch (tickMarkType) {
          case 0: return date.getFullYear().toString();
          case 1: return date.toLocaleDateString('en-US', { month: 'short' });
          case 2: return date.getDate().toString();
          case 3: 
            const hours = date.getHours();
            const minutes = date.getMinutes();
            if ((hours === 6 || hours === 12 || hours === 18) && minutes === 0) {
              return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
          case 4: 
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
          default:
            if (currentTimeframe && /m|h/i.test(currentTimeframe)) {
              return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            }
            if (currentTimeframe && /d|w/i.test(currentTimeframe)) {
              return date.getDate().toString();
            }
            return date.getDate().toString();
        }
      }
    },
    crosshair: { mode: 1 },
    handleScroll: { 
      mouseWheel: true, 
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: true
    },
    handleScale: { 
      axisPressedMouseMove: true, 
      mouseWheel: true, 
      pinch: true,
      axisDoubleClickReset: false
    },
  }), [height, isDark, currentTimeframe]);

  // Função para limpar priceLines
  const clearPriceLines = useCallback(() => {
    if (priceLinesRef.current.length > 0) {
      console.log('🧹 CLEAR PRICELINES - Removendo priceLines existentes:', priceLinesRef.current.length);
      
      priceLinesRef.current.forEach(({ id, priceLine }) => {
        try {
          if (priceLine && typeof priceLine.remove === 'function') {
            console.log(`🧹 CLEAR PRICELINES - Removendo ${id}`);
            priceLine.remove();
          }
        } catch (error) {
          console.warn(`⚠️ CLEAR PRICELINES - Erro ao remover ${id}:`, error);
        }
      });
      priceLinesRef.current = [];
      console.log('✅ CLEAR PRICELINES - Todas as priceLines foram removidas');
    }
  }, []);

  // Função para criar/remover pane RSI
  const updateRSIPane = useCallback(() => {
    console.log('🚀 RSI PANE - updateRSIPane chamada!', {
      chartExists: !!chartRef.current,
      enabledIndicators,
      indicatorsRsi: indicators.rsi ? 'exists' : 'null'
    });
    
    if (!chartRef.current) {
      console.log('❌ RSI PANE - Chart não está disponível');
      return;
    }

    const rsiEnabled = enabledIndicators.includes('rsi');
    const rsiData = indicators.rsi;

    console.log('🔄 RSI PANE - Atualizando pane RSI:', {
      enabled: rsiEnabled,
      enabledIndicators: enabledIndicators,
      hasData: !!rsiData,
      dataValid: rsiData?.valid,
      dataLength: rsiData?.data ? (Array.isArray(rsiData.data) ? rsiData.data.length : 'complex') : 0,
      chartReady: isChartReady,
      barsLength: barsData?.length || 0
    });

    // Remover pane existente se desabilitado
    if (!rsiEnabled || !rsiData || !rsiData.valid) {
      if (rsiPaneRef.current) {
        try {
          chartRef.current.removePane(rsiPaneRef.current);
          rsiPaneRef.current = null;
          rsiSeriesRef.current = null;
          console.log('✅ RSI PANE - Pane RSI removido');
        } catch (error) {
          console.warn('⚠️ RSI PANE - Erro ao remover pane RSI:', error);
        }
      }
      return;
    }

    // Criar novo pane se não existir
    if (!rsiPaneRef.current) {
      try {
        rsiPaneRef.current = chartRef.current.addPane();
        // CORREÇÃO: setHeight() não existe na API v5.0.9
        // Usar setStretchFactor() para controlar altura do pane
        rsiPaneRef.current.setStretchFactor(0.2); // 20% da altura total (reduzido para dar espaço à EMA)
        console.log('✅ RSI PANE - Pane RSI criado com stretchFactor: 0.2');
      } catch (error) {
        console.error('❌ RSI PANE - Erro ao criar pane RSI:', error);
        return;
      }
    }

    // Criar série RSI se não existir
    if (!rsiSeriesRef.current && rsiPaneRef.current) {
      try {
        // CORREÇÃO: Na API v5.0.9, não há método index() no pane
        // Usar o pane diretamente para adicionar a série
        rsiSeriesRef.current = rsiPaneRef.current.addSeries(LineSeries, {
          color: indicatorConfigs.rsi.color || '#8b5cf6',
          lineWidth: indicatorConfigs.rsi.lineWidth || 2,
          priceFormat: { 
            type: 'percent' as const, 
            precision: 2, 
            minMove: 0.01 
          }
        });
        console.log('✅ RSI SERIES - Série RSI criada no pane RSI');
      } catch (error) {
        console.error('❌ RSI SERIES - Erro ao criar série RSI:', error);
        return;
      }
    }

    // Atualizar dados da série RSI
    if (rsiSeriesRef.current && rsiData.data && Array.isArray(rsiData.data)) {
      try {
        rsiSeriesRef.current.setData(rsiData.data as any);
        console.log('✅ RSI DATA - Dados RSI aplicados:', {
          dataPoints: rsiData.data.length,
          color: indicatorConfigs.rsi.color
        });
      } catch (error) {
        console.error('❌ RSI DATA - Erro ao aplicar dados RSI:', error);
      }
    }

    // Atualizar cor da série RSI se mudou
    if (rsiSeriesRef.current) {
      try {
        rsiSeriesRef.current.applyOptions({
          color: indicatorConfigs.rsi.color || '#8b5cf6',
          lineWidth: indicatorConfigs.rsi.lineWidth || 2
        });
        console.log('✅ RSI COLOR - Cor RSI atualizada:', indicatorConfigs.rsi.color);
      } catch (error) {
        console.error('❌ RSI COLOR - Erro ao atualizar cor RSI:', error);
      }
    }
  }, [enabledIndicators, indicators.rsi, indicatorConfigs.rsi, isChartReady, barsData]);

  // Função para criar/remover pane EMA
  const updateEMAPane = useCallback(() => {
    console.log('🚀 EMA PANE - updateEMAPane chamada!', {
      chartExists: !!chartRef.current,
      enabledIndicators,
      indicatorsEma: indicators.ema ? 'exists' : 'null'
    });
    
    if (!chartRef.current) {
      console.log('❌ EMA PANE - Chart não está disponível');
      return;
    }

    const emaEnabled = enabledIndicators.includes('ema');
    const emaData = indicators.ema;

    console.log('🔄 EMA PANE - Atualizando pane EMA:', {
      enabled: emaEnabled,
      enabledIndicators: enabledIndicators,
      hasData: !!emaData,
      dataValid: emaData?.valid,
      dataLength: emaData?.data ? (Array.isArray(emaData.data) ? emaData.data.length : 'complex') : 0,
      chartReady: isChartReady,
      barsLength: barsData?.length || 0
    });

    // Remover pane existente se desabilitado
    if (!emaEnabled || !emaData || !emaData.valid) {
      if (emaPaneRef.current) {
        try {
          chartRef.current.removePane(emaPaneRef.current);
          emaPaneRef.current = null;
          emaSeriesRef.current = null;
          console.log('✅ EMA PANE - Pane EMA removido');
        } catch (error) {
          console.warn('⚠️ EMA PANE - Erro ao remover pane EMA:', error);
        }
      }
      return;
    }

    // Criar novo pane se não existir
    if (!emaPaneRef.current) {
      try {
        console.log('🔍 [DEBUG EMA] Criando novo pane EMA...', {
          chartExists: !!chartRef.current,
          existingPanes: chartRef.current?.panes?.()?.length || 0,
          rsiPaneExists: !!rsiPaneRef.current
        });
        
        emaPaneRef.current = chartRef.current.addPane();
        
        console.log('🔍 [DEBUG EMA] Pane EMA criado:', {
          pane: emaPaneRef.current,
          paneIndex: emaPaneRef.current?.paneIndex?.(),
          totalPanes: chartRef.current?.panes?.()?.length || 0
        });
        
        // Usar setStretchFactor() para controlar altura do pane
        emaPaneRef.current.setStretchFactor(0.2); // 20% da altura total (reduzido para coexistir com RSI)
        
        console.log('🔍 [DEBUG EMA] StretchFactor definido para EMA:', {
          stretchFactor: 0.2,
          rsiStretchFactor: rsiPaneRef.current?.getStretchFactor?.() || 'N/A'
        });
        
        console.log('✅ EMA PANE - Pane EMA criado com stretchFactor: 0.2');
      } catch (error) {
        console.error('❌ EMA PANE - Erro ao criar pane EMA:', error);
        return;
      }
    }

    // Criar série EMA se não existir
    if (!emaSeriesRef.current && emaPaneRef.current) {
      try {
        console.log('🔍 [DEBUG EMA] Tentando criar série da EMA...', {
          paneExists: !!emaPaneRef.current,
          seriesExists: !!emaSeriesRef.current,
          config: indicatorConfigs.ema
        });
        
        emaSeriesRef.current = emaPaneRef.current.addSeries(LineSeries, {
          color: '#FF5733', // Cor laranja bem visível (forçada para debug)
          lineWidth: 3, // Largura maior para visibilidade
          lineType: 0, // LineType.Simple
          priceScaleId: 'right', // Escala à direita
          priceFormat: { 
            type: 'price' as const, 
            precision: 2, 
            minMove: 0.01 
          }
        });
        
        console.log('🔍 [DEBUG EMA] Série da EMA criada:', {
          series: emaSeriesRef.current,
          pane: emaPaneRef.current,
          config: indicatorConfigs.ema
        });
        
        console.log('✅ EMA SERIES - Série EMA criada no pane EMA');
      } catch (error) {
        console.error('❌ EMA SERIES - Erro ao criar série EMA:', error);
        return;
      }
    }

    // Atualizar dados da série EMA
    if (emaSeriesRef.current && emaData.data && Array.isArray(emaData.data)) {
      try {
        console.log('🔍 [DEBUG EMA] Dados da EMA a serem definidos:', {
          dataLength: emaData.data.length,
          firstDataPoint: emaData.data[0],
          lastDataPoint: emaData.data[emaData.data.length - 1],
          dataType: typeof emaData.data[0],
          seriesExists: !!emaSeriesRef.current
        });
        
        emaSeriesRef.current.setData(emaData.data as any);
        
        console.log('🔍 [DEBUG EMA] Dados definidos na série:', {
          dataPoints: emaData.data.length,
          color: indicatorConfigs.ema.color,
          series: emaSeriesRef.current
        });
        
        console.log('✅ EMA DATA - Dados EMA aplicados:', {
          dataPoints: emaData.data.length,
          color: indicatorConfigs.ema.color
        });
      } catch (error) {
        console.error('❌ EMA DATA - Erro ao aplicar dados EMA:', error);
      }
    }

    // Atualizar cor da série EMA se mudou
    if (emaSeriesRef.current) {
      try {
        emaSeriesRef.current.applyOptions({
          color: '#FF5733', // Cor laranja bem visível (forçada para debug)
          lineWidth: 3, // Largura maior para visibilidade
          lineType: 0 // LineType.Simple
        });
        console.log('✅ EMA COLOR - Cor EMA atualizada:', indicatorConfigs.ema.color);
      } catch (error) {
        console.error('❌ EMA COLOR - Erro ao atualizar cor EMA:', error);
      }
    }

    // Forçar re-renderização do gráfico após criar/atualizar panes
    try {
      if (chartRef.current) {
        console.log('🔍 [DEBUG EMA] Forçando re-renderização do gráfico...');
        chartRef.current.timeScale().fitContent();
        console.log('✅ EMA RENDER - Re-renderização forçada');
      }
    } catch (error) {
      console.warn('⚠️ EMA RENDER - Erro ao forçar re-renderização:', error);
    }
  }, [enabledIndicators, indicators.ema, indicatorConfigs.ema, isChartReady, barsData]);

  // Criar gráfico principal
  useEffect(() => {
    if (!containerRef.current) return;
    
    if (!isChartReady) {
      console.log('⏳ CHART CREATION - Aguardando dados válidos:', {
        isChartReady,
        hasValidData,
        historicalLoading,
        historicalError,
        effectiveDataLength: effectiveCandleData?.length || 0
      });
      return;
    }

    console.log('🚀 CHART CREATION - Criando gráfico com indicadores - DADOS VÁLIDOS CONFIRMADOS');

    const chart = createChart(containerRef.current, chartOptions);
    chartRef.current = chart;

    if (!chart) {
      console.error('❌ CHART CREATION - Chart é null/undefined');
      return;
    }

    console.log('✅ CHART CREATION - Chart criado com sucesso');

    // Criar série principal
    if (effectiveCandleData && effectiveCandleData.length > 0) {
      try {
        if ('open' in effectiveCandleData[0]) {
          const series = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a', 
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a', 
            wickDownColor: '#ef5350',
          });
          mainSeriesRef.current = series;
          console.log('✅ MAIN SERIES - Candlestick series criada');
        } else {
          const series = chart.addSeries(LineSeries, {
            color: '#2196F3',
            lineWidth: 2,
          });
          mainSeriesRef.current = series;
          console.log('✅ MAIN SERIES - Line series criada');
        }
      } catch (error) {
        console.error('❌ MAIN SERIES - Erro ao criar série principal:', error);
      }
    }

    setChartReady(true);

    return () => {
      console.log('🧹 CHART CLEANUP - Limpando gráfico');
      setChartReady(false);
      
      try {
        if (mainSeriesRef.current) {
          chart.removeSeries(mainSeriesRef.current);
          mainSeriesRef.current = null;
        }
        
        if (rsiSeriesRef.current) {
          chart.removeSeries(rsiSeriesRef.current);
          rsiSeriesRef.current = null;
        }
        
        if (rsiPaneRef.current) {
          chart.removePane(rsiPaneRef.current);
          rsiPaneRef.current = null;
        }

        if (emaSeriesRef.current) {
          chart.removeSeries(emaSeriesRef.current);
          emaSeriesRef.current = null;
        }
        
        if (emaPaneRef.current) {
          chart.removePane(emaPaneRef.current);
          emaPaneRef.current = null;
        }
        
        clearPriceLines();
        chart.remove();
        chartRef.current = null;
        
        console.log('✅ CHART CLEANUP - Chart removido com sucesso');
      } catch (error) {
        console.error('❌ CHART CLEANUP - Erro ao remover chart:', error);
      }
    };
  }, [chartOptions, isChartReady, effectiveCandleData, clearPriceLines]);

  // Atualizar dados das séries
  const updateSeriesData = useCallback(() => {
    if (isUpdatingRef.current) {
      console.log('🔄 DATA UPDATE - Já está executando, pulando...');
      return;
    }
    
    isUpdatingRef.current = true;
    
    if (!chartReady || !chartRef.current) {
      console.log('🔄 DATA UPDATE - Condições não atendidas');
      isUpdatingRef.current = false;
      return;
    }

    try {
      // Atualizar série principal
      if (mainSeriesRef.current && effectiveCandleData && effectiveCandleData.length > 0) {
        if ('open' in effectiveCandleData[0]) {
          mainSeriesRef.current.setData(effectiveCandleData as any);
        } else {
          mainSeriesRef.current.setData(effectiveCandleData as any);
        }
        
        chartRef.current.timeScale().fitContent();
        console.log('✅ DATA UPDATE - Dados aplicados à série principal');
      }

      // Atualizar priceLines
      clearPriceLines();

      if (mainSeriesRef.current && liquidationLines && liquidationLines.length > 0) {
        liquidationLines.forEach((line, index) => {
          try {
            const priceLine = mainSeriesRef.current!.createPriceLine({
              price: line.price,
              color: line.color || '#ff4444',
              lineStyle: LineStyle.Solid,
              lineWidth: 2,
              axisLabelVisible: true,
              title: line.label || `Pos #${index + 1}: $${line.price.toLocaleString()}`
            });
            
            priceLinesRef.current.push({
              id: `liquidation_${index}`,
              priceLine
            });
          } catch (error) {
            console.error(`❌ LIQUIDATION LINE #${index + 1} - Erro ao criar priceLine:`, error);
          }
        });
      }

      if (mainSeriesRef.current && takeProfitLines && takeProfitLines.length > 0) {
        takeProfitLines.forEach((line, index) => {
          try {
            const priceLine = mainSeriesRef.current!.createPriceLine({
              price: line.price,
              color: line.color || '#22c55e',
              lineStyle: LineStyle.Solid,
              lineWidth: 2,
              axisLabelVisible: true,
              title: line.label || `TP Pos #${index + 1}: $${line.price.toLocaleString()}`
            });
            
            priceLinesRef.current.push({
              id: `takeprofit_${index}`,
              priceLine
            });
          } catch (error) {
            console.error(`❌ TAKE PROFIT LINE #${index + 1} - Erro ao criar priceLine:`, error);
          }
        });
      }

    } catch (error) {
      console.warn('⚠️ DATA UPDATE - Erro ao atualizar dados:', error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, [chartReady, effectiveCandleData, liquidationLines, takeProfitLines, clearPriceLines]);

  // Atualizar dados das séries
  useEffect(() => {
    updateSeriesData();
  }, [updateSeriesData]);

  // Atualizar pane RSI quando indicadores mudam
  useEffect(() => {
    updateRSIPane();
  }, [updateRSIPane]);

  // Atualizar pane EMA quando indicadores mudam
  useEffect(() => {
    updateEMAPane();
  }, [updateEMAPane]);

  // Forçar atualização quando enabledIndicators mudar
  useEffect(() => {
    console.log('🔄 INDICATOR CHANGE - enabledIndicators changed:', enabledIndicators);
    console.log('🔄 INDICATOR CHANGE - Calling updateRSIPane...');
    updateRSIPane();
    console.log('🔄 INDICATOR CHANGE - Calling updateEMAPane...');
    updateEMAPane();
  }, [enabledIndicators, updateRSIPane, updateEMAPane]);

  // Forçar atualização quando indicators mudar
  useEffect(() => {
    console.log('🔄 INDICATOR DATA - indicators changed:', {
      rsi: indicators.rsi ? 'has data' : 'no data',
      rsiValid: indicators.rsi?.valid,
      rsiDataLength: indicators.rsi?.data?.length || 0,
      ema: indicators.ema ? 'has data' : 'no data',
      emaValid: indicators.ema?.valid,
      emaDataLength: indicators.ema?.data?.length || 0,
      emaEnabled: enabledIndicators.includes('ema')
    });
    
    console.log('🔄 INDICATOR DATA - Calling updateRSIPane...');
    updateRSIPane();
    
    console.log('🔄 INDICATOR DATA - Calling updateEMAPane...');
    updateEMAPane();
  }, [indicators.rsi, indicators.ema, updateRSIPane, updateEMAPane, enabledIndicators]);

  // CORREÇÃO: Forçar atualização da EMA quando habilitada
  useEffect(() => {
    const emaEnabled = enabledIndicators.includes('ema');
    const emaHasData = indicators.ema && indicators.ema.valid && indicators.ema.data;
    
    if (emaEnabled && emaHasData) {
      console.log('🔄 EMA FORCE UPDATE - EMA habilitada e com dados, forçando atualização do pane');
      
      // Forçar atualização imediata
      updateEMAPane();
      
      // Forçar atualização com delay para garantir que funcione
      const timeoutId = setTimeout(() => {
        console.log('🔄 EMA FORCE UPDATE DELAY - Forçando atualização da EMA com delay');
        updateEMAPane();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [enabledIndicators, indicators.ema, updateEMAPane]);

  // Carregar configurações salvas na inicialização
  useEffect(() => {
    console.log('📦 PERSISTENCE - Loading saved configurations on mount');
    
    // Carregar configuração do RSI
    const savedRSIConfig = loadConfig('rsi');
    if (savedRSIConfig) {
      console.log('📦 PERSISTENCE - Loaded RSI config from storage:', savedRSIConfig);
      
      // Atualizar estado com configuração salva
      setIndicatorConfigs(prev => ({
        ...prev,
        rsi: {
          ...prev.rsi,
          enabled: savedRSIConfig.enabled,
          period: savedRSIConfig.period,
          color: savedRSIConfig.color,
          lineWidth: savedRSIConfig.lineWidth,
          height: savedRSIConfig.height
        }
      }));
      
      // Atualizar indicadores ativos
      setEnabledIndicators(prev => {
        const newIndicators = savedRSIConfig.enabled 
          ? [...prev.filter(t => t !== 'rsi'), 'rsi']
          : prev.filter(t => t !== 'rsi');
        console.log('📦 PERSISTENCE - Updated enabled indicators:', newIndicators);
        return newIndicators;
      });
    }
  }, [loadConfig]);

  // Handlers para indicadores
  const handleToggleIndicator = useCallback((type: IndicatorType, enabled: boolean) => {
    console.log(`🔄 INDICATOR TOGGLE - ${type}: ${enabled ? 'enabled' : 'disabled'}`);
    
    setEnabledIndicators(prev => {
      const newIndicators = enabled 
        ? [...prev.filter(t => t !== type), type]  // Adicionar se não existir
        : prev.filter(t => t !== type);           // Remover se existir
      
      console.log(`🔄 INDICATOR TOGGLE - Updated enabledIndicators:`, newIndicators);
      return newIndicators;
    });
    
    // Atualizar config também
    setIndicatorConfigs(prev => {
      const newConfigs = {
        ...prev,
        [type]: { ...prev[type], enabled }
      };
      
      // Salvar configuração automaticamente
      const configToSave = {
        enabled,
        period: newConfigs[type].period,
        color: newConfigs[type].color,
        lineWidth: newConfigs[type].lineWidth,
        height: newConfigs[type].height
      };
      
      saveConfig(type, configToSave);
      console.log(`💾 PERSISTENCE - Auto-saved ${type} config:`, configToSave);
      
      return newConfigs;
    });
  }, [saveConfig]);

  const handleUpdateConfig = useCallback((type: IndicatorType, config: Partial<IndicatorConfig>) => {
    console.log(`🔄 INDICATOR CONFIG - Atualizando ${type}:`, config);
    
    setIndicatorConfigs(prev => {
      const newConfigs = {
        ...prev,
        [type]: { ...prev[type], ...config }
      };
      
      // Salvar configuração automaticamente
      const configToSave = {
        enabled: newConfigs[type].enabled,
        period: newConfigs[type].period,
        color: newConfigs[type].color,
        lineWidth: newConfigs[type].lineWidth,
        height: newConfigs[type].height
      };
      
      saveConfig(type, configToSave);
      console.log(`💾 PERSISTENCE - Auto-saved ${type} config update:`, configToSave);
      
      return newConfigs;
    });
  }, [saveConfig]);

  const handleTimeframeChange = (newTimeframe: string) => {
    console.log('🔄 TIMEFRAME CHANGE - Mudando timeframe:', {
      from: currentTimeframe,
      to: newTimeframe
    });
    
    setCurrentTimeframe(newTimeframe);
  };

  return (
    <>
      <style>{`
        .chart-container {
          position: relative;
          width: 100%;
          height: ${height}px;
        }
        
        .chart-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 10;
        }
      `}</style>
      
      <div className={`w-full ${className}`}>
        {/* Controles de Indicadores */}
        {showIndicatorControls && showControls && (
          <div className="mb-4">
            <IndicatorControls
              enabledIndicators={enabledIndicators}
              configs={indicatorConfigs}
              onToggleIndicator={handleToggleIndicator}
              onUpdateConfig={handleUpdateConfig}
              onRefreshIndicator={refreshIndicator}
              onRefreshAll={calculateAllIndicators}
              onClearCache={clearCache}
              isLoading={indicatorsLoading}
              lastUpdate={lastUpdate}
              cacheStats={cacheStats}
            />
          </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {logoUrl && (
                  <img 
                    src={logoUrl} 
                    alt="Logo" 
                    className="w-6 h-6 rounded"
                  />
                )}
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {displaySymbol || symbol} (Lightweight Charts v5.0.9 + Indicadores)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {symbolDescription || 'Gráfico com indicadores técnicos'}
                  </p>
                </div>
              </div>
                
              <div className="flex items-center gap-2">
                <TimeframeSelector
                  value={currentTimeframe}
                  onChange={handleTimeframeChange}
                  className="h-8"
                />
                
                {showToolbar && (
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => setShowControls(!showControls)}
                    >
                      <Activity className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          
            {/* Status Info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge variant={useApiData ? 'default' : 'secondary'}>
                  {useApiData ? 'API Data' : 'Static Data'}
                </Badge>
                {historicalLoading && (
                  <Badge variant="default">
                    Loading...
                  </Badge>
                )}
                {indicatorsLoading && (
                  <Badge variant="default">
                    Calculating Indicators...
                  </Badge>
                )}
                {!isChartReady && !historicalLoading && (
                  <Badge variant="secondary">
                    Preparing...
                  </Badge>
                )}
                {historicalError && (
                  <Badge variant="destructive">
                    Error
                  </Badge>
                )}
                {indicatorsError && (
                  <Badge variant="destructive">
                    Indicator Error
                  </Badge>
                )}
                {isChartReady && !historicalLoading && !historicalError && (
                  <Badge variant="default">
                    Ready
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Lightweight Charts v5.0.9
                </Badge>
                {enabledIndicators.length > 0 && (
                  <Badge variant="outline">
                    {enabledIndicators.length} Indicators
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="chart-container">
              <div ref={containerRef} className="w-full h-full" />
              
              {/* Loading Overlay */}
              {(historicalLoading || indicatorsLoading || !isChartReady) && (
                <div className="chart-loading">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    {historicalLoading ? 'Loading chart data...' : 
                     indicatorsLoading ? 'Calculating indicators...' : 
                     'Preparing chart...'}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
});

export default LightweightLiquidationChartWithIndicators;
