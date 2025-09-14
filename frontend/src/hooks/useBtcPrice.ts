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

      // Usar CoinGecko API (gratuita e confiável)
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true'
      );

      if (!response.ok) {
        throw new Error('Falha ao buscar preço do BTC');
      }

      const result = await response.json();
      const btcData = result.bitcoin;

      setData({
        price: btcData.usd,
        change24h: btcData.usd_24h_change || 0,
        changePercent24h: btcData.usd_24h_change || 0,
        lastUpdated: new Date().toLocaleString('pt-BR'),
      });
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
    
    // Atualizar preço a cada 30 segundos
    const interval = setInterval(() => {
      fetchBtcPrice();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchBtcPrice,
  };
};
