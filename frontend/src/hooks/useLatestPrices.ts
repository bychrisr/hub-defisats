import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface PriceData {
  usd: number;
  usd_24h_change: number;
  last_updated_at: number;
}

interface LatestPricesResponse {
  success: boolean;
  data: Record<string, PriceData>;
}

interface UseLatestPricesOptions {
  symbols?: string;
  refreshInterval?: number; // in milliseconds
  enabled?: boolean;
}

interface UseLatestPricesReturn {
  prices: Record<string, PriceData>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated: number | null;
}

export function useLatestPrices(options: UseLatestPricesOptions = {}): UseLatestPricesReturn {
  const {
    symbols = 'BTC',
    refreshInterval = 30000, // 30 seconds
    enabled = true,
  } = options;

  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchPrices = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const response = await axios.get<LatestPricesResponse>(
        `/api/market/prices/latest?symbols=${symbols}`
      );

      if (response.data.success) {
        setPrices(response.data.data);
        setLastUpdated(Date.now());
      } else {
        throw new Error('Failed to fetch prices');
      }
    } catch (err: any) {
      console.error('Error fetching latest prices:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch prices');

      // ⚠️ CRÍTICO: NUNCA usar dados simulados em mercados voláteis
      // Dados antigos podem causar perdas financeiras reais
      setPrices({});
      setLastUpdated(null);
    } finally {
      setLoading(false);
    }
  }, [symbols, enabled]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;

    fetchPrices(); // Initial fetch

    const interval = setInterval(fetchPrices, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchPrices, refreshInterval, enabled]);

  // Manual refetch
  const refetch = useCallback(async () => {
    await fetchPrices();
  }, [fetchPrices]);

  return {
    prices,
    loading,
    error,
    refetch,
    lastUpdated,
  };
}

// Helper hook for Bitcoin price specifically
export function useBitcoinPrice(options: Omit<UseLatestPricesOptions, 'symbols'> = {}): UseLatestPricesReturn & {
  bitcoinPrice: number;
  bitcoinChange24h: number;
} {
  const { prices, ...rest } = useLatestPrices({ ...options, symbols: 'BTC' });

  const bitcoinData = prices.bitcoin || prices.bitcoin;
  const bitcoinPrice = bitcoinData?.usd || 0;
  const bitcoinChange24h = bitcoinData?.usd_24h_change || 0;

  return {
    ...rest,
    prices,
    bitcoinPrice,
    bitcoinChange24h,
  };
}

// Helper hook for multiple cryptocurrencies
export function useCryptoPrices(symbols: string[], options: Omit<UseLatestPricesOptions, 'symbols'> = {}) {
  return useLatestPrices({ ...options, symbols: symbols.join(',') });
}
