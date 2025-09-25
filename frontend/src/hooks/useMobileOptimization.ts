import { useState, useEffect } from 'react';

interface MobileOptimizationConfig {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  orientation: 'portrait' | 'landscape';
  touchSupport: boolean;
  reducedMotion: boolean;
  darkMode: boolean;
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'unknown';
  memoryInfo?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export const useMobileOptimization = (): MobileOptimizationConfig => {
  const [config, setConfig] = useState<MobileOptimizationConfig>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    screenWidth: 0,
    screenHeight: 0,
    devicePixelRatio: 1,
    orientation: 'portrait',
    touchSupport: false,
    reducedMotion: false,
    darkMode: false,
    connectionType: 'unknown',
  });

  useEffect(() => {
    const updateConfig = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const pixelRatio = window.devicePixelRatio || 1;
      
      // Detectar tipo de dispositivo
      const isMobile = width <= 768;
      const isTablet = width > 768 && width <= 1024;
      const isDesktop = width > 1024;
      
      // Detectar orientação
      const orientation = width > height ? 'landscape' : 'portrait';
      
      // Detectar suporte a touch
      const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Detectar preferência de movimento reduzido
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Detectar modo escuro
      const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      // Detectar tipo de conexão
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      let connectionType: MobileOptimizationConfig['connectionType'] = 'unknown';
      
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g') connectionType = 'slow-2g';
        else if (effectiveType === '2g') connectionType = '2g';
        else if (effectiveType === '3g') connectionType = '3g';
        else if (effectiveType === '4g') connectionType = '4g';
        else if (effectiveType === '5g') connectionType = '5g';
      }
      
      // Informações de memória (se disponível)
      let memoryInfo: MobileOptimizationConfig['memoryInfo'] | undefined;
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryInfo = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
      }
      
      setConfig({
        isMobile,
        isTablet,
        isDesktop,
        screenWidth: width,
        screenHeight: height,
        devicePixelRatio: pixelRatio,
        orientation,
        touchSupport,
        reducedMotion,
        darkMode,
        connectionType,
        memoryInfo,
      });
    };

    // Atualizar configuração inicial
    updateConfig();

    // Listeners para mudanças
    const handleResize = () => updateConfig();
    const handleOrientationChange = () => {
      // Delay para aguardar a mudança de orientação
      setTimeout(updateConfig, 100);
    };

    // Media query listeners
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const colorSchemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleMotionChange = () => updateConfig();
    const handleColorSchemeChange = () => updateConfig();

    // Adicionar listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    motionMediaQuery.addEventListener('change', handleMotionChange);
    colorSchemeMediaQuery.addEventListener('change', handleColorSchemeChange);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      motionMediaQuery.removeEventListener('change', handleMotionChange);
      colorSchemeMediaQuery.removeEventListener('change', handleColorSchemeChange);
    };
  }, []);

  return config;
};

// Hook para otimizações específicas baseadas no dispositivo
export const useMobileOptimizations = () => {
  const config = useMobileOptimization();

  // Configurações de performance baseadas no dispositivo
  const getPerformanceConfig = () => {
    if (config.isMobile && config.connectionType === 'slow-2g') {
      return {
        imageQuality: 'low',
        animationDuration: 200,
        enableAnimations: false,
        enableBlur: false,
        enableShadows: false,
        enableGradients: false,
        maxConcurrentRequests: 2,
        cacheTimeout: 300000, // 5 minutos
      };
    } else if (config.isMobile) {
      return {
        imageQuality: 'medium',
        animationDuration: 300,
        enableAnimations: !config.reducedMotion,
        enableBlur: true,
        enableShadows: true,
        enableGradients: true,
        maxConcurrentRequests: 4,
        cacheTimeout: 600000, // 10 minutos
      };
    } else {
      return {
        imageQuality: 'high',
        animationDuration: 500,
        enableAnimations: !config.reducedMotion,
        enableBlur: true,
        enableShadows: true,
        enableGradients: true,
        maxConcurrentRequests: 8,
        cacheTimeout: 900000, // 15 minutos
      };
    }
  };

  // Configurações de UI baseadas no dispositivo
  const getUIConfig = () => {
    if (config.isMobile) {
      return {
        compactMode: true,
        showLabels: false,
        iconSize: 'sm',
        spacing: 'compact',
        fontSize: 'sm',
        showTooltips: false,
        enableHover: false,
        touchTargetSize: 44, // Mínimo recomendado para touch
      };
    } else if (config.isTablet) {
      return {
        compactMode: false,
        showLabels: true,
        iconSize: 'md',
        spacing: 'normal',
        fontSize: 'md',
        showTooltips: true,
        enableHover: true,
        touchTargetSize: 40,
      };
    } else {
      return {
        compactMode: false,
        showLabels: true,
        iconSize: 'lg',
        spacing: 'normal',
        fontSize: 'lg',
        showTooltips: true,
        enableHover: true,
        touchTargetSize: 32,
      };
    }
  };

  // Configurações de layout baseadas no dispositivo
  const getLayoutConfig = () => {
    if (config.isMobile) {
      return {
        columns: 1,
        sidebarCollapsed: true,
        showBreadcrumbs: false,
        enableStickyHeaders: true,
        enableInfiniteScroll: true,
        itemsPerPage: 10,
        enableVirtualization: true,
      };
    } else if (config.isTablet) {
      return {
        columns: 2,
        sidebarCollapsed: false,
        showBreadcrumbs: true,
        enableStickyHeaders: true,
        enableInfiniteScroll: false,
        itemsPerPage: 20,
        enableVirtualization: false,
      };
    } else {
      return {
        columns: 3,
        sidebarCollapsed: false,
        showBreadcrumbs: true,
        enableStickyHeaders: false,
        enableInfiniteScroll: false,
        itemsPerPage: 30,
        enableVirtualization: false,
      };
    }
  };

  return {
    config,
    performance: getPerformanceConfig(),
    ui: getUIConfig(),
    layout: getLayoutConfig(),
  };
};
