import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { useWebSocket } from './useWebSocket';

interface DashboardData {
  user: any;
  balance: any;
  positions: any[];
  estimatedBalance: any;
  marketIndex: any;
  deposits: any[];
  withdrawals: any[];
  lastUpdate: number;
  cacheHit: boolean;
}

interface UseOptimizedDashboardDataReturn {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  lastUpdate: number | null;
  cacheHit: boolean;
}

/**
 * Hook otimizado para dados da dashboard
 * Aproveita o endpoint unificado e cache de credenciais implementados no roadmap
 */
export const useOptimizedDashboardData = (): UseOptimizedDashboardDataReturn => {
  const { isAuthenticated, user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [cacheHit, setCacheHit] = useState(false);

  // Verificar se é admin
  const isAdmin = user?.is_admin || false;

  const fetchDashboardData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      console.log('🔍 OPTIMIZED DASHBOARD - User not authenticated, skipping...');
      return;
    }

    // Log para debug
    console.log('🔍 OPTIMIZED DASHBOARD - User authenticated:', {
      userId: user.id,
      isAdmin: isAdmin,
      email: user.email,
      token: localStorage.getItem('access_token') ? 'EXISTS' : 'MISSING'
    });

    try {
      setIsLoading(true);
      setError(null);

      console.log('🚀 OPTIMIZED DASHBOARD - Fetching unified dashboard data...');
      const startTime = Date.now();

      // Uma única chamada para todos os dados (otimização principal)
      const response = await api.get('/api/lnmarkets-robust/dashboard');
      const dashboardData = response.data;

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (dashboardData.success && dashboardData.data) {
        console.log(`✅ OPTIMIZED DASHBOARD - Data received in ${duration}ms (API v2):`, {
          positions: dashboardData.data.positions?.length || 0,
          deposits: dashboardData.data.deposits?.length || 0,
          withdrawals: dashboardData.data.withdrawals?.length || 0,
          marketIndex: dashboardData.data.marketIndex ? 'present' : 'null',
          cacheHit: dashboardData.data.cacheHit,
          duration: `${duration}ms`,
          fullData: dashboardData.data // 🔍 DEBUG: Log completo dos dados
        });


        setData(dashboardData.data);
        setLastUpdate(dashboardData.data.lastUpdate);
        setCacheHit(dashboardData.data.cacheHit);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('❌ OPTIMIZED DASHBOARD - Error:', err);
      
      // Tratamento de erro baseado no roadmap
      if (err.response?.data?.error === 'MISSING_CREDENTIALS') {
        setError('LN Markets credentials not configured');
      } else if (err.response?.data?.error === 'INVALID_CREDENTIALS') {
        setError('LN Markets credentials are corrupted. Please reconfigure your API credentials in settings.');
      } else {
        setError(err.message || 'Failed to fetch dashboard data');
      }
      
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, isAdmin]);

  // WebSocket para atualizações em tempo real (integrado com LNMarketsRobustService)
  const wsUrl = `ws://localhost:13000/ws?userId=${user?.id || 'anonymous'}`;
  const { isConnected, sendMessage } = useWebSocket({
    url: wsUrl,
    onMessage: useCallback((message) => {
      console.log('📊 OPTIMIZED DASHBOARD - Mensagem WebSocket recebida:', message);
      
      // ✅ HANDLE DATA UPDATE (dados reais da LN Markets)
      if (message.type === 'data_update') {
        console.log('🔄 OPTIMIZED DASHBOARD - Dados atualizados via WebSocket:', message.data);
        
        // Atualizar dados diretamente sem fazer nova requisição
        setData(prev => ({
          ...prev,
          lnMarkets: message.data,
          lastUpdate: Date.now(),
          cacheHit: false // Dados frescos do WebSocket
        }));
        
        console.log('✅ OPTIMIZED DASHBOARD - Dados atualizados com sucesso:', {
          positionsCount: message.data.positions?.length || 0,
          hasUser: !!message.data.user,
          timestamp: new Date().toISOString()
        });
      }
      // ✅ HANDLE CONNECTION ESTABLISHED
      else if (message.type === 'connection') {
        console.log('✅ OPTIMIZED DASHBOARD - Conexão WebSocket estabelecida');
        
        // Solicitar dados iniciais após conexão
        setTimeout(() => {
          console.log('🔄 OPTIMIZED DASHBOARD - Solicitando dados iniciais via WebSocket...');
          sendMessage({
            type: 'refresh_data',
            userId: user?.id
          });
        }, 1000);
      }
      // ✅ HANDLE ERROR
      else if (message.type === 'error') {
        console.error('❌ OPTIMIZED DASHBOARD - Erro WebSocket:', message.message);
        // Fallback para fetchDashboardData em caso de erro
        fetchDashboardData();
      }
    }, [fetchDashboardData, user?.id])
  });

  // ✅ SISTEMA HÍBRIDO OTIMIZADO: WebSocket Primário + Fallback HTTP Condicional
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    console.log('🔄 OPTIMIZED DASHBOARD - Configurando sistema híbrido otimizado...');
    
    let intervalId: NodeJS.Timeout | null = null;
    let healthCheckId: NodeJS.Timeout | null = null;
    
    // ✅ FALLBACK HTTP CONDICIONAL: Só ativa se WebSocket estiver explicitamente desconectado
    if (!isConnected) {
      console.log('🔄 OPTIMIZED DASHBOARD - WebSocket desconectado, ativando fallback HTTP...');
      intervalId = setInterval(() => {
        console.log('🔄 OPTIMIZED DASHBOARD - Executando fallback HTTP...');
        fetchDashboardData();
      }, 30000); // 30 segundos - máximo seguro para mercados voláteis
    } else {
      console.log('✅ OPTIMIZED DASHBOARD - WebSocket conectado, fallback HTTP DESATIVADO');
    }

    // ✅ HEALTH CHECK: Verificar conexão WebSocket periodicamente
    healthCheckId = setInterval(() => {
      if (isConnected) {
        console.log('💚 OPTIMIZED DASHBOARD - WebSocket health check: OK');
      } else {
        console.log('💔 OPTIMIZED DASHBOARD - WebSocket health check: DISCONNECTED');
      }
    }, 10000); // Verificar a cada 10 segundos

    return () => {
      console.log('🔄 OPTIMIZED DASHBOARD - Limpando sistema híbrido otimizado...');
      if (intervalId) clearInterval(intervalId);
      if (healthCheckId) clearInterval(healthCheckId);
    };
  }, [isAuthenticated, user?.id, isConnected]); // Removido fetchDashboardData para evitar loop

  // Carregar dados inicialmente
  useEffect(() => {
    console.log('🔍 OPTIMIZED DASHBOARD - useEffect triggered:', {
      isAuthenticated,
      userId: user?.id,
      isAdmin,
      token: localStorage.getItem('access_token') ? 'EXISTS' : 'MISSING'
    });
    
    if (isAuthenticated && user?.id) {
      console.log('🚀 OPTIMIZED DASHBOARD - Calling fetchDashboardData...');
      fetchDashboardData();
    } else {
      console.log('❌ OPTIMIZED DASHBOARD - Not authenticated or no user ID');
    }
  }, [isAuthenticated, user?.id, isAdmin]); // Mantém dependências necessárias

  // ✅ REFATORAÇÃO: Sistema Híbrido Otimizado (Conforme documentação)
  const refresh = useCallback(async () => {
    console.log('🔄 OPTIMIZED DASHBOARD - Manual refresh triggered...');
    
    // ✅ PRIORIDADE ABSOLUTA: WebSocket quando conectado
    if (isConnected && sendMessage) {
      console.log('🚀 OPTIMIZED DASHBOARD - Solicitando dados via WebSocket (prioridade)...');
      sendMessage({
        type: 'refresh_data',
        userId: user?.id
      });
      // ✅ NÃO executar fetchDashboardData quando WebSocket está ativo
      return;
    }
    
    // ✅ FALLBACK: HTTP apenas quando WebSocket não está disponível
    console.log('🔄 OPTIMIZED DASHBOARD - WebSocket não disponível, usando HTTP fallback...');
    await fetchDashboardData();
  }, [isConnected, sendMessage, user?.id]); // ✅ REFATORAÇÃO: Removido fetchDashboardData para evitar loop

  // ✅ FUNÇÃO DE RECONEXÃO AUTOMÁTICA
  const reconnectWebSocket = useCallback(() => {
    console.log('🔄 OPTIMIZED DASHBOARD - Tentando reconectar WebSocket...');
    
    // Forçar reconexão do WebSocket
    if (sendMessage) {
      // Enviar ping para testar conexão
      sendMessage({
        type: 'ping',
        userId: user?.id,
        timestamp: Date.now()
      });
    }
  }, [sendMessage, user?.id]);

  return {
    data,
    isLoading,
    error,
    refresh,
    reconnectWebSocket,
    lastUpdate,
    cacheHit,
    isWebSocketConnected: isConnected
  };
};

/**
 * Hook para métricas da dashboard otimizadas
 * Usa dados do endpoint unificado
 */
export const useOptimizedDashboardMetrics = () => {
  const { data, isLoading, error } = useOptimizedDashboardData();

  if (!data || isLoading || error) {
    // ✅ SEGURO: Retornar valores zero quando não há dados reais
    // Nunca usar dados simulados em mercados voláteis!
    return {
      totalPL: 0, // Zero - dados indisponíveis
      estimatedProfit: 0, // Zero - dados indisponíveis
      totalMargin: 0, // Zero - dados indisponíveis
      estimatedFees: 0, // Zero - dados indisponíveis
      availableMargin: 0, // Zero - dados indisponíveis
      estimatedBalance: 0, // Zero - dados indisponíveis
      totalInvested: 0, // Zero - dados indisponíveis
      netProfit: 0, // Zero - dados indisponíveis
      feesPaid: 0, // Zero - dados indisponíveis
      positionCount: 0, // Zero - dados indisponíveis
      activeTrades: 0, // Zero - dados indisponíveis
      isLoading,
      error: error || 'Dados indisponíveis - por segurança, não exibimos dados antigos'
    };
  }

  // ✅ VALIDAÇÃO DE SEGURANÇA: Verificar se dados são recentes
  const lastUpdate = data.lnMarkets?.metadata?.lastUpdate;
  if (lastUpdate) {
    const dataAge = Date.now() - new Date(lastUpdate).getTime();
    const maxAge = 5 * 60 * 1000; // 5 minutos máximo (mais razoável para dados de mercado)
    
    if (dataAge > maxAge) {
      console.warn('🚨 SEGURANÇA - Dados muito antigos:', {
        age: Math.floor(dataAge / 1000) + 's',
        maxAge: Math.floor(maxAge / 1000) + 's',
        lastUpdate,
        message: 'Rejeitando dados antigos por segurança'
      });
      
      return {
        totalPL: 0,
        estimatedProfit: 0,
        totalMargin: 0,
        estimatedFees: 0,
        availableMargin: 0,
        estimatedBalance: 0,
        totalInvested: 0,
        netProfit: 0,
        feesPaid: 0,
        positionCount: 0,
        activeTrades: 0,
        isLoading: false,
        error: 'Dados muito antigos - por segurança, não exibimos dados desatualizados'
      };
    }
  }

  // Calcular métricas dos dados unificados (API v2)
  const positions = data.lnMarkets?.positions || [];
  const user = data.lnMarkets?.user || {};
  
  // ✅ Dados recebidos com sucesso
  const calculatedTotalPL = positions.reduce((sum, pos) => sum + (pos.pl || 0), 0);
  
  console.log('✅ OPTIMIZED DASHBOARD METRICS - Data processed:', {
    hasData: !!data,
    hasLnMarkets: !!data.lnMarkets,
    positionsCount: positions.length,
    userBalance: user.balance,
    totalPL: calculatedTotalPL,
    timestamp: new Date().toISOString()
  });
  
  // Calcular P&L total das posições running
  const totalPL = positions.reduce((sum, pos) => sum + (pos.pl || 0), 0);
  
  // Estimated Profit: Lucro estimado se fechar TODAS as posições AGORA
  // Isso inclui o PnL atual + taxas de fechamento estimadas
  const estimatedProfit = positions.reduce((sum, pos) => {
    const currentPnL = pos.pl || 0;
    const closingFee = pos.closing_fee || 0;
    // PnL atual menos a taxa de fechamento (que seria cobrada ao fechar)
    return sum + (currentPnL - closingFee);
  }, 0);
  const totalMargin = positions.reduce((sum, pos) => sum + (pos.margin || 0), 0);
  const estimatedFees = positions.reduce((sum, pos) => sum + (pos.opening_fee || 0) + (pos.closing_fee || 0), 0);
  const availableMargin = user.balance || 0; // Saldo da wallet
  const estimatedBalance = (user.balance || 0) + totalPL; // Saldo + P&L
  const totalInvested = totalMargin; // Margem total investida
  const netProfit = totalPL; // P&L líquido
  const feesPaid = estimatedFees; // Taxas pagas
  const positionCount = positions.length;
  const activeTrades = positions.filter(p => p.running && !p.closed).length;

  return {
    totalPL,
    estimatedProfit,
    totalMargin,
    estimatedFees,
    availableMargin,
    estimatedBalance,
    totalInvested,
    netProfit,
    feesPaid,
    positionCount,
    activeTrades,
    isLoading,
    error
  };
};

/**
 * Hook para dados de posições otimizados
 * Usa dados do endpoint unificado
 */
export const useOptimizedPositions = () => {
  const { data, isLoading, error } = useOptimizedDashboardData();

  const positions = data?.lnMarkets?.positions || [];

  return {
    positions,
    isLoading,
    error
  };
};

/**
 * Hook para dados de mercado otimizados
 * Usa dados do endpoint unificado
 */
export const useOptimizedMarketData = () => {
  const { data, isLoading, error } = useOptimizedDashboardData();

  return {
    marketIndex: data?.lnMarkets?.market || null,
    deposits: data?.lnMarkets?.deposits || [],
    withdrawals: data?.lnMarkets?.withdrawals || [],
    isLoading,
    error
  };
};
