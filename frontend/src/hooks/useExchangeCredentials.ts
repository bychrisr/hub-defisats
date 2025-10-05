import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { ExchangeService, Exchange, UserExchangeCredentials, CredentialTestResult } from '@/services/exchange.service';

export function useExchangeCredentials() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [userCredentials, setUserCredentials] = useState<UserExchangeCredentials[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const loadData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 EXCHANGE CREDENTIALS - Loading exchanges and user credentials...');

      // Carregar exchanges disponíveis
      const availableExchanges = await ExchangeService.getExchanges();
      setExchanges(availableExchanges);

      // Carregar credenciais do usuário
      const credentials = await ExchangeService.getUserCredentials();
      setUserCredentials(credentials);

      console.log('✅ EXCHANGE CREDENTIALS - Data loaded:', {
        exchangesCount: availableExchanges.length,
        credentialsCount: credentials.length,
        exchanges: availableExchanges.map(ex => ({ id: ex.id, name: ex.name, slug: ex.slug })),
        userCredentials: credentials.map(cred => ({ 
          exchangeId: cred.exchange_id, 
          exchangeName: cred.exchange.name,
          isActive: cred.is_active,
          isVerified: cred.is_verified
        }))
      });

    } catch (error: any) {
      console.error('❌ EXCHANGE CREDENTIALS - Error loading data:', error);
      setError(error.message || 'Failed to load exchange data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const getCredentialsForExchange = (exchangeId: string): UserExchangeCredentials | null => {
    return userCredentials.find(cred => cred.exchange_id === exchangeId) || null;
  };

  const hasCredentialsForExchange = (exchangeId: string): boolean => {
    const credentials = getCredentialsForExchange(exchangeId);
    return !!(credentials && credentials.is_active);
  };

  const updateCredentials = async (exchangeId: string, credentials: Record<string, string>) => {
    try {
      console.log('🔄 EXCHANGE CREDENTIALS - Updating credentials for exchange:', exchangeId);
      
      const updatedCredentials = await ExchangeService.updateUserCredentials(exchangeId, credentials);
      
      // Atualizar estado local
      setUserCredentials(prev => {
        const existingIndex = prev.findIndex(cred => cred.exchange_id === exchangeId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = updatedCredentials;
          return updated;
        } else {
          return [...prev, updatedCredentials];
        }
      });

      console.log('✅ EXCHANGE CREDENTIALS - Credentials updated successfully');
      return updatedCredentials;
    } catch (error: any) {
      console.error('❌ EXCHANGE CREDENTIALS - Error updating credentials:', error);
      throw error;
    }
  };

  const deleteCredentials = async (exchangeId: string) => {
    try {
      console.log('🗑️ EXCHANGE CREDENTIALS - Deleting credentials for exchange:', exchangeId);
      
      await ExchangeService.deleteCredentials(exchangeId);
      
      // Atualizar estado local
      setUserCredentials(prev => prev.filter(cred => cred.exchange_id !== exchangeId));
      
      console.log('✅ EXCHANGE CREDENTIALS - Credentials deleted successfully');
    } catch (error: any) {
      console.error('❌ EXCHANGE CREDENTIALS - Error deleting credentials:', error);
      throw error;
    }
  };

  const testCredentials = async (exchangeId: string): Promise<CredentialTestResult> => {
    try {
      console.log('🧪 EXCHANGE CREDENTIALS - Testing credentials for exchange:', exchangeId);
      
      const result = await ExchangeService.testCredentials(exchangeId);
      
      console.log('✅ EXCHANGE CREDENTIALS - Credentials test result:', result);
      return result;
    } catch (error: any) {
      console.error('❌ EXCHANGE CREDENTIALS - Error testing credentials:', error);
      throw error;
    }
  };

  return {
    exchanges,
    userCredentials,
    isLoading,
    error,
    getCredentialsForExchange,
    hasCredentialsForExchange,
    updateCredentials,
    deleteCredentials,
    testCredentials,
    refetch: loadData
  };
}
