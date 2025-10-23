/**
 * useMarketIndex Hook
 * 
 * Hook que abstrai a lógica de buscar index baseado em exchange
 * - TradingView Data Service para index
 * - Cache inteligente
 * - Validação de dados
 * - Logs detalhados
 */

import { useState, useEffect, useCallback } from 'react';
import { tradingViewDataService } from '@/services/tradingViewData.service';

interface MarketIndexData {
  price: number;
  change24h: number;
  volume: number;
  timestamp: number;
  source: string;
  exchange: string;
}

interface UseMarketIndexOptions {
  exchange: string;
  symbol?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseMarketIndexReturn {
  data: MarketIndexData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useMarketIndex({
  exchange,
  symbol = 'BTCUSDT',
  autoRefresh = true,
  refreshInterval = 30000 // 30 segundos
}: UseMarketIndexOptions): UseMarketIndexReturn {
  const [data, setData] = useState<MarketIndexData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      console.log('🔄 USE MARKET INDEX - Fetching data:', {
        exchange,
        symbol,
        timestamp: new Date().toISOString()
      });

      setLoading(true);
      setError(null);

      const marketData = await tradingViewDataService.getMarketDataForExchange(exchange, symbol);
      
      // Validar dados
      const dataAge = Date.now() - marketData.timestamp;
      if (dataAge > 30000) { // 30 segundos
        throw new Error(`Data too old: ${dataAge}ms > 30000ms`);
      }

      setData(marketData);
      setLastUpdate(new Date());
      
      console.log('✅ USE MARKET INDEX - Data fetched successfully:', {
        price: marketData.price,
        change24h: marketData.change24h,
        source: marketData.source,
        exchange: marketData.exchange,
        dataAge: dataAge + 'ms'
      });

    } catch (err: any) {
      console.error('❌ USE MARKET INDEX - Error:', err);
      setError(err.message || 'Failed to fetch market index');
    } finally {
      setLoading(false);
    }
  }, [exchange, symbol]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Carregar dados inicial
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!loading) {
        fetchData();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loading, fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh,
    clearError
  };
}
