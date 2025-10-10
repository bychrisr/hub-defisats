# LN Markets API v2 - Migration Guide

## Overview

This guide provides step-by-step instructions for migrating from the legacy LN Markets API implementation to the new centralized LNMarketsAPIv2 architecture.

## Migration Checklist

### ✅ Phase 1: Understanding the New Architecture

- [ ] Review [API_V2_ARCHITECTURE.md](./01-architecture.md)
- [ ] Understand the new service structure
- [ ] Familiarize with domain-specific endpoints

### ✅ Phase 2: Update Imports

**Before:**
```typescript
import { LNMarketsAPIService } from '../services/lnmarkets-api.service';
```

**After:**
```typescript
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';
```

### ✅ Phase 3: Update Service Instantiation

**Before:**
```typescript
const lnMarketsService = new LNMarketsAPIService({
  apiKey: credentials.api_key,
  apiSecret: credentials.api_secret,
  passphrase: credentials.passphrase,
  isTestnet: false
}, logger);
```

**After:**
```typescript
const lnMarketsService = new LNMarketsAPIv2({
  credentials: {
    apiKey: credentials.api_key,
    apiSecret: credentials.api_secret,
    passphrase: credentials.passphrase,
    isTestnet: false
  },
  logger: logger
});
```

### ✅ Phase 4: Update Method Calls

#### User Operations

**Before:**
```typescript
const user = await lnMarketsService.getUser();
const balance = await lnMarketsService.getUserBalance();
```

**After:**
```typescript
const user = await lnMarketsService.user.getUser();
const balance = user.balance; // Extract from user object
```

#### Futures Operations

**Before:**
```typescript
const positions = await lnMarketsService.getUserPositions();
const trades = await lnMarketsService.getUserTrades();
```

**After:**
```typescript
const positions = await lnMarketsService.futures.getRunningPositions();
const trades = await lnMarketsService.futures.getUserTrades();
```

#### Market Data

**Before:**
```typescript
const ticker = await lnMarketsService.getTicker();
const marketData = await lnMarketsService.getMarketData();
```

**After:**
```typescript
const ticker = await lnMarketsService.market.getTicker();
const marketData = await lnMarketsService.market.getIndexHistory();
```

### ✅ Phase 5: Update Credential Access

**Before:**
```typescript
const apiKey = credentials.api_key;
const apiSecret = credentials.api_secret;
const passphrase = credentials.passphrase;
```

**After:**
```typescript
const apiKey = credentials['API Key']; // Note: Key names may vary
const apiSecret = credentials['API Secret'];
const passphrase = credentials['Passphrase'];
```

### ✅ Phase 6: Update Error Handling

**Before:**
```typescript
try {
  const result = await lnMarketsService.getUser();
} catch (error) {
  // Handle error
}
```

**After:**
```typescript
try {
  const result = await lnMarketsService.user.getUser();
} catch (error) {
  // Enhanced error handling with proper error propagation
}
```

## Common Migration Patterns

### Pattern 1: Route Migration

```typescript
// Before
fastify.get('/positions', async (request, reply) => {
  const lnMarketsService = new LNMarketsAPIService(credentials, logger);
  const positions = await lnMarketsService.getUserPositions();
  return { success: true, data: positions };
});

// After
fastify.get('/positions', async (request, reply) => {
  const lnMarketsService = new LNMarketsAPIv2({
    credentials: credentials,
    logger: logger
  });
  const positions = await lnMarketsService.futures.getRunningPositions();
  return { success: true, data: positions };
});
```

### Pattern 2: Controller Migration

```typescript
// Before
export class LNMarketsController {
  private async getService(credentials: any): Promise<LNMarketsAPIService> {
    return new LNMarketsAPIService(credentials, console as any);
  }
}

// After
export class LNMarketsController {
  private async getService(credentials: any): Promise<LNMarketsAPIv2> {
    return new LNMarketsAPIv2({
      credentials: credentials,
      logger: console as any
    });
  }
}
```

### Pattern 3: Service Migration

```typescript
// Before
export class SomeService {
  constructor(private lnMarketsService: LNMarketsAPIService) {}
  
  async getData() {
    const user = await this.lnMarketsService.getUser();
    const positions = await this.lnMarketsService.getUserPositions();
    return { user, positions };
  }
}

// After
export class SomeService {
  constructor(private lnMarketsService: LNMarketsAPIv2) {}
  
  async getData() {
    const user = await this.lnMarketsService.user.getUser();
    const positions = await this.lnMarketsService.futures.getRunningPositions();
    return { user, positions };
  }
}
```

## Testing Migration

### 1. Unit Tests

Update test files to use the new service structure:

```typescript
// Before
const mockService = new LNMarketsAPIService(mockCredentials, mockLogger);

// After
const mockService = new LNMarketsAPIv2({
  credentials: mockCredentials,
  logger: mockLogger
});
```

### 2. Integration Tests

Ensure all endpoints work with the new implementation:

```bash
# Test user endpoints
curl -H "Authorization: Bearer $TOKEN" "http://localhost:13010/api/lnmarkets-robust/dashboard"

# Test market endpoints
curl -H "Authorization: Bearer $TOKEN" "http://localhost:13010/api/market/data"
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure correct import path to `LNMarketsAPIv2`
2. **Credential Access**: Verify credential key names match your data structure
3. **Method Not Found**: Check domain-specific endpoint usage (`.user.`, `.futures.`, `.market.`)
4. **Authentication Errors**: Verify credentials are properly decrypted

### Debug Steps

1. Check service instantiation logs
2. Verify credential structure
3. Test individual endpoint calls
4. Review error messages for specific failures

## Migration Status

- ✅ Routes: 7/7 migrated (100%)
- ✅ Controllers: 5/5 migrated (100%)
- ✅ Services: 4/6 migrated (67%)
- ✅ Workers: 3/3 migrated (100%)
- ✅ Utils: 1/1 migrated (100%)

## Post-Migration

After migration:

1. Remove old service imports
2. Update documentation
3. Run comprehensive tests
4. Monitor for any issues
5. Update deployment configurations

## Support

For migration support:

1. Review [Troubleshooting Guide](./04-troubleshooting.md)
2. Check [Best Practices](./02-best-practices.md)
3. Review [Examples](./05-examples.md)
4. Contact development team

---

**Last Updated**: 2025-01-09  
**Version**: 1.0.0  
**Status**: Complete