import { useState, useEffect, useCallback } from 'react';

interface PublicMarketData {
  index: number;
  index24hChange: number;
  tradingFees: number;
  nextFunding: string;
  rate: number;
  timestamp: string;
  source: string;
}

interface PublicDashboardData {
  marketIndex: PublicMarketData;
  systemStatus: {
    status: string;
    uptime: number;
    version: string;
  };
}

interface UsePublicMarketDataReturn {
  data: PublicMarketData | null;
  dashboardData: PublicDashboardData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number | null;
  refetch: () => Promise<void>;
}

export const usePublicMarketData = (): UsePublicMarketDataReturn => {
  const [data, setData] = useState<PublicMarketData | null>(null);
  const [dashboardData, setDashboardData] = useState<PublicDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);

  const fetchPublicMarketData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🌐 PUBLIC MARKET DATA - Fetching public market data...');

      const response = await fetch('/api/market/index/public');
      const result = await response.json();

      if (result.success && result.data) {
        console.log('✅ PUBLIC MARKET DATA - Data received:', result.data);
        setData(result.data);
        setLastUpdate(Date.now());
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('❌ PUBLIC MARKET DATA - Error:', err);
      setError(err.message || 'Failed to fetch public market data');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPublicDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🌐 PUBLIC DASHBOARD - Fetching public dashboard data...');

      const response = await fetch('/api/public/dashboard');
      const result = await response.json();

      if (result.success && result.data) {
        console.log('✅ PUBLIC DASHBOARD - Data received:', result.data);
        setDashboardData(result.data);
        setLastUpdate(Date.now());
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('❌ PUBLIC DASHBOARD - Error:', err);
      setError(err.message || 'Failed to fetch public dashboard data');
      setDashboardData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await Promise.all([
      fetchPublicMarketData(),
      fetchPublicDashboardData()
    ]);
  }, [fetchPublicMarketData, fetchPublicDashboardData]);

  // Carregar dados inicialmente
  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    dashboardData,
    isLoading,
    error,
    lastUpdate,
    refetch
  };
};
