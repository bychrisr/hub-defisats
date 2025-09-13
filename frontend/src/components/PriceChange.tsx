import React from 'react';
import { useThemeClasses } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface PriceChangeProps {
  value: number;
  showSign?: boolean;
  showIcon?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const PriceChange: React.FC<PriceChangeProps> = ({
  value,
  showSign = true,
  showIcon = true,
  className,
  size = 'md'
}) => {
  const themeClasses = useThemeClasses();
  const isPositive = value >= 0;
  const isZero = value === 0;
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const formatValue = (val: number) => {
    const sign = showSign && val > 0 ? '+' : '';
    return `${sign}${val.toFixed(2)}%`;
  };

  const getIcon = () => {
    if (isZero) return null;
    return isPositive ? '↗' : '↘';
  };

  const getColorClass = () => {
    if (isZero) return themeClasses.textSecondary;
    return isPositive ? themeClasses.coingeckoPositive : themeClasses.coingeckoNegative;
  };

  return (
    <span
      className={cn(
        'font-medium inline-flex items-center gap-1',
        sizeClasses[size],
        getColorClass(),
        className
      )}
    >
      {showIcon && !isZero && (
        <span className="text-xs">
          {getIcon()}
        </span>
      )}
      {formatValue(value)}
    </span>
  );
};

export default PriceChange;
