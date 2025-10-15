---
title: "Axisor - Data Flow Diagrams"
version: "1.0.0"
created: "2025-01-26"
updated: "2025-01-26"
author: "Documentation Agent"
status: "active"
tags: ["architecture", "data-flow", "diagrams", "system"]
---

# Axisor - Data Flow Diagrams

> **Status**: Active  
> **Última Atualização**: 2025-01-26  
> **Versão**: 1.0.0  
> **Responsável**: Axisor System Architecture  

## Índice

- [Visão Geral](#visão-geral)
- [Fluxo de Dados de Autenticação](#fluxo-de-dados-de-autenticação)
- [Fluxo de Dados de Trading](#fluxo-de-dados-de-trading)
- [Fluxo de Dados de Automação](#fluxo-de-dados-de-automação)
- [Fluxo de Dados de Monitoramento](#fluxo-de-dados-de-monitoramento)
- [Fluxo de Dados de Notificação](#fluxo-de-dados-de-notificação)
- [Fluxo de Dados de Cache](#fluxo-de-dados-de-cache)
- [Fluxo de Dados de Pagamento](#fluxo-de-dados-de-pagamento)
- [Fluxo de Dados de WebSocket](#fluxo-de-dados-de-websocket)
- [Referências](#referências)

## Visão Geral

Este documento descreve os principais fluxos de dados no sistema Axisor, mostrando como as informações fluem entre diferentes componentes, desde a entrada do usuário até o processamento final e armazenamento.

## Fluxo de Dados de Autenticação

### Login e Autenticação

```mermaid
sequenceDiagram
    participant User as Usuário
    participant Frontend as React Frontend
    participant Backend as Fastify Backend
    participant AuthService as Auth Service
    participant Database as PostgreSQL
    participant Redis as Redis Cache
    
    User->>Frontend: 1. Login Request
    Frontend->>Backend: 2. POST /api/auth/login
    Backend->>AuthService: 3. Validate Credentials
    
    AuthService->>Database: 4. Query User by Email
    Database-->>AuthService: 5. User Data + Password Hash
    AuthService->>AuthService: 6. Verify Password (bcrypt)
    
    alt Credentials Valid
        AuthService->>AuthService: 7. Generate JWT Token
        AuthService->>AuthService: 8. Generate Refresh Token
        AuthService->>Redis: 9. Store Session Data
        AuthService->>Database: 10. Update Last Login
        AuthService-->>Backend: 11. Auth Success + Tokens
        Backend-->>Frontend: 12. JWT + User Data
        Frontend->>Redis: 13. Store Tokens (Client-side)
        Frontend-->>User: 14. Login Success
    else Credentials Invalid
        AuthService-->>Backend: 15. Auth Failure
        Backend-->>Frontend: 16. Error Response
        Frontend-->>User: 17. Login Failed
    end
```

### Refresh Token Flow

```mermaid
sequenceDiagram
    participant Frontend as React Frontend
    participant Backend as Fastify Backend
    participant AuthService as Auth Service
    participant Redis as Redis Cache
    
    Frontend->>Backend: 1. Request with Expired JWT
    Backend->>AuthService: 2. Validate Refresh Token
    AuthService->>Redis: 3. Check Refresh Token
    
    alt Token Valid
        AuthService->>AuthService: 4. Generate New JWT
        AuthService->>Redis: 5. Update Session
        AuthService-->>Backend: 6. New JWT Token
        Backend-->>Frontend: 7. New Token
    else Token Invalid/Expired
        AuthService-->>Backend: 8. Token Invalid
        Backend-->>Frontend: 9. Redirect to Login
    end
```

## Fluxo de Dados de Trading

### Execução de Trade

```mermaid
sequenceDiagram
    participant User as Usuário
    participant Frontend as React Frontend
    participant Backend as Fastify Backend
    participant TradingService as Trading Service
    participant LNMarkets as LN Markets API
    participant Database as PostgreSQL
    participant WebSocket as WebSocket Server
    
    User->>Frontend: 1. Create Trade Order
    Frontend->>Backend: 2. POST /api/trades
    Backend->>TradingService: 3. Validate Trade Request
    
    TradingService->>Database: 4. Get User Account
    Database-->>TradingService: 5. Account Credentials
    TradingService->>LNMarkets: 6. Authenticate & Execute Trade
    
    LNMarkets-->>TradingService: 7. Trade Result
    TradingService->>Database: 8. Log Trade Execution
    TradingService->>WebSocket: 9. Broadcast Update
    
    WebSocket->>Frontend: 10. Real-time Update
    TradingService-->>Backend: 11. Trade Success
    Backend-->>Frontend: 12. Trade Confirmation
    Frontend-->>User: 13. Trade Executed
```

### Consulta de Posições

```mermaid
sequenceDiagram
    participant Frontend as React Frontend
    participant Backend as Fastify Backend
    participant TradingService as Trading Service
    participant LNMarkets as LN Markets API
    participant Cache as Redis Cache
    participant Database as PostgreSQL
    
    Frontend->>Backend: 1. GET /api/positions
    Backend->>TradingService: 2. Get User Positions
    
    TradingService->>Cache: 3. Check Cache
    alt Cache Hit
        Cache-->>TradingService: 4. Cached Data
    else Cache Miss
        TradingService->>Database: 5. Get Account Credentials
        Database-->>TradingService: 6. Credentials
        TradingService->>LNMarkets: 7. Fetch Positions
        LNMarkets-->>TradingService: 8. Position Data
        TradingService->>Cache: 9. Store in Cache (TTL: 30s)
    end
    
    TradingService-->>Backend: 10. Position Data
    Backend-->>Frontend: 11. Positions Response
```

## Fluxo de Dados de Automação

### Criação de Automação

```mermaid
sequenceDiagram
    participant User as Usuário
    participant Frontend as React Frontend
    participant Backend as Fastify Backend
    participant AutomationService as Automation Service
    participant Database as PostgreSQL
    participant Queue as BullMQ Queue
    participant Worker as Automation Worker
    
    User->>Frontend: 1. Create Automation
    Frontend->>Backend: 2. POST /api/automations
    Backend->>AutomationService: 3. Validate Automation Config
    
    AutomationService->>Database: 4. Save Automation
    Database-->>AutomationService: 5. Automation ID
    AutomationService->>Queue: 6. Queue Automation Job
    AutomationService-->>Backend: 7. Automation Created
    Backend-->>Frontend: 8. Success Response
    
    Queue->>Worker: 9. Process Automation Job
    Worker->>Worker: 10. Monitor Market Conditions
    Worker->>Worker: 11. Execute When Conditions Met
    Worker->>Database: 12. Log Automation Results
```

### Execução de Automação

```mermaid
sequenceDiagram
    participant Worker as Automation Worker
    participant LNMarkets as LN Markets API
    participant Database as PostgreSQL
    participant NotificationService as Notification Service
    participant WebSocket as WebSocket Server
    
    Worker->>LNMarkets: 1. Get Market Data
    LNMarkets-->>Worker: 2. Current Market Prices
    Worker->>Database: 3. Get Automation Config
    Database-->>Worker: 4. Automation Rules
    
    Worker->>Worker: 5. Evaluate Conditions
    
    alt Conditions Met
        Worker->>LNMarkets: 6. Execute Trade
        LNMarkets-->>Worker: 7. Trade Result
        Worker->>Database: 8. Log Trade
        Worker->>NotificationService: 9. Send Notification
        Worker->>WebSocket: 10. Broadcast Update
    else Conditions Not Met
        Worker->>Worker: 11. Continue Monitoring
    end
```

## Fluxo de Dados de Monitoramento

### Margin Guard Monitoring

```mermaid
sequenceDiagram
    participant Cron as Cron Job
    participant MarginWorker as Margin Monitor Worker
    participant Database as PostgreSQL
    participant LNMarkets as LN Markets API
    participant LND as Lightning Node
    participant NotificationService as Notification Service
    
    Cron->>MarginWorker: 1. Trigger Monitoring (every 30s)
    MarginWorker->>Database: 2. Get Active Configs
    Database-->>MarginWorker: 3. User Configurations
    
    loop For Each User
        MarginWorker->>LNMarkets: 4. Get User Positions
        LNMarkets-->>MarginWorker: 5. Position Data
        MarginWorker->>MarginWorker: 6. Calculate Margin Distance
        
        alt Margin Below Threshold
            MarginWorker->>LND: 7. Create Invoice
            LND-->>MarginWorker: 8. Lightning Invoice
            MarginWorker->>LNMarkets: 9. Add Margin
            LNMarkets-->>MarginWorker: 10. Margin Added
            MarginWorker->>Database: 11. Log Action
            MarginWorker->>NotificationService: 12. Send Alert
        else Margin OK
            MarginWorker->>MarginWorker: 13. Continue Monitoring
        end
    end
```

### Health Monitoring

```mermaid
sequenceDiagram
    participant HealthChecker as Health Checker
    participant Database as PostgreSQL
    participant Redis as Redis Cache
    participant LNMarkets as LN Markets API
    participant LND as Lightning Node
    participant Alerting as Alerting Service
    
    HealthChecker->>Database: 1. Test Database Connection
    Database-->>HealthChecker: 2. Connection OK
    
    HealthChecker->>Redis: 3. Test Redis Connection
    Redis-->>HealthChecker: 4. Connection OK
    
    HealthChecker->>LNMarkets: 5. Test API Connection
    LNMarkets-->>HealthChecker: 6. API Response
    
    HealthChecker->>LND: 7. Test Lightning Node
    LND-->>HealthChecker: 8. Node Status
    
    alt All Services Healthy
        HealthChecker->>Alerting: 9. Update Health Status
    else Service Unhealthy
        HealthChecker->>Alerting: 10. Send Alert
        Alerting->>Alerting: 11. Notify Administrators
    end
```

## Fluxo de Dados de Notificação

### Envio de Notificação

```mermaid
sequenceDiagram
    participant System as System Event
    participant NotificationService as Notification Service
    participant Database as PostgreSQL
    participant Telegram as Telegram Bot
    participant Email as SMTP Server
    participant Push as Push Service
    participant WebSocket as WebSocket Server
    
    System->>NotificationService: 1. Trigger Notification
    NotificationService->>Database: 2. Get User Preferences
    Database-->>NotificationService: 3. Notification Settings
    
    alt Email Enabled
        NotificationService->>Email: 4. Send Email
        Email-->>NotificationService: 5. Email Sent
    end
    
    alt Telegram Enabled
        NotificationService->>Telegram: 6. Send Telegram Message
        Telegram-->>NotificationService: 7. Message Sent
    end
    
    alt Push Enabled
        NotificationService->>Push: 8. Send Push Notification
        Push-->>NotificationService: 9. Push Sent
    end
    
    NotificationService->>WebSocket: 10. Send In-App Notification
    NotificationService->>Database: 11. Log Notification
```

## Fluxo de Dados de Cache

### Cache Strategy

```mermaid
graph TD
    A[Request] --> B{Cache Check}
    B -->|Cache Hit| C[Return Cached Data]
    B -->|Cache Miss| D[Fetch from Source]
    D --> E[Store in Cache]
    E --> F[Return Data]
    
    G[Cache TTL Strategy] --> H[Market Data: 30s]
    G --> I[User Data: 5min]
    G --> J[Static Data: 1h]
    
    K[Cache Invalidation] --> L[Time-based TTL]
    K --> M[Event-based Invalidation]
    K --> N[Manual Invalidation]
```

### Cache Implementation

```mermaid
sequenceDiagram
    participant Request as API Request
    participant Cache as Redis Cache
    participant Service as Business Service
    participant Database as PostgreSQL
    
    Request->>Cache: 1. Check Cache Key
    alt Cache Hit
        Cache-->>Request: 2. Return Cached Data
    else Cache Miss
        Cache->>Service: 3. Fetch from Service
        Service->>Database: 4. Query Database
        Database-->>Service: 5. Return Data
        Service-->>Cache: 6. Return Data
        Cache->>Cache: 7. Store with TTL
        Cache-->>Request: 8. Return Data
    end
```

## Fluxo de Dados de Pagamento

### Lightning Payment Flow

```mermaid
sequenceDiagram
    participant User as Usuário
    participant Frontend as React Frontend
    participant Backend as Fastify Backend
    participant PaymentService as Payment Service
    participant LND as Lightning Node
    participant Database as PostgreSQL
    participant WebSocket as WebSocket Server
    
    User->>Frontend: 1. Request Payment
    Frontend->>Backend: 2. POST /api/payments
    Backend->>PaymentService: 3. Create Payment Request
    
    PaymentService->>LND: 4. Create Lightning Invoice
    LND-->>PaymentService: 5. Invoice + Payment Hash
    PaymentService->>Database: 6. Store Payment Record
    PaymentService-->>Backend: 7. Invoice Data
    Backend-->>Frontend: 8. Payment Invoice
    
    User->>Frontend: 9. Pay Invoice
    Frontend->>User: 10. Show QR Code
    
    LND->>PaymentService: 11. Payment Received Webhook
    PaymentService->>Database: 12. Update Payment Status
    PaymentService->>WebSocket: 13. Broadcast Payment Update
    PaymentService->>User: 14. Send Confirmation
```

## Fluxo de Dados de WebSocket

### Real-time Data Updates

```mermaid
sequenceDiagram
    participant Frontend as React Frontend
    participant WebSocket as WebSocket Server
    participant Backend as Fastify Backend
    participant Service as Business Service
    participant Database as PostgreSQL
    
    Frontend->>WebSocket: 1. Establish Connection
    WebSocket->>Frontend: 2. Connection Established
    
    Service->>Database: 3. Data Changed
    Database-->>Service: 4. Change Confirmed
    Service->>WebSocket: 5. Broadcast Update
    WebSocket->>Frontend: 6. Send Real-time Update
    
    Frontend->>Frontend: 7. Update UI State
```

### WebSocket Message Types

```mermaid
graph TD
    A[WebSocket Messages] --> B[Market Data Updates]
    A --> C[Trade Executions]
    A --> D[Margin Alerts]
    A --> E[Automation Status]
    A --> F[System Notifications]
    
    B --> B1[Price Changes]
    B --> B2[Volume Updates]
    
    C --> C1[Trade Confirmed]
    C --> C2[Trade Failed]
    
    D --> D1[Margin Added]
    D --> D2[Margin Critical]
    
    E --> E1[Automation Triggered]
    E --> E2[Automation Paused]
    
    F --> F1[System Maintenance]
    F --> F2[Feature Updates]
```

## Referências

- [High Level Architecture](./high-level-architecture.md)
- [Component Interactions](./component-interactions.md)
- [Technology Stack](./technology-stack.md)
- [Database Design](../data-architecture/database-design.md)
- [Caching Strategy](../data-architecture/caching-strategy.md)

## Como Usar Este Documento

• **Para Desenvolvedores**: Use como referência para entender como os dados fluem através do sistema e implementar novos fluxos seguindo os padrões estabelecidos.

• **Para DevOps**: Utilize para identificar gargalos e otimizar o fluxo de dados em produção.

• **Para Troubleshooting**: Use para rastrear problemas de dados e identificar onde falhas podem estar ocorrendo.
