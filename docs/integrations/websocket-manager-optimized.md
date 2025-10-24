# WebSocket Manager Otimizado

## Visão Geral

O `WebSocketManagerOptimized` é um gerenciador avançado de conexões WebSocket que oferece funcionalidades como reconexão automática, heartbeat, rate limiting, e gerenciamento de múltiplas conexões simultâneas. Ele é projetado para ser altamente eficiente e confiável para integrações em tempo real.

## Características Principais

### 🔄 **Reconexão Automática**
- Tentativas de reconexão automática
- Backoff exponencial configurável
- Limite máximo de tentativas

### 💓 **Heartbeat Inteligente**
- Ping/Pong automático
- Detecção de conexões mortas
- Timeout configurável

### 📊 **Gerenciamento de Conexões**
- Múltiplas conexões simultâneas
- Identificação única por conexão
- Metadados personalizáveis

### 🚀 **Performance Otimizada**
- Queue de mensagens para conexões offline
- Broadcast eficiente
- Rate limiting por conexão

## Configuração Básica

```typescript
import { WebSocketManagerOptimized, WebSocketConfig } from '../services/websocket-manager-optimized.service';
import { Logger } from 'winston';

// Configuração
const config: WebSocketConfig = {
  url: 'wss://api.exchange.com/ws',
  reconnectInterval: 5000,        // 5 segundos
  maxReconnectAttempts: 5,        // 5 tentativas
  heartbeatInterval: 30000,       // 30 segundos
  timeout: 10000,                 // 10 segundos
  protocols: ['chat', 'superchat'],
  headers: {
    'Authorization': 'Bearer token',
    'User-Agent': 'Axisor-Trading-Platform/1.0.0'
  }
};

// Inicialização
const logger = createLogger();
const manager = new WebSocketManagerOptimized(config, logger);
```

## Gerenciamento de Conexões

### **Criar Conexão**
```typescript
const connectionId = 'user_123_session_456';
const metadata = {
  userId: 'user_123',
  sessionId: 'session_456',
  timestamp: new Date().toISOString()
};

const connection = await manager.createConnection(connectionId, undefined, metadata);
console.log('Connection created:', connection.id, connection.status);
```

### **Enviar Mensagem**
```typescript
const message = {
  type: 'market_data',
  data: { symbol: 'BTC', price: 50000 },
  id: 'msg_123',
  timestamp: Date.now()
};

const sent = await manager.sendMessage(connectionId, message);
if (sent) {
  console.log('Message sent successfully');
} else {
  console.log('Message queued for later delivery');
}
```

### **Broadcast para Múltiplas Conexões**
```typescript
const broadcastMessage = {
  type: 'system_notification',
  data: { message: 'System maintenance in 5 minutes' },
  timestamp: Date.now()
};

const sentCount = await manager.broadcastMessage(broadcastMessage);
console.log(`Message sent to ${sentCount} connections`);
```

## Subscrições e Filtros

### **Subscrever a Tipos de Mensagem**
```typescript
// Subscrever a mensagens de mercado
manager.subscribe(connectionId, 'market_data');

// Subscrever a mensagens de usuário
manager.subscribe(connectionId, 'user_data');

// Subscrever a mensagens de sistema
manager.subscribe(connectionId, 'system_notification');
```

### **Cancelar Subscrição**
```typescript
// Cancelar subscrição a mensagens de mercado
manager.unsubscribe(connectionId, 'market_data');
```

### **Verificar Subscrições**
```typescript
const connection = manager.getConnection(connectionId);
if (connection) {
  console.log('Subscriptions:', Array.from(connection.subscriptions));
}
```

## Eventos e Handlers

### **Eventos de Conexão**
```typescript
// Conexão estabelecida
manager.on('connected', (connection) => {
  console.log('WebSocket connected:', connection.id);
  
  // Enviar mensagem de boas-vindas
  manager.sendMessage(connection.id, {
    type: 'welcome',
    data: { message: 'Connected successfully' },
    timestamp: Date.now()
  });
});

// Conexão perdida
manager.on('disconnected', (connection, code, reason) => {
  console.log('WebSocket disconnected:', connection.id, code, reason);
});

// Erro de conexão
manager.on('error', (connection, error) => {
  console.error('WebSocket error:', connection.id, error.message);
});
```

### **Eventos de Mensagem**
```typescript
// Todas as mensagens
manager.on('message', (connection, message) => {
  console.log('Message received:', message.type, message.data);
});

// Mensagens específicas por tipo
manager.on('message:market_data', (connection, message) => {
  console.log('Market data received:', message.data);
  
  // Processar dados de mercado
  processMarketData(message.data);
});

manager.on('message:user_data', (connection, message) => {
  console.log('User data received:', message.data);
  
  // Processar dados do usuário
  processUserData(message.data);
});
```

### **Eventos de Reconexão**
```typescript
// Falha na reconexão
manager.on('reconnect_failed', (connection) => {
  console.error('Reconnection failed:', connection.id);
  
  // Notificar usuário sobre perda de conexão
  notifyUserConnectionLost(connection.metadata.userId);
});
```

## Configurações Avançadas

### **Configuração por Serviço**
```typescript
// TradingView WebSocket
const tradingViewConfig: WebSocketConfig = {
  url: process.env.TRADINGVIEW_WEBSOCKET_URL,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
  timeout: 10000,
  headers: {
    'User-Agent': 'Axisor-Trading-Platform/1.0.0',
    'Origin': process.env.FRONTEND_URL
  }
};

// LN Markets WebSocket
const lnMarketsConfig: WebSocketConfig = {
  url: process.env.LN_MARKETS_WEBSOCKET_URL,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
  timeout: 10000,
  headers: {
    'Authorization': `Bearer ${token}`,
    'User-Agent': 'Axisor-Trading-Platform/1.0.0'
  }
};

// Binance WebSocket
const binanceConfig: WebSocketConfig = {
  url: process.env.BINANCE_WEBSOCKET_URL,
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
  timeout: 10000,
  headers: {
    'User-Agent': 'Axisor-Trading-Platform/1.0.0'
  }
};
```

### **Configuração por Ambiente**
```typescript
const getWebSocketConfig = (environment: string): WebSocketConfig => {
  const baseConfig = {
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    timeout: 10000
  };

  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        maxReconnectAttempts: 10,
        heartbeatInterval: 60000
      };
    case 'staging':
      return {
        ...baseConfig,
        maxReconnectAttempts: 7,
        heartbeatInterval: 45000
      };
    default:
      return baseConfig;
  }
};
```

## Monitoramento e Estatísticas

### **Estatísticas Gerais**
```typescript
const stats = manager.getStats();
console.log({
  totalConnections: stats.totalConnections,
  activeConnections: stats.activeConnections,
  messagesSent: stats.messagesSent,
  messagesReceived: stats.messagesReceived,
  reconnects: stats.reconnects,
  errors: stats.errors
});
```

### **Estatísticas por Conexão**
```typescript
const connectionStats = manager.getConnectionStats(connectionId);
console.log({
  id: connectionStats.id,
  url: connectionStats.url,
  status: connectionStats.status,
  lastHeartbeat: connectionStats.lastHeartbeat,
  reconnectAttempts: connectionStats.reconnectAttempts,
  subscriptions: connectionStats.subscriptions,
  metadata: connectionStats.metadata
});
```

### **Health Check**
```typescript
const health = await manager.healthCheck();
console.log({
  status: health.status,
  connections: health.connections,
  errors: health.errors
});
```

## Integração com Outros Serviços

### **Com IntelligentCacheStrategy**
```typescript
import { IntelligentCacheStrategy } from './intelligent-cache-strategy.service';

const cacheStrategy = new IntelligentCacheStrategy(redis, logger);

// Cache dados recebidos via WebSocket
manager.on('message:market_data', async (connection, message) => {
  const cacheKey = `market_${message.data.symbol}`;
  await cacheStrategy.set(cacheKey, message.data, 'market_data');
});

manager.on('message:user_data', async (connection, message) => {
  const cacheKey = `user_${connection.metadata.userId}`;
  await cacheStrategy.set(cacheKey, message.data, 'user_data');
});
```

### **Com StandardizedErrorHandler**
```typescript
import { StandardizedErrorHandler } from './standardized-error-handler.service';

const errorHandler = new StandardizedErrorHandler(logger);

manager.on('error', (connection, error) => {
  const context = errorHandler.createContext('websocket', 'connection-error');
  errorHandler.logError(error, context, 'error');
});
```

## Padrões de Uso

### **1. Real-time Market Data**
```typescript
// Subscrever a dados de mercado
manager.subscribe(connectionId, 'market_data');

// Processar dados de mercado
manager.on('message:market_data', (connection, message) => {
  const { symbol, price, volume } = message.data;
  
  // Atualizar interface do usuário
  updateMarketDisplay(symbol, price, volume);
  
  // Cache para acesso rápido
  cacheStrategy.set(`market_${symbol}`, message.data, 'market_data');
});
```

### **2. User Notifications**
```typescript
// Subscrever a notificações do usuário
manager.subscribe(connectionId, 'user_notification');

// Processar notificações
manager.on('message:user_notification', (connection, message) => {
  const { type, title, message: content } = message.data;
  
  // Exibir notificação para o usuário
  showNotification(type, title, content);
});
```

### **3. System Alerts**
```typescript
// Subscrever a alertas do sistema
manager.subscribe(connectionId, 'system_alert');

// Processar alertas
manager.on('message:system_alert', (connection, message) => {
  const { level, message: alertMessage } = message.data;
  
  // Exibir alerta baseado no nível
  switch (level) {
    case 'critical':
      showCriticalAlert(alertMessage);
      break;
    case 'warning':
      showWarningAlert(alertMessage);
      break;
    case 'info':
      showInfoAlert(alertMessage);
      break;
  }
});
```

## Gerenciamento de Conexões

### **Fechar Conexão Específica**
```typescript
await manager.closeConnection(connectionId);
console.log('Connection closed');
```

### **Fechar Todas as Conexões**
```typescript
await manager.closeAllConnections();
console.log('All connections closed');
```

### **Verificar Status da Conexão**
```typescript
const connection = manager.getConnection(connectionId);
if (connection) {
  console.log('Connection status:', connection.status);
  console.log('Last heartbeat:', connection.lastHeartbeat);
  console.log('Reconnect attempts:', connection.reconnectAttempts);
}
```

## Troubleshooting

### **Conexão Não Estabelecida**
```typescript
// Verificar configuração
const config = manager.getConfig();
console.log('WebSocket config:', config);

// Verificar URL
if (!config.url) {
  console.error('WebSocket URL not configured');
}

// Verificar headers
if (!config.headers?.Authorization) {
  console.error('Authorization header missing');
}
```

### **Reconexão Falhando**
```typescript
// Verificar tentativas de reconexão
const connection = manager.getConnection(connectionId);
if (connection) {
  console.log('Reconnect attempts:', connection.reconnectAttempts);
  console.log('Max attempts:', manager.getConfig().maxReconnectAttempts);
  
  if (connection.reconnectAttempts >= manager.getConfig().maxReconnectAttempts) {
    console.error('Max reconnection attempts reached');
  }
}
```

### **Mensagens Não Recebidas**
```typescript
// Verificar subscrições
const connection = manager.getConnection(connectionId);
if (connection) {
  console.log('Subscriptions:', Array.from(connection.subscriptions));
  
  // Verificar se está subscrito ao tipo correto
  if (!connection.subscriptions.has('market_data')) {
    console.warn('Not subscribed to market_data');
    manager.subscribe(connectionId, 'market_data');
  }
}
```

## Métricas e Monitoramento

### **Métricas de Performance**
```typescript
const performanceMetrics = {
  activeConnections: manager.getStats().activeConnections,
  messagesSent: manager.getStats().messagesSent,
  messagesReceived: manager.getStats().messagesReceived,
  errorRate: manager.getStats().errors / manager.getStats().totalConnections
};

// Enviar para sistema de métricas
metricsService.recordWebSocketMetrics(performanceMetrics);
```

### **Alertas de Conexão**
```typescript
const checkConnectionHealth = () => {
  const stats = manager.getStats();
  
  if (stats.activeConnections === 0) {
    alertService.sendAlert('No active WebSocket connections');
  }
  
  if (stats.errorRate > 0.1) {
    alertService.sendAlert('High WebSocket error rate', { errorRate: stats.errorRate });
  }
};
```

## Correções Críticas Implementadas

### **Problemas Resolvidos (2025-10-24)**

#### **1. Assinatura Inexistente para Filtro `{ type: 'market_data' }`**
- **Problema**: `sentCount: 0` em todos os broadcasts
- **Causa**: Assinaturas não registradas no `WebSocketManager`
- **Solução**: Implementado `addSubscription()` e `attachManager()`

#### **2. Singleton Não Sobrevivia a Hot-reload**
- **Problema**: Múltiplas instâncias do `MarketDataHandler`
- **Causa**: Hot-reload reinicializava o módulo
- **Solução**: Singleton usando `globalThis`

#### **3. Frontend com Loop Infinito de Reconexões**
- **Problema**: `useEffect` causando reconexões contínuas
- **Causa**: Dependências instáveis
- **Solução**: FSM estável com guardas e `useRef`

#### **4. Conexões Fechando por Timeouts Silenciosos**
- **Problema**: Conexões sendo fechadas sem logs claros
- **Causa**: Sem heartbeat de aplicação
- **Solução**: Heartbeat implementado (15s)

### **Status Atual**
- ✅ **Conexões Estáveis**: `totalConnections > 0`
- ✅ **Mensagens Enviadas**: `sentCount > 0`
- ✅ **Dados em Tempo Real**: `market_data` chegando no frontend
- ✅ **Singleton Único**: Instância consistente
- ✅ **FSM Estável**: Sem loop infinito

Para detalhes completos das correções, consulte:
- [WebSocket Critical Fixes](./websocket-critical-fixes.md)

## Conclusão

O `WebSocketManagerOptimized` é uma solução robusta e eficiente para gerenciamento de conexões WebSocket na plataforma Axisor. Com suas funcionalidades avançadas de reconexão, heartbeat, e gerenciamento de múltiplas conexões, ele garante comunicação em tempo real confiável e eficiente.

**Última atualização**: 2025-10-24 - Correções cirúrgicas implementadas com sucesso.

Para mais informações sobre integração com outros serviços, consulte:
- [CentralizedHTTPClient](./centralized-http-client.md)
- [StandardizedErrorHandler](./standardized-error-handler.md)
- [IntelligentCacheStrategy](./intelligent-cache-strategy.md)
- [WebSocket Critical Fixes](./websocket-critical-fixes.md)
