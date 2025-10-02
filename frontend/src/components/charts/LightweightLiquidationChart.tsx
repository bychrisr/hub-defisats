import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, ISeriesApi, LineStyle, Time, IChartApi } from 'lightweight-charts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { useCandleData } from '@/hooks/useCandleData';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useIndicators, IndicatorType } from '@/hooks/useIndicators';
import { TimeframeSelector } from '@/components/ui/timeframe-selector';
import { TechnicalIndicatorsService, RSIConfig, RSIDataPoint } from '@/services/technicalIndicators.service';
import { RSIConfigComponent } from '@/components/ui/rsi-config';
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

type CandlestickPoint = { time: Time; open: number; high: number; low: number; close: number };
type LinePoint = { time: Time; value: number };

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
  const rsiContainerRef = useRef<HTMLDivElement | null>(null);
  const mainChartRef = useRef<IChartApi | null>(null);
  const rsiChartInstanceRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const overboughtSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const oversoldSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const isInitialLoad = useRef(true); // Controle de carregamento inicial
  const [currentTimeframe, setCurrentTimeframe] = useState(timeframe);
  const [showIndicators, setShowIndicators] = useState(false);
  
  // Estados para RSI
  const [rsiConfig, setRsiConfig] = useState<RSIConfig>({
    period: 14,
    overbought: 70,
    oversold: 30
  });
  const [rsiEnabled, setRsiEnabled] = useState(false);
  const [rsiData, setRsiData] = useState<RSIDataPoint[]>([]);

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
    if (indicator === 'rsi') {
      setRsiEnabled(!rsiEnabled);
      setShowIndicators(false);
      return;
    }
    
    addIndicator(indicator as IndicatorType);
    onIndicatorAdd?.(indicator);
    setShowIndicators(false);
  }, [addIndicator, onIndicatorAdd, rsiEnabled]);

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
        // rightOffset: 0, // ❌ Removido - não existe em LayoutOptions
        // fixRightEdge: true, // ❌ Removido - não existe em LayoutOptions
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
        timeVisible: false, // ✅ OCULTAR EIXO DE TEMPO DO GRÁFICO PRINCIPAL
        secondsVisible: false,
        // Configurações para eliminar espaço em branco
        fixLeftEdge: false, // Não fixar borda esquerda
        fixRightEdge: true, // Fixar borda direita
        
        // ✅ CORREÇÃO DO BUG: Eixo temporal hierárquico estilo LN Markets
        tickMarkFormatter: (time, tickMarkType) => {
          // ✅ CORREÇÃO CRÍTICA: Converter timestamp corretamente
          let timestamp: number;
          if (typeof time === 'number') {
            // Se time já é um número, verificar se é timestamp válido
            // Timestamps Unix válidos estão entre 1970 e 2100 (aproximadamente)
            if (time > 0 && time < 4102444800) { // 2100-01-01 em segundos
              timestamp = time;
            } else {
              // Se não for um timestamp válido, tratar como milissegundos
              timestamp = Math.floor(time / 1000);
            }
          } else {
            // Se time é um objeto BusinessDay, converter para timestamp
            timestamp = Date.UTC(time.year, time.month - 1, time.day) / 1000;
          }
          
          const date = new Date(timestamp * 1000);
          
          // ✅ VALIDAÇÃO: Verificar se a data é válida
          if (isNaN(date.getTime()) || date.getFullYear() < 1970 || date.getFullYear() > 2100) {
            console.warn('⚠️ TICK MARK DATE INVÁLIDA:', {
              time,
              timestamp,
              date: date.toISOString(),
              year: date.getFullYear()
            });
            // Fallback para data atual
            const fallbackHours = String(new Date().getHours()).padStart(2, '0');
            const fallbackMinutes = String(new Date().getMinutes()).padStart(2, '0');
            return `${fallbackHours}:${fallbackMinutes}`;
          }
          
          // ✅ DEBUG: Log para verificar os valores recebidos
          console.log('🔍 TICK MARK DEBUG:', {
            time,
            tickMarkType,
            timestamp,
            date: date.toISOString(),
            currentTimeframe,
            hour: date.getHours(),
            minute: date.getMinutes(),
            day: date.getDate(),
            month: date.getMonth() + 1
          });
          
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const day = String(date.getDate());
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });
          const year = date.getFullYear();
          
          // ✅ IMPLEMENTAÇÃO REVOLUCIONÁRIA: Hierarquia temporal baseada em densidade
          if (currentTimeframe && /m|h/i.test(currentTimeframe)) {
            // Para timeframes intraday (minutos/horas) - estilo LN Markets
            
            const hour = date.getHours();
            const minute = date.getMinutes();
            
            // ESTRATÉGIA: Usar uma abordagem baseada em densidade de dados
            // Calcular um "score" baseado no contexto temporal
            let temporalScore = 0;
            
            // Se for início de ano (1º de janeiro), prioridade máxima
            if (date.getMonth() === 0 && date.getDate() === 1) {
              return year.toString();
            }
            
            // Se for início de mês (dia 1), prioridade alta
            if (date.getDate() === 1) {
              return monthName;
            }
            
            // Calcular score baseado na hora do dia
            if (hour === 0) temporalScore += 100; // Meia-noite
            if (hour === 6) temporalScore += 80;  // Manhã
            if (hour === 12) temporalScore += 80; // Meio-dia
            if (hour === 18) temporalScore += 80; // Tarde
            if (hour === 21) temporalScore += 60; // Noite
            
            // Se for início de hora (minuto 0), aumentar score
            if (minute === 0) temporalScore += 20;
            
            // Se score for alto o suficiente, mostrar dia
            if (temporalScore >= 80) {
              return day;
            }
            
            // Se score for médio, mostrar dia + hora
            if (temporalScore >= 40) {
              return `${day} ${hours}:${minutes}`;
            }
            
            // Para outras horas, mostrar hora:minuto
            return `${hours}:${minutes}`;
          }
          
          // Para timeframes diários ou maiores
          if (currentTimeframe && /d|w/i.test(currentTimeframe)) {
            // Se for início de ano (1º de janeiro), mostrar ano
            if (date.getMonth() === 0 && date.getDate() === 1) {
              return year.toString();
            }
            
            // Se for início de mês (dia 1), mostrar mês
            if (date.getDate() === 1) {
              return monthName;
            }
            
            // Para outros dias, mostrar dia
            return day;
          }
          
          // Fallback para formatação padrão
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
      const sortedData = [...effectiveCandleData].sort((a, b) => (a.time as number) - (b.time as number));
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
          { time: (Math.floor(Date.now() / 1000) - 3600) as Time, value: anchor },
          { time: Math.floor(Date.now() / 1000) as Time, value: anchor }
        ]);
      } else {
        // Se nem anchor existe, ainda cria série vazia para permitir price lines (não exibirá nada)
        s.setData([{ time: Math.floor(Date.now() / 1000) as Time, value: 0 }]);
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
      
      indicatorSeriesInstance.setData(indicator.data.map(d => ({ ...d, time: d.time as Time })));
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
        // ❌ Removido - priceScale não tem setVisibleLogicalRange
        // if (Number.isFinite(min) && Number.isFinite(max) && min < max) {
        //   chart.priceScale('right').setVisibleLogicalRange({ from: min, to: max } as any);
        // }
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
      mainChartRef.current = null;
    };

    // ✅ ARMAZENAR REFERÊNCIA DO GRÁFICO PRINCIPAL
    mainChartRef.current = chart;
  }, [height, isDark, liquidationPrice, currentTimeframe, liquidationLines, takeProfitLines, linePriceData, useApiData, rsiEnabled]);

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

      // Converter dados do hook (time: number) para formato Lightweight Charts (time: Time)
      const convertedData = effectiveCandleData.map(item => ({
        ...item,
        time: item.time as Time
      }));
      
      // Remover duplicatas e ordenar por tempo (ascendente)
      const uniqueData = convertedData.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.time === current.time);
        if (existingIndex === -1) {
          acc.push(current);
        } else {
          // Se já existe, manter o mais recente (substituir)
          acc[existingIndex] = current;
        }
        return acc;
      }, [] as CandlestickPoint[]);
      
      const sortedData = uniqueData.sort((a, b) => (a.time as number) - (b.time as number));
      
      console.log(`🔄 CHART - Data deduplication: ${effectiveCandleData.length} -> ${uniqueData.length} unique points`);
      
      if (sortedData[0] && 'open' in sortedData[0]) {
        // Dados de candlestick
        (seriesRef.current as ISeriesApi<'Candlestick'>).setData(sortedData as CandlestickPoint[]);
        console.log('✅ DATA UPDATE - Candlestick data set:', sortedData.length);
      } else {
        // Dados de linha - converter CandlestickPoint para LinePoint usando close price
        const lineData = sortedData.map(item => ({
          time: item.time,
          value: item.close // Usar preço de fechamento como valor da linha
        })) as LinePoint[];
        (seriesRef.current as ISeriesApi<'Line'>).setData(lineData);
        console.log('✅ DATA UPDATE - Line data set:', lineData.length);
      }
      
      console.log('📊 DATA - Updated series data without resetting zoom:', {
        dataLength: sortedData.length,
        isInitialLoad: isInitialLoad.current
      });
    } catch (error) {
      console.warn('⚠️ DATA - Error updating series data:', error);
    }
  }, [effectiveCandleData]);

  // useEffect para calcular RSI quando dados ou configuração mudarem
  useEffect(() => {
    if (!rsiEnabled || !effectiveCandleData || effectiveCandleData.length === 0) {
      setRsiData([]);
      return;
    }

    try {
      // Converter dados para formato esperado pelo serviço
      const candleData = effectiveCandleData.map(item => ({
        time: item.time as number,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: 0 // Volume não é necessário para RSI
      }));

      // Calcular RSI
      const calculatedRSI = TechnicalIndicatorsService.calculateRSIExponential(candleData, rsiConfig);
      setRsiData(calculatedRSI);

      console.log('📊 RSI - Calculated:', {
        dataPoints: calculatedRSI.length,
        config: rsiConfig,
        latestValue: calculatedRSI[calculatedRSI.length - 1]?.value
      });
    } catch (error) {
      console.warn('⚠️ RSI - Error calculating RSI:', error);
      setRsiData([]);
    }
  }, [rsiEnabled, effectiveCandleData, rsiConfig]);

  // useEffect para criar gráfico do RSI como sub-gráfico
  useEffect(() => {
    if (!rsiEnabled || !rsiContainerRef.current) {
      if (rsiSeriesRef.current) {
        rsiSeriesRef.current = null;
      }
      return;
    }

    const rsiChart = createChart(rsiContainerRef.current, {
      height: 120, // Altura fixa para o RSI
      layout: {
        textColor: isDark ? '#d1d5db' : '#374151',
        background: { type: ColorType.Solid, color: 'transparent' },
        fontSize: 10,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      grid: {
        vertLines: { 
          color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          style: 0
        },
        horzLines: { 
          color: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          style: 0
        },
      },
      rightPriceScale: { 
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        textColor: isDark ? '#9ca3af' : '#6b7280',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        mode: 1, // PriceScaleMode.Percentage
      },
      timeScale: {
        borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        timeVisible: true, // Mostrar eixo de tempo para sincronização
        secondsVisible: false,
        fixRightEdge: true,
        // ✅ COMPARTILHAR MESMO FORMATO DE TIMESTAMP
        tickMarkFormatter: (time, tickMarkType) => {
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
          
          switch (tickMarkType) {
            case 0: // Year
              return year.toString();
            case 1: // Month
              return monthName;
            case 2: // DayOfMonth
              if (currentTimeframe && /m|h/i.test(currentTimeframe)) {
                if (date.getHours() === 0 && date.getMinutes() === 0) {
                  return day;
                }
                return '';
              }
              return day;
            case 3: // Time
              if (currentTimeframe && /m|h/i.test(currentTimeframe)) {
                return `${hours}:${minutes}`;
              }
              return '';
            case 4: // TimeWithSeconds
              return `${hours}:${minutes}:${String(date.getSeconds()).padStart(2, '0')}`;
            default:
              if (currentTimeframe && /m|h/i.test(currentTimeframe)) {
                return `${hours}:${minutes}`;
              }
              return `${day} • ${monthName}`;
          }
        }
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
        vertLine: {
          color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          width: 1,
          style: 0,
        },
        horzLine: {
          color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          width: 1,
          style: 0,
        },
      },
    });

    // Série principal do RSI
    const rsiSeries = rsiChart.addLineSeries({
      color: '#8b5cf6', // Cor roxa para RSI
      lineWidth: 2,
      priceFormat: {
        type: 'percent' as const,
        precision: 2,
        minMove: 0.01,
      },
    });
    rsiSeriesRef.current = rsiSeries;

    // Linhas de referência
    const overboughtSeries = rsiChart.addLineSeries({
      color: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.5)',
      lineWidth: 1,
      lineStyle: 2, // LineStyle.Dashed
      priceFormat: {
        type: 'percent' as const,
        precision: 0,
        minMove: 1,
      },
    });
    overboughtSeriesRef.current = overboughtSeries;

    const oversoldSeries = rsiChart.addLineSeries({
      color: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.5)',
      lineWidth: 1,
      lineStyle: 2, // LineStyle.Dashed
      priceFormat: {
        type: 'percent' as const,
        precision: 0,
        minMove: 1,
      },
    });
    oversoldSeriesRef.current = oversoldSeries;

    // Configurar dados das linhas de referência
    if (effectiveCandleData && effectiveCandleData.length > 0) {
      const firstTime = effectiveCandleData[0].time as Time;
      const lastTime = effectiveCandleData[effectiveCandleData.length - 1].time as Time;
      
      overboughtSeries.setData([
        { time: firstTime, value: rsiConfig.overbought },
        { time: lastTime, value: rsiConfig.overbought },
      ]);
      
      oversoldSeries.setData([
        { time: firstTime, value: rsiConfig.oversold },
        { time: lastTime, value: rsiConfig.oversold },
      ]);
    }

    // Atualizar dados do RSI quando disponíveis
    if (rsiData.length > 0) {
      const rsiChartData = rsiData.map(point => ({
        time: point.time as Time,
        value: point.value
      }));
      rsiSeries.setData(rsiChartData);
    }

    // ✅ ARMAZENAR REFERÊNCIA DO GRÁFICO RSI
    rsiChartInstanceRef.current = rsiChart;

    // ✅ SINCRONIZAR COM GRÁFICO PRINCIPAL
    if (mainChartRef.current) {
      console.log('🔄 SYNC - Configurando sincronização RSI:', {
        mainChart: !!mainChartRef.current,
        rsiChart: !!rsiChart,
        rsiEnabled
      });
      
      // Sincronização manual de zoom e pan
      mainChartRef.current.timeScale().subscribeVisibleTimeRangeChange((timeRange) => {
        if (timeRange) {
          console.log('🔄 SYNC - Sincronizando timeRange:', timeRange);
          rsiChart.timeScale().setVisibleRange(timeRange);
        }
      });
    } else {
      console.warn('⚠️ SYNC - Gráfico principal não disponível para sincronização');
    }

    return () => {
      rsiChart.remove();
      rsiSeriesRef.current = null;
      overboughtSeriesRef.current = null;
      oversoldSeriesRef.current = null;
      rsiChartInstanceRef.current = null;
    };
  }, [rsiEnabled, isDark, rsiConfig, currentTimeframe, effectiveCandleData]);

  // useEffect para atualizar dados do RSI no gráfico
  useEffect(() => {
    if (!rsiSeriesRef.current || !rsiData.length) return;

    const rsiChartData = rsiData.map(point => ({
      time: point.time as Time,
      value: point.value
    }));

    rsiSeriesRef.current.setData(rsiChartData);
  }, [rsiData]);

  // ✅ useEffect para sincronizar gráficos quando ambos estiverem disponíveis
  useEffect(() => {
    if (mainChartRef.current && rsiChartInstanceRef.current && rsiEnabled) {
      console.log('🔄 SYNC - Gráficos sincronizados:', {
        mainChart: !!mainChartRef.current,
        rsiChart: !!rsiChartInstanceRef.current,
        rsiEnabled
      });
    }
  }, [rsiEnabled]);

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
                        const isActive = indicator.id === 'rsi' && rsiEnabled;
                        return (
                          <button
                            key={indicator.id}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${
                              isActive
                                ? isDark 
                                  ? 'text-blue-400 bg-blue-900/20' 
                                  : 'text-blue-600 bg-blue-50'
                                : isDark 
                                  ? 'text-gray-300 hover:bg-gray-700' 
                                  : 'text-gray-700 hover:bg-gray-100'
                            }`}
                            onClick={() => handleIndicatorAdd(indicator.id)}
                          >
                            <IconComponent className="h-4 w-4" />
                            {indicator.name}
                            {isActive && <Badge variant="secondary" className="ml-auto text-xs">ON</Badge>}
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
        {/* Gráfico principal */}
        <div ref={containerRef} className="w-full rounded-lg overflow-hidden lightweight-chart-time-axis" style={{ height }} />
        
        {/* Sub-gráfico RSI - Entre o gráfico principal e o timestamp */}
        {rsiEnabled && (
          <div className="mt-1">
            {/* Header compacto do RSI */}
            <div className="flex items-center justify-between mb-1 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">RSI {rsiConfig.period}</span>
                <Badge variant="outline" className="text-xs">
                  {rsiData[rsiData.length - 1]?.value?.toFixed(2) || '0.00'}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRsiEnabled(false)}
                className="h-5 px-1 text-xs hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            {/* Container do gráfico RSI */}
            <div ref={rsiContainerRef} className="w-full rounded-lg overflow-hidden border border-border/30" style={{ height: 120 }} />
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
};

export default LightweightLiquidationChart;


