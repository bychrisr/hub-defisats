/**
 * Unified Market Header Enhanced
 * 
 * Componente de header unificado com integração TradingView realtime:
 * - Dados de mercado atualizados a cada 1 segundo
 * - WebSocket para atualizações em tempo real
 * - Cache inteligente
 * - Fallback automático
 * - Error handling robusto
 * 
 * Funcionalidades:
 * ✅ TradingView realtime integration
 * ✅ WebSocket para atualizações instantâneas
 * ✅ Cache de 1 segundo
 * ✅ Fallback para múltiplas fontes
 * ✅ Error handling com retry
 * ✅ Loading states
 * ✅ Responsive design
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import { tradingViewDataService, MarketData } from '@/services/tradingViewData.service';
import { useAuth } from '@/contexts/AuthContext';

interface UnifiedMarketHeaderEnhancedProps {
  className?: string;
}

export function UnifiedMarketHeaderEnhanced({ className }: UnifiedMarketHeaderEnhancedProps) {
  const { user } = useAuth();
  const [marketData, setMarketData] = useState<MarketData | null>(null);
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
      
      console.log('🔄 UNIFIED MARKET HEADER ENHANCED - Fetching initial data...');
      
      const data = await tradingViewDataService.getMarketData('BTCUSDT');
      
      setMarketData(data);
      setLastUpdate(Date.now());
      setIsLoading(false);
      
      console.log('✅ UNIFIED MARKET HEADER ENHANCED - Initial data fetched:', {
        price: data.price,
        change24h: data.change24h
      });
      
    } catch (error: any) {
      console.error('❌ UNIFIED MARKET HEADER ENHANCED - Initial data error:', error);
      setError(error.message || 'Failed to fetch market data');
      setIsLoading(false);
    }
  }, []);

  // Função para configurar WebSocket subscription
  const setupWebSocketSubscription = useCallback(() => {
    try {
      console.log('📡 UNIFIED MARKET HEADER ENHANCED - Setting up WebSocket subscription...');
      
      const id = tradingViewDataService.subscribe((data) => {
        console.log('📡 UNIFIED MARKET HEADER ENHANCED - WebSocket data received:', data);
        
        setMarketData(data);
        setLastUpdate(Date.now());
        setIsConnected(true);
        setError(null);
      }, 'BTCUSDT');
      
      setSubscriberId(id);
      setIsConnected(true);
      
      console.log('✅ UNIFIED MARKET HEADER ENHANCED - WebSocket subscription established:', { id });
      
    } catch (error: any) {
      console.error('❌ UNIFIED MARKET HEADER ENHANCED - WebSocket subscription error:', error);
      setError('WebSocket connection failed');
      setIsConnected(false);
    }
  }, []);

  // Função para limpar subscription
  const cleanupSubscription = useCallback(() => {
    if (subscriberId) {
      console.log('📡 UNIFIED MARKET HEADER ENHANCED - Cleaning up subscription:', { subscriberId });
      tradingViewDataService.unsubscribe(subscriberId);
      setSubscriberId(null);
      setIsConnected(false);
    }
  }, [subscriberId]);

  // Função para refresh manual
  const handleRefresh = useCallback(async () => {
    try {
      console.log('🔄 UNIFIED MARKET HEADER ENHANCED - Manual refresh...');
      await fetchInitialData();
    } catch (error: any) {
      console.error('❌ UNIFIED MARKET HEADER ENHANCED - Manual refresh error:', error);
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
      const stats = tradingViewDataService.getStats();
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

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Dados de Mercado */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-gray-500">--</span>
                <Badge variant="destructive">Error</Badge>
              </div>
            ) : marketData ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">
                    {formatPrice(marketData.price)}
                  </span>
                  <div className={`flex items-center gap-1 ${getChangeColor(marketData.change24h)}`}>
                    {getChangeIcon(marketData.change24h)}
                    <span className="text-sm font-medium">
                      {formatChange(marketData.change24h)}
                    </span>
                  </div>
                </div>
                
                {/* Volume */}
                <div className="text-sm text-gray-600">
                  Vol: {marketData.volume?.toLocaleString() || '--'}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold text-gray-500">--</span>
                <Badge variant="secondary">No Data</Badge>
              </div>
            )}
          </div>

          {/* Status e Controles */}
          <div className="flex items-center gap-4">
            {/* Status da Conexão */}
            {getConnectionStatus()}
            
            {/* Tempo desde última atualização */}
            <div className="text-xs text-gray-500">
              {getTimeSinceUpdate()}
            </div>
            
            {/* Botão de Refresh */}
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
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mt-4" variant="destructive">
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

        {/* Debug Info (apenas em desenvolvimento) */}
        {import.meta.env.DEV && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
            <div className="font-semibold">Debug Info:</div>
            <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
            <div>Subscriber ID: {subscriberId || 'None'}</div>
            <div>Last Update: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : 'Never'}</div>
            <div>Market Data: {marketData ? 'Available' : 'None'}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
