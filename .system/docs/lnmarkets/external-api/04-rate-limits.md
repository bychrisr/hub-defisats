# LN Markets API v2 - Rate Limits

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 2.0.0  
> **Responsável**: LN Markets API v2  

## Índice

- [Visão Geral](#visão-geral)
- [Limites por Endpoint](#limites-por-endpoint)
- [Headers de Rate Limit](#headers-de-rate-limit)
- [Implementação de Throttling](#implementação-de-throttling)
- [Tratamento de Erros](#tratamento-de-erros)
- [Best Practices](#best-practices)

## Visão Geral

A LN Markets API v2 implementa rate limiting para garantir estabilidade e performance do serviço. Todos os endpoints têm limites específicos que devem ser respeitados.

## Limites por Endpoint

### User Endpoints
- **GET /v2/user**: 60 requests/minute
- **GET /v2/user/deposits/***: 30 requests/minute
- **GET /v2/user/withdrawals**: 30 requests/minute

### Futures Trading
- **GET /v2/futures**: 120 requests/minute
- **POST /v2/futures**: 10 requests/minute
- **DELETE /v2/futures/{id}**: 20 requests/minute
- **GET /v2/futures/history**: 60 requests/minute

### Market Data
- **GET /v2/futures/ticker**: 300 requests/minute
- **GET /v2/futures/index**: 300 requests/minute
- **GET /v2/futures/index/history**: 60 requests/minute

### Swaps
- **GET /v2/swaps**: 60 requests/minute
- **POST /v2/swaps**: 5 requests/minute

### Notificações
- **GET /v2/notifications**: 60 requests/minute

## Headers de Rate Limit

A API retorna headers informativos sobre rate limits:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Window: 60
```

### Descrição dos Headers

- **X-RateLimit-Limit**: Limite máximo de requests por janela
- **X-RateLimit-Remaining**: Requests restantes na janela atual
- **X-RateLimit-Reset**: Timestamp Unix quando a janela reseta
- **X-RateLimit-Window**: Duração da janela em segundos

## Implementação de Throttling

### Cliente com Rate Limiting

```typescript
import axios, { AxiosResponse } from 'axios';

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  window: number;
}

export class RateLimitedClient {
  private rateLimits: Map<string, RateLimitInfo> = new Map();

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    const endpoint = this.getEndpointKey(config.url || '');
    
    // Verificar rate limit
    if (this.isRateLimited(endpoint)) {
      await this.waitForReset(endpoint);
    }

    try {
      const response = await axios(config);
      this.updateRateLimit(endpoint, response.headers);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        await this.handleRateLimitExceeded(endpoint, error.response);
        // Retry após delay
        return this.request(config);
      }
      throw error;
    }
  }

  private getEndpointKey(url: string): string {
    // Agrupar endpoints similares
    if (url.includes('/futures/ticker') || url.includes('/futures/index')) {
      return 'market_data';
    }
    if (url.includes('/futures') && !url.includes('/history')) {
      return 'futures_trading';
    }
    return 'general';
  }

  private isRateLimited(endpoint: string): boolean {
    const info = this.rateLimits.get(endpoint);
    if (!info) return false;
    
    return info.remaining <= 1 && Date.now() < info.reset * 1000;
  }

  private async waitForReset(endpoint: string): Promise<void> {
    const info = this.rateLimits.get(endpoint);
    if (!info) return;

    const waitTime = (info.reset * 1000) - Date.now() + 1000; // +1s buffer
    if (waitTime > 0) {
      console.log(`⏳ Rate limit reached for ${endpoint}, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  private updateRateLimit(endpoint: string, headers: any): void {
    const info: RateLimitInfo = {
      limit: parseInt(headers['x-ratelimit-limit']) || 100,
      remaining: parseInt(headers['x-ratelimit-remaining']) || 99,
      reset: parseInt(headers['x-ratelimit-reset']) || Date.now() + 60000,
      window: parseInt(headers['x-ratelimit-window']) || 60
    };

    this.rateLimits.set(endpoint, info);
  }

  private async handleRateLimitExceeded(endpoint: string, response: AxiosResponse): Promise<void> {
    const retryAfter = response.headers['retry-after'];
    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
    
    console.warn(`🚨 Rate limit exceeded for ${endpoint}, waiting ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}
```

## Tratamento de Erros

### Erro 429 - Too Many Requests

```typescript
try {
  const data = await apiClient.request(config);
  return data;
} catch (error: any) {
  if (error.response?.status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
    
    console.warn(`Rate limit exceeded, retrying after ${waitTime}ms`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Retry a request
    return apiClient.request(config);
  }
  throw error;
}
```

### Circuit Breaker Pattern

```typescript
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private readonly threshold: number = 5;
  private readonly timeout: number = 60000; // 1 minute

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error: any) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    return this.failures >= this.threshold && 
           (Date.now() - this.lastFailureTime) < this.timeout;
  }

  private onSuccess(): void {
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
}
```

## Best Practices

### 1. Implementar Exponential Backoff

```typescript
async function requestWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (error.response?.status === 429 && attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`Retry attempt ${attempt} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 2. Cache de Dados de Mercado

```typescript
class MarketDataCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly ttl: number = 5000; // 5 seconds

  async getTicker(): Promise<any> {
    const cached = this.cache.get('ticker');
    if (cached && (Date.now() - cached.timestamp) < this.ttl) {
      return cached.data;
    }

    const data = await apiClient.getTicker();
    this.cache.set('ticker', { data, timestamp: Date.now() });
    return data;
  }
}
```

### 3. Batch de Requests

```typescript
async function batchRequests<T>(
  requests: Array<() => Promise<T>>,
  batchSize: number = 5
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(request => requestWithBackoff(request))
    );
    results.push(...batchResults);
    
    // Delay entre batches para respeitar rate limits
    if (i + batchSize < requests.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
```

## Monitoramento

### Logs de Rate Limit

```typescript
class RateLimitLogger {
  logRequest(endpoint: string, remaining: number, reset: number): void {
    if (remaining < 10) {
      console.warn(`⚠️ Rate limit warning for ${endpoint}: ${remaining} requests remaining`);
    }
    
    console.debug(`📊 Rate limit status for ${endpoint}: ${remaining}/${limit} remaining, resets at ${new Date(reset * 1000).toISOString()}`);
  }
}
```

## Referências

- [Visão Geral da API](./01-overview.md)
- [Lista de Endpoints](./03-endpoints.md)
- [Implementação Interna](../internal-implementation/01-architecture.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
