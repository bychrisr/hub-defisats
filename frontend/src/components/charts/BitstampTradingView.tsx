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

    // Configuração específica para replicar a interface da LN Markets
    const widgetConfig = {
      autosize: true,
      symbol: 'BITSTAMP:BTCUSD',
      interval: '60', // 1h como padrão (igual à LN Markets)
      timezone: 'UTC',
      theme: 'dark',
      style: '1', // Candlestick
      locale: 'en',
      toolbar_bg: '#1e1e1e', // Background escuro igual à LN Markets
      enable_publishing: false,
      allow_symbol_change: false, // Desabilitar mudança de símbolo
      container_id: 'bitstamp_tradingview_widget',
      hide_side_toolbar: true, // Ocultar barra lateral (não tem na LN Markets)
      hide_top_toolbar: false, // Manter barra superior
      hide_legend: false,
      save_image: true, // Permitir salvar imagem
      // Apenas indicador de Volume (como na LN Markets)
      studies: [
        'Volume@tv-basicstudies'
      ],
      // Configurações de cores idênticas à LN Markets
      colorTheme: 'dark',
      gridColor: '#2a2e39', // Grid pontilhado escuro
      upColor: '#00d4aa', // Verde brilhante para alta
      downColor: '#ff6b6b', // Vermelho brilhante para baixa
      borderUpColor: '#00d4aa',
      borderDownColor: '#ff6b6b',
      wickUpColor: '#00d4aa',
      wickDownColor: '#ff6b6b',
      // Configurações de volume (idênticas à LN Markets)
      volume_up_color: '#00d4aa',
      volume_down_color: '#ff6b6b',
      // Configurações de crosshair
      crosshair: '1',
      // Configurações de popup
      show_popup_button: true,
      popup_width: '1400',
      popup_height: '900',
      support_host: 'https://www.tradingview.com',
      // Configurações específicas para replicar LN Markets
      symbol_info: {
        name: 'Bitcoin',
        description: 'BTCUSD: LNM Futures',
        type: 'crypto',
        session: '24x7',
        timezone: 'UTC',
        ticker: 'BTCUSD',
        exchange: 'BITSTAMP'
      },
      // Configurações adicionais para replicar LN Markets
      hide_volume: false, // Mostrar volume
      volume_ma: 'SMA', // Média móvel do volume
      volume_ma_length: 20,
      // Configurações de timeframe (igual à LN Markets)
      timeframe: '1h',
      // Configurações de layout
      layout: {
        background: '#1e1e1e',
        textColor: '#ffffff'
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
