import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Settings,
  Maximize2,
  BarChart3,
  Volume2,
  Calendar,
  Crosshair,
  Ruler,
  Type,
  Shapes,
  Lock,
  Eye,
  Trash2,
  Undo2,
  Redo2,
  Plus,
  Minus,
  Save,
  Search,
  Layout,
  Camera,
  Fullscreen
} from 'lucide-react';
import { useBtcPrice } from '@/hooks/useBtcPrice';

interface TradingViewChartProps {
  symbol?: string;
  height?: number;
  className?: string;
}

interface WebSocketMessage {
  type: 'market_data' | 'error' | 'disconnected';
  data?: {
    symbol: string;
    price: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timestamp: number;
  };
  message?: string;
  timestamp: number;
}

const TradingViewChart: React.FC<TradingViewChartProps> = ({ 
  symbol = 'BTCUSD: LNM Futures', 
  height = 500,
  className = ''
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { data: btcPrice, loading: btcLoading, refetch: refetchBtc } = useBtcPrice();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [timeframe, setTimeframe] = useState('1h');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(115935.5);
  const [priceChange, setPriceChange] = useState(-407.0);
  const [priceChangePercent, setPriceChangePercent] = useState(-0.36);
  const [ohlcData, setOhlcData] = useState({
    open: 112034.5,
    high: 112062.0,
    low: 111431.5,
    close: 111628.5
  });
  const [volume, setVolume] = useState(184.75);
  const [currentVolume, setCurrentVolume] = useState(1.95);
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);

  // WebSocket para dados em tempo real
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = `${import.meta.env.VITE_WS_URL || 'wss://defisats.site/ws'}/api/ws/market?symbol=${symbol}`;
      console.log('🔌 TRADING VIEW - Connecting to WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('✅ TRADING VIEW - WebSocket connected');
        setIsConnected(true);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 TRADING VIEW - WebSocket message:', message);
          
          if (message.type === 'market_data' && message.data) {
            handleRealTimeUpdate(message.data);
          } else if (message.type === 'error') {
            console.error('❌ TRADING VIEW - WebSocket error:', message.message);
          } else if (message.type === 'disconnected') {
            console.log('🔌 TRADING VIEW - WebSocket disconnected:', message.message);
            setIsConnected(false);
          }
        } catch (error) {
          console.error('❌ TRADING VIEW - Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('🔌 TRADING VIEW - WebSocket closed');
        setIsConnected(false);
        // Tentar reconectar após 5 segundos
        setTimeout(connectWebSocket, 5000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('❌ TRADING VIEW - WebSocket error:', error);
        setIsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol]);

  // Processar atualizações em tempo real
  const handleRealTimeUpdate = (data: WebSocketMessage['data']) => {
    if (!data) return;

    const newCandle: CandlestickData = {
      time: (data.timestamp / 1000) as Time,
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close,
    };

    // Atualizar dados atuais
    setCurrentPrice(data.price);
    setPriceChange(data.close - data.open);
    setPriceChangePercent(((data.close - data.open) / data.open) * 100);
    setOhlcData({
      open: data.open,
      high: data.high,
      low: data.low,
      close: data.close
    });
    setCurrentVolume(data.volume / 1000000); // Converter para milhões

    // Atualizar série de candlesticks
    if (seriesRef.current) {
      seriesRef.current.update(newCandle);
    }

    // Atualizar série de volume
    if (volumeSeriesRef.current) {
      const volumeData = {
        time: newCandle.time,
        value: data.volume,
        color: data.close >= data.open ? '#00d4aa' : '#ff6b6b',
      };
      volumeSeriesRef.current.update(volumeData);
    }

    // Manter histórico de dados
    setCandlestickData(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(candle => candle.time === newCandle.time);
      
      if (existingIndex >= 0) {
        updated[existingIndex] = newCandle;
      } else {
        updated.push(newCandle);
        // Manter apenas os últimos 200 candles
        if (updated.length > 200) {
          updated.shift();
        }
      }
      
      return updated;
    });
  };

  // Gerar dados de candlesticks realistas
  const generateCandlestickData = (): CandlestickData[] => {
    const data: CandlestickData[] = [];
    const now = Date.now();
    let price = 110000; // Preço inicial baseado na imagem

    for (let i = 200; i >= 0; i--) {
      const time = (now - i * 60 * 60 * 1000) / 1000; // 1 hora atrás
      
      // Variação mais realista para evitar candles muito finos
      const trend = Math.sin(i / 50) * 0.01; // Tendência suave
      const volatility = 0.005; // 0.5% volatilidade
      const randomChange = (Math.random() - 0.5) * volatility;
      
      price *= (1 + trend + randomChange);
      
      // Garantir que os candles tenham corpo substancial
      const bodySize = price * 0.002; // 0.2% do preço como tamanho mínimo do corpo
      const open = price;
      const close = price + (Math.random() - 0.5) * bodySize * 2; // Variação do corpo
      
      // Wicks mais realistas
      const wickSize = bodySize * 0.5; // Wicks menores que o corpo
      const high = Math.max(open, close) + Math.random() * wickSize;
      const low = Math.min(open, close) - Math.random() * wickSize;
      
      const vol = Math.random() * 2 + 0.5; // Volume entre 0.5M e 2.5M

      data.push({
        time: time as Time,
        open: Math.max(0, open),
        high: Math.max(0, high),
        low: Math.max(0, low),
        close: Math.max(0, close),
      });

      // Atualizar dados atuais com o último candle
      if (i === 0) {
        setCurrentPrice(close);
        setPriceChange(close - open);
        setPriceChangePercent(((close - open) / open) * 100);
        setOhlcData({ open, high, low, close });
        setCurrentVolume(vol);
      }
    }

    return data;
  };

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
    const backgroundColor = isDark ? '#1a1a1a' : '#ffffff';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    // Criar gráfico com estilo TradingView
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
        barSpacing: 6, // Aumentar espaçamento entre candles
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
        shiftVisibleRangeOnNewBar: true,
      },
      watermark: {
        color: 'rgba(0, 0, 0, 0)',
        visible: false,
      },
    });

    // Adicionar série de candlesticks
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#00d4aa',
      downColor: '#ff6b6b',
      borderUpColor: '#00d4aa',
      borderDownColor: '#ff6b6b',
      wickUpColor: '#00d4aa',
      wickDownColor: '#ff6b6b',
      // Melhorar exibição dos candles
      priceFormat: {
        type: 'price',
        precision: 2,
        minMove: 0.01,
      },
    });

    // Adicionar série de volume (reduzir tamanho)
    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.9, // Reduzir espaço do volume
        bottom: 0,
      },
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;
    volumeSeriesRef.current = volumeSeries;

    // Carregar dados
    const candlestickData = generateCandlestickData();
    candlestickSeries.setData(candlestickData);

    // Dados de volume (reduzir tamanho)
    const volumeData = candlestickData.map((candle, index) => ({
      time: candle.time,
      value: (Math.random() * 0.5 + 0.2) * 0.1, // Volume menor
      color: candle.close >= candle.open ? '#00d4aa' : '#ff6b6b',
    }));
    volumeSeries.setData(volumeData);

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
        const backgroundColor = isDark ? '#1a1a1a' : '#ffffff';
        const gridColor = isDark ? '#374151' : '#e5e7eb';
        
        chartRef.current.applyOptions({
          layout: {
            background: { color: backgroundColor },
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

  useEffect(() => {
    const cleanup = initializeChart();
    return cleanup;
  }, []);

  const timeframes = ['5y', '1y', '6m', '3m', '1m', '5d', '1d'];
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    timeZone: 'UTC', 
    hour12: false 
  });

  return (
    <div className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''} ${className}`}>
      <Card className="overflow-hidden">
        {/* Header - Estilo TradingView */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-muted-foreground">{timeframe}</span>
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <BarChart3 className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <TrendingUp className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-foreground">{symbol}</h2>
              <div className="flex items-center space-x-3 text-sm">
                <span className="text-muted-foreground">O{ohlcData.open.toFixed(1)}</span>
                <span className="text-muted-foreground">H{ohlcData.high.toFixed(1)}</span>
                <span className="text-muted-foreground">L{ohlcData.low.toFixed(1)}</span>
                <span className="text-muted-foreground">C{ohlcData.close.toFixed(1)}</span>
                <span className={`font-medium ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)} ({priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 px-3">
              <BarChart3 className="h-4 w-4 mr-1" />
              fx Indicators
            </Button>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="h-8 px-3">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Layout className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Camera className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? <Minus className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        <div className="flex">
          {/* Left Sidebar - Drawing Tools */}
          <div className="w-12 bg-background border-r flex flex-col items-center py-2 space-y-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-primary/10">
              <Crosshair className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <TrendingUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Ruler className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Type className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Shapes className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Minus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Lock className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Main Chart */}
          <div className="flex-1">
            <div ref={chartContainerRef} className="w-full" style={{ height: `${height}px` }} />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t bg-background">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <span className="text-xs text-muted-foreground">TV</span>
            </div>
            <div className="flex items-center space-x-1">
              {timeframes.map((tf) => (
                <Button
                  key={tf}
                  variant={timeframe === tf ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeframe(tf)}
                  className="h-6 px-2 text-xs"
                >
                  {tf}
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Calendar className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-3 w-3" />
              <span>Volume {volume} M</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>{currentTime} UTC</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>{currentVolume} M</span>
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                %
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                log
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                auto
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TradingViewChart;
