import { useState, useEffect, useCallback } from 'react';
import { indicatorPersistenceService } from '@/services/indicatorPersistence.service';

export interface ActiveAccountInfo {
  id: string | null;
  name: string | null;
  exchange: string | null;
  isActive: boolean;
}

export interface UseActiveAccountReturn {
  activeAccountId: string | null;
  setActiveAccount: (accountId: string | null) => boolean;
  clearActiveAccount: () => boolean;
  isLoading: boolean;
  error: string | null;
  // Métodos para automações
  setAutomationDefaultAccount: (accountId: string | null) => boolean;
  getAutomationDefaultAccount: () => string | null;
  updateAutomationPreferences: (preferences: any) => boolean;
  getAutomationPreferences: () => any;
}

/**
 * Hook para gerenciar a conta ativa do usuário
 * Integra com o sistema de persistência unificado
 */
export function useActiveAccount(): UseActiveAccountReturn {
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar conta ativa do localStorage
  const loadActiveAccount = useCallback(() => {
    try {
      setIsLoading(true);
      setError(null);
      
      const accountId = indicatorPersistenceService.getActiveAccount();
      setActiveAccountId(accountId);
      
      console.log('🔄 ACTIVE-ACCOUNT - Loaded active account:', accountId);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load active account';
      console.error('❌ ACTIVE-ACCOUNT - Error loading active account:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Definir conta ativa
  const setActiveAccount = useCallback((accountId: string | null): boolean => {
    try {
      setError(null);
      
      const success = indicatorPersistenceService.setActiveAccount(accountId);
      if (success) {
        setActiveAccountId(accountId);
        console.log('✅ ACTIVE-ACCOUNT - Set active account:', accountId);
        
        // Disparar evento customizado para notificar outros componentes
        window.dispatchEvent(new CustomEvent('activeAccountChanged', {
          detail: { accountId }
        }));
      } else {
        setError('Failed to save active account');
      }
      
      return success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to set active account';
      console.error('❌ ACTIVE-ACCOUNT - Error setting active account:', errorMsg);
      setError(errorMsg);
      return false;
    }
  }, []);

  // Limpar conta ativa
  const clearActiveAccount = useCallback((): boolean => {
    return setActiveAccount(null);
  }, [setActiveAccount]);

  // Carregar conta ativa na inicialização
  useEffect(() => {
    loadActiveAccount();
  }, [loadActiveAccount]);

  // Escutar mudanças na conta ativa (para sincronização entre abas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'axisor-indicator-configs' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          const newAccountId = data.userPreferences?.activeAccountId || null;
          
          if (newAccountId !== activeAccountId) {
            setActiveAccountId(newAccountId);
            console.log('🔄 ACTIVE-ACCOUNT - Account changed from storage:', newAccountId);
          }
        } catch (err) {
          console.error('❌ ACTIVE-ACCOUNT - Error parsing storage change:', err);
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      const { accountId } = e.detail;
      if (accountId !== activeAccountId) {
        setActiveAccountId(accountId);
        console.log('🔄 ACTIVE-ACCOUNT - Account changed from custom event:', accountId);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('activeAccountChanged', handleCustomEvent as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('activeAccountChanged', handleCustomEvent as EventListener);
    };
  }, [activeAccountId]);

  // Métodos para automações
  const setAutomationDefaultAccount = useCallback((accountId: string | null): boolean => {
    try {
      setError(null);
      
      const success = indicatorPersistenceService.setAutomationDefaultAccount(accountId);
      if (success) {
        console.log('✅ ACTIVE-ACCOUNT - Set automation default account:', accountId);
        
        // Disparar evento customizado para notificar outros componentes
        window.dispatchEvent(new CustomEvent('automationAccountChanged', {
          detail: { accountId }
        }));
      } else {
        setError('Failed to save automation default account');
      }
      
      return success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to set automation default account';
      console.error('❌ ACTIVE-ACCOUNT - Error setting automation default account:', errorMsg);
      setError(errorMsg);
      return false;
    }
  }, []);

  const getAutomationDefaultAccount = useCallback((): string | null => {
    try {
      return indicatorPersistenceService.getAutomationDefaultAccount();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get automation default account';
      console.error('❌ ACTIVE-ACCOUNT - Error getting automation default account:', errorMsg);
      setError(errorMsg);
      return null;
    }
  }, []);

  const updateAutomationPreferences = useCallback((preferences: any): boolean => {
    try {
      setError(null);
      
      const success = indicatorPersistenceService.updateAutomationPreferences(preferences);
      if (success) {
        console.log('✅ ACTIVE-ACCOUNT - Updated automation preferences:', preferences);
      } else {
        setError('Failed to update automation preferences');
      }
      
      return success;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update automation preferences';
      console.error('❌ ACTIVE-ACCOUNT - Error updating automation preferences:', errorMsg);
      setError(errorMsg);
      return false;
    }
  }, []);

  const getAutomationPreferences = useCallback(() => {
    try {
      return indicatorPersistenceService.getAutomationPreferences();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get automation preferences';
      console.error('❌ ACTIVE-ACCOUNT - Error getting automation preferences:', errorMsg);
      setError(errorMsg);
      return null;
    }
  }, []);

  return {
    activeAccountId,
    setActiveAccount,
    clearActiveAccount,
    isLoading,
    error,
    setAutomationDefaultAccount,
    getAutomationDefaultAccount,
    updateAutomationPreferences,
    getAutomationPreferences,
  };
}

/**
 * Hook para obter informações detalhadas da conta ativa
 * Requer integração com o backend para buscar dados completos
 */
export function useActiveAccountInfo(): {
  accountInfo: ActiveAccountInfo | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
} {
  const [accountInfo, setAccountInfo] = useState<ActiveAccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    // TODO: Implementar busca de informações da conta ativa via API
    // Por enquanto, retorna dados mockados
    console.log('🔄 ACTIVE-ACCOUNT-INFO - Refreshing account info (mock)');
  }, []);

  return {
    accountInfo,
    isLoading,
    error,
    refresh
  };
}
