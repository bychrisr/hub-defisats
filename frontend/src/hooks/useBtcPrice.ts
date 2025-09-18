import { useState, useEffect } from 'react';

interface BtcPriceData {
  price: number;
  change24h: number;
  changePercent24h: number;
  lastUpdated: string;
}

interface UseBtcPriceReturn {
  data: BtcPriceData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useBtcPrice = (): UseBtcPriceReturn => {
  const [data, setData] = useState<BtcPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBtcPrice = async () => {
    try {
      setLoading(true);
      setError(null);

      // Usar endpoint do backend em vez de CoinGecko diretamente (evita CORS)
      const response = await fetch('/api/market/index/public');

      if (!response.ok) {
        throw new Error('Falha ao buscar preço do BTC');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setData({
          price: result.data.index,
          change24h: result.data.index24hChange || 0,
          changePercent24h: result.data.index24hChange || 0,
          lastUpdated: new Date().toLocaleString('pt-BR'),
        });
      }
    } catch (err) {
      console.error('Erro ao buscar preço do BTC:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Fallback com preço simulado em caso de erro
      setData({
        price: 50000, // Preço simulado
        change24h: 0,
        changePercent24h: 0,
        lastUpdated: new Date().toLocaleString('pt-BR'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBtcPrice();
    
    // Desabilitar polling automático para evitar esgotamento de recursos
    // const interval = setInterval(() => {
    //   fetchBtcPrice();
    // }, 10000);
    
    // return () => clearInterval(interval);
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchBtcPrice,
  };
};
