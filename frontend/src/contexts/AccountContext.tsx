import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Account, AccountContextType, AccountProvider } from '@/types/account';

const AccountContext = createContext<AccountContextType | undefined>(undefined);

interface AccountProviderProps {
  children: ReactNode;
}

export const AccountProvider: React.FC<AccountProviderProps> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with default LN Markets account
  useEffect(() => {
    const defaultAccount: Account = {
      id: 'lnmarkets-default',
      name: 'Account 1',
      provider: 'lnmarkets',
      isActive: true,
      balance: 0,
      currency: 'USD',
      lastUsed: new Date(),
    };

    setAccounts([defaultAccount]);
    setActiveAccount(defaultAccount);
  }, []);

  const addAccount = (accountData: Omit<Account, 'id'>) => {
    const newAccount: Account = {
      ...accountData,
      id: `${accountData.provider}-${Date.now()}`,
    };

    setAccounts(prev => [...prev, newAccount]);
  };

  const removeAccount = (accountId: string) => {
    setAccounts(prev => {
      const updated = prev.filter(account => account.id !== accountId);
      
      // If removing active account, set first available as active
      if (activeAccount?.id === accountId) {
        setActiveAccount(updated.length > 0 ? updated[0] : null);
      }
      
      return updated;
    });
  };

  const updateAccount = (accountId: string, updates: Partial<Account>) => {
    setAccounts(prev =>
      prev.map(account =>
        account.id === accountId ? { ...account, ...updates } : account
      )
    );

    // Update active account if it's the one being updated
    if (activeAccount?.id === accountId) {
      setActiveAccount(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleSetActiveAccount = (account: Account) => {
    // Deactivate all accounts
    setAccounts(prev =>
      prev.map(acc => ({ ...acc, isActive: acc.id === account.id }))
    );
    
    setActiveAccount(account);
  };

  const value: AccountContextType = {
    accounts,
    activeAccount,
    setActiveAccount: handleSetActiveAccount,
    addAccount,
    removeAccount,
    updateAccount,
    isLoading,
    error,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
};

export const useAccounts = (): AccountContextType => {
  const context = useContext(AccountContext);
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountProvider');
  }
  return context;
};
