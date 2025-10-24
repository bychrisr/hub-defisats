import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, ReactNode } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAuthStore } from '@/stores/auth';
import api from '@/lib/api';
import { accountEventManager } from '@/hooks/useAccountEvents';

const resolveWebSocketBaseUrls = (): string[] => {
  const candidates = new Set<string>();

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    candidates.add(`${protocol}//${window.location.host}`);
  }

  const envUrl = import.meta.env.VITE_WS_URL?.trim();
  if (envUrl) {
    candidates.add(envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl);
  }

  candidates.add('ws://localhost:13010');

  return Array.from(candidates);
};

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
  liquidation: number;
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
  userPositions: PositionData[];
  userBalance: UserBalance | null;
  lastUpdate: number;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  // NOVOS CAMPOS PARA ARQUITETURA CENTRALIZADA
  dashboardData: any | null;
  activeAccount: {
    accountId: string;
    accountName: string;
    exchangeName: string;
    exchangeId: string;
  } | null;
  // DADOS LN MARKETS (30s)
  lnMarketsData: {
    tradingFees: number;
    nextFunding: string;
    rate: number;
    rateChange: number;
    timestamp: number;
  } | null;
}

interface RealtimeDataContextType {
  data: RealtimeData;
  subscribeToSymbol: (symbol: string) => void;
  unsubscribeFromSymbol: (symbol: string) => void;
  refreshData: () => void;
  reconnect: () => void;
  loadRealPositions: (positions: any[]) => void;
  updatePositions: (positions: any[]) => void;
  loadUserBalance: () => Promise<void>;
  // NOVOS CAMPOS PARA ARQUITETURA CENTRALIZADA
  dashboardData: any | null;
  activeAccount: {
    accountId: string;
    accountName: string;
    exchangeName: string;
    exchangeId: string;
  } | null;
  marketData: Record<string, any>;
  lnMarketsData: RealtimeData['lnMarketsData'];
}

const RealtimeDataContext = createContext<RealtimeDataContextType | undefined>(undefined);

export const RealtimeDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ✅ CONEXÃO DIRETA: Removendo verificações de redirecionamento

  const { user, isAuthenticated } = useAuthStore();
  
  const wsBaseUrls = useMemo(() => resolveWebSocketBaseUrls(), []);
  const wsEndpoints = useMemo(() => {
    const endpoints = wsBaseUrls.map((baseUrl) => {
      const normalizedBase = baseUrl.replace(/\/+$/, '');
      if (normalizedBase.endsWith('/ws') || normalizedBase.endsWith('/api/ws')) {
        return normalizedBase;
      }
      return `${normalizedBase}/api/ws`;
    });
    
    // ✅ Em desenvolvimento, priorizar conexão direta (porta 13010)
    if (import.meta.env.DEV) {
      const directEndpoint = 'ws://localhost:13010/api/ws';
      // Colocar conexão direta no início da lista
      return [directEndpoint, ...endpoints.filter(e => e !== directEndpoint)];
    }
    
    return Array.from(new Set(endpoints));
  }, [wsBaseUrls]);
  const primaryWsEndpoint = wsEndpoints[0] ?? 'ws://localhost:13010/api/ws';
  const activeUserId = user?.id || 'anonymous';

  // Verificar se é admin
  const isAdmin = user?.is_admin || false;
  const [data, setData] = useState<RealtimeData>({
    marketData: {},
    positions: [],
    userPositions: [],
    userBalance: null,
    lastUpdate: 0,
    isConnected: false,
    connectionStatus: 'disconnected',
    // NOVOS CAMPOS PARA ARQUITETURA CENTRALIZADA
    dashboardData: null,
    activeAccount: null,
    // DADOS LN MARKETS (30s)
    lnMarketsData: null
  });

  const [subscribedSymbols, setSubscribedSymbols] = useState<Set<string>>(new Set());

  // Função para carregar saldo do usuário via API
  const loadUserBalance = useCallback(async () => {
    if (!isAuthenticated || !user?.id) {
      return;
    }

    // Pular para admins - eles não têm credenciais LN Markets
    if (isAdmin) {
      console.log('💰 REALTIME - Admin user, skipping balance query...');
      return;
    }
    
    try {
      // Usar axios para aproveitar os interceptors de autenticação
      const response = await api.get('/api/lnmarkets-robust/dashboard');
      const data = response.data;
      
      if (data.success) {
        setData(prev => ({
          ...prev,
          userBalance: { ...data.data, timestamp: Date.now() },
          lastUpdate: Date.now()
        }));
      }
    } catch (error) {
      console.error('💰 REALTIME - Erro ao carregar saldo:', error);
    }
  }, [isAuthenticated, user?.id, isAdmin]);

  // Carregar saldo do usuário quando autenticado
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadUserBalance();
    }
  }, [isAuthenticated, user?.id, loadUserBalance]);

  // DISABLED: Simulação que estava corrompendo os dados reais do LN Markets
  // O problema era que os dados de mercado tinham escala de preço diferente (50k vs 117k)
  // e isso causava cálculos de P&L absurdos
  // useEffect(() => {
  //   if (Object.keys(data.marketData).length > 0 && data.positions.length > 0) {
  //     const interval = setInterval(() => {
  //       setData(prev => {
  //         // Simular atualizações para posições BTC (já que temos dados de mercado BTC)
  //         const btcMarketData = prev.marketData['BTC'];
  //         if (btcMarketData && prev.positions.length > 0) {
  //           // Simular pequena variação de preço
  //           const priceVariation = (Math.random() - 0.5) * 0.002; // ±0.2%
  //           const newPrice = btcMarketData.price * (1 + priceVariation);
  //           
  //           // Atualizar posições existentes
  //           const updatedPositions = prev.positions.map(pos => {
  //             if (pos.symbol === 'BTC') {
  //               // Calcular novo P&L baseado na mudança de preço
  //               const priceChange = (newPrice - pos.price) / pos.price;
  //               const newPnl = pos.pnl + (priceChange * pos.quantity * pos.price);
  //               const newPnlPercent = pos.margin > 0 ? (newPnl / pos.margin) * 100 : 0;
  //               
  //               console.log('📊 REALTIME - Simulando atualização de posição BTC:', {
  //                 id: pos.id,
  //                 oldPrice: pos.price,
  //                 newPrice: newPrice,
  //                 oldPnl: pos.pnl,
  //                 newPnl: newPnl,
  //                 priceChange: priceChange
  //               });
  //               
  //               return {
  //                 ...pos,
  //                 price: newPrice,
  //                 pnl: newPnl,
  //                 pnlPercent: newPnlPercent,
  //                 timestamp: Date.now()
  //               };
  //             }
  //             return pos;
  //           });
  //           
  //           return {
  //             ...prev,
  //             positions: updatedPositions,
  //             lastUpdate: Date.now()
  //           };
  //         }
  //         return prev;
  //       });
  //     }, 3000); // Atualizar a cada 3 segundos
  //     
  //     return () => clearInterval(interval);
  //   }
  // }, [data.marketData, data.positions.length]); // Add positions.length to dependencies

  // ✅ CONEXÃO DIRETA: Removendo verificações de redirecionamento

  // ✅ WEBSOCKET: URL correta para conexão direta ao backend
  console.log('🔗 REALTIME - Endpoints WebSocket candidatos:', wsEndpoints.map((endpoint) => `${endpoint}?userId=${activeUserId}`));
  console.log('🔗 REALTIME - window.location:', {
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    port: window.location.port,
    host: window.location.host
  });

  // WebSocket para dados em tempo real
  const { isConnected, isConnecting, error, connect, disconnect, sendMessage } = useWebSocket({
    url: primaryWsEndpoint,
    urls: wsEndpoints,
    userId: activeUserId,
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

          // === MUDANÇA DE CONTA ATIVA ===
          case 'active_account_changed':
            console.log('🔄 REALTIME - Active account changed:', message);
            accountEventManager.emit('accountActivated');
            // Atualizar dados locais
            setData(prev => ({
              ...prev,
              activeAccount: {
                accountId: message.data?.accountId || '',
                accountName: message.data?.accountName || '',
                exchangeName: message.data?.exchangeName || '',
                exchangeId: message.data?.exchangeId || ''
              },
              lastUpdate: Date.now()
            }));
            break;
          
          // === ATUALIZAÇÃO DE DADOS DO DASHBOARD ===
          case 'data_update':
            console.log('🔄 REALTIME - Dashboard data update:', message.data);
            setData(prev => ({
              ...prev,
              dashboardData: message.data,
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

        case 'lnmarkets_data':
          console.log('📊 REALTIME - LN Markets data update:', message.data);
          setData(prev => ({
            ...prev,
            lnMarketsData: {
              tradingFees: message.data.tradingFees,
              nextFunding: message.data.nextFunding,
              rate: message.data.rate,
              rateChange: message.data.rateChange,
              timestamp: message.data.timestamp
            },
            lastUpdate: Date.now()
          }));
          break;

        case 'position_update':
          console.log('📊 REALTIME - Atualizando posição:', message.data);
          setData(prev => {
            // Atualizar posição diretamente com os dados recebidos
            const updatedPosition = {
              ...message.data,
              timestamp: Date.now()
            };
            
            console.log('📊 REALTIME - Posição atualizada:', updatedPosition);
            
            const existingPositions = prev.userPositions || [];
            const existingIndex = existingPositions.findIndex(pos => pos.id === message.data.id);
            
            let newPositions;
            if (existingIndex >= 0) {
              // Atualizar posição existente
              newPositions = existingPositions.map(pos => 
                pos.id === message.data.id ? updatedPosition : pos
              );
            } else {
              // Adicionar nova posição
              newPositions = [...existingPositions, updatedPosition];
            }
            
            return {
              ...prev,
              userPositions: newPositions,
              lastUpdate: Date.now()
            };
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

  // Log de debug para verificar estado antes do useEffect
  console.log('🔍 REALTIME - Estado antes do useEffect:', {
    isAuthenticated,
    userId: user?.id,
    isAdmin,
    isConnected,
    timestamp: new Date().toISOString()
  });

  // Conectar quando usuário estiver autenticado (apenas para usuários comuns)
  const didTryRef = useRef(false);
  
  useEffect(() => {
    console.log('🔄 REALTIME - useEffect de conexão executado:', {
      isAuthenticated,
      userId: user?.id,
      isAdmin,
      isConnected,
      isConnecting,
      didTry: didTryRef.current,
      timestamp: new Date().toISOString()
    });

    const ready = isAuthenticated && user?.id && !isAdmin;
    
    if (!ready) {
      // Não desconectar compulsivamente em transições intermediárias
      console.log('🔄 REALTIME - Aguardando autenticação:', {
        isAuthenticated,
        hasUserId: !!user?.id,
        isAdmin,
        reason: 'waiting_for_auth'
      });
      return;
    }
    
    if (isAdmin) {
      // Só desconectar se for admin
      console.log('🔄 REALTIME - Desconectando (usuário é admin):', {
        isAuthenticated,
        hasUserId: !!user?.id,
        isAdmin,
        reason: 'is_admin'
      });
      disconnect();
      return;
    }
    
    // Conectar apenas quando estado estiver estável e não tiver tentado ainda
    if (!isConnected && !isConnecting && !didTryRef.current) {
      didTryRef.current = true; // Evita double-connect do StrictMode
      console.log('🔄 REALTIME - Conectando para usuário:', user.id);
      
      const endpointPreview = wsEndpoints.map((endpoint) => `${endpoint}?userId=${user.id}`);
      console.log('🔗 REALTIME - Tentando conectar usando endpoints:', endpointPreview);
      console.log('🔗 REALTIME - VITE_WS_URL env var:', import.meta.env.VITE_WS_URL);
      
      connect();
    }
  }, [isAuthenticated, user?.id, isAdmin, isConnected, isConnecting, connect]);

  // Heartbeat conforme documentação LN Markets
  useEffect(() => {
    if (!isConnected) return;
    
    let lastMessageTime = Date.now();
    let heartbeatTimer: NodeJS.Timeout;
    let pingTimer: NodeJS.Timeout;
    
    // Timer de 5s para detectar silêncio (conforme documentação LN Markets)
    const resetHeartbeatTimer = () => {
      lastMessageTime = Date.now();
      clearTimeout(heartbeatTimer);
      
      heartbeatTimer = setTimeout(() => {
        console.log('💓 REALTIME - No messages in 5s, sending ping');
        sendMessage({ type: 'ping', ts: Date.now() });
        
        // Timer de 5s para esperar pong (conforme documentação LN Markets)
        pingTimer = setTimeout(() => {
          console.log('❌ REALTIME - No pong received in 5s, reconnecting');
          // Usar função de reconexão definida mais abaixo
          disconnect();
          setTimeout(() => {
            if (isAuthenticated && user?.id) {
              connect();
            }
          }, 1000);
        }, 5000);
      }, 5000);
    };
    
    // Reset timer a cada mensagem recebida
    const handleMessage = () => {
      lastMessageTime = Date.now();
      clearTimeout(pingTimer);
      resetHeartbeatTimer();
    };
    
    // Iniciar timer
    resetHeartbeatTimer();
    
    // Listener para mensagens recebidas
    const messageListener = () => handleMessage();
    window.addEventListener('realtime-message', messageListener);
    
    return () => {
      clearTimeout(heartbeatTimer);
      clearTimeout(pingTimer);
      window.removeEventListener('realtime-message', messageListener);
    };
  }, [isConnected, sendMessage, isAuthenticated, user?.id, connect, disconnect]);

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

  const loadRealPositions = useCallback((positions: any[]) => {
    console.log('📊 REALTIME - Carregando posições reais da LN Markets:', positions.length);
    setData(prev => {
      const transformedPositions = positions
        .filter(pos => typeof pos.pl === 'number') // Só processar posições com PnL válido
        .map(pos => {
          // Usar dados reais da LN Markets
          const pnl = pos.pl; // Já validado que é number
          const margin = typeof pos.margin === 'number' ? pos.margin : 0;
          const quantity = typeof pos.quantity === 'number' ? pos.quantity : 0;
          const price = typeof pos.price === 'number' ? pos.price : 0;
          const leverage = typeof pos.leverage === 'number' ? pos.leverage : 1;
          
          // Calcular P&L percentual de forma segura
          const pnlPercent = margin > 0 ? (pnl / margin) * 100 : 0;
        
        // Calcular margin ratio usando fórmula correta da LN Markets
        // Fórmula: maintenance_margin / (margin + pl) * 100
        const marginRatio = pos.maintenance_margin > 0 
          ? (pos.maintenance_margin / (margin + pnl)) * 100 
          : 0; // Se não há maintenance_margin, não é possível calcular
        
        // Usar fees já calculados ou calcular se necessário
        const tradingFees = pos.tradingFees || ((pos.opening_fee || 0) + (pos.closing_fee || 0));
        const fundingCost = pos.fundingCost || (pos.sum_carry_fees || 0);
        
        console.log('📊 REALTIME - Transformando posição LN Markets:', {
          id: pos.id,
          side: pos.side,
          pl: pos.pl,
          pnl: pnl,
          margin: margin,
          pnlPercent: pnlPercent,
          quantity: quantity,
          price: price,
          marginRatio: marginRatio,
          tradingFees: tradingFees,
          fundingCost: fundingCost
        });
        
        return {
          id: pos.id,
          symbol: 'BTC', // LN Markets only trades BTC futures
          side: (pos.side === 'b' ? 'long' : 'short') as 'long' | 'short', // 'b' = buy = long, 's' = sell = short
          quantity: quantity,
          price: price,
          liquidation: pos.liquidation || 0, // Valor real da API LN Markets
          margin: margin,
          leverage: leverage,
          pnl: pnl, // Usar o P&L real da LN Markets
          pnlPercent: pnlPercent,
          marginRatio: marginRatio,
          tradingFees: tradingFees,
          fundingCost: fundingCost,
          timestamp: Date.now()
        };
      });
      
      console.log('📊 REALTIME - Posições transformadas:', transformedPositions);
      
      return {
        ...prev,
        positions: transformedPositions,
        userPositions: transformedPositions,
        lastUpdate: Date.now()
      };
    });
  }, []);

  // Função para atualizar posições com dados reais (sem simulação)
  const updatePositions = useCallback((positions: any[]) => {
    console.log('🔄 REALTIME - Atualizando posições com dados reais da LN Markets:', positions.length);
    console.log('🔄 REALTIME - Posições recebidas:', positions);
    
    // Log da primeira posição para ver a estrutura
    if (positions.length > 0) {
      console.log('🔄 REALTIME - Estrutura da primeira posição:', {
        id: positions[0].id,
        pl: positions[0].pl,
        pnl: positions[0].pnl,
        keys: Object.keys(positions[0])
      });
    }
    
    setData(prev => {
      const filteredPositions = positions.filter(pos => typeof pos.pl === 'number');
      console.log('🔄 REALTIME - Posições filtradas (com pl válido):', filteredPositions.length);
      
      const transformedPositions = filteredPositions.map(pos => {
          // Usar dados reais da LN Markets
          const pnl = pos.pl; // Já validado que é number
          const margin = typeof pos.margin === 'number' ? pos.margin : 0;
          const quantity = typeof pos.quantity === 'number' ? pos.quantity : 0;
          const price = typeof pos.price === 'number' ? pos.price : 0;
          const leverage = typeof pos.leverage === 'number' ? pos.leverage : 1;
          
          // Calcular P&L percentual de forma segura
          const pnlPercent = margin > 0 ? (pnl / margin) * 100 : 0;
          
          // Calcular margin ratio usando fórmula correta da LN Markets
          // Fórmula: maintenance_margin / (margin + pl) * 100
          const marginRatio = pos.maintenance_margin > 0 
            ? (pos.maintenance_margin / (margin + pnl)) * 100 
            : 0; // Se não há maintenance_margin, não é possível calcular
          
          // Usar fees já calculados ou calcular se necessário
          const tradingFees = pos.tradingFees || ((pos.opening_fee || 0) + (pos.closing_fee || 0));
          const fundingCost = pos.fundingCost || (pos.sum_carry_fees || 0);
          
          console.log('🔄 REALTIME - Atualizando posição LN Markets:', {
            id: pos.id,
            side: pos.side,
            pl: pos.pl,
            pnl: pnl,
            margin: margin,
            pnlPercent: pnlPercent,
            quantity: quantity,
            price: price,
            marginRatio: marginRatio,
            tradingFees: tradingFees,
            fundingCost: fundingCost
          });
          
          return {
            id: pos.id,
            symbol: 'BTC', // LN Markets only trades BTC futures
            side: (pos.side === 'b' ? 'long' : 'short') as 'long' | 'short', // 'b' = buy = long, 's' = sell = short
            quantity: quantity,
            price: price,
            liquidation: pos.liquidation || 0, // Valor real da API LN Markets
            margin: margin,
            leverage: leverage,
            pnl: pnl, // Usar o P&L real da LN Markets
            pnlPercent: pnlPercent,
            marginRatio: marginRatio,
            tradingFees: tradingFees,
            fundingCost: fundingCost,
            timestamp: Date.now()
          };
        });
      
      console.log('🔄 REALTIME - Posições atualizadas:', transformedPositions);
      
      return {
        ...prev,
        positions: transformedPositions,
        userPositions: transformedPositions,
        lastUpdate: Date.now()
      };
    });
  }, []);

  const value: RealtimeDataContextType = {
    data,
    subscribeToSymbol,
    unsubscribeFromSymbol,
    refreshData,
    reconnect,
    loadRealPositions,
    updatePositions,
    loadUserBalance,
    // NOVOS CAMPOS PARA ARQUITETURA CENTRALIZADA
    dashboardData: data.dashboardData,
    activeAccount: data.activeAccount,
    marketData: data.marketData,
    lnMarketsData: data.lnMarketsData
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

// Hook para dados de mercado públicos (não requer autenticação)
// Hook for public market data (no authentication required)
export { useLatestPrices, useBitcoinPrice, useCryptoPrices } from '@/hooks/useLatestPrices';

// Hook para dados de mercado específicos
// Hook for LN Markets authenticated market data (requires credentials)
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
  return data.userPositions || [];
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
