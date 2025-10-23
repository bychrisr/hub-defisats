import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export interface OnboardingStatus {
  requiresOnboarding: boolean;
  onboardingCompleted: boolean;
  firstLoginAt?: string;
  userAccounts: UserExchangeAccount[];
  planLimits: PlanLimits;
}

export interface UserExchangeAccount {
  id: string;
  exchange_id: string;
  account_name: string;
  is_active: boolean;
  is_verified: boolean;
  last_test?: string;
  created_at: string;
  exchange: {
    name: string;
    slug: string;
    logo_url?: string;
  };
}

export interface PlanLimits {
  max_exchange_accounts: number;
  max_automations: number;
  max_indicators: number;
  max_simulations: number;
  max_backtests: number;
}

export interface AddExchangeAccountData {
  exchangeId: string;
  accountName: string;
  credentials: Record<string, string>;
}

export function useOnboarding() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Check onboarding status
   */
  const checkOnboardingStatus = useCallback(async (): Promise<OnboardingStatus> => {
    setIsLoading(true);
    clearError();

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/onboarding/status', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check onboarding status');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Error checking onboarding status:', error);
      setError(error.message || 'Failed to check onboarding status');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  /**
   * Get user's exchange accounts
   */
  const getUserAccounts = useCallback(async (): Promise<UserExchangeAccount[]> => {
    setIsLoading(true);
    clearError();

    try {
      const response = await fetch('/api/onboarding/exchange-accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get exchange accounts');
      }

      const data = await response.json();
      return data.data;
    } catch (error: any) {
      console.error('Error getting exchange accounts:', error);
      setError(error.message || 'Failed to get exchange accounts');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  /**
   * Add exchange account
   */
  const addExchangeAccount = useCallback(async (data: AddExchangeAccountData): Promise<UserExchangeAccount> => {
    setIsLoading(true);
    clearError();

    try {
      const response = await fetch('/api/onboarding/exchange-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add exchange account');
      }

      const result = await response.json();
      return result.data;
    } catch (error: any) {
      console.error('Error adding exchange account:', error);
      setError(error.message || 'Failed to add exchange account');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  /**
   * Test exchange credentials
   */
  const testCredentials = useCallback(async (accountId: string, credentials: Record<string, string>): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    clearError();

    try {
      const response = await fetch(`/api/onboarding/exchange-account/${accountId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credentials }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to test credentials');
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('Error testing credentials:', error);
      setError(error.message || 'Failed to test credentials');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  /**
   * Delete exchange account
   */
  const deleteAccount = useCallback(async (accountId: string): Promise<void> => {
    setIsLoading(true);
    clearError();

    try {
      const response = await fetch(`/api/onboarding/exchange-account/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setError(error.message || 'Failed to delete account');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearError]);

  /**
   * Skip onboarding
   */
  const skipOnboarding = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    clearError();

    try {
      const response = await fetch('/api/onboarding/skip', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to skip onboarding');
      }

      // Navigate to dashboard
      navigate('/dashboard', {
        state: { message: 'Welcome to your dashboard!' }
      });
    } catch (error: any) {
      console.error('Error skipping onboarding:', error);
      setError(error.message || 'Failed to skip onboarding');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, clearError]);

  /**
   * Complete onboarding
   */
  const completeOnboarding = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    clearError();

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to complete onboarding');
      }

      // Navigate to dashboard
      navigate('/dashboard', {
        state: { message: 'Welcome to your dashboard!' }
      });
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      setError(error.message || 'Failed to complete onboarding');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate, clearError]);

  return {
    // State
    isLoading,
    error,

    // Actions
    checkOnboardingStatus,
    getUserAccounts,
    addExchangeAccount,
    testCredentials,
    deleteAccount,
    skipOnboarding,
    completeOnboarding,
    clearError,
  };
}
