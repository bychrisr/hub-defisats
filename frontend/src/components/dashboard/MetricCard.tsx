import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip } from '@/components/ui/tooltip';
import { LucideIcon, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTooltips } from '@/hooks/useTooltips';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
  cardKey?: string; // Chave para identificar o card e buscar tooltip
  titleSize?: 'sm' | 'base' | 'lg';
  floatingIcon?: boolean;
  cursor?: 'default' | 'pointer' | 'auto';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  cardKey,
  titleSize = 'sm',
  floatingIcon = false,
  cursor = 'auto',
}) => {
  const { getTooltipText, getTooltipPosition, isTooltipEnabled } = useTooltips();
  
  const tooltipText = cardKey ? getTooltipText(cardKey) : null;
  const tooltipPosition = cardKey ? getTooltipPosition(cardKey) : 'top';
  const showTooltip = cardKey ? isTooltipEnabled(cardKey) : false;
  
  // Debug log
  if (cardKey) {
    console.log(`🎯 METRIC CARD [${cardKey}]:`, {
      tooltipText,
      tooltipPosition,
      showTooltip,
      hasTooltipText: !!tooltipText
    });
  }

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.value > 0) return 'text-success font-semibold';
    if (trend.value < 0) return 'text-destructive font-semibold';
    return 'text-muted-foreground';
  };

  const getIconColor = () => {
    switch (variant) {
      case 'success':
        return 'icon-success';
      case 'warning':
        return 'icon-warning';
      case 'danger':
        return 'icon-danger';
      default:
        return 'icon-primary';
    }
  };

  const getTitleSizeClass = () => {
    switch (titleSize) {
      case 'lg':
        return 'text-lg'; // 1.125rem
      case 'base':
        return 'text-sm';
      case 'sm':
      default:
        return 'text-sm';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return '!border-success !bg-success/5 hover:!bg-success/10 !bg-gradient-to-br !from-success/10 !to-success/5';
      case 'warning':
        return '!border-warning !bg-warning/5 hover:!bg-warning/10 !bg-gradient-to-br !from-warning/10 !to-warning/5';
      case 'danger':
        return '!border-destructive !bg-destructive/5 hover:!bg-destructive/10 !bg-gradient-to-br !from-destructive/10 !to-destructive/5';
      default:
        return 'card-modern';
    }
  };

  return (
    <div className="relative h-full">
      <Card className={cn(getVariantStyles(), `cursor-${cursor}`, 'dashboard-card h-full', className)}>
        <CardHeader className="dashboard-card-header pr-12">
          <CardTitle className={cn('dashboard-card-title', getTitleSizeClass())}>
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
          {!floatingIcon && Icon && <Icon className={cn('dashboard-card-icon', getIconColor())} />}
        </CardHeader>
        <CardContent className="dashboard-card-content">
          <div className="dashboard-card-value">{value}</div>
          {trend && (
            <div className="flex items-center mt-3">
              <Badge 
                variant="outline" 
                className={cn('text-xs font-semibold px-2 py-1 number-xs border-[#2A3441]', getTrendColor())}
              >
                {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
              </Badge>
              <span className="text-xs text-[#B8BCC8] ml-2 font-medium">
                {trend.label}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quadrado "meio para fora" - Dentro do container principal */}
      {floatingIcon && Icon && (
        <div 
          className="absolute w-10 h-10 bg-[#1A1F2E] border border-[#2A3441] rounded-lg shadow-lg flex items-center justify-center p-2 z-0"
          style={{ right: '0.60rem', top: '-1.4rem' }}
        >
          <Icon className={cn('h-5 w-5', getIconColor())} />
        </div>
      )}
    </div>
  );
};

export default MetricCard;
