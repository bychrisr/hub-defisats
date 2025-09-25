import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useCentralizedDataStore } from '@/stores/centralizedDataStore';

interface CentralizedData {
  userBalance: any;
  userPositions: any[];
  marketIndex: {
    index: number;
    index24hChange: number;
    tradingFees: number;
    nextFunding: string;
    rate: number;
    rateChange: number;
    timestamp: number;
    source?: string;
  };
  menuData: any;
  isLoading: boolean;
  lastUpdate: number;
  error: string | null;
}

interface UseCentralizedDataReturn extends CentralizedData {
  refreshData: () => Promise<void>;
  isConnected: boolean;
}

export const useCentralizedData = (): UseCentralizedDataReturn => {
  const { isAuthenticated, user } = useAuthStore();
  const { data, isLoading, error, refreshData } = useCentralizedDataStore();

  // Disparar refresh quando credenciais mudarem
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Clear cache when credentials change to force fresh validation
      useCentralizedDataStore.getState().clearData();
      refreshData();
    }
  }, [isAuthenticated, user?.id, user?.ln_markets_api_key, user?.ln_markets_api_secret, user?.ln_markets_passphrase, refreshData]);

  // Debug the return object
  console.log('🔍 CENTRALIZED DATA RETURN DEBUG:', {
    data: data,
    dataType: typeof data,
    dataKeys: data ? Object.keys(data) : 'undefined',
    isLoading: data?.isLoading,
    lastUpdate: data?.lastUpdate,
    error: data?.error
  });

  return {
    data: data || {
      userBalance: null,
      userPositions: [],
      marketIndex: {
        index: 0,
        index24hChange: 0,
        tradingFees: 0,
        nextFunding: '--',
        rate: 0,
        rateChange: 0,
        timestamp: 0,
        source: 'lnmarkets'
      },
      menuData: null,
      isLoading: false,
      lastUpdate: 0,
      error: null
    },
    isLoading,
    error,
    refreshData,
    isConnected: !error && data?.lastUpdate > 0
  };
};