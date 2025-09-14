import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  Activity,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { useBtcPrice } from '@/hooks/useBtcPrice';

interface CircularChartProps {
  className?: string;
}

const CircularChart: React.FC<CircularChartProps> = ({ className }) => {
  const { data: btcPrice, loading: btcLoading, error: btcError, refetch: refetchBtc } = useBtcPrice();
  const [isAnimating, setIsAnimating] = useState(false);

  // Dados de exemplo para o gráfico circular
  const chartData = [
    { label: 'Long Positions', value: 65, color: '#00d4aa', icon: TrendingUp },
    { label: 'Short Positions', value: 35, color: '#ff6b6b', icon: TrendingDown },
  ];

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  const handleRefresh = async () => {
    setIsAnimating(true);
    await refetchBtc();
    setTimeout(() => setIsAnimating(false), 1000);
  };

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Market Overview</CardTitle>
              <p className="text-sm text-muted-foreground">Real-time market data</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={btcLoading || isAnimating}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${(btcLoading || isAnimating) ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* BTC Price Display */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">BTC Price</span>
          </div>
          
          {btcLoading ? (
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-muted-foreground">Loading...</span>
            </div>
          ) : btcError ? (
            <div className="text-destructive text-sm">Error loading price</div>
          ) : btcPrice ? (
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                ${btcPrice.price.toLocaleString('pt-BR')}
              </div>
              <div className="flex items-center justify-center gap-2">
                {btcPrice.changePercent24h !== 0 && (
                  <Badge 
                    variant={btcPrice.changePercent24h > 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {btcPrice.changePercent24h > 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(btcPrice.changePercent24h).toFixed(2)}%
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {btcPrice.lastUpdated}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-muted-foreground">$50,000</div>
          )}
        </div>

        {/* Circular Chart */}
        <div className="relative w-48 h-48 mx-auto">
          <svg
            className="w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/20"
            />
            
            {/* Data circles */}
            {chartData.map((item, index) => {
              const circumference = 2 * Math.PI * 40;
              const strokeDasharray = circumference;
              const strokeDashoffset = circumference - (item.value / totalValue) * circumference;
              
              return (
                <circle
                  key={item.label}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={item.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                  style={{
                    strokeDashoffset: strokeDashoffset,
                    animationDelay: `${index * 0.5}s`
                  }}
                />
              );
            })}
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalValue}%</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {chartData.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <Icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <span className="text-sm font-semibold">{item.value}%</span>
              </div>
            );
          })}
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">12</div>
            <div className="text-xs text-muted-foreground">Active Trades</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-500">+2.4%</div>
            <div className="text-xs text-muted-foreground">24h P&L</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CircularChart;
