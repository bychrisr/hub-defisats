import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useUserBalance, useUserPositions } from '@/contexts/RealtimeDataContext';
import { MultiAccountData, AccountCredentials, AccountBalance, AccountPosition } from '@/types/account';

export const useMultiAccountData = () => {
  const { user, isAuthenticated } = useAuthStore();
  const userBalance = useUserBalance();
  const positions = useUserPositions();
  
  const [data, setData] = useState<MultiAccountData>({
    accounts: [],
    balances: [],
    positions: [],
    totalPL: 0,
    lastUpdate: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Converter dados atuais para formato de múltiplas contas
  const convertCurrentDataToMultiAccount = useCallback(() => {
    if (!isAuthenticated || !user) return;

    const currentAccountId = user.id;
    const currentAccountName = 'Conta Principal';

    // Converter saldo atual
    const currentBalance: AccountBalance | null = userBalance ? {
      account_id: currentAccountId,
      account_name: currentAccountName,
      total_balance: userBalance.total_balance || 0,
      available_balance: userBalance.available_balance || 0,
      margin_used: userBalance.margin_used || 0,
      timestamp: userBalance.timestamp || Date.now()
    } : null;

    // Converter posições atuais
    const currentPositions: AccountPosition[] = (positions || []).map(position => ({
      account_id: currentAccountId,
      account_name: currentAccountName,
      id: position.id,
      symbol: position.symbol,
      side: position.side,
      quantity: position.quantity,
      price: position.price,
      margin: position.margin,
      leverage: position.leverage,
      pnl: position.pnl,
      pnlPercent: position.pnlPercent,
      timestamp: position.timestamp
    }));

    // Calcular P&L total baseado nas posições reais
    const totalPL = currentPositions.reduce((sum, pos) => {
      const pnl = pos.pnl || 0;
      console.log('💰 MULTI ACCOUNT - Position P&L:', { 
        id: pos.id, 
        symbol: pos.symbol, 
        pnl: pnl 
      });
      return sum + pnl;
    }, 0);
    
    console.log('💰 MULTI ACCOUNT - Total P&L calculated:', totalPL);

    setData(prev => ({
      ...prev,
      accounts: prev.accounts.length > 0 ? prev.accounts : [{
        id: currentAccountId,
        name: currentAccountName,
        ln_markets_api_key: user.ln_markets_api_key || '',
        ln_markets_api_secret: user.ln_markets_api_secret || '',
        ln_markets_passphrase: user.ln_markets_passphrase || '',
        is_active: true,
        created_at: user.created_at,
        updated_at: user.updated_at
      }],
      balances: currentBalance ? [currentBalance] : [],
      positions: currentPositions,
      totalPL,
      lastUpdate: Date.now()
    }));
  }, [isAuthenticated, user, userBalance, positions]);

  // Atualizar dados quando mudarem
  useEffect(() => {
    convertCurrentDataToMultiAccount();
  }, [convertCurrentDataToMultiAccount]);

  // Funções para gerenciar contas (preparadas para implementação futura)
  const addAccount = useCallback(async (credentials: Omit<AccountCredentials, 'id' | 'created_at' | 'updated_at'>) => {
    // TODO: Implementar adição de nova conta
    console.log('🔄 MULTI ACCOUNT - Adding new account:', credentials);
    setError('Funcionalidade de múltiplas contas ainda não implementada');
  }, []);

  const removeAccount = useCallback(async (accountId: string) => {
    // TODO: Implementar remoção de conta
    console.log('🔄 MULTI ACCOUNT - Removing account:', accountId);
    setError('Funcionalidade de múltiplas contas ainda não implementada');
  }, []);

  const updateAccount = useCallback(async (accountId: string, updates: Partial<AccountCredentials>) => {
    // TODO: Implementar atualização de conta
    console.log('🔄 MULTI ACCOUNT - Updating account:', accountId, updates);
    setError('Funcionalidade de múltiplas contas ainda não implementada');
  }, []);

  const refreshData = useCallback(async () => {
    // TODO: Implementar refresh de dados de todas as contas
    console.log('🔄 MULTI ACCOUNT - Refreshing all account data');
    convertCurrentDataToMultiAccount();
  }, [convertCurrentDataToMultiAccount]);

  return {
    data,
    isLoading,
    error,
    refreshData,
    addAccount,
    removeAccount,
    updateAccount
  };
};
