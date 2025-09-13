import React from 'react';
import { useThemeClasses } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface CoinGeckoCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'header' | 'gradient';
  hover?: boolean;
}

const CoinGeckoCard: React.FC<CoinGeckoCardProps> = ({
  children,
  className,
  variant = 'default',
  hover = true
}) => {
  const themeClasses = useThemeClasses();

  const variantClasses = {
    default: themeClasses.coingeckoCard,
    header: themeClasses.coingeckoHeader,
    gradient: 'bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20'
  };

  return (
    <div
      className={cn(
        'rounded-lg border transition-all duration-300',
        variantClasses[variant],
        hover && 'hover:shadow-coingecko-md',
        themeClasses.transition,
        className
      )}
    >
      {children}
    </div>
  );
};

export default CoinGeckoCard;
