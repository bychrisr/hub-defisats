# User Exchange Accounts - Migration Flow

> **Status**: Active  
> **Última Atualização**: 2025-01-14  
> **Versão**: 1.0.0  
> **Responsável**: User Exchange Accounts System  

## Índice

- [Visão Geral](#visão-geral)
- [Fluxo de Migração](#fluxo-de-migração)
- [Fases da Migração](#fases-da-migração)
- [Validação](#validação)
- [Referências](#referências)

## Visão Geral

Este documento detalha o fluxo completo de migração do sistema antigo de credenciais diretas na tabela `User` para o novo sistema de `UserExchangeAccounts`.

## Fluxo de Migração

### 1. Visão Geral da Migração

```mermaid
graph TB
    A[Sistema Antigo] --> B[Preparação]
    B --> C[Migração de Código]
    C --> D[Migração de Dados]
    D --> E[Testes]
    E --> F[Limpeza]
    F --> G[Sistema Novo]
    
    subgraph "Sistema Antigo"
        H[User.ln_markets_api_key]
        I[User.ln_markets_api_secret]
        J[User.ln_markets_passphrase]
    end
    
    subgraph "Sistema Novo"
        K[UserExchangeAccounts.credentials]
        L[AccountCredentialsService]
        M[UserExchangeAccountService]
    end
    
    H --> K
    I --> K
    J --> K
```

### 2. Fluxo Detalhado

```mermaid
sequenceDiagram
    participant D as Developer
    participant S as Schema
    participant C as Code
    participant T as Tests
    participant V as Validation
    
    D->>S: Update Prisma Schema
    S->>C: Remove Old Fields
    C->>C: Update Controllers
    C->>C: Update Services
    C->>C: Update Routes
    C->>T: Run Tests
    T-->>C: Test Results
    C->>V: Validate Migration
    V-->>C: Validation Results
    C->>D: Migration Complete
```

## Fases da Migração

### Fase 1: Preparação

```mermaid
graph LR
    A[Backup Database] --> B[Update Schema]
    B --> C[Run Migrations]
    C --> D[Verify Schema]
    D --> E[Remove Old Fields]
```

**Ações:**
1. Backup do banco de dados
2. Atualização do schema Prisma
3. Execução de migrações
4. Verificação da integridade
5. Remoção de campos antigos

### Fase 2: Migração de Código

```mermaid
graph TB
    A[Controllers] --> B[Services]
    B --> C[Routes]
    C --> D[Workers]
    D --> E[WebSocket]
    E --> F[Middleware]
    
    subgraph "Controllers"
        G[LN Markets Controllers]
        H[Profile Controller]
        I[Auth Controller]
    end
    
    subgraph "Services"
        J[Backtest Service]
        K[Automation Service]
        L[Auth Service]
    end
    
    subgraph "Routes"
        M[LN Markets Routes]
        N[Profile Routes]
        O[Auth Routes]
    end
```

**Ações:**
1. Migrar todos os controllers LN Markets
2. Migrar todos os services que usam credenciais
3. Migrar todas as rotas que acessam credenciais
4. Migrar workers que usam credenciais
5. Migrar sistema de WebSocket
6. Migrar middlewares de validação

### Fase 3: Migração de Dados

```mermaid
graph LR
    A[Create Seeders] --> B[Migrate Data]
    B --> C[Validate Data]
    C --> D[Test Accounts]
    D --> E[Verify Integrity]
```

**Ações:**
1. Criar seeders para contas de teste
2. Migrar dados existentes (se necessário)
3. Validar integridade dos dados
4. Testar contas de teste
5. Verificar integridade final

### Fase 4: Testes

```mermaid
graph TB
    A[Unit Tests] --> B[Integration Tests]
    B --> C[End-to-End Tests]
    C --> D[Performance Tests]
    D --> E[Security Tests]
    
    subgraph "Test Types"
        F[Create Accounts]
        G[Update Accounts]
        H[Retrieve Credentials]
        I[Encrypt/Decrypt]
        J[Cache Credentials]
    end
```

**Ações:**
1. Testar criação de contas
2. Testar atualização de contas
3. Testar recuperação de credenciais
4. Testar criptografia/descriptografia
5. Testar cache de credenciais

### Fase 5: Limpeza

```mermaid
graph LR
    A[Remove Old Code] --> B[Update Documentation]
    B --> C[Update Tests]
    C --> D[Commit Changes]
    D --> E[Deploy Production]
```

**Ações:**
1. Remover campos antigos do schema
2. Remover código antigo
3. Atualizar documentação
4. Atualizar testes
5. Commitar mudanças
6. Deploy em produção

## Validação

### 1. Validação de Schema

```mermaid
graph TB
    A[Check Schema] --> B[Verify Fields]
    B --> C[Check Relations]
    C --> D[Validate Indexes]
    D --> E[Test Queries]
```

**Verificações:**
- Campos antigos removidos
- Novos campos criados
- Relações funcionando
- Índices criados
- Queries funcionando

### 2. Validação de Código

```mermaid
graph TB
    A[Check Controllers] --> B[Check Services]
    B --> C[Check Routes]
    C --> D[Check Workers]
    D --> E[Check WebSocket]
```

**Verificações:**
- Controllers usando novo sistema
- Services usando AccountCredentialsService
- Rotas atualizadas
- Workers migrados
- WebSocket funcionando

### 3. Validação de Dados

```mermaid
graph TB
    A[Check Data Integrity] --> B[Verify Encryption]
    B --> C[Test Decryption]
    C --> D[Check Cache]
    D --> E[Validate API Calls]
```

**Verificações:**
- Integridade dos dados
- Criptografia funcionando
- Descriptografia funcionando
- Cache funcionando
- Chamadas de API funcionando

## Referências

- [Arquitetura](../internal-implementation/01-architecture.md)
- [Best Practices](../internal-implementation/02-best-practices.md)
- [Guia de Migração](../internal-implementation/03-migration-guide.md)
- [Troubleshooting](../internal-implementation/04-troubleshooting.md)
- [Exemplos Práticos](../internal-implementation/05-examples.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
