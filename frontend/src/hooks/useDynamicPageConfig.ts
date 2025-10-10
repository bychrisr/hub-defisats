import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Configuração estática de páginas dinâmicas (temporária)
const DYNAMIC_PAGES_CONFIG = {
  '/dashboard': {
    use_dynamic_title: true,
    use_dynamic_favicon: true,
    custom_title: null,
    custom_favicon_url: null,
  },
  '/automation': {
    use_dynamic_title: true,
    use_dynamic_favicon: true,
    custom_title: null,
    custom_favicon_url: null,
  },
  '/positions': {
    use_dynamic_title: true,
    use_dynamic_favicon: true,
    custom_title: null,
    custom_favicon_url: null,
  },
  '/backtests': {
    use_dynamic_title: true,
    use_dynamic_favicon: true,
    custom_title: null,
    custom_favicon_url: null,
  },
  '/reports': {
    use_dynamic_title: true,
    use_dynamic_favicon: true,
    custom_title: null,
    custom_favicon_url: null,
  },
  '/profile': {
    use_dynamic_title: false,
    use_dynamic_favicon: false,
    custom_title: 'Profile - Axisor',
    custom_favicon_url: '/favicon.svg',
  },
  '/admin': {
    use_dynamic_title: false,
    use_dynamic_favicon: false,
    custom_title: 'Admin Panel - Axisor',
    custom_favicon_url: '/favicon-admin.svg',
  },
  '/admin/menus': {
    use_dynamic_title: false,
    use_dynamic_favicon: false,
    custom_title: 'Menu Management - Axisor',
    custom_favicon_url: '/favicon-admin.svg',
  },
  '/admin/monitoring': {
    use_dynamic_title: false,
    use_dynamic_favicon: false,
    custom_title: 'System Monitoring - Axisor',
    custom_favicon_url: '/favicon-admin.svg',
  },
  '/admin/users': {
    use_dynamic_title: false,
    use_dynamic_favicon: false,
    custom_title: 'User Management - Axisor',
    custom_favicon_url: '/favicon-admin.svg',
  },
  '/admin/coupons': {
    use_dynamic_title: false,
    use_dynamic_favicon: false,
    custom_title: 'Coupon Management - Axisor',
    custom_favicon_url: '/favicon-admin.svg',
  },
  '/admin/alerts': {
    use_dynamic_title: false,
    use_dynamic_favicon: false,
    custom_title: 'Alert Management - Axisor',
    custom_favicon_url: '/favicon-admin.svg',
  },
  '/admin/settings': {
    use_dynamic_title: false,
    use_dynamic_favicon: false,
    custom_title: 'Admin Settings - Axisor',
    custom_favicon_url: '/favicon-admin.svg',
  },
  '/login': {
    use_dynamic_title: false,
    use_dynamic_favicon: false,
    custom_title: 'Login - Axisor',
    custom_favicon_url: '/favicon.svg',
  },
  '/register': {
    use_dynamic_title: false,
    use_dynamic_favicon: false,
    custom_title: 'Register - Axisor',
    custom_favicon_url: '/favicon.svg',
  },
  '/': {
    use_dynamic_title: false,
    use_dynamic_favicon: false,
    custom_title: 'Axisor - LN Markets Automation Platform',
    custom_favicon_url: '/favicon.svg',
  },
};

export interface DynamicPageConfig {
  use_dynamic_title: boolean;
  use_dynamic_favicon: boolean;
  custom_title: string | null;
  custom_favicon_url: string | null;
}

// Hook para obter configuração da página atual
export const useDynamicPageConfig = (): DynamicPageConfig => {
  const location = useLocation();
  const [config, setConfig] = useState<DynamicPageConfig>({
    use_dynamic_title: false,
    use_dynamic_favicon: false,
    custom_title: null,
    custom_favicon_url: null,
  });

  useEffect(() => {
    const currentPath = location.pathname;
    const pageConfig = DYNAMIC_PAGES_CONFIG[currentPath as keyof typeof DYNAMIC_PAGES_CONFIG];
    
    if (pageConfig) {
      setConfig(pageConfig);
    } else {
      // Configuração padrão para páginas não configuradas
      setConfig({
        use_dynamic_title: false,
        use_dynamic_favicon: false,
        custom_title: null,
        custom_favicon_url: null,
      });
    }
  }, [location.pathname]);

  return config;
};

// Hook para verificar se a página atual deve usar título dinâmico
export const useDynamicTitle = (): boolean => {
  const config = useDynamicPageConfig();
  return config.use_dynamic_title;
};

// Hook para verificar se a página atual deve usar favicon dinâmico
export const useDynamicFavicon = (): boolean => {
  const config = useDynamicPageConfig();
  return config.use_dynamic_favicon;
};

// Hook para obter título customizado da página
export const useCustomTitle = (): string | null => {
  const config = useDynamicPageConfig();
  return config.custom_title;
};

// Hook para obter favicon customizado da página
export const useCustomFavicon = (): string | null => {
  const config = useDynamicPageConfig();
  return config.custom_favicon_url;
};
