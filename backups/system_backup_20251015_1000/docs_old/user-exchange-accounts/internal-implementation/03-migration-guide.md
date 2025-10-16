# User Exchange Accounts - Migration Guide

> **Status**: Active  
> **Última Atualização**: 2025-01-14  
> **Versão**: 1.0.0  
> **Responsável**: User Exchange Accounts System  

## Índice

- [Visão Geral](#visão-geral)
- [Mapeamento de Métodos](#mapeamento-de-métodos)
- [Migração por Tipo de Arquivo](#migração-por-tipo-de-arquivo)
- [Exemplos de Migração](#exemplos-de-migração)
- [Checklist de Migração](#checklist-de-migração)
- [Troubleshooting](#troubleshooting)
- [Referências](#referências)

## Visão Geral

Este guia documenta a migração completa do sistema antigo de credenciais diretas na tabela `User` para o novo sistema de `UserExchangeAccounts` com múltiplas contas por usuário.

## Mapeamento de Métodos

### Sistema Antigo → Sistema Novo

| Sistema Antigo | Sistema Novo | Descrição |
|----------------|--------------|-----------|
| `user.ln_markets_api_key` | `AccountCredentialsService.getActiveAccountCredentials()` | Credenciais ativas |
| `user.ln_markets_api_secret` | `credentials.api_secret` | Chave secreta |
| `user.ln_markets_passphrase` | `credentials.passphrase` | Passphrase |
| `prisma.user.findUnique()` | `accountCredentialsService.getActiveAccountCredentials()` | Busca de credenciais |
| Criptografia manual | `UserExchangeAccountService` | Criptografia automática |

### Campos Removidos do User Model

```typescript
// ❌ REMOVIDOS do schema Prisma
model User {
  // ... outros campos
  // ln_markets_api_key    String?  // ❌ REMOVIDO
  // ln_markets_api_secret String?  // ❌ REMOVIDO  
  // ln_markets_passphrase String?  // ❌ REMOVIDO
}
```

### Novos Campos no UserExchangeAccounts

```typescript
// ✅ ADICIONADOS ao schema Prisma
model UserExchangeAccounts {
  id           String   @id @default(cuid())
  user_id      String
  exchange_id  String
  account_name String
  credentials  Json     // ✅ Criptografado
  is_active    Boolean  @default(false)
  is_verified  Boolean  @default(false)
  last_test    DateTime?
  created_at   DateTime @default(now())
  updated_at   DateTime @updatedAt
}
```

## Migração por Tipo de Arquivo

### 1. Controllers

#### ❌ ANTES (Sistema Antigo)

```typescript
// backend/src/controllers/lnmarkets-user.controller.ts
async getPositions(request: FastifyRequest, reply: FastifyReply) {
  const user = await this.prisma.user.findUnique({
    where: { id: request.user.id },
    select: {
      ln_markets_api_key: true,
      ln_markets_api_secret: true,
      ln_markets_passphrase: true
    }
  });

  if (!user?.ln_markets_api_key) {
    return reply.status(400).send({
      success: false,
      error: 'LN Markets credentials not found'
    });
  }

  // Descriptografar credenciais
  const authService = new AuthService(this.prisma, {} as any);
  const apiKey = authService.decryptData(user.ln_markets_api_key);
  const apiSecret = authService.decryptData(user.ln_markets_api_secret);
  const passphrase = authService.decryptData(user.ln_markets_passphrase);

  const lnMarketsService = new LNMarketsAPIv2({
    credentials: {
      apiKey,
      apiSecret,
      passphrase
    },
    logger: console as any
  });

  const positions = await lnMarketsService.positions.getPositions();
  return reply.send({ success: true, data: positions });
}
```

#### ✅ DEPOIS (Sistema Novo)

```typescript
// backend/src/controllers/lnmarkets-user.controller.ts
async getPositions(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user.id;
    
    // Usar AccountCredentialsService para credenciais ativas
    const credentials = await this.accountCredentialsService.getActiveAccountCredentials(userId);
    
    if (!credentials) {
      return reply.status(400).send({
        success: false,
        error: 'No active exchange account found'
      });
    }

    const lnMarketsService = new LNMarketsAPIv2({
      credentials: credentials.credentials,
      logger: console as any
    });

    const positions = await lnMarketsService.positions.getPositions();
    return reply.send({ success: true, data: positions });
  } catch (error) {
    console.error('❌ LN MARKETS USER CONTROLLER - Error getting positions:', error);
    return reply.status(500).send({
      success: false,
      error: 'Internal server error'
    });
  }
}
```

### 2. Services

#### ❌ ANTES (Sistema Antigo)

```typescript
// backend/src/services/backtest.service.ts
async runBacktest(config: BacktestConfig) {
  const user = await this.prisma.user.findUnique({
    where: { id: config.userId },
    select: {
      ln_markets_api_key: true,
      ln_markets_api_secret: true,
      ln_markets_passphrase: true
    }
  });

  if (!user?.ln_markets_api_key) {
    throw new Error('LN Markets credentials not found');
  }

  // Descriptografar credenciais
  const authService = new AuthService(this.prisma, {} as any);
  const credentials = {
    apiKey: authService.decryptData(user.ln_markets_api_key),
    apiSecret: authService.decryptData(user.ln_markets_api_secret),
    passphrase: authService.decryptData(user.ln_markets_passphrase)
  };

  // Usar credenciais para backtest...
}
```

#### ✅ DEPOIS (Sistema Novo)

```typescript
// backend/src/services/backtest.service.ts
async runBacktest(config: BacktestConfig) {
  // Usar AccountCredentialsService para credenciais ativas
  const credentials = await this.accountCredentialsService.getActiveAccountCredentials(config.userId);
  
  if (!credentials) {
    throw new Error('No active exchange account found');
  }

  // Usar credenciais para backtest...
}
```

### 3. Routes

#### ❌ ANTES (Sistema Antigo)

```typescript
// backend/src/routes/lnmarkets.routes.ts
fastify.get('/balance', async (request, reply) => {
  const user = await prisma.user.findUnique({
    where: { id: request.user.id },
    select: {
      ln_markets_api_key: true,
      ln_markets_api_secret: true,
      ln_markets_passphrase: true
    }
  });

  if (!user?.ln_markets_api_key) {
    return reply.status(400).send({
      success: false,
      error: 'LN Markets credentials not found'
    });
  }

  // Descriptografar credenciais...
  const lnMarketsService = new LNMarketsAPIv2({
    credentials: decryptedCredentials,
    logger: console as any
  });

  const balance = await lnMarketsService.user.getUser();
  return reply.send({ success: true, data: balance });
});
```

#### ✅ DEPOIS (Sistema Novo)

```typescript
// backend/src/routes/lnmarkets.routes.ts
fastify.get('/balance', async (request, reply) => {
  try {
    const userId = request.user.id;
    
    // Usar AccountCredentialsService para credenciais ativas
    const credentials = await accountCredentialsService.getActiveAccountCredentials(userId);
    
    if (!credentials) {
      return reply.status(400).send({
        success: false,
        error: 'No active exchange account found'
      });
    }

    const lnMarketsService = new LNMarketsAPIv2({
      credentials: credentials.credentials,
      logger: console as any
    });

    const balance = await lnMarketsService.user.getUser();
    return reply.send({ success: true, data: balance });
  } catch (error) {
    console.error('❌ LN MARKETS ROUTES - Error getting balance:', error);
    return reply.status(500).send({
      success: false,
      error: 'Internal server error'
    });
  }
});
```

## Exemplos de Migração

### 1. Migração de Controller Completa

```typescript
// backend/src/controllers/lnmarkets-user.controller.ts
export class LNMarketsUserController {
  constructor(
    private prisma: PrismaClient,
    private accountCredentialsService: AccountCredentialsService
  ) {}

  // ❌ ANTES: Método antigo
  async getPositionsOld(request: FastifyRequest, reply: FastifyReply) {
    const user = await this.prisma.user.findUnique({
      where: { id: request.user.id },
      select: {
        ln_markets_api_key: true,
        ln_markets_api_secret: true,
        ln_markets_passphrase: true
      }
    });

    if (!user?.ln_markets_api_key) {
      return reply.status(400).send({
        success: false,
        error: 'LN Markets credentials not found'
      });
    }

    // Descriptografar credenciais
    const authService = new AuthService(this.prisma, {} as any);
    const credentials = {
      apiKey: authService.decryptData(user.ln_markets_api_key),
      apiSecret: authService.decryptData(user.ln_markets_api_secret),
      passphrase: authService.decryptData(user.ln_markets_passphrase)
    };

    const lnMarketsService = new LNMarketsAPIv2({
      credentials,
      logger: console as any
    });

    const positions = await lnMarketsService.positions.getPositions();
    return reply.send({ success: true, data: positions });
  }

  // ✅ DEPOIS: Método novo
  async getPositions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;
      
      const credentials = await this.accountCredentialsService.getActiveAccountCredentials(userId);
      
      if (!credentials) {
        return reply.status(400).send({
          success: false,
          error: 'No active exchange account found'
        });
      }

      const lnMarketsService = new LNMarketsAPIv2({
        credentials: credentials.credentials,
        logger: console as any
      });

      const positions = await lnMarketsService.positions.getPositions();
      return reply.send({ success: true, data: positions });
    } catch (error) {
      console.error('❌ LN MARKETS USER CONTROLLER - Error getting positions:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
```

### 2. Migração de Service Completa

```typescript
// backend/src/services/backtest.service.ts
export class BacktestService {
  constructor(
    private prisma: PrismaClient,
    private accountCredentialsService: AccountCredentialsService
  ) {}

  // ❌ ANTES: Método antigo
  async runBacktestOld(config: BacktestConfig) {
    const user = await this.prisma.user.findUnique({
      where: { id: config.userId },
      select: {
        ln_markets_api_key: true,
        ln_markets_api_secret: true,
        ln_markets_passphrase: true
      }
    });

    if (!user?.ln_markets_api_key) {
      throw new Error('LN Markets credentials not found');
    }

    const authService = new AuthService(this.prisma, {} as any);
    const credentials = {
      apiKey: authService.decryptData(user.ln_markets_api_key),
      apiSecret: authService.decryptData(user.ln_markets_api_secret),
      passphrase: authService.decryptData(user.ln_markets_passphrase)
    };

    // Usar credenciais para backtest...
  }

  // ✅ DEPOIS: Método novo
  async runBacktest(config: BacktestConfig) {
    const credentials = await this.accountCredentialsService.getActiveAccountCredentials(config.userId);
    
    if (!credentials) {
      throw new Error('No active exchange account found');
    }

    // Usar credenciais para backtest...
  }
}
```

## Checklist de Migração

### ✅ Fase 1: Preparação

- [ ] Backup do banco de dados
- [ ] Verificar schema Prisma atualizado
- [ ] Executar migrações do Prisma
- [ ] Verificar se campos antigos foram removidos

### ✅ Fase 2: Migração de Código

- [ ] **Controllers**: Migrar todos os controllers LN Markets
- [ ] **Services**: Migrar todos os services que usam credenciais
- [ ] **Routes**: Migrar todas as rotas que acessam credenciais
- [ ] **Workers**: Migrar workers que usam credenciais
- [ ] **WebSocket**: Migrar sistema de WebSocket

### ✅ Fase 3: Migração de Dados

- [ ] Criar seeder para contas de teste
- [ ] Migrar dados existentes (se necessário)
- [ ] Verificar integridade dos dados

### ✅ Fase 4: Testes

- [ ] Testar criação de contas
- [ ] Testar atualização de contas
- [ ] Testar recuperação de credenciais
- [ ] Testar criptografia/descriptografia
- [ ] Testar cache de credenciais

### ✅ Fase 5: Limpeza

- [ ] Remover campos antigos do schema
- [ ] Remover código antigo
- [ ] Atualizar documentação
- [ ] Commitar mudanças

## Troubleshooting

### Erro: "Cannot find module 'bcryptjs'"

```bash
# Solução: Instalar dependência
npm install bcryptjs
npm install @types/bcryptjs --save-dev
```

### Erro: "Invalid prisma.userExchangeAccounts.upsert() invocation"

```typescript
// ❌ ERRADO: Usar composite unique key inexistente
await prisma.userExchangeAccounts.upsert({
  where: {
    user_id_exchange_id_account_name: { // ❌ Não existe
      user_id: userId,
      exchange_id: exchangeId,
      account_name: accountName
    }
  }
});

// ✅ CORRETO: Usar ID único
await prisma.userExchangeAccounts.upsert({
  where: { id: accountId },
  update: data,
  create: data
});
```

### Erro: "Migrations pending!"

```bash
# Solução: Aplicar migrações pendentes
npx prisma migrate deploy
```

### Erro: "Migration failed"

```bash
# Solução: Resolver migrações específicas
npx prisma migrate resolve --applied 20250112_margin_guard_v2
npx prisma migrate resolve --applied 20250126_add_user_preferences
```

### Erro: "The 'key' argument must be of type string"

```typescript
// ❌ ERRADO: Acesso incorreto à chave de criptografia
const key = crypto.scryptSync(config.security.encryption.key, 'salt', 32);

// ✅ CORRETO: Acesso correto à chave de criptografia
const { securityConfig } = require('../config/env');
const key = crypto.scryptSync(securityConfig.encryption.key, 'salt', 32);
```

## Referências

- [Arquitetura](./01-architecture.md)
- [Best Practices](./02-best-practices.md)
- [Troubleshooting](./04-troubleshooting.md)
- [Exemplos Práticos](./05-examples.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
