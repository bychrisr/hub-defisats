/**
 * useLNMarketsHeaderData Hook
 * 
 * Hook para dados específicos do header da LN Markets
 * - Trading Fees (cache 5min)
 * - Next Funding (cache 1min)
 * - Rate (cache 30s)
 * - Validação rigorosa
 * - Suporte a testnet
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

interface LNMarketsHeaderData {
  tradingFees: number;
  nextFunding: string;
  rate: number;
  rateChange: number;
  timestamp: number;
  source: string;
  network: string;
}

interface UseLNMarketsHeaderDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseLNMarketsHeaderDataReturn {
  data: LNMarketsHeaderData | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => Promise<void>;
  clearError: () => void;
}

export function useLNMarketsHeaderData({
  autoRefresh = true,
  refreshInterval = 30000 // 30 segundos
}: UseLNMarketsHeaderDataOptions = {}): UseLNMarketsHeaderDataReturn {
  const [data, setData] = useState<LNMarketsHeaderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      console.log('🔄 USE LN MARKETS HEADER - Fetching data:', {
        timestamp: new Date().toISOString()
      });

      setLoading(true);
      setError(null);

      const response = await api.get('/api/lnmarkets/header-data');
      const headerData = response.data.data;
      
      // Validar dados
      const dataAge = Date.now() - headerData.timestamp;
      if (dataAge > 30000) { // 30 segundos
        throw new Error(`Data too old: ${dataAge}ms > 30000ms`);
      }

      setData(headerData);
      setLastUpdate(new Date());
      
      console.log('✅ USE LN MARKETS HEADER - Data fetched successfully:', {
        tradingFees: headerData.tradingFees,
        nextFunding: headerData.nextFunding,
        rate: headerData.rate,
        rateChange: headerData.rateChange,
        source: headerData.source,
        network: headerData.network,
        dataAge: dataAge + 'ms'
      });

    } catch (err: any) {
      console.error('❌ USE LN MARKETS HEADER - Error:', err);
      
      // Mapear erros específicos
      let errorMessage = 'Failed to fetch LN Markets header data';
      
      if (err.response?.status === 400) {
        errorMessage = 'No active LN Markets account found';
      } else if (err.response?.status === 503) {
        errorMessage = 'LN Markets API temporarily unavailable';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

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
