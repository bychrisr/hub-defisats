import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useUserPositions, useRealtimeData } from './RealtimeDataContext';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Tipos para as posições (baseado na página Positions.tsx)
export interface LNPosition {
  id: string;
  quantity: number;
  price: number;
  entryPrice: number;
  currentPrice: number;
  liquidation: number;
  leverage: number;
  margin: number;
  pnl: number;
  pnlPercentage: number;
  marginRatio: number;
  tradingFees: number;
  fundingCost: number;
  status: 'open' | 'closed';
  side: 'long' | 'short';
  symbol: string;
  asset: string;
  createdAt: string;
  updatedAt: string;
  takeProfit?: number;
  stopLoss?: number;
  timestamp?: number; // Timestamp da criação da posição para cálculo de funding fees
}

// Interface simplificada para dados em tempo real
export interface RealtimePosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  quantity: number;
  price: number;
  margin: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
  timestamp: number;
}

// Interface para dados do índice de mercado
export interface MarketIndexData {
  index: number;
  index24hChange: number;
  tradingFees: number;
  nextFunding: string;
  rate: number;
  rateChange: number;
  timestamp: number;
  source?: string; // Data source: 'lnmarkets' or 'coingecko'
}

export interface PositionsData {
  positions: LNPosition[];
  totalPL: number;
  totalMargin: number;
  totalQuantity: number;
  totalValue: number;
  estimatedProfit: number;
  estimatedBalance: number;
  lastUpdate: number;
  isLoading: boolean;
  error: string | null;
  // Dados do índice de mercado integrados
  marketIndex: MarketIndexData | null;
  marketIndexError: string | null;
  // Taxas totais
  totalFees: number;
  totalTradingFees: number;
  totalFundingCost: number;
}

interface PositionsContextType {
  data: PositionsData;
  refreshPositions: () => void;
  fetchRealPositions: () => Promise<void>;
  getPositionById: (id: string) => LNPosition | undefined;
  getPositionsBySymbol: (symbol: string) => LNPosition[];
  getPositionsBySide: (side: 'long' | 'short') => LNPosition[];
  convertRealtimeToLNPosition: (pos: RealtimePosition) => LNPosition;
}

const PositionsContext = createContext<PositionsContextType | undefined>(undefined);

interface PositionsProviderProps {
  children: ReactNode;
}

export const PositionsProvider = ({ children }: PositionsProviderProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const userPositions = useUserPositions();
  const { updatePositions, data: realtimeData } = useRealtimeData();
  const queryClient = useQueryClient();
  
  console.log('📊 POSITIONS - Provider render:', { userPositions, length: userPositions?.length });
  
  const [data, setData] = useState<PositionsData>({
    positions: [],
    totalPL: 0,
    totalMargin: 0,
    totalQuantity: 0,
    totalValue: 0,
    estimatedProfit: 0,
    estimatedBalance: 0,
    lastUpdate: 0,
    isLoading: false,
    error: null,
    marketIndex: null,
    marketIndexError: null,
    totalFees: 0,
    totalTradingFees: 0,
    totalFundingCost: 0,
  });

  // Função para converter posição em tempo real para LNPosition
  const convertRealtimeToLNPosition = (pos: RealtimePosition): LNPosition => {
    return {
      id: pos.id,
      quantity: pos.quantity,
      price: pos.price,
      // NOTA: Para posições em tempo real, precisamos do entry_price real da API
      // Por enquanto usando o preço atual, mas isso pode afetar o cálculo do profit estimado
      entryPrice: (pos as any).entryPrice || pos.price, // Tentar pegar entryPrice se disponível
      currentPrice: pos.price,
      liquidation: pos.price * 0.1, // Calcular liquidação baseada no preço
      leverage: pos.leverage,
      margin: pos.margin,
      pnl: pos.pnl,
      pnlPercentage: pos.pnlPercent,
      marginRatio: pos.leverage > 0 ? (100 / pos.leverage) : 0,
      tradingFees: 0, // Valor padrão
      fundingCost: 0, // Valor padrão
      status: 'open' as const,
      side: pos.side,
      symbol: pos.symbol,
      asset: pos.symbol,
      createdAt: new Date(pos.timestamp).toISOString(),
      updatedAt: new Date(pos.timestamp).toISOString(),
      timestamp: pos.timestamp
    };
  };

  // Função para calcular métricas das posições
  const calculateMetrics = (positions: LNPosition[], marketIndex?: any, userBalance?: any) => {
    const totalPL = positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
    const totalMargin = positions.reduce((sum, pos) => sum + (pos.margin || 0), 0);
    const totalQuantity = positions.reduce((sum, pos) => sum + (pos.quantity || 0), 0);
    const totalValue = totalMargin; // Total Value é igual ao Total Margin
    
    // Calcular taxas totais (trading fees + funding costs)
    const totalTradingFees = positions.reduce((sum, pos) => sum + (pos.tradingFees || 0), 0);
    const totalFundingCost = positions.reduce((sum, pos) => sum + (pos.fundingCost || 0), 0);
    const totalFees = totalTradingFees + totalFundingCost;
    
    console.log('💰 TAXAS CALCULADAS:', {
      totalTradingFees,
      totalFundingCost,
      totalFees,
      positionsCount: positions.length,
      samplePosition: positions[0] ? {
        id: positions[0].id,
        tradingFees: positions[0].tradingFees,
        fundingCost: positions[0].fundingCost
      } : null
    });
    
    // Calcular profit estimado baseado no take profit
    console.log('🔍 ALL POSITIONS DATA:', positions.map(pos => ({
      id: pos.id,
      status: pos.status,
      side: pos.side,
      entryPrice: pos.entryPrice,
      takeProfit: pos.takeProfit,
      margin: pos.margin,
      leverage: pos.leverage,
      pnl: pos.pnl
    })));
    
    const estimatedProfit = positions.reduce((sum, pos) => {
      if (pos.takeProfit && pos.takeProfit > 0 && pos.status === 'open') {
        // Fórmula correta da LN Markets para contratos futuros
        // P&L = Quantity × Leverage × (Price_Change) / Entry Price
        // Resultado já em satoshis (conforme especificação da LN Markets)
        
        const isLong = pos.side === 'long';
        
        // Calcular mudança de preço baseada na direção da posição
        const priceChange = isLong 
          ? (pos.takeProfit - pos.entryPrice) 
          : (pos.entryPrice - pos.takeProfit);
        
        // Fórmula correta da LN Markets para contratos futuros
        // Na LN Markets: Margem já está em sats, P&L é calculado diretamente em sats
        // P&L = Margem × Leverage × (Price_Change / Entry_Price)
        const grossPnLSats = pos.margin * pos.leverage * (priceChange / pos.entryPrice);
        
        // Calcular taxas conforme documentação da LN Markets
        // Taxa de abertura e fechamento: 0.1% cada
        const entryFeeSats = (pos.margin * 0.001); // 0.1% da margem em sats
        const exitFeeSats = (pos.margin * 0.001); // 0.1% da margem em sats
        
        // Calcular funding fees baseado nos dias desde abertura
        const positionOpenDate = new Date(pos.timestamp || pos.createdAt || Date.now());
        const currentDate = new Date();
        const isValidDate = !isNaN(positionOpenDate.getTime());
        const daysPassed = isValidDate 
          ? Math.max(1, Math.ceil((currentDate.getTime() - positionOpenDate.getTime()) / (1000 * 60 * 60 * 24)))
          : 1;
        
        // Taxa de funding: aproximadamente 0.03% ao dia
        const dailyFundingRate = 0.0003;
        const fundingFeesSats = (pos.margin * dailyFundingRate * daysPassed);
        
        // Total de taxas em satoshis
        const totalFeesSats = entryFeeSats + exitFeeSats + fundingFeesSats;
        
        // P&L sem descontar taxas (LN Markets já calcula internamente)
        // Apenas arredondar para remover casas decimais
        const netPnLSats = Math.round(grossPnLSats);
        
        console.log('🔍 ESTIMATED PROFIT CALCULATION (CORRECTED LN MARKETS FORMULA):', {
          positionId: pos.id,
          side: pos.side,
          isLong: isLong,
          entryPrice: pos.entryPrice,
          takeProfit: pos.takeProfit,
          currentPrice: pos.price,
          margin: pos.margin,
          leverage: pos.leverage,
          quantity: pos.quantity,
          daysPassed: daysPassed,
          
          // Fórmula step-by-step FINAL (LN Markets nativa em sats)
          step1_priceChange: priceChange,
          step2_priceChangePercent: (priceChange / pos.entryPrice),
          step3_marginInSats: pos.margin,
          step4_leverageMultiplier: pos.leverage,
          step5_formula: pos.margin + ' × ' + pos.leverage + ' × (' + priceChange + ' / ' + pos.entryPrice + ')',
          step6_grossPnLSats: grossPnLSats,
          
          // Comparação com valor esperado da LN Markets  
          expectedLNMarketsValue: 2758, // Baseado na imagem mostrada
          calculatedVsExpected: Math.abs(grossPnLSats - 2758),
          isCloseToExpected: Math.abs(grossPnLSats - 2758) < 500,
          
          // Taxas detalhadas
          fees: {
            entryFeeSats: entryFeeSats,
            exitFeeSats: exitFeeSats,
            fundingFeesSats: fundingFeesSats,
            totalFeesSats: totalFeesSats
          },
          
          // Resultado final
          netPnLSats: netPnLSats,
          netPnLSatsRounded: Math.round(netPnLSats),
          
          // Para debug - comparação com valor esperado
          expectedValue: 8135, // Valor mencionado pelo usuário
          difference: Math.abs(netPnLSats - 8135),
          currentSum: sum,
          newSum: sum + netPnLSats
        });
        
        return sum + netPnLSats;
      }
      return sum;
    }, 0);
    
    // Arredondar o total final para remover casas decimais
    const finalEstimatedProfit = Math.round(estimatedProfit);
    
    console.log('💰 TOTAL ESTIMATED PROFIT:', finalEstimatedProfit);

    // Calcular saldo estimado (saldo da wallet + P&L atual + profit estimado)
    const walletBalance = userBalance?.total_balance || 0;
    const estimatedBalance = walletBalance + totalPL + finalEstimatedProfit;
    
    console.log('💰 SALDO ESTIMADO CALCULADO:', {
      walletBalance,
      totalPL,
      finalEstimatedProfit,
      estimatedBalance,
      userBalance: userBalance
    });
    
    return {
      totalPL,
      totalMargin,
      totalQuantity,
      totalValue,
      estimatedProfit: finalEstimatedProfit,
      estimatedBalance,
      totalFees,
      totalTradingFees,
      totalFundingCost,
    };
  };

  // Função para atualizar posições locais
  const updateLocalPositions = (newPositions: LNPosition[]) => {
    const metrics = calculateMetrics(newPositions, data.marketIndex, realtimeData.userBalance);
    
    setData(prev => {
      // Deep comparison to prevent unnecessary state updates and infinite loops
      const isSamePositionsArray = prev.positions.length === newPositions.length &&
        newPositions.every((newPos, i) => {
          const prevPos = prev.positions[i];
          return prevPos &&
                 newPos.id === prevPos.id &&
                 newPos.symbol === prevPos.symbol &&
                 newPos.side === prevPos.side &&
                 newPos.quantity === prevPos.quantity &&
                 newPos.entryPrice === prevPos.entryPrice &&
                 newPos.currentPrice === prevPos.currentPrice &&
                 newPos.pnl === prevPos.pnl &&
                 newPos.margin === prevPos.margin;
        });

      const isSameMetrics = (
        prev.totalPL === metrics.totalPL &&
        prev.totalMargin === metrics.totalMargin &&
        prev.totalQuantity === metrics.totalQuantity &&
        prev.totalValue === metrics.totalValue
      );

      if (isSamePositionsArray && isSameMetrics) {
        return prev; // No change, return previous state to prevent re-render
      }

      console.log('📊 POSITIONS - Updating state with new positions and metrics.');
      return {
        ...prev,
        positions: newPositions,
        ...metrics,
        lastUpdate: Date.now(),
        isLoading: false,
        error: null,
      };
    });
  };

  // Função para adicionar/atualizar uma posição
  const updatePosition = (position: LNPosition) => {
    setData(prev => {
      const existingIndex = prev.positions.findIndex(p => p.id === position.id);
      let newPositions: LNPosition[];
      
      if (existingIndex >= 0) {
        // Atualizar posição existente
        newPositions = [...prev.positions];
        newPositions[existingIndex] = position;
      } else {
        // Adicionar nova posição
        newPositions = [...prev.positions, position];
      }
      
      const metrics = calculateMetrics(newPositions, data.marketIndex, realtimeData.userBalance);
      
      return {
        ...prev,
        positions: newPositions,
        ...metrics,
        lastUpdate: Date.now(),
      };
    });
  };

  // Função para remover uma posição
  const removePosition = (positionId: string) => {
    setData(prev => {
      const newPositions = prev.positions.filter(p => p.id !== positionId);
      const metrics = calculateMetrics(newPositions, data.marketIndex, realtimeData.userBalance);
      
      return {
        ...prev,
        positions: newPositions,
        ...metrics,
        lastUpdate: Date.now(),
      };
    });
  };

  // Processar dados do RealtimeDataContext (apenas se houver posições reais)
  useEffect(() => {
    console.log('📊 POSITIONS - useEffect triggered:', { userPositions, length: userPositions?.length });
    
    if (!userPositions || userPositions.length === 0) {
      console.log('📊 POSITIONS - No userPositions data or empty array');
      return;
    }

    // Verificar se são posições reais (não simuladas)
    const hasRealPositions = userPositions.some(pos => !pos.id.startsWith('test-position-'));
    
    if (!hasRealPositions) {
      console.log('📊 POSITIONS - Ignorando posições simuladas, aguardando dados reais da LN Markets');
      return;
    }

    console.log('📊 POSITIONS - Atualizando posições do RealtimeDataContext:', userPositions.length);
    
    // Converter posições em tempo real para LNPosition
    const convertedPositions = userPositions.map(convertRealtimeToLNPosition);
    console.log('📊 POSITIONS - Posições convertidas:', convertedPositions);
    updateLocalPositions(convertedPositions);
  }, [userPositions]);

  // Função para buscar posições reais da LN Markets
  const fetchRealPositions = useCallback(async () => {
    try {
      console.log('🔍 POSITIONS CONTEXT - Fetching real positions, market index and menu from LN Markets...');

      // Atualizar posições, índice e menu simultaneamente
      const [positionsResponse, indexResponse, menuResponse] = await Promise.all([
        api.get('/api/lnmarkets/user/positions'),
        api.get('/api/market/index/public'), // Use public endpoint that doesn't require auth
        api.get('/api/menu')
      ]);

      const positionsData = positionsResponse.data;
      const indexData = indexResponse.data;
      const menuData = menuResponse.data;
      console.log('✅ POSITIONS CONTEXT - Received real positions:', positionsData);
      console.log('✅ POSITIONS CONTEXT - Received market index:', indexData);
      console.log('✅ POSITIONS CONTEXT - Received menu data:', menuData);

      // Invalidar cache do menu para forçar atualização
      if (menuData.success) {
        console.log('🔄 POSITIONS CONTEXT - Invalidating menu cache...');
        queryClient.invalidateQueries({ queryKey: ['menus'] });
      }

      if (positionsData.success && positionsData.data && Array.isArray(positionsData.data)) {
        // Transformar dados da LN Markets para o formato do contexto
        const transformedPositions: LNPosition[] = positionsData.data.map((pos: any) => ({
          id: pos.id,
          quantity: pos.quantity || 0,
          price: pos.price || 0,
          // Usar o preço de entrada correto da API da LN Markets
          entryPrice: pos.entry_price || pos.price || 0,
          currentPrice: pos.price || 0,
          liquidation: pos.liquidation || 0,
          leverage: pos.leverage || 1,
          margin: pos.margin || 0,
          pnl: pos.pl || 0,
          pnlPercentage: pos.margin > 0 ? (pos.pl / pos.margin) * 100 : 0,
          marginRatio: pos.maintenance_margin > 0 
            ? (pos.maintenance_margin / (pos.margin + pos.pl)) * 100 
            : pos.leverage > 0 ? (100 / pos.leverage) : 0,
          tradingFees: (pos.opening_fee || 0) + (pos.closing_fee || 0),
          fundingCost: pos.sum_carry_fees || 0,
          status: pos.running ? 'open' as const : 'closed' as const,
          side: pos.side === 'b' ? 'long' as const : 'short' as const,
          symbol: 'BTC',
          asset: 'BTC',
          createdAt: new Date(pos.creation_ts || Date.now()).toISOString(),
          updatedAt: new Date(pos.market_filled_ts || Date.now()).toISOString(),
          takeProfit: pos.takeprofit || undefined,
          stopLoss: pos.stoploss || undefined,
          // Adicionar timestamp para cálculo de funding fees
          timestamp: pos.creation_ts || Date.now(),
        }));

        console.log('🔄 POSITIONS CONTEXT - Updating with real positions:', transformedPositions.length);
        console.log('🔄 POSITIONS CONTEXT - Sample transformed position:', transformedPositions[0]);
        
        // Transformar para o formato esperado pelo RealtimeDataContext
        const realtimePositions = transformedPositions.map(pos => ({
          id: pos.id,
          symbol: pos.symbol,
          side: pos.side,
          quantity: pos.quantity,
          price: pos.price,
          margin: pos.margin,
          leverage: pos.leverage,
          pnl: pos.pnl,
          pnlPercent: pos.pnlPercentage,
          timestamp: Date.now()
        }));
        
        console.log('🔄 POSITIONS CONTEXT - Transformed for RealtimeDataContext:', realtimePositions.length);
        
        // Processar dados do índice de mercado primeiro
        let marketIndex: MarketIndexData | null = null;
        let marketIndexError: string | null = null;

        if (indexData.success && indexData.data) {
          marketIndex = {
            index: indexData.data.index,
            index24hChange: indexData.data.index24hChange,
            tradingFees: indexData.data.tradingFees,
            nextFunding: indexData.data.nextFunding,
            rate: indexData.data.rate,
            rateChange: indexData.data.rateChange,
            timestamp: indexData.data.timestamp,
            source: indexData.data.source
          };
          console.log('✅ POSITIONS CONTEXT - Market index processed:', marketIndex);
          console.log('📊 MARKET INDEX - Index value:', marketIndex.index);
          console.log('📊 MARKET INDEX - 24h change:', marketIndex.index24hChange);
        } else {
          marketIndexError = indexData.message || 'Failed to fetch market index';
          console.log('❌ POSITIONS CONTEXT - Market index error:', marketIndexError);
          console.log('❌ MARKET INDEX - Response data:', indexData);
        }

        // Atualizar o RealtimeDataContext com as posições reais
        updatePositions(realtimePositions);
        
        // Calcular métricas incluindo profit estimado
        const metrics = calculateMetrics(transformedPositions, marketIndex, realtimeData.userBalance);

        setData({
          positions: transformedPositions,
          ...metrics,
          lastUpdate: Date.now(),
          isLoading: false,
          error: null,
          marketIndex,
          marketIndexError
        });

        console.log('✅ POSITIONS CONTEXT - Real positions updated:', {
          count: transformedPositions.length,
          totalPL: metrics.totalPL,
          totalMargin: metrics.totalMargin,
          totalQuantity: metrics.totalQuantity,
          estimatedProfit: metrics.estimatedProfit,
          estimatedBalance: metrics.estimatedBalance
        });
      } else {
        console.log('📝 POSITIONS CONTEXT - No positions data, using empty array');
        
        // Invalidar cache do menu mesmo sem posições
        if (menuData.success) {
          console.log('🔄 POSITIONS CONTEXT - Invalidating menu cache (no positions)...');
          queryClient.invalidateQueries({ queryKey: ['menus'] });
        }
        
        // Processar dados do índice de mercado mesmo sem posições
        let marketIndex: MarketIndexData | null = null;
        let marketIndexError: string | null = null;

        if (indexData.success && indexData.data) {
          marketIndex = {
            index: indexData.data.index,
            index24hChange: indexData.data.index24hChange,
            tradingFees: indexData.data.tradingFees,
            nextFunding: indexData.data.nextFunding,
            rate: indexData.data.rate,
            rateChange: indexData.data.rateChange,
            timestamp: indexData.data.timestamp,
            source: indexData.data.source
          };
        } else {
          marketIndexError = indexData.message || 'Failed to fetch market index';
        }

        setData({
          positions: [],
          totalPL: 0,
          totalMargin: 0,
          totalQuantity: 0,
          totalValue: 0,
          estimatedProfit: 0,
          estimatedBalance: 0,
          lastUpdate: Date.now(),
          isLoading: false,
          error: null,
          marketIndex,
          marketIndexError
        });
      }
    } catch (error) {
      console.error('❌ POSITIONS CONTEXT - Error fetching real positions:', error);
      
      // Tentar invalidar cache do menu mesmo em caso de erro
      try {
        queryClient.invalidateQueries({ queryKey: ['menus'] });
      } catch (menuError) {
        console.warn('⚠️ POSITIONS CONTEXT - Could not invalidate menu cache:', menuError);
      }
      
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch positions',
        isLoading: false,
        marketIndex: null,
        marketIndexError: 'Failed to fetch market data'
      }));
    }
  }, [queryClient, updatePositions]);

  // Buscar posições reais quando usuário estiver autenticado
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔍 POSITIONS CONTEXT - User authenticated, fetching real positions...');
      fetchRealPositions();
    } else {
      console.log('🔍 POSITIONS CONTEXT - User not authenticated, clearing positions...');
      setData({
        positions: [],
        totalPL: 0,
        totalMargin: 0,
        totalQuantity: 0,
        totalValue: 0,
        estimatedProfit: 0,
        estimatedBalance: 0,
        lastUpdate: 0,
        isLoading: false,
        error: null,
        marketIndex: null,
        marketIndexError: null,
      });
    }
  }, [isAuthenticated]);

  // Atualizar posições e market index periodicamente quando autenticado
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      console.log('🔄 POSITIONS CONTEXT - Periodic update of real positions and market index...');
      fetchRealPositions();
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchRealPositions]);

  // Função para refresh manual
  const refreshPositions = () => {
    setData(prev => ({ ...prev, isLoading: true }));
    fetchRealPositions();
  };

  // Função para buscar posição por ID
  const getPositionById = (id: string) => {
    return data.positions.find(pos => pos.id === id);
  };

  // Função para buscar posições por símbolo
  const getPositionsBySymbol = (symbol: string) => {
    return data.positions.filter(pos => pos.symbol === symbol);
  };

  // Função para buscar posições por lado (long/short)
  const getPositionsBySide = (side: 'long' | 'short') => {
    return data.positions.filter(pos => pos.side === side);
  };

  const value: PositionsContextType = {
    data,
    refreshPositions,
    fetchRealPositions,
    getPositionById,
    getPositionsBySymbol,
    getPositionsBySide,
    convertRealtimeToLNPosition,
  };

  return (
    <PositionsContext.Provider value={value}>
      {children}
    </PositionsContext.Provider>
  );
};

// Hook para usar o contexto de posições
export const usePositions = () => {
  const context = useContext(PositionsContext);
  if (context === undefined) {
    throw new Error('usePositions deve ser usado dentro de um PositionsProvider');
  }
  return context;
};

// Hook para dados básicos das posições
export const usePositionsData = () => {
  const { data } = usePositions();
  return data;
};

// Hook para posições específicas
export const usePositionsList = () => {
  const { data, getPositionById, getPositionsBySymbol, getPositionsBySide } = usePositions();
  return {
    positions: data.positions,
    getPositionById,
    getPositionsBySymbol,
    getPositionsBySide,
  };
};

// Hook para métricas das posições
export const usePositionsMetrics = () => {
  const { data } = usePositions();
  return {
    totalPL: data.totalPL,
    totalMargin: data.totalMargin,
    totalQuantity: data.totalQuantity,
    estimatedProfit: data.estimatedProfit,
    estimatedBalance: data.estimatedBalance,
    positionCount: data.positions.length,
    lastUpdate: data.lastUpdate,
    totalFees: data.totalFees || 0,
    totalTradingFees: data.totalTradingFees || 0,
    totalFundingCost: data.totalFundingCost || 0,
  };
};
