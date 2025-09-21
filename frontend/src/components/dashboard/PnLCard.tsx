import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, LucideIcon, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormatSats } from '@/hooks/useFormatSats';
import { useTooltips } from '@/hooks/useTooltips';

interface PnLCardProps {
  title: string;
  pnl: number;
  percentage?: number;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
  titleSize?: 'sm' | 'base' | 'lg';
  cardKey?: string; // Chave para identificar o card e buscar tooltip
  cursor?: 'default' | 'pointer' | 'auto';
  variant?: 'default' | 'neutral'; // neutral = sempre estilo padrão
  showSatsIcon?: boolean; // Mostrar ou não o SatsIcon
  floatingIcon?: boolean; // Ícone em quadrado "meio para fora"
}

export const PnLCard: React.FC<PnLCardProps> = ({
  title,
  pnl,
  percentage,
  subtitle,
  icon: Icon,
  className,
  titleSize = 'sm',
  cardKey,
  cursor = 'auto',
  variant = 'default',
  showSatsIcon = true,
  floatingIcon = false,
}) => {
  const { formatSats } = useFormatSats();
  const { getTooltipText, getTooltipPosition, isTooltipEnabled } = useTooltips();
  
  const tooltipText = cardKey ? getTooltipText(cardKey) : null;
  const tooltipPosition = cardKey ? getTooltipPosition(cardKey) : 'top';
  const showTooltip = cardKey ? isTooltipEnabled(cardKey) : false;
  
  const isPositive = pnl >= 0;
  const isNeutral = pnl === 0;
  
  const getVariantStyles = () => {
    if (variant === 'neutral') {
      return 'card-neutral'; // Estilo específico sem padding duplo
    }
    
    if (isNeutral) return 'card-modern';
    
    return isPositive 
      ? '!border-success !bg-success/5 hover:!bg-success/10 !bg-gradient-to-br !from-success/10 !to-success/5'
      : '!border-destructive !bg-destructive/5 hover:!bg-destructive/10 !bg-gradient-to-br !from-destructive/10 !to-destructive/5';
  };

  const getTextColor = () => {
    if (variant === 'neutral') {
      return 'text-vibrant'; // Sempre cor padrão
    }
    
    if (isNeutral) return 'text-vibrant';
    return isPositive 
      ? 'text-success font-bold'
      : 'text-destructive font-bold';
  };

  const getIconColor = () => {
    if (variant === 'neutral') {
      return 'icon-primary'; // Sempre cor primária
    }
    
    if (isNeutral) return 'icon-primary';
    return isPositive ? 'icon-success' : 'icon-danger';
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getTitleSizeClass = () => {
    switch (titleSize) {
      case 'lg':
        return 'text-lg dashboard-card-title'; // 1.125rem + mobile responsive
      case 'base':
        return 'text-sm dashboard-card-title';
      case 'sm':
      default:
        return 'text-sm dashboard-card-title';
    }
  };

  return (
    <div className="relative h-full">
      <Card className={cn('dashboard-card h-full', getVariantStyles(), `cursor-${cursor}`, className)}>
        <CardHeader className="dashboard-card-header pr-12">
          <CardTitle className={cn('font-semibold text-vibrant-secondary', getTitleSizeClass())}>
            {title}
            {showTooltip && tooltipText && (
              <Tooltip
                content={tooltipText}
                position={tooltipPosition}
                disabled={!showTooltip}
              >
                <HelpCircle className="dashboard-card-help-icon" />
              </Tooltip>
            )}
          </CardTitle>
          {!floatingIcon && Icon ? (
            <Icon className={cn('dashboard-card-icon', getIconColor())} />
          ) : !floatingIcon && (
            isPositive ? (
              <TrendingUp className={cn('dashboard-card-icon', getIconColor())} />
            ) : isNeutral ? null : (
              <TrendingDown className={cn('dashboard-card-icon', getIconColor())} />
            )
          )}
        </CardHeader>
        <CardContent className="dashboard-card-content">
          <div className="flex items-center gap-2">
            <div className={cn('number-lg dashboard-card-value', getTextColor())}>
              {showSatsIcon ? formatSats(pnl, { size: 28, variant: variant === 'neutral' ? 'neutral' : 'auto' }) : pnl.toString()}
            </div>
            {percentage !== undefined && (
              <Badge 
                variant="outline" 
                className={cn('text-xs font-semibold px-2 py-1 number-xs dashboard-card-badge', getTextColor())}
              >
                {formatPercentage(percentage)}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="dashboard-card-subtitle">{subtitle}</p>
          )}
        </CardContent>
      </Card>
      
      {/* Quadrado "meio para fora" - Dentro do container principal */}
      {floatingIcon && Icon && (
        <div 
          className="absolute w-10 h-10 bg-card border border-border rounded-lg shadow-lg flex items-center justify-center p-2 z-0 dashboard-card-floating-icon"
          style={{ right: '0.60rem', top: '-1.4rem' }}
        >
          <Icon className={cn('h-5 w-5', getIconColor())} />
        </div>
      )}
    </div>
  );
};

export default PnLCard;
