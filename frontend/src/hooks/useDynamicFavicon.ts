import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useTotalPL } from './usePositions';

interface FaviconConfig {
  positive: string; // URL ou data URL para P&L positivo
  negative: string; // URL ou data URL para P&L negativo
  neutral: string;  // URL ou data URL para P&L neutro/zero
}

// Hook de teste para verificar o favicon (remova em produção)
export const useTestFavicon = () => {
  const { generateFaviconWithValue, updateFavicon } = useDynamicFavicon();

  const testFavicon = (pl: number) => {
    const faviconUrl = generateFaviconWithValue(pl);
    updateFavicon(faviconUrl);
    return faviconUrl;
  };

  return { testFavicon };
};

export const useDynamicFavicon = (config?: Partial<FaviconConfig>) => {
  const { isAuthenticated } = useAuthStore();
  const totalPL = useTotalPL();

  // Configuração padrão do favicon - apenas círculos sólidos
  const defaultConfig: FaviconConfig = {
    positive: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#00ff00"/></svg>'),
    negative: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#ff0000"/></svg>'),
    neutral: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#666"/></svg>')
  };

  const faviconConfig = { ...defaultConfig, ...config };

  // Função para atualizar o favicon
  const updateFavicon = (href: string) => {
    console.log('🎨 FAVICON - Starting update with href:', href);

    try {
      // Remover favicons existentes
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(favicon => {
        console.log('🎨 FAVICON - Removing existing favicon:', favicon.href);
        favicon.remove();
      });

      // Criar novo favicon
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      link.href = href;

      // Adicionar ao head
      document.head.appendChild(link);
      console.log('🎨 FAVICON - Added new favicon to head:', href);

      // Forçar atualização do favicon com cache busting
      setTimeout(() => {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (favicon) {
          const updatedHref = href + '?t=' + Date.now();
          favicon.href = updatedHref;
          console.log('🎨 FAVICON - Force updated favicon with cache busting:', updatedHref);
        } else {
          console.warn('🎨 FAVICON - Could not find favicon element for cache busting');
        }
      }, 100);

      console.log('🎨 FAVICON - Successfully updated favicon');
    } catch (error) {
      console.error('🎨 FAVICON - Error updating favicon:', error);
    }
  };

  // Função para gerar favicon baseado no P&L
  const generateFavicon = (pl: number) => {
    // Se P&L é zero, usar favicon padrão
    if (pl === 0) {
      return '/favicon.svg';
    }
    
    if (pl > 0) {
      return faviconConfig.positive;
    } else {
      return faviconConfig.negative;
    }
  };

  // Função para gerar favicon com valor específico - apenas círculo sólido
  const generateFaviconWithValue = (pl: number) => {
    console.log('🎨 FAVICON - generateFaviconWithValue called with:', pl);

    // Verificar se o valor é válido
    if (typeof pl !== 'number' || isNaN(pl)) {
      console.warn('🎨 FAVICON - Invalid PL value, using zero favicon');
      pl = 0;
    }

    const isPositive = pl > 0;
    const isNegative = pl < 0;
    const isZero = pl === 0;

    // Cores mais vibrantes e distintas
    let color;

    if (isZero) {
      color = '#666'; // Cinza para neutro
    } else {
      color = isPositive ? '#00ff00' : '#ff0000'; // Verde brilhante para positivo, vermelho brilhante para negativo
    }

    console.log('🎨 FAVICON - Generated values:', { color, originalPL: pl });

    // Favicon simplificado - apenas círculo sólido
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
      '<circle cx="16" cy="16" r="15" fill="' + color + '"/>' +
      '</svg>';

    const faviconSvg = 'data:image/svg+xml,' + encodeURIComponent(svgContent);

    console.log('🎨 FAVICON - Generated SVG:', faviconSvg.substring(0, 150) + '...');
    return faviconSvg;
  };

  useEffect(() => {
    console.log('🎨 FAVICON - useEffect triggered:', { isAuthenticated, totalPL });

    if (!isAuthenticated) {
      // Se não autenticado, usar favicon padrão
      console.log('🎨 FAVICON - User not authenticated, using default favicon');
      updateFavicon('/favicon.svg');
      return;
    }

    const updateFaviconBasedOnPL = () => {
      const finalPL = totalPL || 0;

      console.log('🎨 FAVICON - Updating based on PL:', {
        totalPL: finalPL,
        isPositive: finalPL > 0,
        isNegative: finalPL < 0,
        isZero: finalPL === 0
      });

      // Gerar favicon baseado no P&L
      const faviconUrl = generateFaviconWithValue(finalPL);
      console.log('🎨 FAVICON - Generated favicon URL:', faviconUrl.substring(0, 100) + '...');
      updateFavicon(faviconUrl);
    };

    updateFaviconBasedOnPL();
  }, [isAuthenticated, totalPL]);

  return {
    updateFavicon,
    generateFavicon,
    generateFaviconWithValue
  };
};
