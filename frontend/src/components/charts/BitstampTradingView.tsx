import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import TradingViewFallback from './TradingViewFallback';

interface BitstampTradingViewProps {
  height?: number;
  className?: string;
}

const BitstampTradingView: React.FC<BitstampTradingViewProps> = ({
  height = 600,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoading(true);

    // Limpar conteúdo anterior
    containerRef.current.innerHTML = '';

    // Configuração específica para Bitcoin da Bitstamp
    const widgetConfig = {
      autosize: true,
      symbol: 'BITSTAMP:BTCUSD',
      interval: '1',
      timezone: 'UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#1e1e1e',
      enable_publishing: false,
      allow_symbol_change: true,
      container_id: 'bitstamp_tradingview_widget',
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      // Indicadores técnicos específicos para Bitcoin
      studies: [
        'Volume@tv-basicstudies',
        'RSI@tv-basicstudies',
        'MACD@tv-basicstudies',
        'MA@tv-basicstudies',
        'BB@tv-basicstudies'
      ],
      // Configurações de cores para tema escuro
      colorTheme: 'dark',
      gridColor: '#2a2e39',
      upColor: '#00d4aa',
      downColor: '#ff6b6b',
      borderUpColor: '#00d4aa',
      borderDownColor: '#ff6b6b',
      wickUpColor: '#00d4aa',
      wickDownColor: '#ff6b6b',
      // Configurações de volume
      volume_up_color: '#00d4aa',
      volume_down_color: '#ff6b6b',
      // Configurações de crosshair
      crosshair: '1',
      // Configurações de popup
      show_popup_button: true,
      popup_width: '1200',
      popup_height: '800',
      support_host: 'https://www.tradingview.com',
      // Configurações específicas para Bitcoin
      symbol_info: {
        name: 'Bitcoin',
        description: 'Bitcoin/USD - Bitstamp',
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
      console.log('✅ TradingView Widget loaded successfully');
    };

    script.onerror = () => {
      setIsLoading(false);
      setHasError(true);
      console.error('❌ Failed to load TradingView Widget');
    };

    containerRef.current.appendChild(script);

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  // Se houver erro, mostrar fallback
  if (hasError) {
    return (
      <TradingViewFallback
        symbol="BITSTAMP:BTCUSD"
        height={height}
        className={className}
        onRetry={() => {
          setHasError(false);
          setIsLoading(true);
          // Recarregar o componente
          window.location.reload();
        }}
      />
    );
  }

  return (
    <Card className={`p-0 overflow-hidden ${className}`}>
      {isLoading && (
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando gráfico TradingView...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef}
        id="bitstamp_tradingview_widget"
        style={{ 
          width: '100%', 
          height: `${height}px`,
          minHeight: '400px'
        }}
      />
    </Card>
  );
};

export default BitstampTradingView;
