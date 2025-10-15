---
title: "LN Markets API - Authentication"
version: "1.0.0"
created: "2025-01-26"
updated: "2025-01-26"
author: "Documentation Agent"
status: "active"
tags: ["integrations", "ln-markets", "authentication", "api"]
---

# LN Markets API - Authentication

> **Status**: Active  
> **Última Atualização**: 2025-01-26  
> **Versão**: 1.0.0  
> **Responsável**: Axisor Integration Team  

## Índice

- [Visão Geral](#visão-geral)
- [Métodos de Autenticação](#métodos-de-autenticação)
- [Implementação](#implementação)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Segurança](#segurança)
- [Troubleshooting](#troubleshooting)
- [Referências](#referências)

## Visão Geral

A integração com a LN Markets API utiliza autenticação baseada em API Key, Secret e assinatura HMAC para garantir a segurança das requisições. O sistema implementa retry automático, cache de tokens e monitoramento de rate limits.

## Métodos de Autenticação

### API Key Authentication

```typescript
interface LNMarketsCredentials {
  apiKey: string;
  secret: string;
  testnet?: boolean;
}

class LNMarketsAuthService {
  private credentials: LNMarketsCredentials;
  private baseUrl: string;

  constructor(credentials: LNMarketsCredentials) {
    this.credentials = credentials;
    this.baseUrl = credentials.testnet 
      ? 'https://api.testnet.lnmarkets.com/v2'
      : 'https://api.lnmarkets.com/v2';
  }

  async authenticate(): Promise<AuthResult> {
    try {
      const timestamp = Date.now().toString();
      const signature = this.generateSignature(timestamp);
      
      const response = await fetch(`${this.baseUrl}/user`, {
        method: 'GET',
        headers: {
          'X-API-Key': this.credentials.apiKey,
          'X-Timestamp': timestamp,
          'X-Signature': signature,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new LNMarketsError('Authentication failed', response.status);
      }

      const userData = await response.json();
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private generateSignature(timestamp: string): string {
    const message = timestamp + this.credentials.apiKey;
    const signature = crypto
      .createHmac('sha256', this.credentials.secret)
      .update(message)
      .digest('hex');
    
    return signature;
  }
}
```

## Implementação

### Service Implementation

```typescript
class LNMarketsService {
  private authService: LNMarketsAuthService;
  private cache: Map<string, any> = new Map();
  private rateLimiter: RateLimiter;

  constructor(credentials: LNMarketsCredentials) {
    this.authService = new LNMarketsAuthService(credentials);
    this.rateLimiter = new RateLimiter({
      requests: 100,
      window: 60000 // 1 minute
    });
  }

  async makeAuthenticatedRequest(
    endpoint: string, 
    method: string = 'GET', 
    data?: any
  ): Promise<any> {
    // Rate limiting
    await this.rateLimiter.waitForSlot();

    // Check cache
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(data)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const timestamp = Date.now().toString();
      const signature = this.generateSignature(endpoint, method, timestamp, data);
      
      const headers = {
        'X-API-Key': this.credentials.apiKey,
        'X-Timestamp': timestamp,
        'X-Signature': signature,
        'Content-Type': 'application/json'
      };

      const requestOptions: RequestInit = {
        method,
        headers
      };

      if (data && method !== 'GET') {
        requestOptions.body = JSON.stringify(data);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, requestOptions);
      
      if (!response.ok) {
        throw new LNMarketsError(
          `Request failed: ${response.statusText}`, 
          response.status
        );
      }

      const result = await response.json();
      
      // Cache successful responses
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('LN Markets API Error:', error);
      throw error;
    }
  }

  private generateSignature(
    endpoint: string, 
    method: string, 
    timestamp: string, 
    data?: any
  ): string {
    const message = timestamp + method + endpoint + (data ? JSON.stringify(data) : '');
    return crypto
      .createHmac('sha256', this.credentials.secret)
      .update(message)
      .digest('hex');
  }
}
```

### Authentication Middleware

```typescript
class LNMarketsAuthMiddleware {
  async validateCredentials(userId: string): Promise<boolean> {
    try {
      const credentials = await this.getUserCredentials(userId);
      const authService = new LNMarketsAuthService(credentials);
      const result = await authService.authenticate();
      
      if (result.success) {
        await this.updateLastTest(userId, true);
        return true;
      } else {
        await this.updateLastTest(userId, false, result.error);
        return false;
      }
    } catch (error) {
      await this.updateLastTest(userId, false, error.message);
      return false;
    }
  }

  private async getUserCredentials(userId: string): Promise<LNMarketsCredentials> {
    const userCredentials = await this.prisma.userExchangeCredentials.findFirst({
      where: {
        user_id: userId,
        exchange: { slug: 'ln-markets' },
        is_active: true
      },
      include: { exchange: true }
    });

    if (!userCredentials) {
      throw new Error('LN Markets credentials not found');
    }

    const decryptedCredentials = this.encryptionService.decrypt(
      userCredentials.credentials
    );

    return {
      apiKey: decryptedCredentials.apiKey,
      secret: decryptedCredentials.secret,
      testnet: decryptedCredentials.testnet || false
    };
  }
}
```

## Error Handling

### Error Types

```typescript
class LNMarketsError extends Error {
  constructor(
    message: string, 
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'LNMarketsError';
  }
}

class AuthenticationError extends LNMarketsError {
  constructor(message: string, details?: any) {
    super(message, 401, 'AUTH_ERROR', details);
  }
}

class RateLimitError extends LNMarketsError {
  constructor(message: string, retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT', { retryAfter });
  }
}

class ValidationError extends LNMarketsError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}
```

### Error Handler

```typescript
class LNMarketsErrorHandler {
  async handleError(error: any, request: any): Promise<void> {
    if (error instanceof LNMarketsError) {
      switch (error.statusCode) {
        case 401:
          await this.handleAuthenticationError(error, request);
          break;
        case 429:
          await this.handleRateLimitError(error, request);
          break;
        case 400:
          await this.handleValidationError(error, request);
          break;
        default:
          await this.handleGenericError(error, request);
      }
    } else {
      await this.handleGenericError(error, request);
    }
  }

  private async handleAuthenticationError(
    error: AuthenticationError, 
    request: any
  ): Promise<void> {
    // Mark credentials as invalid
    await this.prisma.userExchangeCredentials.updateMany({
      where: {
        user_id: request.userId,
        exchange: { slug: 'ln-markets' }
      },
      data: {
        is_verified: false,
        last_test: new Date()
      }
    });

    // Log security event
    await this.auditService.logSecurityEvent({
      userId: request.userId,
      action: 'LN_MARKETS_AUTH_FAILED',
      details: { error: error.message }
    });
  }
}
```

## Rate Limiting

### Implementation

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(private config: { requests: number; window: number }) {}

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    const key = 'global'; // or per-user key
    
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(
      timestamp => now - timestamp < this.config.window
    );
    
    if (validRequests.length >= this.config.requests) {
      const oldestRequest = Math.min(...validRequests);
      const waitTime = this.config.window - (now - oldestRequest);
      
      if (waitTime > 0) {
        await this.sleep(waitTime);
      }
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Segurança

### Credential Encryption

```typescript
class CredentialEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    this.key = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);
  }

  encryptCredentials(credentials: LNMarketsCredentials): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    cipher.setAAD(Buffer.from('ln-markets'));
    
    let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decryptCredentials(encryptedCredentials: string): LNMarketsCredentials {
    const [ivHex, authTagHex, encrypted] = encryptedCredentials.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    decipher.setAAD(Buffer.from('ln-markets'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
}
```

## Troubleshooting

### Common Issues

#### Authentication Failures

```typescript
// Debug authentication issues
async function debugAuthentication(userId: string): Promise<void> {
  try {
    const credentials = await getUserCredentials(userId);
    console.log('Credentials found:', !!credentials);
    
    const timestamp = Date.now().toString();
    const signature = generateSignature(credentials, timestamp);
    
    console.log('Timestamp:', timestamp);
    console.log('Signature generated:', !!signature);
    
    const response = await testAuthentication(credentials, timestamp, signature);
    console.log('Response status:', response.status);
    console.log('Response body:', await response.text());
    
  } catch (error) {
    console.error('Authentication debug failed:', error);
  }
}
```

#### Rate Limit Issues

```typescript
// Monitor rate limiting
async function monitorRateLimits(): Promise<void> {
  const rateLimitData = await getRateLimitStatus();
  
  console.log('Rate limit status:', {
    remaining: rateLimitData.remaining,
    resetTime: new Date(rateLimitData.resetTime),
    limit: rateLimitData.limit
  });
}
```

## Referências

- [LN Markets API Documentation](https://docs.lnmarkets.com/)
- [Authentication Service](../authentication-service.md)
- [Error Handling](../error-handling.md)
- [Rate Limiting](../rate-limits.md)

## Como Usar Este Documento

• **Para Desenvolvedores**: Use como referência para implementar autenticação com a LN Markets API seguindo os padrões de segurança estabelecidos.

• **Para DevOps**: Utilize para configurar e monitorar a integração com a LN Markets API em produção.

• **Para Troubleshooting**: Use para diagnosticar e resolver problemas de autenticação com a API.
