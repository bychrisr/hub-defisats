import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  isLoading?: boolean;
  className?: string;
}

// ✅ COMPONENTE OTIMIZADO COM REACT.MEMO
const DashboardCard = memo<DashboardCardProps>(({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = 'default',
  isLoading = false,
  className 
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'gradient-card-green backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl';
      case 'danger':
        return 'gradient-card-red backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl';
      case 'warning':
        return 'gradient-card-yellow backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl';
      default:
        return 'gradient-card-blue backdrop-blur-xl bg-card/30 border-border/50 shadow-2xl transition-all duration-300 hover:shadow-3xl';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'success':
        return 'text-green-500';
      case 'danger':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      default:
        return 'text-primary';
    }
  };

  return (
    <Card className={cn(
      getVariantStyles(),
      isLoading ? 'opacity-75' : 'opacity-100',
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Icon className={cn("h-4 w-4", getIconColor())} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-text-primary">
          {isLoading ? '...' : value}
        </div>
        {subtitle && (
          <p className="text-xs text-text-secondary mt-1">
            {subtitle}
          </p>
        )}
      </CardContent>
    </Card>
  );
});

DashboardCard.displayName = 'DashboardCard';

export default DashboardCard;
