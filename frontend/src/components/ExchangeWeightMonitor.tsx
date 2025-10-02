import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  RefreshCw, 
  TrendingUp, 
  Activity,
  Zap,
  Target
} from 'lucide-react';
import { exchangeWeightService } from '@/services/exchangeWeight.service';

interface ExchangeWeightMonitorProps {
  className?: string;
  showDetails?: boolean;
}

const ExchangeWeightMonitor: React.FC<ExchangeWeightMonitorProps> = ({
  className = '',
  showDetails = true
}) => {
  const [stats, setStats] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStats = async () => {
    setIsRefreshing(true);
    try {
      const newStats = exchangeWeightService.getDistributionStats();
      setStats(newStats);
    } catch (error) {
      console.error('Error refreshing exchange stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshStats();
    
    // Atualizar stats a cada 30 segundos
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const getExchangeIcon = (exchangeName: string) => {
    switch (exchangeName) {
      case 'binance':
        return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'bybit':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'bitmex':
        return <BarChart3 className="h-4 w-4 text-green-500" />;
      case 'deribit':
        return <Target className="h-4 w-4 text-purple-500" />;
      default:
        return <Zap className="h-4 w-4 text-gray-500" />;
    }
  };

  const getExchangeColor = (exchangeName: string) => {
    switch (exchangeName) {
      case 'binance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'bybit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'bitmex':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'deribit':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const resetStats = () => {
    exchangeWeightService.resetStats();
    refreshStats();
  };

  if (!stats) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-500">Loading exchange stats...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Exchange Distribution
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStats}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetStats}
            >
              Reset
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Total Requests */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Requests
          </span>
          <Badge variant="secondary">
            {stats.totalRequests}
          </Badge>
        </div>

        {/* Exchange Distribution */}
        <div className="space-y-3">
          {Object.entries(stats.exchanges).map(([exchangeName, exchangeStats]: [string, any]) => (
            <div key={exchangeName} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getExchangeIcon(exchangeName)}
                  <span className="text-sm font-medium capitalize">
                    {exchangeName}
                  </span>
                  <Badge className={getExchangeColor(exchangeName)}>
                    {exchangeStats.targetWeight}% target
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {exchangeStats.count} requests
                  </span>
                  <Badge variant={exchangeStats.deviation < 5 ? 'default' : 'destructive'}>
                    {exchangeStats.percentage.toFixed(1)}%
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-1">
                <Progress 
                  value={exchangeStats.percentage} 
                  className="h-2"
                />
                {showDetails && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Current: {exchangeStats.percentage.toFixed(1)}%</span>
                    <span>Target: {exchangeStats.targetWeight}%</span>
                    <span>Deviation: {exchangeStats.deviation.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Status Summary */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Distribution Status
            </span>
            <Badge 
              variant={
                Object.values(stats.exchanges).every((ex: any) => ex.deviation < 10) 
                  ? 'default' 
                  : 'destructive'
              }
            >
              {Object.values(stats.exchanges).every((ex: any) => ex.deviation < 10) 
                ? 'Balanced' 
                : 'Unbalanced'
              }
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExchangeWeightMonitor;
