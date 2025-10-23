# Cliente HTTP Centralizado

## Visão Geral

O `CentralizedHTTPClient` é um serviço centralizado para todas as requisições HTTP externas na plataforma Axisor. Ele fornece funcionalidades avançadas como rate limiting, retry automático, logging estruturado e tratamento de erros padronizado.

## Características Principais

### 🔄 **Rate Limiting Inteligente**
- Controle automático de taxa de requisições por endpoint
- Janelas de tempo configuráveis
- Prevenção de bloqueios por excesso de requisições

### 🔁 **Retry com Backoff Exponencial**
- Tentativas automáticas em caso de falha
- Delay exponencial entre tentativas
- Configuração personalizável de tentativas

### 📊 **Logging Estruturado**
- Logs detalhados de requisições e respostas
- Métricas de performance
- Rastreamento de erros

### ⚙️ **Configuração Flexível**
- Timeouts personalizáveis
- Headers customizáveis
- Configuração por serviço

## Uso Básico

```typescript
import { CentralizedHTTPClient, HTTPClientConfig } from '../services/centralized-http-client.service';
import { Logger } from 'winston';

// Configuração
const config: HTTPClientConfig = {
  baseURL: 'https://api.exchange.com',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  rateLimit: {
    requests: 10,
    window: 60000 // 1 minuto
  },
  headers: {
    'Authorization': 'Bearer token',
    'User-Agent': 'Axisor-Trading-Platform/1.0.0'
  }
};

// Inicialização
const logger = createLogger();
const client = new CentralizedHTTPClient(config, logger);

// Uso
const response = await client.get('/market-data');
const data = response.data;
```

## Métodos Disponíveis

### **GET Request**
```typescript
const response = await client.get<T>('/endpoint', {
  headers: { 'Custom-Header': 'value' },
  timeout: 5000
});
```

### **POST Request**
```typescript
const response = await client.post<T>('/endpoint', {
  data: { key: 'value' },
  headers: { 'Content-Type': 'application/json' }
});
```

### **PUT Request**
```typescript
const response = await client.put<T>('/endpoint', {
  data: { key: 'value' }
});
```

### **DELETE Request**
```typescript
const response = await client.delete<T>('/endpoint');
```

### **PATCH Request**
```typescript
const response = await client.patch<T>('/endpoint', {
  data: { key: 'value' }
});
```

### **Generic Request**
```typescript
const response = await client.request<T>({
  method: 'GET',
  url: '/custom-endpoint',
  data: { key: 'value' },
  headers: { 'Custom-Header': 'value' }
});
```

## Configuração Avançada

### **Rate Limiting**
```typescript
const config: HTTPClientConfig = {
  baseURL: 'https://api.exchange.com',
  rateLimit: {
    requests: 100,        // 100 requisições
    window: 60000         // por minuto
  }
};
```

### **Retry Configuration**
```typescript
const config: HTTPClientConfig = {
  baseURL: 'https://api.exchange.com',
  retries: 5,             // 5 tentativas
  retryDelay: 2000,       // 2 segundos base
  timeout: 15000          // 15 segundos timeout
};
```

### **Headers Customizados**
```typescript
const config: HTTPClientConfig = {
  baseURL: 'https://api.exchange.com',
  headers: {
    'Authorization': 'Bearer token',
    'X-API-Key': 'api-key',
    'User-Agent': 'Axisor-Trading-Platform/1.0.0',
    'Accept': 'application/json'
  }
};
```

## Monitoramento e Estatísticas

### **Rate Limit Status**
```typescript
const status = client.getRateLimitStatus('/endpoint');
console.log({
  count: status.count,           // Requisições feitas
  remaining: status.remaining,   // Requisições restantes
  resetTime: status.resetTime    // Tempo para reset
});
```

### **Clear Rate Limits**
```typescript
// Limpar rate limit de um endpoint específico
client.clearRateLimit('/endpoint');

// Limpar todos os rate limits
client.clearAllRateLimits();
```

### **Update Configuration**
```typescript
client.updateConfig({
  timeout: 20000,
  retries: 5,
  headers: {
    'New-Header': 'value'
  }
});
```

## Tratamento de Erros

O cliente HTTP centralizado integra automaticamente com o `StandardizedErrorHandler`:

```typescript
try {
  const response = await client.get('/endpoint');
  return response.data;
} catch (error) {
  // Erro já tratado pelo StandardizedErrorHandler
  throw error;
}
```

## Integração com Cache

O cliente HTTP centralizado pode ser integrado com o `IntelligentCacheStrategy`:

```typescript
// Exemplo de integração com cache
const cacheKey = `market_data_${symbol}`;
const cachedData = await cacheStrategy.get(cacheKey, 'market_data');

if (cachedData) {
  return cachedData;
}

const response = await client.get(`/market-data/${symbol}`);
await cacheStrategy.set(cacheKey, response.data, 'market_data');

return response.data;
```

## Logs e Monitoramento

### **Logs de Requisição**
```
[INFO] HTTP Request: {
  method: "GET",
  url: "/market-data",
  baseURL: "https://api.exchange.com",
  timeout: 10000
}
```

### **Logs de Resposta**
```
[INFO] HTTP Response: {
  status: 200,
  statusText: "OK",
  url: "/market-data",
  responseTime: "150ms"
}
```

### **Logs de Erro**
```
[ERROR] HTTP Response Error: {
  status: 429,
  statusText: "Too Many Requests",
  url: "/market-data",
  message: "Rate limit exceeded"
}
```

## Configurações por Serviço

### **TradingView Data Service**
```typescript
const tradingViewConfig: HTTPClientConfig = {
  baseURL: process.env.TRADINGVIEW_API_URL,
  timeout: 15000,
  retries: 3,
  rateLimit: {
    requests: 50,
    window: 60000
  },
  headers: {
    'Authorization': `Bearer ${process.env.TRADINGVIEW_TOKEN}`,
    'User-Agent': 'Axisor-Trading-Platform/1.0.0'
  }
};
```

### **LN Markets API**
```typescript
const lnMarketsConfig: HTTPClientConfig = {
  baseURL: process.env.LN_MARKETS_API_URL,
  timeout: 10000,
  retries: 5,
  rateLimit: {
    requests: 10,
    window: 60000
  },
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};
```

### **Binance API**
```typescript
const binanceConfig: HTTPClientConfig = {
  baseURL: process.env.BINANCE_API_URL,
  timeout: 10000,
  retries: 3,
  rateLimit: {
    requests: 1200,
    window: 60000
  },
  headers: {
    'X-MBX-APIKEY': process.env.BINANCE_API_KEY,
    'Content-Type': 'application/json'
  }
};
```

## Boas Práticas

### **1. Configuração por Ambiente**
```typescript
const getConfig = (environment: string): HTTPClientConfig => {
  const baseConfig = {
    timeout: 10000,
    retries: 3,
    rateLimit: { requests: 10, window: 60000 }
  };

  switch (environment) {
    case 'production':
      return { ...baseConfig, timeout: 15000, retries: 5 };
    case 'staging':
      return { ...baseConfig, timeout: 12000, retries: 4 };
    default:
      return baseConfig;
  }
};
```

### **2. Tratamento de Erros Específicos**
```typescript
try {
  const response = await client.get('/endpoint');
  return response.data;
} catch (error) {
  if (error.status === 429) {
    // Rate limit exceeded
    await new Promise(resolve => setTimeout(resolve, 60000));
    return client.get('/endpoint');
  }
  throw error;
}
```

### **3. Monitoramento de Performance**
```typescript
const startTime = Date.now();
const response = await client.get('/endpoint');
const duration = Date.now() - startTime;

if (duration > 5000) {
  logger.warn('Slow API response', {
    endpoint: '/endpoint',
    duration,
    status: response.status
  });
}
```

## Troubleshooting

### **Rate Limit Exceeded**
```typescript
// Verificar status do rate limit
const status = client.getRateLimitStatus('/endpoint');
if (status.remaining === 0) {
  const waitTime = status.resetTime - Date.now();
  await new Promise(resolve => setTimeout(resolve, waitTime));
}
```

### **Timeout Issues**
```typescript
// Aumentar timeout para endpoints lentos
const response = await client.get('/slow-endpoint', {
  timeout: 30000
});
```

### **Connection Issues**
```typescript
// Verificar configuração de retry
const config: HTTPClientConfig = {
  baseURL: 'https://api.exchange.com',
  retries: 5,
  retryDelay: 2000,
  timeout: 15000
};
```

## Métricas e Monitoramento

### **Estatísticas de Rate Limit**
```typescript
const stats = client.getRateLimitStatus('/endpoint');
console.log({
  requestsMade: stats.count,
  requestsRemaining: stats.remaining,
  resetTime: new Date(stats.resetTime)
});
```

### **Configuração Atual**
```typescript
const currentConfig = client.getConfig();
console.log({
  baseURL: currentConfig.baseURL,
  timeout: currentConfig.timeout,
  retries: currentConfig.retries,
  rateLimit: currentConfig.rateLimit
});
```

## Integração com Outros Serviços

### **Com StandardizedErrorHandler**
```typescript
import { StandardizedErrorHandler } from './standardized-error-handler.service';

const errorHandler = new StandardizedErrorHandler(logger);

try {
  const response = await client.get('/endpoint');
  return response.data;
} catch (error) {
  const apiError = errorHandler.handleExternalAPIError(error, {
    service: 'external-api',
    operation: 'get-data'
  });
  throw apiError;
}
```

### **Com IntelligentCacheStrategy**
```typescript
import { IntelligentCacheStrategy } from './intelligent-cache-strategy.service';

const cacheStrategy = new IntelligentCacheStrategy(redis, logger);

const getCachedData = async (key: string) => {
  const cached = await cacheStrategy.get(key, 'market_data');
  if (cached) return cached;

  const response = await client.get(`/market-data/${key}`);
  await cacheStrategy.set(key, response.data, 'market_data');
  return response.data;
};
```

## Conclusão

O `CentralizedHTTPClient` fornece uma base sólida e confiável para todas as requisições HTTP externas na plataforma Axisor. Com suas funcionalidades avançadas de rate limiting, retry automático e logging estruturado, ele garante que as integrações com APIs externas sejam robustas e eficientes.

Para mais informações sobre integração com outros serviços, consulte:
- [StandardizedErrorHandler](./standardized-error-handler.md)
- [IntelligentCacheStrategy](./intelligent-cache-strategy.md)
- [WebSocketManagerOptimized](./websocket-manager-optimized.md)
