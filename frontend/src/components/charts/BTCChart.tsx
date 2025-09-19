import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts';

interface BTCChartProps {
  className?: string;
  height?: number;
}

interface CandlestickDataPoint {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

export const BTCChart: React.FC<BTCChartProps> = ({ 
  className = '', 
  height = 400 
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dados de exemplo do BTC (você pode substituir por dados reais da API)
  const generateSampleData = (): CandlestickDataPoint[] => {
    const data: CandlestickDataPoint[] = [];
    const now = new Date();
    const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 dias atrás
    
    let currentPrice = 110000; // Preço inicial
    
    for (let i = 0; i < 168; i++) { // 168 horas = 7 dias
      const time = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      
      // Simular movimento de preço
      const change = (Math.random() - 0.5) * 2000; // Mudança aleatória de até ±1000
      const open = currentPrice;
      const close = currentPrice + change;
      const high = Math.max(open, close) + Math.random() * 500;
      const low = Math.min(open, close) - Math.random() * 500;
      
      data.push({
        time: Math.floor(time.getTime() / 1000) as Time,
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
      });
      
      currentPrice = close;
    }
    
    return data;
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Criar o gráfico
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: '#1e1e1e' },
        textColor: '#d1d4dc',
      },
      width: chartContainerRef.current.clientWidth,
      height: height,
      grid: {
        vertLines: { color: '#2B2B43' },
        horzLines: { color: '#2B2B43' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#485158',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: '#485158',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Criar série de candlesticks
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    // Carregar dados
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Aqui você pode fazer uma chamada para sua API para obter dados reais
        // const response = await fetch('/api/btc-candles?timeframe=1h');
        // const realData = await response.json();
        
        // Por enquanto, usar dados de exemplo
        const sampleData = generateSampleData();
        candlestickSeries.setData(sampleData);
        
        // Ajustar o gráfico para mostrar todos os dados
        chart.timeScale().fitContent();
        
        setIsLoading(false);
      } catch (err) {
        setError('Erro ao carregar dados do gráfico');
        setIsLoading(false);
      }
    };

    loadData();

    // Função para redimensionar o gráfico
    const handleResize = () => {
      if (chartContainerRef.current && chart) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart) {
        chart.remove();
      }
    };
  }, [height]);

  return (
    <div className={`relative ${className}`}>
      {/* Header do gráfico */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-vibrant">BTCUSD: LNM Futures</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-vibrant-secondary">1h</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="text-right">
            <div className="text-vibrant font-semibold">117,003.0</div>
            <div className="text-red-500">-11.5 (-0.01%)</div>
          </div>
          <div className="text-vibrant-secondary">
            <div>O 117,014.5</div>
            <div>H 117,021.5</div>
            <div>L 116,910.0</div>
            <div>C 117,003.0</div>
          </div>
        </div>
      </div>

      {/* Container do gráfico */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="text-vibrant-secondary">Carregando gráfico...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10">
            <div className="text-center">
              <div className="text-red-500 mb-2">⚠️</div>
              <div className="text-vibrant-secondary">{error}</div>
            </div>
          </div>
        )}
        
        <div 
          ref={chartContainerRef} 
          className="w-full"
          style={{ height: `${height}px` }}
        />
      </div>

      {/* Footer com informações adicionais */}
      <div className="flex items-center justify-between p-3 border-t border-border bg-card/50">
        <div className="flex items-center space-x-4 text-sm text-vibrant-secondary">
          <span>Volume: 8.51 M</span>
          <span>•</span>
          <span>05:14:08 UTC</span>
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 text-xs border border-border rounded hover:bg-card/50 transition-colors">
            5y
          </button>
          <button className="px-3 py-1 text-xs border border-border rounded hover:bg-card/50 transition-colors">
            1y
          </button>
          <button className="px-3 py-1 text-xs border border-border rounded hover:bg-card/50 transition-colors">
            6m
          </button>
          <button className="px-3 py-1 text-xs border border-border rounded hover:bg-card/50 transition-colors">
            3m
          </button>
          <button className="px-3 py-1 text-xs border border-border rounded hover:bg-card/50 transition-colors">
            1m
          </button>
          <button className="px-3 py-1 text-xs border border-border rounded hover:bg-card/50 transition-colors">
            5d
          </button>
          <button className="px-3 py-1 text-xs border border-border rounded hover:bg-card/50 transition-colors bg-primary text-white">
            1d
          </button>
        </div>
      </div>
    </div>
  );
};

export default BTCChart;
