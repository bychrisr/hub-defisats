// frontend/src/pages/Positions/hooks/usePositionsData.ts

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeData } from '../../../contexts/RealtimeDataContext';
import { useActiveAccountData } from '../../../hooks/useActiveAccountData';
import { api } from '../../../lib/api';
import { PositionWithLiveData, PositionsData } from '../types/positions.types';

export const usePositionsData = (): PositionsData => {
  const { marketData } = useRealtimeData();
  const { accountInfo } = useActiveAccountData();

  // Polling inteligente 15s para posições (respeitando rate limits LN Markets)
  const { data: positions, isLoading, error } = useQuery({
    queryKey: ['positions', accountInfo?.accountId],
    queryFn: async () => {
      console.log('🔍 POSITIONS DATA - Fetching positions from LN Markets...');
      
      const response = await api.get('/api/lnmarkets-robust/dashboard');
      const dashboardData = response.data;
      
      console.log('✅ POSITIONS DATA - Received dashboard data:', {
        success: dashboardData.success,
        positionsCount: dashboardData.data?.lnMarkets?.positions?.length || 0,
        hasMarketData: !!dashboardData.data?.lnMarkets?.ticker,
        dataStructure: {
          hasData: !!dashboardData.data,
          hasLnMarkets: !!dashboardData.data?.lnMarkets,
          lnMarketsKeys: Object.keys(dashboardData.data?.lnMarkets || {}),
          positionsSample: dashboardData.data?.lnMarkets?.positions?.[0] || null
        }
      });

      const positions = dashboardData.data?.lnMarkets?.positions || [];
      console.log('🔍 POSITIONS DATA - Raw positions structure:', {
        count: positions.length,
        samplePosition: positions[0] || null,
        positionKeys: positions[0] ? Object.keys(positions[0]) : []
      });

      return positions;
    },
    refetchInterval: 15000, // 15s polling
    staleTime: 5000, // Cache 5s
    enabled: !!accountInfo?.accountId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Calcular PL em tempo real com market data do WebSocket
  const positionsWithLivePL = useMemo(() => {
    if (!positions) {
      return [];
    }

    // ✅ CORREÇÃO: Usar dados do BTC do marketData ou fallback para preço das posições
    const btcMarketData = marketData?.['BTC'];
    const currentPrice = btcMarketData?.price || (positions.length > 0 ? positions[0].price : 0);
    
    return positions.map((pos: any): PositionWithLiveData => {
      const pl = calculatePL(pos, currentPrice);
      const plPercentage = calculatePLPercentage(pos, currentPrice);
      const marginRatio = calculateMarginRatio(pos);
      const liquidationRisk = calculateLiquidationRisk(pos, currentPrice);

      return {
        id: pos.id || pos.uid,
        type: pos.side === 'b' ? 'LONG' : 'SHORT',
        quantity: pos.quantity || 0,
        entryPrice: pos.entryPrice || pos.price || 0,
        currentPrice,
        leverage: pos.leverage || 1,
        margin: pos.margin || 0,
        tradeMargin: pos.tradeMargin || 0,
        liquidationPrice: pos.liquidationPrice || 0,
        stopLoss: pos.stopLoss,
        takeProfit: pos.takeProfit,
        pl,
        plPercentage,
        marginRatio,
        tradingFees: pos.tradingFees || 0,
        fundingCost: pos.fundingCost || 0,
        createdAt: pos.createdAt || pos.timestamp,
        updatedAt: pos.updatedAt || pos.timestamp,
        status: pos.status || 'running',
        currentPL: pl,
        isLiquidated: liquidationRisk === 'high',
        liquidationRisk
      };
    });
  }, [positions, marketData?.ticker?.index]);

  // Calcular métricas agregadas
  const totalPL = useMemo(() => {
    return positionsWithLivePL.reduce((sum, pos) => sum + pos.currentPL, 0);
  }, [positionsWithLivePL]);

  const totalMargin = useMemo(() => {
    return positionsWithLivePL.reduce((sum, pos) => sum + pos.margin, 0);
  }, [positionsWithLivePL]);

  const activeCount = useMemo(() => {
    return positionsWithLivePL.filter(pos => pos.status === 'running').length;
  }, [positionsWithLivePL]);

  console.log('📊 POSITIONS DATA - Live data calculated:', {
    positionsCount: positionsWithLivePL.length,
    totalPL,
    totalMargin,
    activeCount,
    currentPrice,
    hasMarketData: !!btcMarketData,
    rawPositionsCount: positions?.length || 0
  });

  return {
    positions: positionsWithLivePL,
    totalPL,
    totalMargin,
    activeCount,
    isLoading,
    error: error?.message,
    lastUpdate: Date.now()
  };
};

// Funções auxiliares para cálculos
function calculatePL(position: any, currentPrice: number): number {
  if (!position.quantity || !position.entryPrice) return 0;
  
  const priceDiff = currentPrice - position.entryPrice;
  const multiplier = position.side === 'b' ? 1 : -1; // LONG = +1, SHORT = -1
  
  return (priceDiff * position.quantity * multiplier) / currentPrice;
}

function calculatePLPercentage(position: any, currentPrice: number): number {
  if (!position.entryPrice) return 0;
  
  const priceChange = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
  const multiplier = position.side === 'b' ? 1 : -1;
  
  return priceChange * multiplier;
}

function calculateMarginRatio(position: any): number {
  if (!position.margin || !position.quantity) return 0;
  
  return (position.margin / position.quantity) * 100;
}

function calculateLiquidationRisk(position: any, currentPrice: number): 'low' | 'medium' | 'high' {
  if (!position.liquidationPrice) return 'low';
  
  const distanceToLiquidation = Math.abs(currentPrice - position.liquidationPrice);
  const pricePercentage = (distanceToLiquidation / currentPrice) * 100;
  
  if (pricePercentage < 2) return 'high';
  if (pricePercentage < 5) return 'medium';
  return 'low';
}
