import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, ISeriesApi, LineStyle } from 'lightweight-charts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  BarChart3, 
  TrendingUp, 
  Settings, 
  Plus,
  ChevronDown,
  Activity,
  Target
} from 'lucide-react';

type CandlestickPoint = { time: number; open: number; high: number; low: number; close: number };
type LinePoint = { time: number; value: number };

interface LightweightLiquidationChartProps {
  symbol?: string;
  height?: number;
  className?: string;
  liquidationPrice?: number; // compat: uma linha
  liquidationLines?: Array<{ price: number; label?: string; color?: string }>; // múltiplas linhas
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
  candleData?: CandlestickPoint[];
}

const LightweightLiquidationChart: React.FC<LightweightLiquidationChartProps> = ({
  symbol = 'BINANCE:BTCUSDT',
  height = 220,
  className = '',
  liquidationPrice,
  liquidationLines,
  linePriceData,
  candleData,
  timeframe = '1h',
  showToolbar = true,
  onTimeframeChange,
  onIndicatorAdd,
  displaySymbol,
  symbolDescription,
  logoUrl
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null>(null);
  const [currentTimeframe, setCurrentTimeframe] = useState(timeframe);
  const [showIndicators, setShowIndicators] = useState(false);

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

  // Indicadores disponíveis
  const indicators = [
    { id: 'rsi', name: 'RSI', icon: Activity },
    { id: 'macd', name: 'MACD', icon: TrendingUp },
    { id: 'bollinger', name: 'Bollinger Bands', icon: Target }
  ];

  const handleTimeframeChange = useCallback((newTimeframe: string) => {
    setCurrentTimeframe(newTimeframe);
    onTimeframeChange?.(newTimeframe);
  }, [onTimeframeChange]);

  const handleIndicatorAdd = useCallback((indicator: string) => {
    onIndicatorAdd?.(indicator);
    setShowIndicators(false);
  }, [onIndicatorAdd]);

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
          
          // Formatação baseada no timeframe
          const hours = String(date.getUTCHours()).padStart(2, '0');
          const minutes = String(date.getUTCMinutes()).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          
          // Para timeframes intraday (minutos/horas)
          if (currentTimeframe && /m|h/i.test(currentTimeframe)) {
            // Se for meia-noite UTC, mostrar data completa
            if (date.getUTCHours() === 0 && date.getUTCMinutes() === 0) {
              return `${day}/${month} ${hours}:${minutes}`;
            }
            // Caso contrário, mostrar apenas hora:minuto
            return `${hours}:${minutes}`;
          }
          
          // Para timeframes diários ou maiores
          return `${day}/${month}`;
        }
      },
      crosshair: { mode: 1 },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    // Série principal (preferir candles, senão linha)
    if (candleData && candleData.length > 0) {
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
      s.setData(candleData as any);
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
    const lines = (liquidationLines && liquidationLines.length > 0)
      ? liquidationLines
      : (typeof liquidationPrice === 'number' && liquidationPrice > 0
          ? [{ price: liquidationPrice }]
          : []);

    for (const [idx, ln] of lines.entries()) {
      const price = Number(ln.price);
      if (!Number.isFinite(price) || price <= 0) continue;
      const color = ln.color || '#ff4444';
      const label = ln.label || `Liquidação${lines.length > 1 ? ` #${idx+1}` : ''}: $${price.toLocaleString()}`;
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

    // Fit content inicial
    chart.timeScale().fitContent();
    // Auto-range para incluir todas as priceLines
    try {
      const prices = lines.map(l => l.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      if (Number.isFinite(min) && Number.isFinite(max) && min < max) {
        chart.priceScale('right').setVisibleLogicalRange({ from: min, to: max } as any);
      }
    } catch {}

    // Resize
    const ro = new ResizeObserver(() => {
      if (!containerRef.current) return;
      chart.applyOptions({ width: containerRef.current.clientWidth, height });
      chart.timeScale().fitContent();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      // remover priceLines criadas
      if (seriesRef.current && createdLines.length) {
        for (const l of createdLines) {
          try { (seriesRef.current as any).removePriceLine(l); } catch {}
        }
      }
      chart.remove();
    };
  }, [height, isDark, liquidationPrice, currentTimeframe, JSON.stringify(liquidationLines), JSON.stringify(linePriceData?.slice(-50)), JSON.stringify(candleData?.slice(-200))]);

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
              {candleData && candleData.length > 0 && (
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex gap-2">
                    <span className="text-gray-500">O</span>
                    <span className="font-mono">{candleData[candleData.length - 1]?.open?.toFixed(2) || '--'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500">H</span>
                    <span className="font-mono">{candleData[candleData.length - 1]?.high?.toFixed(2) || '--'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500">L</span>
                    <span className="font-mono">{candleData[candleData.length - 1]?.low?.toFixed(2) || '--'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500">C</span>
                    <span className="font-mono">{candleData[candleData.length - 1]?.close?.toFixed(2) || '--'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Lado direito: Controles */}
            <div className="flex items-center gap-2">
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
                      {indicators.map((indicator) => {
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


