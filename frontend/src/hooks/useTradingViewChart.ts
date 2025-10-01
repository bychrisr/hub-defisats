import { useState, useEffect } from 'react';

interface UseTradingViewChartReturn {
  isLoaded: boolean;
  error: string | null;
  isLoading: boolean;
}

export const useTradingViewChart = (): UseTradingViewChartReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTradingView = () => {
      if (window.TradingView) {
        setIsLoaded(true);
        setError(null);
        setIsLoading(false);
      } else {
        // Verificar se há erro de carregamento
        const scripts = document.querySelectorAll('script[src*="tradingview.com"]');
        const hasError = Array.from(scripts).some(script => 
          script.getAttribute('data-error') === 'true'
        );
        
        if (hasError) {
          setError('Erro ao carregar script TradingView');
          setIsLoading(false);
        }
      }
    };

    // Verificar imediatamente
    checkTradingView();

    // Verificar periodicamente se ainda não carregou
    const interval = setInterval(checkTradingView, 100);
    
    // Limpar após 10 segundos
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!isLoaded && !error) {
        setError('Timeout ao carregar TradingView');
        setIsLoading(false);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isLoaded, error]);

  return { isLoaded, error, isLoading };
};
