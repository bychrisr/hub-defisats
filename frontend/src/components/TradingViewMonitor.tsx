/**
 * TradingView Monitor Component
 * 
 * Monitora o status e performance do TradingView Data Service
 * Exibe estatísticas de cache, rate limiting e distribuição de APIs
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { RefreshCw, Database, Zap, AlertTriangle, CheckCircle } from 'lucide-react';
import { tradingViewDataService } from '../services/tradingViewData.service';

interface CacheStats {
  size: number;
  keys: string[];
}

interface RateLimitStats {
  [api: string]: {
    requests: number;
    limit: number;
  };
}

export const TradingViewMonitor: React.FC = () => {
  const [cacheStats, setCacheStats] = useState<CacheStats>({ size: 0, keys: [] });
  const [rateLimitStats, setRateLimitStats] = useState<RateLimitStats>({});
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStats = async () => {
    setIsRefreshing(true);
    try {
      const cache = tradingViewDataService.getCacheStats();
      const rateLimit = tradingViewDataService.getRateLimitStats();
      
      setCacheStats(cache);
      setRateLimitStats(rateLimit);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error refreshing TradingView stats:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000); // Atualizar a cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const getAPIStatus = (api: string, stats: { requests: number; limit: number }) => {
    const percentage = (stats.requests / stats.limit) * 100;
    
    if (percentage >= 90) return { status: 'critical', color: 'bg-red-500' };
    if (percentage >= 70) return { status: 'warning', color: 'bg-yellow-500' };
    return { status: 'healthy', color: 'bg-green-500' };
  };

  const getAPIIcon = (api: string) => {
    switch (api) {
      case 'tradingview': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'binance': return <Database className="h-4 w-4 text-yellow-500" />;
      case 'coingecko': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const clearCache = () => {
    tradingViewDataService.clearCache();
    refreshStats();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">TradingView Data Service</CardTitle>
          </div>
          <div className="flex items-center gap-2">
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
              onClick={clearCache}
            >
              Limpar Cache
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Última atualização: {lastUpdate.toLocaleTimeString()}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cache Stats */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Cache Inteligente
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{cacheStats.size}</div>
              <div className="text-xs text-muted-foreground">Entradas em Cache</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">30s</div>
              <div className="text-xs text-muted-foreground">TTL Máximo</div>
            </div>
          </div>
        </div>

        {/* Rate Limiting Stats */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Rate Limiting por API
          </h4>
          <div className="space-y-2">
            {Object.entries(rateLimitStats).map(([api, stats]) => {
              const apiStatus = getAPIStatus(api, stats);
              const percentage = (stats.requests / stats.limit) * 100;
              
              return (
                <div key={api} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAPIIcon(api)}
                    <div>
                      <div className="font-medium capitalize">{api}</div>
                      <div className="text-xs text-muted-foreground">
                        {stats.requests}/{stats.limit} req/min
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${apiStatus.color}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <Badge 
                      variant={apiStatus.status === 'healthy' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {percentage.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* API Priority */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Ordem de Prioridade</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="default" className="text-xs">1º</Badge>
              <span>TradingView (Principal)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="text-xs">2º</Badge>
              <span>Binance (Fallback)</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs">3º</Badge>
              <span>CoinGecko (Backup)</span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800 dark:text-blue-200">
              <strong>Conformidade com Segurança:</strong> Cache máximo de 30 segundos, 
              validação rigorosa de timestamps, nenhum fallback com dados simulados.
              <br />
              <strong>Arquitetura Atual:</strong> TradingView como principal (dados agregados), 
              Binance e CoinGecko como fallbacks.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TradingViewMonitor;
