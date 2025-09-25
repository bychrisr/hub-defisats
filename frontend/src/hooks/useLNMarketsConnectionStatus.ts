import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

interface ConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export function useLNMarketsConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isConnected: false,
    isLoading: true,
    error: null,
    lastChecked: null
  });
  
  const { user } = useAuthStore();

  const checkConnection = async () => {
    if (!user) {
      setStatus({
        isConnected: false,
        isLoading: false,
        error: 'User not authenticated',
        lastChecked: null
      });
      return;
    }

    // Check if user has credentials configured
    const hasCredentials = !!(
      user.ln_markets_api_key && 
      user.ln_markets_api_secret && 
      user.ln_markets_passphrase
    );

    if (!hasCredentials) {
      setStatus({
        isConnected: false,
        isLoading: false,
        error: 'Credentials not configured',
        lastChecked: new Date()
      });
      return;
    }

    setStatus(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await api.post('/api/lnmarkets/validate-credentials');
      const { data } = response.data;
      
      setStatus({
        isConnected: data.isValid,
        isLoading: false,
        error: data.isValid ? null : data.message,
        lastChecked: new Date()
      });
    } catch (error: any) {
      console.error('Failed to validate LN Markets credentials:', error);
      
      setStatus({
        isConnected: false,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to validate credentials',
        lastChecked: new Date()
      });
    }
  };

  useEffect(() => {
    checkConnection();
  }, [user?.ln_markets_api_key, user?.ln_markets_api_secret, user?.ln_markets_passphrase]);

  return {
    ...status,
    checkConnection,
    hasCredentials: !!(
      user?.ln_markets_api_key && 
      user?.ln_markets_api_secret && 
      user?.ln_markets_passphrase
    )
  };
}
