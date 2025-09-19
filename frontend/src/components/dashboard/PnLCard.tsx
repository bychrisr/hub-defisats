import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormatSats } from '@/hooks/useFormatSats';

interface PnLCardProps {
  title: string;
  pnl: number;
  percentage?: number;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
}

export const PnLCard: React.FC<PnLCardProps> = ({
  title,
  pnl,
  percentage,
  subtitle,
  icon: Icon,
  className,
}) => {
  const { formatSats } = useFormatSats();
  const isPositive = pnl >= 0;
  const isNeutral = pnl === 0;
  
  const getVariantStyles = () => {
    if (isNeutral) return 'card-modern';
    return isPositive 
      ? 'border-success/30 bg-success/5 hover:bg-success/10'
      : 'border-destructive/30 bg-destructive/5 hover:bg-destructive/10';
  };

  const getTextColor = () => {
    if (isNeutral) return 'text-vibrant';
    return isPositive 
      ? 'text-success font-bold'
      : 'text-destructive font-bold';
  };

  const getIconColor = () => {
    if (isNeutral) return 'icon-primary';
    return isPositive ? 'icon-success' : 'icon-danger';
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <Card className={cn(getVariantStyles(), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-vibrant-secondary">
          {title}
        </CardTitle>
        {Icon ? (
          <Icon className={cn('h-5 w-5', getIconColor())} />
        ) : (
          isPositive ? (
            <TrendingUp className={cn('h-5 w-5', getIconColor())} />
          ) : isNeutral ? null : (
            <TrendingDown className={cn('h-5 w-5', getIconColor())} />
          )
        )}
      </CardHeader>
      <CardContent>
        <div className={cn('number-lg', getTextColor())}>
          {formatSats(pnl, { size: 28, variant: 'auto' })}
        </div>
        {percentage !== undefined && (
          <div className="flex items-center mt-2">
            <Badge 
              variant="outline" 
              className={cn('text-xs font-semibold px-2 py-1 number-xs', getTextColor())}
            >
              {formatPercentage(percentage)}
            </Badge>
          </div>
        )}
        {subtitle && (
          <p className="text-sm text-vibrant-secondary mt-2 font-medium">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PnLCard;
