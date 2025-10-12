import React, { useState, useEffect } from 'react';

interface SatsIconProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'positive' | 'negative' | 'neutral' | 'dynamic';
  forceColor?: boolean; // Força a cor do className a sobrescrever a variante
  value?: number; // Valor para animação dinâmica
  animate?: boolean; // Se deve animar mudanças de cor
  pulseOnChange?: boolean; // Se deve pulsar quando o valor muda
}

const SatsIcon: React.FC<SatsIconProps> = ({ 
  size = 20, 
  className = '', 
  variant = 'default',
  forceColor = false,
  value = 0,
  animate = true,
  pulseOnChange = true
}) => {
  const [isPulsing, setIsPulsing] = useState(false);
  const [previousValue, setPreviousValue] = useState(value);

  // Detectar mudanças no valor para animação de pulse
  useEffect(() => {
    if (pulseOnChange && value !== previousValue && previousValue !== undefined) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 600);
      return () => clearTimeout(timer);
    }
    setPreviousValue(value);
  }, [value, previousValue, pulseOnChange]);

  const getVariantClass = () => {
    if (forceColor) return ''; // Não aplica cor da variante se forceColor for true
    
    switch (variant) {
      case 'positive':
        return 'text-green-600 dark:text-green-400';
      case 'negative':
        return 'text-red-600 dark:text-red-400';
      case 'neutral':
        return 'text-muted-foreground';
      case 'dynamic':
        // Cor dinâmica baseada no valor
        if (value > 0) return 'text-green-600 dark:text-green-400';
        if (value < 0) return 'text-red-600 dark:text-red-400';
        return 'text-muted-foreground';
      default:
        return 'text-current';
    }
  };

  const getAnimationClass = () => {
    const classes = [];
    
    if (animate) {
      classes.push('transition-colors duration-300 ease-out');
    }
    
    if (isPulsing) {
      classes.push('animate-pulse');
    }
    
    if (variant === 'dynamic' && Math.abs(value) > 1000) {
      classes.push('drop-shadow-lg');
    }
    
    return classes.join(' ');
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${getVariantClass()} ${getAnimationClass()} ${className} ${forceColor ? '!text-current' : ''}`}
      style={{
        filter: variant === 'dynamic' && Math.abs(value) > 5000 ? 'drop-shadow(0 0 8px currentColor)' : undefined
      }}
    >
      {/* Símbolo oficial de satoshi - baseado no código SVG oficial */}
      {/* Barra superior - quadrada */}
      <path fillRule="evenodd" clipRule="evenodd" d="M12.75 3V5.5H11.25V3H12.75Z" fill="currentColor" />
      
      {/* Linha longa superior */}
      <path fillRule="evenodd" clipRule="evenodd" d="M17 8.75H7V7.25H17V8.75Z" fill="currentColor" />
      
      {/* Linha longa central */}
      <path fillRule="evenodd" clipRule="evenodd" d="M17 12.7499H7V11.2499H17V12.7499Z" fill="currentColor" />
      
      {/* Linha longa inferior */}
      <path fillRule="evenodd" clipRule="evenodd" d="M17 16.75H7V15.25H17V16.75Z" fill="currentColor" />
      
      {/* Barra inferior - quadrada */}
      <path fillRule="evenodd" clipRule="evenodd" d="M12.75 18.5V21H11.25V18.5H12.75Z" fill="currentColor" />
    </svg>
  );
};

export default SatsIcon;
