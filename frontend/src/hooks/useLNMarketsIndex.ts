import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface LNMarketsIndexData {
  index: number;
  index24hChange: number;
  tradingFees: number;
  nextFunding: string;
  rate: number;
  rateChange: number;
  timestamp: number;
}

interface UseLNMarketsIndexReturn {
  data: LNMarketsIndexData | null;
  error: string | null;
  refetch: () => void;
}

export const useLNMarketsIndex = (): UseLNMarketsIndexReturn => {
  const [data, setData] = useState<LNMarketsIndexData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchIndexData = async () => {
    try {
      setError(null);

      console.log('🔍 LN MARKETS INDEX - Fetching real index data from LN Markets API...');
      
      const response = await api.get('/api/market/index');
      
      if (response.data.success && response.data.data) {
        setData(response.data.data);
        console.log('✅ LN MARKETS INDEX - Real index data received:', response.data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('❌ LN MARKETS INDEX - Error fetching index data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch LN Markets index data');
      
      // Fallback com dados simulados em caso de erro
      setData({
        index: 115000,
        index24hChange: 0,
        tradingFees: 0.1,
        nextFunding: '2h 15m 30s',
        rate: 0.00002,
        rateChange: 0.00001,
        timestamp: Date.now()
      });
    }
  };

  useEffect(() => {
    fetchIndexData();
  }, []);

  return {
    data,
    error,
    refetch: fetchIndexData,
  };
};
