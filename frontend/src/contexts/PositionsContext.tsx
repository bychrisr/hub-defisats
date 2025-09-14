import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useUserPositions } from './RealtimeDataContext';
import { api } from '@/lib/api';
import { useLNMarketsIndex } from '@/hooks/useLNMarketsIndex';

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

export interface PositionsData {
  positions: LNPosition[];
  totalPL: number;
  totalMargin: number;
  totalQuantity: number;
  totalValue: number;
  lastUpdate: number;
  isLoading: boolean;
  error: string | null;
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
  const { refetch: refetchIndex } = useLNMarketsIndex();
  
  console.log('📊 POSITIONS - Provider render:', { userPositions, length: userPositions?.length });
  
  const [data, setData] = useState<PositionsData>({
    positions: [],
    totalPL: 0,
    totalMargin: 0,
    totalQuantity: 0,
    totalValue: 0,
    lastUpdate: 0,
    isLoading: false,
    error: null,
  });

  // Função para converter posição em tempo real para LNPosition
  const convertRealtimeToLNPosition = (pos: RealtimePosition): LNPosition => {
    return {
      id: pos.id,
      quantity: pos.quantity,
      price: pos.price,
      entryPrice: pos.price, // Usar o preço atual como preço de entrada por enquanto
      currentPrice: pos.price, // Usar o preço atual
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
      updatedAt: new Date(pos.timestamp).toISOString()
    };
  };

  // Função para calcular métricas das posições
  const calculateMetrics = (positions: LNPosition[]) => {
    const totalPL = positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);
    const totalMargin = positions.reduce((sum, pos) => sum + (pos.margin || 0), 0);
    const totalQuantity = positions.reduce((sum, pos) => sum + (pos.quantity || 0), 0);
    const totalValue = totalMargin; // Total Value é igual ao Total Margin
    
    return {
      totalPL,
      totalMargin,
      totalQuantity,
      totalValue,
    };
  };

  // Função para atualizar posições
  const updatePositions = (newPositions: LNPosition[]) => {
    const metrics = calculateMetrics(newPositions);
    
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
      
      const metrics = calculateMetrics(newPositions);
      
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
      const metrics = calculateMetrics(newPositions);
      
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
    updatePositions(convertedPositions);
  }, [userPositions]);

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
        lastUpdate: 0,
        isLoading: false,
        error: null,
      });
    }
  }, [isAuthenticated]);

  // Atualizar posições periodicamente quando autenticado
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      console.log('🔄 POSITIONS CONTEXT - Periodic update of real positions and index...');
      fetchRealPositions();
    }, 10000); // Atualizar a cada 10 segundos

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Função para buscar posições reais da LN Markets
  const fetchRealPositions = async () => {
    try {
      console.log('🔍 POSITIONS CONTEXT - Fetching real positions from LN Markets...');
      
      // Atualizar posições e índice simultaneamente
      const [positionsResponse] = await Promise.all([
        api.get('/api/lnmarkets/user/positions'),
        refetchIndex() // Atualizar índice junto com as posições
      ]);
      
      const data = positionsResponse.data;
      console.log('✅ POSITIONS CONTEXT - Received real positions:', data);

      if (data.success && data.data && Array.isArray(data.data)) {
        // Transformar dados da LN Markets para o formato do contexto
        const transformedPositions: LNPosition[] = data.data.map((pos: any) => ({
          id: pos.id,
          quantity: pos.quantity || 0,
          price: pos.price || 0,
          entryPrice: pos.price || 0,
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
        }));

        console.log('🔄 POSITIONS CONTEXT - Updating with real positions:', transformedPositions.length);
        
        // Atualizar estado com posições reais
        setPositions(transformedPositions);
        
        // Calcular totais
        const totalPL = transformedPositions.reduce((sum, pos) => sum + pos.pnl, 0);
        const totalMargin = transformedPositions.reduce((sum, pos) => sum + pos.margin, 0);
        const totalQuantity = transformedPositions.reduce((sum, pos) => sum + pos.quantity, 0);
        const totalValue = totalMargin; // Total value = total margin

        setData({
          positions: transformedPositions,
          totalPL,
          totalMargin,
          totalQuantity,
          totalValue,
          lastUpdate: Date.now(),
          isLoading: false,
          error: null
        });

        console.log('✅ POSITIONS CONTEXT - Real positions updated:', {
          count: transformedPositions.length,
          totalPL,
          totalMargin,
          totalQuantity
        });
      } else {
        console.log('📝 POSITIONS CONTEXT - No positions data, using empty array');
        setPositions([]);
        setData({
          positions: [],
          totalPL: 0,
          totalMargin: 0,
          totalQuantity: 0,
          totalValue: 0,
          lastUpdate: Date.now(),
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      console.error('❌ POSITIONS CONTEXT - Error fetching real positions:', error);
      setData(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to fetch positions',
        isLoading: false
      }));
    }
  };

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
    positionCount: data.positions.length,
    lastUpdate: data.lastUpdate,
  };
};
