import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { 
  UserExchangeAccountService, 
  UserExchangeAccount, 
  CreateUserExchangeAccountData, 
  UpdateUserExchangeAccountData,
  CredentialTestResult 
} from '@/services/userExchangeAccount.service';

export function useUserExchangeAccounts() {
  const [accounts, setAccounts] = useState<UserExchangeAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const loadAccounts = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 USER EXCHANGE ACCOUNTS - Loading accounts...');
      
      const userAccounts = await UserExchangeAccountService.getUserExchangeAccounts();
      setAccounts(userAccounts);

      console.log('✅ USER EXCHANGE ACCOUNTS - Accounts loaded:', {
        count: userAccounts.length,
        accounts: userAccounts.map(acc => ({
          id: acc.id,
          exchangeName: acc.exchange.name,
          accountName: acc.account_name,
          isActive: acc.is_active
        }))
      });

    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNTS - Error loading accounts:', error);
      setError(error.message || 'Failed to load exchange accounts');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const createAccount = useCallback(async (data: CreateUserExchangeAccountData): Promise<UserExchangeAccount> => {
    try {
      setError(null);
      console.log('🔄 USER EXCHANGE ACCOUNTS - Creating account:', data);

      const newAccount = await UserExchangeAccountService.createUserExchangeAccount(data);
      
      // Atualizar lista local
      setAccounts(prev => [newAccount, ...prev]);

      console.log('✅ USER EXCHANGE ACCOUNTS - Account created:', {
        id: newAccount.id,
        exchangeName: newAccount.exchange.name,
        accountName: newAccount.account_name
      });

      return newAccount;
    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNTS - Error creating account:', error);
      setError(error.message || 'Failed to create account');
      throw error;
    }
  }, []);

  const updateAccount = useCallback(async (
    accountId: string, 
    data: UpdateUserExchangeAccountData
  ): Promise<UserExchangeAccount> => {
    try {
      setError(null);
      console.log('🔄 USER EXCHANGE ACCOUNTS - Updating account:', { accountId, data });

      const updatedAccount = await UserExchangeAccountService.updateUserExchangeAccount(accountId, data);
      
      // Atualizar lista local
      setAccounts(prev => 
        prev.map(acc => acc.id === accountId ? updatedAccount : acc)
      );

      console.log('✅ USER EXCHANGE ACCOUNTS - Account updated:', {
        id: updatedAccount.id,
        exchangeName: updatedAccount.exchange.name,
        accountName: updatedAccount.account_name,
        isActive: updatedAccount.is_active
      });

      return updatedAccount;
    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNTS - Error updating account:', error);
      setError(error.message || 'Failed to update account');
      throw error;
    }
  }, []);

  const deleteAccount = useCallback(async (accountId: string): Promise<void> => {
    try {
      setError(null);
      console.log('🗑️ USER EXCHANGE ACCOUNTS - Deleting account:', accountId);

      await UserExchangeAccountService.deleteUserExchangeAccount(accountId);
      
      // Remover da lista local
      setAccounts(prev => prev.filter(acc => acc.id !== accountId));

      console.log('✅ USER EXCHANGE ACCOUNTS - Account deleted');
    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNTS - Error deleting account:', error);
      setError(error.message || 'Failed to delete account');
      throw error;
    }
  }, []);

  const setActiveAccount = useCallback(async (accountId: string): Promise<UserExchangeAccount> => {
    try {
      setError(null);
      console.log('🔄 USER EXCHANGE ACCOUNTS - Setting active account:', accountId);

      const activeAccount = await UserExchangeAccountService.setActiveAccount(accountId);
      
      // Atualizar lista local - desativar outras contas da mesma exchange
      setAccounts(prev => 
        prev.map(acc => {
          if (acc.exchange_id === activeAccount.exchange_id) {
            return acc.id === accountId ? activeAccount : { ...acc, is_active: false };
          }
          return acc;
        })
      );

      console.log('✅ USER EXCHANGE ACCOUNTS - Active account set:', {
        id: activeAccount.id,
        exchangeName: activeAccount.exchange.name,
        accountName: activeAccount.account_name
      });

      return activeAccount;
    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNTS - Error setting active account:', error);
      setError(error.message || 'Failed to set active account');
      throw error;
    }
  }, []);

  const testCredentials = useCallback(async (accountId: string): Promise<CredentialTestResult> => {
    try {
      setError(null);
      console.log('🧪 USER EXCHANGE ACCOUNTS - Testing credentials:', accountId);

      const result = await UserExchangeAccountService.testAccountCredentials(accountId);
      
      // Atualizar last_test na lista local
      setAccounts(prev => 
        prev.map(acc => 
          acc.id === accountId 
            ? { ...acc, last_test: new Date().toISOString(), is_verified: result.success }
            : acc
        )
      );

      console.log('✅ USER EXCHANGE ACCOUNTS - Credentials test result:', result);
      return result;
    } catch (error: any) {
      console.error('❌ USER EXCHANGE ACCOUNTS - Error testing credentials:', error);
      setError(error.message || 'Failed to test credentials');
      throw error;
    }
  }, []);

  const getAccountById = useCallback((accountId: string): UserExchangeAccount | undefined => {
    return accounts.find(acc => acc.id === accountId);
  }, [accounts]);

  const getAccountsByExchange = useCallback((exchangeId: string): UserExchangeAccount[] => {
    return accounts.filter(acc => acc.exchange_id === exchangeId);
  }, [accounts]);

  const getActiveAccount = useCallback((exchangeId?: string): UserExchangeAccount | undefined => {
    if (exchangeId) {
      return accounts.find(acc => acc.exchange_id === exchangeId && acc.is_active);
    }
    return accounts.find(acc => acc.is_active);
  }, [accounts]);

  const hasActiveAccount = useCallback((exchangeId?: string): boolean => {
    return !!getActiveAccount(exchangeId);
  }, [getActiveAccount]);

  return {
    accounts,
    isLoading,
    error,
    loadAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    setActiveAccount,
    testCredentials,
    getAccountById,
    getAccountsByExchange,
    getActiveAccount,
    hasActiveAccount
  };
}
