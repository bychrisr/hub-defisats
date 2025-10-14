# User Exchange Accounts - Architecture

> **Status**: Active  
> **Última Atualização**: 2025-01-14  
> **Versão**: 1.0.0  
> **Responsável**: User Exchange Accounts System  

## Índice

- [Visão Geral](#visão-geral)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Componentes Principais](#componentes-principais)
- [Fluxo de Dados](#fluxo-de-dados)
- [Padrões de Design](#padrões-de-design)
- [Configuração](#configuração)
- [Integração com Outros Sistemas](#integração-com-outros-sistemas)
- [Referências](#referências)

## Visão Geral

O sistema de User Exchange Accounts foi projetado para substituir o sistema antigo de credenciais diretas na tabela `User`, oferecendo maior flexibilidade, segurança e capacidade de múltiplas contas por usuário.

## Arquitetura do Sistema

### Modelo de Dados

```typescript
// Schema Prisma
model UserExchangeAccounts {
  id           String   @id @default(cuid())
  user_id      String
  exchange_id  String
  account_name String
  credentials  Json     // Criptografado
  is_active    Boolean  @default(false)
  is_verified  Boolean  @default(false)
  last_test    DateTime?
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt

  user    User    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  exchange Exchange @relation(fields: [exchange_id], references: [id])

  @@unique([user_id, exchange_id, account_name])
}
```

### Componentes Principais

#### 1. UserExchangeAccountService

**Responsabilidade**: CRUD operations para contas de exchange

```typescript
export class UserExchangeAccountService {
  constructor(private prisma: PrismaClient) {}

  // Métodos principais
  async getUserExchangeAccounts(userId: string): Promise<UserExchangeAccountWithExchange[]>
  async createUserExchangeAccount(userId: string, data: CreateUserExchangeAccountData): Promise<UserExchangeAccountWithExchange>
  async updateUserExchangeAccount(accountId: string, data: UpdateUserExchangeAccountData): Promise<UserExchangeAccountWithExchange>
  async deleteUserExchangeAccount(accountId: string): Promise<void>
  async getActiveAccountCredentials(userId: string): Promise<AccountCredentials | null>
}
```

#### 2. AccountCredentialsService

**Responsabilidade**: Gerenciamento centralizado de credenciais ativas

```typescript
export class AccountCredentialsService {
  constructor(private prisma: PrismaClient) {}

  // Métodos principais
  async getActiveAccountCredentials(userId: string): Promise<AccountCredentials | null>
  async getAccountCredentials(userId: string, accountId: string): Promise<AccountCredentials | null>
  async validateCredentials(credentials: Record<string, string>): Promise<CredentialValidationResult>
}
```

#### 3. CredentialCacheService

**Responsabilidade**: Cache de credenciais com Redis

```typescript
export class CredentialCacheService {
  constructor(private redis: Redis) {}

  async get(key: string): Promise<Record<string, string> | null>
  async set(key: string, credentials: Record<string, string>, ttl: number): Promise<void>
  async del(key: string): Promise<void>
}
```

## Fluxo de Dados

### 1. Criação de Conta

```mermaid
graph TB
    A[Frontend] --> B[UserExchangeAccountService]
    B --> C[Validação de Dados]
    C --> D[Criptografia de Credenciais]
    D --> E[Prisma Database]
    E --> F[Resposta com Dados Criptografados]
    F --> A
```

### 2. Recuperação de Credenciais

```mermaid
graph TB
    A[Controller] --> B[AccountCredentialsService]
    B --> C[Verificar Cache Redis]
    C --> D{Cache Hit?}
    D -->|Sim| E[Retornar do Cache]
    D -->|Não| F[Buscar no Database]
    F --> G[Descriptografar Credenciais]
    G --> H[Cachear no Redis]
    H --> I[Retornar Credenciais]
    E --> I
    I --> A
```

### 3. Atualização de Conta

```mermaid
graph TB
    A[Frontend] --> B[UserExchangeAccountService]
    B --> C[Validar Permissões]
    C --> D[Atualizar Dados]
    D --> E{Credenciais Alteradas?}
    E -->|Sim| F[Criptografar Novas Credenciais]
    E -->|Não| G[Manter Credenciais Existentes]
    F --> H[Invalidar Cache]
    G --> H
    H --> I[Atualizar Database]
    I --> J[Resposta de Sucesso]
    J --> A
```

## Padrões de Design

### 1. Repository Pattern

```typescript
// UserExchangeAccountService implementa Repository Pattern
export class UserExchangeAccountService {
  // Encapsula acesso ao banco de dados
  // Fornece interface limpa para operações CRUD
}
```

### 2. Service Layer Pattern

```typescript
// Separação clara de responsabilidades
// UserExchangeAccountService: CRUD operations
// AccountCredentialsService: Credential management
// CredentialCacheService: Caching layer
```

### 3. Strategy Pattern

```typescript
// Diferentes estratégias de criptografia
// Fallback para valores não criptografados
// Validação de credenciais por exchange
```

## Configuração

### Variáveis de Ambiente

```bash
# Criptografia
SECURITY_ENCRYPTION_KEY=your-encryption-key

# Redis
REDIS_URL=redis://redis:6379

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/axisor
```

### Configuração de Segurança

```typescript
// backend/src/config/env.ts
export const securityConfig = {
  encryption: {
    key: process.env.SECURITY_ENCRYPTION_KEY!,
    algorithm: 'aes-256-cbc'
  }
};
```

## Integração com Outros Sistemas

### 1. AuthService

```typescript
// Integração para criptografia/descriptografia
const authService = new AuthService(prisma, fastify);
const encrypted = authService.encryptData(credential);
const decrypted = authService.decryptData(encrypted);
```

### 2. LN Markets Controllers

```typescript
// Todos os controllers LN Markets agora usam AccountCredentialsService
const credentials = await accountCredentialsService.getActiveAccountCredentials(userId);
```

### 3. WebSocket System

```typescript
// WebSocket connections usam credenciais do novo sistema
const credentials = await accountCredentialsService.getActiveAccountCredentials(userId);
```

## Referências

- [Código Fonte](../../../backend/src/services/userExchangeAccount.service.ts)
- [Account Credentials Service](../../../backend/src/services/account-credentials.service.ts)
- [Schema Prisma](../../../backend/prisma/schema.prisma)
- [Guia de Migração](./03-migration-guide.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
