# WebSocket Critical Fixes - Correções Cirúrgicas Implementadas

## Visão Geral

Este documento detalha as correções cirúrgicas implementadas para resolver problemas críticos no sistema WebSocket da plataforma Axisor. As correções foram aplicadas seguindo um diagnóstico preciso que identificou as causas raiz dos problemas de conectividade e transmissão de dados em tempo real.

## Problemas Identificados

### 1. **Assinatura Inexistente para Filtro `{ type: 'market_data' }`**
- **Problema**: O `WebSocketManager.broadcast()` com filtro `{ type: 'market_data' }` não enviava mensagens porque as conexões não tinham a assinatura registrada
- **Causa**: O `MarketDataHandler.subscribe()` não registrava a assinatura no `WebSocketManager`
- **Impacto**: `sentCount: 0` em todos os broadcasts, dados não chegavam no frontend

### 2. **Singleton Não Sobrevivia a Hot-reload**
- **Problema**: Múltiplas instâncias do `MarketDataHandler` sendo criadas em desenvolvimento
- **Causa**: Hot-reload (ts-node-dev/nodemon) reinicializava o módulo, criando instâncias separadas
- **Impacto**: Quem assina ≠ quem emite, listeners não executavam

### 3. **Frontend com Loop Infinito de Reconexões**
- **Problema**: `useEffect` causando reconexões contínuas
- **Causa**: Dependências instáveis (`connect`/`disconnect` recriadas a cada render)
- **Impacto**: Conexões sendo fechadas rapidamente, `totalConnections: 0`

### 4. **Conexões Fechando por Timeouts Silenciosos**
- **Problema**: Conexões sendo fechadas sem logs claros
- **Causa**: Proxies/timeouts silenciosos sem heartbeat de aplicação
- **Impacto**: Perda de conexões em produção

## Correções Implementadas

### 1. **Registro de Assinatura no WebSocketManager**

#### **Problema Resolvido**
```typescript
// ANTES: Assinatura não registrada no Manager
subscribe(connectionId: string, data: any): void {
  this.subscribers.add(connectionId);
  // ❌ Não registrava no WebSocketManager
}
```

#### **Solução Implementada**
```typescript
// DEPOIS: Assinatura registrada no Manager
subscribe(connectionId: string, data: any): void {
  this.subscribers.add(connectionId);
  
  // 🔑 REGISTRAR A ASSINATURA NO MANAGER:
  if (this.wsManager && this.wsManager.addSubscription) {
    this.wsManager.addSubscription(connectionId, 'market_data');
  }
}
```

#### **Método `addSubscription` no WebSocketManager**
```typescript
// backend/src/websocket/manager.ts
addSubscription(connectionId: string, topic: string): boolean {
  const conn = this.connections.get(connectionId);
  if (!conn) {
    console.log('⚠️ WEBSOCKET MANAGER - Connection not found for subscription:', { connectionId, topic });
    return false;
  }
  
  if (!conn.subscriptions) {
    conn.subscriptions = new Set();
  }
  
  conn.subscriptions.add(topic);
  
  console.log('📝 WEBSOCKET MANAGER - Subscription added:', {
    connectionId,
    topic,
    totalSubscriptions: conn.subscriptions.size,
    allSubscriptions: Array.from(conn.subscriptions)
  });
  
  return true;
}
```

#### **Anexação do Manager ao Handler**
```typescript
// backend/src/websocket/routes.ts
function setupHandlerConnections(
  wsManager: WebSocketManager,
  marketDataHandler: MarketDataHandler,
  userDataHandler: UserDataHandler,
  positionUpdatesHandler: PositionUpdatesHandler
): void {
  
  // 🔑 ANEXAR MANAGER AO HANDLER:
  marketDataHandler.attachManager(wsManager);
  
  // ... resto da configuração
}
```

### 2. **Singleton Sobrevivendo a Hot-reload**

#### **Problema Resolvido**
```typescript
// ANTES: Singleton não sobrevivia a hot-reload
let marketDataHandlerInstance: MarketDataHandler | null = null;

static getInstance(logger: Logger): MarketDataHandler {
  if (!marketDataHandlerInstance) {
    marketDataHandlerInstance = new MarketDataHandler(logger);
  }
  return marketDataHandlerInstance;
}
```

#### **Solução Implementada**
```typescript
// DEPOIS: Singleton usando globalThis
declare global {
  // eslint-disable-next-line no-var
  var __MARKET_DATA_HANDLER__: MarketDataHandler | undefined;
}

static getInstance(logger: Logger): MarketDataHandler {
  if (!globalThis.__MARKET_DATA_HANDLER__) {
    console.log('📦 MARKET DATA HANDLER - Creating new singleton instance...');
    globalThis.__MARKET_DATA_HANDLER__ = new MarketDataHandler(logger);
    console.log('📦 MARKET DATA HANDLER - Singleton instance created');
  } else {
    console.log('📦 MARKET DATA HANDLER - Using existing singleton instance');
  }
  return globalThis.__MARKET_DATA_HANDLER__;
}
```

### 3. **FSM do Frontend Corrigido**

#### **Problema Resolvido**
```typescript
// ANTES: Loop infinito de reconexões
useEffect(() => {
  if (isAuthenticated && user?.id && !isAdmin) {
    connect();
  } else {
    disconnect(); // ❌ Desconectava compulsivamente
  }
}, [isAuthenticated, user?.id, isAdmin, connect, disconnect]); // ❌ Dependências instáveis
```

#### **Solução Implementada**
```typescript
// DEPOIS: FSM estável com guardas
const didTryRef = useRef(false);

useEffect(() => {
  const ready = isAuthenticated && user?.id && !isAdmin;
  
  if (!ready) {
    // Não desconectar compulsivamente em transições intermediárias
    console.log('🔄 REALTIME - Aguardando autenticação');
    return;
  }
  
  if (isAdmin) {
    // Só desconectar se for admin
    disconnect();
    return;
  }
  
  // Conectar apenas quando estado estiver estável e não tiver tentado ainda
  if (!isConnected && !isConnecting && !didTryRef.current) {
    didTryRef.current = true; // Evita double-connect do StrictMode
    connect();
  }
}, [isAuthenticated, user?.id, isAdmin, isConnected, isConnecting, connect]);
```

#### **Proteção contra Reconexões Concorrentes**
```typescript
// frontend/src/hooks/useWebSocket.ts
const connect = useCallback(() => {
  if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
    console.log('🔌 WEBSOCKET ENHANCED - Already connected or connecting');
    return;
  }
  // ... resto da lógica de conexão
}, []);
```

### 4. **Heartbeat de Aplicação**

#### **Implementação no Frontend**
```typescript
// frontend/src/contexts/RealtimeDataContext.tsx
// Heartbeat de aplicação para evitar closes passivos
useEffect(() => {
  if (!isConnected) return;
  
  const heartbeatInterval = setInterval(() => {
    console.log('💓 REALTIME - Sending heartbeat ping');
    sendMessage({ type: 'ping', ts: Date.now() });
  }, 15000); // 15 segundos
  
  return () => clearInterval(heartbeatInterval);
}, [isConnected, sendMessage]);
```

## Arquivos Modificados

### **Backend**
- `backend/src/websocket/manager.ts` - Adicionado método `addSubscription`
- `backend/src/websocket/handlers/market-data.handler.ts` - Singleton com `globalThis` e registro de assinatura
- `backend/src/websocket/routes.ts` - Anexação do manager ao handler

### **Frontend**
- `frontend/src/contexts/RealtimeDataContext.tsx` - FSM corrigido e heartbeat implementado
- `frontend/src/hooks/useWebSocket.ts` - Proteção contra reconexões concorrentes

## Validação das Correções

### **Evidências de Funcionamento**

#### **1. Assinaturas Registradas**
```bash
📝 WEBSOCKET MANAGER - Subscription added: {
  connectionId: 'ws_1761272531624_d6ge0ires',
  topic: 'market_data',
  totalSubscriptions: 1,
  allSubscriptions: ['market_data']
}
```

#### **2. Singleton Funcionando**
```bash
📦 MARKET DATA HANDLER - Using existing singleton instance
```

#### **3. FSM Estável**
```bash
🔄 REALTIME - Aguardando autenticação
🔄 REALTIME - Conectando para usuário: 20dbbe5f-6bd3-4fc0-84d5-7dbb9558bd98
```

#### **4. Mensagens Chegando**
```bash
📊 REALTIME - Mensagem recebida: {
  type: 'market_data',
  data: { symbol: 'BTCUSDT', price: 110383.6, change24h: 1.903, volume: 17037.5 },
  timestamp: '2025-10-24T02:25:59.205Z',
  userId: '20dbbe5f-6bd3-4fc0-84d5-7dbb9558bd98'
}
```

#### **5. Conexões Estáveis**
```bash
✅ WEBSOCKET ENHANCED - onopen event fired: {
  endpoint: 'ws://localhost:13010/api/ws',
  readyState: 1,
  url: 'ws://localhost:13010/api/ws?userId=20dbbe5f-6bd3-4fc0-84d5-7dbb9558bd98'
}
```

## Impacto das Correções

### **Antes das Correções**
- ❌ `sentCount: 0` em todos os broadcasts
- ❌ `totalConnections: 0` durante broadcasts
- ❌ Loop infinito de reconexões no frontend
- ❌ Múltiplas instâncias do `MarketDataHandler`
- ❌ Dados não chegavam no frontend

### **Depois das Correções**
- ✅ `sentCount > 0` - mensagens sendo enviadas
- ✅ `totalConnections > 0` - conexões ativas
- ✅ FSM estável - sem loop infinito
- ✅ Singleton único - instância consistente
- ✅ Dados chegando em tempo real no frontend

## Monitoramento e Manutenção

### **Logs de Monitoramento**
```bash
# Verificar assinaturas
docker logs axisor-backend | grep "Subscription added"

# Verificar singleton
docker logs axisor-backend | grep "Singleton instance"

# Verificar FSM
docker logs axisor-frontend | grep "REALTIME.*Conectando"

# Verificar mensagens
docker logs axisor-frontend | grep "market_data"
```

### **Métricas de Saúde**
- **Conexões Ativas**: `totalConnections > 0`
- **Mensagens Enviadas**: `sentCount > 0`
- **Singleton**: Apenas "Using existing singleton instance"
- **FSM**: Sem logs de "Desconectando" desnecessários

## Troubleshooting

### **Se `sentCount` voltar a 0**
1. Verificar se `addSubscription` está sendo chamado
2. Verificar se `attachManager` foi executado
3. Verificar se singleton está funcionando

### **Se loop infinito voltar**
1. Verificar dependências do `useEffect`
2. Verificar se `didTryRef` está funcionando
3. Verificar se `connect`/`disconnect` são estáveis

### **Se dados não chegarem**
1. Verificar se WebSocket está conectado
2. Verificar se assinatura está registrada
3. Verificar se `market_data` está sendo emitido

## Conclusão

As correções cirúrgicas implementadas resolveram completamente os problemas críticos do sistema WebSocket:

1. **✅ Assinaturas registradas** - `addSubscription` funcionando
2. **✅ Singleton estável** - `globalThis` sobrevivendo a hot-reload
3. **✅ FSM corrigido** - Sem loop infinito de reconexões
4. **✅ Heartbeat implementado** - Evitando closes passivos
5. **✅ Dados em tempo real** - `market_data` chegando no frontend

O sistema agora está funcionando perfeitamente, com conexões estáveis e dados atualizando em tempo real conforme especificado.

## Referências

- [WebSocket Manager Otimizado](./websocket-manager-optimized.md)
- [Standardized Error Handler](./standardized-error-handler.md)
- [Intelligent Cache Strategy](./intelligent-cache-strategy.md)
- [Centralized HTTP Client](./centralized-http-client.md)
