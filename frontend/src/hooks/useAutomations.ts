import { useState, useEffect, useCallback } from 'react';
import { useUserExchangeAccounts } from './useUserExchangeAccounts';
import { useAccountCredentials } from './useAccountCredentials';
import { useAccountEvents } from './useAccountEvents';
import { automationAPI } from '@/lib/api';

export interface Automation {
  id: string;
  name: string;
  type: 'margin_guard' | 'tp_sl' | 'auto_entry';
  config: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_exchange_account_id: string;
  account_name?: string;
  exchange_name?: string;
  status?: 'running' | 'paused' | 'stopped' | 'error';
  last_execution?: string;
}

export interface AutomationStats {
  total: number;
  active: number;
  inactive: number;
  byType: {
    margin_guard: number;
    tp_sl: number;
    auto_entry: number;
  };
  byAccount: {
    [accountId: string]: {
      total: number;
      active: number;
      inactive: number;
    };
  };
  recentActivity: Array<{
    id: string;
    type: string;
    is_active: boolean;
    account_name: string;
    updated_at: string;
  }>;
}

interface UseAutomationsReturn {
  automations: Automation[];
  stats: AutomationStats | null;
  isLoading: boolean;
  error: string | null;
  activeAccountAutomations: Automation[];
  fetchAutomations: (accountId?: string) => Promise<void>;
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
}

export const useAutomations = (): UseAutomationsReturn => {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hooks para contas e credenciais
  const { getActiveAccount, accounts } = useUserExchangeAccounts();
  const { getActiveAccountCredentials } = useAccountCredentials();
  const { onAccountChanged } = useAccountEvents();

  // Buscar automações
  const fetchAutomations = useCallback(async (accountId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 AUTOMATIONS - Fetching automations...', { accountId });

      const params: any = {};
      if (accountId) {
        params.user_exchange_account_id = accountId;
      }

      const response = await automationAPI.getAll(params);
      setAutomations(response.data || []);

      // Buscar estatísticas
      const statsResponse = await automationAPI.getStats();
      setStats(statsResponse.data || null);

      console.log('✅ AUTOMATIONS - Automations fetched successfully:', {
        count: response.data?.length || 0,
        accountId
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch automations';
      console.error('❌ AUTOMATIONS - Error fetching automations:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Buscar automações da conta ativa
  const fetchActiveAccountAutomations = useCallback(async () => {
    const activeAccount = getActiveAccount();
    if (activeAccount) {
      await fetchAutomations(activeAccount.id);
    } else {
      await fetchAutomations();
    }
  }, [getActiveAccount, fetchAutomations]);

  // Automações da conta ativa
  const activeAccountAutomations = automations.filter(automation => {
    const activeAccount = getActiveAccount();
    return activeAccount && automation.user_exchange_account_id === activeAccount.id;
  });

  // Criar automação
  const createAutomation = useCallback(async (data: {
    name: string;
    type: string;
    config: any;
    user_exchange_account_id: string;
  }): Promise<Automation> => {
    try {
      console.log('🔍 AUTOMATIONS - Creating automation...', data);

      // Validar credenciais da conta
      const credentials = await getActiveAccountCredentials();
      if (!credentials) {
        throw new Error('No valid credentials found for the active account');
      }

      const response = await automationAPI.create(data);
      
      // Atualizar lista local
      setAutomations(prev => [...prev, response.data]);
      
      console.log('✅ AUTOMATIONS - Automation created successfully:', response.data);
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create automation';
      console.error('❌ AUTOMATIONS - Error creating automation:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [getActiveAccountCredentials]);

  // Atualizar automação
  const updateAutomation = useCallback(async (
    id: string,
    data: { config?: any; is_active?: boolean }
  ): Promise<Automation> => {
    try {
      console.log('🔍 AUTOMATIONS - Updating automation...', { id, data });

      const response = await automationAPI.update(id, data);
      
      // Atualizar lista local
      setAutomations(prev => 
        prev.map(automation => 
          automation.id === id ? response.data : automation
        )
      );
      
      console.log('✅ AUTOMATIONS - Automation updated successfully:', response.data);
      
      return response.data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update automation';
      console.error('❌ AUTOMATIONS - Error updating automation:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Deletar automação
  const deleteAutomation = useCallback(async (id: string): Promise<void> => {
    try {
      console.log('🔍 AUTOMATIONS - Deleting automation...', { id });

      await automationAPI.delete(id);
      
      // Atualizar lista local
      setAutomations(prev => prev.filter(automation => automation.id !== id));
      
      console.log('✅ AUTOMATIONS - Automation deleted successfully:', { id });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete automation';
      console.error('❌ AUTOMATIONS - Error deleting automation:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, []);

  // Toggle automação
  const toggleAutomation = useCallback(async (id: string): Promise<void> => {
    try {
      console.log('🔍 AUTOMATIONS - Toggling automation...', { id });

      const automation = automations.find(a => a.id === id);
      if (!automation) {
        throw new Error('Automation not found');
      }

      await automationAPI.toggle(id);
      
      // Atualizar lista local
      setAutomations(prev => 
        prev.map(automation => 
          automation.id === id 
            ? { ...automation, is_active: !automation.is_active }
            : automation
        )
      );
      
      console.log('✅ AUTOMATIONS - Automation toggled successfully:', { id });
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to toggle automation';
      console.error('❌ AUTOMATIONS - Error toggling automation:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, [automations]);

  // Refresh automações
  const refreshAutomations = useCallback(async () => {
    await fetchActiveAccountAutomations();
  }, [fetchActiveAccountAutomations]);

  // Carregar automações na inicialização
  useEffect(() => {
    fetchActiveAccountAutomations();
  }, [fetchActiveAccountAutomations]);

  // Escutar mudanças de conta
  useEffect(() => {
    const handleAccountChange = () => {
      console.log('🔄 AUTOMATIONS - Account changed, refreshing automations...');
      fetchActiveAccountAutomations();
    };

    onAccountChanged(handleAccountChange);

    return () => {
      // Cleanup se necessário
    };
  }, [onAccountChanged, fetchActiveAccountAutomations]);

  return {
    automations,
    stats,
    isLoading,
    error,
    activeAccountAutomations,
    fetchAutomations,
    createAutomation,
    updateAutomation,
    deleteAutomation,
    toggleAutomation,
    refreshAutomations,
  };
};
