import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Camera, 
  Maximize2, 
  Settings,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface LNMarketsStyleChartProps {
  height?: number;
  className?: string;
}

const LNMarketsStyleChart: React.FC<LNMarketsStyleChartProps> = ({
  height = 600,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(115820);
  const [priceChange, setPriceChange] = useState(753.5);
  const [priceChangePercent, setPriceChangePercent] = useState(0.67);
  const [ohlcData, setOhlcData] = useState({
    open: 111755.0,
    high: 112559.5,
    low: 111728.5,
    close: 112507.0
  });
  const [volume, setVolume] = useState(183.64);

  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoading(true);

    // Limpar conteúdo anterior
    containerRef.current.innerHTML = '';

    // Configuração específica para replicar exatamente a interface da LN Markets
    const widgetConfig = {
      autosize: true,
      symbol: 'BITSTAMP:BTCUSD',
      interval: '60', // 1h como padrão
      timezone: 'UTC',
      theme: 'dark',
      style: '1', // Candlestick
      locale: 'en',
      toolbar_bg: '#1e1e1e',
      enable_publishing: false,
      allow_symbol_change: false,
      container_id: 'lnmarkets_tradingview_widget',
      hide_side_toolbar: true, // Ocultar barra lateral
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: true,
      // Apenas Volume (como na LN Markets)
      studies: [
        'Volume@tv-basicstudies'
      ],
      // Cores exatas da LN Markets
      colorTheme: 'dark',
      gridColor: '#2a2e39',
      upColor: '#00d4aa',
      downColor: '#ff6b6b',
      borderUpColor: '#00d4aa',
      borderDownColor: '#ff6b6b',
      wickUpColor: '#00d4aa',
      wickDownColor: '#ff6b6b',
      volume_up_color: '#00d4aa',
      volume_down_color: '#ff6b6b',
      crosshair: '1',
      show_popup_button: true,
      popup_width: '1400',
      popup_height: '900',
      support_host: 'https://www.tradingview.com',
      // Configurações específicas para LN Markets
      symbol_info: {
        name: 'Bitcoin',
        description: 'BTCUSD: LNM Futures',
        type: 'crypto',
        session: '24x7',
        timezone: 'UTC',
        ticker: 'BTCUSD',
        exchange: 'BITSTAMP'
      }
    };

    // Criar script do TradingView
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify(widgetConfig);

    // Adicionar event listeners
    script.onload = () => {
      setIsLoading(false);
      setHasError(false);
      console.log('✅ LN Markets Style Chart loaded successfully');
    };

    script.onerror = () => {
      setIsLoading(false);
      setHasError(true);
      console.error('❌ Failed to load LN Markets Style Chart');
    };

    containerRef.current.appendChild(script);

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // Simular atualizações de preço (em produção, viria do WebSocket)
  useEffect(() => {
    const interval = setInterval(() => {
      const change = (Math.random() - 0.5) * 100;
      setCurrentPrice(prev => prev + change);
      setPriceChange(change);
      setPriceChangePercent((change / currentPrice) * 100);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  if (hasError) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 mx-auto">
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar gráfico</h3>
            <p className="text-muted-foreground mb-4">
              Não foi possível carregar o gráfico da TradingView.
            </p>
            <Button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Tentar Novamente
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-0 overflow-hidden ${className}`}>
      {/* Header da LN Markets */}
      <div className="bg-[#1e1e1e] border-b border-[#2a2e39] p-4">
        <div className="flex items-center justify-between">
          {/* Timeframe Selector */}
          <div className="flex items-center gap-2">
            <div className="flex bg-[#2a2e39] rounded-md p-1">
              <button className="px-3 py-1 text-xs bg-[#00d4aa] text-black rounded-sm font-medium">
                1h
              </button>
              <button className="px-3 py-1 text-xs text-gray-400 hover:text-white">
                1m
              </button>
              <button className="px-3 py-1 text-xs text-gray-400 hover:text-white">
                5m
              </button>
              <button className="px-3 py-1 text-xs text-gray-400 hover:text-white">
                15m
              </button>
              <button className="px-3 py-1 text-xs text-gray-400 hover:text-white">
                30m
              </button>
              <button className="px-3 py-1 text-xs text-gray-400 hover:text-white">
                4h
              </button>
              <button className="px-3 py-1 text-xs text-gray-400 hover:text-white">
                1d
              </button>
              <button className="px-3 py-1 text-xs text-gray-400 hover:text-white">
                1w
              </button>
              <button className="px-3 py-1 text-xs text-gray-400 hover:text-white">
                1M
              </button>
            </div>
            
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Symbol and OHLC Data */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-sm text-gray-400">BTCUSD: LNM Futures</div>
              <div className="text-xs text-gray-500">
                O{ohlcData.open.toLocaleString()} H{ohlcData.high.toLocaleString()} L{ohlcData.low.toLocaleString()} C{ohlcData.close.toLocaleString()}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {priceChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-[#00d4aa]" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-[#ff6b6b]" />
                )}
                <span className={priceChange >= 0 ? 'text-[#00d4aa]' : 'text-[#ff6b6b]'}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(1)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Volume {volume} M
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="flex bg-[#2a2e39] rounded-md p-1">
              <button className="px-3 py-1 text-xs bg-[#00d4aa] text-black rounded-sm font-medium">
                Graph
              </button>
              <button className="px-3 py-1 text-xs text-gray-400 hover:text-white">
                Economic Calendar
              </button>
              <button className="px-3 py-1 text-xs text-gray-400 hover:text-white">
                Volume Ladder
              </button>
            </div>
            
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Camera className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      {isLoading && (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00d4aa] mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando gráfico TradingView...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef}
        id="lnmarkets_tradingview_widget"
        style={{ 
          width: '100%', 
          height: `${height - 80}px`, // Subtrair altura do header
          minHeight: '400px'
        }}
      />

      {/* Footer da LN Markets */}
      <div className="bg-[#1e1e1e] border-t border-[#2a2e39] p-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span>5y</span>
            <span>1y</span>
            <span>6m</span>
            <span>3m</span>
            <span>1m</span>
            <span>5d</span>
            <span className="text-[#00d4aa] font-medium">1d</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Charts provided by TradingView</span>
            <span>{new Date().toLocaleTimeString('en-US', { timeZone: 'UTC' })} UTC</span>
            <span>% log auto</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LNMarketsStyleChart;
