import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { useWebSocket } from './useWebSocket';

interface DashboardData {
  user: any;
  balance: any;
  positions: any[];
  estimatedBalance: any;
  marketIndex: any;
  deposits: any[];
  withdrawals: any[];
  lastUpdate: number;
  cacheHit: boolean;
}

interface UseOptimizedDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdate: number | null;
  cacheHit: boolean;
}

/**
 * Hook otimizado para dados da dashboard
 * Aproveita o endpoint unificado e cache de credenciais implementados no roadmap
 */
export const useOptimizedDashboardData = (): UseOptimizedDashboardDataReturn => {
  const { isAuthenticated, user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  // Verificar se é admin
  const isAdmin = user?.is_admin || false;

  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      console.log('🔍 OPTIMIZED DASHBOARD - User not authenticated, skipping...');
      return;
    }

    // Log para debug
    console.log('🔍 OPTIMIZED DASHBOARD - User authenticated:', {
      userId: user.id,
      isAdmin: isAdmin,
      email: user.email,
      token: localStorage.getItem('access_token') ? 'EXISTS' : 'MISSING'
    });

    try {
      setIsLoading(true);
      setError(null);

      console.log('🚀 OPTIMIZED DASHBOARD - Fetching unified dashboard data...');
      const startTime = Date.now();

      // Uma única chamada para todos os dados (otimização principal)
      const response = await api.get('/api/lnmarkets-robust/dashboard');
      const dashboardData = response.data;

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (dashboardData.success && dashboardData.data) {
        console.log(`✅ OPTIMIZED DASHBOARD - Data received in ${duration}ms (API v2):`, {
          positions: dashboardData.data.positions?.length || 0,
          deposits: dashboardData.data.deposits?.length || 0,
          withdrawals: dashboardData.data.withdrawals?.length || 0,
          marketIndex: dashboardData.data.marketIndex ? 'present' : 'null',
          cacheHit: dashboardData.data.cacheHit,
          duration: `${duration}ms`
        });


        setData(dashboardData.data);
        setLastUpdate(dashboardData.data.lastUpdate);
        setCacheHit(dashboardData.data.cacheHit);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('❌ OPTIMIZED DASHBOARD - Error:', err);
      
      // Tratamento de erro baseado no roadmap
      if (err.response?.data?.error === 'MISSING_CREDENTIALS') {
        setError('LN Markets credentials not configured');
      } else if (err.response?.data?.error === 'INVALID_CREDENTIALS') {
        setError('LN Markets credentials are corrupted. Please reconfigure your API credentials in settings.');
      } else {
        setError(err.message || 'Failed to fetch dashboard data');
      }
      
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, isAdmin]);

  // WebSocket para atualizações em tempo real
  const wsUrl = `ws://localhost:13000/ws?userId=${user?.id || 'anonymous'}`;
  const { isConnected, sendMessage } = useWebSocket({
    url: wsUrl,
    onMessage: useCallback((message) => {
      console.log('📊 OPTIMIZED DASHBOARD - Mensagem WebSocket recebida:', message);
      
      if (message.type === 'position_update' || message.type === 'balance_update') {
        console.log('🔄 OPTIMIZED DASHBOARD - Atualizando dados via WebSocket...');
        fetchDashboardData();
      }
    }, [fetchDashboardData])
  });

  // ✅ FALLBACK CRÍTICO: Refresh periódico se WebSocket falhar
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    console.log('🔄 OPTIMIZED DASHBOARD - Configurando refresh periódico como fallback...');
    
    // Refresh a cada 30 segundos se WebSocket não estiver conectado
    const interval = setInterval(() => {
      if (!isConnected) {
        console.log('🔄 OPTIMIZED DASHBOARD - WebSocket desconectado, fazendo refresh periódico...');
        fetchDashboardData();
      }
    }, 30000); // 30 segundos

    return () => {
      console.log('🔄 OPTIMIZED DASHBOARD - Limpando refresh periódico...');
      clearInterval(interval);
    };
  }, [isAuthenticated, user?.id, isConnected, fetchDashboardData]);

  // Carregar dados inicialmente
  useEffect(() => {
    console.log('🔍 OPTIMIZED DASHBOARD - useEffect triggered:', {
      isAuthenticated,
      userId: user?.id,
      isAdmin,
      token: localStorage.getItem('access_token') ? 'EXISTS' : 'MISSING'
    });
    
    if (isAuthenticated && user?.id) {
      console.log('🚀 OPTIMIZED DASHBOARD - Calling fetchDashboardData...');
      fetchDashboardData();
    } else {
      console.log('❌ OPTIMIZED DASHBOARD - Not authenticated or no user ID');
    }
  }, [isAuthenticated, user?.id, isAdmin]);

  // Função para refresh manual
  const refresh = useCallback(async () => {
    console.log('🔄 OPTIMIZED DASHBOARD - Manual refresh triggered...');
    await fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    isLoading,
    error,
    refresh,
    lastUpdate,
    cacheHit
  };
};

/**
 * Hook para métricas da dashboard otimizadas
 * Usa dados do endpoint unificado
 */
export const useOptimizedDashboardMetrics = () => {
  const { data, isLoading, error } = useOptimizedDashboardData();

  if (!data || isLoading || error) {
    // ✅ SEGURO: Retornar valores zero quando não há dados reais
    // Nunca usar dados simulados em mercados voláteis!
    return {
      totalPL: 0, // Zero - dados indisponíveis
      estimatedProfit: 0, // Zero - dados indisponíveis
      totalMargin: 0, // Zero - dados indisponíveis
      estimatedFees: 0, // Zero - dados indisponíveis
      availableMargin: 0, // Zero - dados indisponíveis
      estimatedBalance: 0, // Zero - dados indisponíveis
      totalInvested: 0, // Zero - dados indisponíveis
      netProfit: 0, // Zero - dados indisponíveis
      feesPaid: 0, // Zero - dados indisponíveis
      positionCount: 0, // Zero - dados indisponíveis
      activeTrades: 0, // Zero - dados indisponíveis
      isLoading,
      error: error || 'Dados indisponíveis - por segurança, não exibimos dados antigos'
    };
  }

  // ✅ VALIDAÇÃO DE SEGURANÇA: Verificar se dados são recentes
  const lastUpdate = data.lnMarkets?.metadata?.lastUpdate;
  if (lastUpdate) {
    const dataAge = Date.now() - new Date(lastUpdate).getTime();
    const maxAge = 30 * 1000; // 30 segundos máximo
    
    if (dataAge > maxAge) {
      console.warn('🚨 SEGURANÇA - Dados muito antigos:', {
        age: dataAge,
        maxAge,
        lastUpdate,
        message: 'Rejeitando dados antigos por segurança'
      });
      
      return {
        totalPL: 0,
        estimatedProfit: 0,
        totalMargin: 0,
        estimatedFees: 0,
        availableMargin: 0,
        estimatedBalance: 0,
        totalInvested: 0,
        netProfit: 0,
        feesPaid: 0,
        positionCount: 0,
        activeTrades: 0,
        isLoading: false,
        error: 'Dados muito antigos - por segurança, não exibimos dados desatualizados'
      };
    }
  }

  // Calcular métricas dos dados unificados (API v2)
  const positions = data.lnMarkets?.positions || [];
  const user = data.lnMarkets?.user || {};
  
  // Calcular P&L total das posições running
  const totalPL = positions.reduce((sum, pos) => sum + (pos.pl || 0), 0);
  const estimatedProfit = totalPL; // P&L atual
  const totalMargin = positions.reduce((sum, pos) => sum + (pos.margin || 0), 0);
  const estimatedFees = positions.reduce((sum, pos) => sum + (pos.opening_fee || 0) + (pos.closing_fee || 0), 0);
  const availableMargin = user.balance || 0; // Saldo da wallet
  const estimatedBalance = (user.balance || 0) + totalPL; // Saldo + P&L
  const totalInvested = totalMargin; // Margem total investida
  const netProfit = totalPL; // P&L líquido
  const feesPaid = estimatedFees; // Taxas pagas
  const positionCount = positions.length;
  const activeTrades = positions.filter(p => p.running && !p.closed).length;

  return {
    totalPL,
    estimatedProfit,
    totalMargin,
    estimatedFees,
    availableMargin,
    estimatedBalance,
    totalInvested,
    netProfit,
    feesPaid,
    positionCount,
    activeTrades,
    isLoading,
    error
  };
};

/**
 * Hook para dados de posições otimizados
 * Usa dados do endpoint unificado
 */
export const useOptimizedPositions = () => {
  const { data, isLoading, error } = useOptimizedDashboardData();

  const positions = data?.lnMarkets?.positions || [];

  return {
    positions,
    isLoading,
    error
  };
};

/**
 * Hook para dados de mercado otimizados
 * Usa dados do endpoint unificado
 */
export const useOptimizedMarketData = () => {
  const { data, isLoading, error } = useOptimizedDashboardData();

  return {
    marketIndex: data?.lnMarkets?.market || null,
    deposits: data?.lnMarkets?.deposits || [],
    withdrawals: data?.lnMarkets?.withdrawals || [],
    isLoading,
    error
  };
};
