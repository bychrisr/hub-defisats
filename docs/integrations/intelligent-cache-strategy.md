# Estratégia de Cache Inteligente

## Visão Geral

O `IntelligentCacheStrategy` é um sistema de cache avançado que combina cache em memória e Redis para otimizar o desempenho da plataforma Axisor. Ele oferece diferentes estratégias de eviction, compressão, criptografia e configurações específicas por tipo de dados.

## Características Principais

### 🧠 **Cache Híbrido**
- Cache em memória para acesso rápido
- Redis para persistência e compartilhamento
- Fallback automático entre camadas

### ⚡ **Estratégias de Eviction**
- LRU (Least Recently Used)
- LFU (Least Frequently Used)
- FIFO (First In, First Out)

### 🔒 **Segurança**
- Criptografia opcional para dados sensíveis
- Compressão para otimizar espaço
- TTL diferenciado por tipo de dados

### 📊 **Monitoramento**
- Estatísticas detalhadas
- Métricas de performance
- Health checks

## Frontend Context Caching

Os contextos React implementam cache de dados em memória:

- **PositionsContext**: Cache com refresh a cada 5s
- **MarketDataContext**: Cache com TTL de 2 minutos
- **Invalidação**: Automática em mudanças de conta ou logout

Estratégia: Single Source of Truth evita inconsistências

## Configurações por Tipo de Dados

### **Market Data (Dados de Mercado)**
```typescript
const marketDataConfig: CacheConfig = {
  ttl: 30000,           // 30 segundos
  maxSize: 1000,        // 1000 entradas
  strategy: 'LRU',      // Least Recently Used
  compression: true,    // Comprimido
  encryption: false     // Não criptografado
};
```

### **User Data (Dados do Usuário)**
```typescript
const userDataConfig: CacheConfig = {
  ttl: 300000,         // 5 minutos
  maxSize: 500,        // 500 entradas
  strategy: 'LRU',     // Least Recently Used
  compression: true,    // Comprimido
  encryption: true     // Criptografado
};
```

### **Exchange Data (Dados de Exchange)**
```typescript
const exchangeDataConfig: CacheConfig = {
  ttl: 60000,         // 1 minuto
  maxSize: 200,       // 200 entradas
  strategy: 'LRU',    // Least Recently Used
  compression: true,   // Comprimido
  encryption: false   // Não criptografado
};
```

### **Historical Data (Dados Históricos)**
```typescript
const historicalDataConfig: CacheConfig = {
  ttl: 3600000,       // 1 hora
  maxSize: 100,       // 100 entradas
  strategy: 'LFU',    // Least Frequently Used
  compression: true,   // Comprimido
  encryption: false   // Não criptografado
};
```

### **Credentials (Credenciais)**
```typescript
const credentialsConfig: CacheConfig = {
  ttl: 1800000,       // 30 minutos
  maxSize: 50,        // 50 entradas
  strategy: 'LRU',    // Least Recently Used
  compression: false,  // Não comprimido
  encryption: true    // Criptografado
};
```

## Uso Básico

```typescript
import { IntelligentCacheStrategy, CacheConfig } from '../services/intelligent-cache-strategy.service';
import { Logger } from 'winston';
import Redis from 'ioredis';

// Inicialização
const redis = new Redis(process.env.REDIS_URL);
const logger = createLogger();
const cacheStrategy = new IntelligentCacheStrategy(redis, logger);

// Uso básico
await cacheStrategy.set('key', data, 'market_data');
const cachedData = await cacheStrategy.get('key', 'market_data');
```

## Operações de Cache

### **Set (Armazenar)**
```typescript
// Armazenar dados
await cacheStrategy.set('user_123', userData, 'user_data');

// Com configuração personalizada
const customConfig: CacheConfig = {
  ttl: 600000,        // 10 minutos
  maxSize: 100,
  strategy: 'LFU',
  compression: true,
  encryption: true
};

cacheStrategy.setConfig('custom_type', customConfig);
await cacheStrategy.set('custom_key', data, 'custom_type');
```

### **Get (Recuperar)**
```typescript
// Recuperar dados
const data = await cacheStrategy.get('user_123', 'user_data');

// Verificar se existe
if (data) {
  console.log('Data found in cache:', data);
} else {
  console.log('Data not found, fetching from source...');
}
```

### **Delete (Remover)**
```typescript
// Remover dados específicos
await cacheStrategy.delete('user_123', 'user_data');
```

### **Clear (Limpar)**
```typescript
// Limpar por tipo
await cacheStrategy.clearType('market_data');

// Limpar tudo
await cacheStrategy.clearAll();
```

## Configuração Avançada

### **Configuração Personalizada**
```typescript
const customConfig: CacheConfig = {
  ttl: 120000,        // 2 minutos
  maxSize: 500,       // 500 entradas
  strategy: 'LFU',     // Least Frequently Used
  compression: true,   // Comprimido
  encryption: false   // Não criptografado
};

cacheStrategy.setConfig('custom_type', customConfig);
```

### **Configuração por Ambiente**
```typescript
const getCacheConfig = (environment: string): CacheConfig => {
  const baseConfig = {
    ttl: 60000,
    maxSize: 100,
    strategy: 'LRU' as const,
    compression: true,
    encryption: false
  };

  switch (environment) {
    case 'production':
      return { ...baseConfig, ttl: 300000, maxSize: 1000 };
    case 'staging':
      return { ...baseConfig, ttl: 180000, maxSize: 500 };
    default:
      return baseConfig;
  }
};
```

## Estratégias de Eviction

### **LRU (Least Recently Used)**
```typescript
const lruConfig: CacheConfig = {
  ttl: 60000,
  maxSize: 100,
  strategy: 'LRU',    // Remove menos recentemente usado
  compression: true,
  encryption: false
};
```

### **LFU (Least Frequently Used)**
```typescript
const lfuConfig: CacheConfig = {
  ttl: 60000,
  maxSize: 100,
  strategy: 'LFU',    // Remove menos frequentemente usado
  compression: true,
  encryption: false
};
```

### **FIFO (First In, First Out)**
```typescript
const fifoConfig: CacheConfig = {
  ttl: 60000,
  maxSize: 100,
  strategy: 'FIFO',   // Remove primeiro a entrar
  compression: true,
  encryption: false
};
```

## Monitoramento e Estatísticas

### **Estatísticas Gerais**
```typescript
const stats = cacheStrategy.getStats();
console.log({
  hits: stats.hits,           // Cache hits
  misses: stats.misses,      // Cache misses
  evictions: stats.evictions, // Entradas removidas
  size: stats.size,          // Tamanho atual
  memoryUsage: stats.memoryUsage, // Uso de memória
  hitRate: stats.hitRate     // Taxa de acerto (%)
});
```

### **Estatísticas por Tipo**
```typescript
const typeStats = await cacheStrategy.getTypeStats('market_data');
console.log({
  count: typeStats.count,           // Número de entradas
  memoryUsage: typeStats.memoryUsage, // Uso de memória
  keys: typeStats.keys              // Chaves disponíveis
});
```

### **Health Check**
```typescript
const health = await cacheStrategy.healthCheck();
console.log({
  status: health.status,      // 'healthy' ou 'unhealthy'
  details: health.details    // Detalhes do status
});
```

## Cache Warming

### **Warm Up Manual**
```typescript
const marketData = {
  'BTC': { price: 50000, symbol: 'BTC' },
  'ETH': { price: 3000, symbol: 'ETH' },
  'LTC': { price: 200, symbol: 'LTC' }
};

await cacheStrategy.warmUp('market_data', marketData);
```

### **Warm Up Automático**
```typescript
const warmUpCache = async () => {
  // Dados de mercado
  const marketData = await fetchMarketData();
  await cacheStrategy.warmUp('market_data', marketData);

  // Dados de usuário
  const userData = await fetchUserData();
  await cacheStrategy.warmUp('user_data', userData);
};

// Executar warm up a cada 5 minutos
setInterval(warmUpCache, 300000);
```

## Integração com Outros Serviços

### **Com CentralizedHTTPClient**
```typescript
import { CentralizedHTTPClient } from './centralized-http-client.service';

const httpClient = new CentralizedHTTPClient(config, logger);

const getCachedData = async (key: string) => {
  // Tentar cache primeiro
  const cached = await cacheStrategy.get(key, 'market_data');
  if (cached) return cached;

  // Buscar da API
  const response = await httpClient.get(`/market-data/${key}`);
  
  // Armazenar no cache
  await cacheStrategy.set(key, response.data, 'market_data');
  
  return response.data;
};
```

### **Com StandardizedErrorHandler**
```typescript
import { StandardizedErrorHandler } from './standardized-error-handler.service';

const errorHandler = new StandardizedErrorHandler(logger);

try {
  const data = await cacheStrategy.get(key, type);
  return data;
} catch (error) {
  const context = errorHandler.createContext('cache', 'get-data');
  const apiError = errorHandler.handleDatabaseError(error, context);
  throw apiError;
}
```

## Padrões de Uso

### **1. Cache-Aside Pattern**
```typescript
const getData = async (key: string) => {
  // 1. Verificar cache
  let data = await cacheStrategy.get(key, 'market_data');
  
  if (data) {
    return data;
  }
  
  // 2. Buscar da fonte
  data = await fetchFromSource(key);
  
  // 3. Armazenar no cache
  await cacheStrategy.set(key, data, 'market_data');
  
  return data;
};
```

### **2. Write-Through Pattern**
```typescript
const updateData = async (key: string, newData: any) => {
  // 1. Atualizar fonte
  await updateSource(key, newData);
  
  // 2. Atualizar cache
  await cacheStrategy.set(key, newData, 'market_data');
};
```

### **3. Write-Behind Pattern**
```typescript
const updateData = async (key: string, newData: any) => {
  // 1. Atualizar cache imediatamente
  await cacheStrategy.set(key, newData, 'market_data');
  
  // 2. Atualizar fonte em background
  setImmediate(() => updateSource(key, newData));
};
```

## Otimizações de Performance

### **1. Compressão Inteligente**
```typescript
const config: CacheConfig = {
  ttl: 60000,
  maxSize: 1000,
  strategy: 'LRU',
  compression: true,    // Comprimir dados grandes
  encryption: false
};
```

### **2. TTL Diferenciado**
```typescript
// Dados que mudam frequentemente
const volatileConfig: CacheConfig = {
  ttl: 30000,          // 30 segundos
  maxSize: 1000,
  strategy: 'LRU',
  compression: true,
  encryption: false
};

// Dados estáveis
const stableConfig: CacheConfig = {
  ttl: 3600000,        // 1 hora
  maxSize: 100,
  strategy: 'LFU',
  compression: true,
  encryption: false
};
```

### **3. Estratégia de Eviction Otimizada**
```typescript
// Para dados de mercado (acesso frequente)
const marketConfig: CacheConfig = {
  ttl: 30000,
  maxSize: 1000,
  strategy: 'LRU',     // Remove menos recentemente usado
  compression: true,
  encryption: false
};

// Para dados históricos (acesso esporádico)
const historicalConfig: CacheConfig = {
  ttl: 3600000,
  maxSize: 100,
  strategy: 'LFU',     // Remove menos frequentemente usado
  compression: true,
  encryption: false
};
```

## Troubleshooting

### **Cache Miss Alto**
```typescript
// Verificar configuração de TTL
const stats = cacheStrategy.getStats();
if (stats.hitRate < 0.8) {
  console.warn('Low cache hit rate:', stats.hitRate);
  
  // Aumentar TTL ou maxSize
  const config = cacheStrategy.getConfig('market_data');
  config.ttl = config.ttl * 2;
  cacheStrategy.setConfig('market_data', config);
}
```

### **Uso Excessivo de Memória**
```typescript
// Verificar tamanho do cache
const stats = cacheStrategy.getStats();
if (stats.memoryUsage > 1000000) { // 1MB
  console.warn('High memory usage:', stats.memoryUsage);
  
  // Reduzir maxSize
  const config = cacheStrategy.getConfig('market_data');
  config.maxSize = Math.floor(config.maxSize * 0.5);
  cacheStrategy.setConfig('market_data', config);
}
```

### **Redis Connection Issues**
```typescript
// Verificar health do Redis
const health = await cacheStrategy.healthCheck();
if (health.status === 'unhealthy') {
  console.error('Redis connection failed:', health.details);
  
  // Implementar fallback para cache em memória
  const fallbackData = await getFallbackData();
  return fallbackData;
}
```

## Métricas e Monitoramento

### **Métricas de Performance**
```typescript
const performanceMetrics = {
  hitRate: cacheStrategy.getStats().hitRate,
  memoryUsage: cacheStrategy.getStats().memoryUsage,
  evictions: cacheStrategy.getStats().evictions,
  size: cacheStrategy.getStats().size
};

// Enviar para sistema de métricas
metricsService.recordCacheMetrics(performanceMetrics);
```

### **Alertas de Cache**
```typescript
const checkCacheHealth = async () => {
  const stats = cacheStrategy.getStats();
  const health = await cacheStrategy.healthCheck();
  
  if (stats.hitRate < 0.7) {
    alertService.sendAlert('Low cache hit rate', { hitRate: stats.hitRate });
  }
  
  if (health.status === 'unhealthy') {
    alertService.sendAlert('Cache service unhealthy', health.details);
  }
};
```

## Conclusão

O `IntelligentCacheStrategy` é uma solução robusta e flexível para cache na plataforma Axisor. Com suas diferentes estratégias de eviction, configurações específicas por tipo de dados e integração com Redis, ele garante alta performance e eficiência no acesso a dados.

Para mais informações sobre integração com outros serviços, consulte:
- [CentralizedHTTPClient](./centralized-http-client.md)
- [StandardizedErrorHandler](./standardized-error-handler.md)
- [WebSocketManagerOptimized](./websocket-manager-optimized.md)
