import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface AccountCredentials {
  userId: string;
  accountId: string;
  accountName: string;
  exchangeName: string;
  credentials: Record<string, string>;
  isActive: boolean;
  lastValidated?: Date;
  validationStatus: 'valid' | 'invalid' | 'pending' | 'expired';
}

interface CredentialValidationResult {
  isValid: boolean;
  accountId: string;
  accountName: string;
  exchangeName: string;
  errors: string[];
  lastValidated: Date;
}

interface CredentialCacheStats {
  totalCached: number;
  activeAccounts: number;
  expiredCredentials: number;
  validationFailures: number;
  cacheHitRate: number;
}

export const useAccountCredentials = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Buscar credenciais da conta ativa
  const getActiveAccountCredentials = async (): Promise<AccountCredentials | null> => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 ACCOUNT CREDENTIALS - Getting active account credentials for user ${user.id}`);
      
      const response = await fetch('/api/account-credentials/active', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get active account credentials: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ ACCOUNT CREDENTIALS - Active account credentials retrieved successfully`);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get active account credentials';
      console.error(`❌ ACCOUNT CREDENTIALS - Error getting active account credentials:`, error);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Buscar credenciais de conta específica
  const getAccountCredentials = async (accountId: string): Promise<AccountCredentials | null> => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 ACCOUNT CREDENTIALS - Getting credentials for account ${accountId} of user ${user.id}`);
      
      const response = await fetch(`/api/account-credentials/${accountId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get account credentials: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ ACCOUNT CREDENTIALS - Account credentials retrieved successfully for account ${accountId}`);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get account credentials';
      console.error(`❌ ACCOUNT CREDENTIALS - Error getting account credentials:`, error);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Validar credenciais
  const validateCredentials = async (accountId: string): Promise<CredentialValidationResult | null> => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 ACCOUNT CREDENTIALS - Validating credentials for account ${accountId} of user ${user.id}`);
      
      const response = await fetch(`/api/account-credentials/${accountId}/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to validate credentials: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ ACCOUNT CREDENTIALS - Credentials validation completed for account ${accountId}`);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate credentials';
      console.error(`❌ ACCOUNT CREDENTIALS - Error validating credentials:`, error);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Limpar cache de credenciais por conta
  const clearAccountCredentialsCache = async (accountId: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      console.log(`🧹 ACCOUNT CREDENTIALS - Clearing credentials cache for account ${accountId} of user ${user.id}`);
      
      const response = await fetch(`/api/account-credentials/${accountId}/clear-cache`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to clear account credentials cache: ${response.statusText}`);
      }

      console.log(`✅ ACCOUNT CREDENTIALS - Account credentials cache cleared for account ${accountId}`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear account credentials cache';
      console.error(`❌ ACCOUNT CREDENTIALS - Error clearing account credentials cache:`, error);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Limpar cache de credenciais por usuário
  const clearUserCredentialsCache = async (): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      console.log(`🧹 ACCOUNT CREDENTIALS - Clearing all credentials cache for user ${user.id}`);
      
      const response = await fetch('/api/account-credentials/clear-cache', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to clear user credentials cache: ${response.statusText}`);
      }

      console.log(`✅ ACCOUNT CREDENTIALS - All credentials cache cleared for user ${user.id}`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear user credentials cache';
      console.error(`❌ ACCOUNT CREDENTIALS - Error clearing user credentials cache:`, error);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Obter estatísticas de cache
  const getCacheStats = async (): Promise<CredentialCacheStats | null> => {
    if (!user) return null;

    setLoading(true);
    setError(null);

    try {
      console.log(`📊 ACCOUNT CREDENTIALS - Getting cache statistics for user ${user.id}`);
      
      const response = await fetch('/api/account-credentials/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get cache stats: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📊 ACCOUNT CREDENTIALS - Cache statistics retrieved successfully`);
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get cache stats';
      console.error(`❌ ACCOUNT CREDENTIALS - Error getting cache stats:`, error);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getActiveAccountCredentials,
    getAccountCredentials,
    validateCredentials,
    clearAccountCredentialsCache,
    clearUserCredentialsCache,
    getCacheStats,
  };
};
