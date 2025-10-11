# LND Rate Limits & Throttling - Documentação Completa

**Data de Atualização**: 2025-10-11  
**Versão**: 1.0.0

## 📋 Visão Geral

Esta documentação cobre o sistema de rate limiting implementado para os endpoints LND, incluindo limites por operação, estratégias de throttling, e monitoramento de performance.

## 🚦 Limites por Categoria

### 📊 **Endpoints Públicos** (Sem Autenticação)
- **Limite**: 100 requests/minuto
- **Burst**: 20 requests/segundo
- **Timeout**: 30 segundos
- **Endpoints**: `/api/lnd/info`, `/api/lnd/network-info`

### 🔐 **Endpoints Autenticados** (Com Macaroon)
- **Limite**: 60 requests/minuto
- **Burst**: 10 requests/segundo
- **Timeout**: 60 segundos
- **Endpoints**: Todos os outros endpoints LND

### 💰 **Operações de Wallet**
- **Limite**: 30 requests/minuto
- **Burst**: 5 requests/segundo
- **Timeout**: 120 segundos
- **Endpoints**: 
  - `GET /api/lnd/wallet/balance`
  - `POST /api/lnd/wallet/estimate-fee`
  - `GET /api/lnd/wallet/utxos`

### 🔗 **Operações de Canal**
- **Limite**: 20 requests/minuto
- **Burst**: 3 requests/segundo
- **Timeout**: 180 segundos
- **Endpoints**:
  - `POST /api/lnd/channels/open`
  - `POST /api/lnd/channels/:id/close`
  - `POST /api/lnd/channels/:id/update-policy`

### 📄 **Operações de Invoice**
- **Limite**: 50 requests/minuto
- **Burst**: 8 requests/segundo
- **Timeout**: 90 segundos
- **Endpoints**:
  - `POST /api/lnd/invoices`
  - `GET /api/lnd/invoices`
  - `POST /api/lnd/invoices/:id/settle`

### 💸 **Operações de Pagamento**
- **Limite**: 25 requests/minuto
- **Burst**: 4 requests/segundo
- **Timeout**: 300 segundos
- **Endpoints**:
  - `POST /api/lnd/payments/invoice`
  - `GET /api/lnd/payments/:id/track`
  - `POST /api/lnd/payments/estimate-route`

## 🎯 Estratégias de Rate Limiting

### 1. **Token Bucket Algorithm**

```typescript
export class TokenBucketRateLimit {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();
  
  constructor(
    private capacity: number,
    private refillRate: number,
    private windowMs: number = 60000
  ) {}

  async isAllowed(key: string): Promise<boolean> {
    const now = Date.now();
    const bucket = this.buckets.get(key) || { tokens: this.capacity, lastRefill: now };
    
    // Refill tokens
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = Math.floor((timePassed / this.windowMs) * this.refillRate);
    bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    
    // Check if request is allowed
    if (bucket.tokens >= 1) {
      bucket.tokens--;
      this.buckets.set(key, bucket);
      return true;
    }
    
    return false;
  }
}
```

### 2. **Sliding Window Rate Limit**

```typescript
export class SlidingWindowRateLimit {
  private windows = new Map<string, number[]>();
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async isAllowed(key: string): Promise<boolean> {
    const now = Date.now();
    const window = this.windows.get(key) || [];
    
    // Remove old requests outside window
    const cutoff = now - this.windowMs;
    const validRequests = window.filter(timestamp => timestamp > cutoff);
    
    // Check if under limit
    if (validRequests.length < this.maxRequests) {
      validRequests.push(now);
      this.windows.set(key, validRequests);
      return true;
    }
    
    return false;
  }
}
```

### 3. **Adaptive Rate Limiting**

```typescript
export class AdaptiveRateLimit {
  private baseLimit: number;
  private currentLimit: number;
  private lastAdjustment: number;
  
  constructor(
    baseLimit: number,
    private adjustmentFactor: number = 0.1,
    private minLimit: number = 10,
    private maxLimit: number = 1000
  ) {
    this.baseLimit = baseLimit;
    this.currentLimit = baseLimit;
    this.lastAdjustment = Date.now();
  }

  async adjustLimit(successRate: number, responseTime: number): Promise<void> {
    const now = Date.now();
    
    // Only adjust every 5 minutes
    if (now - this.lastAdjustment < 300000) return;
    
    let newLimit = this.currentLimit;
    
    // Adjust based on success rate
    if (successRate < 0.95) {
      newLimit *= (1 - this.adjustmentFactor);
    } else if (successRate > 0.99 && responseTime < 1000) {
      newLimit *= (1 + this.adjustmentFactor);
    }
    
    // Clamp to limits
    newLimit = Math.max(this.minLimit, Math.min(this.maxLimit, newLimit));
    
    this.currentLimit = newLimit;
    this.lastAdjustment = now;
    
    this.logger.info('🔄 Rate limit adjusted', {
      oldLimit: this.currentLimit,
      newLimit,
      successRate,
      responseTime
    });
  }
}
```

## 🔧 Implementação no Sistema

### Middleware de Rate Limiting

```typescript
// backend/src/middleware/lnd-rate-limit.middleware.ts
export async function lndRateLimitMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const clientId = request.ip || 'anonymous';
  const endpoint = request.routerPath;
  const operation = request.method;
  
  try {
    // Get rate limit config for endpoint
    const rateLimitConfig = getRateLimitConfig(endpoint, operation);
    
    // Check rate limit
    const isAllowed = await rateLimitService.isAllowed(
      `${clientId}:${endpoint}`,
      rateLimitConfig
    );
    
    if (!isAllowed) {
      const retryAfter = await rateLimitService.getRetryAfter(
        `${clientId}:${endpoint}`
      );
      
      return reply.status(429).send({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter,
        limit: rateLimitConfig.limit,
        window: rateLimitConfig.windowMs
      });
    }
    
    // Add rate limit headers
    const remaining = await rateLimitService.getRemaining(
      `${clientId}:${endpoint}`
    );
    
    reply.header('X-RateLimit-Limit', rateLimitConfig.limit);
    reply.header('X-RateLimit-Remaining', remaining);
    reply.header('X-RateLimit-Reset', Date.now() + rateLimitConfig.windowMs);
    
  } catch (error) {
    this.logger.error('❌ Rate limit middleware error:', error);
    // Continue without rate limiting on error
  }
}
```

### Configuração de Rate Limits

```typescript
// backend/src/config/lnd-rate-limits.ts
export const LND_RATE_LIMITS = {
  // Endpoints públicos
  public: {
    limit: 100,
    windowMs: 60000,
    burst: 20,
    timeout: 30000
  },
  
  // Endpoints autenticados
  authenticated: {
    limit: 60,
    windowMs: 60000,
    burst: 10,
    timeout: 60000
  },
  
  // Operações de wallet
  wallet: {
    limit: 30,
    windowMs: 60000,
    burst: 5,
    timeout: 120000
  },
  
  // Operações de canal
  channels: {
    limit: 20,
    windowMs: 60000,
    burst: 3,
    timeout: 180000
  },
  
  // Operações de invoice
  invoices: {
    limit: 50,
    windowMs: 60000,
    burst: 8,
    timeout: 90000
  },
  
  // Operações de pagamento
  payments: {
    limit: 25,
    windowMs: 60000,
    burst: 4,
    timeout: 300000
  }
};

export function getRateLimitConfig(endpoint: string, method: string) {
  // Mapear endpoint para categoria
  if (endpoint.includes('/wallet/')) {
    return LND_RATE_LIMITS.wallet;
  } else if (endpoint.includes('/channels')) {
    return LND_RATE_LIMITS.channels;
  } else if (endpoint.includes('/invoices')) {
    return LND_RATE_LIMITS.invoices;
  } else if (endpoint.includes('/payments')) {
    return LND_RATE_LIMITS.payments;
  } else if (method === 'GET' && endpoint.includes('/info')) {
    return LND_RATE_LIMITS.public;
  } else {
    return LND_RATE_LIMITS.authenticated;
  }
}
```

### Serviço de Rate Limiting

```typescript
// backend/src/services/lnd-rate-limit.service.ts
export class LNDRateLimitService {
  private rateLimiters = new Map<string, TokenBucketRateLimit>();
  private metrics = new Map<string, RateLimitMetrics>();
  
  constructor(private logger: Logger) {
    this.initializeRateLimiters();
  }
  
  private initializeRateLimiters(): void {
    // Criar rate limiters para cada categoria
    Object.entries(LND_RATE_LIMITS).forEach(([category, config]) => {
      const rateLimiter = new TokenBucketRateLimit(
        config.limit,
        config.burst,
        config.windowMs
      );
      this.rateLimiters.set(category, rateLimiter);
    });
  }
  
  async isAllowed(
    clientId: string,
    config: RateLimitConfig
  ): Promise<boolean> {
    const category = this.getCategoryFromConfig(config);
    const rateLimiter = this.rateLimiters.get(category);
    
    if (!rateLimiter) {
      this.logger.warn('⚠️ No rate limiter found for category:', category);
      return true; // Allow by default if no limiter
    }
    
    const allowed = await rateLimiter.isAllowed(clientId);
    
    // Update metrics
    this.updateMetrics(clientId, category, allowed);
    
    return allowed;
  }
  
  async getRemaining(clientId: string, category: string): Promise<number> {
    const rateLimiter = this.rateLimiters.get(category);
    if (!rateLimiter) return 0;
    
    // This would need to be implemented in TokenBucketRateLimit
    return rateLimiter.getRemainingTokens(clientId);
  }
  
  async getRetryAfter(clientId: string, category: string): Promise<number> {
    const rateLimiter = this.rateLimiters.get(category);
    if (!rateLimiter) return 60;
    
    // Calculate time until next token is available
    return rateLimiter.getTimeUntilNextToken(clientId);
  }
  
  private updateMetrics(
    clientId: string,
    category: string,
    allowed: boolean
  ): void {
    const key = `${clientId}:${category}`;
    const metrics = this.metrics.get(key) || {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      lastRequest: Date.now()
    };
    
    metrics.totalRequests++;
    if (allowed) {
      metrics.allowedRequests++;
    } else {
      metrics.blockedRequests++;
    }
    metrics.lastRequest = Date.now();
    
    this.metrics.set(key, metrics);
  }
}
```

## 📊 Monitoramento e Métricas

### Métricas de Rate Limiting

```typescript
export interface RateLimitMetrics {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  averageResponseTime: number;
  successRate: number;
  lastRequest: Date;
  topClients: Array<{
    clientId: string;
    requestCount: number;
    blockedCount: number;
  }>;
}
```

### Dashboard de Rate Limiting

```typescript
// backend/src/routes/lnd-metrics.routes.ts
export async function lndMetricsRoutes(fastify: FastifyInstance) {
  const rateLimitService = fastify.rateLimitService;
  
  /**
   * GET /api/lnd/metrics/rate-limits
   * Métricas de rate limiting
   */
  fastify.get('/rate-limits', async (request, reply) => {
    try {
      const metrics = await rateLimitService.getMetrics();
      
      return reply.status(200).send({
        success: true,
        data: {
          categories: metrics.categories,
          topClients: metrics.topClients,
          globalStats: metrics.globalStats,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });
  
  /**
   * GET /api/lnd/metrics/rate-limits/:clientId
   * Métricas específicas de um cliente
   */
  fastify.get('/rate-limits/:clientId', async (request, reply) => {
    try {
      const { clientId } = request.params as { clientId: string };
      const metrics = await rateLimitService.getClientMetrics(clientId);
      
      return reply.status(200).send({
        success: true,
        data: metrics
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  });
}
```

## 🚨 Alertas e Notificações

### Sistema de Alertas

```typescript
export class RateLimitAlertService {
  constructor(private logger: Logger) {}
  
  async checkAlerts(): Promise<void> {
    const metrics = await this.getCurrentMetrics();
    
    // Alerta para alto número de bloqueios
    if (metrics.globalStats.blockedRequests > 100) {
      await this.sendAlert('High rate limit blocks', {
        blockedRequests: metrics.globalStats.blockedRequests,
        threshold: 100
      });
    }
    
    // Alerta para cliente abusivo
    const abusiveClients = metrics.topClients.filter(
      client => client.blockedCount > 50
    );
    
    if (abusiveClients.length > 0) {
      await this.sendAlert('Abusive clients detected', {
        clients: abusiveClients
      });
    }
    
    // Alerta para baixa taxa de sucesso
    if (metrics.globalStats.successRate < 0.9) {
      await this.sendAlert('Low success rate', {
        successRate: metrics.globalStats.successRate,
        threshold: 0.9
      });
    }
  }
  
  private async sendAlert(message: string, data: any): Promise<void> {
    this.logger.warn('🚨 Rate limit alert:', { message, data });
    
    // TODO: Implementar notificação via Slack, email, etc.
  }
}
```

## 🔄 Rate Limiting Dinâmico

### Ajuste Automático de Limites

```typescript
export class DynamicRateLimitService {
  constructor(
    private baseLimits: RateLimitConfig,
    private logger: Logger
  ) {}
  
  async adjustLimits(): Promise<void> {
    const systemMetrics = await this.getSystemMetrics();
    
    // Ajustar baseado na carga do sistema
    if (systemMetrics.cpuUsage > 80) {
      await this.reduceLimits(0.8); // Reduzir 20%
    } else if (systemMetrics.cpuUsage < 30) {
      await this.increaseLimits(1.2); // Aumentar 20%
    }
    
    // Ajustar baseado na latência do LND
    if (systemMetrics.lndLatency > 5000) {
      await this.reduceLimits(0.5); // Reduzir 50%
    } else if (systemMetrics.lndLatency < 1000) {
      await this.increaseLimits(1.1); // Aumentar 10%
    }
  }
  
  private async reduceLimits(factor: number): Promise<void> {
    Object.keys(this.baseLimits).forEach(category => {
      const config = this.baseLimits[category];
      config.limit = Math.max(10, Math.floor(config.limit * factor));
      config.burst = Math.max(1, Math.floor(config.burst * factor));
    });
    
    this.logger.info('📉 Rate limits reduced', { factor });
  }
  
  private async increaseLimits(factor: number): Promise<void> {
    Object.keys(this.baseLimits).forEach(category => {
      const config = this.baseLimits[category];
      config.limit = Math.min(1000, Math.floor(config.limit * factor));
      config.burst = Math.min(100, Math.floor(config.burst * factor));
    });
    
    this.logger.info('📈 Rate limits increased', { factor });
  }
}
```

## 📋 Configuração por Ambiente

### Desenvolvimento
```env
LND_RATE_LIMIT_ENABLED=true
LND_RATE_LIMIT_STRICT=false
LND_RATE_LIMIT_DEBUG=true
LND_RATE_LIMIT_BYPASS_IPS=127.0.0.1,::1
```

### Produção
```env
LND_RATE_LIMIT_ENABLED=true
LND_RATE_LIMIT_STRICT=true
LND_RATE_LIMIT_DEBUG=false
LND_RATE_LIMIT_BYPASS_IPS=
LND_RATE_LIMIT_ALERT_WEBHOOK=https://hooks.slack.com/...
```

### Teste
```env
LND_RATE_LIMIT_ENABLED=false
LND_RATE_LIMIT_STRICT=false
LND_RATE_LIMIT_DEBUG=true
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. **Erro 429: Too Many Requests**
```bash
# Verificar headers de rate limit
curl -v http://localhost:13010/api/lnd/wallet/balance

# Verificar métricas
curl -s http://localhost:13010/api/lnd/metrics/rate-limits | jq .
```

#### 2. **Limites Muito Restritivos**
```typescript
// Ajustar limites temporariamente
const config = getRateLimitConfig('/api/lnd/wallet/balance', 'GET');
config.limit = 100; // Aumentar limite
config.burst = 20;  // Aumentar burst
```

#### 3. **Rate Limiting Não Funcionando**
```bash
# Verificar se middleware está registrado
curl -s http://localhost:13010/api/lnd/info | jq .headers

# Verificar logs
docker compose logs backend | grep "rate limit"
```

## 📊 Exemplos de Uso

### Verificar Rate Limits
```bash
# Fazer request e verificar headers
curl -v http://localhost:13010/api/lnd/wallet/balance \
  -H "Authorization: Bearer $TOKEN" \
  2>&1 | grep -E "(X-RateLimit|429)"
```

### Monitorar Métricas
```bash
# Ver métricas em tempo real
watch -n 5 'curl -s http://localhost:13010/api/lnd/metrics/rate-limits | jq .data.globalStats'
```

### Testar Limites
```bash
# Script para testar rate limits
for i in {1..70}; do
  curl -s http://localhost:13010/api/lnd/wallet/balance \
    -H "Authorization: Bearer $TOKEN" \
    -w "%{http_code}\n" -o /dev/null
  sleep 1
done
```

## 📈 Otimização de Performance

### Cache de Rate Limits
```typescript
export class CachedRateLimitService {
  private cache = new Map<string, { count: number; resetTime: number }>();
  
  async isAllowed(key: string, limit: number, windowMs: number): Promise<boolean> {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    if (!cached || now > cached.resetTime) {
      this.cache.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (cached.count >= limit) {
      return false;
    }
    
    cached.count++;
    return true;
  }
}
```

### Rate Limiting Distribuído
```typescript
export class DistributedRateLimitService {
  constructor(private redis: Redis) {}
  
  async isAllowed(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<boolean> {
    const pipeline = this.redis.pipeline();
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const redisKey = `rate_limit:${key}:${window}`;
    
    pipeline.incr(redisKey);
    pipeline.expire(redisKey, Math.ceil(windowMs / 1000));
    
    const results = await pipeline.exec();
    const count = results[0][1] as number;
    
    return count <= limit;
  }
}
```

## 🔗 Referências

- **Rate Limiting Patterns**: https://cloud.google.com/architecture/rate-limiting-strategies-techniques
- **Token Bucket Algorithm**: https://en.wikipedia.org/wiki/Token_bucket
- **Sliding Window Rate Limiting**: https://blog.cloudflare.com/counting-things-a-lot-of-different-things/
- **Redis Rate Limiting**: https://redis.io/docs/manual/patterns/distributed-locks/
