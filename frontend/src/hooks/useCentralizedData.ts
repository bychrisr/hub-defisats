import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

interface CentralizedData {
  // User data
  userBalance: any;
  userPositions: any[];
  
  // Market data
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
  
  // Menu data
  menuData: any;
  
  // Loading states
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
  const [data, setData] = useState<CentralizedData>({
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
  });

  const refreshData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🔄 CENTRALIZED DATA - Fetching all data in single request...');

      // Fazer todas as requisições em paralelo
      const [balanceResponse, positionsResponse, marketResponse, menuResponse] = await Promise.allSettled([
        api.get('/api/lnmarkets/user/balance'),
        api.get('/api/lnmarkets/user/positions'),
        api.get('/api/market/index/public'),
        api.get('/api/menu')
      ]);

      // Processar respostas
      const userBalance = balanceResponse.status === 'fulfilled' && balanceResponse.value.data.success 
        ? balanceResponse.value.data.data 
        : null;

      const userPositions = positionsResponse.status === 'fulfilled' && positionsResponse.value.data.success 
        ? positionsResponse.value.data.data || []
        : [];

      const marketIndex = marketResponse.status === 'fulfilled' && marketResponse.value.data.success 
        ? {
            index: marketResponse.value.data.data.index || 0,
            index24hChange: marketResponse.value.data.data.index24hChange || 0,
            tradingFees: marketResponse.value.data.data.tradingFees || 0,
            nextFunding: marketResponse.value.data.data.nextFunding || '--',
            rate: marketResponse.value.data.data.rate || 0,
            rateChange: marketResponse.value.data.data.rateChange || 0,
            timestamp: marketResponse.value.data.data.timestamp || Date.now(),
            source: marketResponse.value.data.data.source || 'lnmarkets'
          }
        : {
            index: 0,
            index24hChange: 0,
            tradingFees: 0,
            nextFunding: '--',
            rate: 0,
            rateChange: 0,
            timestamp: 0,
            source: 'lnmarkets'
          };

      const menuData = menuResponse.status === 'fulfilled' && menuResponse.value.data.success 
        ? menuResponse.value.data.data 
        : null;

      // Verificar se houve erros
      const errors = [
        balanceResponse.status === 'rejected' ? 'Balance' : null,
        positionsResponse.status === 'rejected' ? 'Positions' : null,
        marketResponse.status === 'rejected' ? 'Market' : null,
        menuResponse.status === 'rejected' ? 'Menu' : null
      ].filter(Boolean);

      setData(prev => ({
        ...prev,
        userBalance,
        userPositions,
        marketIndex,
        menuData,
        isLoading: false,
        lastUpdate: Date.now(),
        error: errors.length > 0 ? `Erro ao carregar: ${errors.join(', ')}` : null
      }));

      console.log('✅ CENTRALIZED DATA - All data updated successfully');
      console.log('📊 CENTRALIZED DATA - Summary:', {
        balance: userBalance ? '✅' : '❌',
        positions: userPositions.length,
        market: marketIndex.index > 0 ? '✅' : '❌',
        menu: menuData ? '✅' : '❌'
      });

    } catch (error) {
      console.error('❌ CENTRALIZED DATA - Error fetching data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erro ao carregar dados'
      }));
    }
  }, [isAuthenticated, user?.id]);

  // Carregar dados inicialmente
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      refreshData();
    }
  }, [isAuthenticated, user?.id, refreshData]);

  return {
    ...data,
    refreshData,
    isConnected: !data.error && data.lastUpdate > 0
  };
};
