import React, { useState, useMemo } from 'react';
import { RouteGuard } from '@/components/guards/RouteGuard';
import { useOptimizedDashboardMetrics } from '@/contexts/MarketDataContext';
import { useFormatSats } from '@/hooks/useFormatSats';
import { LiquidGlassCard } from '@/components/ui/LiquidGlassCard';
import { LiquidGlassTooltip } from '@/components/ui/LiquidGlassTooltip';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// ===== INTERFACES =====
type TimeFilterPeriod = '24H' | '1W' | '1M' | '6M' | '1Y' | 'ALL';

// ===== CHART DATA GENERATOR =====
const generateChartData = (period: TimeFilterPeriod, pnlValue: number) => {
  const safePnlValue = Number.isFinite(pnlValue) ? pnlValue : 0;
  
  const now = Date.now();
  const dataPoints = period === '24H' ? 24 : period === '1W' ? 168 : period === '1M' ? 720 : period === '6M' ? 4320 : period === '1Y' ? 8760 : 17520;
  const interval = period === '24H' ? 3600000 : period === '1W' ? 3600000 : period === '1M' ? 3600000 : 3600000;
  
  const data = [];
  let currentValue = safePnlValue * 0.3;
  
  for (let i = 0; i < dataPoints; i++) {
    const time = now - (dataPoints - i) * interval;
    const volatility = Math.abs(safePnlValue) * 0.1;
    const trend = (safePnlValue - currentValue) / (dataPoints - i) * 0.8;
    const random = (Math.random() - 0.5) * volatility * 0.3;
    
    currentValue += trend + random;
    const finalValue = Number.isFinite(currentValue) ? currentValue : 0;
    
    data.push({
      time: time / 1000,
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
  const safePnlValue = Number.isFinite(pnlValue) ? pnlValue : 0;
  const isPositive = safePnlValue > 0;
  
  const validData = data.filter(d => Number.isFinite(d.value));
  if (validData.length === 0) {
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
  
  const width = 300;
  const height = 80;
  const padding = 15;
  
  const points = validData.map((point, index) => {
    const xRatio = validData.length > 1 ? index / (validData.length - 1) : 0;
    const x = xRatio * (width - 2 * padding) + padding;
    
    const yValue = Number.isFinite(point.value) ? point.value : 0;
    const safeMinValue = Number.isFinite(minValue) ? minValue : 0;
    const safeRange = Number.isFinite(range) && range > 0 ? range : 1;
    const y = height - padding - ((yValue - safeMinValue) / safeRange) * (height - 2 * padding);
    
    return `${x},${y}`;
  }).join(' ');
  
  const validPoints = points.split(' ').filter(point => {
    const [x, y] = point.split(',');
    return Number.isFinite(parseFloat(x)) && Number.isFinite(parseFloat(y));
  }).join(' ');
  
  const pathData = `M ${validPoints}`;
  const gradientId = `gradient-${isPositive ? 'positive' : 'negative'}`;

  return (
    <div className={cn('relative w-full h-20', className)}>
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-hidden"
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
        
        <path
          d={`${pathData} L ${width - padding},${height - padding} L ${padding},${height - padding} Z`}
          fill={`url(#${gradientId})`}
          opacity="0.3"
        />
        
        <path
          d={pathData}
          fill="none"
          stroke={isPositive ? '#22c55e' : '#ef4444'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {validData.length > 0 && (() => {
          const safeMinValue = Number.isFinite(minValue) ? minValue : 0;
          const safeRange = Number.isFinite(range) && range > 0 ? range : 1;
          const cyValue = height - padding - ((safePnlValue - safeMinValue) / safeRange) * (height - 2 * padding);
          
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

// ===== PnL CARD COMPONENT =====
const PnLCard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimeFilterPeriod>('1M');
  const { totalPL } = useOptimizedDashboardMetrics();
  const { formatSats } = useFormatSats();
  
  const safeTotalPL = Number.isFinite(totalPL) ? totalPL : 0;
  const isPositive = safeTotalPL > 0;
  const isNegative = safeTotalPL < 0;
  
  // Mock percentage change for demo
  const percentageChange = isPositive ? 6.39 : isNegative ? -6.39 : 0;
  const absoluteChange = safeTotalPL * (percentageChange / 100);
  
  const chartData = useMemo(() => {
    return generateChartData(selectedPeriod, safeTotalPL);
  }, [selectedPeriod, safeTotalPL]);
  
  const timeFilters: TimeFilterPeriod[] = ['24H', '1W', '1M', '6M', '1Y', 'ALL'];
  
  return (
    <LiquidGlassCard 
      variant={isPositive ? 'success' : isNegative ? 'danger' : 'neutral'}
      size="xlarge"
    >
      <LiquidGlassTooltip 
        content="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." 
        position="top" 
        delay={300}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {isPositive ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : isNegative ? (
                <TrendingDown className="w-5 h-5 text-red-400" />
              ) : (
                <Activity className="w-5 h-5 text-gray-400" />
              )}
              <h2 className="text-lg font-semibold text-white">Total P&L</h2>
            </div>
            <div className="text-xs text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                32m
              </div>
            </div>
          </div>
          
          {/* Main Value */}
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-white mb-1">
              {formatSats(safeTotalPL, { size: 24, variant: 'neutral' })}
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className={cn(
                'text-xs',
                isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-gray-400'
              )}>
                {formatSats(absoluteChange, { size: 12, variant: isPositive ? 'success' : 'danger' })}
              </span>
              <div className={cn(
                'px-2 py-1 rounded-full text-xs font-medium',
                isPositive ? 'bg-green-500/20 text-green-400' : 
                isNegative ? 'bg-red-500/20 text-red-400' : 
                'bg-gray-500/20 text-gray-400'
              )}>
                {isPositive ? '+' : ''}{percentageChange.toFixed(2)}%
              </div>
            </div>
          </div>
          
          {/* Chart */}
          <div className="mb-4 flex-1 min-h-[100px]">
            <SimpleLineChart data={chartData} pnlValue={safeTotalPL} />
          </div>
          
          {/* Time Filters */}
          <div className="flex items-center justify-center gap-1 mt-auto">
            {timeFilters.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded transition-all duration-200',
                  selectedPeriod === period
                    ? 'bg-white/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
      </LiquidGlassTooltip>
    </LiquidGlassCard>
  );
};

export default function DashboardLiquid() {
  return (
    <RouteGuard>
      <div className="container mx-auto py-4 sm:py-6 lg:py-8 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Liquid Glass Dashboard - Mosaic Layout */}
          <div className="space-y-6">
            {/* Mosaic Grid Layout */}
            <div className="grid grid-cols-12 gap-4 grid-rows-[320px] relative z-0">
              {/* Main PnL Chart Card - Spans 2 rows, responsive columns */}
              <div className="col-span-12 md:col-span-6 lg:col-span-5 row-span-2 relative z-10">
                <PnLCard />
              </div>
              
              {/* Placeholder for mini cards - will be added later */}
              <div className="col-span-12 md:col-span-6 lg:col-span-7 grid grid-cols-2 gap-4 relative z-10">
                {/* Mini cards will be added here */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
