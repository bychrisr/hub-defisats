import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useMobileOptimizations } from '@/hooks/useMobileOptimization';
import { useTheme } from '@/contexts/ThemeContext';

interface MobileOptimizedLayoutProps {
  children: ReactNode;
  className?: string;
  enableMobileOptimizations?: boolean;
}

export const MobileOptimizedLayout = ({ 
  children, 
  className,
  enableMobileOptimizations = true 
}: MobileOptimizedLayoutProps) => {
  const { theme } = useTheme();
  const { config, performance, ui, layout } = useMobileOptimizations();

  // Aplicar otimizações baseadas no dispositivo
  const getOptimizedStyles = () => {
    if (!enableMobileOptimizations) return {};

    const styles: React.CSSProperties = {};

    // Otimizações de performance para dispositivos móveis
    if (config.isMobile) {
      // Reduzir qualidade de imagens em conexões lentas
      if (config.connectionType === 'slow-2g' || config.connectionType === '2g') {
        styles.imageRendering = 'pixelated';
      }

      // Otimizar para touch
      if (config.touchSupport) {
        styles.touchAction = 'manipulation';
        styles.webkitTouchCallout = 'none';
        styles.webkitUserSelect = 'none';
        styles.userSelect = 'none';
      }

      // Reduzir movimento se preferido
      if (config.reducedMotion) {
        styles.transition = 'none';
        styles.animation = 'none';
      }
    }

    return styles;
  };

  const getOptimizedClasses = () => {
    const classes = [];

    // Classes baseadas no tipo de dispositivo
    if (config.isMobile) {
      classes.push('mobile-optimized');
      if (ui.compactMode) classes.push('compact-mode');
      if (ui.enableHover === false) classes.push('no-hover');
    } else if (config.isTablet) {
      classes.push('tablet-optimized');
    } else {
      classes.push('desktop-optimized');
    }

    // Classes baseadas na orientação
    if (config.orientation === 'landscape') {
      classes.push('landscape-mode');
    } else {
      classes.push('portrait-mode');
    }

    // Classes baseadas na conexão
    if (config.connectionType === 'slow-2g' || config.connectionType === '2g') {
      classes.push('slow-connection');
    }

    // Classes baseadas no tema
    if (theme === 'dark') {
      classes.push('dark-theme');
    } else {
      classes.push('light-theme');
    }

    return classes.join(' ');
  };

  return (
    <div
      className={cn(
        'mobile-optimized-layout',
        getOptimizedClasses(),
        className
      )}
      style={getOptimizedStyles()}
      data-device-type={config.isMobile ? 'mobile' : config.isTablet ? 'tablet' : 'desktop'}
      data-orientation={config.orientation}
      data-connection-type={config.connectionType}
      data-touch-support={config.touchSupport}
      data-reduced-motion={config.reducedMotion}
    >
      {children}
    </div>
  );
};

// Componente para otimizar imagens baseado no dispositivo
interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}

export const OptimizedImage = ({ src, alt, className, fallback }: OptimizedImageProps) => {
  const { config, performance } = useMobileOptimizations();

  const getImageSrc = () => {
    // Em conexões lentas, usar imagem de baixa qualidade
    if (config.connectionType === 'slow-2g' || config.connectionType === '2g') {
      return fallback || src;
    }
    return src;
  };

  const getImageStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};

    if (config.isMobile) {
      // Otimizar para mobile
      style.maxWidth = '100%';
      style.height = 'auto';
      
      // Reduzir qualidade em conexões lentas
      if (config.connectionType === 'slow-2g' || config.connectionType === '2g') {
        style.imageRendering = 'pixelated';
        style.filter = 'blur(0.5px)';
      }
    }

    return style;
  };

  return (
    <img
      src={getImageSrc()}
      alt={alt}
      className={className}
      style={getImageStyle()}
      loading="lazy"
      decoding="async"
    />
  );
};

// Componente para otimizar animações baseado no dispositivo
interface OptimizedAnimationProps {
  children: ReactNode;
  animation?: string;
  duration?: number;
  className?: string;
}

export const OptimizedAnimation = ({ 
  children, 
  animation = 'fadeIn',
  duration,
  className 
}: OptimizedAnimationProps) => {
  const { config, performance } = useMobileOptimizations();

  const getAnimationStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};

    // Desabilitar animações se preferido pelo usuário
    if (config.reducedMotion) {
      return style;
    }

    // Ajustar duração baseada no dispositivo
    const animationDuration = duration || performance.animationDuration;
    style.animationDuration = `${animationDuration}ms`;

    // Reduzir animações em conexões lentas
    if (config.connectionType === 'slow-2g' || config.connectionType === '2g') {
      style.animationDuration = '100ms';
    }

    return style;
  };

  const getAnimationClass = () => {
    if (config.reducedMotion) return '';
    return `animate-${animation}`;
  };

  return (
    <div
      className={cn(getAnimationClass(), className)}
      style={getAnimationStyle()}
    >
      {children}
    </div>
  );
};

// Hook para otimizar componentes baseado no dispositivo
export const useOptimizedComponent = () => {
  const { config, performance, ui, layout } = useMobileOptimizations();

  const getComponentProps = (componentType: string) => {
    const baseProps: Record<string, any> = {};

    switch (componentType) {
      case 'button':
        return {
          ...baseProps,
          size: ui.touchTargetSize >= 44 ? 'lg' : 'md',
          className: config.isMobile ? 'touch-optimized' : '',
        };

      case 'card':
        return {
          ...baseProps,
          className: config.isMobile ? 'mobile-card' : 'desktop-card',
          padding: ui.spacing === 'compact' ? 'sm' : 'md',
        };

      case 'modal':
        return {
          ...baseProps,
          fullScreen: config.isMobile,
          className: config.isMobile ? 'mobile-modal' : 'desktop-modal',
        };

      case 'table':
        return {
          ...baseProps,
          compact: ui.compactMode,
          enableVirtualization: layout.enableVirtualization,
          itemsPerPage: layout.itemsPerPage,
        };

      default:
        return baseProps;
    }
  };

  return {
    config,
    performance,
    ui,
    layout,
    getComponentProps,
  };
};
