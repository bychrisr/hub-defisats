import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useRealtimeData } from '@/contexts/RealtimeDataContext';

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
  const { user } = useAuthStore();
  const { userPositions } = useRealtimeData();
  const [data, setData] = useState<HistoricalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isAdmin = user?.is_admin || false;

  const fetchHistoricalData = async () => {
    // Pular para admins - eles não têm credenciais LN Markets
    if (isAdmin) {
      console.log('🔍 HISTORICAL DATA HOOK - Admin user, skipping LN Markets queries...');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 HISTORICAL DATA HOOK - Fetching trades from API...');
      // Buscar trades históricos
      const tradesResponse = await api.get('/api/lnmarkets/user/trades?limit=100&type=closed');
      const tradesData = tradesResponse.data;
      
      console.log('🔍 HISTORICAL DATA HOOK - API Response:', {
        success: tradesData.success,
        dataLength: Array.isArray(tradesData.data) ? tradesData.data.length : 'not array',
        data: tradesData.data
      });

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

        console.log('🔍 HISTORICAL DATA HOOK - Calculated metrics:', {
          totalTrades: trades.length,
          closedTrades: closedTrades.length,
          winningPositions,
          losingPositions,
          successRate,
          totalProfit,
          totalFees
        });

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
        console.log('🔍 HISTORICAL DATA HOOK - No historical data available, using current positions as fallback');
        // Se não há dados históricos, usar dados das posições atuais como fallback
        const currentPositions = userPositions || [];
        const winningPositions = currentPositions.filter(pos => (pos.pnl || 0) > 0).length;
        const losingPositions = currentPositions.filter(pos => (pos.pnl || 0) < 0).length;
        const totalPositions = currentPositions.length;
        const successRate = totalPositions > 0 ? (winningPositions / totalPositions) * 100 : 0;
        const totalProfit = currentPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
        const totalFees = currentPositions.reduce((sum, pos) => sum + (pos.tradingFees || 0) + (pos.fundingCost || 0), 0);

        console.log('🔍 HISTORICAL DATA HOOK - Using current positions fallback:', {
          totalPositions,
          winningPositions,
          losingPositions,
          successRate,
          totalProfit,
          totalFees
        });

        setData({
          trades: [],
          totalProfit,
          totalFees,
          successRate,
          totalPositions,
          winningPositions,
          losingPositions,
        });
      }
    } catch (err: any) {
      console.error('Error fetching historical data:', err);
      setError(err.message || 'Failed to fetch historical data');
      
      // Em caso de erro, usar dados das posições atuais como fallback
      console.log('🔍 HISTORICAL DATA HOOK - Error occurred, using current positions as fallback');
      const currentPositions = userPositions || [];
      const winningPositions = currentPositions.filter(pos => (pos.pnl || 0) > 0).length;
      const losingPositions = currentPositions.filter(pos => (pos.pnl || 0) < 0).length;
      const totalPositions = currentPositions.length;
      const successRate = totalPositions > 0 ? (winningPositions / totalPositions) * 100 : 0;
      const totalProfit = currentPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
      const totalFees = currentPositions.reduce((sum, pos) => sum + (pos.tradingFees || 0) + (pos.fundingCost || 0), 0);

      setData({
        trades: [],
        totalProfit,
        totalFees,
        successRate,
        totalPositions,
        winningPositions,
        losingPositions,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  // Atualizar dados quando as posições atuais mudarem (para o fallback)
  useEffect(() => {
    if (data && userPositions) {
      console.log('🔍 HISTORICAL DATA HOOK - Updating fallback data with current positions');
      const currentPositions = userPositions || [];
      const winningPositions = currentPositions.filter(pos => (pos.pnl || 0) > 0).length;
      const losingPositions = currentPositions.filter(pos => (pos.pnl || 0) < 0).length;
      const totalPositions = currentPositions.length;
      const successRate = totalPositions > 0 ? (winningPositions / totalPositions) * 100 : 0;
      const totalProfit = currentPositions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
      const totalFees = currentPositions.reduce((sum, pos) => sum + (pos.tradingFees || 0) + (pos.fundingCost || 0), 0);

      setData(prev => ({
        ...prev,
        totalProfit,
        totalFees,
        successRate,
        totalPositions,
        winningPositions,
        losingPositions,
      }));
    }
  }, [userPositions]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchHistoricalData,
  };
};
