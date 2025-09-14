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
    if (isNeutral) return 'border-border bg-card';
    return isPositive 
      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
  };

  const getTextColor = () => {
    if (isNeutral) return 'text-foreground';
    return isPositive 
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <Card className={cn(getVariantStyles(), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          {title}
        </CardTitle>
        {Icon ? (
          <Icon className="h-4 w-4 text-muted-foreground" />
        ) : (
          isPositive ? (
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : isNeutral ? null : (
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          )
        )}
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', getTextColor())}>
          {formatSats(pnl, { size: 20, variant: 'auto' })}
        </div>
        {percentage !== undefined && (
          <div className="flex items-center mt-1">
            <Badge 
              variant="outline" 
              className={cn('text-xs', getTextColor())}
            >
              {formatPercentage(percentage)}
            </Badge>
          </div>
        )}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default PnLCard;
