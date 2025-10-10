import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useActiveAccountData } from '@/hooks/useActiveAccountData';

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
  const { accountInfo } = useActiveAccountData(); // Escutar mudanças de conta ativa
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
      // ✅ REQUISIÇÃO ÚNICA: Usar apenas o endpoint unificado que já tem tudo
      const dashboardResponse = await api.get('/api/lnmarkets-robust/dashboard');
      const dashboardData = dashboardResponse.data;

      console.log('📊 MARKET DATA - Data received from unified endpoint:', {
        dashboardSuccess: dashboardData.success,
        positionsCount: dashboardData.data?.positions?.length || 0,
        hasBalance: !!dashboardData.data?.balance,
        hasMarketIndex: !!dashboardData.data?.marketIndex,
        lnMarketsStructure: Object.keys(dashboardData.data || {}),
        accountInfo: {
          accountId: dashboardData.data?.accountId,
          accountName: dashboardData.data?.accountName,
          exchangeName: dashboardData.data?.exchangeName
        }
      });

      // ✅ CONSOLIDAR DADOS DO ENDPOINT UNIFICADO
      const consolidatedData: MarketData = {
        // Dados do mercado (do endpoint unificado)
        btcPrice: dashboardData.data?.marketIndex?.index || 0,
        marketIndex: dashboardData.data?.marketIndex,
        ticker: dashboardData.data?.marketIndex,
        
        // Dados de posições (CORRIGIDO: usar posições diretas)
        positions: dashboardData.data?.positions || [],
        
        // Dados de saldo (CORRIGIDO: usar saldo direto)
        balance: dashboardData.data?.balance,
        estimatedBalance: dashboardData.data?.estimatedBalance || dashboardData.data?.balance,
        
        // Metadados
        lastUpdate: dashboardData.data?.lastUpdate || Date.now(),
        isLoading: false,
        error: null,
        cacheHit: dashboardData.data?.cacheHit || false
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

  // ✅ ESCUTAR MUDANÇAS DE CONTA ATIVA
  useEffect(() => {
    if (accountInfo?.accountId) {
      console.log('🔄 MARKET DATA - Active account changed, refreshing data:', {
        accountId: accountInfo.accountId,
        accountName: accountInfo.accountName,
        exchangeName: accountInfo.exchangeName,
        timestamp: new Date(accountInfo.timestamp).toISOString()
      });
      
      // Refresh automático quando conta ativa mudar
      fetchAllMarketData();
    }
  }, [accountInfo?.accountId, fetchAllMarketData]);

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

  console.log('🔍 OPTIMIZED POSITIONS - Data:', {
    hasData: !!data,
    hasPositions: !!data?.positions,
    positionsLength: data?.positions?.length || 0,
    positions: data?.positions?.map(p => ({ id: p.id, pl: p.pl, side: p.side })) || []
  });

  return {
    positions: data?.positions || [],
    isLoading,
    error
  };
};

export const useOptimizedDashboardMetrics = () => {
  const { data } = useMarketData();
  
  if (!data || !data.positions) {
    console.log('🔍 DASHBOARD METRICS - No data or positions available:', {
      hasData: !!data,
      hasPositions: !!data?.positions,
      positionsLength: data?.positions?.length || 0
    });
    return {
      totalPL: 0,
      totalMargin: 0,
      positionCount: 0,
      availableMargin: 0,
      estimatedBalance: 0
    };
  }

  // Calcular métricas das posições
  const totalPL = data.positions.reduce((sum, pos) => sum + (pos.pl || 0), 0);
  const totalMargin = data.positions.reduce((sum, pos) => sum + (pos.margin || 0), 0);
  const positionCount = data.positions.length;
  const availableMargin = data.balance?.balance || 0;
  const estimatedBalance = (data.balance?.balance || 0) + totalPL;

  console.log('📊 DASHBOARD METRICS - Calculated metrics:', {
    totalPL,
    totalMargin,
    positionCount,
    availableMargin,
    estimatedBalance,
    positions: data.positions.map(p => ({ id: p.id, pl: p.pl, margin: p.margin }))
  });

  return {
    totalPL,
    totalMargin,
    positionCount,
    availableMargin,
    estimatedBalance
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
  
  console.log('🔍 OPTIMIZED MARKET DATA - Data:', {
    hasData: !!data,
    hasMarketIndex: !!data?.marketIndex,
    marketIndex: data?.marketIndex,
    hasBalance: !!data?.balance
  });
  
  return {
    marketIndex: data?.marketIndex || null,
    ticker: data?.ticker || null,
    balance: data?.balance || null,
    deposits: data?.deposits || [],
    withdrawals: data?.withdrawals || [],
    isLoading,
    error
  };
};
