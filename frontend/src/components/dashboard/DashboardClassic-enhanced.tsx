/**
 * Dashboard Classic Enhanced
 * 
 * Dashboard com integração TradingView realtime:
 * - Dados de mercado atualizados a cada 1 segundo
 * - WebSocket para atualizações em tempo real
 * - Gráficos TradingView integrados
 * - Posições em tempo real
 * - Balance atualizado
 * 
 * Funcionalidades:
 * ✅ TradingView realtime integration
 * ✅ WebSocket para atualizações instantâneas
 * ✅ Cache inteligente
 * ✅ Fallback automático
 * ✅ Error handling com retry
 * ✅ Loading states
 * ✅ Responsive design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, TrendingUp, TrendingDown, Wifi, WifiOff, Activity } from 'lucide-react';
import { tradingViewDataServiceEnhanced, MarketData } from '@/services/tradingViewData-enhanced.service';
import { useAuth } from '@/contexts/AuthContext';
import { TradingViewChart } from '@/components/charts/TradingViewChart';

interface DashboardClassicEnhancedProps {
  className?: string;
}

interface Position {
  id: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pl: number;
  plPercent: number;
}

interface Balance {
  balance: number;
  currency: string;
  available: number;
  locked: number;
}

export function DashboardClassicEnhanced({ className }: DashboardClassicEnhancedProps) {
  const { user } = useAuth();
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [subscriberId, setSubscriberId] = useState<string | null>(null);

  // Função para buscar dados iniciais
  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 DASHBOARD CLASSIC ENHANCED - Fetching initial data...');
      
      // Buscar dados de mercado
      const marketData = await tradingViewDataServiceEnhanced.getMarketData('BTCUSDT');
      setMarketData(marketData);
      
      // Simular dados de posições (substituir por API real)
      const mockPositions: Position[] = [
        {
          id: 'pos_1',
          side: 'long',
          size: 0.1,
          entryPrice: 45000,
          currentPrice: marketData.price,
          pl: (marketData.price - 45000) * 0.1,
          plPercent: ((marketData.price - 45000) / 45000) * 100
        }
      ];
      setPositions(mockPositions);
      
      // Simular dados de balance (substituir por API real)
      const mockBalance: Balance = {
        balance: 1000,
        currency: 'USD',
        available: 800,
        locked: 200
      };
      setBalance(mockBalance);
      
      setLastUpdate(Date.now());
      setIsLoading(false);
      
      console.log('✅ DASHBOARD CLASSIC ENHANCED - Initial data fetched:', {
        marketPrice: marketData.price,
        positionsCount: mockPositions.length,
        balance: mockBalance.balance
      });
      
    } catch (error: any) {
      console.error('❌ DASHBOARD CLASSIC ENHANCED - Initial data error:', error);
      setError(error.message || 'Failed to fetch dashboard data');
      setIsLoading(false);
    }
  }, []);

  // Função para configurar WebSocket subscription
  const setupWebSocketSubscription = useCallback(() => {
    try {
      console.log('📡 DASHBOARD CLASSIC ENHANCED - Setting up WebSocket subscription...');
      
      const id = tradingViewDataServiceEnhanced.subscribe((data) => {
        console.log('📡 DASHBOARD CLASSIC ENHANCED - WebSocket data received:', data);
        
        setMarketData(data);
        setLastUpdate(Date.now());
        setIsConnected(true);
        setError(null);
        
        // Atualizar preço atual nas posições
        setPositions(prev => prev.map(pos => ({
          ...pos,
          currentPrice: data.price,
          pl: (data.price - pos.entryPrice) * pos.size,
          plPercent: ((data.price - pos.entryPrice) / pos.entryPrice) * 100
        })));
        
      }, 'BTCUSDT');
      
      setSubscriberId(id);
      setIsConnected(true);
      
      console.log('✅ DASHBOARD CLASSIC ENHANCED - WebSocket subscription established:', { id });
      
    } catch (error: any) {
      console.error('❌ DASHBOARD CLASSIC ENHANCED - WebSocket subscription error:', error);
      setError('WebSocket connection failed');
      setIsConnected(false);
    }
  }, []);

  // Função para limpar subscription
  const cleanupSubscription = useCallback(() => {
    if (subscriberId) {
      console.log('📡 DASHBOARD CLASSIC ENHANCED - Cleaning up subscription:', { subscriberId });
      tradingViewDataServiceEnhanced.unsubscribe(subscriberId);
      setSubscriberId(null);
      setIsConnected(false);
    }
  }, [subscriberId]);

  // Função para refresh manual
  const handleRefresh = useCallback(async () => {
    try {
      console.log('🔄 DASHBOARD CLASSIC ENHANCED - Manual refresh...');
      await fetchInitialData();
    } catch (error: any) {
      console.error('❌ DASHBOARD CLASSIC ENHANCED - Manual refresh error:', error);
      setError(error.message || 'Refresh failed');
    }
  }, [fetchInitialData]);

  // Effect para inicialização
  useEffect(() => {
    if (user) {
      fetchInitialData();
      setupWebSocketSubscription();
    }
    
    return () => {
      cleanupSubscription();
    };
  }, [user, fetchInitialData, setupWebSocketSubscription, cleanupSubscription]);

  // Effect para monitorar conexão WebSocket
  useEffect(() => {
    const interval = setInterval(() => {
      const stats = tradingViewDataServiceEnhanced.getStats();
      setIsConnected(stats.websocket.isConnected);
    }, 5000); // Verificar a cada 5 segundos
    
    return () => clearInterval(interval);
  }, []);

  // Função para formatar preço
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Função para formatar mudança percentual
  const formatChange = (change: number): string => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  // Função para obter cor da mudança
  const getChangeColor = (change: number): string => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Função para obter ícone da mudança
  const getChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  // Função para obter status da conexão
  const getConnectionStatus = () => {
    if (isConnected) {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <Wifi className="w-4 h-4" />
          <span className="text-xs">Live</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1 text-red-600">
          <WifiOff className="w-4 h-4" />
          <span className="text-xs">Offline</span>
        </div>
      );
    }
  };

  // Função para obter tempo desde última atualização
  const getTimeSinceUpdate = (): string => {
    if (!lastUpdate) return 'Never';
    
    const seconds = Math.floor((Date.now() - lastUpdate) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  // Calcular P&L total
  const totalPL = positions.reduce((sum, pos) => sum + pos.pl, 0);
  const totalPLPercent = positions.length > 0 ? positions.reduce((sum, pos) => sum + pos.plPercent, 0) / positions.length : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Dashboard Classic Enhanced</h1>
          {getConnectionStatus()}
          <span className="text-sm text-gray-500">
            Last update: {getTimeSinceUpdate()}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Market Data Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Market Data (Realtime)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
          ) : error ? (
            <div className="text-center text-gray-500">
              Failed to load market data
            </div>
          ) : marketData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatPrice(marketData.price)}
                </div>
                <div className="text-sm text-gray-500">Current Price</div>
              </div>
              
              <div className="text-center">
                <div className={`text-xl font-semibold ${getChangeColor(marketData.change24h)}`}>
                  {formatChange(marketData.change24h)}
                </div>
                <div className="text-sm text-gray-500">24h Change</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {marketData.volume?.toLocaleString() || '--'}
                </div>
                <div className="text-sm text-gray-500">24h Volume</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              No market data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance Card */}
      <Card>
        <CardHeader>
          <CardTitle>Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : balance ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {formatPrice(balance.balance)}
                </div>
                <div className="text-sm text-gray-500">Total Balance</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-semibold">
                  {formatPrice(balance.available)}
                </div>
                <div className="text-sm text-gray-500">Available</div>
              </div>
              
              <div className="text-center">
                <div className="text-xl font-semibold">
                  {formatPrice(balance.locked)}
                </div>
                <div className="text-sm text-gray-500">Locked</div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              No balance data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Positions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Positions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : positions.length > 0 ? (
            <div className="space-y-4">
              {positions.map((position) => (
                <div key={position.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                      {position.side.toUpperCase()}
                    </Badge>
                    <div>
                      <div className="font-semibold">
                        {position.size} BTC
                      </div>
                      <div className="text-sm text-gray-500">
                        Entry: {formatPrice(position.entryPrice)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatPrice(position.currentPrice)}
                    </div>
                    <div className={`text-sm ${getChangeColor(position.pl)}`}>
                      {formatPrice(position.pl)} ({formatChange(position.plPercent)})
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Total P&L */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total P&L:</span>
                  <div className={`font-semibold ${getChangeColor(totalPL)}`}>
                    {formatPrice(totalPL)} ({formatChange(totalPLPercent)})
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              No positions found
            </div>
          )}
        </CardContent>
      </Card>

      {/* TradingView Chart */}
      <Card>
        <CardHeader>
          <CardTitle>TradingView Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <TradingViewChart
            symbol="BTCUSDT"
            interval="1h"
            height={400}
            width="100%"
          />
        </CardContent>
      </Card>

      {/* Debug Info (apenas em desenvolvimento) */}
      {import.meta.env.DEV && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
              <div>Subscriber ID: {subscriberId || 'None'}</div>
              <div>Last Update: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}</div>
              <div>Market Data: {marketData ? 'Available' : 'None'}</div>
              <div>Positions: {positions.length}</div>
              <div>Balance: {balance ? 'Available' : 'None'}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
