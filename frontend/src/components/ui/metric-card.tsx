import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral' | 'warning';
  };
  icon?: LucideIcon;
  className?: string;
}

export const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  className,
}: MetricCardProps) => {
  return (
    <Card className={cn('card-gradient', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p
            className={cn('text-xs', {
              'text-success': change.type === 'positive',
              'text-destructive': change.type === 'negative',
              'text-muted-foreground': change.type === 'neutral',
              'text-warning': change.type === 'warning',
            })}
          >
            {change.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
