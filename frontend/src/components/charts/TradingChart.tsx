import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { marketDataService, CandleData, MarketData } from '@/services/marketData.service';

interface TradingChartProps {
  symbol?: string;
  height?: number;
}

const TradingChart: React.FC<TradingChartProps> = ({ 
  symbol = 'BTC/USD', 
  height = 400 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // WebSocket para dados em tempo real
  const { isConnected, isConnecting, error, connect, disconnect, sendMessage } = useWebSocket({
    url: `ws://localhost:3001/ws/market?symbol=${symbol}`,
    onMessage: (message) => {
      const newCandle = marketDataService.processWebSocketMessage(message);
      if (newCandle && seriesRef.current) {
        seriesRef.current.update(marketDataService.formatCandleData(newCandle));
        setCandles(prev => [...prev.slice(-99), newCandle]); // Manter últimos 100 candles
      }
    },
    onError: (error) => {
      console.error('❌ CHART - Erro WebSocket:', error);
    },
    onOpen: () => {
      console.log('📊 CHART - WebSocket conectado para', symbol);
    },
    onClose: () => {
      console.log('📊 CHART - WebSocket desconectado');
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

    // Criar novo gráfico
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: { color: backgroundColor },
        textColor: textColor,
      },
      grid: {
        vertLines: { color: borderColor },
        horzLines: { color: borderColor },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: borderColor,
      },
      timeScale: {
        borderColor: borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Criar série de candlesticks
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: isDark ? '#10b981' : '#059669', // Verde para alta
      downColor: isDark ? '#ef4444' : '#dc2626', // Vermelho para baixa
      borderDownColor: isDark ? '#ef4444' : '#dc2626',
      borderUpColor: isDark ? '#10b981' : '#059669',
      wickDownColor: isDark ? '#ef4444' : '#dc2626',
      wickUpColor: isDark ? '#10b981' : '#059669',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Carregar dados iniciais será feito em loadInitialData

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
        
        chartRef.current.applyOptions({
          layout: {
            background: { color: 'transparent' },
            textColor: textColor,
          },
          grid: {
            vertLines: { color: borderColor },
            horzLines: { color: borderColor },
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
        marketDataService.getHistoricalData(symbol, '1m', 100)
      ]);

      setMarketData(marketDataResult);
      setCandles(historicalData);

      if (seriesRef.current) {
        seriesRef.current.setData(historicalData.map(marketDataService.formatCandleData));
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
      connect();
    }
  };

  const refreshData = async () => {
    await loadInitialData();
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
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {symbol} - Gráfico de Preços
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleConnection}
            disabled={isConnecting}
            className="flex items-center gap-2"
          >
            {isConnected ? (
              <>
                <Pause className="h-4 w-4" />
                Desconectar
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                {isConnecting ? 'Conectando...' : 'Conectar'}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Informações de preço */}
          {marketData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">
                  ${marketData.price.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
                <div className={`text-sm flex items-center gap-1 ${
                  marketData.changePercent24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {marketData.changePercent24h >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {marketData.changePercent24h.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">24h High</div>
                <div className="font-semibold">${marketData.high24h.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">24h Low</div>
                <div className="font-semibold">${marketData.low24h.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">24h Volume</div>
                <div className="font-semibold">${marketData.volume24h.toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Gráfico */}
          <div 
            ref={chartContainerRef} 
            className="w-full"
            style={{ height: `${height}px` }}
          />

          {/* Status da conexão */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {isConnected ? 'Conectado' : 'Desconectado'} - 
              Dados em tempo real via WebSocket
            </div>
            {stats && (
              <div className="text-right">
                {stats.candleCount} candles • 
                Média: ${stats.avgPrice.toFixed(2)}
              </div>
            )}
          </div>

          {/* Erro */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
              Erro: {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingChart;