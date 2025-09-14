import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useTotalPL } from './usePositions';

interface FaviconConfig {
  positive: string; // URL ou data URL para P&L positivo
  negative: string; // URL ou data URL para P&L negativo
  neutral: string;  // URL ou data URL para P&L neutro/zero
}

export const useDynamicFavicon = (config?: Partial<FaviconConfig>) => {
  const { isAuthenticated } = useAuthStore();
  const totalPL = useTotalPL();

  // Configuração padrão do favicon
  const defaultConfig: FaviconConfig = {
    positive: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%2300d4aa"/><text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">+</text></svg>',
    negative: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%23ff6b6b"/><text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">-</text></svg>',
    neutral: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="%23666"/><text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">=</text></svg>'
  };

  const faviconConfig = { ...defaultConfig, ...config };

  // Função para atualizar o favicon
  const updateFavicon = (href: string) => {
    // Remover favicons existentes
    const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
    existingFavicons.forEach(favicon => favicon.remove());

    // Criar novo favicon
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = href;
    
    // Adicionar ao head
    document.head.appendChild(link);
    
    // Forçar atualização do favicon com cache busting
    setTimeout(() => {
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = href + '?t=' + Date.now();
      }
    }, 100);
    
    console.log('🎨 FAVICON - Updated favicon:', href);
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

  // Função para gerar favicon com valor específico
  const generateFaviconWithValue = (pl: number) => {
    const isPositive = pl > 0;
    const color = isPositive ? '#00d4aa' : '#ff6b6b';
    const symbol = isPositive ? '+' : '-';
    const value = Math.abs(pl).toFixed(0);
    
    // Limitar o valor para caber no favicon (máximo 3 dígitos)
    const displayValue = value.length > 3 ? '999+' : value;
    
    // Favicon mais elaborado com gradiente e borda
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${isPositive ? '#00b894' : '#e74c3c'};stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#gradient)" stroke="white" stroke-width="1"/>
      <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="11" font-weight="bold" filter="url(#shadow)">${symbol}${displayValue}</text>
    </svg>`;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      // Se não autenticado, usar favicon padrão
      updateFavicon('/favicon.svg');
      return;
    }

    const updateFaviconBasedOnPL = () => {
      const finalPL = totalPL || 0;
      
      console.log('🎨 FAVICON - Updating based on PL:', { totalPL: finalPL });
      
      // Gerar favicon baseado no P&L
      const faviconUrl = generateFaviconWithValue(finalPL);
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
