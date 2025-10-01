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
  const centralizedDataHook = useCentralizedData();
  
  // Debug the hook return
  console.log('🔍 CENTRALIZED DATA HOOK DEBUG:', {
    data: centralizedDataHook.data,
    isLoading: centralizedDataHook.isLoading,
    error: centralizedDataHook.error,
    isConnected: centralizedDataHook.isConnected
  });
  
  // Simple test log
  console.log('🔍 SIMPLE TEST LOG - Hook is running');
  
  const { data: centralizedData, isLoading, error } = centralizedDataHook;
  
  // Check if user has credentials configured
  const hasCredentials = !!(
    user?.ln_markets_api_key && 
    user?.ln_markets_api_secret && 
    user?.ln_markets_passphrase
  );

  // Debug logging
  console.log('🔍 CONNECTION STATUS DEBUG:', {
    hasCredentials,
    centralizedData: centralizedData,
    userBalance: centralizedData?.userBalance,
    userPositions: centralizedData?.userPositions?.length,
    centralizedError: centralizedData?.error,
    hookError: error,
    isLoading
  });

  // ✅ CORREÇÃO: Validação mais flexível seguindo VOLATILE_MARKET_SAFETY
  // Se o endpoint retorna success: true, consideramos conectado
  const hasValidData = centralizedData && centralizedData.lastUpdate > 0 && (
    // Se temos dados de mercado (obrigatório)
    centralizedData.marketIndex && 
    centralizedData.marketIndex.index > 0 &&
    centralizedData.marketIndex.timestamp > 0
  );
  
  // Check for specific credential errors in the error message
  const hasCredentialError = error?.includes('credentials') || 
                            error?.includes('authentication') ||
                            error?.includes('unauthorized') ||
                            centralizedData?.error?.includes('credentials') ||
                            centralizedData?.error?.includes('authentication');

  const isConnected = hasCredentials && hasValidData && !hasCredentialError;
  
  console.log('🔍 CONNECTION STATUS RESULT:', {
    hasValidData,
    hasCredentialError,
    isConnected
  });
  
  let connectionError = null;
  if (hasCredentials && !isConnected) {
    if (hasCredentialError) {
      connectionError = 'Invalid credentials';
    } else if (centralizedData?.error) {
      connectionError = centralizedData.error;
    } else if (error) {
      connectionError = error;
    } else {
      connectionError = 'Unable to connect to LN Markets';
    }
  }

  return {
    isConnected,
    isLoading,
    error: connectionError,
    hasCredentials,
    lastChecked: centralizedData?.lastUpdate ? new Date(centralizedData.lastUpdate) : null,
    checkConnection: () => {} // No need for manual check since useCentralizedData handles it
  };
}
