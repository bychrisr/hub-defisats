import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useUserExchangeAccounts } from '@/hooks/useUserExchangeAccounts';
import { useAccountEvents } from '@/hooks/useAccountEvents';
import { useAutomations, Automation, AutomationStats } from '@/hooks/useAutomations';

interface AutomationContextType {
  // Automações
  automations: Automation[];
  activeAccountAutomations: Automation[];
  stats: AutomationStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Conta ativa
  activeAccount: any;
  hasActiveAccount: boolean;
  
  // Ações
  createAutomation: (data: {
    name: string;
    type: string;
    config: any;
    user_exchange_account_id: string;
  }) => Promise<Automation>;
  updateAutomation: (
    id: string,
    data: { config?: any; is_active?: boolean }
  ) => Promise<Automation>;
  deleteAutomation: (id: string) => Promise<void>;
  toggleAutomation: (id: string) => Promise<void>;
  refreshAutomations: () => Promise<void>;
  
  // Filtros
  filterByAccount: (accountId: string) => void;
  clearFilters: () => void;
  filteredAutomations: Automation[];
  
  // Estatísticas
  getAccountStats: (accountId: string) => {
    total: number;
    active: number;
    inactive: number;
  };
}

const AutomationContext = createContext<AutomationContextType | undefined>(undefined);

export const useAutomationContext = () => {
  const context = useContext(AutomationContext);
  if (!context) {
    throw new Error('useAutomationContext must be used within an AutomationProvider');
  }
  return context;
};

interface AutomationProviderProps {
  children: React.ReactNode;
}

export const AutomationProvider: React.FC<AutomationProviderProps> = ({ children }) => {
  // Hooks para contas e automações
  const { getActiveAccount, accounts } = useUserExchangeAccounts();
  const { onAccountChanged } = useAccountEvents();
  const {
    automations,
    stats,
    isLoading,
    error,
    activeAccountAutomations,
    createAutomation: createAutomationHook,
    updateAutomation: updateAutomationHook,
    deleteAutomation: deleteAutomationHook,
    toggleAutomation: toggleAutomationHook,
    refreshAutomations: refreshAutomationsHook,
  } = useAutomations();

  // Estado local
  const [filteredAccountId, setFilteredAccountId] = useState<string | null>(null);

  // Conta ativa
  const activeAccount = getActiveAccount();
  const hasActiveAccount = !!activeAccount;

  // Filtros
  const filteredAutomations = filteredAccountId 
    ? automations.filter(automation => automation.user_exchange_account_id === filteredAccountId)
    : activeAccountAutomations;

  // Filtrar por conta
  const filterByAccount = useCallback((accountId: string) => {
    console.log('🔍 AUTOMATION CONTEXT - Filtering by account:', accountId);
    setFilteredAccountId(accountId);
  }, []);

  // Limpar filtros
  const clearFilters = useCallback(() => {
    console.log('🔍 AUTOMATION CONTEXT - Clearing filters');
    setFilteredAccountId(null);
  }, []);

  // Estatísticas por conta
  const getAccountStats = useCallback((accountId: string) => {
    const accountAutomations = automations.filter(
      automation => automation.user_exchange_account_id === accountId
    );
    
    return {
      total: accountAutomations.length,
      active: accountAutomations.filter(a => a.is_active).length,
      inactive: accountAutomations.filter(a => !a.is_active).length,
    };
  }, [automations]);

  // Wrapper para createAutomation com validação de conta ativa
  const createAutomation = useCallback(async (data: {
    name: string;
    type: string;
    config: any;
    user_exchange_account_id: string;
  }): Promise<Automation> => {
    console.log('🔍 AUTOMATION CONTEXT - Creating automation with account validation...', data);
    
    // Validar se a conta existe
    const account = accounts?.find(acc => acc.id === data.user_exchange_account_id);
    if (!account) {
      throw new Error('Account not found');
    }

    // Validar se a conta está ativa
    if (!account.is_active) {
      throw new Error('Cannot create automation for inactive account');
    }

    return await createAutomationHook(data);
  }, [accounts, createAutomationHook]);

  // Wrapper para updateAutomation
  const updateAutomation = useCallback(async (
    id: string,
    data: { config?: any; is_active?: boolean }
  ): Promise<Automation> => {
    console.log('🔍 AUTOMATION CONTEXT - Updating automation...', { id, data });
    return await updateAutomationHook(id, data);
  }, [updateAutomationHook]);

  // Wrapper para deleteAutomation
  const deleteAutomation = useCallback(async (id: string): Promise<void> => {
    console.log('🔍 AUTOMATION CONTEXT - Deleting automation...', { id });
    await deleteAutomationHook(id);
  }, [deleteAutomationHook]);

  // Wrapper para toggleAutomation
  const toggleAutomation = useCallback(async (id: string): Promise<void> => {
    console.log('🔍 AUTOMATION CONTEXT - Toggling automation...', { id });
    await toggleAutomationHook(id);
  }, [toggleAutomationHook]);

  // Wrapper para refreshAutomations
  const refreshAutomations = useCallback(async () => {
    console.log('🔍 AUTOMATION CONTEXT - Refreshing automations...');
    await refreshAutomationsHook();
  }, [refreshAutomationsHook]);

  // Escutar mudanças de conta
  useEffect(() => {
    const handleAccountChange = () => {
      console.log('🔄 AUTOMATION CONTEXT - Account changed, clearing filters...');
      clearFilters();
    };

    onAccountChanged(handleAccountChange);

    return () => {
      // Cleanup se necessário
    };
  }, [onAccountChanged, clearFilters]);

  // Atualizar filtros quando conta ativa mudar
  useEffect(() => {
    if (activeAccount && !filteredAccountId) {
      console.log('🔄 AUTOMATION CONTEXT - Active account changed, updating filters...', activeAccount.id);
      setFilteredAccountId(activeAccount.id);
    }
  }, [activeAccount, filteredAccountId]);

  const contextValue: AutomationContextType = {
    // Automações
    automations,
    activeAccountAutomations,
    stats,
    isLoading,
    error,
    
    // Conta ativa
    activeAccount,
    hasActiveAccount,
    
    // Ações
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
    refreshAutomations,
    
    // Filtros
    filterByAccount,
    clearFilters,
    filteredAutomations,
    
    // Estatísticas
    getAccountStats,
  };

  return (
    <AutomationContext.Provider value={contextValue}>
      {children}
    </AutomationContext.Provider>
  );
};
