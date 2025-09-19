import { useState, useEffect } from 'react';

interface CandlestickDataPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface BTCData {
  data: CandlestickDataPoint[];
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: number;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
}

export const useBTCData = () => {
  const [btcData, setBtcData] = useState<BTCData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para gerar dados de exemplo realistas
  const generateRealisticData = (): CandlestickDataPoint[] => {
    const data: CandlestickDataPoint[] = [];
    const now = new Date();
    const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 dias atrás
    
    // Preço inicial baseado no BTC atual
    let currentPrice = 117000;
    
    for (let i = 0; i < 168; i++) { // 168 horas = 7 dias
      const time = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      
      // Simular movimento de preço mais realista
      const volatility = 0.02; // 2% de volatilidade por hora
      const trend = Math.sin(i / 24) * 0.01; // Tendência cíclica diária
      const randomChange = (Math.random() - 0.5) * volatility;
      
      const change = currentPrice * (trend + randomChange);
      const open = currentPrice;
      const close = currentPrice + change;
      
      // High e Low baseados no movimento
      const range = Math.abs(change) * (1.5 + Math.random());
      const high = Math.max(open, close) + range * Math.random();
      const low = Math.min(open, close) - range * Math.random();
      
      data.push({
        time: Math.floor(time.getTime() / 1000),
        open: Math.round(open * 100) / 100,
        high: Math.round(high * 100) / 100,
        low: Math.round(low * 100) / 100,
        close: Math.round(close * 100) / 100,
      });
      
      currentPrice = close;
    }
    
    return data;
  };

  const fetchBTCData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: Implementar chamada real para API da LN Markets ou CoinGecko
      // const response = await fetch('/api/btc-candles?timeframe=1h');
      // const realData = await response.json();
      
      // Por enquanto, usar dados simulados mais realistas
      const candleData = generateRealisticData();
      const latestCandle = candleData[candleData.length - 1];
      const previousCandle = candleData[candleData.length - 2];
      
      const priceChange = latestCandle.close - previousCandle.close;
      const priceChangePercent = (priceChange / previousCandle.close) * 100;
      
      // Simular volume baseado na volatilidade
      const volume = Math.random() * 10 + 5; // 5-15M
      
      setBtcData({
        data: candleData,
        currentPrice: latestCandle.close,
        priceChange,
        priceChangePercent,
        volume: Math.round(volume * 100) / 100,
        ohlc: {
          open: latestCandle.open,
          high: latestCandle.high,
          low: latestCandle.low,
          close: latestCandle.close,
        }
      });
      
      setIsLoading(false);
    } catch (err) {
      setError('Erro ao carregar dados do BTC');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBTCData();
    
    // Atualizar dados a cada 5 minutos
    const interval = setInterval(fetchBTCData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    btcData,
    isLoading,
    error,
    refetch: fetchBTCData,
  };
};
