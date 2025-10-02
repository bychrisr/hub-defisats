import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
  createChart, 
  IChartApi, 
  ISeriesApi, 
  ColorType, 
  Time, 
  LineStyle,
  TickMarkType
} from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { TimeframeSelector } from '@/components/ui/timeframe-selector';
import { TechnicalIndicatorsService, RSIConfig } from '@/services/technicalIndicators.service';
import { 
  BarChart3, 
  TrendingUp, 
  Settings, 
  X,
  Activity
} from 'lucide-react';

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
interface LightweightLiquidationChartProps {
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
}

const LightweightLiquidationChart: React.FC<LightweightLiquidationChartProps> = React.memo(({
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
  timeframe = '1h'
}) => {
  // Referências
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null>(null);
  const liquidationSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const takeProfitSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  
  // Referências para RSI
  const rsiPaneRef = useRef<any>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const overboughtSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const oversoldSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Estados
  const [currentTimeframe, setCurrentTimeframe] = useState(timeframe);
  const [chartReady, setChartReady] = useState(false);
  const [rsiEnabled, setRsiEnabled] = useState(false);
  const [rsiConfig, setRsiConfig] = useState<RSIConfig>({
    period: 14,
    overbought: 70,
    oversold: 30
  });
  const [rsiData, setRsiData] = useState<Array<{ time: Time; value: number }>>([]);

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
    initialLimit: 168 // ~7 dias para timeframe 1h
  });

  // ✅ MEMOIZAR DADOS EFETIVOS PARA EVITAR RECRIAÇÃO CONSTANTE
  const effectiveCandleData = useMemo(() => {
    return useApiData ? historicalData : (candleData || linePriceData);
  }, [useApiData, historicalData, candleData, linePriceData]);

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Derivar rótulos padrão estilo LN Markets
  const derivedDisplaySymbol = displaySymbol || (symbol?.includes('BTCUSDT') ? 'XBTUSD' : (symbol || ''));
  const derivedDescription = symbolDescription || (symbol?.includes('BTCUSDT') ? 'BTCUSD: LNM FUTURES' : symbol || '');

  // Função para calcular limite baseado no timeframe
  function getLimitForTimeframe(timeframe: string): number {
    const timeframeMinutes = getTimeframeMinutes(timeframe);
    const sevenDaysMinutes = 7 * 24 * 60; // 7 dias em minutos
    return Math.ceil(sevenDaysMinutes / timeframeMinutes);
  }

  function getTimeframeMinutes(timeframe: string): number {
    const unit = timeframe.slice(-1);
    const value = parseInt(timeframe.slice(0, -1));
    
    switch (unit) {
      case 'm': return value;
      case 'h': return value * 60;
      case 'd': return value * 24 * 60;
      case 'w': return value * 7 * 24 * 60;
      default: return 60; // 1h padrão
    }
  }

  // ✅ MEMOIZAR CONFIGURAÇÃO DO CHART PARA EVITAR RECRIAÇÃO
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
      tickMarkFormatter: (time: any, tickMarkType: any) => {
        let timestamp: number;
        if (typeof time === 'number') {
          if (time > 0 && time < 4102444800) {
            timestamp = time;
          } else {
            timestamp = Math.floor(time / 1000);
          }
        } else {
          timestamp = Date.UTC(time.year, time.month - 1, time.day) / 1000;
        }
        
        const date = new Date(timestamp * 1000);
        
        if (isNaN(date.getTime()) || date.getFullYear() < 1970 || date.getFullYear() > 2100) {
          const fallbackHours = String(new Date().getHours()).padStart(2, '0');
          const fallbackMinutes = String(new Date().getMinutes()).padStart(2, '0');
          return `${fallbackHours}:${fallbackMinutes}`;
        }
        
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const day = String(date.getDate());
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        const year = date.getFullYear();
        
        if (currentTimeframe && /m|h/i.test(currentTimeframe)) {
          const hour = date.getHours();
          const minute = date.getMinutes();
          
          let temporalScore = 0;
          
          if (date.getMonth() === 0 && date.getDate() === 1) {
            return year.toString();
          }
          
          if (date.getDate() === 1) {
            return monthName;
          }
          
          if (hour === 0) temporalScore += 100;
          if (hour === 6) temporalScore += 80;
          if (hour === 12) temporalScore += 80;
          if (hour === 18) temporalScore += 80;
          if (hour === 21) temporalScore += 60;
          
          if (minute === 0) temporalScore += 20;
          
          if (temporalScore >= 80) {
            return day;
          }
          
          if (temporalScore >= 40) {
            return `${day} ${hours}:${minutes}`;
          }
          
          return `${hours}:${minutes}`;
        }
        
        if (currentTimeframe && /d|w/i.test(currentTimeframe)) {
          if (date.getMonth() === 0 && date.getDate() === 1) {
            return year.toString();
          }
          
          if (date.getDate() === 1) {
            return monthName;
          }
          
          return day;
        }
        
        return `${day} • ${monthName}`;
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

  // ✅ CRIAR GRÁFICO PRINCIPAL COM PANES NATIVOS - OTIMIZADO
  useEffect(() => {
    if (!containerRef.current) return;

    console.count('🚀 CHART CREATION - Execução #');
    console.log('🚀 CHART CREATION - Criando gráfico com panes nativos v5.0.3');

    // Criar gráfico principal
    const chart = createChart(containerRef.current, chartOptions);

    chartRef.current = chart;

        // ✅ CRIAR PANE RSI NATIVO v5.0.9 - API OFICIAL
        // Conforme documentação: panes são criados automaticamente ao usar paneIndex
        console.log('🚀 PANE CREATION - Preparando para criar pane RSI com paneIndex=1');

    // ✅ VERIFICAR SE CHART FOI CRIADO CORRETAMENTE
    if (!chart) {
      console.error('❌ CHART CREATION - Chart é null/undefined');
      return;
    }

    console.log('✅ CHART CREATION - Chart criado com sucesso:', {
      chartType: chart.constructor.name,
      hasAddCandlestickSeries: typeof (chart as any).addCandlestickSeries === 'function',
      hasAddLineSeries: typeof (chart as any).addLineSeries === 'function',
      hasAddPane: typeof (chart as any).addPane === 'function',
      chartMethods: Object.getOwnPropertyNames(chart).filter(name => name.includes('add'))
    });

    // Criar série principal (candlestick ou linha)
    if (effectiveCandleData && effectiveCandleData.length > 0) {
      try {
        if ('open' in effectiveCandleData[0]) {
          // Dados de candlestick
              const series = (chart as any).addCandlestickSeries({
        upColor: '#26a69a', 
        downColor: '#ef5350',
            borderVisible: false,
        wickUpColor: '#26a69a', 
        wickDownColor: '#ef5350',
          });
          mainSeriesRef.current = series;
          console.log('✅ MAIN SERIES - Candlestick series criada');
    } else {
          // Dados de linha
              const series = (chart as any).addLineSeries({
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

    // Criar séries para linhas de liquidação
    if (liquidationLines && liquidationLines.length > 0) {
      try {
        liquidationSeriesRef.current = (chart as any).addLineSeries({
          color: '#ff6b6b',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
        });
        console.log('✅ LIQUIDATION SERIES - Série criada');
      } catch (error) {
        console.error('❌ LIQUIDATION SERIES - Erro ao criar série:', error);
      }
    }

    // Criar séries para linhas de take profit
    if (takeProfitLines && takeProfitLines.length > 0) {
      try {
        takeProfitSeriesRef.current = (chart as any).addLineSeries({
          color: '#51cf66',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
        });
        console.log('✅ TAKE PROFIT SERIES - Série criada');
      } catch (error) {
        console.error('❌ TAKE PROFIT SERIES - Erro ao criar série:', error);
      }
    }

    // ✅ CRIAR SÉRIES RSI NO PANE NATIVO - API OFICIAL v5.0.9
    // Conforme documentação: panes são criados automaticamente ao usar paneIndex
    try {
      const paneIndex = 1; // Pane RSI será criado automaticamente
      
      // ✅ API OFICIAL v5.0.9 - addSeries(SeriesType, options, paneIndex)
      rsiSeriesRef.current = (chart as any).addLineSeries({
        color: '#8b5cf6',
        lineWidth: 2,
        priceFormat: {
          type: 'percent' as const,
          precision: 2,
          minMove: 0.01,
        },
      }, paneIndex);

      overboughtSeriesRef.current = (chart as any).addLineSeries({
        color: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.5)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceFormat: {
          type: 'percent' as const,
          precision: 0,
          minMove: 1,
        },
      }, paneIndex);

      oversoldSeriesRef.current = (chart as any).addLineSeries({
        color: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.5)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceFormat: {
          type: 'percent' as const,
          precision: 0,
          minMove: 1,
        },
      }, paneIndex);
      
      // ✅ CONFIGURAR PANE RSI - API OFICIAL
      const rsiPane = (chart as any).panes()[paneIndex];
      if (rsiPane) {
        rsiPane.setHeight(150); // Altura do pane RSI
        console.log('🚀 RSI PANE - Pane configurado:', {
          paneIndex: rsiPane.paneIndex(),
          height: rsiPane.getHeight(),
          series: rsiPane.getSeries().length
        });
      }
      
      console.log('🚀 RSI SERIES - Séries RSI criadas no pane:', paneIndex);
    } catch (error) {
      console.warn('⚠️ RSI SERIES - Erro ao criar séries no pane:', error);
      // Fallback: criar no gráfico principal com priceScale separado
      rsiSeriesRef.current = (chart as any).addLineSeries({
        color: '#8b5cf6',
        lineWidth: 2,
        priceFormat: {
          type: 'percent' as const,
          precision: 2,
          minMove: 0.01,
        },
        priceScaleId: 'right',
      });
      console.log('🚀 RSI SERIES - Fallback: série criada no gráfico principal');
    }

    console.log('🚀 SERIES CREATION - Séries criadas:', {
      mainSeries: !!mainSeriesRef.current,
      liquidationSeries: !!liquidationSeriesRef.current,
      takeProfitSeries: !!takeProfitSeriesRef.current,
      rsiSeries: !!rsiSeriesRef.current,
      overboughtSeries: !!overboughtSeriesRef.current,
      oversoldSeries: !!oversoldSeriesRef.current,
      rsiPaneIndex: 1
    });

    setChartReady(true);

    return () => {
      console.log('🧹 CHART CLEANUP - Limpando gráfico');
      setChartReady(false);
      if (chart) {
        chart.remove();
      }
      chartRef.current = null;
      mainSeriesRef.current = null;
      liquidationSeriesRef.current = null;
      takeProfitSeriesRef.current = null;
      rsiSeriesRef.current = null;
      overboughtSeriesRef.current = null;
      oversoldSeriesRef.current = null;
      rsiPaneRef.current = null;
    };
  }, [chartOptions]); // ✅ DEPENDÊNCIA ESTÁVEL - chartOptions é memoizado

  // ✅ CALCULAR RSI COM useCallback PARA EVITAR LOOPS
  const calculateRSI = useCallback(() => {
    console.count('📊 RSI CALCULATION - Execução #');
    if (!rsiEnabled || !effectiveCandleData || effectiveCandleData.length === 0) {
      setRsiData([]);
      return;
    }
      
    try {
      console.log('📊 RSI CALCULATION - Calculando RSI:', {
        candleDataLength: effectiveCandleData.length,
        rsiConfig
      });

      // Converter dados para formato esperado pelo serviço
      const candleData = effectiveCandleData.map(item => ({
        time: item.time as number,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: 0
      }));

      const calculatedRSI = TechnicalIndicatorsService.calculateRSIExponential(candleData, rsiConfig);
      
      // Converter para formato Lightweight Charts
      const rsiChartData = calculatedRSI.map(point => ({
        time: point.time as Time,
        value: point.value
      }));
      
      setRsiData(rsiChartData);

      console.log('📊 RSI CALCULATION - RSI calculado:', {
        dataPoints: calculatedRSI.length,
        latestValue: calculatedRSI[calculatedRSI.length - 1]?.value
      });
    } catch (error) {
      console.warn('⚠️ RSI CALCULATION - Erro ao calcular RSI:', error);
      setRsiData([]);
    }
  }, [rsiEnabled, effectiveCandleData, rsiConfig]);

  // ✅ CALCULAR RSI QUANDO DADOS MUDAREM
  useEffect(() => {
    calculateRSI();
  }, [calculateRSI]);

  // ✅ ATUALIZAR DADOS DAS SÉRIES COM useCallback PARA EVITAR LOOPS
  const updateSeriesData = useCallback(() => {
    console.count('🔄 DATA UPDATE - Execução #');
    if (!chartReady || !chartRef.current) return;

    console.log('🔄 DATA UPDATE - Atualizando dados das séries:', {
      hasMainSeries: !!mainSeriesRef.current,
      hasEffectiveData: !!effectiveCandleData,
      dataLength: effectiveCandleData?.length || 0,
      rsiEnabled,
      rsiDataLength: rsiData.length
    });

    try {
      // Atualizar série principal
      if (mainSeriesRef.current && effectiveCandleData && effectiveCandleData.length > 0) {
        if ('open' in effectiveCandleData[0]) {
          // Dados de candlestick
          (mainSeriesRef.current as ISeriesApi<'Candlestick'>).setData(effectiveCandleData as CandlestickPoint[]);
        } else {
          // Dados de linha
          (mainSeriesRef.current as ISeriesApi<'Line'>).setData(effectiveCandleData as LinePoint[]);
        }
      }

      // Atualizar linhas de liquidação
      if (liquidationSeriesRef.current && liquidationLines && liquidationLines.length > 0) {
        const liquidationData = liquidationLines.map(line => ({
          time: (Math.floor(Date.now() / 1000) - 3600) as Time,
          value: line.price
        }));
        liquidationSeriesRef.current.setData(liquidationData);
      }

      // Atualizar linhas de take profit
      if (takeProfitSeriesRef.current && takeProfitLines && takeProfitLines.length > 0) {
        const takeProfitData = takeProfitLines.map(line => ({
          time: (Math.floor(Date.now() / 1000) - 3600) as Time,
          value: line.price
        }));
        takeProfitSeriesRef.current.setData(takeProfitData);
      }

      // ✅ ATUALIZAR DADOS RSI NO PANE NATIVO
      if (rsiEnabled && rsiSeriesRef.current && rsiData.length > 0) {
        console.log('🔄 RSI UPDATE - Atualizando dados RSI no pane:', {
          rsiDataLength: rsiData.length,
          latestValue: rsiData[rsiData.length - 1]?.value
        });

        rsiSeriesRef.current.setData(rsiData);

        // Atualizar linhas de referência
        if (overboughtSeriesRef.current && oversoldSeriesRef.current && effectiveCandleData && effectiveCandleData.length > 0) {
          const firstTime = effectiveCandleData[0].time;
          const lastTime = effectiveCandleData[effectiveCandleData.length - 1].time;

          overboughtSeriesRef.current.setData([
            { time: firstTime as Time, value: rsiConfig.overbought },
            { time: lastTime as Time, value: rsiConfig.overbought },
          ]);

          oversoldSeriesRef.current.setData([
            { time: firstTime as Time, value: rsiConfig.oversold },
            { time: lastTime as Time, value: rsiConfig.oversold },
          ]);
        }
      }

    } catch (error) {
      console.warn('⚠️ DATA UPDATE - Erro ao atualizar dados:', error);
    }
  }, [chartReady, effectiveCandleData, liquidationLines, takeProfitLines, rsiEnabled, rsiData, rsiConfig]);

  // ✅ ATUALIZAR DADOS DAS SÉRIES
  useEffect(() => {
    updateSeriesData();
  }, [updateSeriesData]);

  // ✅ CONTROLAR VISIBILIDADE DO PANE RSI COM useCallback
  const updatePaneVisibility = useCallback(() => {
    if (!chartReady || !rsiPaneRef.current) return;

    console.log('🔄 PANE VISIBILITY - Controlando visibilidade do pane RSI:', {
      rsiEnabled,
      paneExists: !!rsiPaneRef.current
    });

    if (rsiPaneRef.current) {
      // Ajustar altura do pane baseado no estado do RSI
      const paneHeight = rsiEnabled ? 100 : 0;
      rsiPaneRef.current.setHeight(paneHeight);
      
      console.log('🔄 PANE HEIGHT - Altura do pane ajustada:', {
        height: paneHeight,
        rsiEnabled
      });
    }
  }, [chartReady, rsiEnabled]);

  // ✅ CONTROLAR VISIBILIDADE DO PANE RSI
  useEffect(() => {
    updatePaneVisibility();
  }, [updatePaneVisibility]);

  const handleTimeframeChange = (newTimeframe: string) => {
    console.log('🔄 TIMEFRAME CHANGE - Mudando timeframe:', {
      from: currentTimeframe,
      to: newTimeframe
    });
    setCurrentTimeframe(newTimeframe);
  };

  return (
    <>
      {/* Estilos CSS customizados */}
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
        
        .rsi-indicator {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 5;
        }
      `}</style>
      
      <Card className={`w-full ${className}`}>
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
                  {derivedDisplaySymbol}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {derivedDescription}
                </p>
              </div>
            </div>
              
            <div className="flex items-center gap-2">
              {/* Timeframe Selector */}
              <TimeframeSelector
                value={currentTimeframe}
                onChange={handleTimeframeChange}
                className="h-8"
              />
              
              {/* RSI Toggle */}
                  <Button
                variant={rsiEnabled ? "default" : "outline"}
                    size="sm"
                onClick={() => setRsiEnabled(!rsiEnabled)}
                className="h-8 px-3 text-xs"
              >
                <Activity className="w-3 h-3 mr-1" />
                RSI {rsiEnabled ? 'ON' : 'OFF'}
                  </Button>

              {/* Toolbar */}
              {showToolbar && (
                <div className="flex items-center gap-1">
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
              <Badge variant="outline" className="text-xs">
                {useApiData ? 'API Data' : 'Static Data'}
              </Badge>
              {historicalLoading && (
                <Badge variant="secondary" className="text-xs">
                  Loading...
                </Badge>
              )}
              {historicalError && (
                <Badge variant="destructive" className="text-xs">
                  Error
                </Badge>
                )}
              </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Panes Nativos v5.0.3
              </Badge>
              {rsiEnabled && (
                <Badge variant="default" className="text-xs">
                  RSI Pane Active
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="chart-container">
            <div ref={containerRef} className="w-full h-full" />
            
            {/* Loading Overlay */}
            {historicalLoading && (
              <div className="chart-loading">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Loading chart data...
          </div>
        </div>
      )}

            {/* RSI Indicator */}
            {rsiEnabled && rsiData.length > 0 && (
              <div className="rsi-indicator">
                RSI {rsiConfig.period}: {rsiData[rsiData.length - 1]?.value?.toFixed(2)}%
          </div>
            )}
        </div>
      </CardContent>
    </Card>
    </>
  );
});

export default LightweightLiquidationChart;