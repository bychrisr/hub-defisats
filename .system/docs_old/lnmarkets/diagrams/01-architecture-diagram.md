# LN Markets API v2 - Diagrama de Arquitetura

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 2.0.0  
> **Responsável**: Sistema LN Markets API v2  

## Índice

- [Visão Geral](#visão-geral)
- [Diagrama de Arquitetura](#diagrama-de-arquitetura)
- [Componentes](#componentes)
- [Fluxo de Dados](#fluxo-de-dados)
- [Integração](#integração)

## Visão Geral

Este documento apresenta os diagramas de arquitetura da integração LN Markets API v2, mostrando a estrutura modular e os fluxos de dados.

## Diagrama de Arquitetura

### Arquitetura Geral

```mermaid
graph TB
    subgraph "Frontend"
        UI[User Interface]
        Hooks[React Hooks]
        Context[RealtimeDataContext]
    end

    subgraph "Backend Services"
        API[Fastify API]
        Routes[Route Handlers]
        Controllers[Controllers]
    end

    subgraph "LN Markets API v2"
        APIv2[LNMarketsAPIv2]
        Client[LNMarketsClient]
        
        subgraph "Domain Endpoints"
            UserEP[User Endpoints]
            FuturesEP[Futures Endpoints]
            MarketEP[Market Endpoints]
        end
    end

    subgraph "External"
        LNMarketsAPI[LN Markets API]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL)]
        Redis[(Redis Cache)]
    end

    UI --> Hooks
    Hooks --> Context
    Context --> API
    API --> Routes
    Routes --> Controllers
    Controllers --> APIv2
    APIv2 --> Client
    APIv2 --> UserEP
    APIv2 --> FuturesEP
    APIv2 --> MarketEP
    Client --> LNMarketsAPI
    Controllers --> DB
    Controllers --> Redis
```

### Arquitetura Detalhada do LNMarketsAPIv2

```mermaid
graph TB
    subgraph "LNMarketsAPIv2 Service"
        APIv2[LNMarketsAPIv2]
        
        subgraph "Domain Services"
            UserService[User Service]
            FuturesService[Futures Service]
            MarketService[Market Service]
        end
        
        subgraph "Core Client"
            HTTPClient[HTTP Client]
            Auth[Authentication]
            Retry[Retry Logic]
            RateLimit[Rate Limiting]
        end
    end

    subgraph "External API"
        LNMarketsAPI[LN Markets API v2]
    end

    subgraph "Configuration"
        Credentials[Credentials]
        Logger[Logger]
        Config[Config]
    end

    APIv2 --> UserService
    APIv2 --> FuturesService
    APIv2 --> MarketService
    
    UserService --> HTTPClient
    FuturesService --> HTTPClient
    MarketService --> HTTPClient
    
    HTTPClient --> Auth
    HTTPClient --> Retry
    HTTPClient --> RateLimit
    HTTPClient --> LNMarketsAPI
    
    Credentials --> Auth
    Logger --> APIv2
    Config --> HTTPClient
```

## Componentes

### 1. LNMarketsAPIv2 (Entry Point)

```mermaid
classDiagram
    class LNMarketsAPIv2 {
        -client: LNMarketsClient
        +user: LNMarketsUserEndpoints
        +futures: LNMarketsFuturesEndpoints
        +market: LNMarketsMarketEndpoints
        +constructor(config)
    }

    class LNMarketsAPIv2Config {
        +credentials: LNMarketsCredentials
        +logger: Logger
    }

    class LNMarketsCredentials {
        +apiKey: string
        +apiSecret: string
        +passphrase: string
        +isTestnet: boolean
    }

    LNMarketsAPIv2 --> LNMarketsAPIv2Config
    LNMarketsAPIv2Config --> LNMarketsCredentials
```

### 2. Domain Endpoints

```mermaid
classDiagram
    class LNMarketsUserEndpoints {
        -client: LNMarketsClient
        +getUser(): Promise~LNMarketsUser~
        +getDeposits(type): Promise~LNMarketsDeposit[]~
        +getWithdrawals(): Promise~LNMarketsWithdrawal[]~
    }

    class LNMarketsFuturesEndpoints {
        -client: LNMarketsClient
        +getRunningPositions(): Promise~LNMarketsPosition[]~
        +openPosition(data): Promise~LNMarketsPosition~
        +closePosition(id): Promise~LNMarketsPosition~
    }

    class LNMarketsMarketEndpoints {
        -client: LNMarketsClient
        +getTicker(): Promise~LNMarketsTicker~
        +getIndexHistory(): Promise~LNMarketsIndex[]~
    }

    class LNMarketsClient {
        -credentials: LNMarketsCredentials
        -logger: Logger
        +request~T~(config): Promise~T~
        -authenticateRequest(config): AxiosRequestConfig
    }

    LNMarketsUserEndpoints --> LNMarketsClient
    LNMarketsFuturesEndpoints --> LNMarketsClient
    LNMarketsMarketEndpoints --> LNMarketsClient
```

### 3. Data Types

```mermaid
classDiagram
    class LNMarketsUser {
        +uid: string
        +username: string
        +balance: number
        +synthetic_usd_balance: number
        +role: string
    }

    class LNMarketsPosition {
        +id: string
        +type: string
        +side: string
        +quantity: number
        +leverage: number
        +entry_price: number
        +current_price: number
        +pnl: number
        +margin: number
    }

    class LNMarketsTicker {
        +bid: number
        +ask: number
        +last: number
        +volume_24h: number
        +high_24h: number
        +low_24h: number
        +timestamp: string
    }
```

## Fluxo de Dados

### 1. Fluxo de Request

```mermaid
sequenceDiagram
    participant UI as Frontend UI
    participant API as Backend API
    participant APIv2 as LNMarketsAPIv2
    participant Client as LNMarketsClient
    participant LNMarkets as LN Markets API

    UI->>API: HTTP Request
    API->>APIv2: Create service instance
    APIv2->>Client: Initialize client
    API->>APIv2: Call endpoint method
    APIv2->>Client: Make HTTP request
    Client->>Client: Add authentication
    Client->>Client: Apply rate limiting
    Client->>LNMarkets: HTTP Request
    LNMarkets->>Client: HTTP Response
    Client->>APIv2: Parsed response
    APIv2->>API: Typed data
    API->>UI: JSON response
```

### 2. Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant Client as LNMarketsClient
    participant Crypto as Crypto Module
    participant LNMarkets as LN Markets API

    Client->>Client: Prepare request
    Client->>Client: Generate timestamp
    Client->>Crypto: Create HMAC signature
    Crypto->>Crypto: HMAC SHA256
    Crypto->>Crypto: Base64 encode
    Crypto->>Client: Return signature
    Client->>Client: Add auth headers
    Client->>LNMarkets: Authenticated request
    LNMarkets->>Client: Response
```

### 3. Fluxo de Error Handling

```mermaid
flowchart TD
    A[API Request] --> B{Valid Request?}
    B -->|No| C[Return 400 Bad Request]
    B -->|Yes| D[Create LNMarketsAPIv2]
    D --> E[Call Endpoint Method]
    E --> F{HTTP Success?}
    F -->|No| G{Retry Needed?}
    G -->|Yes| H[Exponential Backoff]
    H --> E
    G -->|No| I[Log Error]
    I --> J[Return Error Response]
    F -->|Yes| K[Parse Response]
    K --> L[Validate Data]
    L --> M{Valid Data?}
    M -->|No| N[Log Warning]
    N --> O[Return Default Values]
    M -->|Yes| P[Return Typed Data]
```

## Integração

### 1. Integração com Dashboard

```mermaid
graph TB
    subgraph "Dashboard Service"
        Dashboard[DashboardDataService]
        AccountCreds[AccountCredentialsService]
    end

    subgraph "LN Markets API v2"
        APIv2[LNMarketsAPIv2]
        UserEP[User Endpoints]
        FuturesEP[Futures Endpoints]
        MarketEP[Market Endpoints]
    end

    Dashboard --> AccountCreds
    Dashboard --> APIv2
    APIv2 --> UserEP
    APIv2 --> FuturesEP
    APIv2 --> MarketEP

    Dashboard --> |getUserBalance| UserEP
    Dashboard --> |getPositions| FuturesEP
    Dashboard --> |getTicker| MarketEP
```

### 2. Integração com Workers

```mermaid
graph TB
    subgraph "Workers"
        MarginGuard[Margin Guard Worker]
        Automation[Automation Worker]
        Scheduler[Scheduler Worker]
    end

    subgraph "LN Markets API v2"
        APIv2[LNMarketsAPIv2]
    end

    subgraph "Queue System"
        Queue[Job Queue]
        Redis[(Redis)]
    end

    Queue --> MarginGuard
    Queue --> Automation
    Queue --> Scheduler
    
    MarginGuard --> APIv2
    Automation --> APIv2
    Scheduler --> APIv2
    
    Queue --> Redis
```

### 3. Integração com Frontend

```mermaid
graph TB
    subgraph "Frontend"
        Dashboard[Dashboard Component]
        Trading[Trading Component]
        Portfolio[Portfolio Component]
    end

    subgraph "Hooks"
        useDashboard[useOptimizedDashboardData]
        usePositions[useActiveAccountData]
        useMarket[useRealtimeData]
    end

    subgraph "Context"
        RealtimeContext[RealtimeDataContext]
        WebSocket[WebSocket Connection]
    end

    Dashboard --> useDashboard
    Trading --> usePositions
    Portfolio --> useMarket
    
    useDashboard --> RealtimeContext
    usePositions --> RealtimeContext
    useMarket --> RealtimeContext
    
    RealtimeContext --> WebSocket
    WebSocket --> |accountEventManager| RealtimeContext
```

## Referências

- [Arquitetura Interna](../internal-implementation/01-architecture.md)
- [Fluxo de Dados](./02-data-flow.md)
- [Best Practices](../internal-implementation/02-best-practices.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
