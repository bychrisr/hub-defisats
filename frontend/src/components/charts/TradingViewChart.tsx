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
  console.log('🎯 TRADINGVIEW - Component render:', {
    symbol,
    interval,
    theme,
    height,
    width,
    userPositionsCount: userPositions.length,
    liquidationPrice,
    showLiquidationLine,
    showPositionMarkers,
    timestamp: new Date().toISOString()
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  console.log('🎯 TRADINGVIEW - Component state:', {
    isLoading,
    error,
    isScriptLoaded,
    hasContainer: !!containerRef.current,
    hasWidget: !!widgetRef.current,
    hasTradingView: !!window.TradingView,
    timestamp: new Date().toISOString()
  });

  // Carregar script TradingView
  useEffect(() => {
    console.log('🔄 TRADINGVIEW - Script loading useEffect triggered:', {
      isScriptLoaded,
      hasTradingView: !!window.TradingView,
      timestamp: new Date().toISOString()
    });

    const loadTradingViewScript = () => {
      console.log('🔄 TRADINGVIEW - Checking if TradingView script is loaded...');
      console.log('🔄 TRADINGVIEW - window.TradingView exists:', !!window.TradingView);
      console.log('🔄 TRADINGVIEW - window.TradingView type:', typeof window.TradingView);
      
      if (window.TradingView) {
        console.log('✅ TRADINGVIEW - TradingView script already loaded');
        console.log('🔄 TRADINGVIEW - Setting isScriptLoaded to true');
        console.log('🔄 TRADINGVIEW - Before setIsScriptLoaded, isScriptLoaded:', isScriptLoaded);
        setIsScriptLoaded(true);
        console.log('🔄 TRADINGVIEW - After setIsScriptLoaded called');
        return;
      }

      console.log('🔄 TRADINGVIEW - Loading TradingView script...');
      console.log('🔄 TRADINGVIEW - Creating script element...');
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      
      console.log('🔄 TRADINGVIEW - Script element created:', {
        src: script.src,
        async: script.async,
        timestamp: new Date().toISOString()
      });

      script.onload = () => {
        console.log('✅ TRADINGVIEW - Script loaded successfully');
        console.log('🔄 TRADINGVIEW - window.TradingView after load:', !!window.TradingView);
        console.log('🔄 TRADINGVIEW - Setting isScriptLoaded to true');
        console.log('🔄 TRADINGVIEW - Before setIsScriptLoaded, isScriptLoaded:', isScriptLoaded);
        setIsScriptLoaded(true);
        console.log('🔄 TRADINGVIEW - After setIsScriptLoaded called');
      };
      
      script.onerror = (error) => {
        console.error('❌ TRADINGVIEW - Script load error:', error);
        console.error('❌ TRADINGVIEW - Script load error details:', {
          error,
          src: script.src,
          timestamp: new Date().toISOString()
        });
        setError('Erro ao carregar script TradingView');
        setIsLoading(false);
      };
      
      console.log('🔄 TRADINGVIEW - Appending script to document.head...');
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
      containerRef: containerRef.current,
      timestamp: new Date().toISOString()
    });

    console.log('🔄 TRADINGVIEW - Checking requirements:', {
      'isScriptLoaded': isScriptLoaded,
      'hasContainer': !!containerRef.current,
      'hasTradingView': !!window.TradingView,
      'containerRef.current': containerRef.current,
      'window.TradingView': window.TradingView,
      'window.TradingView.widget': window.TradingView?.widget
    });

    if (!isScriptLoaded || !containerRef.current || !window.TradingView) {
      console.log('❌ TRADINGVIEW - Widget initialization skipped - missing requirements:', {
        isScriptLoaded,
        hasContainer: !!containerRef.current,
        hasTradingView: !!window.TradingView,
        reason: !isScriptLoaded ? 'Script not loaded' : 
                !containerRef.current ? 'Container not ready' : 
                !window.TradingView ? 'TradingView not available' : 'Unknown'
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

      // Criar widget
      const widgetConfig = {
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
      };

      console.log('🔄 TRADINGVIEW - Creating widget with config:', widgetConfig);
      console.log('🔄 TRADINGVIEW - window.TradingView.widget type:', typeof window.TradingView.widget);
      console.log('🔄 TRADINGVIEW - window.TradingView.widget constructor:', window.TradingView.widget);

      try {
        widgetRef.current = new (window.TradingView.widget as any)(widgetConfig);
        console.log('✅ TRADINGVIEW - Widget created successfully');
        console.log('✅ TRADINGVIEW - widgetRef.current:', widgetRef.current);
        console.log('✅ TRADINGVIEW - widgetRef.current type:', typeof widgetRef.current);
      } catch (widgetError) {
        console.error('❌ TRADINGVIEW - Widget creation error:', widgetError);
        throw widgetError;
      }

      // ✅ AGUARDAR WIDGET ESTAR PRONTO ANTES DE ADICIONAR LINHAS
      console.log('🔄 TRADINGVIEW - Setting up onChartReady callback...');
      widgetRef.current.onChartReady(() => {
        console.log('✅ TRADINGVIEW - Widget ready, chart available');
        console.log('✅ TRADINGVIEW - widgetRef.current.onChartReady callback executed');
        console.log('✅ TRADINGVIEW - widgetRef.current.chart:', widgetRef.current.chart);
        console.log('✅ TRADINGVIEW - widgetRef.current.chart type:', typeof widgetRef.current.chart);
        setIsLoading(false);
        
        // Adicionar linhas quando o widget estiver pronto
        console.log('🔄 TRADINGVIEW - Setting timeout for adding lines...');
        setTimeout(() => {
          console.log('🔄 TRADINGVIEW - Timeout executed, checking conditions:', {
            showLiquidationLine,
            liquidationPrice,
            showPositionMarkers,
            userPositionsCount: userPositions.length
          });

          if (showLiquidationLine && liquidationPrice) {
            console.log('🔄 TRADINGVIEW - Adding liquidation line after widget ready:', liquidationPrice);
            addLiquidationLine(liquidationPrice);
          }

          if (showPositionMarkers && userPositions.length > 0) {
            console.log('🔄 TRADINGVIEW - Adding position markers after widget ready:', userPositions.length);
            addPositionMarkers(userPositions);
          }
        }, 1000); // Aguardar 1 segundo para garantir que tudo está carregado
      });
    } catch (err) {
      console.error('❌ TRADINGVIEW - Widget initialization error:', err);
      setError(`Erro ao inicializar widget TradingView: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
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
    console.log('🔄 TRADINGVIEW - addLiquidationLine called:', {
      price,
      hasWidget: !!widgetRef.current,
      hasChart: !!(widgetRef.current && widgetRef.current.chart),
      widgetRef: widgetRef.current,
      chart: widgetRef.current?.chart
    });

    if (widgetRef.current && widgetRef.current.chart) {
      try {
        const point = { time: Date.now() / 1000, price: price };
        const options = {
          shape: 'horizontal_line',
          text: `Liquidação: $${price.toLocaleString()}`,
          overrides: {
            linecolor: '#ff4444',
            linewidth: 2,
            linestyle: 1, // Solid line
            textcolor: '#ffffff',
            fontSize: 10
          }
        };

        console.log('🔄 TRADINGVIEW - Creating liquidation line:', { point, options });
        widgetRef.current.chart().createShape(point, options);
        console.log('✅ TRADINGVIEW - Liquidation line created successfully');
      } catch (error) {
        console.error('❌ TRADINGVIEW - Error adding liquidation line:', error);
        console.error('❌ TRADINGVIEW - Error details:', {
          error,
          price,
          widgetRef: widgetRef.current,
          chart: widgetRef.current?.chart
        });
      }
    } else {
      console.warn('❌ TRADINGVIEW - Cannot add liquidation line - widget or chart not available:', {
        hasWidget: !!widgetRef.current,
        hasChart: !!(widgetRef.current && widgetRef.current.chart)
      });
    }
  };

  // Função para adicionar marcadores de posições
  const addPositionMarkers = (positions: UserPosition[]) => {
    console.log('🔄 TRADINGVIEW - addPositionMarkers called:', {
      positionsCount: positions.length,
      hasWidget: !!widgetRef.current,
      hasChart: !!(widgetRef.current && widgetRef.current.chart),
      widgetRef: widgetRef.current,
      chart: widgetRef.current?.chart
    });

    if (!widgetRef.current || !widgetRef.current.chart) {
      console.log('❌ TRADINGVIEW - Widget or chart not available for position markers:', {
        hasWidget: !!widgetRef.current,
        hasChart: !!(widgetRef.current && widgetRef.current.chart)
      });
      return;
    }

    console.log('🔄 TRADINGVIEW - Processing positions:', positions.length);
    console.log('🔄 TRADINGVIEW - Positions data:', positions);

    positions.forEach((position, index) => {
      try {
        console.log(`🔄 TRADINGVIEW - Adding position ${index + 1}:`, {
          id: position.id,
          side: position.side,
          entryPrice: position.entryPrice,
          liquidationPrice: position.liquidationPrice,
          position: position
        });

        // Linha de entrada
        const entryPoint = { time: Date.now() / 1000, price: position.entryPrice };
        const entryOptions = {
          shape: 'horizontal_line',
          text: `${position.side.toUpperCase()}: $${position.entryPrice.toLocaleString()}`,
          overrides: {
            linecolor: position.side === 'long' ? '#00ff00' : '#ff0000',
            linewidth: 1,
            linestyle: 2, // Dashed line
            textcolor: '#ffffff',
            fontSize: 9
          }
        };

        console.log(`🔄 TRADINGVIEW - Creating entry line for position ${index + 1}:`, { entryPoint, entryOptions });
        widgetRef.current.chart().createShape(entryPoint, entryOptions);
        console.log(`✅ TRADINGVIEW - Entry line created for position ${index + 1}`);

        // Linha de liquidação individual
        const liquidationPoint = { time: Date.now() / 1000, price: position.liquidationPrice };
        const liquidationOptions = {
          shape: 'horizontal_line',
          text: `Liquidação: $${position.liquidationPrice.toLocaleString()}`,
          overrides: {
            linecolor: '#ff4444',
            linewidth: 1,
            linestyle: 3, // Dotted line
            textcolor: '#ffffff',
            fontSize: 9
          }
        };

        console.log(`🔄 TRADINGVIEW - Creating liquidation line for position ${index + 1}:`, { liquidationPoint, liquidationOptions });
        widgetRef.current.chart().createShape(liquidationPoint, liquidationOptions);
        console.log(`✅ TRADINGVIEW - Liquidation line created for position ${index + 1}`);

        console.log(`✅ TRADINGVIEW - Position ${index + 1} markers added successfully`);
      } catch (error) {
        console.error(`❌ TRADINGVIEW - Error adding position ${index + 1} marker:`, error);
        console.error(`❌ TRADINGVIEW - Error details for position ${index + 1}:`, {
          error,
          position,
          index,
          widgetRef: widgetRef.current,
          chart: widgetRef.current?.chart
        });
      }
    });

    console.log('✅ TRADINGVIEW - All position markers processing completed');
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