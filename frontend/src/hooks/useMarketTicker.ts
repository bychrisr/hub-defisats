import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

interface MarketTickerData {
  index: number;
  lastPrice: number;
  askPrice: number;
  bidPrice: number;
  carryFeeRate: number;
  timestamp: number;
}

export const useMarketTicker = () => {
  const { user } = useAuthStore();
  const [data, setData] = useState<MarketTickerData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isAdmin = user?.is_admin || false;

  const fetchMarketTicker = async () => {
    // Pular para admins - eles não têm credenciais LN Markets
    if (isAdmin) {
      console.log('🔍 MARKET TICKER HOOK - Admin user, skipping LN Markets queries...');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 MARKET TICKER HOOK - Fetching market ticker...');

      const response = await api.get('/api/lnmarkets-robust/dashboard');
      const tickerData = response.data;

      if (tickerData.success && tickerData.data) {
        console.log('✅ MARKET TICKER HOOK - Data received:', tickerData.data);
        setData(tickerData.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('❌ MARKET TICKER HOOK - Error:', err);
      setError(err.message || 'Failed to fetch market ticker');
      
      // NUNCA usar dados padrão em mercado volátil
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketTicker();

    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      fetchMarketTicker();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchMarketTicker,
  };
};
