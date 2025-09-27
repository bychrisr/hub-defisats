/**
 * Hooks para endpoints refatorados da LN Markets API v2
 * 
 * Estes hooks consomem os novos endpoints refatorados em /api/lnmarkets/v2/
 * que utilizam a nova arquitetura modular com ExchangeApiService
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface LNMarketsRefactoredResponse<T> {
  success: boolean;
  data: T;
  timestamp: number;
}

interface RefactoredPosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  price: number;
  margin: number;
  pnl: number;
  pnlPercentage: number;
  marginRatio: number;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
  openingFee?: number;
  closingFee?: number;
  running?: boolean;
  closed?: boolean;
}

interface RefactoredBalance {
  balance: number;
  currency: string;
  available: number;
  locked: number;
  timestamp: number;
}

interface RefactoredTicker {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

interface RefactoredUser {
  id: string;
  email: string;
  username: string;
  isTestnet: boolean;
  createdAt: string;
  lastLogin: string;
}

interface RefactoredDashboardData {
  user: RefactoredUser;
  balance: RefactoredBalance;
  positions: RefactoredPosition[];
  ticker: RefactoredTicker;
  lastUpdate: number;
  cacheHit: boolean;
}

// ============================================================================
// HOOK PRINCIPAL: DADOS DA DASHBOARD REFATORADOS
// ============================================================================

interface UseLNMarketsRefactoredDashboardReturn {
  data: RefactoredDashboardData | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: number | null;
  cacheHit: boolean;
  refresh: () => Promise<void>;
}

export const useLNMarketsRefactoredDashboard = (): UseLNMarketsRefactoredDashboardReturn => {
  const { isAuthenticated, user } = useAuthStore();
  const [data, setData] = useState<RefactoredDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  const isAdmin = user?.is_admin || false;

  const fetchDashboardData = useCallback(async () => {
    // Pular para admins - eles não têm credenciais LN Markets
    if (isAdmin) {
      console.log('🔍 REFACTORED DASHBOARD - Admin user, skipping LN Markets queries...');
      setIsLoading(false);
      return;
    }

    if (!isAuthenticated || !user?.id) {
      console.log('🔍 REFACTORED DASHBOARD - User not authenticated, skipping...');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🚀 REFACTORED DASHBOARD - Fetching refactored dashboard data...');
      const startTime = Date.now();

      // Chamada para o endpoint refatorado
      const response = await api.get('/api/lnmarkets-robust/dashboard');
      const dashboardData = response.data;

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (dashboardData.success && dashboardData.data) {
        console.log(`✅ REFACTORED DASHBOARD - Data received in ${duration}ms (API v2 refactored):`, {
          user: dashboardData.data.user ? 'present' : 'null',
          balance: dashboardData.data.balance ? 'present' : 'null',
          positions: dashboardData.data.positions?.length || 0,
          ticker: dashboardData.data.ticker ? 'present' : 'null',
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
      console.error('❌ REFACTORED DASHBOARD - Error:', err);
      
      // Tratamento de erro específico para endpoints refatorados
      if (err.response?.data?.error === 'UNAUTHORIZED') {
        setError('Authentication required. Please log in again.');
      } else if (err.response?.data?.error === 'MISSING_CREDENTIALS') {
        setError('LN Markets credentials not configured');
      } else if (err.response?.data?.error === 'INVALID_CREDENTIALS') {
        setError('LN Markets credentials are corrupted. Please reconfigure your API credentials in settings.');
      } else {
        setError(err.message || 'Failed to fetch refactored dashboard data');
      }
      
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, isAdmin]);

  // Carregar dados inicialmente
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user?.id, fetchDashboardData]);

  // Função para refresh manual
  const refresh = useCallback(async () => {
    await fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    isLoading,
    error,
    lastUpdate,
    cacheHit,
    refresh
  };
};

// ============================================================================
// HOOK: POSIÇÕES REFATORADAS
// ============================================================================

interface UseLNMarketsRefactoredPositionsReturn {
  positions: RefactoredPosition[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useLNMarketsRefactoredPositions = (): UseLNMarketsRefactoredPositionsReturn => {
  const { data, isLoading, error, refresh } = useLNMarketsRefactoredDashboard();

  return {
    positions: data?.positions || [],
    isLoading,
    error,
    refresh
  };
};

// ============================================================================
// HOOK: SALDO REFATORADO
// ============================================================================

interface UseLNMarketsRefactoredBalanceReturn {
  balance: RefactoredBalance | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useLNMarketsRefactoredBalance = (): UseLNMarketsRefactoredBalanceReturn => {
  const { data, isLoading, error, refresh } = useLNMarketsRefactoredDashboard();

  return {
    balance: data?.balance || null,
    isLoading,
    error,
    refresh
  };
};

// ============================================================================
// HOOK: TICKER REFATORADO
// ============================================================================

interface UseLNMarketsRefactoredTickerReturn {
  ticker: RefactoredTicker | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useLNMarketsRefactoredTicker = (): UseLNMarketsRefactoredTickerReturn => {
  const { data, isLoading, error, refresh } = useLNMarketsRefactoredDashboard();

  return {
    ticker: data?.ticker || null,
    isLoading,
    error,
    refresh
  };
};

// ============================================================================
// HOOK: MÉTRICAS REFATORADAS
// ============================================================================

interface UseLNMarketsRefactoredMetricsReturn {
  totalPL: number;
  estimatedProfit: number;
  totalMargin: number;
  estimatedFees: number;
  availableMargin: number;
  estimatedBalance: number;
  totalInvested: number;
  netProfit: number;
  feesPaid: number;
  positionCount: number;
  activeTrades: number;
  isLoading: boolean;
  error: string | null;
}

export const useLNMarketsRefactoredMetrics = (): UseLNMarketsRefactoredMetricsReturn => {
  const { data, isLoading, error } = useLNMarketsRefactoredDashboard();

  if (!data || isLoading || error) {
    // Retornar dados de teste quando não há dados reais
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
      isLoading,
      error
    };
  }

  // Calcular métricas dos dados refatorados
  const totalPL = data.balance?.balance || 0;
  const estimatedProfit = data.balance?.balance || 0;
  const totalMargin = data.positions?.reduce((sum, pos) => sum + (pos.margin || 0), 0) || 0;
  const estimatedFees = data.positions?.reduce((sum, pos) => sum + (pos.openingFee || 0) + (pos.closingFee || 0), 0) || 0;
  const availableMargin = data.balance?.available || 0;
  const estimatedBalance = data.balance?.balance || 0;
  const totalInvested = data.positions?.reduce((sum, pos) => sum + (pos.margin || 0), 0) || 0;
  const netProfit = data.positions?.reduce((sum, pos) => sum + (pos.pnl || 0), 0) || 0;
  const feesPaid = data.positions?.reduce((sum, pos) => sum + (pos.openingFee || 0) + (pos.closingFee || 0), 0) || 0;
  const positionCount = data.positions?.length || 0;
  const activeTrades = data.positions?.filter(p => p.running && !p.closed).length || 0;

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

// ============================================================================
// HOOK: STATUS DE CONEXÃO REFATORADO
// ============================================================================

interface UseLNMarketsRefactoredConnectionStatusReturn {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export const useLNMarketsRefactoredConnectionStatus = (): UseLNMarketsRefactoredConnectionStatusReturn => {
  const { data, isLoading, error, lastUpdate } = useLNMarketsRefactoredDashboard();
  const { user } = useAuthStore();

  // Verificar se usuário tem credenciais configuradas
  const hasCredentials = !!(
    user?.ln_markets_api_key && 
    user?.ln_markets_api_secret && 
    user?.ln_markets_passphrase
  );

  // Verificar se temos dados válidos
  const hasValidData = data && lastUpdate && lastUpdate > 0 && (
    (data.balance !== null && data.balance !== undefined) ||
    (data.positions && data.positions.length > 0) ||
    (data.ticker !== null && data.ticker !== undefined)
  );

  // Verificar erros de credenciais
  const hasCredentialError = error?.includes('credentials') || 
                            error?.includes('authentication') ||
                            error?.includes('unauthorized');

  const isConnected = hasCredentials && hasValidData && !hasCredentialError;

  return {
    isConnected,
    isLoading,
    error,
    lastChecked: lastUpdate ? new Date(lastUpdate) : null
  };
};

// ============================================================================
// HOOK: TEMPO REAL REFATORADO
// ============================================================================

interface UseLNMarketsRefactoredRealtimeConfig {
  positionsInterval?: number;
  balanceInterval?: number;
  tickerInterval?: number;
  enabled?: boolean;
}

interface UseLNMarketsRefactoredRealtimeReturn {
  refreshAll: () => Promise<void>;
  isEnabled: boolean;
  start: () => void;
  stop: () => void;
}

export const useLNMarketsRefactoredRealtime = (config: UseLNMarketsRefactoredRealtimeConfig = {}): UseLNMarketsRefactoredRealtimeReturn => {
  const {
    positionsInterval = 10000, // 10 segundos
    balanceInterval = 30000,   // 30 segundos
    tickerInterval = 60000,    // 1 minuto
    enabled = true
  } = config;

  const { refresh } = useLNMarketsRefactoredDashboard();
  const [isEnabled, setIsEnabled] = useState(enabled);

  const refreshAll = useCallback(async () => {
    if (enabled) {
      await refresh();
    }
  }, [refresh, enabled]);

  const start = useCallback(() => {
    setIsEnabled(true);
  }, []);

  const stop = useCallback(() => {
    setIsEnabled(false);
  }, []);

  // Configurar intervalos de atualização
  useEffect(() => {
    if (!enabled || !isEnabled) return;

    const intervals: NodeJS.Timeout[] = [];

    // Intervalo para posições
    if (positionsInterval > 0) {
      const positionsIntervalId = setInterval(refreshAll, positionsInterval);
      intervals.push(positionsIntervalId);
    }

    // Intervalo para saldo
    if (balanceInterval > 0) {
      const balanceIntervalId = setInterval(refreshAll, balanceInterval);
      intervals.push(balanceIntervalId);
    }

    // Intervalo para ticker
    if (tickerInterval > 0) {
      const tickerIntervalId = setInterval(refreshAll, tickerInterval);
      intervals.push(tickerIntervalId);
    }

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [enabled, isEnabled, positionsInterval, balanceInterval, tickerInterval, refreshAll]);

  return {
    refreshAll,
    isEnabled,
    start,
    stop
  };
};
