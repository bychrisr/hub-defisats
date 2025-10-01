import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';

interface UserPosition {
  id: string;
  side: 'long' | 'short';
  entryPrice: number;
  liquidationPrice: number;
  quantity: number;
  margin: number;
  pnl: number;
}

interface TradingViewChartProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  height?: number;
  width?: string;
  className?: string;
  // Props para integração com dados da aplicação
  userPositions?: UserPosition[];
  liquidationPrice?: number;
  showLiquidationLine?: boolean;
  showPositionMarkers?: boolean;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol = 'BINANCE:BTCUSDT',
  interval = '60', // Mudar de '1' (1 minuto) para '60' (1 hora)
  theme = 'dark',
  height = 500,
  width = '100%',
  className = '',
  userPositions = [],
  liquidationPrice,
  showLiquidationLine = true,
  showPositionMarkers = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Carregar script TradingView
  useEffect(() => {
    const loadTradingViewScript = () => {
      console.log('🔄 TRADINGVIEW - Checking if TradingView exists:', !!window.TradingView);
      
      if (window.TradingView) {
        console.log('✅ TRADINGVIEW - TradingView already loaded');
        setIsScriptLoaded(true);
        return;
      }

      console.log('🔄 TRADINGVIEW - Loading TradingView script...');
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ TRADINGVIEW - Script loaded successfully');
        console.log('🔄 TRADINGVIEW - window.TradingView after load:', !!window.TradingView);
        console.log('🔄 TRADINGVIEW - window.TradingView.widget:', !!window.TradingView?.widget);
        setIsScriptLoaded(true);
      };
      
      script.onerror = (error) => {
        console.error('❌ TRADINGVIEW - Script load error:', error);
        console.error('❌ TRADINGVIEW - Script src:', script.src);
        setError('Erro ao carregar script TradingView');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
      console.log('✅ TRADINGVIEW - Script appended to document.head');
    };

    loadTradingViewScript();
  }, []);

  // Inicializar widget quando script estiver carregado
  useEffect(() => {
    console.log('🔄 TRADINGVIEW - Widget initialization useEffect triggered:', {
      isScriptLoaded,
      hasContainer: !!containerRef.current,
      hasTradingView: !!window.TradingView,
      containerRef: containerRef.current
    });

    if (!isScriptLoaded || !containerRef.current || !window.TradingView) {
      console.log('❌ TRADINGVIEW - Widget initialization skipped - missing requirements:', {
        isScriptLoaded,
        hasContainer: !!containerRef.current,
        hasTradingView: !!window.TradingView
      });
      return;
    }

    try {
      console.log('🔄 TRADINGVIEW - Starting widget initialization...');
      setIsLoading(true);
      setError(null);

      const containerId = `tradingview_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}`;
      console.log('🔄 TRADINGVIEW - Container ID:', containerId);
      
      // Criar container se não existir
      if (!document.getElementById(containerId)) {
        console.log('🔄 TRADINGVIEW - Creating container...');
        const container = document.createElement('div');
        container.id = containerId;
        container.style.width = width;
        container.style.height = `${height}px`;
        containerRef.current.appendChild(container);
        console.log('✅ TRADINGVIEW - Container created');
      } else {
        console.log('✅ TRADINGVIEW - Container already exists');
      }

      console.log('🔄 TRADINGVIEW - Creating widget...');
      console.log('🔄 TRADINGVIEW - window.TradingView.widget type:', typeof window.TradingView.widget);
      
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

      console.log('✅ TRADINGVIEW - Widget created successfully');
      console.log('🔄 TRADINGVIEW - Setting up onChartReady callback...');

      // Aguardar widget estar pronto
      widgetRef.current.onChartReady(() => {
        console.log('✅ TRADINGVIEW - Widget ready, chart available');
        setIsLoading(false);
        
        // Adicionar linhas quando o widget estiver pronto
        setTimeout(() => {
          if (showLiquidationLine && liquidationPrice) {
            addLiquidationLine(liquidationPrice);
          }

          if (showPositionMarkers && userPositions.length > 0) {
            addPositionMarkers(userPositions);
          }
        }, 1000);
      });
    } catch (err) {
      console.error('❌ TRADINGVIEW - Widget initialization error:', err);
      console.error('❌ TRADINGVIEW - Error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace'
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

  // Adicionar linhas quando dados mudarem
  useEffect(() => {
    if (!widgetRef.current || !isScriptLoaded) return;

    // Adicionar linha de liquidação se especificada
    if (showLiquidationLine && liquidationPrice) {
      addLiquidationLine(liquidationPrice);
    }

    // Adicionar marcadores de posições
    if (showPositionMarkers && userPositions.length > 0) {
      addPositionMarkers(userPositions);
    }
  }, [liquidationPrice, userPositions, isScriptLoaded, showLiquidationLine, showPositionMarkers]);

  // Função para adicionar linha de liquidação
  const addLiquidationLine = (price: number) => {
    if (widgetRef.current && widgetRef.current.chart) {
      try {
        widgetRef.current.chart().createShape(
          { time: Date.now() / 1000, price: price },
          {
            shape: 'horizontal_line',
            text: `Liquidação: $${price.toLocaleString()}`,
            overrides: {
              linecolor: '#ff4444',
              linewidth: 2,
              linestyle: 1,
              textcolor: '#ffffff',
              fontSize: 10
            }
          }
        );
      } catch (error) {
        console.warn('Erro ao adicionar linha de liquidação:', error);
      }
    }
  };

  // Função para adicionar marcadores de posições
  const addPositionMarkers = (positions: UserPosition[]) => {
    if (!widgetRef.current || !widgetRef.current.chart) return;

    positions.forEach((position) => {
      try {
        // Linha de entrada
        widgetRef.current.chart().createShape(
          { time: Date.now() / 1000, price: position.entryPrice },
          {
            shape: 'horizontal_line',
            text: `${position.side.toUpperCase()}: $${position.entryPrice.toLocaleString()}`,
            overrides: {
              linecolor: position.side === 'long' ? '#00ff00' : '#ff0000',
              linewidth: 1,
              linestyle: 2,
              textcolor: '#ffffff',
              fontSize: 9
            }
          }
        );

        // Linha de liquidação individual
        widgetRef.current.chart().createShape(
          { time: Date.now() / 1000, price: position.liquidationPrice },
          {
            shape: 'horizontal_line',
            text: `Liquidação: $${position.liquidationPrice.toLocaleString()}`,
            overrides: {
              linecolor: '#ff4444',
              linewidth: 1,
              linestyle: 3,
              textcolor: '#ffffff',
              fontSize: 9
            }
          }
        );
      } catch (error) {
        console.warn('Erro ao adicionar marcador de posição:', error);
      }
    });
  };

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
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-500 mb-2">Erro ao carregar TradingView</p>
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