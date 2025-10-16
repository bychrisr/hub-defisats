# LN Markets API v2 - Best Practices

## Overview

This document outlines best practices for using the LNMarketsAPIv2 service in your application.

## Service Instantiation

### ✅ Correct Pattern

```typescript
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';

const lnMarketsService = new LNMarketsAPIv2({
  credentials: {
    apiKey: 'your-api-key',
    apiSecret: 'your-api-secret',
    passphrase: 'your-passphrase',
    isTestnet: false
  },
  logger: console as any // Use proper logger in production
});
```

### ❌ Avoid

```typescript
// Don't use old service
import { LNMarketsAPIService } from '../services/lnmarkets-api.service';

// Don't create multiple instances unnecessarily
const service1 = new LNMarketsAPIv2(config);
const service2 = new LNMarketsAPIv2(config); // Reuse service1
```

## Credential Management

### ✅ Secure Credential Handling

```typescript
// Decrypt credentials before use
const authService = new AuthService(prisma, {} as any);
const apiKey = authService.decryptData(user.ln_markets_api_key);
const apiSecret = authService.decryptData(user.ln_markets_api_secret);
const passphrase = authService.decryptData(user.ln_markets_passphrase);

const lnMarketsService = new LNMarketsAPIv2({
  credentials: {
    apiKey,
    apiSecret,
    passphrase,
    isTestnet: false
  },
  logger: logger
});
```

### ❌ Avoid

```typescript
// Don't store credentials in plain text
const credentials = {
  apiKey: 'plain-text-key', // ❌ Never do this
  apiSecret: 'plain-text-secret'
};

// Don't hardcode credentials
const lnMarketsService = new LNMarketsAPIv2({
  credentials: {
    apiKey: 'hardcoded-key', // ❌ Never hardcode
    apiSecret: 'hardcoded-secret'
  }
});
```

## Error Handling

### ✅ Proper Error Handling

```typescript
try {
  const user = await lnMarketsService.user.getUser();
  const positions = await lnMarketsService.futures.getRunningPositions();
  
  return {
    success: true,
    data: {
      user,
      positions
    }
  };
} catch (error: any) {
  console.error('LN Markets API Error:', error);
  
  // Handle specific error types
  if (error.message?.includes('Signature is not valid')) {
    return {
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: 'API credentials are invalid'
    };
  }
  
  return {
    success: false,
    error: 'API_ERROR',
    message: error.message || 'Unknown error occurred'
  };
}
```

### ❌ Avoid

```typescript
// Don't ignore errors
const user = await lnMarketsService.user.getUser(); // ❌ No error handling

// Don't expose sensitive error details
catch (error) {
  return { error: error.stack }; // ❌ Exposes sensitive info
}
```

## Performance Optimization

### ✅ Efficient Data Fetching

```typescript
// Use Promise.all for parallel requests
const [user, positions, ticker] = await Promise.all([
  lnMarketsService.user.getUser(),
  lnMarketsService.futures.getRunningPositions(),
  lnMarketsService.market.getTicker()
]);

// Cache service instances
const serviceCache = new Map();
function getCachedService(userId: string, credentials: any) {
  if (!serviceCache.has(userId)) {
    serviceCache.set(userId, new LNMarketsAPIv2({
      credentials,
      logger: logger
    }));
  }
  return serviceCache.get(userId);
}
```

### ❌ Avoid

```typescript
// Don't make sequential requests when parallel is possible
const user = await lnMarketsService.user.getUser();
const positions = await lnMarketsService.futures.getRunningPositions(); // ❌ Sequential

// Don't create new service instances for each request
function getData(userId: string) {
  const service = new LNMarketsAPIv2(config); // ❌ New instance every time
  return service.user.getUser();
}
```

## Logging Best Practices

### ✅ Proper Logging

```typescript
const logger = {
  info: (message: string, meta?: any) => console.log(`[LNMarketsAPI] ${message}`, meta),
  error: (message: string, meta?: any) => console.error(`[LNMarketsAPI] ${message}`, meta),
  warn: (message: string, meta?: any) => console.warn(`[LNMarketsAPI] ${message}`, meta),
  debug: (message: string, meta?: any) => console.debug(`[LNMarketsAPI] ${message}`, meta)
};

const lnMarketsService = new LNMarketsAPIv2({
  credentials: credentials,
  logger: logger
});

// Log important operations
logger.info('Fetching user data', { userId });
const user = await lnMarketsService.user.getUser();
logger.info('User data fetched successfully', { balance: user.balance });
```

### ❌ Avoid

```typescript
// Don't use console.log directly
const lnMarketsService = new LNMarketsAPIv2({
  credentials: credentials,
  logger: console // ❌ Too generic
});

// Don't log sensitive data
logger.info('User data', { apiKey: credentials.apiKey }); // ❌ Logs sensitive info
```

## Testing Best Practices

### ✅ Proper Testing

```typescript
// Mock the service for unit tests
const mockService = {
  user: {
    getUser: jest.fn().mockResolvedValue({
      balance: 1000,
      username: 'testuser'
    })
  },
  futures: {
    getRunningPositions: jest.fn().mockResolvedValue([])
  },
  market: {
    getTicker: jest.fn().mockResolvedValue({
      index: 50000,
      timestamp: Date.now()
    })
  }
};

// Test with real service in integration tests
const realService = new LNMarketsAPIv2({
  credentials: testCredentials,
  logger: mockLogger
});
```

### ❌ Avoid

```typescript
// Don't use real credentials in tests
const service = new LNMarketsAPIv2({
  credentials: {
    apiKey: 'real-production-key', // ❌ Never use real credentials in tests
    apiSecret: 'real-production-secret'
  }
});
```

## Route Implementation

### ✅ Proper Route Structure

```typescript
export async function lnMarketsRoutes(fastify: FastifyInstance) {
  // GET /api/lnmarkets/positions
  fastify.get('/positions', {
    preHandler: [authMiddleware],
    schema: {
      description: 'Get LN Markets positions',
      tags: ['LN Markets'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: { type: 'object' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = (request as any).user?.id;
      
      // Get credentials
      const credentials = await getCredentials(userId);
      
      // Create service
      const lnMarketsService = new LNMarketsAPIv2({
        credentials: credentials,
        logger: fastify.log
      });
      
      // Fetch data
      const positions = await lnMarketsService.futures.getRunningPositions();
      
      return reply.status(200).send({
        success: true,
        data: positions
      });
    } catch (error: any) {
      fastify.log.error('Error fetching positions:', error);
      return reply.status(500).send({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch positions'
      });
    }
  });
}
```

## Controller Implementation

### ✅ Proper Controller Structure

```typescript
export class LNMarketsController {
  constructor(private prisma: PrismaClient) {}

  private async getLNMarketsService(userId: string): Promise<LNMarketsAPIv2> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ln_markets_api_key: true,
        ln_markets_api_secret: true,
        ln_markets_passphrase: true
      }
    });

    if (!user?.ln_markets_api_key || !user?.ln_markets_api_secret) {
      throw new Error('LN Markets credentials not configured');
    }

    const authService = new AuthService(this.prisma, {} as any);
    const apiKey = authService.decryptData(user.ln_markets_api_key);
    const apiSecret = authService.decryptData(user.ln_markets_api_secret);
    const passphrase = authService.decryptData(user.ln_markets_passphrase);

    return new LNMarketsAPIv2({
      credentials: {
        apiKey,
        apiSecret,
        passphrase,
        isTestnet: false
      },
      logger: console as any
    });
  }

  async getPositions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = (request as any).user?.id;
      const service = await this.getLNMarketsService(userId);
      const positions = await service.futures.getRunningPositions();
      
      return reply.status(200).send({
        success: true,
        data: positions
      });
    } catch (error: any) {
      console.error('Error getting positions:', error);
      return reply.status(500).send({
        success: false,
        error: error.message
      });
    }
  }
}
```

## Security Considerations

### ✅ Security Best Practices

```typescript
// Validate credentials before use
function validateCredentials(credentials: any): boolean {
  return !!(
    credentials?.apiKey &&
    credentials?.apiSecret &&
    credentials?.passphrase &&
    credentials.apiKey.length > 0 &&
    credentials.apiSecret.length > 0
  );
}

// Use proper error messages (don't expose internals)
catch (error) {
  if (error.message?.includes('Signature is not valid')) {
    throw new Error('Invalid API credentials');
  }
  throw new Error('API request failed');
}

// Sanitize data before logging
logger.info('User operation', {
  userId: user.id,
  operation: 'getPositions',
  // Don't log: credentials, sensitive data
});
```

## Monitoring and Observability

### ✅ Proper Monitoring

```typescript
// Add metrics and monitoring
import { metrics } from '../utils/metrics';

async function getPositionsWithMetrics(userId: string) {
  const startTime = Date.now();
  
  try {
    const service = new LNMarketsAPIv2({
      credentials: await getCredentials(userId),
      logger: logger
    });
    
    const positions = await service.futures.getRunningPositions();
    
    // Record success metrics
    metrics.recordApiCall('lnmarkets.getPositions', Date.now() - startTime, true);
    
    return positions;
  } catch (error) {
    // Record error metrics
    metrics.recordApiCall('lnmarkets.getPositions', Date.now() - startTime, false);
    throw error;
  }
}
```

## Common Anti-Patterns

### ❌ Avoid These Patterns

1. **Creating multiple service instances unnecessarily**
2. **Not handling authentication errors properly**
3. **Exposing sensitive error information**
4. **Using synchronous operations where async is needed**
5. **Not validating input data**
6. **Hardcoding credentials or configuration**
7. **Not implementing proper logging**
8. **Ignoring rate limits and error responses**

---

**Last Updated**: 2025-01-09  
**Version**: 1.0.0  
**Status**: Complete