import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, ISeriesApi, LineStyle } from 'lightweight-charts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useCandleData } from '@/hooks/useCandleData';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useIndicators, IndicatorType } from '@/hooks/useIndicators';
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

  // Hook para dados históricos com navegação
  const { 
    candleData: historicalData, 
    isLoading: candleLoading, 
    isLoadingMore: isLoadingMoreHistorical,
    error: candleError,
    hasMoreData,
    loadMoreHistorical,
    resetData: resetHistoricalData
  } = useHistoricalData({
    symbol: symbol.replace('BINANCE:', ''),
    timeframe: currentTimeframe,
    initialLimit: getLimitForTimeframe(currentTimeframe), // Limite baseado no timeframe para ~7 dias
    enabled: useApiData
  });

  // Usar dados históricos se habilitado, senão usar props
  const effectiveCandleData = useApiData ? historicalData : candleData;

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
        tickMarkFormatter: (time) => {
          // Converter para timestamp UTC
          const timestamp = typeof time === 'number' ? time : Date.UTC(time.year, time.month - 1, time.day) / 1000;
          const date = new Date(timestamp * 1000);
          
          // Formatação baseada no timeframe - estilo LN Markets
          const hours = String(date.getUTCHours()).padStart(2, '0');
          const minutes = String(date.getUTCMinutes()).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          
          // Para timeframes intraday (minutos/horas) - mostrar HH:mm
          if (currentTimeframe && /m|h/i.test(currentTimeframe)) {
            // Se for meia-noite UTC, mostrar data + hora
            if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
              return `${day} ${monthName} ${hours}:${minutes}`;
            }
            // Caso contrário, mostrar apenas hora:minuto
            return `${hours}:${minutes}`;
          }
          
          // Para timeframes diários ou maiores - mostrar dd/MM
          return `${day}/${month}`;
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
      s.setData(effectiveCandleData as any);
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

    // Configurar zoom inicial para mostrar aproximadamente 7 dias
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
      } else {
        // Fallback: fit content se não há dados
        chart.timeScale().fitContent();
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

    // Aplicar zoom inicial após um pequeno delay para garantir que os dados foram renderizados
    setTimeout(setInitialZoom, 100);

    // Detectar scroll para carregar dados históricos
    const handleScroll = () => {
      if (!useApiData || !hasMoreData || isLoadingMoreHistorical) return;
      
      const timeScale = chart.timeScale();
      const visibleRange = timeScale.getVisibleLogicalRange();
      
      if (visibleRange && visibleRange.from <= 10) { // Se está próximo do início dos dados
        console.log('🔄 SCROLL - Loading more historical data...', {
          visibleFrom: visibleRange.from,
          visibleTo: visibleRange.to,
          hasMoreData,
          isLoadingMore: isLoadingMoreHistorical
        });
        loadMoreHistorical();
      }
    };

    // Listener específico para corrigir espaço em branco na direita
    const handleZoomChange = () => {
      if (!effectiveCandleData || effectiveCandleData.length === 0) return;
      
      const timeScale = chart.timeScale();
      const visibleRange = timeScale.getVisibleLogicalRange();
      
      if (visibleRange) {
        const dataLength = effectiveCandleData.length;
        const lastCandleIndex = dataLength - 1;
        
        // Se o último candle não está na posição mais à direita, corrigir
        if (visibleRange.to < lastCandleIndex) {
          const visibleBars = Math.round(visibleRange.to - visibleRange.from);
          const newFromIndex = Math.max(0, lastCandleIndex - visibleBars + 1);
          
          // Aplicar correção imediatamente
          timeScale.setVisibleLogicalRange({
            from: newFromIndex,
            to: lastCandleIndex
          });
          
          console.log('🎯 ZOOM FIX - Corrected right margin:', {
            originalFrom: visibleRange.from,
            originalTo: visibleRange.to,
            newFromIndex,
            lastCandleIndex,
            visibleBars
          });
        }
      }
    };

    // Adicionar listeners
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleScroll);
    
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
      // Apenas ajustar zoom inicial após resize, sem forçar posição
      setTimeout(setInitialZoom, 50);
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      clearTimeout(zoomTimeout);
      // remover listeners
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleScroll);
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
  }, [height, isDark, liquidationPrice, currentTimeframe, JSON.stringify(liquidationLines), JSON.stringify(takeProfitLines), JSON.stringify(linePriceData?.slice(-50)), JSON.stringify(effectiveCandleData?.slice(-200)), useApiData, hasMoreData, isLoadingMoreHistorical, loadMoreHistorical]);

  const hasAnyLine = (liquidationLines && liquidationLines.length > 0) || (typeof liquidationPrice === 'number' && liquidationPrice > 0);

  return (
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
              <Badge variant="secondary" className="text-xs">
                {currentTimeframe.toUpperCase()}
              </Badge>
            </div>
              
              {/* Informações OHLC */}
              {effectiveCandleData && effectiveCandleData.length > 0 && (
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex gap-2">
                    <span className="text-gray-500">O</span>
                    <span className="font-mono">{effectiveCandleData[effectiveCandleData.length - 1]?.open?.toFixed(2) || '--'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500">H</span>
                    <span className="font-mono">{effectiveCandleData[effectiveCandleData.length - 1]?.high?.toFixed(2) || '--'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500">L</span>
                    <span className="font-mono">{effectiveCandleData[effectiveCandleData.length - 1]?.low?.toFixed(2) || '--'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500">C</span>
                    <span className="font-mono">{effectiveCandleData[effectiveCandleData.length - 1]?.close?.toFixed(2) || '--'}</span>
                  </div>
                </div>
              )}
              
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
              
              {/* Timeframe buttons */}
              <div className="flex items-center gap-1">
                {timeframes.map((tf) => (
                  <Button
                    key={tf.value}
                    variant={currentTimeframe === tf.value ? "default" : "ghost"}
                    size="sm"
                    className={`h-7 px-2 text-xs ${
                      currentTimeframe === tf.value 
                        ? 'bg-blue-600 text-white' 
                        : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => handleTimeframeChange(tf.value)}
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>

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
        <div ref={containerRef} className="w-full rounded-lg overflow-hidden" style={{ height }} />
      </CardContent>
    </Card>
  );
};

export default LightweightLiquidationChart;


