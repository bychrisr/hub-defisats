import React, { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  symbol?: string;
  height?: number;
  width?: string;
  className?: string;
}

const TradingViewWidget: React.FC<TradingViewWidgetProps> = ({
  symbol = 'BITSTAMP:BTCUSD',
  height = 500,
  width = '100%',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Limpar conteúdo anterior
    containerRef.current.innerHTML = '';

    // Criar script do TradingView
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: '1',
      timezone: 'UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      toolbar_bg: '#1e1e1e',
      enable_publishing: false,
      allow_symbol_change: true,
      container_id: 'tradingview_widget',
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      studies: [
        'Volume@tv-basicstudies',
        'RSI@tv-basicstudies',
        'MACD@tv-basicstudies'
      ],
      show_popup_button: true,
      popup_width: '1000',
      popup_height: '650',
      support_host: 'https://www.tradingview.com'
    });

    containerRef.current.appendChild(script);

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [symbol]);

  return (
    <div 
      className={`tradingview-widget-container ${className}`}
      style={{ width, height: `${height}px` }}
    >
      <div 
        ref={containerRef}
        id="tradingview_widget"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default TradingViewWidget;
