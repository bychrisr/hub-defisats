import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

interface MarketData {
  // Dados do mercado
  btcPrice: number;
  marketIndex: any;
  ticker: any;
  
  // Dados de posições
  positions: any[];
  
  // Dados de saldo
  balance: any;
  estimatedBalance: any;
  
  // Metadados
  lastUpdate: number;
  isLoading: boolean;
  error: string | null;
  cacheHit: boolean;
}

interface MarketDataContextType {
  data: MarketData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdate: number | null;
  cacheHit: boolean;
}

const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined);

interface MarketDataProviderProps {
  children: React.ReactNode;
  refreshInterval?: number; // Intervalo de atualização em ms (0 = desabilitado)
}

export const MarketDataProvider: React.FC<MarketDataProviderProps> = ({ 
  children, 
  refreshInterval = 0 // Desabilitado por padrão para evitar recarregamentos
}) => {
  const { isAuthenticated, user } = useAuthStore();
  const [data, setData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [cacheHit, setCacheHit] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  // ✅ FUNÇÃO CENTRALIZADA PARA BUSCAR TODOS OS DADOS DE MERCADO
  const fetchAllMarketData = useCallback(async () => {
    console.log('🔍 MARKET DATA - fetchAllMarketData called:', {
      isAuthenticated,
      userId: user?.id,
      isAdmin: user?.is_admin,
      hasToken: !!localStorage.getItem('access_token')
    });
    
    if (!isAuthenticated || !user?.id) {
      console.log('❌ MARKET DATA - User not authenticated, skipping...');
      return;
    }
    
    // Pular para admins - eles não têm credenciais LN Markets
    if (user?.is_admin) {
      console.log('🔍 MARKET DATA - Admin user, skipping LN Markets queries...');
      return;
    }

    console.log('🔄 MARKET DATA - Fetching all market data...');
    setIsLoading(true);
    setError(null);

    try {
      // ✅ REQUISIÇÃO ÚNICA: Buscar todos os dados de uma vez
      const [dashboardResponse, marketResponse] = await Promise.all([
        api.get('/api/lnmarkets-robust/dashboard'),
        api.get('/api/market/index/public')
      ]);

      const dashboardData = dashboardResponse.data;
      const marketData = marketResponse.data;

      console.log('📊 MARKET DATA - Data received:', {
        dashboardSuccess: dashboardData.success,
        marketSuccess: marketData.success,
        positionsCount: dashboardData.data?.lnMarkets?.positions?.length || 0,
        hasBalance: !!dashboardData.data?.lnMarkets?.balance,
        btcPrice: marketData.data?.index || 0,
        lnMarketsStructure: Object.keys(dashboardData.data?.lnMarkets || {})
      });

      // ✅ CONSOLIDAR TODOS OS DADOS EM UM ÚNICO OBJETO
      const consolidatedData: MarketData = {
        // Dados do mercado
        btcPrice: marketData.data?.index || 0,
        marketIndex: marketData.data,
        ticker: marketData.data,
        
        // Dados de posições (CORRIGIDO: usar lnMarkets.positions)
        positions: dashboardData.data?.lnMarkets?.positions || [],
        
        // Dados de saldo (CORRIGIDO: usar lnMarkets.balance)
        balance: dashboardData.data?.lnMarkets?.balance,
        estimatedBalance: dashboardData.data?.lnMarkets?.balance,
        
        // Metadados
        lastUpdate: Date.now(),
        isLoading: false,
        error: null,
        cacheHit: false
      };

      setData(consolidatedData);
      setLastUpdate(Date.now());
      setCacheHit(false);
      
      console.log('✅ MARKET DATA - All data consolidated successfully:', {
        positionsCount: consolidatedData.positions.length,
        btcPrice: consolidatedData.btcPrice,
        hasBalance: !!consolidatedData.balance,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('❌ MARKET DATA - Error fetching data:', error);
      setError(error.message || 'Failed to fetch market data');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // ✅ FUNÇÃO DE REFRESH MANUAL
  const refresh = useCallback(async () => {
    console.log('🔄 MARKET DATA - Manual refresh triggered...');
    await fetchAllMarketData();
  }, [fetchAllMarketData]);

  // ✅ CARREGAMENTO INICIAL
  useEffect(() => {
    if (isAuthenticated && user?.id && isInitialLoad.current) {
      console.log('🚀 MARKET DATA - Initial load...');
      fetchAllMarketData();
      isInitialLoad.current = false;
    }
  }, [isAuthenticated, user?.id, fetchAllMarketData]);

  // ✅ ATUALIZAÇÃO AUTOMÁTICA (OPCIONAL)
  useEffect(() => {
    if (!isAuthenticated || !user?.id || refreshInterval <= 0) return;

    console.log(`🔄 MARKET DATA - Setting up auto-refresh every ${refreshInterval}ms`);
    
    intervalRef.current = setInterval(() => {
      console.log('🔄 MARKET DATA - Auto-refresh triggered...');
      fetchAllMarketData();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id, refreshInterval, fetchAllMarketData]);

  const contextValue: MarketDataContextType = {
    data,
    isLoading,
    error,
    refresh,
    lastUpdate,
    cacheHit
  };

  return (
    <MarketDataContext.Provider value={contextValue}>
      {children}
    </MarketDataContext.Provider>
  );
};

// ✅ HOOK PARA USAR OS DADOS CENTRALIZADOS
export const useMarketData = () => {
  const context = useContext(MarketDataContext);
  if (context === undefined) {
    throw new Error('useMarketData must be used within a MarketDataProvider');
  }
  return context;
};

// ✅ HOOKS ESPECÍFICOS PARA COMPATIBILIDADE
export const useMarketTicker = () => {
  const { data, isLoading, error } = useMarketData();
  
  return {
    data: data?.ticker || null,
    isLoading,
    error,
    refresh: () => {} // Será implementado pelo contexto
  };
};

export const useOptimizedPositions = () => {
  const { data, isLoading, error } = useMarketData();
  
  return {
    positions: data?.positions || [],
    isLoading,
    error
  };
};

export const useOptimizedDashboardMetrics = () => {
  const { data } = useMarketData();
  
  if (!data) {
    return {
      totalPL: 0,
      totalMargin: 0,
      positionCount: 0
    };
  }

  // Calcular métricas das posições
  const totalPL = data.positions.reduce((sum, pos) => sum + (pos.pl || 0), 0);
  const totalMargin = data.positions.reduce((sum, pos) => sum + (pos.margin || 0), 0);
  const positionCount = data.positions.length;

  return {
    totalPL,
    totalMargin,
    positionCount
  };
};

export const useBtcPrice = () => {
  const { data, isLoading, error } = useMarketData();
  
  return {
    price: data?.btcPrice || 0,
    isLoading,
    error
  };
};

// ✅ HOOK DE COMPATIBILIDADE: useOptimizedMarketData
export const useOptimizedMarketData = () => {
  const { data, isLoading, error } = useMarketData();
  
  return {
    marketIndex: data?.marketIndex || null,
    ticker: data?.ticker || null,
    isLoading,
    error
  };
};
