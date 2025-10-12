import React, { useState, useMemo } from 'react';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidGlassTooltip } from '@/components/ui/LiquidGlassTooltip';
import { TimeFilter, TimeFilterPeriod } from '@/components/dashboard/TimeFilter';
import { useLiquidGlassAnimation } from '@/hooks/useLiquidGlassAnimation';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { useFormatSats } from '@/hooks/useFormatSats';
import SatsIcon from '@/components/SatsIcon';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// ===== INTERFACES =====
export interface PnLChartCardProps {
  pnlValue: number;
  percentageChange?: number;
  subtitle?: string;
  className?: string;
  showChart?: boolean;
  showFilters?: boolean;
  initialPeriod?: TimeFilterPeriod;
}

// ===== MOCK CHART DATA =====
const generateMockChartData = (period: TimeFilterPeriod, pnlValue: number) => {
  // Validate pnlValue to prevent NaN
  const safePnlValue = Number.isFinite(pnlValue) ? pnlValue : 0;
  
  const now = Date.now();
  const dataPoints = period === '24H' ? 24 : period === '7D' ? 168 : period === '30D' ? 720 : 2160;
  const interval = period === '24H' ? 3600000 : period === '7D' ? 3600000 : 3600000; // 1 hour intervals
  
  const data = [];
  let currentValue = safePnlValue * 0.3; // Start at 30% of current value
  
  for (let i = 0; i < dataPoints; i++) {
    const time = now - (dataPoints - i) * interval;
    
    // Simulate realistic PnL movement
    const volatility = Math.abs(safePnlValue) * 0.1; // 10% volatility
    const trend = (safePnlValue - currentValue) / (dataPoints - i) * 0.8; // Trend towards target
    const random = (Math.random() - 0.5) * volatility * 0.3;
    
    currentValue += trend + random;
    
    // Ensure value is finite
    const finalValue = Number.isFinite(currentValue) ? currentValue : 0;
    
    data.push({
      time: time / 1000, // Convert to seconds
      value: Math.round(finalValue)
    });
  }
  
  return data;
};

// ===== SIMPLE LINE CHART COMPONENT =====
const SimpleLineChart: React.FC<{
  data: Array<{ time: number; value: number }>;
  pnlValue: number;
  className?: string;
}> = ({ data, pnlValue, className }) => {
  // Validate inputs to prevent NaN
  const safePnlValue = Number.isFinite(pnlValue) ? pnlValue : 0;
  const isPositive = safePnlValue > 0;
  
  // Validate data and find min/max for scaling
  const validData = data.filter(d => Number.isFinite(d.value));
  if (validData.length === 0) {
    // Return empty chart if no valid data
    return (
      <div className={cn('relative w-full h-32 flex items-center justify-center', className)}>
        <div className="text-muted-foreground text-sm">No data available</div>
      </div>
    );
  }
  
  const values = validData.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  
  // Convert to SVG path
  const width = 300;
  const height = 120;
  const padding = 20;
  
  const points = validData.map((point, index) => {
    // Prevent division by zero when there's only one data point
    const xRatio = validData.length > 1 ? index / (validData.length - 1) : 0;
    const x = xRatio * (width - 2 * padding) + padding;
    
    // Ensure y calculation is safe
    const yValue = Number.isFinite(point.value) ? point.value : 0;
    const safeMinValue = Number.isFinite(minValue) ? minValue : 0;
    const safeRange = Number.isFinite(range) && range > 0 ? range : 1;
    const y = height - padding - ((yValue - safeMinValue) / safeRange) * (height - 2 * padding);
    
    return `${x},${y}`;
  }).join(' ');
  
  // Validate that all points are valid numbers
  const validPoints = points.split(' ').filter(point => {
    const [x, y] = point.split(',');
    return Number.isFinite(parseFloat(x)) && Number.isFinite(parseFloat(y));
  }).join(' ');
  
  const pathData = `M ${validPoints}`;
  
  // Gradient definition
  const gradientId = `gradient-${isPositive ? 'positive' : 'negative'}`;
  
  return (
    <div className={cn('relative w-full h-32', className)}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop 
              offset="0%" 
              stopColor={isPositive ? '#22c55e' : '#ef4444'} 
              stopOpacity="0.8"
            />
            <stop 
              offset="100%" 
              stopColor={isPositive ? '#16a34a' : '#dc2626'} 
              stopOpacity="0.3"
            />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path
          d={`${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
          fill={`url(#${gradientId})`}
          opacity="0.3"
        />
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={isPositive ? '#22c55e' : '#ef4444'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Current point */}
        {validData.length > 0 && (() => {
          const safeMinValue = Number.isFinite(minValue) ? minValue : 0;
          const safeRange = Number.isFinite(range) && range > 0 ? range : 1;
          const cyValue = height - padding - ((safePnlValue - safeMinValue) / safeRange) * (height - 2 * padding);
          
          // Only render if cy is a valid number
          if (Number.isFinite(cyValue)) {
            return (
              <circle
                cx={width - padding}
                cy={cyValue}
                r="4"
                fill={isPositive ? '#22c55e' : '#ef4444'}
                className="drop-shadow-sm"
              />
            );
          }
          return null;
        })()}
      </svg>
    </div>
  );
};

// ===== MAIN COMPONENT =====
export const PnLChartCard: React.FC<PnLChartCardProps> = ({
  pnlValue,
  percentageChange,
  subtitle,
  className,
  showChart = true,
  showFilters = true,
  initialPeriod = '7D'
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimeFilterPeriod>(initialPeriod);
  
  // ===== HOOKS =====
  const animation = useLiquidGlassAnimation({
    variant: pnlValue > 0 ? 'success' : pnlValue < 0 ? 'danger' : 'neutral',
    value: pnlValue,
    isPositive: pnlValue > 0,
    isNegative: pnlValue < 0,
    isNeutral: pnlValue === 0
  });
  
  const { formatSats } = useFormatSats();
  
  // ===== HISTORICAL DATA =====
  const { candleData, isLoading } = useHistoricalData({
    symbol: 'BTCUSDT',
    timeframe: '1h',
    period: selectedPeriod,
    enabled: showChart
  });
  
  // ===== CHART DATA =====
  const chartData = useMemo(() => {
    // Validate pnlValue to prevent NaN
    const safePnlValue = Number.isFinite(pnlValue) ? pnlValue : 0;
    
    if (candleData && candleData.length > 0) {
      // Use real data if available
      return candleData.map(candle => ({
        time: typeof candle.time === 'number' ? candle.time : new Date(candle.time).getTime() / 1000,
        value: Math.round(safePnlValue * (candle.close / candleData[candleData.length - 1].close))
      }));
    }
    
    // Fallback to mock data
    return generateMockChartData(selectedPeriod, safePnlValue);
  }, [candleData, selectedPeriod, pnlValue]);
  
  // ===== COMPUTED VALUES =====
  const isPositive = pnlValue > 0;
  const isNegative = pnlValue < 0;
  const isNeutral = pnlValue === 0;
  
  const getTrendIcon = () => {
    if (isPositive) return TrendingUp;
    if (isNegative) return TrendingDown;
    return Activity;
  };
  
  const TrendIcon = getTrendIcon();
  
  // ===== RENDER =====
  return (
    <LiquidGlassCard
      size="xlarge"
      variant={isPositive ? 'success' : isNegative ? 'danger' : 'neutral'}
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
      <LiquidGlassTooltip 
        content="Lorem ipsum dolor sit amet, consectetur adipiscing elit." 
        position="top" 
        delay={300}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrendIcon className={cn(
                'w-6 h-6',
                isPositive ? 'text-green-400' : 
                isNegative ? 'text-red-400' : 
                'text-gray-400'
              )} />
              <h2 className="text-xl font-semibold text-vibrant">
                Total P&L
              </h2>
            </div>
            
            {/* Tooltip Icon */}
            <LiquidGlassTooltip 
              content="Lorem ipsum dolor sit amet, consectetur adipiscing elit." 
              position="top" 
              delay={200}
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg className="w-4 h-4 text-muted-foreground hover:text-vibrant cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </LiquidGlassTooltip>
          </div>
          
          {/* Value Section */}
          <div className="mb-4">
            <div className={cn(
              'text-3xl font-bold flex items-center gap-2',
              isPositive ? 'text-green-200' : 
              isNegative ? 'text-red-200' : 
              'text-gray-200'
            )}>
              {formatSats(pnlValue, { 
                size: 32, 
                variant: 'auto',
                forceColor: true,
                className: isPositive ? 'text-green-300' : 
                          isNegative ? 'text-red-300' : 
                          'text-gray-300'
              })}
              <SatsIcon
                size={28}
                variant="dynamic"
                value={pnlValue}
                animate={true}
                pulseOnChange={true}
                className="ml-1"
              />
            </div>
            
            {/* Percentage Badge */}
            {percentageChange !== undefined && (
              <div className="mt-2">
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-sm font-semibold px-3 py-1',
                    isPositive ? 'border-green-400/60 text-green-200 bg-green-600/20' :
                    isNegative ? 'border-red-400/60 text-red-200 bg-red-600/20' :
                    'border-gray-400/60 text-gray-200 bg-gray-600/20'
                  )}
                >
                  {isPositive ? '+' : ''}{percentageChange.toFixed(1)}%
                </Badge>
              </div>
            )}
            
            {/* Subtitle */}
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-2">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Chart Section */}
          {showChart && (
            <div className="flex-1 flex flex-col">
              {/* Time Filters */}
              {showFilters && (
                <div className="mb-4">
                  <TimeFilter
                    value={selectedPeriod}
                    onChange={setSelectedPeriod}
                    size="sm"
                    variant="glass"
                  />
                </div>
              )}
              
              {/* Chart */}
              <div className="flex-1 min-h-[120px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <SimpleLineChart
                    data={chartData}
                    pnlValue={pnlValue}
                    className="w-full h-full"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </LiquidGlassTooltip>
    </LiquidGlassCard>
  );
};

// ===== EXPORT =====
export default PnLChartCard;
