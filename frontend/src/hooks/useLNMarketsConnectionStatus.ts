import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useCentralizedData } from './useCentralizedData';

interface ConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export function useLNMarketsConnectionStatus() {
  const { user } = useAuthStore();
  const { data: centralizedData, isLoading, error } = useCentralizedData();
  
  // Check if user has credentials configured
  const hasCredentials = !!(
    user?.ln_markets_api_key && 
    user?.ln_markets_api_secret && 
    user?.ln_markets_passphrase
  );

  // Determine connection status based on centralized data
  const isConnected = hasCredentials && !error && centralizedData?.userBalance !== null;
  const connectionError = error || (hasCredentials && !isConnected ? 'Unable to connect to LN Markets' : null);

  return {
    isConnected,
    isLoading,
    error: connectionError,
    hasCredentials,
    lastChecked: centralizedData?.lastUpdate ? new Date(centralizedData.lastUpdate) : null,
    checkConnection: () => {} // No need for manual check since useCentralizedData handles it
  };
}
