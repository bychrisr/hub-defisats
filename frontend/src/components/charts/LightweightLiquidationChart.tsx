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

  // ✅ VERIFICAR SE TEMOS DADOS SUFICIENTES PARA CRIAR O GRÁFICO
  const hasValidData = useMemo(() => {
    if (!effectiveCandleData || effectiveCandleData.length === 0) {
      return false;
    }
    
    // Verificar se os dados têm estrutura válida
    const firstDataPoint = effectiveCandleData[0];
    if (!firstDataPoint || !firstDataPoint.time) {
      return false;
    }
    
    // Para dados de candlestick, verificar se tem open, high, low, close
    if ('open' in firstDataPoint) {
      return firstDataPoint.open !== undefined && 
             firstDataPoint.high !== undefined && 
             firstDataPoint.low !== undefined && 
             firstDataPoint.close !== undefined;
    }
    
    // Para dados de linha, verificar se tem value
    if ('value' in firstDataPoint) {
      return firstDataPoint.value !== undefined;
    }
    
    return true;
  }, [effectiveCandleData]);

  // ✅ ESTADO DE CARREGAMENTO ADEQUADO
  const isChartReady = useMemo(() => {
    if (useApiData) {
      // Para dados da API, aguardar carregamento completo
      return !historicalLoading && !historicalError && hasValidData;
    } else {
      // Para dados estáticos, verificar se existem
      return hasValidData;
    }
  }, [useApiData, historicalLoading, historicalError, hasValidData]);

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
      // ✅ CONFIGURAÇÕES PARA EVITAR "SAMBANDO" - TRAVAR À DIREITA
      rightOffset: 12, // Margem em barras da borda direita
      fixRightEdge: true, // Prevenir scroll além da barra mais recente
      rightBarStaysOnScroll: true, // Manter barra hovered fixa durante scroll
      lockVisibleTimeRangeOnResize: true, // Manter range visível ao redimensionar
      shiftVisibleRangeOnNewBar: true, // Shift automático quando nova barra é adicionada
      allowShiftVisibleRangeOnWhitespaceReplacement: true, // Permitir shift em espaços vazios
      tickMarkFormatter: (time: any, tickMarkType: any) => {
        let timestamp: number;
        if (typeof time === 'number') {
          // ✅ CORREÇÃO: Lightweight Charts já recebe timestamp em segundos
          // A conversão de ms para s deve ser feita ANTES de chegar aqui
          timestamp = time;
        } else {
          timestamp = Date.UTC(time.year, time.month - 1, time.day) / 1000;
        }
        
        // ✅ CORREÇÃO: Timestamp já está em segundos, não precisa multiplicar por 1000
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
    
    // ✅ CRÍTICO: Só criar gráfico quando tivermos dados válidos
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

    console.count('🚀 CHART CREATION - Execução #');
    console.log('🚀 CHART CREATION - Criando gráfico com panes nativos v5.0.9 - DADOS VÁLIDOS CONFIRMADOS');

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
      hasAddSeries: typeof chart.addSeries === 'function',
      hasAddPane: typeof chart.addPane === 'function',
      chartMethods: Object.getOwnPropertyNames(chart).filter(name => name.includes('add'))
    });

    // Criar série principal (candlestick ou linha) - API v5.0.9
    if (effectiveCandleData && effectiveCandleData.length > 0) {
      try {
        if ('open' in effectiveCandleData[0]) {
          // Dados de candlestick - API v5.0.9
          const series = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a', 
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a', 
            wickDownColor: '#ef5350',
          });
          mainSeriesRef.current = series;
          console.log('✅ MAIN SERIES - Candlestick series criada com API v5.0.9');
        } else {
          // Dados de linha - API v5.0.9
          const series = chart.addSeries(LineSeries, {
            color: '#2196F3',
            lineWidth: 2,
          });
          mainSeriesRef.current = series;
          console.log('✅ MAIN SERIES - Line series criada com API v5.0.9');
        }
      } catch (error) {
        console.error('❌ MAIN SERIES - Erro ao criar série principal:', error);
      }
    }

    // Criar séries para linhas de liquidação - API v5.0.9
    if (liquidationLines && liquidationLines.length > 0) {
      try {
        liquidationSeriesRef.current = chart.addSeries(LineSeries, {
          color: '#ff6b6b',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
        });
        console.log('✅ LIQUIDATION SERIES - Série criada com API v5.0.9');
      } catch (error) {
        console.error('❌ LIQUIDATION SERIES - Erro ao criar série:', error);
      }
    }

    // Criar séries para linhas de take profit - API v5.0.9
    if (takeProfitLines && takeProfitLines.length > 0) {
      try {
        takeProfitSeriesRef.current = chart.addSeries(LineSeries, {
          color: '#51cf66',
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
        });
        console.log('✅ TAKE PROFIT SERIES - Série criada com API v5.0.9');
      } catch (error) {
        console.error('❌ TAKE PROFIT SERIES - Erro ao criar série:', error);
      }
    }

    // ✅ CRIAR SÉRIES RSI - API v5.0.9 (com panes nativos)
    // Na v5.0.9, usamos panes nativos para separar escalas
    try {
      // Criar pane para RSI - API v5.0.9
      const rsiPane = chart.addPane();
      rsiPaneRef.current = rsiPane;
      
      // ✅ CORREÇÃO: Usar o índice correto do pane RSI
      const rsiPaneIndex = rsiPane.index();
      
      // Criar série RSI principal no pane dedicado - API v5.0.9
      rsiSeriesRef.current = chart.addSeries(LineSeries, {
        color: '#8b5cf6',
        lineWidth: 2,
        priceFormat: {
          type: 'percent' as const,
          precision: 2,
          minMove: 0.01,
        },
      }, rsiPaneIndex);

      // Criar linha de overbought no mesmo pane - API v5.0.9
      overboughtSeriesRef.current = chart.addSeries(LineSeries, {
        color: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.5)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceFormat: {
          type: 'percent' as const,
          precision: 0,
          minMove: 1,
        },
      }, rsiPaneIndex);

      // Criar linha de oversold no mesmo pane - API v5.0.9
      oversoldSeriesRef.current = chart.addSeries(LineSeries, {
        color: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.5)',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceFormat: {
          type: 'percent' as const,
          precision: 0,
          minMove: 1,
        },
      }, rsiPaneIndex);
      
      // Configurar altura do pane RSI baseado no estado inicial - API v5.0.9
      rsiPane.setHeight(rsiEnabled ? 100 : 0);
      
      console.log('🚀 RSI SERIES - Séries RSI criadas com API v5.0.9 e pane nativo');
    } catch (error) {
      console.warn('⚠️ RSI SERIES - Erro ao criar séries RSI:', error);
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
      console.log('🧹 CHART CLEANUP - Limpando gráfico com API v5.0.9');
      setChartReady(false);
      
      try {
        // Remover todas as séries - API v5.0.9
        if (mainSeriesRef.current) {
          chart.removeSeries(mainSeriesRef.current);
          mainSeriesRef.current = null;
        }
        
        if (liquidationSeriesRef.current) {
          chart.removeSeries(liquidationSeriesRef.current);
          liquidationSeriesRef.current = null;
        }
        
        if (takeProfitSeriesRef.current) {
          chart.removeSeries(takeProfitSeriesRef.current);
          takeProfitSeriesRef.current = null;
        }
        
        if (rsiSeriesRef.current) {
          chart.removeSeries(rsiSeriesRef.current);
          rsiSeriesRef.current = null;
        }
        
        if (overboughtSeriesRef.current) {
          chart.removeSeries(overboughtSeriesRef.current);
          overboughtSeriesRef.current = null;
        }
        
        if (oversoldSeriesRef.current) {
          chart.removeSeries(oversoldSeriesRef.current);
          oversoldSeriesRef.current = null;
        }
        
        // Remover pane RSI - API v5.0.9
        if (rsiPaneRef.current) {
          chart.removePane(rsiPaneRef.current);
          rsiPaneRef.current = null;
        }
        
        // Remover chart - API v5.0.9
        chart.remove();
        chartRef.current = null;
        
        console.log('✅ CHART CLEANUP - Chart removido com sucesso usando API v5.0.9');
      } catch (error) {
        console.error('❌ CHART CLEANUP - Erro ao remover chart:', error);
      }
    };
  }, [chartOptions, isChartReady, effectiveCandleData]); // ✅ DEPENDÊNCIAS ATUALIZADAS - incluir isChartReady e dados

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

      console.log('📊 RSI CALCULATION - Dados de entrada:', {
        candleDataLength: candleData.length,
        firstCandle: candleData[0],
        lastCandle: candleData[candleData.length - 1],
        rsiConfig
      });

      const calculatedRSI = TechnicalIndicatorsService.calculateRSIExponential(candleData, rsiConfig);
      
      console.log('📊 RSI CALCULATION - RSI calculado:', {
        rsiLength: calculatedRSI.length,
        firstRSI: calculatedRSI[0],
        lastRSI: calculatedRSI[calculatedRSI.length - 1]
      });
      
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
    if (!chartReady || !chartRef.current) {
      console.log('🔄 DATA UPDATE - Condições não atendidas:', {
        chartReady,
        hasChart: !!chartRef.current
      });
      return;
    }

    console.log('🔄 DATA UPDATE - Atualizando dados das séries:', {
      hasMainSeries: !!mainSeriesRef.current,
      hasEffectiveData: !!effectiveCandleData,
      dataLength: effectiveCandleData?.length || 0,
      rsiEnabled,
      rsiDataLength: rsiData.length,
      chartReady,
      hasChart: !!chartRef.current
    });

    try {
      // Atualizar série principal
      if (mainSeriesRef.current && effectiveCandleData && effectiveCandleData.length > 0) {
        if ('open' in effectiveCandleData[0]) {
          // Dados de candlestick
          mainSeriesRef.current.setData(effectiveCandleData as any);
        } else {
          // Dados de linha
          mainSeriesRef.current.setData(effectiveCandleData as any);
        }
        
        // ✅ CORREÇÃO CRÍTICA: Chamar fitContent() após setData para ajustar escala inicial
        // Isso resolve o problema do gráfico aparecer vazio na inicialização
        chartRef.current.timeScale().fitContent();
        
        console.log('✅ DATA UPDATE - Dados aplicados à série principal e escala ajustada com fitContent()');
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
          const firstTime = effectiveCandleData[0].time as Time;
          const lastTime = effectiveCandleData[effectiveCandleData.length - 1].time as Time;

          overboughtSeriesRef.current.setData([
            { time: firstTime, value: rsiConfig.overbought },
            { time: lastTime, value: rsiConfig.overbought },
          ]);

          oversoldSeriesRef.current.setData([
            { time: firstTime, value: rsiConfig.oversold },
            { time: lastTime, value: rsiConfig.oversold },
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

  // ✅ FORÇAR ATUALIZAÇÃO QUANDO DADOS HISTÓRICOS CARREGAREM
  useEffect(() => {
    if (chartReady && effectiveCandleData && effectiveCandleData.length > 0) {
      console.log('🚀 FORCE UPDATE - Dados históricos carregados, forçando atualização:', {
        dataLength: effectiveCandleData.length,
        chartReady,
        hasMainSeries: !!mainSeriesRef.current
      });
      
      // Pequeno delay para garantir que o gráfico esteja totalmente pronto
      const timeoutId = setTimeout(() => {
        updateSeriesData();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [chartReady, effectiveCandleData, updateSeriesData]);

  // ✅ CONTROLAR VISIBILIDADE DAS SÉRIES RSI COM useCallback (v5.0.9)
  const updateRSIVisibility = useCallback(() => {
    if (!chartReady) return;

    console.log('🔄 RSI VISIBILITY - Controlando visibilidade das séries RSI:', {
      rsiEnabled,
      hasRsiSeries: !!rsiSeriesRef.current,
      hasOverboughtSeries: !!overboughtSeriesRef.current,
      hasOversoldSeries: !!oversoldSeriesRef.current,
      hasRsiPane: !!rsiPaneRef.current
    });

    // Na v5.0.9, controlamos tanto a visibilidade das séries quanto do pane
    if (rsiSeriesRef.current) {
      rsiSeriesRef.current.applyOptions({
        visible: rsiEnabled
      });
    }
    
    if (overboughtSeriesRef.current) {
      overboughtSeriesRef.current.applyOptions({
        visible: rsiEnabled
      });
    }
    
    if (oversoldSeriesRef.current) {
      oversoldSeriesRef.current.applyOptions({
        visible: rsiEnabled
      });
    }
    
    // Na v5.0.9, também controlamos a altura do pane
    if (rsiPaneRef.current) {
      if (rsiEnabled) {
        rsiPaneRef.current.setHeight(100);
        console.log('✅ RSI VISIBILITY - Pane RSI visível (altura: 100px)');
      } else {
        rsiPaneRef.current.setHeight(0);
        console.log('✅ RSI VISIBILITY - Pane RSI oculto (altura: 0px)');
      }
    }
    
    console.log('🔄 RSI VISIBILITY - Visibilidade das séries RSI ajustada:', {
      visible: rsiEnabled
    });
  }, [chartReady, rsiEnabled]);

  // ✅ CONTROLAR VISIBILIDADE DAS SÉRIES RSI
  useEffect(() => {
    updateRSIVisibility();
  }, [updateRSIVisibility]);

  const handleTimeframeChange = (newTimeframe: string) => {
    console.log('🔄 TIMEFRAME CHANGE - Mudando timeframe:', {
      from: currentTimeframe,
      to: newTimeframe
    });
    
    // ✅ CRÍTICO: Não recriar gráfico ao mudar timeframe
    // Apenas atualizar o estado - o hook useHistoricalData vai buscar novos dados
    setCurrentTimeframe(newTimeframe);
    
    // ✅ O gráfico será atualizado automaticamente quando os novos dados chegarem
    // via useEffect que monitora effectiveCandleData
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
                  {derivedDisplaySymbol} (Lightweight Charts v5.0.9)
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
              <span className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                {useApiData ? 'API Data' : 'Static Data'}
              </span>
              {historicalLoading && (
                <span className="inline-flex items-center rounded-full border border-transparent bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                  Loading...
                </span>
              )}
              {!isChartReady && !historicalLoading && (
                <span className="inline-flex items-center rounded-full border border-transparent bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                  Preparing...
                </span>
              )}
              {historicalError && (
                <span className="inline-flex items-center rounded-full border border-transparent bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                  Error
                </span>
              )}
              {isChartReady && !historicalLoading && !historicalError && (
                <span className="inline-flex items-center rounded-full border border-transparent bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                  Ready
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
                Lightweight Charts v5.0.9
              </span>
              {rsiEnabled && (
                <span className="inline-flex items-center rounded-full border border-transparent bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
                  RSI Active
                </span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="chart-container">
            <div ref={containerRef} className="w-full h-full" />
            
            {/* Loading Overlay */}
            {(historicalLoading || !isChartReady) && (
              <div className="chart-loading">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  {historicalLoading ? 'Loading chart data...' : 'Preparing chart...'}
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