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
      if (window.TradingView) {
        setIsScriptLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        setIsScriptLoaded(true);
      };
      script.onerror = () => {
        setError('Erro ao carregar script TradingView');
        setIsLoading(false);
      };
      
      document.head.appendChild(script);
    };

    loadTradingViewScript();
  }, []);

  // Inicializar widget quando script estiver carregado
  useEffect(() => {
    if (!isScriptLoaded || !containerRef.current || !window.TradingView) return;

    try {
      setIsLoading(true);
      setError(null);

      const containerId = `tradingview_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      // Criar container se não existir
      if (!document.getElementById(containerId)) {
        const container = document.createElement('div');
        container.id = containerId;
        container.style.width = width;
        container.style.height = `${height}px`;
        containerRef.current.appendChild(container);
      }

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
        allow_symbol_change: false, // Desabilitar mudança de símbolo
        details: false, // Remover painel de detalhes
        hotlist: false, // Remover hotlist
        calendar: false, // Remover calendário
        hide_side_toolbar: true, // Esconder toolbar lateral
        hide_top_toolbar: false, // Manter toolbar superior
        hide_legend: false, // Manter legenda dos indicadores
        studies: [], // Remover todos os indicadores técnicos
        show_popup_button: true,
        popup_width: '1000',
        popup_height: '650'
      });

      setIsLoading(false);
    } catch (err) {
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
    console.log('🔍 TRADINGVIEW - useEffect triggered:', {
      hasWidget: !!widgetRef.current,
      isScriptLoaded,
      liquidationPrice,
      userPositionsCount: userPositions.length,
      showLiquidationLine,
      showPositionMarkers,
      userPositions: userPositions.slice(0, 2) // Log apenas as primeiras 2 posições
    });

    if (!widgetRef.current || !isScriptLoaded) {
      console.log('❌ TRADINGVIEW - Widget not ready, skipping line creation');
      return;
    }

    // Adicionar linha de liquidação se especificada
    if (showLiquidationLine && liquidationPrice) {
      console.log('🔄 TRADINGVIEW - Adding liquidation line:', liquidationPrice);
      addLiquidationLine(liquidationPrice);
    }

    // Adicionar marcadores de posições
    if (showPositionMarkers && userPositions.length > 0) {
      console.log('🔄 TRADINGVIEW - Adding position markers:', userPositions.length);
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
              linestyle: 1, // Solid line
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
    if (!widgetRef.current || !widgetRef.current.chart) {
      console.log('❌ TRADINGVIEW - Widget or chart not available for position markers');
      return;
    }

    console.log('🔄 TRADINGVIEW - Processing positions:', positions.length);

    positions.forEach((position, index) => {
      try {
        console.log(`🔄 TRADINGVIEW - Adding position ${index + 1}:`, {
          id: position.id,
          side: position.side,
          entryPrice: position.entryPrice,
          liquidationPrice: position.liquidationPrice
        });

        // Linha de entrada
        widgetRef.current.chart().createShape(
          { time: Date.now() / 1000, price: position.entryPrice },
          {
            shape: 'horizontal_line',
            text: `${position.side.toUpperCase()}: $${position.entryPrice.toLocaleString()}`,
            overrides: {
              linecolor: position.side === 'long' ? '#00ff00' : '#ff0000',
              linewidth: 1,
              linestyle: 2, // Dashed line
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
              linestyle: 3, // Dotted line
              textcolor: '#ffffff',
              fontSize: 9
            }
          }
        );

        console.log(`✅ TRADINGVIEW - Position ${index + 1} markers added successfully`);
      } catch (error) {
        console.warn(`❌ TRADINGVIEW - Error adding position ${index + 1} marker:`, error);
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