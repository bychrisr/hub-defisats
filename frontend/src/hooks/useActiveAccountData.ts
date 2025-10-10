/**
 * Hook para gerenciar dados da conta ativa via WebSocket
 * 
 * Escuta mudanças de conta ativa via WebSocket e fornece informações
 * sobre a conta ativa atual para atualização automática da dashboard.
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/auth';
import { api } from '@/lib/api';
import { accountEventManager } from './useAccountEvents';

// Interface para informações da conta ativa
export interface ActiveAccountInfo {
  accountId: string;
  accountName: string;
  exchangeName: string;
  exchangeId: string;
  timestamp: number;
}

// Interface para estado do hook
export interface UseActiveAccountDataReturn {
  accountInfo: ActiveAccountInfo | null;
  isLoading: boolean;
  error: string | null;
  refreshDashboardData: () => void;
  hasActiveAccount: boolean;
}

export const useActiveAccountData = (): UseActiveAccountDataReturn => {
  const [accountInfo, setAccountInfo] = useState<ActiveAccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { user } = useAuthStore();

  // Função para trigger refresh da dashboard
  const refreshDashboardData = useCallback(() => {
    console.log('🔄 ACTIVE ACCOUNT DATA - Triggering dashboard refresh');
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // === LISTENER PARA EVENTOS DE CONTA ATIVADA (via accountEventManager) ===
  useEffect(() => {
    const handleAccountActivated = async () => {
      if (!user?.id) return;
      console.log('🔄 ACTIVE ACCOUNT DATA - Account activated, refetching...');
      
      try {
        const response = await api.get('/api/lnmarkets-robust/dashboard');
        if (response.data.success && response.data.data) {
          const { accountId, accountName, exchangeName } = response.data.data;
          setAccountInfo({
            accountId,
            accountName,
            exchangeName,
            exchangeId: exchangeName,
            timestamp: Date.now()
          });
          refreshDashboardData();
        }
      } catch (error) {
        console.error('❌ ACTIVE ACCOUNT DATA - Error:', error);
      }
    };
    
    accountEventManager.subscribe('accountActivated', handleAccountActivated);
    return () => accountEventManager.unsubscribe('accountActivated', handleAccountActivated);
  }, [user?.id, refreshDashboardData]);



  // ========================================================================
  // FETCH INICIAL DA CONTA ATIVA
  // ========================================================================
  
  useEffect(() => {
    const fetchInitialAccountInfo = async () => {
      if (!user?.id) {
        console.log('🔍 ACTIVE ACCOUNT DATA - No user ID, skipping initial fetch');
        return;
      }
      
      console.log('🚀 ACTIVE ACCOUNT DATA - Fetching initial account info for user:', user.id);
      
      try {
        const response = await api.get('/api/lnmarkets-robust/dashboard');
        
        if (response.data.success && response.data.data) {
          const { accountId, accountName, exchangeName, status } = response.data.data;
          
          if (accountId && accountName && exchangeName) {
            const initialAccountInfo: ActiveAccountInfo = {
              accountId,
              accountName,
              exchangeName,
              exchangeId: status?.activeAccount?.exchange || exchangeName,
              timestamp: Date.now()
            };
            
            setAccountInfo(initialAccountInfo);
            setError(null);
            
            console.log('✅ ACTIVE ACCOUNT DATA - Initial account info loaded:', {
              accountId,
              accountName,
              exchangeName,
              timestamp: new Date(initialAccountInfo.timestamp).toISOString()
            });
          } else {
            console.log('⚠️ ACTIVE ACCOUNT DATA - No active account found in API response');
          }
        } else {
          console.log('⚠️ ACTIVE ACCOUNT DATA - API response indicates no active account');
        }
      } catch (error) {
        console.error('❌ ACTIVE ACCOUNT DATA - Error fetching initial account info:', error);
        // Não definir error aqui para não interferir com WebSocket
        // O WebSocket ainda pode funcionar para mudanças futuras
      }
    };
    
    fetchInitialAccountInfo();
  }, [user?.id]);

  // Determinar se tem conta ativa
  const hasActiveAccount = accountInfo !== null;

  // Log para debugging
  useEffect(() => {
    console.log('🔍 ACTIVE ACCOUNT DATA - State updated:', {
      hasActiveAccount,
      accountInfo: accountInfo ? {
        accountId: accountInfo.accountId,
        accountName: accountInfo.accountName,
        exchangeName: accountInfo.exchangeName
      } : null,
      isLoading,
      error
    });
  }, [hasActiveAccount, accountInfo, isLoading, error]);

  return {
    accountInfo,
    isLoading,
    error,
    refreshDashboardData,
    hasActiveAccount
  };
};

// Hook simplificado para apenas obter informações da conta ativa
export const useActiveAccount = () => {
  const { accountInfo, hasActiveAccount } = useActiveAccountData();
  
  return {
    accountInfo,
    hasActiveAccount
  };
};

// Hook para trigger de refresh
export const useDashboardRefresh = () => {
  const { refreshDashboardData } = useActiveAccountData();
  return { refreshDashboardData };
};

console.log('🚀 ACTIVE ACCOUNT DATA - Hook initialized');
