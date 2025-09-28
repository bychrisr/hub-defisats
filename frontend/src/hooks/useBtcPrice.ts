import { useState, useEffect } from 'react';

interface BtcPriceData {
  price: number;
  priceBRL: number;
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

      // Buscar preços USD e BRL do CoinGecko
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,brl');

      if (!response.ok) {
        throw new Error('Falha ao buscar preço do BTC');
      }

      const result = await response.json();
      
      if (result.bitcoin) {
        setData({
          price: result.bitcoin.usd,
          priceBRL: result.bitcoin.brl,
          lastUpdated: new Date().toLocaleString('pt-BR'),
        });
      }
    } catch (err) {
      console.error('Erro ao buscar preço do BTC:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Fallback com preços simulados em caso de erro
      setData({
        price: 65000, // Preço simulado USD
        priceBRL: 325000, // Preço simulado BRL (aproximadamente 5:1)
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
