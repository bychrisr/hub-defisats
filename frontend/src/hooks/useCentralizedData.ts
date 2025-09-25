import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

interface CentralizedData {
  // User data
  userBalance: any;
  userPositions: any[];
  
  // Market data
  marketIndex: {
    index: number;
    index24hChange: number;
    tradingFees: number;
    nextFunding: string;
    rate: number;
    rateChange: number;
    timestamp: number;
    source?: string;
  };
  
  // Menu data
  menuData: any;
  
  // Loading states
  isLoading: boolean;
  lastUpdate: number;
  error: string | null;
}

interface UseCentralizedDataReturn extends CentralizedData {
  refreshData: () => Promise<void>;
  isConnected: boolean;
}

// Cache global para dados centralizados (30 segundos - apenas para evitar spam)
let globalCache = {
  data: null as CentralizedData | null,
  timestamp: 0,
  ttl: 30 * 1000 // 30 segundos - dados devem ser muito recentes
};

export const useCentralizedData = (): UseCentralizedDataReturn => {
  const { isAuthenticated, user } = useAuthStore();
  
  // Verificar se é admin
  const isAdmin = user?.is_admin || false;
  const [data, setData] = useState<CentralizedData>({
    userBalance: null,
    userPositions: [],
    marketIndex: {
      index: 0,
      index24hChange: 0,
      tradingFees: 0,
      nextFunding: '--',
      rate: 0,
      rateChange: 0,
      timestamp: 0,
      source: 'lnmarkets'
    },
    menuData: null,
    isLoading: false,
    lastUpdate: 0,
    error: null
  });

  const refreshData = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    // Pular para admins - eles não têm credenciais LN Markets
    if (isAdmin) {
      console.log('🔄 CENTRALIZED DATA - Admin user, skipping LN Markets queries...');
      return;
    }

    // Verificar cache apenas para evitar spam (30 segundos máximo)
    const now = Date.now();
    if (globalCache.data && (now - globalCache.timestamp) < globalCache.ttl) {
      console.log('✅ CENTRALIZED DATA - Using recent cached data (30s)');
      setData(globalCache.data);
      return;
    }

    setData(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('🔄 CENTRALIZED DATA - Fetching all data in single request...');

      // Fazer todas as requisições em paralelo com retry para market data
      const [balanceResponse, positionsResponse, marketResponse, menuResponse] = await Promise.allSettled([
        api.get('/api/lnmarkets/user/balance'),
        api.get('/api/lnmarkets/user/positions'),
        // Retry para market data se falhar
        api.get('/api/market/index/public').catch(async () => {
          console.log('🔄 CENTRALIZED DATA - Market data failed, retrying...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return api.get('/api/market/index/public');
        }),
        api.get('/api/menu')
      ]);

      // Processar respostas e detectar erros de credenciais
      const userBalance = balanceResponse.status === 'fulfilled' && balanceResponse.value.data.success 
        ? balanceResponse.value.data.data 
        : null;

      const userPositions = positionsResponse.status === 'fulfilled' && positionsResponse.value.data.success 
        ? positionsResponse.value.data.data || []
        : [];

      // Check for credential errors in responses
      let credentialError = null;
      if (balanceResponse.status === 'rejected') {
        const errorData = balanceResponse.reason?.response?.data;
        const status = balanceResponse.reason?.response?.status;
        if (errorData?.message?.includes('credentials') || 
            errorData?.message?.includes('authentication') ||
            errorData?.message?.includes('unauthorized') ||
            status === 401) {
          credentialError = 'Invalid LN Markets credentials';
        }
      }
      if (positionsResponse.status === 'rejected') {
        const errorData = positionsResponse.reason?.response?.data;
        const status = positionsResponse.reason?.response?.status;
        if (errorData?.message?.includes('credentials') || 
            errorData?.message?.includes('authentication') ||
            errorData?.message?.includes('unauthorized') ||
            status === 401) {
          credentialError = 'Invalid LN Markets credentials';
        }
      }

      // Also check if we got empty/null data when we should have data
      // This indicates invalid credentials even if API doesn't return 401
      const hasCredentials = !!(user?.ln_markets_api_key && user?.ln_markets_api_secret && user?.ln_markets_passphrase);
      if (!credentialError && hasCredentials && (!userBalance && !userPositions.length)) {
        // If we have credentials but no data, likely invalid credentials
        credentialError = 'Invalid LN Markets credentials';
      }

      const marketIndex = marketResponse.status === 'fulfilled' && marketResponse.value.data.success 
        ? {
            index: marketResponse.value.data.data.index || 0,
            index24hChange: marketResponse.value.data.data.index24hChange || 0,
            tradingFees: marketResponse.value.data.data.tradingFees || 0,
            nextFunding: marketResponse.value.data.data.nextFunding || '--',
            rate: marketResponse.value.data.data.rate || 0,
            rateChange: marketResponse.value.data.data.rateChange || 0,
            timestamp: marketResponse.value.data.data.timestamp || Date.now(),
            source: marketResponse.value.data.data.source || 'lnmarkets'
          }
        : null; // NUNCA usar dados padrão em mercado volátil

      const menuData = menuResponse.status === 'fulfilled' && menuResponse.value.data.success 
        ? menuResponse.value.data.data 
        : null;

      // Verificar se houve erros críticos (market data é obrigatório)
      const criticalErrors = [];
      if (credentialError) {
        criticalErrors.push(credentialError);
      }
      if (marketResponse.status === 'rejected' || !marketIndex) {
        criticalErrors.push('Market data indisponível - dados podem estar desatualizados');
      }
      if (balanceResponse.status === 'rejected' && !credentialError) {
        criticalErrors.push('Balance');
      }
      if (positionsResponse.status === 'rejected' && !credentialError) {
        criticalErrors.push('Positions');
      }
      if (menuResponse.status === 'rejected') {
        criticalErrors.push('Menu');
      }

      // Se houver erro de credenciais, não atualizar cache e mostrar erro específico
      if (credentialError) {
        console.log('❌ CENTRALIZED DATA - Credential error detected, not updating cache');
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: credentialError
        }));
        return;
      }

      // Se market data não estiver disponível, não atualizar cache e mostrar erro
      if (criticalErrors.length > 0 && (!marketIndex || marketResponse.status === 'rejected')) {
        console.log('❌ CENTRALIZED DATA - Market data indisponível, não atualizando cache');
        setData(prev => ({
          ...prev,
          isLoading: false,
          error: `Dados de mercado indisponíveis: ${criticalErrors.join(', ')}`
        }));
        return;
      }

      const newData = {
        userBalance,
        userPositions,
        marketIndex,
        menuData,
        isLoading: false,
        lastUpdate: Date.now(),
        error: criticalErrors.length > 0 ? `Erro ao carregar: ${criticalErrors.join(', ')}` : null
      };

      // Atualizar cache apenas se market data estiver disponível
      globalCache = {
        data: newData,
        timestamp: now,
        ttl: 30 * 1000
      };

      setData(newData);

      console.log('✅ CENTRALIZED DATA - All data updated successfully');
      console.log('📊 CENTRALIZED DATA - Summary:', {
        balance: userBalance ? '✅' : '❌',
        positions: userPositions.length,
        market: marketIndex.index > 0 ? '✅' : '❌',
        menu: menuData ? '✅' : '❌'
      });

    } catch (error) {
      console.error('❌ CENTRALIZED DATA - Error fetching data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erro ao carregar dados'
      }));
    }
  }, [isAuthenticated, user?.id]);

  // Carregar dados inicialmente e quando credenciais mudarem
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      // Clear cache when credentials change to force fresh validation
      globalCache = { data: null, timestamp: 0, ttl: 0 };
      refreshData();
    }
  }, [isAuthenticated, user?.id, user?.ln_markets_api_key, user?.ln_markets_api_secret, user?.ln_markets_passphrase]); // Removido refreshData das dependências

  return {
    ...data,
    refreshData,
    isConnected: !data.error && data.lastUpdate > 0
  };
};
