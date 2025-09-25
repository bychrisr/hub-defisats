import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

interface OptimizedMarketData {
  index: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
  source: 'lnmarkets' | 'binance' | 'coingecko';
  isStale?: boolean;
}

interface UseOptimizedMarketDataReturn {
  data: OptimizedMarketData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: number | null;
  cacheAge: number;
  isStale: boolean;
}

/**
 * Hook otimizado para dados de mercado com segurança rigorosa
 * 
 * ⚠️ PRINCÍPIOS CRÍTICOS:
 * - Cache máximo de 30 segundos
 * - NUNCA usa dados antigos ou simulados
 * - Validação rigorosa de timestamps
 * - Erro transparente quando dados indisponíveis
 */
export const useOptimizedMarketData = (): UseOptimizedMarketDataReturn => {
  const { user } = useAuthStore();
  const [data, setData] = useState<OptimizedMarketData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  
  const cacheRef = useRef<{
    data: OptimizedMarketData | null;
    timestamp: number;
    ttl: number;
  }>({
    data: null,
    timestamp: 0,
    ttl: 30000 // 30 segundos - MÁXIMO PERMITIDO
  });

  const isAdmin = user?.is_admin || false;

  /**
   * Valida se dados são recentes (máximo 30 segundos)
   */
  const isDataRecent = useCallback((data: OptimizedMarketData): boolean => {
    const now = Date.now();
    const dataAge = now - data.timestamp;
    const maxAge = 30000; // 30 segundos

    if (dataAge > maxAge) {
      console.warn('⚠️ Market data too old - rejecting for safety', {
        dataAge,
        maxAge,
        timestamp: data.timestamp
      });
      return false;
    }

    return true;
  }, []);

  /**
   * Valida se dados são válidos
   */
  const isDataValid = useCallback((data: any): data is OptimizedMarketData => {
    if (!data || typeof data !== 'object') {
      console.warn('⚠️ Invalid market data - not an object', { data });
      return false;
    }

    if (typeof data.index !== 'number' || data.index <= 0) {
      console.warn('⚠️ Invalid market data - invalid index', { data });
      return false;
    }

    if (typeof data.timestamp !== 'number' || data.timestamp <= 0) {
      console.warn('⚠️ Invalid market data - invalid timestamp', { data });
      return false;
    }

    if (!data.source || !['lnmarkets', 'binance', 'coingecko'].includes(data.source)) {
      console.warn('⚠️ Invalid market data - unknown source', { data });
      return false;
    }

    return true;
  }, []);

  /**
   * Busca dados de mercado com cache inteligente
   */
  const fetchMarketData = useCallback(async (): Promise<void> => {
    // Pular para admins - eles não têm credenciais LN Markets
    if (isAdmin) {
      console.log('🔍 OPTIMIZED MARKET DATA - Admin user, skipping market queries...');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const now = Date.now();
      const cache = cacheRef.current;

      // Verificar se cache é válido (máximo 30 segundos)
      if (cache.data && (now - cache.timestamp) < cache.ttl) {
        console.log('✅ OPTIMIZED MARKET DATA - Using recent cached data', {
          cacheAge: now - cache.timestamp,
          maxAge: cache.ttl
        });
        
        setData(cache.data);
        setLastUpdated(cache.timestamp);
        setIsLoading(false);
        return;
      }

      console.log('🔄 OPTIMIZED MARKET DATA - Fetching fresh market data...');

      // Buscar dados frescos
      const response = await api.get('/api/market/index/optimized');
      const marketData = response.data;

      if (marketData.success && marketData.data) {
        const freshData = marketData.data;

        // Validar dados recebidos
        if (!isDataValid(freshData)) {
          throw new Error('Invalid market data received from server');
        }

        // Validar se dados são recentes
        if (!isDataRecent(freshData)) {
          throw new Error('Market data too old - rejecting for safety');
        }

        // Atualizar cache com dados frescos
        cacheRef.current = {
          data: freshData,
          timestamp: now,
          ttl: 30000 // 30 segundos
        };

        setData(freshData);
        setLastUpdated(now);

        console.log('✅ OPTIMIZED MARKET DATA - Fresh data cached', {
          source: freshData.source,
          index: freshData.index,
          timestamp: freshData.timestamp
        });

      } else {
        throw new Error('Invalid response format from server');
      }

    } catch (err: any) {
      console.error('❌ OPTIMIZED MARKET DATA - Error:', err);
      
      // ⚠️ CRÍTICO: NUNCA usar dados antigos em caso de erro
      setError(err.response?.data?.message || err.message || 'Failed to fetch market data');
      setData(null);
      setLastUpdated(null);
      
      // Limpar cache em caso de erro
      cacheRef.current = {
        data: null,
        timestamp: 0,
        ttl: 30000
      };

    } finally {
      setIsLoading(false);
    }
  }, [isAdmin, isDataValid, isDataRecent]);

  /**
   * Força atualização dos dados (ignora cache)
   */
  const refetch = useCallback(async (): Promise<void> => {
    console.log('🔄 OPTIMIZED MARKET DATA - Force refresh requested');
    
    // Limpar cache
    cacheRef.current = {
      data: null,
      timestamp: 0,
      ttl: 30000
    };

    await fetchMarketData();
  }, [fetchMarketData]);

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    fetchMarketData();

    const interval = setInterval(() => {
      fetchMarketData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [fetchMarketData]);

  // Calcular idade do cache e status de stale
  const cacheAge = cacheRef.current.data ? Date.now() - cacheRef.current.timestamp : 0;
  const isStale = cacheAge >= cacheRef.current.ttl;

  return {
    data,
    isLoading,
    error,
    refetch,
    lastUpdated,
    cacheAge,
    isStale
  };
};

/**
 * Hook para dados de mercado com fallback seguro
 * 
 * ⚠️ IMPORTANTE: Este hook NUNCA usa dados antigos como fallback
 * ⚠️ Se dados não estão disponíveis, retorna erro transparente
 */
export const useOptimizedMarketDataWithFallback = (): UseOptimizedMarketDataReturn => {
  const result = useOptimizedMarketData();

  // Se não há dados e não está carregando, mostrar erro educativo
  if (!result.data && !result.isLoading && !result.error) {
    return {
      ...result,
      error: 'Market data is currently unavailable. For your safety, we do not display outdated data in volatile markets as it could lead to incorrect trading decisions and financial losses.'
    };
  }

  return result;
};
