import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { api } from '@/lib/api';
import { cachedApi } from '@/services/cached-api.service';
import { useAuthStore } from './auth';

interface CentralizedData {
  userBalance: any;
  userPositions: any[];
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
  menuData: any;
  isLoading: boolean;
  lastUpdate: number;
  error: string | null;
}

interface CentralizedDataState {
  data: CentralizedData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: (force?: boolean) => Promise<void>;
  clearData: () => void;
}

// Cache global para dados centralizados (2 minutos - balanceado entre performance e segurança)
let globalCache = {
  data: null as CentralizedData | null,
  timestamp: 0,
  ttl: 2 * 60 * 1000 // 2 minutos - balanceado entre performance e segurança
};

export const useCentralizedDataStore = create<CentralizedDataState>()(
  subscribeWithSelector((set, get) => ({
    data: null,
    isLoading: false,
    error: null,
    
    clearData: () => {
      set({ data: null, isLoading: false, error: null });
      globalCache = { data: null, timestamp: 0, ttl: 0 };
    },
    
    refreshData: async (force = false) => {
      const { user } = useAuthStore.getState();
      
      if (!user?.id) {
        set({ data: null, isLoading: false, error: null });
        return;
      }

      // Verificar se é admin
      const isAdmin = user?.is_admin || false;
      
      // Verificar cache apenas para evitar spam (2 minutos máximo)
      const now = Date.now();
      if (!force && globalCache.data && (now - globalCache.timestamp) < globalCache.ttl) {
        console.log('✅ CENTRALIZED DATA - Using recent cached data (2min)');
        set({ data: globalCache.data, isLoading: false, error: null });
        return;
      }
      
      // Don't set data to null if cache is empty, keep current state
      if (!globalCache.data) {
        console.log('🔄 CENTRALIZED DATA - No cached data, fetching fresh data...');
      }

      if (!force && get().isLoading) return; // Evitar chamadas duplicadas se já está carregando

      set({ isLoading: true, error: null });

      try {
        console.log('🔄 CENTRALIZED DATA - Fetching all data in single request...');

        // Fazer todas as chamadas em paralelo usando cached API para market data
        const [balanceResponse, positionsResponse, marketResponse, menuResponse] = await Promise.allSettled([
          api.get('/api/lnmarkets-robust/dashboard'),
          api.get('/api/lnmarkets-robust/dashboard'),
          cachedApi.get('/api/market/index/public'), // Usar cached API para market data
          isAdmin ? api.get('/api/admin/menu') : Promise.resolve({ data: { success: true, data: null } })
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
        
        // Debug balance response
        console.log('🔍 BALANCE RESPONSE DEBUG:', {
          status: balanceResponse.status,
          data: balanceResponse.status === 'fulfilled' ? balanceResponse.value.data : null,
          error: balanceResponse.status === 'rejected' ? balanceResponse.reason : null
        });
        
        // Debug positions response
        console.log('🔍 POSITIONS RESPONSE DEBUG:', {
          status: positionsResponse.status,
          data: positionsResponse.status === 'fulfilled' ? positionsResponse.value.data : null,
          error: positionsResponse.status === 'rejected' ? positionsResponse.reason : null
        });
        
        if (balanceResponse.status === 'rejected') {
          const errorData = balanceResponse.reason?.response?.data;
          const status = balanceResponse.reason?.response?.status;
          console.log('🔍 BALANCE ERROR DEBUG:', { errorData, status });
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
          console.log('🔍 POSITIONS ERROR DEBUG:', { errorData, status });
          if (errorData?.message?.includes('credentials') || 
              errorData?.message?.includes('authentication') ||
              errorData?.message?.includes('unauthorized') ||
              status === 401) {
            credentialError = 'Invalid LN Markets credentials';
          }
        }

        // Define hasCredentials here for use in this scope
        const hasCredentials = !!(user?.ln_markets_api_key && user?.ln_markets_api_secret && user?.ln_markets_passphrase);
        // Also check if we got empty/null data when we should have data
        // This indicates invalid credentials even if API doesn't return 401
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
              source: 'lnmarkets'
            }
          : {
              index: 0,
              index24hChange: 0,
              tradingFees: 0,
              nextFunding: '--',
              rate: 0,
              rateChange: 0,
              timestamp: 0,
              source: 'lnmarkets'
            };

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
          set({
            data: null,
            isLoading: false,
            error: credentialError
          });
          return;
        }

        // Se market data não estiver disponível, não atualizar cache
        if (marketResponse.status === 'rejected' || !marketIndex || marketIndex.index === 0) {
          console.log('❌ CENTRALIZED DATA - Market data not available, not updating cache');
          set(prev => ({
            data: prev.data ? {
              ...prev.data,
              isLoading: false,
              error: `Dados de mercado indisponíveis: ${criticalErrors.join(', ')}`
            } : null
          }));
          return;
        }

        // Validação adicional de segurança para dados de mercado CRÍTICOS
        const isCriticalMarketData = marketResponse.status === 'fulfilled' && 
          marketResponse.value.config?.url?.includes('/api/market/index/public');
        
        if (isCriticalMarketData && marketIndex) {
          const marketDataAge = Date.now() - marketIndex.timestamp;
          if (marketDataAge > 15000) { // 15 segundos máximo para dados críticos
            console.log('❌ CENTRALIZED DATA - Critical market data too old, not updating cache');
            set(prev => ({
              data: prev.data ? {
                ...prev.data,
                isLoading: false,
                error: 'Dados de mercado muito antigos - por segurança, não exibimos dados desatualizados'
              } : null
            }));
            return;
          }
        }

        const newData: CentralizedData = {
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

        set({ data: newData, isLoading: false, error: null });

        console.log('✅ CENTRALIZED DATA - All data updated successfully');
        console.log('📊 CENTRALIZED DATA - Summary:', {
          balance: userBalance ? '✅' : '❌',
          positions: userPositions.length,
          market: marketIndex.index > 0 ? '✅' : '❌',
          menu: menuData ? '✅' : '❌'
        });

      } catch (error) {
        console.error('❌ CENTRALIZED DATA - Error fetching data:', error);
        set({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados'
        });
      }
    }
  }))
);

