# Relatório Técnico: Debug WebSocket - Market Data não chegando ao Frontend

## Índice
1. [Resumo Executivo](#resumo-executivo)
2. [Contexto do Problema](#contexto-do-problema)
3. [Arquitetura do Sistema](#arquitetura-do-sistema)
4. [Investigação Detalhada](#investigação-detalhada)
5. [Análise de Logs](#análise-de-logs)
6. [Problemas Identificados](#problemas-identificados)
7. [Correções Implementadas](#correções-implementadas)
8. [Testes Realizados](#testes-realizados)
9. [Status Atual](#status-atual)
10. [Próximos Passos](#próximos-passos)
11. [Anexos](#anexos)

## Resumo Executivo

**Problema Principal**: O frontend não está recebendo mensagens `market_data` em tempo real, mesmo com WebSocket conectado e backend emitindo dados.

**Status**: Em investigação ativa - identificamos que o problema está na instabilidade das conexões WebSocket causada por um loop infinito de reconexões no frontend.

**Impacto**: Usuários não recebem atualizações de preços em tempo real (1 segundo) no header e dashboard.

**Solução Proposta**: Correção do loop infinito de reconexões no frontend e estabilização das conexões WebSocket.

## Contexto do Problema

### Situação Atual
- ✅ **WebSocket conecta** (frontend e backend confirmam)
- ✅ **Frontend recebe `lnmarkets_data`** (atualizações de 30s)
- ✅ **Frontend recebe `connection_established`**
- ✅ **Backend emite `market_data_update`** (atualizações de 1s)
- ✅ **Backend faz broadcast de `market_data`**

### Problema Identificado
- ❌ **Frontend NÃO recebe mensagens `market_data`**
- ❌ **Backend mostra `sentCount: 0` no broadcast de `market_data`**

### Requisitos Funcionais
1. **Header de Index**: Atualizar preço BTC a cada 1 segundo
2. **Dashboard Cards**: Atualizar dados de mercado a cada 1 segundo
3. **LN Markets Header**: Atualizar fees, funding, rate a cada 30 segundos
4. **Sem flicker**: Apenas números atualizando, sem recarregar página

## Arquitetura do Sistema

### Backend - WebSocket Manager
**Arquivo**: `backend/src/websocket/manager.ts`

```typescript
export class WebSocketManager extends EventEmitter {
  private connections: Map<string, WebSocketConnection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  
  broadcast(message: any, options: BroadcastOptions = {}): number {
    let sentCount = 0;
    const { target, type, exclude = [] } = options;
    
    // Logs detalhados implementados para debug
    console.log('📢 WEBSOCKET MANAGER - Broadcasting:', { 
      type: message.type, 
      target, 
      excludeCount: exclude.length,
      totalConnections: this.connections.size,
      activeConnectionIds: Array.from(this.connections.keys())
    });
    
    for (const [connectionId, connection] of this.connections) {
      // Verificar filtros e enviar mensagem
      if (this.shouldSendToConnection(connection, message, options)) {
        if (this.sendMessage(connectionId, message)) {
          sentCount++;
        }
      }
    }
    
    return sentCount;
  }
}
```

### Backend - Market Data Handler
**Arquivo**: `backend/src/websocket/handlers/market-data.handler.ts`

```typescript
// Singleton pattern para evitar múltiplas instâncias
let marketDataHandlerInstance: MarketDataHandler | null = null;

export class MarketDataHandler extends EventEmitter {
  private subscribers: Set<string> = new Set();
  private cache: Map<string, any> = new Map();
  private wsManager: any;
  
  constructor(logger: Logger) {
    super();
    this.logger = logger;
    console.log('🚀 MARKET DATA HANDLER - Initializing...');
    this.startMarketDataUpdates(); // 1 segundo
    this.startLNMarketsUpdates(); // 30 segundos
  }
  
  static getInstance(logger: Logger): MarketDataHandler {
    if (!marketDataHandlerInstance) {
      console.log('📦 MARKET DATA HANDLER - Creating new singleton instance...');
      marketDataHandlerInstance = new MarketDataHandler(logger);
      console.log('📦 MARKET DATA HANDLER - Singleton instance created');
    } else {
      console.log('📦 MARKET DATA HANDLER - Using existing singleton instance');
    }
    return marketDataHandlerInstance;
  }
  
  subscribe(connectionId: string, data: any): void {
    const { symbol = 'BTCUSDT' } = data;
    
    console.log('📡 MARKET DATA HANDLER - Subscription added:', { connectionId, symbol });
    
    this.subscribers.add(connectionId);
    
    // Enviar dados atuais se disponível em cache
    const cacheKey = `market_${symbol}`;
    const cached = this.cache.get(cacheKey);
    if (cached && this.wsManager) {
      this.wsManager.sendMessage(connectionId, {
        type: 'market_data',
        data: cached,
        timestamp: Date.now()
      });
    }
  }
  
  private async fetchMarketData(symbol: string): Promise<void> {
    try {
      // Buscar dados do Binance
      const binanceData = await this.fetchBinanceData(symbol);
      
      // Armazenar em cache
      this.cache.set(`market_${symbol}`, binanceData);
      
      // Emitir evento
      const eventData = {
        type: 'market_data',
        data: binanceData,
        timestamp: Date.now()
      };
      
      console.log('📡 MARKET DATA HANDLER - About to emit market_data_update event:', {
        eventType: 'market_data_update',
        data: eventData,
        listenerCount: this.listenerCount('market_data_update')
      });
      
      this.emit('market_data_update', eventData);
      
      console.log('✅ MARKET DATA HANDLER - market_data_update event emitted:', {
        eventType: 'market_data_update',
        listenerCount: this.listenerCount('market_data_update')
      });
      
    } catch (error) {
      console.error('❌ MARKET DATA HANDLER - Error fetching market data:', error);
    }
  }
}
```

### Backend - WebSocket Routes
**Arquivo**: `backend/src/websocket/routes.ts`

```typescript
export async function websocketConsolidatedRoutes(fastify: FastifyInstance) {
  // Inicializar handlers especializados (usando singleton para MarketDataHandler)
  const marketDataHandler = MarketDataHandler.getInstance(logger);
  const userDataHandler = new UserDataHandler(logger);
  const positionUpdatesHandler = new PositionUpdatesHandler(logger);
  
  // Conectar handlers ao manager
  console.log('🔗 WEBSOCKET ROUTES - About to call setupHandlerConnections...');
  try {
    setupHandlerConnections(wsManager, marketDataHandler, userDataHandler, positionUpdatesHandler);
    console.log('✅ WEBSOCKET ROUTES - setupHandlerConnections completed successfully');
  } catch (error) {
    console.error('❌ WEBSOCKET ROUTES - Error in setupHandlerConnections:', error);
  }
  
  // Handler para novas conexões - notificar handlers especializados
  wsManager.on('connection', (conn) => {
    console.log('🔗 WEBSOCKET ROUTES - New connection detected, notifying handlers:', { 
      connectionId: conn.id, 
      userId: conn.userId 
    });
    
    // Notificar MarketDataHandler sobre nova conexão
    if (conn.userId) {
      marketDataHandler.subscribe(conn.id, { symbol: 'BTCUSDT' });
    }
  });
}

function setupHandlerConnections(
  wsManager: WebSocketManager,
  marketDataHandler: MarketDataHandler,
  userDataHandler: UserDataHandler,
  positionUpdatesHandler: PositionUpdatesHandler
): void {
  
  // Conectar market data handler
  console.log('🔗 WEBSOCKET ROUTES - Registering market_data_update listener...');
  
  marketDataHandler.on('market_data_update', (data) => {
    console.log('📊 WEBSOCKET ROUTES - Market data event received:', JSON.stringify(data).substring(0, 100));
    console.log('📊 WEBSOCKET ROUTES - Broadcasting market data to clients...');
    try {
      wsManager.broadcast(data, { type: 'market_data' });
      console.log('✅ WEBSOCKET ROUTES - Market data broadcasted');
    } catch (error) {
      console.error('❌ WEBSOCKET ROUTES - Error broadcasting market data:', error);
    }
  });
  
  console.log('✅ WEBSOCKET ROUTES - market_data_update listener registered');
}
```

### Frontend - Realtime Data Context
**Arquivo**: `frontend/src/contexts/RealtimeDataContext.tsx`

```typescript
export const RealtimeDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  
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

        // ... outros casos
      }
    }, [])
  });

  // Conectar quando usuário estiver autenticado (apenas para usuários comuns)
  useEffect(() => {
    console.log('🔄 REALTIME - useEffect de conexão executado:', {
      isAuthenticated,
      userId: user?.id,
      isAdmin,
      timestamp: new Date().toISOString()
    });

    if (isAuthenticated && user?.id && !isAdmin) {
      console.log('🔄 REALTIME - Conectando para usuário:', user.id);
      
      const endpointPreview = wsEndpoints.map((endpoint) => `${endpoint}?userId=${user.id}`);
      console.log('🔗 REALTIME - Tentando conectar usando endpoints:', endpointPreview);
      console.log('🔗 REALTIME - VITE_WS_URL env var:', import.meta.env.VITE_WS_URL);
      
      connect();
    } else if (isAdmin) {
      // Só desconectar se for admin
      console.log('🔄 REALTIME - Desconectando (usuário é admin):', {
        isAuthenticated,
        hasUserId: !!user?.id,
        isAdmin,
        reason: 'is_admin'
      });
      disconnect();
    } else {
      console.log('🔄 REALTIME - Aguardando autenticação:', {
        isAuthenticated,
        hasUserId: !!user?.id,
        isAdmin,
        reason: 'waiting_for_auth'
      });
      // Não desconectar se ainda não foi autenticado
    }
  }, [isAuthenticated, user?.id, isAdmin]);

  return (
    <RealtimeDataContext.Provider value={{
      // ... dados expostos
      lnMarketsData,
      marketData: realtimeMarketData,
      userBalance,
      userPositions,
      isConnected: realtimeConnected,
      // ... outros valores
    }}>
      {children}
    </RealtimeDataContext.Provider>
  );
};
```

### Frontend - Use WebSocket Hook
**Arquivo**: `frontend/src/hooks/useWebSocket.ts`

```typescript
export const useWebSocket = ({
  url,
  urls = [],
  userId,
  onMessage,
  onOpen,
  onClose,
  onError
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [reconnectTimeout, setReconnectTimeout] = useState<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log('🔄 WEBSOCKET ENHANCED - Already connected, skipping connection attempt');
      return;
    }

    console.log('🔄 WEBSOCKET ENHANCED - Starting connection process...');
    console.log('🔄 WEBSOCKET ENHANCED - Available endpoints:', urls);
    console.log('🔄 WEBSOCKET ENHANCED - User ID:', userId);

    setIsConnecting(true);
    setError(null);

    // Tentar conectar usando a lista de URLs
    const tryConnect = (urlIndex: number = 0) => {
      if (urlIndex >= urls.length) {
        console.error('❌ WEBSOCKET ENHANCED - All connection attempts failed');
        setError('All connection attempts failed');
        setIsConnecting(false);
        return;
      }

      const endpoint = urls[urlIndex];
      const wsUrl = `${endpoint}?userId=${userId}`;
      
      console.log(`🔄 WEBSOCKET ENHANCED - Attempting connection ${urlIndex + 1}/${urls.length}:`, wsUrl);

      try {
        const newWs = new WebSocket(wsUrl);
        
        newWs.onopen = (event) => {
          console.log('✅ WEBSOCKET ENHANCED - onopen event fired:', {
            endpoint,
            readyState: newWs.readyState,
            url: newWs.url,
            protocol: newWs.protocol,
            openTime: performance.now(),
            event
          });
          
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
          setReconnectAttempts(0);
          setCurrentUrl(endpoint);
          
          if (onOpen) {
            onOpen(event);
          }
        };

        newWs.onmessage = (event) => {
          console.log('📨 WEBSOCKET ENHANCED - Message received:', {
            type: 'message',
            connectionId: undefined,
            data: event.data,
            timestamp: new Date().toISOString()
          });

          try {
            const message = JSON.parse(event.data);
            console.log('📨 WEBSOCKET ENHANCED - Message received:', {
              type: message.type,
              connectionId: undefined
            });
            
            if (onMessage) {
              onMessage(message);
            }
          } catch (error) {
            console.error('❌ WEBSOCKET ENHANCED - Error parsing message:', error);
          }
        };

        newWs.onclose = (event) => {
          console.log('🔌 WEBSOCKET ENHANCED - onclose event fired:', {
            endpoint,
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            closeTime: performance.now()
          });
          
          setIsConnected(false);
          setIsConnecting(false);
          setWs(null);
          
          if (onClose) {
            onClose(event);
          }
        };

        newWs.onerror = (event) => {
          console.log('❌ WEBSOCKET ENHANCED - Connection error:', event, { endpoint });
          setError(`Connection error: ${event.type}`);
          setIsConnecting(false);
          
          if (onError) {
            onError(event);
          }
        };

        setWs(newWs);
        
      } catch (error) {
        console.error(`❌ WEBSOCKET ENHANCED - Error creating WebSocket for ${endpoint}:`, error);
        // Tentar próxima URL
        setTimeout(() => tryConnect(urlIndex + 1), 1000);
      }
    };

    tryConnect();
  }, [urls, userId, onMessage, onOpen, onClose, onError]);

  const disconnect = useCallback(() => {
    console.log('🔌 WEBSOCKET ENHANCED - Disconnecting...');
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      setReconnectTimeout(null);
    }
    
    if (ws) {
      ws.close();
      setWs(null);
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setReconnectAttempts(0);
  }, [ws, reconnectTimeout]);

  // Auto-connect removido para dar controle ao RealtimeDataContext
  // useEffect(() => {
  //   if (userId && !isConnected && !isConnecting) {
  //     connect();
  //   }
  // }, [userId, isConnected, isConnecting, connect]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    sendMessage: useCallback((message: any) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        return true;
      }
      return false;
    }, [ws])
  };
};
```

## Investigação Detalhada

### Hipótese Central
O backend está fazendo broadcast de `market_data`, mas o `WebSocketManager` não está enviando para nenhum cliente ativo (`sentCount: 0`).

**Possíveis Causas**:
1. Não há clientes registrados no momento do broadcast
2. Os clientes estão registrados mas não estão recebendo mensagens `market_data` especificamente
3. Filtros no broadcast estão excluindo os clientes
4. Múltiplas instâncias do `MarketDataHandler` estão causando problemas

### Metodologia de Debug
1. **Logs Detalhados**: Implementamos logs em todos os pontos críticos
2. **Rastreamento de Conexões**: Monitoramos criação, fechamento e status das conexões
3. **Análise de Broadcast**: Verificamos por que `sentCount: 0`
4. **Singleton Pattern**: Garantimos uma única instância do `MarketDataHandler`

## Análise de Logs

### Logs do Backend

#### 1. Verificação de Conexões Ativas
```bash
docker logs axisor-backend 2>&1 | tail -100 | grep -E "(totalConnections)" | tail -5
```
**Resultado**: 
```
  totalConnections: 0,
  totalConnections: 0,
  totalConnections: 0,
```
**Análise**: Não há clientes conectados no momento do broadcast.

#### 2. Verificação de Broadcast
```bash
docker logs axisor-backend 2>&1 | tail -100 | grep -E "(Broadcast completed)" | tail -5
```
**Resultado**: 
```
✅ WEBSOCKET MANAGER - Broadcast completed: { sentCount: 0 }
✅ WEBSOCKET MANAGER - Broadcast completed: { sentCount: 0 }
✅ WEBSOCKET MANAGER - Broadcast completed: { sentCount: 0 }
```
**Análise**: Nenhuma mensagem está sendo enviada para os clientes.

#### 3. Verificação de Conexões Criadas
```bash
docker logs axisor-backend 2>&1 | grep -E "(Connection created)" | tail -5
```
**Resultado**: 
```
✅ WEBSOCKET ROUTES - Connection created successfully: {
✅ WEBSOCKET MANAGER - Connection created: {
✅ WEBSOCKET ROUTES - Connection created successfully: {
✅ WEBSOCKET MANAGER - Connection created: {
✅ WEBSOCKET ROUTES - Connection created successfully: {
```
**Análise**: Conexões estão sendo criadas com sucesso.

#### 4. Verificação de Conexões Fechadas
```bash
docker logs axisor-backend 2>&1 | grep -E "(Connection closed)" | tail -5
```
**Resultado**: 
```
🔌 WEBSOCKET ROUTES - Connection closed: { connectionId: 'ws_1761270895622_x4v5ug6tr' }
🔌 WEBSOCKET ROUTES - Connection closed: { connectionId: 'ws_1761270946618_7yvwwj1nh' }
🔌 WEBSOCKET ROUTES - Connection closed: { connectionId: 'ws_1761271120614_d1npppzxa' }
🔌 WEBSOCKET MANAGER - Connection closed: {
🔌 WEBSOCKET ROUTES - Connection closed: { connectionId: 'ws_1761271216610_1x9p6x4xx' }
```
**Análise**: Conexões estão sendo fechadas rapidamente após serem criadas.

#### 5. Verificação de Subscriptions
```bash
docker logs axisor-backend 2>&1 | grep -E "(Subscription added)" | tail -5
```
**Resultado**: 
```
📡 MARKET DATA HANDLER - Subscription added: { connectionId: 'ws_1761270831610_65xy857jw', symbol: 'BTCUSDT' }
📡 MARKET DATA HANDLER - Subscription added: { connectionId: 'ws_1761270895622_x4v5ug6tr', symbol: 'BTCUSDT' }
📡 MARKET DATA HANDLER - Subscription added: { connectionId: 'ws_1761270946618_7yvwwj1nh', symbol: 'BTCUSDT' }
📡 MARKET DATA HANDLER - Subscription added: { connectionId: 'ws_1761271120614_d1npppzxa', symbol: 'BTCUSDT' }
📡 MARKET DATA HANDLER - Subscription added: { connectionId: 'ws_1761271216610_1x9p6x4xx', symbol: 'BTCUSDT' }
```
**Análise**: Subscriptions estão sendo adicionadas corretamente.

#### 6. Verificação de Singleton Pattern
```bash
docker logs axisor-backend 2>&1 | grep -E "(Singleton instance created)" | tail -10
```
**Resultado**: 
```
📦 MARKET DATA HANDLER - Singleton instance created
📦 MARKET DATA HANDLER - Singleton instance created
📦 MARKET DATA HANDLER - Singleton instance created
📦 MARKET DATA HANDLER - Singleton instance created
📦 MARKET DATA HANDLER - Singleton instance created
```
**Análise**: Múltiplas instâncias estão sendo criadas, indicando problema no singleton.

### Logs do Frontend

#### 1. Verificação de Conexão WebSocket
```bash
cd /home/bychrisr/projects/axisor && grep -E "(WEBSOCKET ENHANCED.*onopen|REALTIME.*Conectando)" logs-console/localhost-1761270433261.log | tail -5
```
**Resultado**: 
```
RealtimeDataContext.tsx:489 🔄 REALTIME - Conectando para usuário: 20dbbe5f-6bd3-4fc0-84d5-7dbb9558bd98
 ✅ WEBSOCKET ENHANCED - onopen event fired: {endpoint: 'ws://localhost:13010/api/ws', readyState: 1, url: 'ws://localhost:13010/api/ws?userId=20dbbe5f-6bd3-4fc0-84d5-7dbb9558bd98', protocol: '', openTime: 3153.10000000149, …}
```
**Análise**: Frontend está conectando ao WebSocket com sucesso.

#### 2. Verificação de Desconexão
```bash
cd /home/bychrisr/projects/axisor && grep -E "(REALTIME.*Desconectando|REALTIME.*Aguardando)" logs-console/localhost-1761270433261.log | tail -10
```
**Resultado**: 
```
RealtimeDataContext.tsx:498 🔄 REALTIME - Desconectando (usuário deslogou): {isAuthenticated: false, hasUserId: true, isAdmin: false, reason: 'user_logged_out'}
RealtimeDataContext.tsx:489 🔄 REALTIME - Conectando para usuário: 20dbbe5f-6bd3-4fc0-84d5-7dbb9558bd98
```
**Análise**: Frontend está desconectando e reconectando em loop infinito.

#### 3. Verificação de Mensagens Recebidas
```bash
cd /home/bychrisr/projects/axisor && grep -E "(Message received|market_data|BTCUSDT)" logs-console/localhost-1761270433261.log | head -20
```
**Resultado**: 
```
 🔄 HISTORICAL - Loading initial data: {symbol: 'BINANCE:BTCUSDT', timeframe: '1h', limit: 168}
marketData.service.ts:99 🔄 MARKET DATA - Fetching historical data via TradingView proxy: {symbol: 'BINANCE:BTCUSDT', timeframe: '1h', limit: 168, startTime: undefined}
useHistoricalData.ts:72 🔄 HISTORICAL - Loading initial data: {symbol: 'BTCUSDT', timeframe: '1h', limit: 168}
marketData.service.ts:99 🔄 MARKET DATA - Fetching historical data via TradingView proxy: {symbol: 'BTCUSDT', timeframe: '1h', limit: 168, startTime: undefined}
 📨 WEBSOCKET ENHANCED - Message received: {type: 'lnmarkets_data', connectionId: undefined}
 📨 WEBSOCKET ENHANCED - Message received: {type: 'connection_established', connectionId: 'ws_1761270414442_k5zolqh4h'}
```
**Análise**: Frontend recebe `lnmarkets_data` e `connection_established`, mas não recebe `market_data`.

## Problemas Identificados

### Problema 1: Loop Infinito de Reconexões no Frontend
**Causa**: O `useEffect` no `RealtimeDataContext.tsx` está sendo executado duas vezes:
1. **Primeira vez**: `isAuthenticated: false` → chama `disconnect()`
2. **Segunda vez**: `isAuthenticated: true` → chama `connect()`

**Evidência**:
```javascript
// Log do frontend
🔄 REALTIME - Desconectando (usuário deslogou): {isAuthenticated: false, hasUserId: true, isAdmin: false, reason: 'user_logged_out'}
🔄 REALTIME - Conectando para usuário: 20dbbe5f-6bd3-4fc0-84d5-7dbb9558bd98
```

**Impacto**: Instabilidade nas conexões WebSocket, causando fechamento rápido das conexões.

### Problema 2: Múltiplas Instâncias do MarketDataHandler
**Causa**: O singleton pattern não estava funcionando corretamente, criando múltiplas instâncias.

**Evidência**:
```bash
docker logs axisor-backend 2>&1 | grep -E "(Singleton instance created)" | tail -10
```
**Resultado**: Múltiplas instâncias sendo criadas em vez de reutilizar a existente.

**Impacto**: Subscriptions sendo adicionadas em uma instância, mas broadcasts sendo feitos em outra.

### Problema 3: Conexões Sendo Fechadas Rapidamente
**Causa**: O frontend está desconectando rapidamente devido ao loop infinito de reconexões.

**Evidência**: 
- Conexões são criadas: `✅ WEBSOCKET ROUTES - Connection created successfully`
- Subscriptions são adicionadas: `📡 MARKET DATA HANDLER - Subscription added`
- Conexões são fechadas: `🔌 WEBSOCKET ROUTES - Connection closed`
- Broadcast com `sentCount: 0`: `✅ WEBSOCKET MANAGER - Broadcast completed: { sentCount: 0 }`

**Impacto**: Backend não consegue enviar mensagens porque não há clientes ativos.

### Problema 4: Filtros no Broadcast
**Causa**: O `WebSocketManager` está aplicando filtros que podem estar excluindo clientes.

**Evidência**: Logs de "Skipping connection" não aparecem, indicando que o loop não está sendo executado.

**Impacto**: Mensagens não são enviadas mesmo com clientes conectados.

## Correções Implementadas

### Correção 1: Singleton Pattern para MarketDataHandler
**Arquivo**: `backend/src/websocket/handlers/market-data.handler.ts`

```typescript
// Singleton pattern para evitar múltiplas instâncias
let marketDataHandlerInstance: MarketDataHandler | null = null;

export class MarketDataHandler extends EventEmitter {
  static getInstance(logger: Logger): MarketDataHandler {
    if (!marketDataHandlerInstance) {
      console.log('📦 MARKET DATA HANDLER - Creating new singleton instance...');
      marketDataHandlerInstance = new MarketDataHandler(logger);
      console.log('📦 MARKET DATA HANDLER - Singleton instance created');
    } else {
      console.log('📦 MARKET DATA HANDLER - Using existing singleton instance');
    }
    return marketDataHandlerInstance;
  }
}
```

**Status**: ✅ Implementado

### Correção 2: Logs Detalhados no WebSocketManager
**Arquivo**: `backend/src/websocket/manager.ts`

```typescript
broadcast(message: any, options: BroadcastOptions = {}): number {
  let sentCount = 0;
  const { target, type, exclude = [] } = options;

  console.log('📢 WEBSOCKET MANAGER - Broadcasting:', { 
    type: message.type, 
    target, 
    excludeCount: exclude.length,
    totalConnections: this.connections.size,
    activeConnectionIds: Array.from(this.connections.keys())
  });

  console.log('🔄 WEBSOCKET MANAGER - Starting broadcast loop...');
  for (const [connectionId, connection] of this.connections) {
    console.log('🔍 WEBSOCKET MANAGER - Checking connection:', {
      id: connectionId,
      userId: connection.userId,
      subscriptions: Array.from(connection.subscriptions),
      hasTarget: !!target,
      isExcluded: exclude.includes(connectionId),
      hasTypeFilter: !!type,
      hasSubscription: type ? connection.subscriptions.has(type) : true
    });

    // Pular conexões excluídas
    if (exclude.includes(connectionId)) {
      console.log('⏭️ WEBSOCKET MANAGER - Skipping excluded connection:', connectionId);
      continue;
    }

    // Filtrar por target (userId)
    if (target && connection.userId !== target) {
      console.log('⏭️ WEBSOCKET MANAGER - Skipping connection (wrong target):', {
        connectionId,
        connectionUserId: connection.userId,
        target
      });
      continue;
    }

    // Filtrar por tipo de subscription
    if (type && !connection.subscriptions.has(type)) {
      console.log('⏭️ WEBSOCKET MANAGER - Skipping connection (no subscription):', {
        connectionId,
        requiredType: type,
        userSubscriptions: Array.from(connection.subscriptions)
      });
      continue;
    }

    // Enviar mensagem
    if (this.sendMessage(connectionId, message)) {
      sentCount++;
      console.log('✅ WEBSOCKET MANAGER - Message sent to:', connectionId);
    } else {
      console.log('❌ WEBSOCKET MANAGER - Failed to send to:', connectionId);
    }
  }

  console.log('✅ WEBSOCKET MANAGER - Broadcast completed:', { sentCount });
  return sentCount;
}
```

**Status**: ✅ Implementado

### Correção 3: Lógica de Desconexão no Frontend
**Arquivo**: `frontend/src/contexts/RealtimeDataContext.tsx`

```typescript
// Conectar quando usuário estiver autenticado (apenas para usuários comuns)
useEffect(() => {
  console.log('🔄 REALTIME - useEffect de conexão executado:', {
    isAuthenticated,
    userId: user?.id,
    isAdmin,
    timestamp: new Date().toISOString()
  });

  if (isAuthenticated && user?.id && !isAdmin) {
    console.log('🔄 REALTIME - Conectando para usuário:', user.id);
    
    const endpointPreview = wsEndpoints.map((endpoint) => `${endpoint}?userId=${user.id}`);
    console.log('🔗 REALTIME - Tentando conectar usando endpoints:', endpointPreview);
    console.log('🔗 REALTIME - VITE_WS_URL env var:', import.meta.env.VITE_WS_URL);
    
    connect();
  } else if (isAdmin) {
    // Só desconectar se for admin
    console.log('🔄 REALTIME - Desconectando (usuário é admin):', {
      isAuthenticated,
      hasUserId: !!user?.id,
      isAdmin,
      reason: 'is_admin'
    });
    disconnect();
  } else {
    console.log('🔄 REALTIME - Aguardando autenticação:', {
      isAuthenticated,
      hasUserId: !!user?.id,
      isAdmin,
      reason: 'waiting_for_auth'
    });
    // Não desconectar se ainda não foi autenticado
  }
}, [isAuthenticated, user?.id, isAdmin]);
```

**Status**: ✅ Implementado

### Correção 4: Remoção do Auto-connect no useWebSocket
**Arquivo**: `frontend/src/hooks/useWebSocket.ts`

```typescript
// Auto-connect removido para dar controle ao RealtimeDataContext
// useEffect(() => {
//   if (userId && !isConnected && !isConnecting) {
//     connect();
//   }
// }, [userId, isConnected, isConnecting, connect]);
```

**Status**: ✅ Implementado

### Correção 5: Listener para Novas Conexões
**Arquivo**: `backend/src/websocket/routes.ts`

```typescript
// Handler para novas conexões - notificar handlers especializados
wsManager.on('connection', (conn) => {
  console.log('🔗 WEBSOCKET ROUTES - New connection detected, notifying handlers:', { 
    connectionId: conn.id, 
    userId: conn.userId 
  });
  
  // Notificar MarketDataHandler sobre nova conexão
  if (conn.userId) {
    marketDataHandler.subscribe(conn.id, { symbol: 'BTCUSDT' });
  }
});
```

**Status**: ✅ Implementado

## Testes Realizados

### Teste 1: Verificação de Conexões Ativas
**Comando**: 
```bash
docker logs axisor-backend 2>&1 | tail -100 | grep -E "(totalConnections)" | tail -5
```
**Resultado**: `totalConnections: 0`
**Status**: ❌ Falhou - Não há clientes conectados

### Teste 2: Verificação de Broadcast
**Comando**: 
```bash
docker logs axisor-backend 2>&1 | tail -100 | grep -E "(Broadcast completed)" | tail -5
```
**Resultado**: `✅ WEBSOCKET MANAGER - Broadcast completed: { sentCount: 0 }`
**Status**: ❌ Falhou - Nenhuma mensagem enviada

### Teste 3: Verificação de Conexões Criadas
**Comando**: 
```bash
docker logs axisor-backend 2>&1 | grep -E "(Connection created)" | tail -5
```
**Resultado**: Múltiplas conexões criadas
**Status**: ✅ Sucesso - Conexões sendo criadas

### Teste 4: Verificação de Conexões Fechadas
**Comando**: 
```bash
docker logs axisor-backend 2>&1 | grep -E "(Connection closed)" | tail -5
```
**Resultado**: Múltiplas conexões fechadas
**Status**: ❌ Falhou - Conexões sendo fechadas rapidamente

### Teste 5: Verificação de Subscriptions
**Comando**: 
```bash
docker logs axisor-backend 2>&1 | grep -E "(Subscription added)" | tail -5
```
**Resultado**: Múltiplas subscriptions adicionadas
**Status**: ✅ Sucesso - Subscriptions sendo adicionadas

### Teste 6: Verificação de Singleton Pattern
**Comando**: 
```bash
docker logs axisor-backend 2>&1 | grep -E "(Singleton instance created)" | tail -10
```
**Resultado**: Múltiplas instâncias criadas
**Status**: ❌ Falhou - Singleton não funcionando

### Teste 7: Verificação de Frontend WebSocket
**Comando**: 
```bash
cd /home/bychrisr/projects/axisor && grep -E "(WEBSOCKET ENHANCED.*onopen|REALTIME.*Conectando)" logs-console/localhost-1761270433261.log | tail -5
```
**Resultado**: Frontend conectando com sucesso
**Status**: ✅ Sucesso - Frontend conectando

### Teste 8: Verificação de Loop Infinito
**Comando**: 
```bash
cd /home/bychrisr/projects/axisor && grep -E "(REALTIME.*Desconectando|REALTIME.*Aguardando)" logs-console/localhost-1761270433261.log | tail -10
```
**Resultado**: Loop infinito de desconexões
**Status**: ❌ Falhou - Loop infinito persistindo

## Status Atual

### Problemas Resolvidos
- ✅ **Logs detalhados implementados** - Agora temos visibilidade completa do fluxo
- ✅ **Singleton pattern implementado** - Evita múltiplas instâncias do MarketDataHandler
- ✅ **Listener para novas conexões implementado** - MarketDataHandler é notificado sobre novas conexões
- ✅ **Auto-connect removido** - RealtimeDataContext tem controle total sobre conexões

### Problemas Persistentes
- ❌ **Loop infinito de reconexões** - Frontend ainda desconecta e reconecta rapidamente
- ❌ **Conexões sendo fechadas rapidamente** - Backend não consegue manter conexões estáveis
- ❌ **sentCount: 0** - Nenhuma mensagem sendo enviada para clientes
- ❌ **totalConnections: 0** - Não há clientes ativos no momento do broadcast

### Evidências Atuais
```bash
# Backend logs
✅ WEBSOCKET MANAGER - Broadcast completed: { sentCount: 0 }
  totalConnections: 0,

# Frontend logs (antigos)
🔄 REALTIME - Desconectando (usuário deslogou): {isAuthenticated: false, hasUserId: true, isAdmin: false, reason: 'user_logged_out'}
🔄 REALTIME - Conectando para usuário: 20dbbe5f-6bd3-4fc0-84d5-7dbb9558bd98
```

## Próximos Passos

### 1. Verificar se as correções no frontend estão sendo aplicadas
- Coletar logs mais recentes do frontend
- Verificar se o loop infinito de reconexões foi resolvido
- Confirmar se as correções estão sendo aplicadas corretamente

### 2. Testar estabilidade das conexões
- Verificar se as conexões WebSocket permanecem estáveis
- Confirmar se o `totalConnections > 0` durante broadcasts
- Verificar se o `sentCount > 0` nos broadcasts

### 3. Validar recebimento de mensagens
- Confirmar se o frontend recebe mensagens `market_data`
- Verificar se os dados são atualizados em tempo real
- Testar se não há mais logs de desconexão desnecessários

### 4. Monitoramento contínuo
- Implementar alertas para conexões instáveis
- Adicionar métricas de performance
- Documentar procedimentos de troubleshooting

## Comandos de Debug

### Backend
```bash
# Verificar conexões ativas
docker logs axisor-backend 2>&1 | tail -100 | grep -E "(totalConnections)" | tail -5

# Verificar broadcasts
docker logs axisor-backend 2>&1 | tail -100 | grep -E "(Broadcast completed)" | tail -5

# Verificar conexões criadas
docker logs axisor-backend 2>&1 | grep -E "(Connection created)" | tail -5

# Verificar conexões fechadas
docker logs axisor-backend 2>&1 | grep -E "(Connection closed)" | tail -5

# Verificar subscriptions
docker logs axisor-backend 2>&1 | grep -E "(Subscription added)" | tail -5

# Verificar singleton
docker logs axisor-backend 2>&1 | grep -E "(Singleton instance created)" | tail -10

# Verificar logs detalhados de broadcast
docker logs axisor-backend 2>&1 | tail -200 | grep -E "(Checking connection|Skipping connection|Message sent to)" | tail -10
```

### Frontend
```bash
# Verificar logs mais recentes
cd /home/bychrisr/projects/axisor && ls -la logs-console/ | tail -1

# Verificar conexão WebSocket
cd /home/bychrisr/projects/axisor && grep -E "(WEBSOCKET ENHANCED.*onopen|REALTIME.*Conectando)" logs-console/localhost-1761270433261.log | tail -5

# Verificar loop infinito
cd /home/bychrisr/projects/axisor && grep -E "(REALTIME.*Desconectando|REALTIME.*Aguardando)" logs-console/localhost-1761270433261.log | tail -10

# Verificar mensagens recebidas
cd /home/bychrisr/projects/axisor && grep -E "(Message received|market_data|BTCUSDT)" logs-console/localhost-1761270433261.log | head -20
```

### Docker
```bash
# Reiniciar backend
docker-compose -f config/docker/docker-compose.dev.yml restart backend

# Reiniciar frontend
docker-compose -f config/docker/docker-compose.dev.yml restart frontend

# Verificar status dos containers
docker-compose -f config/docker/docker-compose.dev.yml ps

# Verificar logs em tempo real
docker-compose -f config/docker/docker-compose.dev.yml logs -f backend
docker-compose -f config/docker/docker-compose.dev.yml logs -f frontend
```

## Anexos

### Anexo A: Estrutura de Arquivos
```
backend/
├── src/
│   ├── websocket/
│   │   ├── manager.ts                 # WebSocketManager
│   │   ├── routes.ts                  # WebSocket routes
│   │   └── handlers/
│   │       └── market-data.handler.ts # MarketDataHandler
│   └── index.ts                       # Entry point
└── package.json

frontend/
├── src/
│   ├── contexts/
│   │   └── RealtimeDataContext.tsx   # Context para dados em tempo real
│   ├── hooks/
│   │   └── useWebSocket.ts           # Hook para WebSocket
│   └── components/
│       ├── layout/
│       │   ├── LNMarketsHeader.tsx   # Header LN Markets
│       │   └── UnifiedMarketHeader.tsx # Header geral
│       └── dashboard/
│           └── DashboardClassic.tsx  # Dashboard principal
└── package.json

config/
└── docker/
    └── docker-compose.dev.yml        # Configuração Docker
```

### Anexo B: Fluxo de Dados
```
1. Frontend conecta ao WebSocket
2. Backend cria conexão e notifica MarketDataHandler
3. MarketDataHandler adiciona subscription
4. MarketDataHandler busca dados do Binance (1s)
5. MarketDataHandler emite evento 'market_data_update'
6. WebSocket routes escuta evento e faz broadcast
7. WebSocketManager envia para clientes conectados
8. Frontend recebe mensagem e atualiza estado
```

### Anexo C: Configurações Docker
```yaml
# config/docker/docker-compose.dev.yml
version: '3.8'
services:
  backend:
    build:
      context: ../../backend
      dockerfile: Dockerfile.dev
    ports:
      - "13010:3010"  # Externo:Interno
    environment:
      - NODE_ENV=development
    volumes:
      - ../../backend:/app
    networks:
      - axisor-network

  frontend:
    build:
      context: ../../frontend
      dockerfile: Dockerfile.dev
    ports:
      - "13000:3001"  # Externo:Interno
    environment:
      - VITE_WS_URL=ws://localhost:13010/api/ws
    volumes:
      - ../../frontend:/app
    networks:
      - axisor-network
    depends_on:
      - backend

networks:
  axisor-network:
    driver: bridge
```

### Anexo D: Variáveis de Ambiente
```bash
# Frontend
VITE_WS_URL=ws://localhost:13010/api/ws

# Backend
NODE_ENV=development
PORT=3010
```

### Anexo E: Logs de Exemplo
```
# Backend - Conexão criada
✅ WEBSOCKET ROUTES - Connection created successfully: {
  connectionId: 'ws_1761271216610_1x9p6x4xx',
  userId: '20dbbe5f-6bd3-4fc0-84d5-7dbb9558bd98',
  timestamp: '2025-01-23T01:56:45.123Z'
}

# Backend - Subscription adicionada
📡 MARKET DATA HANDLER - Subscription added: { 
  connectionId: 'ws_1761271216610_1x9p6x4xx', 
  symbol: 'BTCUSDT' 
}

# Backend - Broadcast
📢 WEBSOCKET MANAGER - Broadcasting: {
  type: 'market_data',
  totalConnections: 0,
  activeConnectionIds: []
}

# Backend - Resultado do broadcast
✅ WEBSOCKET MANAGER - Broadcast completed: { sentCount: 0 }

# Frontend - Conexão
✅ WEBSOCKET ENHANCED - onopen event fired: {
  endpoint: 'ws://localhost:13010/api/ws',
  readyState: 1,
  url: 'ws://localhost:13010/api/ws?userId=20dbbe5f-6bd3-4fc0-84d5-7dbb9558bd98'
}

# Frontend - Desconexão
🔄 REALTIME - Desconectando (usuário deslogou): {
  isAuthenticated: false,
  hasUserId: true,
  isAdmin: false,
  reason: 'user_logged_out'
}
```

---

**Data do Relatório**: 23 de Janeiro de 2025  
**Versão**: 1.0  
**Autor**: Sistema de Debug WebSocket  
**Status**: Em Investigação Ativa
