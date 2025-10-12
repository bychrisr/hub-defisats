import React from 'react';
import { LucideIcon } from 'lucide-react';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidGlassTooltip } from '@/components/ui/LiquidGlassTooltip';
import { Badge } from '@/components/ui/badge';
import { useLiquidGlassAnimation } from '@/hooks/useLiquidGlassAnimation';
import { useFormatSats } from '@/hooks/useFormatSats';
import SatsIcon from '@/components/SatsIcon';
import { cn } from '@/lib/utils';

// ===== INTERFACES =====
export interface MetricMiniCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: LucideIcon;
  variant?: 'success' | 'danger' | 'neutral' | 'info' | 'default';
  formatAsSats?: boolean;
  showSatsIcon?: boolean;
  tooltip?: string;
  badges?: Array<{
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    color?: 'green' | 'red' | 'blue' | 'gray';
  }>;
  className?: string;
  size?: 'small' | 'medium';
}

// ===== VARIANT MAPPING =====
const getVariantFromValue = (value: number | string): 'success' | 'danger' | 'neutral' | 'info' | 'default' => {
  if (typeof value === 'string') return 'default';
  
  if (value > 0) return 'success';
  if (value < 0) return 'danger';
  return 'neutral';
};

// ===== BADGE COLOR CLASSES =====
const badgeColorClasses = {
  green: 'border-green-400/60 text-green-200 bg-green-600/20',
  red: 'border-red-400/60 text-red-200 bg-red-600/20',
  blue: 'border-blue-400/60 text-blue-200 bg-blue-600/20',
  gray: 'border-gray-400/60 text-gray-200 bg-gray-600/20'
};

// ===== COMPONENT =====
export const MetricMiniCard: React.FC<MetricMiniCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant,
  formatAsSats = false,
  showSatsIcon = false,
  tooltip = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  badges = [],
  className,
  size = 'small'
}) => {
  // ===== COMPUTED VALUES =====
  const computedVariant = variant || getVariantFromValue(value);
  const numericValue = typeof value === 'number' ? value : 0;
  
  // ===== ANIMATION HOOK =====
  const animation = useLiquidGlassAnimation({
    variant: computedVariant,
    value: numericValue,
    isPositive: numericValue > 0,
    isNegative: numericValue < 0,
    isNeutral: numericValue === 0
  });

  // ===== FORMATTING =====
  const { formatSats } = useFormatSats();
  
  const formatValue = () => {
    if (formatAsSats && typeof value === 'number') {
      // Determine text color based on value
      const textColor = numericValue > 0 ? 'text-green-300' : 
                       numericValue < 0 ? 'text-red-300' : 
                       'text-gray-300';
      
      return formatSats(value, { 
        size: size === 'small' ? 16 : 20, 
        variant: 'auto',
        forceColor: true,
        className: textColor
      });
    }
    return value.toString();
  };

  // ===== SIZE CLASSES =====
  const sizeClasses = {
    small: {
      card: 'min-h-[100px] p-3',
      title: 'text-sm font-medium',
      value: 'text-lg font-bold',
      subtitle: 'text-xs',
      icon: 'w-4 h-4'
    },
    medium: {
      card: 'min-h-[120px] p-4',
      title: 'text-base font-medium',
      value: 'text-xl font-bold',
      subtitle: 'text-sm',
      icon: 'w-5 h-5'
    }
  };

  const currentSize = sizeClasses[size];

  // ===== RENDER =====
  return (
    <LiquidGlassCard
      size="small"
      variant={computedVariant}
      interactive={true}
      morphOnHover={true}
      breathe={animation.shouldBreathe}
      className={cn('relative group', className)}
      style={animation.dynamicStyle}
      onMouseEnter={animation.onMouseEnter}
      onMouseLeave={animation.onMouseLeave}
      onMouseMove={animation.onMouseMove}
    >
      {/* Tooltip */}
      <LiquidGlassTooltip content={tooltip} position="top" delay={300}>
        <div className={currentSize.card}>
          {/* Header with Icon and Tooltip */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {Icon && (
                <Icon className={cn(
                  currentSize.icon,
                  'text-muted-foreground group-hover:text-foreground transition-colors duration-200'
                )} />
              )}
              <h3 className={cn(currentSize.title, 'text-vibrant-secondary')}>
                {title}
              </h3>
            </div>
            
            {/* Tooltip Icon */}
            <LiquidGlassTooltip content={tooltip} position="top" delay={200}>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg className="w-3 h-3 text-muted-foreground hover:text-vibrant cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </LiquidGlassTooltip>
          </div>

          {/* Value */}
          <div className="mb-2">
            <div className={cn(
              currentSize.value,
              'flex items-center gap-1',
              numericValue > 0 ? 'text-green-200' : 
              numericValue < 0 ? 'text-red-200' : 
              'text-gray-200'
            )}>
              {formatValue()}
              {showSatsIcon && formatAsSats && (
                <SatsIcon
                  size={size === 'small' ? 16 : 20}
                  variant="dynamic"
                  value={numericValue}
                  animate={true}
                  pulseOnChange={true}
                  className="ml-1"
                />
              )}
            </div>
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div className={cn(currentSize.subtitle, 'text-muted-foreground mb-2')}>
              {subtitle}
            </div>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {badges.map((badge, index) => (
                <Badge
                  key={index}
                  variant={badge.variant}
                  className={cn(
                    'text-xs px-1.5 py-0.5',
                    badge.color && badgeColorClasses[badge.color]
                  )}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </LiquidGlassTooltip>
    </LiquidGlassCard>
  );
};

// ===== PRESET COMPONENTS =====
export const ActiveTradesMiniCard: React.FC<{
  longCount: number;
  shortCount: number;
  totalCount: number;
}> = ({ longCount, shortCount, totalCount }) => (
  <MetricMiniCard
    title="Active Trades"
    value={totalCount}
    subtitle={`${longCount} Long, ${shortCount} Short`}
    variant="neutral"
    tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
    badges={[
      { label: `${longCount} Long`, variant: 'outline', color: 'green' },
      { label: `${shortCount} Short`, variant: 'outline', color: 'red' }
    ]}
  />
);

export const BalanceMiniCard: React.FC<{
  balance: number;
  freeBalance?: number;
  showSatsIcon?: boolean;
}> = ({ balance, freeBalance, showSatsIcon = true }) => (
  <MetricMiniCard
    title="Balance"
    value={balance}
    subtitle={freeBalance ? `Free: ${freeBalance.toLocaleString()} sats` : undefined}
    formatAsSats={true}
    showSatsIcon={showSatsIcon}
    variant={balance > 0 ? 'success' : 'neutral'}
    tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
  />
);

export const MarginMiniCard: React.FC<{
  margin: number;
  marginRatio?: number;
}> = ({ margin, marginRatio }) => (
  <MetricMiniCard
    title="Total Margin"
    value={margin}
    subtitle={marginRatio ? `${marginRatio.toFixed(1)}%` : undefined}
    formatAsSats={true}
    showSatsIcon={true}
    variant={marginRatio && marginRatio > 100 ? 'success' : 'neutral'}
    tooltip="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
  />
);

// ===== EXPORT =====
export default MetricMiniCard;
