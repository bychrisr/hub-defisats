// frontend/src/pages/Positions/hooks/usePositionsData.ts

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRealtimeData } from '../../../contexts/RealtimeDataContext';
import { useActiveAccountData } from '../../../hooks/useActiveAccountData';
import { api } from '../../../lib/api';
import { PositionWithLiveData, PositionsData } from '../types/positions.types';

export const usePositionsData = (): PositionsData => {
  console.log('🔍 USE POSITIONS DATA - Hook called');
  
  const { marketData } = useRealtimeData();
  const { accountInfo } = useActiveAccountData();
  
  console.log('🔍 USE POSITIONS DATA - Context data:', {
    hasMarketData: !!marketData,
    marketDataKeys: marketData ? Object.keys(marketData) : [],
    accountInfo: accountInfo?.accountId
  });

  // Polling inteligente 15s para posições (respeitando rate limits LN Markets)
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['positions', accountInfo?.accountId],
    queryFn: async () => {
      console.log('🔍 POSITIONS DATA - Fetching positions from LN Markets...');
      
      const response = await api.get('/api/lnmarkets-robust/dashboard');
      const dashboardData = response.data;
      
      console.log('✅ POSITIONS DATA - Received dashboard data:', {
        success: dashboardData.success,
        positionsCount: dashboardData.data?.lnMarkets?.positions?.length || 0,
        hasMarketData: !!dashboardData.data?.lnMarkets?.ticker,
        hasBalance: !!dashboardData.data?.lnMarkets?.balance,
        balance: dashboardData.data?.lnMarkets?.balance,
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

      return dashboardData;
    },
    refetchInterval: 15000, // 15s polling
    staleTime: 5000, // Cache 5s
    enabled: !!accountInfo?.accountId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // ✅ CORREÇÃO: Calcular currentPrice fora do useMemo para usar no log
  const btcMarketData = marketData?.['BTC'];
  const positions = dashboardData?.data?.lnMarkets?.positions || [];
  const balanceData = dashboardData?.data?.lnMarkets?.balance;
  
  // ✅ SOLUÇÃO SIMPLES: Usar o balance real da API (pode ser 0 se usado como margem)
  const totalBalance = balanceData?.balance || 0;
  
  console.log('🔍 BALANCE SIMPLE:', {
    balance: totalBalance,
    note: totalBalance === 0 ? 'Balance is 0 (used as margin)' : 'Using actual balance'
  });
  
  const currentPrice = btcMarketData?.price || (positions && positions.length > 0 ? positions[0].price : 0);

  // Calcular PL em tempo real com market data do WebSocket
  const positionsWithLivePL = useMemo(() => {
    if (!positions || positions.length === 0) {
      console.log('🔍 POSITIONS DEBUG - No positions available:', { positions });
      return [];
    }
    
    console.log('🔍 POSITIONS DEBUG - Processing positions:', {
      count: positions.length,
      samplePosition: positions[0],
      sampleKeys: positions[0] ? Object.keys(positions[0]) : []
    });
    
    // ✅ DADOS BRUTOS IDENTIFICADOS - LN Markets NÃO retorna marginRatio
    // Campos disponíveis: liquidation, opening_fee, sum_carry_fees, creation_ts
    // Margin Ratio precisa ser calculado manualmente
    
    return positions.map((pos: any): PositionWithLiveData => {
      const pl = calculatePL(pos, currentPrice);
      const plPercentage = calculatePLPercentage(pos, currentPrice);
      const marginRatio = calculateMarginRatio(pos, totalBalance);
      const liquidationRisk = calculateLiquidationRisk(pos, currentPrice);

      console.log('🔍 POSITION PL DEBUG:', {
        positionId: pos.id || pos.uid,
        originalPL: pos.pl,
        calculatedPL: pl,
        plPercentage: plPercentage,
        currentPrice,
        entryPrice: pos.entryPrice || pos.price,
        quantity: pos.quantity,
        side: pos.side,
        priceChange: currentPrice - (pos.entryPrice || pos.price),
        priceChangePercent: ((currentPrice - (pos.entryPrice || pos.price)) / (pos.entryPrice || pos.price)) * 100
      });

      // ✅ Dados confirmados da LN Markets API (26 campos)

          // ✅ Field mapping based on actual LN Markets API response (26 fields confirmed)

          return {
            id: pos.id || pos.uid,
            type: pos.side === 'b' ? 'LONG' : 'SHORT',
            quantity: pos.quantity || 0,
            entryPrice: pos.entryPrice || pos.price || 0,
            currentPrice,
            leverage: pos.leverage || 1,
            margin: pos.margin || 0,
            tradeMargin: pos.entry_margin || pos.tradeMargin || 0,
            liquidationPrice: pos.liquidation || 0, // ✅ CONFIRMADO: liquidation
            stopLoss: pos.stoploss || 0, // ✅ CONFIRMADO: stoploss
            takeProfit: pos.takeprofit || 0, // ✅ CONFIRMADO: takeprofit
            pl,
            plPercentage,
            marginRatio,
            tradingFees: pos.opening_fee || pos.closing_fee || 0, // ✅ CONFIRMADO: opening_fee
            fundingCost: pos.sum_carry_fees || 0, // ✅ CONFIRMADO: sum_carry_fees
            createdAt: pos.creation_ts || pos.market_filled_ts, // ✅ CONFIRMADO: creation_ts
            updatedAt: pos.updatedAt || pos.timestamp,
            status: pos.running ? 'running' : (pos.closed ? 'closed' : 'open'),
            currentPL: pl,
            isLiquidated: liquidationRisk === 'high',
            liquidationRisk
          };
    });
  }, [positions, totalBalance, marketData?.['BTC']?.price, currentPrice]);

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
  // Se a posição já tem um PL calculado (vem da API), usar esse valor
  if (position.pl !== undefined && position.pl !== null) {
    return position.pl;
  }
  
  // Caso contrário, calcular baseado nos preços
  if (!position.quantity || !position.entryPrice) return 0;
  
  const priceDiff = currentPrice - position.entryPrice;
  const multiplier = position.side === 'b' ? 1 : -1; // LONG = +1, SHORT = -1
  
  return (priceDiff * position.quantity * multiplier) / currentPrice;
}

function calculatePLPercentage(position: any, currentPrice: number): number {
  // ✅ CORREÇÃO: LN Markets calcula PL% como PL / Margin * 100
  if (position.pl && position.margin && position.margin !== 0) {
    const plPercentage = (position.pl / position.margin) * 100;
    
    console.log('🔍 PL PERCENTAGE CORRECTED:', {
      positionId: position.id || position.uid,
      pl: position.pl,
      margin: position.margin,
      plPercentage: plPercentage,
      formula: 'pl / margin * 100'
    });
    
    return plPercentage;
  }
  
  // Fallback para cálculo baseado em preço (se não tiver PL direto da API)
  const entryPrice = position.entryPrice || position.price;
  if (!entryPrice || !currentPrice) return 0;
  
  const priceChange = ((currentPrice - entryPrice) / entryPrice) * 100;
  const multiplier = position.side === 'b' ? 1 : -1; // LONG = +1, SHORT = -1
  
  return priceChange * multiplier;
}

function calculateMarginRatio(position: any, totalBalance?: number): number {
  // ✅ CONFIRMADO: LN Markets NÃO retorna marginRatio na API
  // Precisamos calcular manualmente usando a fórmula: Margin / (Quantity * Price) * 100
  
  if (!position.margin || !position.quantity || !position.price) {
    return 0;
  }
  
  const marginRatio = (position.margin / (position.quantity * position.price)) * 100;
  
  console.log('🔍 MARGIN RATIO CALCULATED:', {
    positionId: position.id || position.uid,
    margin: position.margin,
    quantity: position.quantity,
    price: position.price,
    marginRatio: marginRatio,
    formula: 'margin / (quantity * price) * 100'
  });
  
  return marginRatio;
}

function calculateLiquidationRisk(position: any, currentPrice: number): 'low' | 'medium' | 'high' {
  if (!position.liquidationPrice) return 'low';
  
  const distanceToLiquidation = Math.abs(currentPrice - position.liquidationPrice);
  const pricePercentage = (distanceToLiquidation / currentPrice) * 100;
  
  if (pricePercentage < 2) return 'high';
  if (pricePercentage < 5) return 'medium';
  return 'low';
}
