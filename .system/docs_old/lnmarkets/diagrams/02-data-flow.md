# LN Markets API v2 - Fluxo de Dados

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 2.0.0  
> **Responsável**: Sistema LN Markets API v2  

## Índice

- [Visão Geral](#visão-geral)
- [Fluxo de Dados Principal](#fluxo-de-dados-principal)
- [Fluxos Específicos](#fluxos-específicos)
- [Cache e Performance](#cache-e-performance)
- [Error Handling Flow](#error-handling-flow)

## Visão Geral

Este documento detalha os fluxos de dados na integração LN Markets API v2, desde a requisição inicial até a resposta final, incluindo cache, retry logic e error handling.

## Fluxo de Dados Principal

### 1. Fluxo Completo - Dashboard Data

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as Frontend
    participant API as Backend API
    participant Service as DashboardService
    participant Creds as AccountCredentialsService
    participant LNMarkets as LNMarketsAPIv2
    participant Client as LNMarketsClient
    participant External as LN Markets API

    User->>Frontend: Access Dashboard
    Frontend->>API: GET /api/lnmarkets-robust/dashboard
    API->>Service: getDashboardDataForActiveAccount(userId)
    
    Service->>Creds: getCredentials(userId)
    Creds->>Service: Return credentials
    
    Service->>LNMarkets: new LNMarketsAPIv2(credentials)
    LNMarkets->>Client: Initialize client
    
    par Parallel Requests
        Service->>LNMarkets: user.getUser()
        LNMarkets->>Client: GET /v2/user
        Client->>External: Authenticated request
        External->>Client: User data
        Client->>LNMarkets: Parsed user
        LNMarkets->>Service: User object
    and
        Service->>LNMarkets: futures.getRunningPositions()
        LNMarkets->>Client: GET /v2/futures
        Client->>External: Authenticated request
        External->>Client: Positions data
        Client->>LNMarkets: Parsed positions
        LNMarkets->>Service: Positions array
    and
        Service->>LNMarkets: market.getTicker()
        LNMarkets->>Client: GET /v2/futures/ticker
        Client->>External: Authenticated request
        External->>Client: Ticker data
        Client->>LNMarkets: Parsed ticker
        LNMarkets->>Service: Ticker object
    end
    
    Service->>Service: Process and combine data
    Service->>API: DashboardData object
    API->>Frontend: JSON response
    Frontend->>User: Display dashboard
```

### 2. Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant Client as LNMarketsClient
    participant Crypto as Crypto Module
    participant Timestamp as Timestamp
    participant External as LN Markets API

    Client->>Timestamp: Generate timestamp
    Timestamp->>Client: Unix timestamp
    
    Client->>Client: Build message string
    Note over Client: timestamp + method + path + query + body
    
    Client->>Crypto: Create HMAC SHA256
    Note over Crypto: message, apiSecret
    Crypto->>Crypto: Generate signature
    Crypto->>Crypto: Base64 encode
    Crypto->>Client: Return signature
    
    Client->>Client: Add auth headers
    Note over Client: LNM-ACCESS-KEY<br/>LNM-ACCESS-SIGNATURE<br/>LNM-ACCESS-TIMESTAMP<br/>LNM-ACCESS-PASSPHRASE
    
    Client->>External: Send authenticated request
    External->>Client: Response
```

## Fluxos Específicos

### 1. Fluxo de Trading (Open Position)

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as Frontend
    participant API as Backend API
    participant Controller as TradingController
    participant Service as LNMarketsAPIv2
    participant External as LN Markets API

    User->>Frontend: Open Position
    Frontend->>API: POST /api/trading/positions
    API->>Controller: openPosition(request)
    
    Controller->>Controller: Validate request data
    Note over Controller: quantity, leverage, side, etc.
    
    Controller->>Service: futures.openPosition(positionData)
    Service->>External: POST /v2/futures
    Note over Service: Authenticated request with position data
    
    External->>Service: Position created
    Service->>Controller: Position object
    
    Controller->>Controller: Log position creation
    Controller->>API: Success response
    API->>Frontend: Position data
    Frontend->>User: Position opened
```

### 2. Fluxo de Margin Guard

```mermaid
sequenceDiagram
    participant Scheduler as Scheduler
    participant Worker as MarginGuardWorker
    participant Service as LNMarketsAPIv2
    participant External as LN Markets API
    participant User as User (Notification)

    Scheduler->>Worker: Execute margin check
    Worker->>Service: user.getUser()
    Service->>External: GET /v2/user
    External->>Service: User balance
    Service->>Worker: User data
    
    Worker->>Service: futures.getRunningPositions()
    Service->>External: GET /v2/futures
    External->>Service: Active positions
    Service->>Worker: Positions array
    
    Worker->>Worker: Calculate margin ratios
    Note over Worker: Check if margin < 10%
    
    alt Critical Margin Detected
        Worker->>Service: futures.closePosition(id)
        Service->>External: DELETE /v2/futures/{id}
        External->>Service: Position closed
        Service->>Worker: Close confirmation
        
        Worker->>Worker: Log critical action
        Worker->>User: Send notification
        Note over User: "Position closed due to low margin"
    else Safe Margin
        Worker->>Worker: Log safe status
    end
```

### 3. Fluxo de Automation

```mermaid
sequenceDiagram
    participant Queue as Job Queue
    participant Worker as AutomationWorker
    participant Service as LNMarketsAPIv2
    participant External as LN Markets API

    Queue->>Worker: Execute automation
    Worker->>Worker: Load automation config
    
    Worker->>Service: market.getTicker()
    Service->>External: GET /v2/futures/ticker
    External->>Service: Market data
    Service->>Worker: Ticker object
    
    Worker->>Worker: Check conditions
    Note over Worker: Price, volume, indicators, etc.
    
    alt Conditions Met
        Worker->>Service: futures.openPosition(data)
        Service->>External: POST /v2/futures
        External->>Service: Position created
        Service->>Worker: Position object
        
        Worker->>Worker: Log automation action
        Worker->>Queue: Schedule next check
    else Conditions Not Met
        Worker->>Worker: Log skipped execution
        Worker->>Queue: Schedule next check
    end
```

## Cache e Performance

### 1. Fluxo com Cache

```mermaid
sequenceDiagram
    participant Service as DashboardService
    participant Cache as MarketDataCache
    participant LNMarkets as LNMarketsAPIv2
    participant External as LN Markets API

    Service->>Cache: getTicker()
    Cache->>Cache: Check cache validity
    Note over Cache: TTL = 5 seconds
    
    alt Cache Valid
        Cache->>Service: Return cached data
        Note over Service: Fast response
    else Cache Expired
        Cache->>LNMarkets: market.getTicker()
        LNMarkets->>External: GET /v2/futures/ticker
        External->>LNMarkets: Fresh ticker data
        LNMarkets->>Cache: Ticker object
        Cache->>Cache: Update cache with timestamp
        Cache->>Service: Fresh ticker data
    end
```

### 2. Fluxo de Rate Limiting

```mermaid
sequenceDiagram
    participant Client as LNMarketsClient
    participant RateLimiter as RateLimiter
    participant External as LN Markets API

    Client->>RateLimiter: Check rate limit
    RateLimiter->>RateLimiter: Count requests in window
    
    alt Within Rate Limit
        RateLimiter->>Client: Allow request
        Client->>External: Send request
        External->>Client: Response
        Client->>RateLimiter: Record successful request
    else Rate Limit Exceeded
        RateLimiter->>Client: Wait for reset
        Note over Client: Exponential backoff
        
        Client->>Client: Wait calculated time
        Client->>RateLimiter: Retry check
        RateLimiter->>Client: Allow request
        Client->>External: Send request
        External->>Client: Response
    end
```

## Error Handling Flow

### 1. Fluxo de Error Handling

```mermaid
flowchart TD
    A[API Request] --> B{Valid Request?}
    B -->|No| C[Return 400 Bad Request]
    B -->|Yes| D[Create LNMarketsAPIv2]
    
    D --> E[Call Endpoint Method]
    E --> F{HTTP Success?}
    
    F -->|No| G{Error Type?}
    G -->|401 Unauthorized| H[Log Auth Error]
    H --> I[Return 401]
    
    G -->|403 Forbidden| J[Log Rate Limit Error]
    J --> K[Return 429]
    
    G -->|500 Server Error| L[Log Server Error]
    L --> M{Retry Needed?}
    M -->|Yes| N[Exponential Backoff]
    N --> E
    M -->|No| O[Return 500]
    
    F -->|Yes| P[Parse Response]
    P --> Q{Valid Data?}
    Q -->|No| R[Log Warning]
    R --> S[Return Default Values]
    Q -->|Yes| T[Return Typed Data]
    
    style H fill:#ffcccc
    style J fill:#ffcccc
    style O fill:#ffcccc
    style S fill:#ffffcc
```

### 2. Fluxo de Retry Logic

```mermaid
sequenceDiagram
    participant Client as LNMarketsClient
    participant RetryLogic as Retry Logic
    participant External as LN Markets API

    Client->>RetryLogic: Make request
    RetryLogic->>External: HTTP Request
    
    alt Success Response
        External->>RetryLogic: 200 OK
        RetryLogic->>Client: Return data
    else Temporary Error
        External->>RetryLogic: 5xx Error
        RetryLogic->>RetryLogic: Check retry count
        
        alt Retry Count < Max
            RetryLogic->>RetryLogic: Calculate delay
            Note over RetryLogic: Exponential backoff: 1s, 2s, 4s, 8s
            RetryLogic->>RetryLogic: Wait delay
            RetryLogic->>External: Retry request
        else Max Retries Reached
            RetryLogic->>Client: Return error
        end
    else Permanent Error
        External->>RetryLogic: 4xx Error
        RetryLogic->>Client: Return error immediately
    end
```

### 3. Fluxo de Circuit Breaker

```mermaid
stateDiagram-v2
    [*] --> Closed
    
    Closed --> Open : Failure threshold reached
    Open --> HalfOpen : Timeout period elapsed
    HalfOpen --> Closed : Success
    HalfOpen --> Open : Failure
    
    state Closed {
        [*] --> AllowRequests
        AllowRequests --> RecordSuccess : Success
        AllowRequests --> RecordFailure : Failure
        RecordSuccess --> [*]
        RecordFailure --> CheckThreshold
        CheckThreshold --> [*] : Under threshold
        CheckThreshold --> Open : Over threshold
    }
    
    state Open {
        [*] --> RejectRequests
        RejectRequests --> [*]
    }
    
    state HalfOpen {
        [*] --> AllowLimitedRequests
        AllowLimitedRequests --> RecordSuccess : Success
        AllowLimitedRequests --> RecordFailure : Failure
        RecordSuccess --> Closed
        RecordFailure --> Open
    }
```

## Referências

- [Diagrama de Arquitetura](./01-architecture-diagram.md)
- [Arquitetura Interna](../internal-implementation/01-architecture.md)
- [Troubleshooting](../internal-implementation/04-troubleshooting.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
