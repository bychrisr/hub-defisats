import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface HistoricalTrade {
  id: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  pnl: number;
  fees: number;
  status: 'open' | 'closed';
  createdAt: string;
  closedAt?: string;
}

export interface HistoricalData {
  trades: HistoricalTrade[];
  totalProfit: number;
  totalFees: number;
  successRate: number;
  totalPositions: number;
  winningPositions: number;
  losingPositions: number;
}

export const useHistoricalData = () => {
  const [data, setData] = useState<HistoricalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoricalData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Buscar trades históricos
      const tradesResponse = await api.get('/api/lnmarkets/user/trades?limit=100&type=closed');
      const tradesData = tradesResponse.data;

      if (tradesData.success && Array.isArray(tradesData.data)) {
        const trades: HistoricalTrade[] = tradesData.data.map((trade: any) => ({
          id: trade.id,
          side: trade.side === 'b' ? 'long' : 'short',
          quantity: trade.quantity || 0,
          entryPrice: trade.entry_price || trade.price || 0,
          exitPrice: trade.price || undefined,
          pnl: trade.pnl || trade.pl || 0,
          fees: (trade.opening_fee || 0) + (trade.closing_fee || 0) + (trade.sum_carry_fees || 0),
          status: trade.status === 'closed' || trade.closed ? 'closed' : 'open',
          createdAt: trade.creation_ts || new Date().toISOString(),
          closedAt: trade.closed_ts || undefined,
        }));

        // Calcular métricas históricas
        const closedTrades = trades.filter(trade => trade.status === 'closed');
        const totalProfit = closedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
        const totalFees = trades.reduce((sum, trade) => sum + trade.fees, 0);
        const winningPositions = closedTrades.filter(trade => trade.pnl > 0).length;
        const losingPositions = closedTrades.filter(trade => trade.pnl < 0).length;
        const successRate = closedTrades.length > 0 ? (winningPositions / closedTrades.length) * 100 : 0;

        setData({
          trades,
          totalProfit,
          totalFees,
          successRate,
          totalPositions: trades.length,
          winningPositions,
          losingPositions,
        });
      } else {
        // Se não há dados históricos, usar dados simulados baseados nas posições atuais
        setData({
          trades: [],
          totalProfit: 0,
          totalFees: 0,
          successRate: 0,
          totalPositions: 0,
          winningPositions: 0,
          losingPositions: 0,
        });
      }
    } catch (err: any) {
      console.error('Error fetching historical data:', err);
      setError(err.message || 'Failed to fetch historical data');
      
      // Em caso de erro, usar dados vazios
      setData({
        trades: [],
        totalProfit: 0,
        totalFees: 0,
        successRate: 0,
        totalPositions: 0,
        winningPositions: 0,
        losingPositions: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  return {
    data,
    isLoading,
    error,
    refetch: fetchHistoricalData,
  };
};
