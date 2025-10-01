import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

interface EstimatedBalanceData {
  wallet_balance: number;
  total_margin: number;
  total_pnl: number;
  total_fees: number;
  estimated_balance: number;
  total_invested: number;
  positions_count: number;
  trades_count: number;
  // Novos campos para os cards adicionais
  success_rate: number;
  winning_trades: number;
  lost_trades: number;
  total_trades: number;
  active_positions: number;
  average_pnl: number;
  win_rate: number;
  max_drawdown: number;
  sharpe_ratio: number;
  volatility: number;
  // 4 novas métricas
  win_streak: number;
  best_trade: number;
  risk_reward_ratio: number;
  trading_frequency: number;
}

interface UseEstimatedBalanceReturn {
  data: EstimatedBalanceData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useEstimatedBalance = (): UseEstimatedBalanceReturn => {
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const [data, setData] = useState<EstimatedBalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isAdmin = user?.is_admin || false;
  
  console.log('🔍 ESTIMATED BALANCE HOOK - Hook initialized:', { user: user?.id, isAdmin });
  console.log('🔍 ESTIMATED BALANCE HOOK - Will make API call:', !isAdmin && user?.id);

  const fetchEstimatedBalance = useCallback(async () => {
    // Aguardar inicialização do store de autenticação
    if (!isInitialized) {
      console.log('🔍 ESTIMATED BALANCE HOOK - Auth store not initialized yet, waiting...');
      setIsLoading(true);
      return;
    }
    
    // Verificar se usuário está autenticado
    if (!isAuthenticated || !user?.id) {
      console.log('🔍 ESTIMATED BALANCE HOOK - User not authenticated:', { isAuthenticated, userId: user?.id });
      setIsLoading(false);
      return;
    }
    
    // Pular para admins - eles não têm credenciais LN Markets
    if (isAdmin) {
      console.log('🔍 ESTIMATED BALANCE HOOK - Admin user, skipping LN Markets queries...');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 ESTIMATED BALANCE HOOK - Fetching estimated balance from API...');
      
      const response = await api.get('/api/lnmarkets-robust/dashboard');
      console.log('🔍 ESTIMATED BALANCE HOOK - Response received:', response.data);
      
      if (response.data.success && response.data.data) {
        const balanceData = response.data.data;
        console.log('✅ ESTIMATED BALANCE HOOK - Data received:', balanceData);
        
        setData({
          wallet_balance: balanceData.wallet_balance || 0,
          total_margin: balanceData.total_margin || 0,
          total_pnl: balanceData.total_pnl || 0,
          total_fees: balanceData.total_fees || 0,
          estimated_balance: balanceData.estimated_balance || 0,
          total_invested: balanceData.total_invested || 0,
          positions_count: balanceData.positions_count || 0,
          trades_count: balanceData.trades_count || 0,
          // Novos campos
          success_rate: balanceData.success_rate || 0,
          winning_trades: balanceData.winning_trades || 0,
          lost_trades: balanceData.lost_trades || 0,
          total_trades: balanceData.total_trades || 0,
          active_positions: balanceData.active_positions || 0,
          average_pnl: balanceData.average_pnl || 0,
          win_rate: balanceData.win_rate || 0,
          max_drawdown: balanceData.max_drawdown || 0,
          sharpe_ratio: balanceData.sharpe_ratio || 0,
          volatility: balanceData.volatility || 0,
          // 4 novas métricas
          win_streak: balanceData.win_streak || 0,
          best_trade: balanceData.best_trade || 0,
          risk_reward_ratio: balanceData.risk_reward_ratio || 0,
          trading_frequency: balanceData.trading_frequency || 0,
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('❌ ESTIMATED BALANCE HOOK - Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao buscar saldo estimado';
      setError(errorMessage);
      
      // Em caso de erro, retornar dados padrão
      setData({
        wallet_balance: 0,
        total_margin: 0,
        total_pnl: 0,
        total_fees: 0,
        estimated_balance: 0,
        total_invested: 0,
        positions_count: 0,
        trades_count: 0,
        // Novos campos com valores padrão
        success_rate: 0,
        winning_trades: 0,
        lost_trades: 0,
        total_trades: 0,
        active_positions: 0,
        average_pnl: 0,
        win_rate: 0,
        max_drawdown: 0,
        sharpe_ratio: 0,
        volatility: 0,
        // 4 novas métricas
        win_streak: 0,
        best_trade: 0,
        risk_reward_ratio: 0,
        trading_frequency: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, user?.id, isAuthenticated, isInitialized]);

  // ✅ REFATORAÇÃO: Otimização de Performance (Conforme VOLATILE_MARKET_SAFETY.md)
  const isInitialLoad = useRef(true);
  const lastUserId = useRef(user?.id);

  useEffect(() => {
    console.log('🔍 ESTIMATED BALANCE HOOK - useEffect triggered:', { 
      userId: user?.id, 
      isAdmin, 
      isAuthenticated,
      isInitialized,
      hasToken: !!localStorage.getItem('access_token')
    });
    
    // ✅ REFATORAÇÃO: Executar apenas quando necessário
    if (isInitialLoad.current || lastUserId.current !== user?.id) {
      console.log('🔍 ESTIMATED BALANCE HOOK - Fetching estimated balance from API...');
      fetchEstimatedBalance();
      isInitialLoad.current = false;
      lastUserId.current = user?.id;
    }
    
    // Desabilitar polling automático - será controlado pelo useRealtimeDashboard
    // const interval = setInterval(() => {
    //   fetchEstimatedBalance();
    // }, 30000);
    
    // return () => clearInterval(interval);
  }, [user?.id, isAdmin, isAuthenticated, isInitialized]); // ✅ REFATORAÇÃO: Removido fetchEstimatedBalance para evitar loop

  return {
    data,
    isLoading,
    error,
    refetch: fetchEstimatedBalance,
  };
};
