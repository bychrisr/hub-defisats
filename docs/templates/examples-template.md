---
title: "{Feature Name} - Examples"
version: "1.0.0"
created: "{YYYY-MM-DD}"
updated: "{YYYY-MM-DD}"
author: "Documentation Agent"
status: "active"
tags: ["examples", "{feature-tag}", "usage"]
---

# {Feature Name} - Examples

> **Status**: Active  
> **Última Atualização**: {YYYY-MM-DD}  
> **Versão**: 1.0.0  
> **Responsável**: {Feature Name} System  

## Índice

- [Visão Geral](#visão-geral)
- [Configuração Básica](#configuração-básica)
- [Exemplos por Domínio](#exemplos-por-domínio)
- [Exemplos Avançados](#exemplos-avançados)
- [Casos de Uso Completos](#casos-de-uso-completos)
- [Integração com Outros Sistemas](#integração-com-outros-sistemas)
- [Performance e Otimização](#performance-e-otimização)
- [Referências](#referências)

## Visão Geral

Este documento contém exemplos práticos e funcionais para o {Feature Name}. Todos os exemplos são baseados no código real do projeto Axisor e foram testados para garantir funcionamento correto.

## Configuração Básica

### Instalação e Setup

```typescript
// 1. Instalar dependências
npm install @axisor/{feature-name}

// 2. Configuração básica
import { FeatureService } from '@axisor/{feature-name}';

const service = new FeatureService({
  apiKey: process.env.FEATURE_API_KEY,
  environment: 'production',
  timeout: 5000
});
```

### Configuração por Ambiente

```typescript
// Desenvolvimento
const devConfig = {
  debug: true,
  logLevel: 'debug',
  mockExternalCalls: true
};

// Produção
const prodConfig = {
  debug: false,
  logLevel: 'info',
  mockExternalCalls: false,
  retries: 3,
  circuitBreaker: true
};

const service = new FeatureService(
  process.env.NODE_ENV === 'production' ? prodConfig : devConfig
);
```

## Exemplos por Domínio

### Domínio A: {Descrição do Domínio}

#### Exemplo 1: Operação Básica

```typescript
// ✅ Exemplo funcional testado
async function basicOperation(): Promise<Result> {
  try {
    const result = await service.performOperation({
      input: 'example-data',
      options: {
        timeout: 10000,
        retries: 2
      }
    });
    
    console.log('Operation completed:', result);
    return result;
    
  } catch (error) {
    console.error('Operation failed:', error);
    throw error;
  }
}

// Uso
const result = await basicOperation();
```

#### Exemplo 2: Operação com Validação

```typescript
import { z } from 'zod';

const operationSchema = z.object({
  input: z.string().min(1),
  options: z.object({
    timeout: z.number().min(1000),
    retries: z.number().min(0).max(5)
  })
});

async function validatedOperation(data: unknown): Promise<Result> {
  // Validar entrada
  const validatedData = operationSchema.parse(data);
  
  // Executar operação
  const result = await service.performOperation(validatedData);
  
  // Validar saída
  if (!result.success) {
    throw new Error(`Operation failed: ${result.error}`);
  }
  
  return result;
}
```

#### Exemplo 3: Operação Assíncrona

```typescript
// Processamento assíncrono com Promise.all
async function batchOperation(items: Item[]): Promise<Result[]> {
  const batchSize = 10;
  const results: Result[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(item => service.processItem(item))
    );
    
    results.push(...batchResults);
    
    // Rate limiting
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}
```

### Domínio B: {Descrição do Domínio}

#### Exemplo 1: Integração com Database

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function saveOperationResult(result: Result): Promise<void> {
  try {
    await prisma.operationResult.create({
      data: {
        id: result.id,
        status: result.status,
        data: result.data,
        createdAt: new Date(),
        metadata: {
          processingTime: result.processingTime,
          source: 'feature-service'
        }
      }
    });
    
    console.log('Result saved to database');
    
  } catch (error) {
    console.error('Failed to save result:', error);
    throw error;
  }
}
```

#### Exemplo 2: Cache com Redis

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedResult(key: string): Promise<Result | null> {
  try {
    const cached = await redis.get(key);
    
    if (cached) {
      const result = JSON.parse(cached);
      console.log('Cache hit for key:', key);
      return result;
    }
    
    console.log('Cache miss for key:', key);
    return null;
    
  } catch (error) {
    console.error('Cache error:', error);
    return null;
  }
}

async function setCachedResult(key: string, result: Result, ttl: number = 300): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(result));
    console.log('Result cached with TTL:', ttl);
  } catch (error) {
    console.error('Cache set error:', error);
  }
}
```

## Exemplos Avançados

### Exemplo 1: Circuit Breaker Pattern

```typescript
import CircuitBreaker from 'opossum';

const options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
};

const circuitBreaker = new CircuitBreaker(service.performOperation, options);

circuitBreaker.on('open', () => {
  console.log('Circuit breaker opened');
});

circuitBreaker.on('halfOpen', () => {
  console.log('Circuit breaker half-opened');
});

circuitBreaker.on('close', () => {
  console.log('Circuit breaker closed');
});

// Uso com circuit breaker
async function resilientOperation(data: OperationData): Promise<Result> {
  try {
    return await circuitBreaker.fire(data);
  } catch (error) {
    if (error.name === 'CircuitBreakerOpenError') {
      // Fallback ou retry mais tarde
      return await fallbackOperation(data);
    }
    throw error;
  }
}
```

### Exemplo 2: Retry com Backoff Exponencial

```typescript
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Uso
const result = await retryWithBackoff(
  () => service.performOperation(data),
  3,
  1000
);
```

### Exemplo 3: Monitoramento e Métricas

```typescript
import { register, Counter, Histogram } from 'prom-client';

const operationCounter = new Counter({
  name: 'feature_operations_total',
  help: 'Total number of operations',
  labelNames: ['operation', 'status']
});

const operationDuration = new Histogram({
  name: 'feature_operation_duration_seconds',
  help: 'Duration of operations in seconds',
  labelNames: ['operation']
});

async function monitoredOperation(data: OperationData): Promise<Result> {
  const timer = operationDuration.startTimer({ operation: 'process' });
  
  try {
    const result = await service.performOperation(data);
    
    operationCounter.inc({ operation: 'process', status: 'success' });
    return result;
    
  } catch (error) {
    operationCounter.inc({ operation: 'process', status: 'error' });
    throw error;
  } finally {
    timer();
  }
}
```

## Casos de Uso Completos

### Caso de Uso 1: Processamento de Dados em Lote

```typescript
interface BatchProcessor {
  processBatch(items: Item[]): Promise<BatchResult>;
}

class FeatureBatchProcessor implements BatchProcessor {
  constructor(
    private service: FeatureService,
    private cache: CacheService,
    private logger: Logger
  ) {}
  
  async processBatch(items: Item[]): Promise<BatchResult> {
    const startTime = Date.now();
    const results: ItemResult[] = [];
    const errors: ProcessingError[] = [];
    
    this.logger.info('Starting batch processing', { 
      itemCount: items.length 
    });
    
    // Processar em chunks para evitar sobrecarga
    const chunkSize = 50;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      
      try {
        const chunkResults = await this.processChunk(chunk);
        results.push(...chunkResults.success);
        errors.push(...chunkResults.errors);
        
        // Cache resultados
        await this.cacheResults(chunkResults.success);
        
        this.logger.debug('Processed chunk', {
          chunkIndex: Math.floor(i / chunkSize),
          successCount: chunkResults.success.length,
          errorCount: chunkResults.errors.length
        });
        
      } catch (error) {
        this.logger.error('Chunk processing failed', {
          chunkIndex: Math.floor(i / chunkSize),
          error: error.message
        });
        
        // Marcar todos os itens do chunk como erro
        chunk.forEach(item => {
          errors.push({
            itemId: item.id,
            error: error.message,
            timestamp: new Date()
          });
        });
      }
      
      // Rate limiting entre chunks
      if (i + chunkSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    const duration = Date.now() - startTime;
    
    this.logger.info('Batch processing completed', {
      totalItems: items.length,
      successCount: results.length,
      errorCount: errors.length,
      duration: `${duration}ms`
    });
    
    return {
      success: results,
      errors,
      summary: {
        totalProcessed: items.length,
        successRate: (results.length / items.length) * 100,
        processingTime: duration
      }
    };
  }
  
  private async processChunk(items: Item[]): Promise<ChunkResult> {
    const promises = items.map(item => 
      this.service.processItem(item).catch(error => ({
        item,
        error: error.message
      }))
    );
    
    const results = await Promise.allSettled(promises);
    
    const success: ItemResult[] = [];
    const errors: ProcessingError[] = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if ('error' in result.value) {
          errors.push({
            itemId: items[index].id,
            error: result.value.error,
            timestamp: new Date()
          });
        } else {
          success.push(result.value);
        }
      } else {
        errors.push({
          itemId: items[index].id,
          error: result.reason.message,
          timestamp: new Date()
        });
      }
    });
    
    return { success, errors };
  }
  
  private async cacheResults(results: ItemResult[]): Promise<void> {
    const cachePromises = results.map(result => 
      this.cache.set(`result:${result.id}`, result, 3600)
    );
    
    await Promise.allSettled(cachePromises);
  }
}
```

### Caso de Uso 2: Sistema de Notificações

```typescript
interface NotificationService {
  sendNotification(userId: string, message: string): Promise<void>;
}

class FeatureNotificationService implements NotificationService {
  constructor(
    private userService: UserService,
    private emailService: EmailService,
    private smsService: SmsService,
    private pushService: PushService
  ) {}
  
  async sendNotification(userId: string, message: string): Promise<void> {
    try {
      // Buscar preferências do usuário
      const user = await this.userService.getUser(userId);
      const preferences = await this.userService.getNotificationPreferences(userId);
      
      const notifications: Promise<void>[] = [];
      
      // Email
      if (preferences.email && user.email) {
        notifications.push(
          this.emailService.send({
            to: user.email,
            subject: 'Axisor Notification',
            body: message
          })
        );
      }
      
      // SMS
      if (preferences.sms && user.phone) {
        notifications.push(
          this.smsService.send({
            to: user.phone,
            message: message
          })
        );
      }
      
      // Push
      if (preferences.push && user.pushToken) {
        notifications.push(
          this.pushService.send({
            token: user.pushToken,
            title: 'Axisor',
            body: message
          })
        );
      }
      
      // Enviar todas as notificações em paralelo
      await Promise.allSettled(notifications);
      
      console.log(`Notifications sent to user ${userId}`);
      
    } catch (error) {
      console.error(`Failed to send notifications to user ${userId}:`, error);
      throw error;
    }
  }
}
```

## Integração com Outros Sistemas

### Integração com LN Markets

```typescript
import { LNMarketsAPI } from '@axisor/lnmarkets';

class FeatureLNMarketsIntegration {
  constructor(private lnMarkets: LNMarketsAPI) {}
  
  async syncTradingData(userId: string): Promise<TradingData> {
    try {
      // Buscar credenciais do usuário
      const credentials = await this.getUserCredentials(userId);
      
      // Autenticar com LN Markets
      await this.lnMarkets.authenticate(credentials);
      
      // Buscar dados de trading
      const [positions, orders, balance] = await Promise.all([
        this.lnMarkets.getPositions(),
        this.lnMarkets.getOrders(),
        this.lnMarkets.getBalance()
      ]);
      
      // Processar e normalizar dados
      const tradingData: TradingData = {
        positions: positions.map(this.normalizePosition),
        orders: orders.map(this.normalizeOrder),
        balance: this.normalizeBalance(balance),
        syncedAt: new Date()
      };
      
      // Salvar no banco
      await this.saveTradingData(userId, tradingData);
      
      return tradingData;
      
    } catch (error) {
      console.error('Failed to sync trading data:', error);
      throw error;
    }
  }
  
  private normalizePosition(position: any): Position {
    return {
      id: position.id,
      symbol: position.symbol,
      side: position.side,
      size: parseFloat(position.size),
      entryPrice: parseFloat(position.entry_price),
      currentPrice: parseFloat(position.current_price),
      pnl: parseFloat(position.pnl),
      margin: parseFloat(position.margin)
    };
  }
}
```

## Performance e Otimização

### Exemplo de Otimização de Query

```typescript
// ❌ Query ineficiente
async function getUsersWithOrders(): Promise<UserWithOrders[]> {
  const users = await prisma.user.findMany();
  
  const usersWithOrders = await Promise.all(
    users.map(async (user) => {
      const orders = await prisma.order.findMany({
        where: { userId: user.id }
      });
      
      return {
        ...user,
        orders
      };
    })
  );
  
  return usersWithOrders;
}

// ✅ Query otimizada
async function getUsersWithOrdersOptimized(): Promise<UserWithOrders[]> {
  const usersWithOrders = await prisma.user.findMany({
    include: {
      orders: {
        select: {
          id: true,
          symbol: true,
          side: true,
          amount: true,
          price: true,
          status: true,
          createdAt: true
        }
      }
    },
    where: {
      active: true // Filtrar usuários inativos
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 100 // Limitar resultados
  });
  
  return usersWithOrders;
}
```

### Exemplo de Cache Inteligente

```typescript
class IntelligentCache {
  private cache = new Map<string, { data: any; expires: number; hits: number }>();
  private readonly maxSize = 1000;
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item || item.expires < Date.now()) {
      if (item) {
        this.cache.delete(key);
      }
      return null;
    }
    
    // Incrementar contador de hits
    item.hits++;
    
    return item.data;
  }
  
  set(key: string, data: any, ttl: number = 300000): void {
    // Implementar LRU quando cache estiver cheio
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }
    
    this.cache.set(key, {
      data,
      expires: Date.now() + ttl,
      hits: 0
    });
  }
  
  private evictLeastRecentlyUsed(): void {
    let leastUsedKey = '';
    let leastHits = Infinity;
    
    for (const [key, item] of this.cache) {
      if (item.hits < leastHits) {
        leastHits = item.hits;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
    }
  }
}
```

## Referências

- [Arquitetura](./architecture.md)
- [Best Practices](./best-practices.md)
- [Troubleshooting](./troubleshooting.md)
- [Código Fonte](../{path/to/source})

## Como Usar Este Documento

• **Para Desenvolvedores**: Use os exemplos como base para implementar funcionalidades similares.

• **Para Integração**: Adapte os exemplos de integração para seus casos de uso específicos.

• **Para Performance**: Aplique as técnicas de otimização mostradas nos exemplos.
