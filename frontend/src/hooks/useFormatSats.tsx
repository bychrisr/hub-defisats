import React from 'react';
import SatsIcon from '@/components/SatsIcon';

interface FormatSatsOptions {
  size?: number;
  showIcon?: boolean;
  variant?: 'auto' | 'positive' | 'negative' | 'neutral' | 'default';
}

export const useFormatSats = () => {
  const formatSats = (
    value: number, 
    options: FormatSatsOptions = {}
  ): React.ReactNode => {
    const { 
      size = 28, 
      showIcon = true, 
      variant = 'auto' 
    } = options;

    // Determinar variante automaticamente se 'auto'
    let iconVariant: 'default' | 'positive' | 'negative' | 'neutral' = 'default';
    
    if (variant === 'auto') {
      if (value > 0) iconVariant = 'positive';
      else if (value < 0) iconVariant = 'negative';
      else iconVariant = 'neutral';
    } else {
      iconVariant = variant;
    }

    // Formatação do número
    let formattedNumber: string;
    if (value === 0) {
      formattedNumber = '0';
    } else if (Math.abs(value) < 1000000) {
      formattedNumber = value.toLocaleString();
    } else {
      formattedNumber = `${Math.round(value / 1000000)}M`;
    }

    if (!showIcon) {
      return formattedNumber;
    }

    return (
      <span className="flex items-center gap-1">
        {formattedNumber}
        <SatsIcon size={size} variant={iconVariant} />
      </span>
    );
  };

  return { formatSats };
};

// Hook para formatação simples (apenas texto)
export const useFormatSatsText = () => {
  return (value: number): string => {
    if (value === 0) return '0 sats';
    if (Math.abs(value) < 1000000) return `${value.toLocaleString()} sats`;
    return `${Math.round(value / 1000000)}M sats`;
  };
};
