---
title: "{Feature Name} - Best Practices"
version: "1.0.0"
created: "{YYYY-MM-DD}"
updated: "{YYYY-MM-DD}"
author: "Documentation Agent"
status: "active"
tags: ["best-practices", "{feature-tag}", "guidelines"]
---

# {Feature Name} - Best Practices

> **Status**: Active  
> **Última Atualização**: {YYYY-MM-DD}  
> **Versão**: 1.0.0  
> **Responsável**: {Feature Name} System  

## Índice

- [Visão Geral](#visão-geral)
- [Instanciação e Configuração](#instanciação-e-configuração)
- [Uso em Contexto A](#uso-em-contexto-a)
- [Uso em Contexto B](#uso-em-contexto-b)
- [Error Handling](#error-handling)
- [Performance](#performance)
- [Segurança](#segurança)
- [Logging](#logging)
- [Exemplos Práticos](#exemplos-práticos)
- [Referências](#referências)

## Visão Geral

{Descrição breve sobre as melhores práticas para este componente}

## Instanciação e Configuração

### Configuração Recomendada

```typescript
// ✅ CORRETO - Configuração completa
const service = new ExampleService({
  apiKey: process.env.API_KEY,
  timeout: 5000,
  retries: 3,
  logLevel: 'info'
});

// ❌ ERRADO - Configuração mínima
const service = new ExampleService({});
```

### Validação de Configuração

```typescript
// ✅ CORRETO - Validação de entrada
interface ServiceConfig {
  apiKey: string;
  timeout?: number;
  retries?: number;
}

function validateConfig(config: ServiceConfig): void {
  if (!config.apiKey) {
    throw new Error('API Key is required');
  }
  if (config.timeout && config.timeout < 1000) {
    throw new Error('Timeout must be at least 1000ms');
  }
}
```

## Uso em Contexto A

### Cenário: {Descrição do cenário}

```typescript
// ✅ CORRETO - Uso adequado
async function processUserData(userId: string): Promise<UserData> {
  try {
    const user = await userService.getUser(userId);
    const processedData = await dataProcessor.process(user);
    
    await auditLogger.log('USER_PROCESSED', { userId });
    
    return processedData;
  } catch (error) {
    await errorLogger.log('USER_PROCESS_FAILED', { userId, error });
    throw new ProcessingError('Failed to process user data', error);
  }
}
```

### Padrões Recomendados

1. **Validação de Entrada**: Sempre validar dados de entrada
2. **Error Handling**: Usar try-catch com logging apropriado
3. **Auditoria**: Registrar ações importantes
4. **Cleanup**: Limpar recursos após uso

## Uso em Contexto B

### Cenário: {Descrição do cenário}

```typescript
// ✅ CORRETO - Uso em batch processing
async function processBatch(items: Item[]): Promise<ProcessResult[]> {
  const results: ProcessResult[] = [];
  
  // Processar em lotes para evitar sobrecarga
  const batchSize = 10;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => processItem(item))
    );
    results.push(...batchResults);
    
    // Rate limiting
    await sleep(100);
  }
  
  return results;
}
```

## Error Handling

### Estratégia de Retry

```typescript
// ✅ CORRETO - Retry com backoff exponencial
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await sleep(delay);
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Tratamento de Erros Específicos

```typescript
// ✅ CORRETO - Tratamento específico por tipo
try {
  await apiCall();
} catch (error) {
  if (error instanceof NetworkError) {
    // Retry logic
    return await retryWithBackoff(() => apiCall());
  } else if (error instanceof ValidationError) {
    // Log and return default
    logger.warn('Validation error', error);
    return getDefaultValue();
  } else {
    // Unexpected error
    logger.error('Unexpected error', error);
    throw error;
  }
}
```

## Performance

### Cache Strategy

```typescript
// ✅ CORRETO - Cache com TTL
class CachedService {
  private cache = new Map<string, { data: any; expires: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes
  
  async getData(key: string): Promise<any> {
    const cached = this.cache.get(key);
    
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    const data = await this.fetchData(key);
    this.cache.set(key, {
      data,
      expires: Date.now() + this.TTL
    });
    
    return data;
  }
}
```

### Lazy Loading

```typescript
// ✅ CORRETO - Lazy loading de dados
class DataService {
  private _data: any[] | null = null;
  
  async getData(): Promise<any[]> {
    if (!this._data) {
      this._data = await this.loadData();
    }
    return this._data;
  }
  
  private async loadData(): Promise<any[]> {
    // Load data from source
    return [];
  }
}
```

## Segurança

### Validação de Entrada

```typescript
// ✅ CORRETO - Validação rigorosa
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  age: z.number().min(18).max(120)
});

function validateUser(input: unknown): User {
  return userSchema.parse(input);
}
```

### Sanitização de Dados

```typescript
// ✅ CORRETO - Sanitização de dados
import DOMPurify from 'dompurify';

function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  });
}
```

## Logging

### Structured Logging

```typescript
// ✅ CORRETO - Logging estruturado
interface LogContext {
  userId?: string;
  requestId?: string;
  operation?: string;
}

class Logger {
  info(message: string, context?: LogContext): void {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...context
    }));
  }
  
  error(message: string, error: Error, context?: LogContext): void {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString(),
      ...context
    }));
  }
}
```

### Log Levels

```typescript
// ✅ CORRETO - Uso apropriado de log levels
logger.debug('Processing item', { itemId, step: 'validation' });
logger.info('User authenticated', { userId, method: 'oauth' });
logger.warn('Rate limit approaching', { userId, requests: 95, limit: 100 });
logger.error('Database connection failed', error, { host, port });
```

## Exemplos Práticos

### Exemplo 1: Service Completo

```typescript
// Exemplo de service seguindo todas as práticas
class UserService {
  constructor(
    private db: Database,
    private logger: Logger,
    private config: UserServiceConfig
  ) {}
  
  async getUser(id: string): Promise<User> {
    // Validação de entrada
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Invalid user ID');
    }
    
    try {
      // Cache check
      const cached = await this.cache.get(`user:${id}`);
      if (cached) {
        this.logger.debug('User retrieved from cache', { userId: id });
        return cached;
      }
      
      // Database query
      const user = await this.db.users.findById(id);
      if (!user) {
        throw new NotFoundError(`User ${id} not found`);
      }
      
      // Cache result
      await this.cache.set(`user:${id}`, user, this.config.cacheTTL);
      
      this.logger.info('User retrieved', { userId: id });
      return user;
      
    } catch (error) {
      this.logger.error('Failed to get user', error, { userId: id });
      throw error;
    }
  }
}
```

## Referências

- [Código Fonte](../{path/to/source})
- [Arquitetura](./architecture.md)
- [Troubleshooting](./troubleshooting.md)
- [Exemplos](./examples.md)

## Como Usar Este Documento

• **Para Desenvolvedores**: Use como guia para implementar este componente seguindo as melhores práticas definidas.

• **Para Code Review**: Use para validar se o código segue os padrões estabelecidos.

• **Para Onboarding**: Use para ensinar novos desenvolvedores sobre as práticas do projeto.
