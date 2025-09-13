import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/stores/auth';

// Tipos de dados em tempo real
interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

interface PositionData {
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

interface UserBalance {
  total_balance: number;
  available_balance: number;
  margin_used: number;
  timestamp: number;
}

interface RealtimeData {
  marketData: Record<string, MarketData>;
  positions: PositionData[];
  userBalance: UserBalance | null;
  lastUpdate: number;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

interface RealtimeDataContextType {
  data: RealtimeData;
  subscribeToSymbol: (symbol: string) => void;
  unsubscribeFromSymbol: (symbol: string) => void;
  refreshData: () => void;
  reconnect: () => void;
}

const RealtimeDataContext = createContext<RealtimeDataContextType | undefined>(undefined);

export const RealtimeDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [data, setData] = useState<RealtimeData>({
    marketData: {},
    positions: [],
    userBalance: null,
    lastUpdate: 0,
    isConnected: false,
    connectionStatus: 'disconnected'
  });

  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set());

  // WebSocket para dados em tempo real
  const { isConnected, isConnecting, error, connect, disconnect, sendMessage } = useWebSocket({
    url: `ws://localhost:13010/test/ws/realtime?userId=${user?.id || 'anonymous'}`,
    onMessage: useCallback((message) => {
      console.log('📊 REALTIME - Mensagem recebida:', {
        type: message.type,
        data: message.data,
        timestamp: new Date().toISOString(),
        userId: user?.id
      });
      
        switch (message.type) {
          case 'connection_established':
            console.log('✅ REALTIME - Conexão WebSocket estabelecida:', message.data);
            setData(prev => ({
              ...prev,
              connectionStatus: 'connected',
              lastUpdate: Date.now()
            }));
            break;

          case 'market_data':
            console.log('📈 REALTIME - Processando dados de mercado:', message.data);
            setData(prev => {
              const newData = {
                ...prev,
                marketData: {
                  ...prev.marketData,
                  [message.data.symbol]: {
                    ...message.data,
                    timestamp: Date.now()
                  }
                },
                lastUpdate: Date.now()
              };
              console.log('📈 REALTIME - Dados de mercado atualizados:', newData.marketData);
              return newData;
            });
            break;

        case 'position_update':
          console.log('📊 REALTIME - Atualizando posição:', message.data);
          setData(prev => {
            const newData = {
              ...prev,
              positions: prev.positions.map(pos => 
                pos.id === message.data.id ? { ...message.data, timestamp: Date.now() } : pos
              ),
              lastUpdate: Date.now()
            };
            console.log('📊 REALTIME - Posições atualizadas:', newData.positions.length);
            return newData;
          });
          break;

        case 'position_added':
          console.log('➕ REALTIME - Adicionando nova posição:', message.data);
          setData(prev => {
            const newData = {
              ...prev,
              positions: [...prev.positions, { ...message.data, timestamp: Date.now() }],
              lastUpdate: Date.now()
            };
            console.log('➕ REALTIME - Total de posições:', newData.positions.length);
            return newData;
          });
          break;

        case 'position_removed':
          console.log('➖ REALTIME - Removendo posição:', message.data.id);
          setData(prev => {
            const newData = {
              ...prev,
              positions: prev.positions.filter(pos => pos.id !== message.data.id),
              lastUpdate: Date.now()
            };
            console.log('➖ REALTIME - Total de posições após remoção:', newData.positions.length);
            return newData;
          });
          break;

        case 'balance_update':
          console.log('💰 REALTIME - Atualizando saldo:', message.data);
          setData(prev => {
            const newData = {
              ...prev,
              userBalance: { ...message.data, timestamp: Date.now() },
              lastUpdate: Date.now()
            };
            console.log('💰 REALTIME - Saldo atualizado:', newData.userBalance);
            return newData;
          });
          break;

        case 'positions_snapshot':
          console.log('📸 REALTIME - Recebendo snapshot de posições:', message.data.length);
          setData(prev => {
            const newData = {
              ...prev,
              positions: message.data.map((pos: PositionData) => ({ ...pos, timestamp: Date.now() })),
              lastUpdate: Date.now()
            };
            console.log('📸 REALTIME - Snapshot de posições carregado:', newData.positions.length);
            return newData;
          });
          break;

        case 'market_snapshot':
          console.log('📸 REALTIME - Recebendo snapshot de mercado:', message.data.length);
          setData(prev => {
            const newData = {
              ...prev,
              marketData: message.data.reduce((acc: Record<string, MarketData>, item: MarketData) => {
                acc[item.symbol] = { ...item, timestamp: Date.now() };
                return acc;
              }, {}),
              lastUpdate: Date.now()
            };
            console.log('📸 REALTIME - Snapshot de mercado carregado:', Object.keys(newData.marketData));
            return newData;
          });
          break;

        default:
          console.warn('⚠️ REALTIME - Tipo de mensagem desconhecido:', message.type);
      }
    }, []),
    onError: useCallback((error) => {
      console.error('❌ REALTIME - Erro WebSocket:', error);
      setData(prev => ({
        ...prev,
        connectionStatus: 'error'
      }));
    }, []),
    onOpen: useCallback(() => {
      console.log('🔌 REALTIME - WebSocket conectado');
      setData(prev => ({
        ...prev,
        isConnected: true,
        connectionStatus: 'connected'
      }));
    }, []),
    onClose: useCallback(() => {
      console.log('🔌 REALTIME - WebSocket desconectado');
      setData(prev => ({
        ...prev,
        isConnected: false,
        connectionStatus: 'disconnected'
      }));
    }, [])
  });

  // Conectar quando usuário estiver autenticado
  useEffect(() => {
    console.log('🔄 REALTIME - Verificando conexão:', {
      isAuthenticated,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });

    if (isAuthenticated && user?.id) {
      console.log('🔄 REALTIME - Conectando para usuário:', user.id);
      console.log('🔗 REALTIME - URL do WebSocket:', `ws://localhost:13010/test/ws/realtime?userId=${user.id}`);
      connect();
    } else {
      console.log('🔄 REALTIME - Desconectando - usuário não autenticado');
      disconnect();
    }
  }, [isAuthenticated, user?.id, connect, disconnect]);

  // Atualizar status de conexão
  useEffect(() => {
    setData(prev => ({
      ...prev,
      isConnected,
      connectionStatus: isConnecting ? 'connecting' : isConnected ? 'connected' : 'disconnected'
    }));
  }, [isConnected, isConnecting]);

  // Função para inscrever em um símbolo
  const subscribeToSymbol = useCallback((symbol: string) => {
    if (subscribedSymbols.has(symbol)) return;
    
    console.log('📈 REALTIME - Inscrevendo em símbolo:', symbol);
    setSubscribedSymbols(prev => new Set([...prev, symbol]));
    
    sendMessage({
      type: 'subscribe_market',
      symbol: symbol,
      userId: user?.id
    });
  }, [subscribedSymbols, sendMessage, user?.id]);

  // Função para desinscrever de um símbolo
  const unsubscribeFromSymbol = useCallback((symbol: string) => {
    console.log('📉 REALTIME - Desinscrevendo de símbolo:', symbol);
    setSubscribedSymbols(prev => {
      const newSet = new Set(prev);
      newSet.delete(symbol);
      return newSet;
    });
    
    sendMessage({
      type: 'unsubscribe_market',
      symbol: symbol,
      userId: user?.id
    });
  }, [sendMessage, user?.id]);

  // Função para atualizar dados manualmente
  const refreshData = useCallback(() => {
    console.log('🔄 REALTIME - Atualizando dados manualmente');
    sendMessage({
      type: 'refresh_data',
      userId: user?.id
    });
  }, [sendMessage, user?.id]);

  // Função para reconectar
  const reconnect = useCallback(() => {
    console.log('🔄 REALTIME - Reconectando...');
    disconnect();
    setTimeout(() => {
      if (isAuthenticated && user?.id) {
        connect();
      }
    }, 1000);
  }, [disconnect, connect, isAuthenticated, user?.id]);

  // Auto-reconectar em caso de erro
  useEffect(() => {
    if (error && isAuthenticated) {
      console.log('🔄 REALTIME - Tentando reconectar em 5 segundos...');
      const timer = setTimeout(() => {
        reconnect();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, isAuthenticated, reconnect]);

  const value: RealtimeDataContextType = {
    data,
    subscribeToSymbol,
    unsubscribeFromSymbol,
    refreshData,
    reconnect
  };

  return (
    <RealtimeDataContext.Provider value={value}>
      {children}
    </RealtimeDataContext.Provider>
  );
};

export const useRealtimeData = () => {
  const context = useContext(RealtimeDataContext);
  if (context === undefined) {
    throw new Error('useRealtimeData must be used within a RealtimeDataProvider');
  }
  return context;
};

// Hook para dados de mercado específicos
export const useMarketData = (symbol: string) => {
  const { data, subscribeToSymbol, unsubscribeFromSymbol } = useRealtimeData();
  
  useEffect(() => {
    if (symbol) {
      subscribeToSymbol(symbol);
      return () => unsubscribeFromSymbol(symbol);
    }
  }, [symbol, subscribeToSymbol, unsubscribeFromSymbol]);

  return data.marketData[symbol] || null;
};

// Hook para posições do usuário
export const useUserPositions = () => {
  const { data } = useRealtimeData();
  return data.positions;
};

// Hook para saldo do usuário
export const useUserBalance = () => {
  const { data } = useRealtimeData();
  return data.userBalance;
};

// Hook para status de conexão
export const useConnectionStatus = () => {
  const { data, reconnect } = useRealtimeData();
  return {
    isConnected: data.isConnected,
    status: data.connectionStatus,
    lastUpdate: data.lastUpdate,
    reconnect
  };
};
