import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

// Hook customizado para debounce
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface TradingViewChartProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  height?: number;
  width?: string;
  className?: string;
  // Props para linhas de liquidação
  liquidationPrice?: number;
  showLiquidationLine?: boolean;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  symbol = 'BINANCE:BTCUSDT',
  interval = '60',
  theme: propTheme,
  height = 500,
  width = '100%',
  className = '',
  liquidationPrice,
  showLiquidationLine = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<any>(null);
  const liquidationAppliedRef = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Usar tema da aplicação se não especificado
  const { theme: appTheme } = useTheme();
  const theme = propTheme || appTheme;
  
  // Debounce para evitar recriações desnecessárias
  const debouncedSymbol = useDebounce(symbol, 300);
  const debouncedInterval = useDebounce(interval, 300);
  const debouncedTheme = useDebounce(theme, 300);

  // Função memoizada para gerar tema transparente que se adapta à aplicação
  const getTransparentThemeConfig = useCallback((isDark: boolean) => {
    console.log('🎨 TRADINGVIEW - Gerando tema transparente:', isDark ? 'dark' : 'light');
    
    return {
      theme: isDark ? 'dark' : 'light',
      background: 'transparent',
      toolbar_bg: 'transparent',
      grid_color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      crosshair_color: isDark ? '#ffffff' : '#000000',
      text_color: isDark ? '#ffffff' : '#000000',
      candle_up_color: isDark ? '#26a69a' : '#26a69a',
      candle_down_color: isDark ? '#ef5350' : '#ef5350',
      wick_up_color: isDark ? '#26a69a' : '#26a69a',
      wick_down_color: isDark ? '#ef5350' : '#ef5350',
      volume_up_color: isDark ? 'rgba(38,166,154,0.3)' : 'rgba(38,166,154,0.3)',
      volume_down_color: isDark ? 'rgba(239,83,80,0.3)' : 'rgba(239,83,80,0.3)',
      border_up_color: isDark ? '#26a69a' : '#26a69a',
      border_down_color: isDark ? '#ef5350' : '#ef5350',
      border_visible: false,
      wick_thick: 1,
      border_thick: 1,
      font_family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      font_size: 12
    };
  }, []);

  // Função para adicionar linha de liquidação
  const addLiquidationLine = useCallback((price: number) => {
    if (!widgetRef.current) {
      console.log('❌ TRADINGVIEW - Widget não disponível para linha de liquidação');
      return;
    }

    const getChart = () => {
      try {
        if (typeof widgetRef.current.activeChart === 'function') {
          return widgetRef.current.activeChart();
        }
        if (typeof widgetRef.current.chart === 'function') {
          return widgetRef.current.chart();
        }
      } catch {}
      return null;
    };

    const chart = getChart();
    if (!chart) {
      console.log('❌ TRADINGVIEW - Chart API indisponível (nem activeChart nem chart)');
      return;
    }

    // 0) createOrderLine (API comum do Advanced Chart)
    try {
      if (typeof (chart as any).createOrderLine === 'function') {
        console.log('📊 TRADINGVIEW - Tentando createOrderLine()');
        const orderLine = (chart as any).createOrderLine();
        orderLine.setPrice(price);
        orderLine.setText(`Liquidação: $${price.toLocaleString()}`);
        if (typeof orderLine.setLineStyle === 'function') orderLine.setLineStyle(0);
        if (typeof orderLine.setLineColor === 'function') orderLine.setLineColor('#ff4444');
        if (typeof orderLine.setBodyBackgroundColor === 'function') orderLine.setBodyBackgroundColor('rgba(255,68,68,0.12)');
        if (typeof orderLine.setBodyBorderColor === 'function') orderLine.setBodyBorderColor('#ff4444');
        if (typeof orderLine.setBodyTextColor === 'function') orderLine.setBodyTextColor('#ffffff');
        if (typeof orderLine.setQuantity === 'function') orderLine.setQuantity('');
        console.log('✅ TRADINGVIEW - Linha de liquidação (orderLine) adicionada');
        return;
      } else {
        console.log('⚠️ TRADINGVIEW - createOrderLine não disponível');
      }
    } catch (errOrder) {
      console.warn('⚠️ TRADINGVIEW - createOrderLine falhou:', errOrder);
    }
    try {
      console.log('📊 TRADINGVIEW - Tentando createShape(horizontal_line):', price);
      const time = Math.floor(Date.now() / 1000);
      const shapeId = chart.createShape(
        { time, price },
        {
          shape: 'horizontal_line',
          text: `Liquidação: $${price.toLocaleString()}`,
          overrides: {
            linecolor: '#ff4444',
            linewidth: 2,
            linestyle: 1,
            textcolor: '#ffffff',
            fontSize: 10,
            extendLeft: true,
            extendRight: true
          }
        }
      );
      console.log('✅ TRADINGVIEW - Linha (createShape) adicionada:', shapeId);
      return;
    } catch (err1) {
      console.warn('⚠️ TRADINGVIEW - createShape falhou:', err1);
    }

    try {
      // Alguns builds expõem createLineTool
      if (typeof (chart as any).createLineTool === 'function') {
        console.log('📊 TRADINGVIEW - Tentando createLineTool(HorizontalLine)');
        const id = (chart as any).createLineTool('HorizontalLine', { price, text: `Liquidação: $${price.toLocaleString()}` });
        console.log('✅ TRADINGVIEW - Linha (createLineTool) adicionada:', id);
        return;
      }
    } catch (err2) {
      console.warn('⚠️ TRADINGVIEW - createLineTool falhou:', err2);
    }

    try {
      // Fallback extremo: usar uma study para plotar uma linha no preço (plot horizontal)
      console.log('📊 TRADINGVIEW - Tentando fallback com estudo Horizontal Line');
      const studyId = chart.createStudy('Horizontal Line', false, false, [price], { 'Line Color': '#ff4444' });
      console.log('✅ TRADINGVIEW - Linha (study) adicionada:', studyId);
    } catch (err3) {
      console.warn('⚠️ TRADINGVIEW - Fallback study falhou:', err3);
    }
  }, []);

  // Carregar script TradingView apenas quando visível (lazy loading)
  useEffect(() => {
    if (!isVisible) {
      console.log('⏸️ TRADINGVIEW - Componente não visível, aguardando...');
      return;
    }

    const loadTradingViewScript = () => {
      console.log('🔄 TRADINGVIEW - Iniciando carregamento do script...');
      console.log('🔄 TRADINGVIEW - window.TradingView existe?', !!window.TradingView);

      // Se já existe, marca como carregado
      if (window.TradingView) {
        console.log('✅ TRADINGVIEW - TradingView já carregado');
        setIsScriptLoaded(true);
        return;
      }

      // Evitar adicionar múltiplas vezes
      const existing = document.getElementById('tv-js');
      if (existing) {
        console.log('⚠️ TRADINGVIEW - Script já presente no DOM, iniciando polling...');
      } else {
        console.log('🔄 TRADINGVIEW - Criando script...');
        const script = document.createElement('script');
        script.id = 'tv-js';
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;

        script.onload = () => {
          console.log('✅ TRADINGVIEW - onload do script disparado');
          console.log('🔄 TRADINGVIEW - window.TradingView após onload:', !!window.TradingView);
          setIsScriptLoaded(!!window.TradingView);
        };

        script.onerror = (error) => {
          console.error('❌ TRADINGVIEW - Erro ao carregar script:', error);
          console.error('❌ TRADINGVIEW - URL do script:', script.src);
          setError('Erro ao carregar script TradingView');
          setIsLoading(false);
        };

        document.head.appendChild(script);
        console.log('✅ TRADINGVIEW - Script adicionado ao document.head');
      }

      // Polling: aguarda até 10s pelo global TradingView
      const start = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        if (window.TradingView) {
          console.log('✅ TRADINGVIEW - Detectado via polling em', elapsed, 'ms');
          clearInterval(interval);
          setIsScriptLoaded(true);
        } else if (elapsed > 10000) {
          console.error('❌ TRADINGVIEW - Polling expirou (10s) sem TradingView disponível');
          clearInterval(interval);
          setError('Timeout ao carregar TradingView');
          setIsLoading(false);
        }
      }, 200);
    };

    loadTradingViewScript();
  }, [isVisible]);

  // Lazy loading com Intersection Observer
  // Lazy loading: DESABILITADO TEMPORARIAMENTE PARA TESTE
  useEffect(() => {
    console.log('📊 TRADINGVIEW - Lazy loading desabilitado para teste');
    setIsVisible(true);
  }, []);

  // Configuração memoizada do widget
  const widgetConfig = useMemo(() => {
    const isDark = debouncedTheme === 'dark';
    const transparentTheme = getTransparentThemeConfig(isDark);
    
    return {
      container_id: `tradingview_${debouncedSymbol.replace(/[^a-zA-Z0-9]/g, '_')}`,
      width: width,
      height: height,
      symbol: debouncedSymbol,
      interval: debouncedInterval,
      timezone: 'Etc/UTC',
      locale: 'en',
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
      popup_height: '650',
      // Aplicar tema transparente
      ...transparentTheme
    };
  }, [debouncedSymbol, debouncedInterval, debouncedTheme, width, height, getTransparentThemeConfig]);

  // Inicializar widget quando script estiver carregado
  useEffect(() => {
    console.log('🔄 TRADINGVIEW - useEffect de inicialização do widget disparado');
    console.log('🔄 TRADINGVIEW - Estado atual:', {
      isScriptLoaded,
      hasContainer: !!containerRef.current,
      hasTradingView: !!window.TradingView,
      containerRef: containerRef.current
    });

    if (!containerRef.current) {
      console.log('❌ TRADINGVIEW - Sem container, adiando inicialização');
      return;
    }

    try {
      console.log('🔄 TRADINGVIEW - Iniciando criação do widget...');
      setIsLoading(true);
      setError(null);

      const containerId = widgetConfig.container_id;
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
      console.log('🎨 TRADINGVIEW - Usando configuração memoizada:', widgetConfig);
      
      // Criar widget com configuração memoizada
      widgetRef.current = new (window.TradingView.widget as any)(widgetConfig);

      console.log('✅ TRADINGVIEW - Widget criado com sucesso');
      console.log('🔄 TRADINGVIEW - Widget methods:', Object.keys(widgetRef.current));
      
      // Verificar se onChartReady existe
      if (typeof widgetRef.current.onChartReady === 'function') {
        console.log('✅ TRADINGVIEW - onChartReady disponível, configurando...');
        widgetRef.current.onChartReady(() => {
          console.log('✅ TRADINGVIEW - Widget pronto, gráfico disponível');
          setIsLoading(false);
          try {
            // Expor para debug no console
            (window as any).__tvWidget = widgetRef.current;
            const chart = widgetRef.current.chart && widgetRef.current.chart();
            (window as any).__tvChart = chart;
            console.log('🔎 TRADINGVIEW - Expostos no window: __tvWidget e __tvChart');
          } catch (e) {
            console.warn('⚠️ TRADINGVIEW - Falha ao expor objetos para debug:', e);
          }
          try {
            const chart = widgetRef.current.chart();
            console.log('🔧 TRADINGVIEW - Chart API disponível?', !!chart);
            console.log('🔧 TRADINGVIEW - Métodos do chart:', chart ? Object.keys(chart) : 'N/A');
            if (chart) {
              console.log('🔧 TRADINGVIEW - createShape existe?', typeof chart.createShape === 'function');
              console.log('🔧 TRADINGVIEW - createLineTool existe?', typeof (chart as any).createLineTool === 'function');
              console.log('🔧 TRADINGVIEW - createStudy existe?', typeof chart.createStudy === 'function');
              console.log('🔧 TRADINGVIEW - createOrderLine existe?', typeof (chart as any).createOrderLine === 'function');
            }
          } catch (e) {
            console.warn('⚠️ TRADINGVIEW - Não foi possível inspecionar chart API:', e);
          }
          
          // Adicionar linha de liquidação se especificada
          if (showLiquidationLine && liquidationPrice) {
            console.log('📊 TRADINGVIEW - Agendando linha de liquidação com retries');
            liquidationAppliedRef.current = false;
            const startedAt = Date.now();
            const interval = setInterval(() => {
              if (liquidationAppliedRef.current) {
                clearInterval(interval);
                return;
              }
              const elapsed = Date.now() - startedAt;
              if (elapsed > 3000) {
                console.warn('⚠️ TRADINGVIEW - Timeout aplicando linha de liquidação');
                clearInterval(interval);
                return;
              }
              try {
                addLiquidationLine(liquidationPrice);
                liquidationAppliedRef.current = true;
                clearInterval(interval);
              } catch (e) {
                console.warn('⚠️ TRADINGVIEW - Tentativa de aplicar linha falhou, nova tentativa...', e);
              }
            }, 300);
          }
        });
      } else {
        console.log('⚠️ TRADINGVIEW - onChartReady não disponível, usando setTimeout...');
        // Fallback: aguardar um tempo e considerar pronto
        setTimeout(() => {
          console.log('✅ TRADINGVIEW - Widget considerado pronto (timeout)');
          setIsLoading(false);
          
          // Adicionar linha de liquidação se especificada (fallback)
          if (showLiquidationLine && liquidationPrice) {
            console.log('📊 TRADINGVIEW - Adicionando linha de liquidação (fallback)');
            setTimeout(() => {
              addLiquidationLine(liquidationPrice);
            }, 500);
          }
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
  }, [isScriptLoaded, widgetConfig, height, width]);

  // Adicionar linha de liquidação quando dados mudarem
  useEffect(() => {
    console.log('📊 TRADINGVIEW - useEffect de liquidação disparado:', {
      hasWidget: !!widgetRef.current,
      isScriptLoaded,
      showLiquidationLine,
      liquidationPrice,
      widgetMethods: widgetRef.current ? Object.keys(widgetRef.current) : 'N/A'
    });

    if (!widgetRef.current || !isScriptLoaded || !showLiquidationLine || !liquidationPrice) {
      console.log('❌ TRADINGVIEW - Condições não atendidas para linha de liquidação');
      return;
    }

    console.log('📊 TRADINGVIEW - Dados de liquidação mudaram, atualizando linha...');
    liquidationAppliedRef.current = false;
    addLiquidationLine(liquidationPrice);
    liquidationAppliedRef.current = true;
  }, [liquidationPrice, showLiquidationLine, isScriptLoaded, addLiquidationLine]);

  // Debug: Log quando props mudarem
  useEffect(() => {
    console.log('🔍 TRADINGVIEW - Props de liquidação:', {
      liquidationPrice,
      showLiquidationLine,
      isScriptLoaded,
      hasWidget: !!widgetRef.current
    });
  }, [liquidationPrice, showLiquidationLine, isScriptLoaded]);

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