# User Exchange Accounts - Architecture Diagram

> **Status**: Active  
> **Última Atualização**: 2025-01-14  
> **Versão**: 1.0.0  
> **Responsável**: User Exchange Accounts System  

## Índice

- [Visão Geral](#visão-geral)
- [Diagrama de Arquitetura](#diagrama-de-arquitetura)
- [Fluxo de Dados](#fluxo-de-dados)
- [Componentes](#componentes)
- [Referências](#referências)

## Visão Geral

Este documento contém diagramas da arquitetura do sistema de User Exchange Accounts, mostrando a interação entre componentes e o fluxo de dados.

## Diagrama de Arquitetura

### Arquitetura Geral do Sistema

```mermaid
graph TB
    subgraph "Frontend"
        A[React Components]
        B[MultiAccountInterface]
        C[UserExchangeAccounts Hook]
    end
    
    subgraph "Backend API"
        D[Controllers]
        E[Routes]
        F[Middleware]
    end
    
    subgraph "Services Layer"
        G[UserExchangeAccountService]
        H[AccountCredentialsService]
        I[CredentialCacheService]
        J[AuthService]
    end
    
    subgraph "Data Layer"
        K[Prisma ORM]
        L[PostgreSQL]
        M[Redis Cache]
    end
    
    subgraph "External APIs"
        N[LN Markets API]
        O[Other Exchanges]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    F --> H
    G --> K
    H --> I
    H --> G
    I --> M
    J --> K
    K --> L
    H --> N
    H --> O
```

### Fluxo de Criação de Conta

```mermaid
sequenceDiagram
    participant F as Frontend
    participant C as Controller
    participant S as UserExchangeAccountService
    participant A as AuthService
    participant D as Database
    participant R as Redis
    
    F->>C: Create Account Request
    C->>S: createUserExchangeAccount()
    S->>D: Validate Exchange
    S->>D: Check Existing Account
    S->>A: Encrypt Credentials
    A-->>S: Encrypted Credentials
    S->>D: Save Account
    D-->>S: Account Created
    S->>R: Cache Credentials
    S-->>C: Account Response
    C-->>F: Success Response
```

### Fluxo de Recuperação de Credenciais

```mermaid
sequenceDiagram
    participant C as Controller
    participant A as AccountCredentialsService
    participant R as Redis
    participant S as UserExchangeAccountService
    participant D as Database
    participant E as External API
    
    C->>A: getActiveAccountCredentials()
    A->>R: Check Cache
    R-->>A: Cache Miss
    A->>D: Query Database
    D-->>A: Account Data
    A->>S: decryptCredentials()
    S-->>A: Decrypted Credentials
    A->>R: Cache Credentials
    A-->>C: Credentials
    C->>E: API Call with Credentials
    E-->>C: API Response
```

## Fluxo de Dados

### 1. Criação de Conta

```mermaid
graph LR
    A[Frontend] --> B[Controller]
    B --> C[UserExchangeAccountService]
    C --> D[Validação]
    D --> E[Criptografia]
    E --> F[Database]
    F --> G[Cache]
    G --> H[Resposta]
    H --> A
```

### 2. Ativação de Conta

```mermaid
graph LR
    A[Frontend] --> B[Controller]
    B --> C[UserExchangeAccountService]
    C --> D[Desativar Outras]
    D --> E[Ativar Conta]
    E --> F[Database]
    F --> G[Cache Invalidation]
    G --> H[Resposta]
    H --> A
```

### 3. Recuperação de Credenciais

```mermaid
graph LR
    A[Controller] --> B[AccountCredentialsService]
    B --> C[Check Cache]
    C --> D{Cache Hit?}
    D -->|Sim| E[Return Cached]
    D -->|Não| F[Query Database]
    F --> G[Decrypt Credentials]
    G --> H[Cache Credentials]
    H --> I[Return Credentials]
    E --> I
    I --> A
```

## Componentes

### 1. UserExchangeAccountService

**Responsabilidades:**
- CRUD operations para contas de exchange
- Criptografia/descriptografia de credenciais
- Validação de dados
- Gerenciamento de estado das contas

**Métodos Principais:**
- `getUserExchangeAccounts(userId: string)`
- `createUserExchangeAccount(userId: string, data: CreateUserExchangeAccountData)`
- `updateUserExchangeAccount(accountId: string, data: UpdateUserExchangeAccountData)`
- `deleteUserExchangeAccount(accountId: string)`

### 2. AccountCredentialsService

**Responsabilidades:**
- Gerenciamento centralizado de credenciais ativas
- Cache de credenciais
- Validação de credenciais
- Integração com Redis

**Métodos Principais:**
- `getActiveAccountCredentials(userId: string)`
- `getAccountCredentials(userId: string, accountId: string)`
- `validateCredentials(credentials: Record<string, string>)`

### 3. CredentialCacheService

**Responsabilidades:**
- Cache de credenciais com Redis
- Invalidação de cache
- Fallback para database

**Métodos Principais:**
- `get(key: string)`
- `set(key: string, credentials: Record<string, string>, ttl: number)`
- `del(key: string)`

### 4. Database Schema

```mermaid
erDiagram
    User ||--o{ UserExchangeAccounts : has
    Exchange ||--o{ UserExchangeAccounts : supports
    
    User {
        string id PK
        string email
        string name
        string plan_type
        datetime created_at
        datetime updated_at
    }
    
    Exchange {
        string id PK
        string name
        string slug
        string logo_url
        datetime created_at
        datetime updated_at
    }
    
    UserExchangeAccounts {
        string id PK
        string user_id FK
        string exchange_id FK
        string account_name
        json credentials
        boolean is_active
        boolean is_verified
        datetime last_test
        datetime created_at
        datetime updated_at
    }
```

## Referências

- [Arquitetura](../internal-implementation/01-architecture.md)
- [Best Practices](../internal-implementation/02-best-practices.md)
- [Guia de Migração](../internal-implementation/03-migration-guide.md)
- [Troubleshooting](../internal-implementation/04-troubleshooting.md)
- [Exemplos Práticos](../internal-implementation/05-examples.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
