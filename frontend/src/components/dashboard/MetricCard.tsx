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
        return 'text-xl'; // 1.25rem
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
        return 'border-success/30 bg-success/5 hover:bg-success/10';
      case 'warning':
        return 'border-warning/30 bg-warning/5 hover:bg-warning/10';
      case 'danger':
        return 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10';
      default:
        return 'card-modern';
    }
  };

  const cardContent = (
    <Card className={cn(getVariantStyles(), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
        {Icon && <Icon className={cn('dashboard-card-icon', getIconColor())} />}
      </CardHeader>
      <CardContent>
        <div className="dashboard-card-value">{value}</div>
        {trend && (
          <div className="flex items-center mt-3">
            <Badge 
              variant="outline" 
              className={cn('text-xs font-semibold px-2 py-1 number-xs', getTrendColor())}
            >
              {trend.value > 0 ? '+' : ''}{trend.value.toFixed(1)}%
            </Badge>
            <span className="text-xs text-vibrant-secondary ml-2 font-medium">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return cardContent;
};

export default MetricCard;
