/**
 * Testnet Faucet Hook
 * 
 * Hook for managing testnet faucet operations including requesting
 * testnet sats, checking status, and managing QR codes.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth';

export interface FaucetInfo {
  maxAmount: number;
  minAmount: number;
  rateLimitHours: number;
  userRateLimit: number;
  isEnabled: boolean;
  network: 'testnet' | 'mainnet';
}

export interface FaucetRequest {
  amount: number;
  invoice: string;
}

export interface FaucetDistribution {
  id: string;
  ip_address: string;
  user_id?: string;
  amount_sats: number;
  invoice_bolt11: string;
  payment_hash: string;
  payment_preimage?: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  expires_at: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FaucetStats {
  totalDistributed: number;
  totalUsers: number;
  averageAmount: number;
  successRate: number;
  last24Hours: number;
}

export const useTestnetFaucet = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [currentInvoice, setCurrentInvoice] = useState<string>('');
  const [qrCodeData, setQrCodeData] = useState<string>('');

  // Get faucet info
  const { data: faucetInfo, isLoading: infoLoading } = useQuery<FaucetInfo>({
    queryKey: ['testnet-faucet-info'],
    queryFn: async () => {
      const response = await fetch('/api/testnet-faucet/info');
      if (!response.ok) {
        throw new Error('Failed to fetch faucet info');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get faucet stats
  const { data: faucetStats, isLoading: statsLoading } = useQuery<FaucetStats>({
    queryKey: ['testnet-faucet-stats'],
    queryFn: async () => {
      const response = await fetch('/api/testnet-faucet/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch faucet stats');
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get user's faucet history
  const { data: faucetHistory, isLoading: historyLoading } = useQuery<FaucetDistribution[]>({
    queryKey: ['testnet-faucet-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const response = await fetch('/api/testnet-faucet/history');
      if (!response.ok) {
        throw new Error('Failed to fetch faucet history');
      }
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Request testnet sats
  const requestSatsMutation = useMutation<FaucetDistribution, Error, { amount: number }>({
    mutationFn: async ({ amount }) => {
      const response = await fetch('/api/testnet-faucet/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to request testnet sats');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setCurrentInvoice(data.invoice_bolt11);
      setQrCodeData(data.invoice_bolt11);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['testnet-faucet-history'] });
      queryClient.invalidateQueries({ queryKey: ['testnet-faucet-stats'] });
    },
    onError: (error) => {
      console.error('❌ Failed to request testnet sats:', error);
    },
  });

  // Check payment status
  const checkPaymentStatusMutation = useMutation<FaucetDistribution, Error, string>({
    mutationFn: async (paymentHash) => {
      const response = await fetch(`/api/testnet-faucet/status/${paymentHash}`);
      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data.status === 'paid') {
        setCurrentInvoice('');
        setQrCodeData('');
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['testnet-faucet-history'] });
        queryClient.invalidateQueries({ queryKey: ['testnet-faucet-stats'] });
      }
    },
  });

  // Auto-refresh payment status
  useEffect(() => {
    if (currentInvoice && requestSatsMutation.data) {
      const interval = setInterval(() => {
        checkPaymentStatusMutation.mutate(requestSatsMutation.data.payment_hash);
      }, 5000); // Check every 5 seconds

      return () => clearInterval(interval);
    }
  }, [currentInvoice, requestSatsMutation.data]);

  // Request testnet sats
  const requestSats = (amount: number) => {
    if (!faucetInfo?.isEnabled) {
      throw new Error('Testnet faucet is not enabled');
    }

    if (amount < faucetInfo.minAmount || amount > faucetInfo.maxAmount) {
      throw new Error(`Amount must be between ${faucetInfo.minAmount} and ${faucetInfo.maxAmount} sats`);
    }

    requestSatsMutation.mutate({ amount });
  };

  // Check if user can request more sats
  const canRequestMore = () => {
    if (!faucetInfo || !faucetHistory) return false;
    
    const now = new Date();
    const rateLimitMs = faucetInfo.rateLimitHours * 60 * 60 * 1000;
    
    const recentRequests = faucetHistory.filter(request => {
      const requestTime = new Date(request.created_at);
      return (now.getTime() - requestTime.getTime()) < rateLimitMs;
    });

    return recentRequests.length < faucetInfo.userRateLimit;
  };

  // Get time until next request is allowed
  const getTimeUntilNextRequest = () => {
    if (!faucetInfo || !faucetHistory || canRequestMore()) return null;

    const now = new Date();
    const rateLimitMs = faucetInfo.rateLimitHours * 60 * 60 * 1000;
    
    const oldestRequest = faucetHistory
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .find(request => {
        const requestTime = new Date(request.created_at);
        return (now.getTime() - requestTime.getTime()) < rateLimitMs;
      });

    if (!oldestRequest) return null;

    const oldestRequestTime = new Date(oldestRequest.created_at);
    const nextAllowedTime = new Date(oldestRequestTime.getTime() + rateLimitMs);
    
    return nextAllowedTime;
  };

  // Get user's total received sats
  const getTotalReceived = () => {
    if (!faucetHistory) return 0;
    
    return faucetHistory
      .filter(request => request.status === 'paid')
      .reduce((total, request) => total + request.amount_sats, 0);
  };

  // Get user's pending requests
  const getPendingRequests = () => {
    if (!faucetHistory) return [];
    
    return faucetHistory.filter(request => request.status === 'pending');
  };

  // Get user's successful requests
  const getSuccessfulRequests = () => {
    if (!faucetHistory) return [];
    
    return faucetHistory.filter(request => request.status === 'paid');
  };

  return {
    // Data
    faucetInfo,
    faucetStats,
    faucetHistory,
    currentInvoice,
    qrCodeData,
    
    // Loading states
    infoLoading,
    statsLoading,
    historyLoading,
    isRequesting: requestSatsMutation.isPending,
    isCheckingStatus: checkPaymentStatusMutation.isPending,
    
    // Actions
    requestSats,
    checkPaymentStatus: checkPaymentStatusMutation.mutate,
    
    // Computed values
    canRequestMore: canRequestMore(),
    timeUntilNextRequest: getTimeUntilNextRequest(),
    totalReceived: getTotalReceived(),
    pendingRequests: getPendingRequests(),
    successfulRequests: getSuccessfulRequests(),
    
    // Errors
    requestError: requestSatsMutation.error,
    statusCheckError: checkPaymentStatusMutation.error,
  };
};
