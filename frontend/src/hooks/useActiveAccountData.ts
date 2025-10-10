/**
 * Hook para gerenciar dados da conta ativa via WebSocket
 * 
 * Escuta mudanças de conta ativa via WebSocket e fornece informações
 * sobre a conta ativa atual para atualização automática da dashboard.
 */

import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useAuthStore } from '../stores/auth';
import { api } from '@/lib/api';

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

  // WebSocket para escutar mudanças de conta
  const wsUrl = user?.id ? `ws://localhost:13000/ws?userId=${user.id}` : null;
  const { lastMessage, readyState } = useWebSocket({
    url: wsUrl,
    onMessage: useCallback((message) => {
      console.log('🔌 ACTIVE ACCOUNT DATA - WebSocket message received:', message);
      
      if (message.type === 'active_account_changed') {
        console.log('🔄 ACTIVE ACCOUNT DATA - Active account changed:', message);

        const newAccountInfo: ActiveAccountInfo = {
          accountId: message.accountId,
          accountName: message.accountName,
          exchangeName: message.exchangeName,
          exchangeId: message.exchangeId,
          timestamp: message.timestamp
        };

        setAccountInfo(newAccountInfo);
        setError(null);

        // Trigger refresh automático da dashboard
        console.log('🔄 ACTIVE ACCOUNT DATA - Triggering automatic dashboard refresh');
        refreshDashboardData();

        // Log para debugging
        console.log('✅ ACTIVE ACCOUNT DATA - Account info updated:', {
          accountId: newAccountInfo.accountId,
          accountName: newAccountInfo.accountName,
          exchangeName: newAccountInfo.exchangeName,
          timestamp: new Date(newAccountInfo.timestamp).toISOString()
        });
      }

      if (message.type === 'connection') {
        console.log('✅ ACTIVE ACCOUNT DATA - WebSocket connected:', message);
        setError(null);
      }

      if (message.type === 'error') {
        console.error('❌ ACTIVE ACCOUNT DATA - WebSocket error:', message);
        setError(message.message || 'WebSocket connection error');
      }
    }, [refreshDashboardData]),
    onOpen: useCallback(() => {
      console.log('✅ ACTIVE ACCOUNT DATA - WebSocket connection established');
      setError(null);
    }, []),
    onError: useCallback((error) => {
      console.error('❌ ACTIVE ACCOUNT DATA - WebSocket connection error:', error);
      setError('WebSocket connection failed');
    }, [])
  });

  // Função para trigger refresh da dashboard
  const refreshDashboardData = useCallback(() => {
    console.log('🔄 ACTIVE ACCOUNT DATA - Triggering dashboard refresh');
    setRefreshTrigger(prev => prev + 1);
  }, []);


  // Monitorar estado da conexão WebSocket
  useEffect(() => {
    if (readyState === 1) { // WebSocket.OPEN
      console.log('✅ ACTIVE ACCOUNT DATA - WebSocket connected');
      setError(null);
    } else if (readyState === 3) { // WebSocket.CLOSED
      console.warn('⚠️ ACTIVE ACCOUNT DATA - WebSocket disconnected');
      setError('WebSocket connection lost');
    } else if (readyState === 0) { // WebSocket.CONNECTING
      console.log('🔄 ACTIVE ACCOUNT DATA - WebSocket connecting...');
      setIsLoading(true);
    }
  }, [readyState]);

  // Reset loading quando conectado
  useEffect(() => {
    if (readyState === 1) { // WebSocket.OPEN
      setIsLoading(false);
    }
  }, [readyState]);

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
      error,
      websocketReadyState: readyState
    });
  }, [hasActiveAccount, accountInfo, isLoading, error, readyState]);

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
