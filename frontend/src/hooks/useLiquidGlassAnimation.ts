import { useState, useEffect, useCallback } from 'react';

// ===== TYPES =====
export interface LiquidGlassAnimationConfig {
  variant: 'success' | 'danger' | 'neutral' | 'info' | 'default';
  value: number;
  isPositive?: boolean;
  isNegative?: boolean;
  isNeutral?: boolean;
}

export interface LiquidGlassAnimationState {
  isHovered: boolean;
  isNearby: boolean;
  animationClass: string;
  dynamicStyle: React.CSSProperties;
  shouldBreathe: boolean;
  intensity: number;
}

// ===== HOOK =====
export const useLiquidGlassAnimation = (config: LiquidGlassAnimationConfig) => {
  const {
    variant,
    value,
    isPositive = value > 0,
    isNegative = value < 0,
    isNeutral = value === 0
  } = config;

  // ===== STATE =====
  const [isHovered, setIsHovered] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [intensity, setIntensity] = useState(1);
  const [shouldBreathe, setShouldBreathe] = useState(false);

  // ===== CALCULATE INTENSITY =====
  useEffect(() => {
    if (isNeutral) {
      setIntensity(0.5);
      setShouldBreathe(false);
    } else if (isPositive) {
      setIntensity(Math.min(Math.abs(value) / 1000, 1)); // Normalize to 0-1
      setShouldBreathe(value > 500); // Breathe for significant gains
    } else if (isNegative) {
      setIntensity(Math.min(Math.abs(value) / 1000, 1));
      setShouldBreathe(Math.abs(value) > 500); // Breathe for significant losses
    }
  }, [value, isPositive, isNegative, isNeutral]);

  // ===== ANIMATION CLASS COMPUTATION =====
  const animationClass = useCallback(() => {
    const classes = [];
    
    // Base animation
    classes.push('liquid-glass-morph');
    
    // Breathing effect
    if (shouldBreathe) {
      classes.push('liquid-glass-breathe');
    }
    
    // Hover state
    if (isHovered) {
      classes.push('hover:scale-105');
    }
    
    // Nearby state (for morphing with adjacent cards)
    if (isNearby) {
      classes.push('hover:scale-102');
    }
    
    return classes.join(' ');
  }, [isHovered, isNearby, shouldBreathe]);

  // ===== DYNAMIC STYLE COMPUTATION =====
  const dynamicStyle = useCallback((): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      '--animation-intensity': intensity,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    // Color intensity based on value
    if (isPositive) {
      baseStyle['--glow-color'] = `rgba(34, 197, 94, ${0.1 + intensity * 0.1})`;
      baseStyle['--border-color'] = `rgba(34, 197, 94, ${0.2 + intensity * 0.1})`;
    } else if (isNegative) {
      baseStyle['--glow-color'] = `rgba(239, 68, 68, ${0.1 + intensity * 0.1})`;
      baseStyle['--border-color'] = `rgba(239, 68, 68, ${0.2 + intensity * 0.1})`;
    } else {
      baseStyle['--glow-color'] = `rgba(156, 163, 175, 0.1)`;
      baseStyle['--border-color'] = `rgba(156, 163, 175, 0.2)`;
    }

    // Hover enhancement
    if (isHovered) {
      baseStyle.transform = 'translateY(-2px)';
      baseStyle.boxShadow = `0 12px 48px ${baseStyle['--glow-color']}`;
    }

    return baseStyle;
  }, [intensity, isPositive, isNegative, isHovered]);

  // ===== EVENT HANDLERS =====
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    // Calculate distance from center for subtle parallax effect
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.sqrt(
      Math.pow(event.clientX - centerX, 2) + Math.pow(event.clientY - centerY, 2)
    );
    
    // Normalize distance to 0-1
    const normalizedDistance = Math.min(distance / (rect.width / 2), 1);
    setIntensity(prev => Math.max(prev, 1 - normalizedDistance * 0.3));
  }, []);

  // ===== PROXIMITY DETECTION =====
  const setNearby = useCallback((nearby: boolean) => {
    setIsNearby(nearby);
  }, []);

  // ===== RETURN STATE =====
  return {
    // State
    isHovered,
    isNearby,
    intensity,
    shouldBreathe,
    
    // Computed
    animationClass: animationClass(),
    dynamicStyle: dynamicStyle(),
    
    // Handlers
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onMouseMove: handleMouseMove,
    setNearby,
    
    // Utilities
    getGlowIntensity: () => intensity,
    shouldAnimate: shouldBreathe || isHovered,
    getVariantIntensity: () => {
      if (isPositive) return `success-${Math.floor(intensity * 5)}`;
      if (isNegative) return `danger-${Math.floor(intensity * 5)}`;
      return 'neutral';
    }
  };
};

// ===== EXPORT =====
export default useLiquidGlassAnimation;
