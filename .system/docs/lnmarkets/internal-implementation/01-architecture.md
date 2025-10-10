# LN Markets API v2 - Arquitetura Interna

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 2.0.0  
> **Responsável**: Sistema LN Markets API v2  

## Índice

- [Visão Geral](#visão-geral)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Componentes Principais](#componentes-principais)
- [Fluxo de Dados](#fluxo-de-dados)
- [Padrões de Design](#padrões-de-design)
- [Configuração](#configuração)

## Visão Geral

A arquitetura LNMarketsAPIv2 foi projetada para ser modular, escalável e de fácil manutenção. Segue o padrão de separação de responsabilidades com endpoints organizados por domínio.

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    LN Markets API v2                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   User Domain   │  │ Futures Domain  │  │Market Domain │ │
│  │                 │  │                 │  │              │ │
│  │ • getUser()     │  │ • getPositions()│  │ • getTicker()│ │
│  │ • getDeposits() │  │ • closePosition()│  │ • getIndex() │ │
│  │ • getWithdrawals│  │ • openPosition()│  │ • getHistory()│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                  LNMarketsClient                            │
│                                                             │
│  • HTTP Client (Axios)                                     │
│  • Authentication (HMAC SHA256)                            │
│  • Error Handling                                          │
│  • Rate Limiting                                           │
│  • Retry Logic                                             │
└─────────────────────────────────────────────────────────────┘
```

## Componentes Principais

### 1. LNMarketsAPIv2 (Entry Point)

**Localização**: `backend/src/services/lnmarkets/LNMarketsAPIv2.service.ts`

```typescript
export class LNMarketsAPIv2 {
  private client: LNMarketsClient;
  public user: LNMarketsUserEndpoints;
  public futures: LNMarketsFuturesEndpoints;
  public market: LNMarketsMarketEndpoints;

  constructor(config: LNMarketsAPIv2Config) {
    this.client = new LNMarketsClient(config.credentials, config.logger);
    this.user = new LNMarketsUserEndpoints(this.client);
    this.futures = new LNMarketsFuturesEndpoints(this.client);
    this.market = new LNMarketsMarketEndpoints(this.client);
  }
}
```

**Responsabilidades:**
- Inicialização dos endpoints por domínio
- Configuração centralizada
- Logging de inicialização

### 2. LNMarketsClient (HTTP Client Base)

**Localização**: `backend/src/services/lnmarkets/LNMarketsClient.ts`

```typescript
export class LNMarketsClient {
  private credentials: LNMarketsCredentials;
  private baseURL: string;

  constructor(credentials: LNMarketsCredentials, private logger: Logger) {
    this.credentials = credentials;
    this.baseURL = credentials.isTestnet 
      ? 'https://api.testnet.lnmarkets.com' 
      : 'https://api.lnmarkets.com';
  }

  async request<T>(config: AxiosRequestConfig): Promise<T> {
    // Authentication, error handling, retry logic
  }
}
```

**Responsabilidades:**
- Autenticação HMAC SHA256
- Gerenciamento de HTTP requests
- Error handling centralizado
- Rate limiting
- Retry logic com exponential backoff

### 3. Domain-Specific Endpoints

#### User Endpoints
**Localização**: `backend/src/services/lnmarkets/endpoints/user.endpoints.ts`

```typescript
export class LNMarketsUserEndpoints {
  constructor(private client: LNMarketsClient) {}

  async getUser(): Promise<LNMarketsUser> {
    return this.client.request<LNMarketsUser>({
      method: 'GET',
      url: '/user'
    });
  }

  async getDeposits(type: 'bitcoin' | 'lightning'): Promise<LNMarketsDeposit[]> {
    return this.client.request<LNMarketsDeposit[]>({
      method: 'GET',
      url: `/user/deposits/${type}`
    });
  }
}
```

#### Futures Endpoints
**Localização**: `backend/src/services/lnmarkets/endpoints/futures.endpoints.ts`

```typescript
export class LNMarketsFuturesEndpoints {
  constructor(private client: LNMarketsClient) {}

  async getRunningPositions(): Promise<LNMarketsPosition[]> {
    return this.client.request<LNMarketsPosition[]>({
      method: 'GET',
      url: '/futures'
    });
  }

  async closePosition(positionId: string): Promise<LNMarketsPosition> {
    return this.client.request<LNMarketsPosition>({
      method: 'DELETE',
      url: `/futures/${positionId}`
    });
  }
}
```

#### Market Endpoints
**Localização**: `backend/src/services/lnmarkets/endpoints/market.endpoints.ts`

```typescript
export class LNMarketsMarketEndpoints {
  constructor(private client: LNMarketsClient) {}

  async getTicker(): Promise<LNMarketsTicker> {
    return this.client.request<LNMarketsTicker>({
      method: 'GET',
      url: '/futures/ticker'
    });
  }
}
```

### 4. TypeScript Interfaces

**Localização**: `backend/src/services/lnmarkets/types/`

```typescript
// user.types.ts
export interface LNMarketsUser {
  uid: string;
  username: string;
  balance: number;
  synthetic_usd_balance: number;
  role: string;
  email?: string;
  kyc_level?: number;
}

// futures.types.ts
export interface LNMarketsPosition {
  id: string;
  type: 'm' | 'l';
  side: 'b' | 's';
  quantity: number;
  leverage: number;
  entry_price: number;
  current_price: number;
  pnl: number;
  margin: number;
  created_at: string;
}

// market.types.ts
export interface LNMarketsTicker {
  bid: number;
  ask: number;
  last: number;
  volume_24h: number;
  high_24h: number;
  low_24h: number;
  timestamp: string;
}
```

## Fluxo de Dados

### 1. Inicialização

```typescript
// 1. Criação da instância
const lnMarketsService = new LNMarketsAPIv2({
  credentials: {
    apiKey: 'user_api_key',
    apiSecret: 'user_api_secret',
    passphrase: 'user_passphrase',
    isTestnet: false
  },
  logger: logger
});

// 2. Inicialização do cliente HTTP
// 3. Criação dos endpoints por domínio
// 4. Configuração de interceptors
```

### 2. Request Flow

```typescript
// 1. Chamada do endpoint
const user = await lnMarketsService.user.getUser();

// 2. Processamento no endpoint
// 3. Autenticação no client
// 4. HTTP request
// 5. Response processing
// 6. Error handling
// 7. Retorno tipado
```

### 3. Error Flow

```typescript
try {
  const user = await lnMarketsService.user.getUser();
} catch (error) {
  // 1. Error handling no client
  // 2. Retry logic (se aplicável)
  // 3. Logging do erro
  // 4. Propagação do erro
  // 5. Fallback (se configurado)
}
```

## Padrões de Design

### 1. Factory Pattern
- `LNMarketsAPIv2` atua como factory para endpoints
- Criação centralizada de instâncias

### 2. Strategy Pattern
- Diferentes estratégias de retry
- Diferentes estratégias de rate limiting

### 3. Adapter Pattern
- Adaptação da API externa para nossa interface
- Normalização de responses

### 4. Observer Pattern
- Logging de eventos
- Métricas e monitoramento

## Configuração

### Environment Variables

```typescript
interface LNMarketsConfig {
  credentials: {
    apiKey: string;
    apiSecret: string;
    passphrase: string;
    isTestnet: boolean;
  };
  logger: Logger;
  retryConfig?: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
  };
  rateLimitConfig?: {
    requestsPerMinute: number;
    burstLimit: number;
  };
}
```

### Logger Configuration

```typescript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'lnmarkets.log' })
  ]
});
```

## Integração com Serviços Existentes

### Dashboard Data Service

```typescript
export class DashboardDataService {
  async getDashboardDataForActiveAccount(userId: string): Promise<DashboardData> {
    const credentials = await this.accountCredentialsService.getCredentials(userId);
    
    const lnMarketsService = new LNMarketsAPIv2({
      credentials: {
        apiKey: credentials.credentials['API Key'],
        apiSecret: credentials.credentials['API Secret'],
        passphrase: credentials.credentials['Passphrase'],
        isTestnet: false
      },
      logger: this.logger
    });

    const [positions, balance, ticker] = await Promise.all([
      lnMarketsService.futures.getRunningPositions(),
      lnMarketsService.user.getUser(),
      lnMarketsService.market.getTicker()
    ]);

    return this.processDashboardData(positions, balance, ticker);
  }
}
```

## Referências

- [Best Practices](./02-best-practices.md)
- [Migration Guide](./03-migration-guide.md)
- [Troubleshooting](./04-troubleshooting.md)
- [Exemplos Práticos](./05-examples.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
