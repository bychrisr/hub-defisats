import { useState, useEffect, useCallback } from 'react';
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
}

interface UseEstimatedBalanceReturn {
  data: EstimatedBalanceData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useEstimatedBalance = (): UseEstimatedBalanceReturn => {
  const { user } = useAuthStore();
  const [data, setData] = useState<EstimatedBalanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isAdmin = user?.is_admin || false;
  
  console.log('🔍 ESTIMATED BALANCE HOOK - Hook initialized:', { user: user?.id, isAdmin });
  console.log('🔍 ESTIMATED BALANCE HOOK - Will make API call:', !isAdmin && user?.id);

  const fetchEstimatedBalance = useCallback(async () => {
    // Pular para admins - eles não têm credenciais LN Markets
    if (isAdmin) {
      console.log('🔍 ESTIMATED BALANCE HOOK - Admin user, skipping LN Markets queries...');
      setIsLoading(false);
      return;
    }
    
    // Verificar se usuário está autenticado
    if (!user?.id) {
      console.log('🔍 ESTIMATED BALANCE HOOK - No user ID, skipping...');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 ESTIMATED BALANCE HOOK - Fetching estimated balance from API...');
      
      const response = await api.get('/api/lnmarkets/user/estimated-balance');
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
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    console.log('🔍 ESTIMATED BALANCE HOOK - useEffect triggered:', { userId: user?.id, isAdmin });
    fetchEstimatedBalance();
    
    // Desabilitar polling automático - será controlado pelo useRealtimeDashboard
    // const interval = setInterval(() => {
    //   fetchEstimatedBalance();
    // }, 30000);
    
    // return () => clearInterval(interval);
  }, [fetchEstimatedBalance]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchEstimatedBalance,
  };
};
