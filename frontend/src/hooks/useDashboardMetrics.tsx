import { useMemo } from 'react';
import { usePositionsMetrics } from '../contexts/PositionsContext';
import { useRealtimeData } from '../contexts/RealtimeDataContext';
import { useFormatSats, useFormatSatsText } from './useFormatSats';

export const useDashboardMetrics = () => {
  const { totalPL, totalMargin, estimatedProfit, estimatedBalance, positionCount, totalFees } = usePositionsMetrics();
  const { balance } = useRealtimeData();
  const { formatSats } = useFormatSats();
  const formatSatsText = useFormatSatsText();

  const metrics = useMemo(() => {
    // Calcular ROI baseado no PnL total
    const totalPnL = totalPL || 0;
    const totalPnLPercentage = totalMargin > 0 ? (totalPnL / totalMargin) * 100 : 0;

    return {
      totalPnL,
      totalPnLPercentage,
      estimatedProfit: estimatedProfit || 0,
      estimatedBalance: estimatedBalance || 0,
      openTrades: positionCount || 0, // Número de posições abertas
      totalMargin: totalMargin || 0,
      estimatedFees: totalFees || 0, // Taxas totais das posições
      balance: balance?.balance || 0,
      totalInvested: 0, // Será calculado pelo PositionsContext
      totalProfit: 0, // Será calculado pelo PositionsContext
      totalFeesPaid: 0, // Será calculado pelo PositionsContext
      successRate: 0, // Será calculado pelo PositionsContext
      roi: 0, // Será calculado pelo PositionsContext
      totalPositions: 0, // Será calculado pelo PositionsContext
      winningPositions: 0, // Será calculado pelo PositionsContext
      losingPositions: 0, // Será calculado pelo PositionsContext
    };
  }, [totalPL, totalMargin, estimatedProfit, estimatedBalance, positionCount, totalFees, balance]);

  return {
    ...metrics,
    formatSats,
    formatSatsText,
  };
};

// Re-exportar os hooks de formatação
export { useFormatSats, useFormatSatsText };
