# LND Unit Tests Documentation

**Data de Atualização**: 2025-10-11  
**Versão**: 1.0.0

## 📋 Visão Geral

Esta documentação cobre a estratégia completa de testes unitários para a integração LND no sistema Axisor, incluindo estrutura, padrões, e exemplos práticos.

## 🧪 Estrutura de Testes

### 1. **Organização de Arquivos**

```
backend/src/
├── services/lnd/
│   ├── __tests__/
│   │   ├── LNDService.test.ts
│   │   ├── LNDClient.test.ts
│   │   ├── LNDAuthService.test.ts
│   │   ├── LNDRateLimitService.test.ts
│   │   └── mocks/
│   │       ├── lnd-client.mock.ts
│   │       ├── lnd-auth.mock.ts
│   │       └── lnd-responses.mock.ts
│   ├── LNDService.ts
│   ├── LNDClient.ts
│   └── LNDAuthService.ts
├── routes/
│   ├── __tests__/
│   │   ├── lnd.routes.test.ts
│   │   └── lnd-sync.routes.test.ts
│   └── lnd.routes.ts
└── middleware/
    ├── __tests__/
    │   ├── lnd-auth.middleware.test.ts
    │   └── lnd-rate-limit.middleware.test.ts
    └── lnd-auth.middleware.ts
```

### 2. **Configuração de Testes**

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:lnd": "jest --testPathPattern=lnd",
    "test:unit": "jest --testPathPattern=__tests__"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^2.0.0"
  }
}
```

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/mocks/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000
};
```

## 🔧 Mocks e Fixtures

### 1. **Mock do LND Client**

```typescript
// src/services/lnd/__tests__/mocks/lnd-client.mock.ts
export class MockLNDClient {
  private responses: Map<string, any> = new Map();
  private errors: Map<string, Error> = new Map();
  
  // Configurar respostas mock
  setResponse(method: string, response: any): void {
    this.responses.set(method, response);
  }
  
  // Configurar erros mock
  setError(method: string, error: Error): void {
    this.errors.set(method, error);
  }
  
  // Implementar métodos LND
  async getInfo(): Promise<any> {
    if (this.errors.has('getInfo')) {
      throw this.errors.get('getInfo');
    }
    return this.responses.get('getInfo') || mockLNDInfo;
  }
  
  async createInvoice(request: any): Promise<any> {
    if (this.errors.has('createInvoice')) {
      throw this.errors.get('createInvoice');
    }
    return this.responses.get('createInvoice') || mockInvoice;
  }
  
  async getChannels(): Promise<any> {
    if (this.errors.has('getChannels')) {
      throw this.errors.get('getChannels');
    }
    return this.responses.get('getChannels') || mockChannels;
  }
  
  async getWalletBalance(): Promise<any> {
    if (this.errors.has('getWalletBalance')) {
      throw this.errors.get('getWalletBalance');
    }
    return this.responses.get('getWalletBalance') || mockWalletBalance;
  }
  
  async payInvoice(paymentRequest: string): Promise<any> {
    if (this.errors.has('payInvoice')) {
      throw this.errors.get('payInvoice');
    }
    return this.responses.get('payInvoice') || mockPayment;
  }
}

// Fixtures de dados
export const mockLNDInfo = {
  identity_pubkey: '03abc123...',
  alias: 'axisor-testnet-node',
  num_pending_channels: 0,
  num_active_channels: 2,
  num_peers: 3,
  block_height: 2500000,
  block_hash: 'abc123...',
  synced_to_chain: true,
  testnet: true,
  chains: ['bitcoin'],
  uris: ['03abc123@localhost:9735'],
  best_header_timestamp: '2025-10-11T15:30:00Z',
  version: '0.17.0-beta'
};

export const mockInvoice = {
  payment_request: 'lnbc100n1p...',
  add_index: 1,
  payment_addr: 'abc123...',
  r_hash: 'def456...'
};

export const mockChannels = {
  channels: [
    {
      active: true,
      remote_pubkey: '03def456...',
      channel_point: 'abc123:0',
      chan_id: '123456789',
      capacity: 1000000,
      local_balance: 400000,
      remote_balance: 600000,
      commit_fee: 1500,
      commit_weight: 724,
      fee_per_kw: 1250,
      unsettled_balance: 0,
      total_satoshis_received: 50000,
      total_satoshis_sent: 10000,
      num_updates: 25,
      pending_htlcs: [],
      csv_delay: 144,
      private: false,
      initiator: true,
      chan_status_flags: 'ChanStatusDefault'
    }
  ]
};

export const mockWalletBalance = {
  total_balance: 200000,
  confirmed_balance: 150000,
  unconfirmed_balance: 50000,
  locked_balance: 0,
  reserved_balance_anchor_chan: 0,
  account_balance: {
    default: {
      confirmed_balance: 150000,
      unconfirmed_balance: 50000
    }
  }
};

export const mockPayment = {
  payment_hash: 'abc123...',
  preimage: 'def456...',
  route: {
    total_time_lock: 100,
    total_fees: 1500,
    total_amt: 51500,
    hops: []
  },
  payment_error: '',
  payment_preimage: 'def456...',
  payment_route: {
    total_time_lock: 100,
    total_fees: 1500,
    total_amt: 51500,
    hops: []
  }
};
```

### 2. **Mock do LND Auth Service**

```typescript
// src/services/lnd/__tests__/mocks/lnd-auth.mock.ts
export class MockLNDAuthService {
  private isValid = true;
  private error: Error | null = null;
  
  setValid(valid: boolean): void {
    this.isValid = valid;
  }
  
  setError(error: Error): void {
    this.error = error;
  }
  
  async validateAuth(): Promise<boolean> {
    if (this.error) {
      throw this.error;
    }
    return this.isValid;
  }
  
  async getNodeId(): Promise<string> {
    if (this.error) {
      throw this.error;
    }
    return '03abc123...';
  }
  
  async getNetwork(): Promise<string> {
    if (this.error) {
      throw this.error;
    }
    return 'testnet';
  }
}
```

### 3. **Mock do Rate Limit Service**

```typescript
// src/services/lnd/__tests__/mocks/lnd-rate-limit.mock.ts
export class MockLNDRateLimitService {
  private allowed = true;
  private error: Error | null = null;
  
  setAllowed(allowed: boolean): void {
    this.allowed = allowed;
  }
  
  setError(error: Error): void {
    this.error = error;
  }
  
  async checkLimit(operation: string): Promise<boolean> {
    if (this.error) {
      throw this.error;
    }
    return this.allowed;
  }
  
  async getRemaining(operation: string): Promise<number> {
    return this.allowed ? 10 : 0;
  }
  
  async getRetryAfter(operation: string): Promise<number> {
    return this.allowed ? 0 : 60;
  }
}
```

## 🧪 Testes do LND Service

### 1. **Testes Básicos**

```typescript
// src/services/lnd/__tests__/LNDService.test.ts
import { LNDService } from '../LNDService';
import { MockLNDClient } from './mocks/lnd-client.mock';
import { MockLNDAuthService } from './mocks/lnd-auth.mock';
import { MockLNDRateLimitService } from './mocks/lnd-rate-limit.mock';
import { mockLNDInfo, mockInvoice, mockChannels, mockWalletBalance } from './mocks/lnd-responses.mock';

describe('LNDService', () => {
  let lndService: LNDService;
  let mockClient: MockLNDClient;
  let mockAuthService: MockLNDAuthService;
  let mockRateLimitService: MockLNDRateLimitService;
  
  beforeEach(() => {
    mockClient = new MockLNDClient();
    mockAuthService = new MockLNDAuthService();
    mockRateLimitService = new MockLNDRateLimitService();
    
    lndService = new LNDService(
      mockClient,
      mockAuthService,
      mockRateLimitService,
      mockLogger
    );
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('getInfo', () => {
    it('should return LND info successfully', async () => {
      // Arrange
      mockClient.setResponse('getInfo', mockLNDInfo);
      mockAuthService.setValid(true);
      mockRateLimitService.setAllowed(true);
      
      // Act
      const result = await lndService.getInfo();
      
      // Assert
      expect(result).toEqual(mockLNDInfo);
      expect(mockAuthService.validateAuth).toHaveBeenCalledTimes(1);
      expect(mockRateLimitService.checkLimit).toHaveBeenCalledWith('getInfo');
    });
    
    it('should throw error when authentication fails', async () => {
      // Arrange
      mockAuthService.setValid(false);
      
      // Act & Assert
      await expect(lndService.getInfo()).rejects.toThrow('Authentication failed');
    });
    
    it('should throw error when rate limit exceeded', async () => {
      // Arrange
      mockAuthService.setValid(true);
      mockRateLimitService.setAllowed(false);
      
      // Act & Assert
      await expect(lndService.getInfo()).rejects.toThrow('Rate limit exceeded');
    });
    
    it('should handle LND client errors', async () => {
      // Arrange
      mockAuthService.setValid(true);
      mockRateLimitService.setAllowed(true);
      mockClient.setError('getInfo', new Error('LND connection failed'));
      
      // Act & Assert
      await expect(lndService.getInfo()).rejects.toThrow('LND connection failed');
    });
  });
  
  describe('createInvoice', () => {
    it('should create invoice successfully', async () => {
      // Arrange
      const request = { amount: 1000, memo: 'Test invoice' };
      mockClient.setResponse('createInvoice', mockInvoice);
      mockAuthService.setValid(true);
      mockRateLimitService.setAllowed(true);
      
      // Act
      const result = await lndService.createInvoice(request);
      
      // Assert
      expect(result).toEqual(mockInvoice);
      expect(mockClient.createInvoice).toHaveBeenCalledWith(request);
    });
    
    it('should validate request parameters', async () => {
      // Arrange
      const invalidRequest = { amount: -1, memo: 'Test' };
      
      // Act & Assert
      await expect(lndService.createInvoice(invalidRequest)).rejects.toThrow('Invalid amount');
    });
  });
  
  describe('getChannels', () => {
    it('should return channels successfully', async () => {
      // Arrange
      mockClient.setResponse('getChannels', mockChannels);
      mockAuthService.setValid(true);
      mockRateLimitService.setAllowed(true);
      
      // Act
      const result = await lndService.getChannels();
      
      // Assert
      expect(result).toEqual(mockChannels);
      expect(result.channels).toHaveLength(1);
      expect(result.channels[0].active).toBe(true);
    });
  });
  
  describe('getWalletBalance', () => {
    it('should return wallet balance successfully', async () => {
      // Arrange
      mockClient.setResponse('getWalletBalance', mockWalletBalance);
      mockAuthService.setValid(true);
      mockRateLimitService.setAllowed(true);
      
      // Act
      const result = await lndService.getWalletBalance();
      
      // Assert
      expect(result).toEqual(mockWalletBalance);
      expect(result.total_balance).toBe(200000);
      expect(result.confirmed_balance).toBe(150000);
    });
  });
});
```

### 2. **Testes de Integração**

```typescript
// src/services/lnd/__tests__/LNDService.integration.test.ts
import { LNDService } from '../LNDService';
import { LNDClient } from '../LNDClient';
import { LNDAuthService } from '../LNDAuthService';
import { LNDRateLimitService } from '../LNDRateLimitService';

describe('LNDService Integration Tests', () => {
  let lndService: LNDService;
  
  beforeAll(async () => {
    // Configurar serviços reais para testes de integração
    const config = {
      testnet: {
        baseURL: 'https://localhost:18080',
        tlsCert: process.env.LND_TESTNET_TLS_CERT,
        macaroon: process.env.LND_TESTNET_MACAROON
      }
    };
    
    const client = new LNDClient(config);
    const authService = new LNDAuthService(config);
    const rateLimitService = new LNDRateLimitService(config);
    
    lndService = new LNDService(client, authService, rateLimitService, mockLogger);
  });
  
  describe('Real LND Integration', () => {
    it('should connect to real LND testnet', async () => {
      // Act
      const info = await lndService.getInfo();
      
      // Assert
      expect(info).toBeDefined();
      expect(info.identity_pubkey).toBeDefined();
      expect(info.testnet).toBe(true);
    });
    
    it('should create and verify invoice', async () => {
      // Arrange
      const request = { amount: 1000, memo: 'Integration test' };
      
      // Act
      const invoice = await lndService.createInvoice(request);
      
      // Assert
      expect(invoice.payment_request).toBeDefined();
      expect(invoice.payment_request).toMatch(/^lnbc/);
      expect(invoice.add_index).toBeGreaterThan(0);
    });
  });
});
```

## 🧪 Testes de Rotas

### 1. **Testes de Rotas LND**

```typescript
// src/routes/__tests__/lnd.routes.test.ts
import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../../app';
import { MockLNDService } from '../mocks/lnd-service.mock';

describe('LND Routes', () => {
  let app: FastifyInstance;
  let mockLNDService: MockLNDService;
  
  beforeAll(async () => {
    mockLNDService = new MockLNDService();
    app = await buildApp();
    
    // Substituir serviço real pelo mock
    app.decorate('lndService', mockLNDService);
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('GET /api/lnd/info', () => {
    it('should return LND info', async () => {
      // Arrange
      mockLNDService.setResponse('getInfo', mockLNDInfo);
      
      // Act
      const response = await request(app)
        .get('/api/lnd/info')
        .expect(200);
      
      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockLNDInfo);
    });
    
    it('should handle service errors', async () => {
      // Arrange
      mockLNDService.setError('getInfo', new Error('Service unavailable'));
      
      // Act
      const response = await request(app)
        .get('/api/lnd/info')
        .expect(500);
      
      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Service unavailable');
    });
  });
  
  describe('POST /api/lnd/invoices', () => {
    it('should create invoice successfully', async () => {
      // Arrange
      const requestBody = { amount: 1000, memo: 'Test invoice' };
      mockLNDService.setResponse('createInvoice', mockInvoice);
      
      // Act
      const response = await request(app)
        .post('/api/lnd/invoices')
        .send(requestBody)
        .expect(200);
      
      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockInvoice);
    });
    
    it('should validate request body', async () => {
      // Arrange
      const invalidBody = { amount: -1, memo: 'Test' };
      
      // Act
      const response = await request(app)
        .post('/api/lnd/invoices')
        .send(invalidBody)
        .expect(400);
      
      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid amount');
    });
  });
  
  describe('GET /api/lnd/wallet/balance', () => {
    it('should return wallet balance', async () => {
      // Arrange
      mockLNDService.setResponse('getWalletBalance', mockWalletBalance);
      
      // Act
      const response = await request(app)
        .get('/api/lnd/wallet/balance')
        .expect(200);
      
      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockWalletBalance);
    });
  });
});
```

## 🧪 Testes de Middleware

### 1. **Testes de Middleware de Autenticação**

```typescript
// src/middleware/__tests__/lnd-auth.middleware.test.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { lndAuthMiddleware } from '../lnd-auth.middleware';
import { MockLNDService } from '../../services/lnd/__tests__/mocks/lnd-service.mock';

describe('LND Auth Middleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let mockLNDService: MockLNDService;
  
  beforeEach(() => {
    mockRequest = {
      headers: {},
      ip: '127.0.0.1'
    };
    
    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
    
    mockLNDService = new MockLNDService();
  });
  
  it('should allow request when LND is available', async () => {
    // Arrange
    mockLNDService.setResponse('getInfo', mockLNDInfo);
    
    // Act
    await lndAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);
    
    // Assert
    expect(mockReply.status).not.toHaveBeenCalled();
    expect(mockRequest.lnd).toBeDefined();
    expect(mockRequest.lnd.authenticated).toBe(true);
  });
  
  it('should reject request when LND is unavailable', async () => {
    // Arrange
    mockLNDService.setError('getInfo', new Error('LND unavailable'));
    
    // Act
    await lndAuthMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);
    
    // Assert
    expect(mockReply.status).toHaveBeenCalledWith(503);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      error: 'LND service unavailable'
    });
  });
});
```

### 2. **Testes de Middleware de Rate Limiting**

```typescript
// src/middleware/__tests__/lnd-rate-limit.middleware.test.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { lndRateLimitMiddleware } from '../lnd-rate-limit.middleware';
import { MockLNDRateLimitService } from '../../services/lnd/__tests__/mocks/lnd-rate-limit.mock';

describe('LND Rate Limit Middleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let mockRateLimitService: MockLNDRateLimitService;
  
  beforeEach(() => {
    mockRequest = {
      ip: '127.0.0.1',
      routerPath: '/api/lnd/info',
      method: 'GET'
    };
    
    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      header: jest.fn().mockReturnThis()
    };
    
    mockRateLimitService = new MockLNDRateLimitService();
  });
  
  it('should allow request when under rate limit', async () => {
    // Arrange
    mockRateLimitService.setAllowed(true);
    
    // Act
    await lndRateLimitMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);
    
    // Assert
    expect(mockReply.status).not.toHaveBeenCalledWith(429);
    expect(mockReply.header).toHaveBeenCalledWith('X-RateLimit-Limit', expect.any(Number));
    expect(mockReply.header).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
  });
  
  it('should reject request when rate limit exceeded', async () => {
    // Arrange
    mockRateLimitService.setAllowed(false);
    
    // Act
    await lndRateLimitMiddleware(mockRequest as FastifyRequest, mockReply as FastifyReply);
    
    // Assert
    expect(mockReply.status).toHaveBeenCalledWith(429);
    expect(mockReply.send).toHaveBeenCalledWith({
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: expect.any(Number),
      limit: expect.any(Number),
      window: expect.any(Number)
    });
  });
});
```

## 📊 Cobertura de Testes

### 1. **Configuração de Cobertura**

```javascript
// jest.config.js
module.exports = {
  // ... outras configurações
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/mocks/**',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/lnd/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

### 2. **Relatório de Cobertura**

```bash
# Gerar relatório de cobertura
npm run test:coverage

# Verificar cobertura específica do LND
npm run test:lnd -- --coverage

# Gerar relatório HTML
npm run test:coverage -- --coverageReporters=html
```

## 🚀 Execução de Testes

### 1. **Scripts de Teste**

```bash
#!/bin/bash
# run-lnd-tests.sh

echo "🧪 Running LND Unit Tests"
echo "========================="

# Executar todos os testes
echo "📋 Running all tests..."
npm test

# Executar testes específicos do LND
echo "🔗 Running LND-specific tests..."
npm run test:lnd

# Executar testes com cobertura
echo "📊 Running tests with coverage..."
npm run test:coverage

# Executar testes em modo watch
echo "👀 Running tests in watch mode..."
npm run test:watch
```

### 2. **Testes em CI/CD**

```yaml
# .github/workflows/test.yml
name: LND Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:lnd
      
      - name: Run tests with coverage
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## 📋 Checklist de Testes

### ✅ Estrutura
- [ ] Arquivos de teste organizados
- [ ] Mocks configurados
- [ ] Fixtures criadas
- [ ] Configuração Jest funcionando

### ✅ Cobertura
- [ ] Testes para todos os serviços
- [ ] Testes para todas as rotas
- [ ] Testes para todos os middlewares
- [ ] Cobertura acima de 80%

### ✅ Qualidade
- [ ] Testes unitários isolados
- [ ] Testes de integração funcionando
- [ ] Mocks realistas
- [ ] Assertions claras

### ✅ CI/CD
- [ ] Testes executando em CI
- [ ] Cobertura reportada
- [ ] Falhas bloqueando deploy
- [ ] Relatórios de cobertura

## 🔗 Referências

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Testing Best Practices**: https://testingjavascript.com/
- **LND Testing**: https://docs.lightning.engineering/lightning-network-tools/lnd
- **Node.js Testing**: https://nodejs.org/en/docs/guides/testing/
