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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Settings,
  Maximize2,
  Minimize2,
  BarChart3,
  Volume2,
  Calendar,
  Crosshair,
  Magnet,
  Ruler,
  Type,
  Shapes,
  Lock,
  Eye,
  Trash2,
  Undo2,
  Redo2,
  Plus,
  Minus
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { marketDataService, CandleData, MarketData } from '@/services/marketData.service';

interface LNMarketsChartProps {
  symbol?: string;
  height?: number;
  showControls?: boolean;
}

const LNMarketsChart: React.FC<LNMarketsChartProps> = ({ 
  symbol = 'BTCUSD: LNM Futures', 
  height = 500,
  showControls = true
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState('candlestick');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);

  // WebSocket para dados em tempo real
  const { connect, disconnect, sendMessage } = useWebSocket({
    url: `${import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`}/ws/market?symbol=${symbol}`,
    onMessage: (message) => {
      const newCandle = marketDataService.processWebSocketMessage(message);
      if (newCandle && seriesRef.current) {
        seriesRef.current.update(marketDataService.formatCandleData(newCandle));
        setCandles(prev => [...prev.slice(-99), newCandle]);
        setCurrentPrice(newCandle.close);
        setPriceChange(newCandle.close - newCandle.open);
        setPriceChangePercent(((newCandle.close - newCandle.open) / newCandle.open) * 100);
      }
    },
    onError: (error) => {
      console.error('❌ CHART - Erro WebSocket:', error);
      setIsConnected(false);
    },
    onOpen: () => {
      console.log('📊 CHART - WebSocket conectado para', symbol);
      setIsConnected(true);
    },
    onClose: () => {
      console.log('📊 CHART - WebSocket desconectado');
      setIsConnected(false);
    }
  });

  const initializeChart = () => {
    if (!chartContainerRef.current) return;

    // Limpar gráfico existente
    if (chartRef.current) {
      chartRef.current.remove();
    }

    // Obter cores do tema atual
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#ffffff' : '#000000';
    const borderColor = isDark ? '#374151' : '#e5e7eb';
    const backgroundColor = 'transparent';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    // Criar novo gráfico com configurações da LN Markets
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { color: backgroundColor },
        textColor: textColor,
        fontSize: 12,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
      grid: {
        vertLines: { 
          color: gridColor,
          style: 1, // Dotted lines
          visible: true
        },
        horzLines: { 
          color: gridColor,
          style: 1, // Dotted lines
          visible: true
        },
      },
      crosshair: {
        mode: 1, // Normal crosshair
        vertLine: {
          color: isDark ? '#6b7280' : '#9ca3af',
          width: 1,
          style: 2, // Dashed
          labelBackgroundColor: isDark ? '#374151' : '#f3f4f6',
        },
        horzLine: {
          color: isDark ? '#6b7280' : '#9ca3af',
          width: 1,
          style: 2, // Dashed
          labelBackgroundColor: isDark ? '#374151' : '#f3f4f6',
        },
      },
      rightPriceScale: {
        borderColor: borderColor,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        entireTextOnly: false,
        visible: true,
        ticksVisible: true,
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
        barSpacing: 6,
        minBarSpacing: 0.5,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
        shiftVisibleRangeOnNewBar: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Criar série de candlesticks com cores da LN Markets - API v5.0.9
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00d4aa', // Verde da LN Markets
      downColor: '#ff6b6b', // Vermelho da LN Markets
      borderDownColor: '#ff6b6b',
      borderUpColor: '#00d4aa',
      wickDownColor: '#ff6b6b',
      wickUpColor: '#00d4aa',
      borderVisible: false,
    });

    // Criar série de volume - API v5.0.9
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: isDark ? '#374151' : '#e5e7eb',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: 'volume',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // Configurar responsividade
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    // Listener para mudanças de tema
    const handleThemeChange = () => {
      if (chartRef.current) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const textColor = isDark ? '#ffffff' : '#000000';
        const borderColor = isDark ? '#374151' : '#e5e7eb';
        const gridColor = isDark ? '#374151' : '#e5e7eb';
        
        chartRef.current.applyOptions({
          layout: {
            background: { color: 'transparent' },
            textColor: textColor,
          },
          grid: {
            vertLines: { color: gridColor },
            horzLines: { color: gridColor },
          },
          rightPriceScale: {
            borderColor: borderColor,
          },
          timeScale: {
            borderColor: borderColor,
          },
        });
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('themechange', handleThemeChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('themechange', handleThemeChange);
    };
  };

  // Carregar dados iniciais
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [marketDataResult, historicalData] = await Promise.all([
        marketDataService.getMarketData(symbol),
        marketDataService.getHistoricalData(symbol, '1h', 100)
      ]);

      setMarketData(marketDataResult);
      setCandles(historicalData);

      if (seriesRef.current) {
        seriesRef.current.setData(historicalData.map(marketDataService.formatCandleData));
      }

      // Configurar volume
      if (volumeSeriesRef.current) {
        const volumeData = historicalData.map(candle => ({
          time: candle.time,
          value: candle.volume,
          color: candle.close >= candle.open ? '#00d4aa' : '#ff6b6b',
        }));
        volumeSeriesRef.current.setData(volumeData);
      }

      // Configurar preço atual
      if (historicalData.length > 0) {
        const lastCandle = historicalData[historicalData.length - 1];
        setCurrentPrice(lastCandle.close);
        setPriceChange(lastCandle.close - lastCandle.open);
        setPriceChangePercent(((lastCandle.close - lastCandle.open) / lastCandle.open) * 100);
      }
    } catch (error) {
      console.error('❌ CHART - Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      setIsConnecting(true);
      connect();
    }
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  useEffect(() => {
    const cleanup = initializeChart();
    loadInitialData();
    return cleanup;
  }, []);

  useEffect(() => {
    if (chartRef.current && candles.length > 0) {
      seriesRef.current?.setData(candles.map(marketDataService.formatCandleData));
    }
  }, [candles]);

  const stats = marketDataService.calculateStats(candles);

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      {/* Header igual ao da LN Markets */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-foreground">
            {symbol} - {timeframe} (Lightweight Charts v5.0.9)
          </h2>
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-muted-foreground">O{stats?.open?.toFixed(1) || '0'}</span>
            <span className="text-muted-foreground">H{stats?.high?.toFixed(1) || '0'}</span>
            <span className="text-muted-foreground">L{stats?.low?.toFixed(1) || '0'}</span>
            <span className="text-muted-foreground">C{currentPrice.toFixed(1)}</span>
            <span className={`font-medium ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)} ({priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        
        {showControls && (
          <div className="flex items-center gap-2">
            {/* Timeframe selector - igual ao da LN Markets */}
            <div className="flex items-center space-x-1">
              {['1m', '5m', '15m', '1h', '4h', '1d'].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    timeframe === tf 
                      ? 'bg-blue-600 text-white' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* fx Indicators button */}
            <button className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
              <BarChart3 className="h-4 w-4 inline mr-1" />
              fx Indicators
            </button>

            {/* Undo/Redo */}
            <div className="flex items-center space-x-1">
              <button className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
                <Undo2 className="h-4 w-4" />
              </button>
              <button className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
                <Redo2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Chart type tabs - igual ao da LN Markets */}
      <div className="flex items-center space-x-1 px-4 py-2 border-b bg-background">
        <button
          onClick={() => setChartType('candlestick')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            chartType === 'candlestick' 
              ? 'bg-blue-600 text-white' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Graph
        </button>
        <button
          onClick={() => setChartType('economic')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            chartType === 'economic' 
              ? 'bg-blue-600 text-white' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Economic Calendar
        </button>
        <button
          onClick={() => setChartType('volume')}
          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
            chartType === 'volume' 
              ? 'bg-blue-600 text-white' 
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          Volume Ladder
        </button>
      </div>

        {/* Chart container */}
        <div 
          ref={chartContainerRef} 
          className="w-full relative"
          style={{ height: `${height}px` }}
        />

      {/* Volume info - igual ao da LN Markets */}
      <div className="px-4 py-2 border-t bg-background">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Volume2 className="h-3 w-3" />
            Volume {stats?.volume?.toFixed(2) || '0'} M
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {isConnected ? 'Live Data' : 'Disconnected'}
            </div>
            <div className="text-right">
              {stats?.candleCount || 0} candles • 
              Avg: ${stats?.avgPrice?.toFixed(2) || '0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LNMarketsChart;
