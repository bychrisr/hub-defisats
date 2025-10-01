import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface TradingViewChartProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  height?: number;
  width?: string;
  className?: string;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol = 'BINANCE:BTCUSDT',
  interval = '60',
  theme = 'dark',
  height = 500,
  width = '100%',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Carregar script TradingView
  useEffect(() => {
    const loadTradingViewScript = () => {
      console.log('🔄 TRADINGVIEW - Iniciando carregamento do script...');
      console.log('🔄 TRADINGVIEW - window.TradingView existe?', !!window.TradingView);
      
      if (window.TradingView) {
        console.log('✅ TRADINGVIEW - TradingView já carregado');
        setIsScriptLoaded(true);
        return;
      }

      console.log('🔄 TRADINGVIEW - Criando script...');
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ TRADINGVIEW - Script carregado com sucesso');
        console.log('🔄 TRADINGVIEW - window.TradingView após carregamento:', !!window.TradingView);
        console.log('🔄 TRADINGVIEW - window.TradingView.widget:', !!window.TradingView?.widget);
        setIsScriptLoaded(true);
      };
      
      script.onerror = (error) => {
        console.error('❌ TRADINGVIEW - Erro ao carregar script:', error);
        console.error('❌ TRADINGVIEW - URL do script:', script.src);
        setError('Erro ao carregar script TradingView');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
      console.log('✅ TRADINGVIEW - Script adicionado ao document.head');
    };

    loadTradingViewScript();
  }, []);

  // Inicializar widget quando script estiver carregado
  useEffect(() => {
    console.log('🔄 TRADINGVIEW - useEffect de inicialização do widget disparado');
    console.log('🔄 TRADINGVIEW - Estado atual:', {
      isScriptLoaded,
      hasContainer: !!containerRef.current,
      hasTradingView: !!window.TradingView,
      containerRef: containerRef.current
    });

    if (!isScriptLoaded || !containerRef.current || !window.TradingView) {
      console.log('❌ TRADINGVIEW - Inicialização cancelada - requisitos não atendidos:', {
        isScriptLoaded,
        hasContainer: !!containerRef.current,
        hasTradingView: !!window.TradingView
      });
      return;
    }

    try {
      console.log('🔄 TRADINGVIEW - Iniciando criação do widget...');
      setIsLoading(true);
      setError(null);

      const containerId = `tradingview_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}`;
      console.log('🔄 TRADINGVIEW - Container ID:', containerId);
      
      // Criar container se não existir
      if (!document.getElementById(containerId)) {
        console.log('🔄 TRADINGVIEW - Criando container...');
        const container = document.createElement('div');
        container.id = containerId;
        container.style.width = width;
        container.style.height = `${height}px`;
        containerRef.current.appendChild(container);
        console.log('✅ TRADINGVIEW - Container criado');
      } else {
        console.log('✅ TRADINGVIEW - Container já existe');
      }

      console.log('🔄 TRADINGVIEW - Criando widget...');
      console.log('🔄 TRADINGVIEW - window.TradingView.widget tipo:', typeof window.TradingView.widget);
      
      // Criar widget
      widgetRef.current = new (window.TradingView.widget as any)({
        container_id: containerId,
        width: width,
        height: height,
        symbol: symbol,
        interval: interval,
        timezone: 'Etc/UTC',
        theme: theme,
        style: '1',
        locale: 'en',
        toolbar_bg: theme === 'dark' ? '#1e1e1e' : '#f1f3f6',
        enable_publishing: false,
        allow_symbol_change: false,
        details: false,
        hotlist: false,
        calendar: false,
        hide_side_toolbar: true,
        hide_top_toolbar: false,
        hide_legend: false,
        studies: [],
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650'
      });

      console.log('✅ TRADINGVIEW - Widget criado com sucesso');
      console.log('🔄 TRADINGVIEW - Widget methods:', Object.keys(widgetRef.current));
      
      // Verificar se onChartReady existe
      if (typeof widgetRef.current.onChartReady === 'function') {
        console.log('✅ TRADINGVIEW - onChartReady disponível, configurando...');
        widgetRef.current.onChartReady(() => {
          console.log('✅ TRADINGVIEW - Widget pronto, gráfico disponível');
          setIsLoading(false);
        });
      } else {
        console.log('⚠️ TRADINGVIEW - onChartReady não disponível, usando setTimeout...');
        // Fallback: aguardar um tempo e considerar pronto
        setTimeout(() => {
          console.log('✅ TRADINGVIEW - Widget considerado pronto (timeout)');
          setIsLoading(false);
        }, 2000);
      }
    } catch (err) {
      console.error('❌ TRADINGVIEW - Erro na inicialização do widget:', err);
      console.error('❌ TRADINGVIEW - Detalhes do erro:', {
        error: err,
        message: err instanceof Error ? err.message : 'Erro desconhecido',
        stack: err instanceof Error ? err.stack : 'Sem stack trace'
      });
      setError('Erro ao inicializar widget TradingView');
      setIsLoading(false);
    }

    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (err) {
          console.warn('Erro ao remover widget TradingView:', err);
        }
      }
    };
  }, [isScriptLoaded, symbol, interval, theme, height, width]);

  if (error) {
  return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>TradingView Chart</CardTitle>
          <CardDescription>Erro ao carregar gráfico</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-red-500 mb-2">❌ Erro ao carregar TradingView</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>TradingView Chart</CardTitle>
        <CardDescription>
          {symbol} - Intervalo: {interval === '1' ? '1 minuto' : interval === '5' ? '5 minutos' : interval === '60' ? '1 hora' : interval === '240' ? '4 horas' : interval === 'D' ? 'Diário' : interval}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10 rounded-lg">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm">Carregando TradingView...</span>
            </div>
            </div>
          )}
          
          <div 
            ref={containerRef}
            className="w-full rounded-lg overflow-hidden"
            style={{ height: `${height}px` }}
          />
        </div>
      </CardContent>
      </Card>
  );
};

export default TradingViewChart;