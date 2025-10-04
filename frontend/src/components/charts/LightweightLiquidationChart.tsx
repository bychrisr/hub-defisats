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
import { 
  BarChart3, 
  TrendingUp, 
  Settings, 
  X
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
  

  // Estados
  const [currentTimeframe, setCurrentTimeframe] = useState(timeframe);
  const [chartReady, setChartReady] = useState(false);

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
      // ✅ CONFIGURAÇÕES ROBUSTAS PARA TIMESTAMP IDÊNTICO À LN MARKETS
      tickMarkMaxCharacterLength: 8, // Limitar tamanho dos labels
      barSpacing: 6, // Espaçamento entre barras
      minBarSpacing: 0.5, // Espaçamento mínimo
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
        
        // ✅ SOLUÇÃO ROBUSTA BASEADA NA REFERÊNCIA LN MARKETS
        // Formatação idêntica: dias grandes centralizados + horários HH:MM
        
        if (currentTimeframe && /m|h/i.test(currentTimeframe)) {
          // Para timeframes intraday (minutos/horas) - como na referência LN Markets
          
          // 1. Meia-noite (00:00) - mostrar dia do mês (números grandes centralizados)
          if (date.getHours() === 0 && date.getMinutes() === 0) {
            return date.getDate().toString();
          }
          
          // 2. Horários específicos (06:00, 12:00, 18:00) - mostrar HH:MM
          if ((date.getHours() === 6 || date.getHours() === 12 || date.getHours() === 18) && date.getMinutes() === 0) {
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          }
          
          // 3. Outros horários - mostrar HH:MM
          return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        }
        
        if (currentTimeframe && /d|w/i.test(currentTimeframe)) {
          // Para timeframes diários/semanais
          
          // 1. Primeiro dia do ano - mostrar ano
          if (date.getMonth() === 0 && date.getDate() === 1) {
            return date.getFullYear().toString();
          }
          
          // 2. Primeiro dia do mês - mostrar nome do mês
          if (date.getDate() === 1) {
            return date.toLocaleDateString('en-US', { month: 'short' });
          }
          
          // 3. Outros dias - mostrar dia do mês
          return date.getDate().toString();
        }
        
        // Fallback para outros timeframes
        return date.getDate().toString();
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


    console.log('🚀 SERIES CREATION - Séries criadas:', {
      mainSeries: !!mainSeriesRef.current,
      liquidationSeries: !!liquidationSeriesRef.current,
      takeProfitSeries: !!takeProfitSeriesRef.current
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
        
        
        // Remover chart - API v5.0.9
        chart.remove();
        chartRef.current = null;
        
        console.log('✅ CHART CLEANUP - Chart removido com sucesso usando API v5.0.9');
      } catch (error) {
        console.error('❌ CHART CLEANUP - Erro ao remover chart:', error);
      }
    };
  }, [chartOptions, isChartReady, effectiveCandleData]); // ✅ DEPENDÊNCIAS ATUALIZADAS - incluir isChartReady e dados


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


    } catch (error) {
      console.warn('⚠️ DATA UPDATE - Erro ao atualizar dados:', error);
    }
  }, [chartReady, effectiveCandleData, liquidationLines, takeProfitLines]);

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

        </div>
      </CardContent>
    </Card>
    </>
  );
});

export default LightweightLiquidationChart;