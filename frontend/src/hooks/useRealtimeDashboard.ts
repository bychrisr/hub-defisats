import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useCentralizedData } from './useCentralizedData';
import { useEstimatedBalance } from '@/hooks/useEstimatedBalance';
import { useHistoricalData } from '@/hooks/useHistoricalData';
import { usePositions } from '@/contexts/PositionsContext';

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
  
  // Verificar se é admin
  const isAdmin = user?.is_admin || false;
  
  const { refreshData: refreshCentralizedData, isLoading: centralizedLoading } = useCentralizedData();
  const { refetch: refetchEstimatedBalance } = useEstimatedBalance();
  const { refetch: refetchHistoricalData } = useHistoricalData();
  const { refreshPositions } = usePositions();

  // Refs para controlar os intervalos
  const positionsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const balanceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const marketIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const historicalIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Função para atualizar dados principais (posições, saldo, mercado)
  const updateMainData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    
    // Pular para admins
    if (isAdmin) {
      console.log('🔄 REALTIME DASHBOARD - Admin user, skipping main data update...');
      return;
    }
    
    try {
      console.log('🔄 REALTIME DASHBOARD - Updating main data (positions, balance, market)...');
      await refreshCentralizedData();
    } catch (error) {
      console.error('❌ REALTIME DASHBOARD - Error updating main data:', error);
    }
  }, [isAuthenticated, user?.id, isAdmin, refreshCentralizedData]);

  // Função para atualizar dados históricos
  const updateHistoricalData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    
    // Pular para admins
    if (isAdmin) {
      console.log('🔄 REALTIME DASHBOARD - Admin user, skipping historical data update...');
      return;
    }
    
    try {
      console.log('🔄 REALTIME DASHBOARD - Updating historical data...');
      await Promise.all([
        refetchHistoricalData(),
        refetchEstimatedBalance(),
        refreshPositions()
      ]);
    } catch (error) {
      console.error('❌ REALTIME DASHBOARD - Error updating historical data:', error);
    }
  }, [isAuthenticated, user?.id, isAdmin, refetchHistoricalData, refetchEstimatedBalance, refreshPositions]);

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

    // Pular para admins
    if (isAdmin) {
      console.log('🚀 REALTIME DASHBOARD - Admin user, skipping intervals...');
      return;
    }

    console.log('🚀 REALTIME DASHBOARD - Starting all intervals...');

    // Atualizar dados principais a cada 10 segundos (posições, saldo, mercado)
    positionsIntervalRef.current = setInterval(updateMainData, positionsInterval);

    // Atualizar dados históricos a cada 2 minutos
    historicalIntervalRef.current = setInterval(updateHistoricalData, historicalInterval);
  }, [
    enabled,
    isAuthenticated,
    user?.id,
    isAdmin,
    positionsInterval,
    historicalInterval,
    updateMainData,
    updateHistoricalData
  ]);

  // ✅ REFATORAÇÃO: Prevenção de Loops Infinitos (Conforme documentação)
  const isInitialLoad = useRef(true);
  const lastUser = useRef(user?.id);

  // Efeito para gerenciar os intervalos
  useEffect(() => {
    // DESABILITAR COMPLETAMENTE para admins
    if (isAdmin) {
      console.log('🚀 REALTIME DASHBOARD - Admin user, DISABLING ALL POLLING...');
      clearAllIntervals();
      return;
    }

    // ✅ REFATORAÇÃO: Carregamento inicial vs recarregamento
    if (enabled && isAuthenticated && user?.id) {
      if (isInitialLoad.current || lastUser.current !== user?.id) {
        console.log('🚀 REALTIME DASHBOARD - Initial load or user changed');
        // Atualização inicial imediata
        updateMainData();
        updateHistoricalData();
        
        // Iniciar intervalos apenas no carregamento inicial
        if (isInitialLoad.current) {
          startAllIntervals();
          isInitialLoad.current = false;
        }
        
        lastUser.current = user?.id;
      }
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
    isAdmin
    // ✅ REFATORAÇÃO: Dependências mínimas para evitar loops
  ]);

  // Função para forçar atualização manual de todos os dados
  const refreshAll = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;
    
    // Pular para admins
    if (isAdmin) {
      console.log('🔄 REALTIME DASHBOARD - Admin user, skipping manual refresh...');
      return;
    }
    
    console.log('🔄 REALTIME DASHBOARD - Manual refresh triggered...');
    try {
      await Promise.all([
        updateMainData(),
        updateHistoricalData()
      ]);
      console.log('✅ REALTIME DASHBOARD - All data refreshed successfully.');
    } catch (error) {
      console.error('❌ REALTIME DASHBOARD - Error during manual refresh:', error);
    }
  }, [isAuthenticated, user?.id, isAdmin, updateMainData, updateHistoricalData]);

  return {
    refreshAll,
    isEnabled: enabled,
    isLoading: centralizedLoading
  };
};