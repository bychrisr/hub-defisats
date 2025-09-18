import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useRealtimeData } from '@/contexts/RealtimeDataContext';
import { usePositions } from '@/contexts/PositionsContext';
import { useEstimatedBalance } from '@/hooks/useEstimatedBalance';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { usePositionsMetrics } from '@/contexts/PositionsContext';

interface RealtimeDashboardConfig {
  positionsInterval?: number; // Intervalo para atualizar posições (ms)
  balanceInterval?: number; // Intervalo para atualizar saldo (ms)
  marketInterval?: number; // Intervalo para atualizar dados de mercado (ms)
  historicalInterval?: number; // Intervalo para atualizar dados históricos (ms)
  enabled?: boolean; // Se o polling está habilitado
}

export const useRealtimeDashboard = (config: RealtimeDashboardConfig = {}) => {
  const {
    positionsInterval = 5000, // 5 segundos
    balanceInterval = 10000, // 10 segundos
    marketInterval = 30000, // 30 segundos
    historicalInterval = 60000, // 1 minuto
    enabled = true
  } = config;

  const { isAuthenticated, user } = useAuthStore();
  const { loadUserBalance, loadUserPositions } = useRealtimeData();
  const { fetchRealPositions } = usePositions();
  const { refetch: refetchEstimatedBalance } = useEstimatedBalance();
  const { refetch: refetchHistoricalData } = useHistoricalData();
  const { refetch: refetchPositionsMetrics } = usePositionsMetrics();

  // Refs para controlar os intervalos
  const positionsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const balanceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const marketIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const historicalIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Função para atualizar posições
  const updatePositions = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    
    try {
      console.log('🔄 REALTIME DASHBOARD - Updating positions...');
      await fetchRealPositions();
      await refetchPositionsMetrics();
    } catch (error) {
      console.error('❌ REALTIME DASHBOARD - Error updating positions:', error);
    }
  }, [isAuthenticated, user?.id, fetchRealPositions, refetchPositionsMetrics]);

  // Função para atualizar saldo
  const updateBalance = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    
    try {
      console.log('🔄 REALTIME DASHBOARD - Updating balance...');
      await loadUserBalance();
    } catch (error) {
      console.error('❌ REALTIME DASHBOARD - Error updating balance:', error);
    }
  }, [isAuthenticated, user?.id, loadUserBalance]);

  // Função para atualizar dados de mercado
  const updateMarketData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    
    try {
      console.log('🔄 REALTIME DASHBOARD - Updating market data...');
      await fetchRealPositions(); // Isso também atualiza o market index
    } catch (error) {
      console.error('❌ REALTIME DASHBOARD - Error updating market data:', error);
    }
  }, [isAuthenticated, user?.id, fetchRealPositions]);

  // Função para atualizar dados históricos
  const updateHistoricalData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    
    try {
      console.log('🔄 REALTIME DASHBOARD - Updating historical data...');
      await refetchHistoricalData();
      await refetchEstimatedBalance();
    } catch (error) {
      console.error('❌ REALTIME DASHBOARD - Error updating historical data:', error);
    }
  }, [isAuthenticated, user?.id, refetchHistoricalData, refetchEstimatedBalance]);

  // Função para limpar todos os intervalos
  const clearAllIntervals = useCallback(() => {
    if (positionsIntervalRef.current) {
      clearInterval(positionsIntervalRef.current);
      positionsIntervalRef.current = null;
    }
    if (balanceIntervalRef.current) {
      clearInterval(balanceIntervalRef.current);
      balanceIntervalRef.current = null;
    }
    if (marketIntervalRef.current) {
      clearInterval(marketIntervalRef.current);
      marketIntervalRef.current = null;
    }
    if (historicalIntervalRef.current) {
      clearInterval(historicalIntervalRef.current);
      historicalIntervalRef.current = null;
    }
  }, []);

  // Função para iniciar todos os intervalos
  const startAllIntervals = useCallback(() => {
    if (!enabled || !isAuthenticated || !user?.id) return;

    console.log('🚀 REALTIME DASHBOARD - Starting all intervals...');

    // Atualizar posições a cada 5 segundos
    positionsIntervalRef.current = setInterval(updatePositions, positionsInterval);

    // Atualizar saldo a cada 10 segundos
    balanceIntervalRef.current = setInterval(updateBalance, balanceInterval);

    // Atualizar dados de mercado a cada 30 segundos
    marketIntervalRef.current = setInterval(updateMarketData, marketInterval);

    // Atualizar dados históricos a cada 1 minuto
    historicalIntervalRef.current = setInterval(updateHistoricalData, historicalInterval);
  }, [
    enabled,
    isAuthenticated,
    user?.id,
    positionsInterval,
    balanceInterval,
    marketInterval,
    historicalInterval,
    updatePositions,
    updateBalance,
    updateMarketData,
    updateHistoricalData
  ]);

  // Efeito para gerenciar os intervalos
  useEffect(() => {
    if (enabled && isAuthenticated && user?.id) {
      // Atualização inicial imediata
      updatePositions();
      updateBalance();
      updateMarketData();
      updateHistoricalData();

      // Iniciar intervalos
      startAllIntervals();
    } else {
      // Limpar intervalos quando não autenticado ou desabilitado
      clearAllIntervals();
    }

    // Cleanup ao desmontar
    return () => {
      clearAllIntervals();
    };
  }, [
    enabled,
    isAuthenticated,
    user?.id,
    startAllIntervals,
    clearAllIntervals,
    updatePositions,
    updateBalance,
    updateMarketData,
    updateHistoricalData
  ]);

  // Função para forçar atualização manual de todos os dados
  const refreshAll = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    console.log('🔄 REALTIME DASHBOARD - Manual refresh of all data...');
    
    try {
      await Promise.all([
        updatePositions(),
        updateBalance(),
        updateMarketData(),
        updateHistoricalData()
      ]);
      console.log('✅ REALTIME DASHBOARD - All data refreshed successfully');
    } catch (error) {
      console.error('❌ REALTIME DASHBOARD - Error in manual refresh:', error);
    }
  }, [
    isAuthenticated,
    user?.id,
    updatePositions,
    updateBalance,
    updateMarketData,
    updateHistoricalData
  ]);

  return {
    refreshAll,
    updatePositions,
    updateBalance,
    updateMarketData,
    updateHistoricalData,
    isEnabled: enabled && isAuthenticated && !!user?.id
  };
};
