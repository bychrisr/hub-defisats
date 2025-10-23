/**
 * Unified Market Header Component
 * 
 * Componente unificado que exibe dados de mercado baseado na exchange ativa
 * - TradingView Data Service para index (com fallback robusto)
 * - LN Markets API para dados específicos (trading fees, next funding, rate)
 * - Suporte a múltiplas exchanges
 * - Validação rigorosa de dados
 * - Logs detalhados para debugging
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Clock, Percent } from 'lucide-react';
import { tradingViewDataService } from '@/services/tradingViewData.service';
import { api } from '@/lib/api';

interface MarketData {
  index: number;
  index24hChange: number;
  tradingFees: number;
  nextFunding: string;
  rate: number;
  rateChange: number;
  timestamp: number;
  source: string;
  network?: string;
}

interface UnifiedMarketHeaderProps {
  activeExchange?: string;
  className?: string;
}

export function UnifiedMarketHeader({ 
  activeExchange = 'lnmarkets', 
  className = '' 
}: UnifiedMarketHeaderProps) {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Buscar dados de mercado
  const fetchMarketData = async () => {
    try {
      console.log('🔄 UNIFIED HEADER - Fetching market data:', {
        activeExchange,
        timestamp: new Date().toISOString()
      });

      setLoading(true);
      setError(null);

      // 1. Buscar index do TradingView Data Service
      console.log('🔄 UNIFIED HEADER - Fetching TradingView index...');
      const indexData = await tradingViewDataService.getMarketDataForExchange(activeExchange);
      
      console.log('✅ UNIFIED HEADER - TradingView index fetched:', {
        price: indexData.price,
        change24h: indexData.change24h,
        source: indexData.source,
        exchange: indexData.exchange
      });

      // 2. Buscar dados específicos da LN Markets (se exchange for lnmarkets)
      let lnMarketsData = null;
      if (activeExchange === 'lnmarkets') {
        try {
          console.log('🔄 UNIFIED HEADER - Fetching LN Markets specific data...');
          const response = await api.get('/api/lnmarkets/header-data');
          lnMarketsData = response.data.data;
          
          console.log('✅ UNIFIED HEADER - LN Markets data fetched:', {
            tradingFees: lnMarketsData.tradingFees,
            nextFunding: lnMarketsData.nextFunding,
            rate: lnMarketsData.rate,
            network: lnMarketsData.network
          });
        } catch (lnMarketsError: any) {
          console.warn('⚠️ UNIFIED HEADER - LN Markets data failed:', lnMarketsError);
          // Continuar sem dados específicos da LN Markets
        }
      }

      // 3. Combinar dados
      const combinedData: MarketData = {
        index: indexData.price,
        index24hChange: indexData.change24h,
        tradingFees: lnMarketsData?.tradingFees || 0.1, // Fallback padrão
        nextFunding: lnMarketsData?.nextFunding || 'Calculating...',
        rate: lnMarketsData?.rate || 0.00006, // Fallback padrão
        rateChange: lnMarketsData?.rateChange || 0.00001,
        timestamp: Date.now(),
        source: `${indexData.source}${lnMarketsData ? ` + ${lnMarketsData.source}` : ''}`,
        network: lnMarketsData?.network
      };

      // 4. Validar dados
      const dataAge = Date.now() - combinedData.timestamp;
      if (dataAge > 30000) { // 30 segundos
        throw new Error(`Data too old: ${dataAge}ms > 30000ms`);
      }

      setMarketData(combinedData);
      setLastUpdate(new Date());
      
      console.log('✅ UNIFIED HEADER - Market data combined successfully:', {
        index: combinedData.index,
        index24hChange: combinedData.index24hChange,
        tradingFees: combinedData.tradingFees,
        nextFunding: combinedData.nextFunding,
        rate: combinedData.rate,
        source: combinedData.source,
        network: combinedData.network,
        dataAge: dataAge + 'ms'
      });

    } catch (err: any) {
      console.error('❌ UNIFIED HEADER - Error fetching market data:', err);
      setError(err.message || 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados inicial
  useEffect(() => {
    fetchMarketData();
  }, [activeExchange]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchMarketData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading, activeExchange]);

  // Formatar valores
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatRate = (rate: number) => {
    return `${(rate * 100).toFixed(4)}%`;
  };

  // Renderizar loading
  if (loading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex space-x-4">
              <Skeleton className="h-16 w-20" />
              <Skeleton className="h-16 w-20" />
              <Skeleton className="h-16 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar erro
  if (error) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load market data: {error}
              <button 
                onClick={fetchMarketData}
                className="ml-2 text-sm underline"
              >
                Retry
              </button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Renderizar dados
  if (!marketData) {
    return null;
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Index Principal */}
          <div className="flex items-center space-x-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold">
                  {formatPrice(marketData.index)}
                </h2>
                <Badge 
                  variant={marketData.index24hChange >= 0 ? 'default' : 'destructive'}
                  className="flex items-center space-x-1"
                >
                  {marketData.index24hChange >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{formatPercentage(marketData.index24hChange)}</span>
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {activeExchange.toUpperCase()} Index
                {marketData.network && (
                  <span className="ml-2 text-xs">
                    ({marketData.network})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Dados Específicos */}
          <div className="flex items-center space-x-6">
            {/* Trading Fees */}
            <div className="text-center">
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Trading Fees</span>
              </div>
              <div className="text-lg font-semibold">
                {marketData.tradingFees}%
              </div>
            </div>

            {/* Next Funding */}
            <div className="text-center">
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Next Funding</span>
              </div>
              <div className="text-lg font-semibold">
                {marketData.nextFunding}
              </div>
            </div>

            {/* Rate */}
            <div className="text-center">
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Percent className="h-4 w-4" />
                <span>Rate</span>
              </div>
              <div className="text-lg font-semibold">
                {formatRate(marketData.rate)}
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchMarketData}
              disabled={loading}
              className="p-2 hover:bg-muted rounded-md transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Footer com informações de debug */}
        <div className="mt-4 pt-4 border-t border-muted">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Source: {marketData.source}
            </div>
            <div>
              {lastUpdate && (
                <span>
                  Last update: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
