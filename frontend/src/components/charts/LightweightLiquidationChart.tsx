import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, ISeriesApi, LineStyle } from 'lightweight-charts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useCandleData } from '@/hooks/useCandleData';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useIndicators, IndicatorType } from '@/hooks/useIndicators';
import { TimeframeSelector } from '@/components/ui/timeframe-selector';
import { 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Plus,
  ChevronDown,
  Activity,
  Target,
  Loader2,
  X
} from 'lucide-react';

type CandlestickPoint = { time: number; open: number; high: number; low: number; close: number };
type LinePoint = { time: number; value: number };

interface LightweightLiquidationChartProps {
  symbol?: string;
  height?: number;
  className?: string;
  liquidationPrice?: number; // compat: uma linha
  liquidationLines?: Array<{ price: number; label?: string; color?: string }>; // múltiplas linhas
  takeProfitLines?: Array<{ price: number; label?: string; color?: string }>; // linhas de Take Profit
  timeframe?: string; // exibição e formatação do eixo
  showToolbar?: boolean;
  onTimeframeChange?: (timeframe: string) => void;
  onIndicatorAdd?: (indicator: string) => void;
  displaySymbol?: string; // Ex.: XBTUSD
  symbolDescription?: string; // Ex.: BTCUSD: LNM FUTURES
  logoUrl?: string; // Ex.: ícone LNM
  /**
   * Série de preços para exibir contexto (opcional). Se ausente, mostramos apenas a linha de liquidação no eixo.
   */
  linePriceData?: LinePoint[];
  candleData?: CandlestickPoint[]; // DEPRECATED: usar dados da API via useCandleData
  useApiData?: boolean; // Se true, usa dados da API em vez de props
}

const LightweightLiquidationChart: React.FC<LightweightLiquidationChartProps> = ({
  symbol = 'BINANCE:BTCUSDT',
  height = 220,
  className = '',
  liquidationPrice,
  liquidationLines,
  takeProfitLines,
  linePriceData,
  candleData,
  timeframe = '1h',
  showToolbar = true,
  onTimeframeChange,
  onIndicatorAdd,
  displaySymbol,
  symbolDescription,
  logoUrl,
  useApiData = false
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null>(null);
  const isInitialLoad = useRef(true); // Controle de carregamento inicial
  const [currentTimeframe, setCurrentTimeframe] = useState(timeframe);
  const [showIndicators, setShowIndicators] = useState(false);

  // Função para calcular limite baseado no timeframe (aproximadamente 7 dias)
  function getLimitForTimeframe(timeframe: string): number {
    const timeframeMinutes = getTimeframeMinutes(timeframe);
    const sevenDaysMinutes = 7 * 24 * 60; // 7 dias em minutos
    return Math.ceil(sevenDaysMinutes / timeframeMinutes);
  }

  // Função para converter timeframe para minutos
  function getTimeframeMinutes(timeframe: string): number {
    const tf = timeframe.toLowerCase();
    if (tf.includes('1m')) return 1;
    if (tf.includes('5m')) return 5;
    if (tf.includes('15m')) return 15;
    if (tf.includes('30m')) return 30;
    if (tf.includes('1h')) return 60;
    if (tf.includes('4h')) return 240;
    if (tf.includes('1d')) return 1440;
    return 60; // Default 1h
  }

  // Hook para dados históricos com navegação infinita
  const { 
    candleData: historicalData, 
    isLoading: candleLoading, 
    isLoadingMore: isLoadingMoreHistorical,
    error: candleError,
    hasMoreData,
    loadMoreHistorical,
    resetData: resetHistoricalData,
    // Novas funções para controle avançado
    loadDataForRange,
    getDataRange,
    isDataAvailable
  } = useHistoricalData({
    symbol: symbol.replace('BINANCE:', ''),
    timeframe: currentTimeframe,
    initialLimit: getLimitForTimeframe(currentTimeframe), // Limite baseado no timeframe para ~7 dias
    enabled: useApiData,
    maxDataPoints: 10000, // Máximo 10k candles em memória
    loadThreshold: currentTimeframe === '1h' ? 50 : 20 // Threshold dinâmico baseado no timeframe
  });

  // Usar dados históricos se habilitado, senão usar props
  const effectiveCandleData = useApiData ? historicalData : (candleData || linePriceData);
  
  // Debug logs
  console.log('🔍 LIGHTWEIGHT CHART - Debug info:', {
    useApiData,
    historicalDataLength: historicalData?.length || 0,
    candleDataLength: candleData?.length || 0,
    effectiveCandleDataLength: effectiveCandleData?.length || 0,
    candleLoading,
    candleError,
    hasMoreData,
    isLoadingMoreHistorical
  });

  // Hook para indicadores
  const { indicators, addIndicator, removeIndicator, toggleIndicator } = useIndicators();

  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Timeframes disponíveis
  const timeframes = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '30m', label: '30m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' }
  ];

  // Indicadores disponíveis (catálogo)
  const availableIndicators = [
    { id: 'rsi', name: 'RSI', icon: Activity },
    { id: 'macd', name: 'MACD', icon: TrendingUp },
    { id: 'bollinger', name: 'Bollinger Bands', icon: Target }
  ];

  const handleTimeframeChange = useCallback((newTimeframe: string) => {
    setCurrentTimeframe(newTimeframe);
    onTimeframeChange?.(newTimeframe);
    
    // Se usando dados da API, refetch com novo timeframe
    if (useApiData) {
      console.log('🔄 TIMEFRAME - Changing to:', newTimeframe);
      // O hook useCandleData vai automaticamente refetch quando timeframe mudar
    }
  }, [onTimeframeChange, useApiData]);

  const handleIndicatorAdd = useCallback((indicator: string) => {
    addIndicator(indicator as IndicatorType);
    onIndicatorAdd?.(indicator);
    setShowIndicators(false);
  }, [addIndicator, onIndicatorAdd]);

  // Derivar rótulos padrão estilo LN Markets
  const derivedDisplaySymbol = displaySymbol || (symbol?.includes('BTCUSDT') ? 'XBTUSD' : (symbol || ''));
  const derivedDescription = symbolDescription || (symbol?.includes('BTCUSDT') ? 'BTCUSD: LNM FUTURES' : symbol || '');

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        textColor: isDark ? '#d1d5db' : '#374151',
        background: { type: ColorType.Solid, color: 'transparent' },
        fontSize: 12,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        // Configurações para eliminar espaço em branco na direita
        rightOffset: 0, // Zero offset à direita
        fixRightEdge: true, // Fixar borda direita
      },
      grid: {
        vertLines: { 
          color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          style: 0 // LineStyle.Solid
        },
        horzLines: { 
          color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          style: 0 // LineStyle.Solid
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
        textColor: isDark ? '#9ca3af' : '#6b7280',
        // Configurações para eliminar espaço em branco
        fixLeftEdge: false, // Não fixar borda esquerda
        fixRightEdge: true, // Fixar borda direita
        tickMarkFormatter: (time) => {
          // ✅ CORREÇÃO CRÍTICA: Usar fuso horário local em vez de UTC
          // Converter timestamp para Date object usando fuso horário local
          const timestamp = typeof time === 'number' ? time : Date.UTC(time.year, time.month - 1, time.day) / 1000;
          const date = new Date(timestamp * 1000);
          
          // Formatação usando fuso horário local - estilo LN Markets melhorado
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const day = String(date.getDate());
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          
          // Para timeframes intraday (minutos/horas)
          if (currentTimeframe && /m|h/i.test(currentTimeframe)) {
            // Se for meia-noite local, mostrar dia + mês (formato claro)
            if (date.getHours() === 0 && date.getMinutes() === 0) {
              // Formato: "30 • Oct" - usando bullet point para separar dia e mês
              return `${day} • ${monthName}`;
            }
            // Caso contrário, mostrar apenas hora:minuto
            return `${hours}:${minutes}`;
          }
          
          // Para timeframes diários ou maiores - mostrar dia/mês
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
        axisDoubleClickReset: false // Evitar reset automático
      },
      // Forçar que o último candle sempre fique visível na direita
      rightPriceScale: {
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        textColor: isDark ? '#9ca3af' : '#6b7280',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        // Configuração para evitar espaço em branco
        alignLabels: false,
        borderVisible: true,
        entireTextOnly: false,
        visible: true,
        drawTicks: true,
      },
    });

    // Série principal (preferir candles, senão linha)
    if (effectiveCandleData && effectiveCandleData.length > 0) {
      const s = chart.addCandlestickSeries({
        upColor: '#26a69a', 
        downColor: '#ef5350',
        wickUpColor: '#26a69a', 
        wickDownColor: '#ef5350',
        borderVisible: false,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        },
      });
      // Garantir que os dados estejam ordenados por tempo (ascendente)
      const sortedData = [...effectiveCandleData].sort((a, b) => a.time - b.time);
      s.setData(sortedData as any);
      seriesRef.current = s;
    } else if (linePriceData && linePriceData.length > 0) {
      const s = chart.addLineSeries({ color: isDark ? '#93c5fd' : '#2563eb', lineWidth: 2 });
      s.setData(linePriceData);
      seriesRef.current = s;
    } else {
      // Sem dados: ancorar o eixo usando um preço de referência válido (primeira linha ou liquidationPrice)
      const anchor = (typeof liquidationPrice === 'number' && liquidationPrice > 0)
        ? liquidationPrice
        : (liquidationLines && liquidationLines.length > 0 ? liquidationLines[0].price : undefined);
      const s = chart.addLineSeries({ color: 'transparent', lineWidth: 1 });
      if (typeof anchor === 'number' && Number.isFinite(anchor)) {
        s.setData([
          { time: Math.floor(Date.now() / 1000) - 3600, value: anchor },
          { time: Math.floor(Date.now() / 1000), value: anchor }
        ]);
      } else {
        // Se nem anchor existe, ainda cria série vazia para permitir price lines (não exibirá nada)
        s.setData([{ time: Math.floor(Date.now() / 1000), value: 0 }]);
      }
      seriesRef.current = s;
    }

    // Render das linhas de liquidação (uma ou múltiplas)
    const series = seriesRef.current;
    const createdLines: any[] = [];
    const liquidationLinesData = (liquidationLines && liquidationLines.length > 0)
      ? liquidationLines
      : (typeof liquidationPrice === 'number' && liquidationPrice > 0
          ? [{ price: liquidationPrice }]
          : []);

    for (const [idx, ln] of liquidationLinesData.entries()) {
      const price = Number(ln.price);
      if (!Number.isFinite(price) || price <= 0) continue;
      const color = ln.color || '#ff4444';
      const label = ln.label || `Liquidação${liquidationLinesData.length > 1 ? ` #${idx+1}` : ''}: $${price.toLocaleString()}`;
      const pl = series?.createPriceLine({
        price,
        color,
        lineStyle: LineStyle.Solid,
        lineWidth: 2,
        axisLabelVisible: true,
        title: label,
      });
      if (pl) createdLines.push(pl);
    }

    // Render das linhas de Take Profit (verdes)
    const takeProfitLinesData = takeProfitLines || [];
    for (const [idx, tp] of takeProfitLinesData.entries()) {
      const price = Number(tp.price);
      if (!Number.isFinite(price) || price <= 0) continue;
      const color = tp.color || '#22c55e'; // Verde padrão para Take Profit
      const label = tp.label || `Take Profit #${idx+1}: $${price.toLocaleString()}`;
      const pl = series?.createPriceLine({
        price,
        color,
        lineStyle: LineStyle.Solid,
        lineWidth: 2,
        axisLabelVisible: true,
        title: label,
      });
      if (pl) createdLines.push(pl);
    }

    // Render dos indicadores
    const indicatorSeries: ISeriesApi<'Line'>[] = [];
    for (const indicator of indicators) {
      if (!indicator.visible || !indicator.data.length) continue;
      
      const indicatorSeriesInstance = chart.addLineSeries({
        color: indicator.color || '#3b82f6',
        lineWidth: 2,
        priceScaleId: indicator.id === 'rsi' ? 'right' : 'left', // RSI no eixo direito
        priceFormat: {
          type: 'price',
          precision: indicator.id === 'rsi' ? 0 : 2,
          minMove: indicator.id === 'rsi' ? 1 : 0.01,
        },
      });
      
      indicatorSeriesInstance.setData(indicator.data);
      indicatorSeries.push(indicatorSeriesInstance);
    }

    // Configurar zoom inicial para mostrar aproximadamente 7 dias (apenas no primeiro carregamento)
    const setInitialZoom = () => {
      if (effectiveCandleData && effectiveCandleData.length > 0) {
        const dataLength = effectiveCandleData.length;
        const visibleBars = Math.min(dataLength, getLimitForTimeframe(currentTimeframe));
        
        // Calcular range para mostrar os últimos 7 dias (ou todos os dados se menos)
        // IMPORTANTE: Sempre manter o último candle fixo na direita
        const fromIndex = Math.max(0, dataLength - visibleBars);
        const toIndex = dataLength - 1;
        
        // Aplicar zoom inicial mantendo último candle na direita
        chart.timeScale().setVisibleLogicalRange({
          from: fromIndex,
          to: toIndex
        });
        
        console.log('🎯 ZOOM - Initial zoom set:', {
          timeframe: currentTimeframe,
          totalBars: dataLength,
          visibleBars: visibleBars,
          fromIndex,
          toIndex,
          daysVisible: (visibleBars * getTimeframeMinutes(currentTimeframe)) / (24 * 60)
        });
        
        // Marcar que o carregamento inicial foi feito
        isInitialLoad.current = false;
      } else {
        // Fallback: fit content se não há dados
        chart.timeScale().fitContent();
      }
    };

    // Função para preservar zoom atual quando novos dados são carregados
    const preserveCurrentZoom = () => {
      if (!effectiveCandleData || effectiveCandleData.length === 0) return;
      
      const timeScale = chart.timeScale();
      const currentRange = timeScale.getVisibleLogicalRange();
      
      if (currentRange && !isInitialLoad.current) {
        const dataLength = effectiveCandleData.length;
        const lastCandleIndex = dataLength - 1;
        
        // Se o usuário estava visualizando dados antigos, preservar essa visualização
        if (currentRange.to < lastCandleIndex) {
          // Ajustar apenas se necessário para manter a proporção
          const visibleBars = currentRange.to - currentRange.from;
          const newFromIndex = Math.max(0, lastCandleIndex - visibleBars);
          
          timeScale.setVisibleLogicalRange({
            from: newFromIndex,
            to: lastCandleIndex
          });
          
          console.log('🎯 ZOOM - Preserved user zoom:', {
            originalFrom: currentRange.from,
            originalTo: currentRange.to,
            newFromIndex,
            lastCandleIndex,
            visibleBars: Math.round(visibleBars)
          });
        }
      }
    };

    // Função para ajustar zoom mantendo último candle fixo na direita (mais suave)
    const adjustZoomToKeepLastCandleFixed = () => {
      if (effectiveCandleData && effectiveCandleData.length > 0) {
        const dataLength = effectiveCandleData.length;
        const visibleRange = chart.timeScale().getVisibleLogicalRange();
        
        if (visibleRange) {
          // Calcular quantos candles estão visíveis
          const visibleBars = Math.round(visibleRange.to - visibleRange.from);
          
          // Só ajustar se o último candle não estiver na posição correta
          const expectedToIndex = dataLength - 1;
          const currentToIndex = Math.round(visibleRange.to);
          
          // Se há diferença significativa (mais de 1 candle), ajustar suavemente
          if (Math.abs(currentToIndex - expectedToIndex) > 1) {
            const newFromIndex = Math.max(0, dataLength - visibleBars);
            const newToIndex = dataLength - 1;
            
            // Aplicar novo range com animação suave
            chart.timeScale().setVisibleLogicalRange({
              from: newFromIndex,
              to: newToIndex
            });
            
            console.log('🎯 ZOOM - Smoothly adjusted to keep last candle fixed:', {
              originalFrom: visibleRange.from,
              originalTo: visibleRange.to,
              newFromIndex,
              newToIndex,
              visibleBars,
              difference: Math.abs(currentToIndex - expectedToIndex)
            });
          }
        }
      }
    };

    // Auto-range para incluir todas as priceLines (liquidação + take profit)
    try {
      const allPrices = [
        ...liquidationLinesData.map(l => l.price),
        ...takeProfitLinesData.map(tp => tp.price)
      ];
      if (allPrices.length > 0) {
        const min = Math.min(...allPrices);
        const max = Math.max(...allPrices);
        if (Number.isFinite(min) && Number.isFinite(max) && min < max) {
          chart.priceScale('right').setVisibleLogicalRange({ from: min, to: max } as any);
        }
      }
    } catch {}

    // Aplicar zoom inicial ou preservar zoom atual após um pequeno delay
    setTimeout(() => {
      if (isInitialLoad.current) {
        setInitialZoom();
      } else {
        preserveCurrentZoom();
      }
    }, 100);

    // Detectar scroll para carregar dados históricos (versão melhorada)
    const handleScroll = () => {
      if (!useApiData || !hasMoreData || isLoadingMoreHistorical) {
        console.log('🔄 SCROLL - Conditions not met:', {
          useApiData,
          hasMoreData,
          isLoadingMoreHistorical
        });
        return;
      }
      
      const timeScale = chart.timeScale();
      const visibleRange = timeScale.getVisibleLogicalRange();
      
      if (!visibleRange || !effectiveCandleData) return;
      
      // Calcular quantos candles estão visíveis
      const visibleCandles = Math.round(visibleRange.to - visibleRange.from);
      const totalCandles = effectiveCandleData.length;
      
      // Calcular quantos candles restam antes do início dos dados visíveis
      const candlesBeforeVisible = Math.round(visibleRange.from);
      
      // Threshold dinâmico baseado no timeframe
      const dynamicThreshold = currentTimeframe === '1h' ? 50 : 20;
      
      console.log('🔄 SCROLL - Scroll analysis:', {
        visibleFrom: visibleRange.from,
        visibleTo: visibleRange.to,
        visibleCandles,
        totalCandles,
        candlesBeforeVisible,
        threshold: dynamicThreshold,
        timeframe: currentTimeframe,
        shouldLoad: candlesBeforeVisible <= dynamicThreshold
      });
      
      // Carregar mais dados se estamos próximos do início dos dados disponíveis
      if (candlesBeforeVisible <= dynamicThreshold) {
        console.log('🔄 SCROLL - Loading more historical data...', {
          candlesBeforeVisible,
          threshold: dynamicThreshold,
          timeframe: currentTimeframe,
          hasMoreData,
          isLoadingMore: isLoadingMoreHistorical
        });
        loadMoreHistorical();
      }
    };

    // Detectar quando usuário navega para períodos sem dados
    const handleVisibleRangeChange = () => {
      if (!useApiData || !effectiveCandleData) return;
      
      const timeScale = chart.timeScale();
      const visibleRange = timeScale.getVisibleLogicalRange();
      
      if (!visibleRange) return;
      
      // Converter range lógico para timestamps
      const startIndex = Math.floor(visibleRange.from);
      const endIndex = Math.floor(visibleRange.to);
      
      // Threshold dinâmico baseado no timeframe
      const dynamicThreshold = currentTimeframe === '1h' ? 50 : 20;
      
      console.log('🔄 RANGE - Range change analysis:', {
        startIndex,
        endIndex,
        dataLength: effectiveCandleData.length,
        threshold: dynamicThreshold,
        timeframe: currentTimeframe,
        shouldLoadMore: startIndex <= dynamicThreshold
      });
      
      // Se estamos próximos do início dos dados, carregar mais
      if (startIndex <= dynamicThreshold && hasMoreData && !isLoadingMoreHistorical) {
        console.log('🔄 RANGE - Loading more historical data (range change)...', {
          startIndex,
          threshold: dynamicThreshold,
          hasMoreData,
          isLoadingMore: isLoadingMoreHistorical
        });
        loadMoreHistorical();
      }
      
      // Se usuário está navegando para fora dos dados disponíveis
      if (startIndex < 0 || endIndex >= effectiveCandleData.length) {
        const dataRange = getDataRange();
        if (!dataRange) return;
        
        // Calcular timestamps aproximados para o range visível
        const timeframeMinutes = getTimeframeMinutes(currentTimeframe);
        const startTime = dataRange.start + (startIndex * timeframeMinutes * 60);
        const endTime = dataRange.start + (endIndex * timeframeMinutes * 60);
        
        console.log('🔄 RANGE - User navigating outside available data:', {
          startIndex,
          endIndex,
          dataLength: effectiveCandleData.length,
          startTime,
          endTime,
          dataRange
        });
        
        // Carregar dados para este range se necessário
        if (startTime < dataRange.start || endTime > dataRange.end) {
          loadDataForRange(startTime, endTime);
        }
      }
    };

    // Listener específico para corrigir espaço em branco na direita (simplificado)
    const handleZoomChange = () => {
      if (!effectiveCandleData || effectiveCandleData.length === 0) return;
      
      const timeScale = chart.timeScale();
      const visibleRange = timeScale.getVisibleLogicalRange();
      
      if (visibleRange) {
        const dataLength = effectiveCandleData.length;
        const lastCandleIndex = dataLength - 1;
        
        // Só corrigir se há diferença significativa (mais de 0.5 candles)
        if (visibleRange.to < lastCandleIndex - 0.5) {
          const visibleBars = visibleRange.to - visibleRange.from;
          const newFromIndex = Math.max(0, lastCandleIndex - visibleBars);
          
          // Aplicar correção suavemente
          timeScale.setVisibleLogicalRange({
            from: newFromIndex,
            to: lastCandleIndex
          });
          
          console.log('🎯 ZOOM FIX - Corrected right margin (simplified):', {
            originalFrom: visibleRange.from,
            originalTo: visibleRange.to,
            newFromIndex,
            lastCandleIndex,
            visibleBars: Math.round(visibleBars)
          });
        }
      }
    };

    // Adicionar listeners para navegação infinita
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleScroll);
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
    
    // Listener específico para mudanças de zoom com debounce
    let zoomTimeout: NodeJS.Timeout;
    const debouncedZoomChange = () => {
      clearTimeout(zoomTimeout);
      zoomTimeout = setTimeout(handleZoomChange, 50);
    };
    
    chart.timeScale().subscribeVisibleLogicalRangeChange(debouncedZoomChange);

    // Resize
    const ro = new ResizeObserver(() => {
      if (!containerRef.current) return;
      chart.applyOptions({ width: containerRef.current.clientWidth, height });
      // Preservar zoom atual após resize (não resetar para 7 dias)
      setTimeout(() => {
        if (isInitialLoad.current) {
          setInitialZoom();
        } else {
          preserveCurrentZoom();
        }
      }, 50);
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      clearTimeout(zoomTimeout);
      // remover listeners
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleScroll);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleVisibleRangeChange);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(debouncedZoomChange);
      // remover priceLines criadas
      if (seriesRef.current && createdLines.length) {
        for (const l of createdLines) {
          try { (seriesRef.current as any).removePriceLine(l); } catch {}
        }
      }
      // remover séries de indicadores
      for (const indicatorSeriesInstance of indicatorSeries) {
        try { chart.removeSeries(indicatorSeriesInstance); } catch {}
      }
      chart.remove();
    };
  }, [height, isDark, liquidationPrice, currentTimeframe, liquidationLines, takeProfitLines, linePriceData, useApiData]);

  // useEffect separado para atualizar dados sem resetar o zoom
  useEffect(() => {
    console.log('🔄 DATA UPDATE - useEffect triggered:', {
      hasSeriesRef: !!seriesRef.current,
      hasEffectiveData: !!effectiveCandleData,
      dataLength: effectiveCandleData?.length || 0,
      isInitialLoad: isInitialLoad.current
    });
    
    if (!seriesRef.current || !effectiveCandleData || effectiveCandleData.length === 0) {
      console.log('🔄 DATA UPDATE - Early return:', {
        hasSeriesRef: !!seriesRef.current,
        hasEffectiveData: !!effectiveCandleData,
        dataLength: effectiveCandleData?.length || 0
      });
      return;
    }
    
    // Atualizar dados da série sem resetar zoom
    try {
      // Verificar se há dados válidos
      if (!effectiveCandleData || effectiveCandleData.length === 0) {
        console.log('🔄 DATA UPDATE - No data to update');
        return;
      }

      // Remover duplicatas e ordenar por tempo (ascendente)
      const uniqueData = effectiveCandleData.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.time === current.time);
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          // Se já existe, manter o mais recente (substituir)
          acc[existingIndex] = current;
        }
        return acc;
      }, [] as typeof effectiveCandleData);
      
      const sortedData = uniqueData.sort((a, b) => a.time - b.time);
      
      console.log(`🔄 CHART - Data deduplication: ${effectiveCandleData.length} -> ${uniqueData.length} unique points`);
      
      if (sortedData[0] && 'open' in sortedData[0]) {
        // Dados de candlestick
        (seriesRef.current as ISeriesApi<'Candlestick'>).setData(sortedData as CandlestickPoint[]);
        console.log('✅ DATA UPDATE - Candlestick data set:', sortedData.length);
      } else {
        // Dados de linha
        (seriesRef.current as ISeriesApi<'Line'>).setData(sortedData as LinePoint[]);
        console.log('✅ DATA UPDATE - Line data set:', sortedData.length);
      }
      
      console.log('📊 DATA - Updated series data without resetting zoom:', {
        dataLength: sortedData.length,
        isInitialLoad: isInitialLoad.current
      });
    } catch (error) {
      console.warn('⚠️ DATA - Error updating series data:', error);
    }
  }, [effectiveCandleData]);

  const hasAnyLine = (liquidationLines && liquidationLines.length > 0) || (typeof liquidationPrice === 'number' && liquidationPrice > 0);

  return (
    <>
      {/* Estilos CSS customizados para destacar mês no eixo de tempo */}
      <style>{`
        .lightweight-chart-time-axis .tv-lightweight-charts__time-axis-label {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
        }
        /* Destacar labels que contêm mês */
        .lightweight-chart-time-axis .tv-lightweight-charts__time-axis-label {
          color: ${isDark ? '#9ca3af' : '#6b7280'};
        }
      `}</style>
      
      <Card className={className}>
      {/* Barra Superior TradingView-style */}
      {showToolbar && (
        <div className={`border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} px-4 py-2`}>
          <div className="flex items-center justify-between">
            {/* Lado esquerdo: Símbolo e informações */}
            <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt="logo" className="h-5 w-5 rounded-full" />
              ) : (
                <BarChart3 className="h-4 w-4 text-blue-500" />
              )}
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-sm text-blue-400 hover:underline cursor-default">{derivedDisplaySymbol}</span>
                <span className="text-[11px] opacity-70">{derivedDescription}</span>
              </div>
              
              {/* Timeframe Selector - Estilo LN Markets */}
              <TimeframeSelector
                value={currentTimeframe}
                onChange={handleTimeframeChange}
                className="ml-2"
              />
            </div>
              
              {/* Loading indicator */}
              {useApiData && candleLoading && (
                <div className="flex items-center gap-2 text-xs text-blue-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Loading {currentTimeframe} data...</span>
                </div>
              )}
              
              {/* Error indicator */}
              {useApiData && candleError && (
                <div className="flex items-center gap-2 text-xs text-red-500">
                  <span>Error loading data</span>
                </div>
              )}
            </div>

            {/* Lado direito: Controles */}
            <div className="flex items-center gap-2">
              {/* Indicador de carregamento histórico */}
              {isLoadingMoreHistorical && (
                <div className="flex items-center gap-1 text-xs text-blue-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Loading history...</span>
                </div>
              )}
              
              {/* Indicadores ativos */}
              {indicators.length > 0 && (
                <div className="flex items-center gap-1">
                  {indicators.map((indicator) => (
                    <Badge
                      key={indicator.id}
                      variant="secondary"
                      className={`text-xs cursor-pointer hover:opacity-70 ${
                        !indicator.visible ? 'opacity-50' : ''
                      }`}
                      onClick={() => toggleIndicator(indicator.id)}
                    >
                      {indicator.name}
                      <X 
                        className="h-3 w-3 ml-1 hover:text-red-500" 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeIndicator(indicator.id);
                        }}
                      />
                    </Badge>
                  ))}
                </div>
              )}

              {/* Indicadores dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 text-xs ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
                  onClick={() => setShowIndicators(!showIndicators)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Indicators
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
                
                {showIndicators && (
                  <div className={`absolute right-0 top-full mt-1 w-48 rounded-md shadow-lg z-50 ${
                    isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                  }`}>
                    <div className="py-1">
                      {availableIndicators.map((indicator) => {
                        const IconComponent = indicator.icon;
                        return (
                          <button
                            key={indicator.id}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                              isDark 
                                ? 'text-gray-300 hover:bg-gray-700' 
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => handleIndicatorAdd(indicator.id)}
                          >
                            <IconComponent className="h-4 w-4" />
                            {indicator.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Settings */}
              <Button
                variant="ghost"
                size="sm"
                className={`h-7 px-2 text-xs ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                <Settings className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Linha de Liquidação</CardTitle>
            <CardDescription>
              {symbol} — {hasAnyLine ? 'linhas de liquidação' : 'sem dados de liquidação'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="w-full rounded-lg overflow-hidden lightweight-chart-time-axis" style={{ height }} />
      </CardContent>
    </Card>
    </>
  );
};

export default LightweightLiquidationChart;


