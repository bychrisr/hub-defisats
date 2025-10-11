/**
 * Testnet Faucet Hook
 * 
 * Hook para interagir com o sistema de funding interno via LND testnet
 */

import { useState, useCallback } from 'react';

export interface FaucetInfo {
  isAvailable: boolean;
  maxAmount: number;
  minAmount: number;
  dailyLimit: number;
  currentBalance: number;
  lndStatus: 'connected' | 'disconnected' | 'syncing';
  lastUpdate: string;
}

export interface FundingRequest {
  amount: number;
  lightningAddress?: string;
  memo?: string;
}

export interface FundingResult {
  requestId: string;
  amount: number;
  lightningInvoice?: string;
  lnMarketsDeposit?: {
    txid: string;
    amount: number;
    status: string;
  };
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
}

export interface FundingHistoryItem {
  id: string;
  amount: number;
  status: string;
  timestamp: string;
  lightningInvoice?: string;
  lnMarketsDeposit?: any;
}

export interface FaucetStats {
  totalRequests: number;
  totalSatsDistributed: number;
  successfulRequests: number;
  failedRequests: number;
  averageAmount: number;
  last24Hours: {
    requests: number;
    satsDistributed: number;
  };
}

export function useTestnetFaucet() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faucetInfo, setFaucetInfo] = useState<FaucetInfo | null>(null);
  const [fundingHistory, setFundingHistory] = useState<FundingHistoryItem[]>([]);
  const [stats, setStats] = useState<FaucetStats | null>(null);

  /**
   * Obter informações do faucet
   */
  const getFaucetInfo = useCallback(async (): Promise<FaucetInfo> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/testnet-faucet/info');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get faucet info');
      }

      setFaucetInfo(result.data);
      return result.data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get faucet info';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Solicitar funding
   */
  const requestFunding = useCallback(async (
    request: FundingRequest
  ): Promise<FundingResult> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/testnet-faucet/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to request funding');
      }

      // Atualizar histórico local
      setFundingHistory(prev => [result.data, ...prev]);

      // Atualizar informações do faucet
      await getFaucetInfo();

      return result.data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to request funding';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getFaucetInfo]);

  /**
   * Obter histórico de funding
   */
  const getFundingHistory = useCallback(async (
    limit: number = 50,
    offset: number = 0
  ): Promise<FundingHistoryItem[]> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/testnet-faucet/history?limit=${limit}&offset=${offset}`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get funding history');
      }

      setFundingHistory(result.data.items);
      return result.data.items;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get funding history';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obter estatísticas do faucet
   */
  const getFaucetStats = useCallback(async (): Promise<FaucetStats> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/testnet-faucet/stats');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get faucet stats');
      }

      setStats(result.data);
      return result.data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get faucet stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Solicitar funding com valores padrão
   */
  const requestDefaultFunding = useCallback(async (amount?: number) => {
    return requestFunding({
      amount: amount || 10000, // 10,000 sats por padrão
      memo: 'Testnet faucet funding'
    });
  }, [requestFunding]);

  /**
   * Solicitar funding máximo
   */
  const requestMaxFunding = useCallback(async () => {
    if (!faucetInfo) {
      await getFaucetInfo();
    }

    const maxAmount = faucetInfo?.maxAmount || 100000;
    return requestFunding({
      amount: maxAmount,
      memo: 'Maximum testnet funding'
    });
  }, [faucetInfo, getFaucetInfo, requestFunding]);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh de todos os dados
   */
  const refresh = useCallback(async () => {
    try {
      await Promise.all([
        getFaucetInfo(),
        getFundingHistory(),
        getFaucetStats()
      ]);
    } catch (err) {
      console.error('Failed to refresh faucet data:', err);
    }
  }, [getFaucetInfo, getFundingHistory, getFaucetStats]);

  return {
    // Estado
    loading,
    error,
    faucetInfo,
    fundingHistory,
    stats,

    // Ações
    getFaucetInfo,
    requestFunding,
    requestDefaultFunding,
    requestMaxFunding,
    getFundingHistory,
    getFaucetStats,
    clearError,
    refresh,

    // Helpers
    isAvailable: faucetInfo?.isAvailable || false,
    currentBalance: faucetInfo?.currentBalance || 0,
    maxAmount: faucetInfo?.maxAmount || 100000,
    minAmount: faucetInfo?.minAmount || 1000,
    dailyLimit: faucetInfo?.dailyLimit || 500000,
    lndStatus: faucetInfo?.lndStatus || 'disconnected'
  };
}