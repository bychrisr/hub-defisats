# User Exchange Accounts - Best Practices

> **Status**: Active  
> **Última Atualização**: 2025-01-14  
> **Versão**: 1.0.0  
> **Responsável**: User Exchange Accounts System  

## Índice

- [Visão Geral](#visão-geral)
- [Instanciação e Configuração](#instanciação-e-configuração)
- [Uso em Controllers](#uso-em-controllers)
- [Uso em Services](#uso-em-services)
- [Error Handling](#error-handling)
- [Performance](#performance)
- [Segurança](#segurança)
- [Logging](#logging)
- [Referências](#referências)

## Visão Geral

Este documento estabelece as melhores práticas para o uso do sistema de User Exchange Accounts, garantindo segurança, performance e manutenibilidade.

## Instanciação e Configuração

### ✅ CORRETO: Instanciação Adequada

```typescript
// backend/src/controllers/lnmarkets-user.controller.ts
import { UserExchangeAccountService } from '../services/userExchangeAccount.service';
import { AccountCredentialsService } from '../services/account-credentials.service';

export class LNMarketsUserController {
  private userExchangeAccountService: UserExchangeAccountService;
  private accountCredentialsService: AccountCredentialsService;

  constructor(private prisma: PrismaClient) {
    this.userExchangeAccountService = new UserExchangeAccountService(prisma);
    this.accountCredentialsService = new AccountCredentialsService(prisma);
  }
}
```

### ❌ ERRADO: Instanciação Incorreta

```typescript
// ❌ NÃO FAZER: Instanciar a cada request
async getPositions(request: FastifyRequest, reply: FastifyReply) {
  const service = new UserExchangeAccountService(prisma); // ❌ Ineficiente
  // ...
}
```

## Uso em Controllers

### ✅ CORRETO: Uso em Controllers

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

    // Usar credenciais para chamada à API
    const lnMarketsService = new LNMarketsAPIv2({
      credentials: credentials.credentials,
      logger: console as any
    });

    const positions = await lnMarketsService.positions.getPositions();
    
    return reply.send({
      success: true,
      data: positions
    });
  } catch (error) {
    console.error('❌ LN MARKETS USER CONTROLLER - Error getting positions:', error);
    return reply.status(500).send({
      success: false,
      error: 'Internal server error'
    });
  }
}
```

### ❌ ERRADO: Acesso Direto ao Database

```typescript
// ❌ NÃO FAZER: Acesso direto ao database
async getPositions(request: FastifyRequest, reply: FastifyReply) {
  const user = await prisma.user.findUnique({
    where: { id: request.user.id },
    select: {
      ln_markets_api_key: true,    // ❌ Sistema antigo
      ln_markets_api_secret: true, // ❌ Sistema antigo
      ln_markets_passphrase: true  // ❌ Sistema antigo
    }
  });
  // ...
}
```

## Uso em Services

### ✅ CORRETO: Uso em Services

```typescript
// backend/src/services/backtest.service.ts
import { AccountCredentialsService } from './account-credentials.service';

export class BacktestService {
  constructor(
    private prisma: PrismaClient,
    private accountCredentialsService: AccountCredentialsService
  ) {}

  async runBacktest(config: BacktestConfig) {
    // Usar AccountCredentialsService para credenciais
    const credentials = await this.accountCredentialsService.getActiveAccountCredentials(config.userId);
    
    if (!credentials) {
      throw new Error('No active exchange account found');
    }

    // Usar credenciais para backtest
    const lnMarketsService = new LNMarketsAPIv2({
      credentials: credentials.credentials,
      logger: console as any
    });

    // Executar backtest...
  }
}
```

### ❌ ERRADO: Acesso Direto ao User Model

```typescript
// ❌ NÃO FAZER: Acesso direto ao User model
async runBacktest(config: BacktestConfig) {
  const user = await this.prisma.user.findUnique({
    where: { id: config.userId },
    select: {
      ln_markets_api_key: true,    // ❌ Sistema antigo
      ln_markets_api_secret: true, // ❌ Sistema antigo
      ln_markets_passphrase: true  // ❌ Sistema antigo
    }
  });
  // ...
}
```

## Error Handling

### ✅ CORRETO: Error Handling Robusto

```typescript
// backend/src/services/userExchangeAccount.service.ts
async updateUserExchangeAccount(accountId: string, data: UpdateUserExchangeAccountData): Promise<UserExchangeAccountWithExchange> {
  try {
    console.log(`🔍 USER EXCHANGE ACCOUNT SERVICE - Updating account ${accountId}:`, data);

    // Validação de dados
    if (!accountId || !data) {
      throw new Error('Invalid account ID or data');
    }

    // Verificar se a conta existe
    const existingAccount = await this.prisma.userExchangeAccounts.findUnique({
      where: { id: accountId }
    });

    if (!existingAccount) {
      throw new Error('Account not found');
    }

    // Processar atualização...
    const updatedAccount = await this.prisma.userExchangeAccounts.update({
      where: { id: accountId },
      data: updateData,
      include: { exchange: true }
    });

    console.log(`✅ USER EXCHANGE ACCOUNT SERVICE - Account updated successfully:`, updatedAccount);
    return updatedAccount;

  } catch (error) {
    console.error(`❌ USER EXCHANGE ACCOUNT SERVICE - Error updating account ${accountId}:`, error);
    throw error;
  }
}
```

### ❌ ERRADO: Error Handling Inadequado

```typescript
// ❌ NÃO FAZER: Sem tratamento de erro
async updateUserExchangeAccount(accountId: string, data: UpdateUserExchangeAccountData) {
  const updatedAccount = await this.prisma.userExchangeAccounts.update({
    where: { id: accountId },
    data: data
  });
  return updatedAccount; // ❌ Sem tratamento de erro
}
```

## Performance

### ✅ CORRETO: Cache de Credenciais

```typescript
// backend/src/services/account-credentials.service.ts
async getAccountCredentials(userId: string, accountId: string): Promise<AccountCredentials | null> {
  // Check cache first
  const cacheKey = `credentials-${userId}-${accountId}`;
  try {
    const cachedCredentials = await this.credentialCache.get(cacheKey);
    
    if (cachedCredentials) {
      console.log(`✅ ACCOUNT CREDENTIALS - Credentials found in cache for account ${account.account_name}`);
      return {
        userId,
        accountId: account.id,
        accountName: account.account_name,
        exchangeName: account.exchange.name,
        credentials: cachedCredentials,
        isActive: account.is_active,
        lastValidated: new Date(),
        validationStatus: 'valid'
      };
    }
  } catch (cacheError) {
    console.warn(`⚠️ ACCOUNT CREDENTIALS - Cache error for account ${account.account_name}:`, cacheError);
    // Continue without cache
  }

  // Buscar no database se não estiver em cache...
}
```

### ❌ ERRADO: Sem Cache

```typescript
// ❌ NÃO FAZER: Sem cache
async getAccountCredentials(userId: string, accountId: string) {
  // Sempre buscar no database
  const account = await this.prisma.userExchangeAccounts.findUnique({
    where: { id: accountId }
  });
  // ...
}
```

## Segurança

### ✅ CORRETO: Criptografia Adequada

```typescript
// backend/src/services/userExchangeAccount.service.ts
private decryptCredentials(credentials: any): Record<string, string> {
  const decryptedCredentials: Record<string, string> = {};
  
  if (credentials && typeof credentials === 'object') {
    Object.entries(credentials).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        try {
          const crypto = require('crypto');
          const { securityConfig } = require('../config/env');
          const algorithm = 'aes-256-cbc';
          const key = crypto.scryptSync(securityConfig.encryption.key, 'salt', 32);
          
          const [ivHex, encryptedHex] = value.split(':');
          if (!ivHex || !encryptedHex) {
            console.warn(`⚠️ USER EXCHANGE ACCOUNT SERVICE - Invalid encrypted format for ${key}`);
            decryptedCredentials[key] = '';
            return;
          }
          
          const iv = Buffer.from(ivHex, 'hex');
          const encrypted = Buffer.from(encryptedHex, 'hex');
          
          const decipher = crypto.createDecipheriv(algorithm, key, iv);
          let decrypted = decipher.update(encrypted, null, 'utf8');
          decrypted += decipher.final('utf8');
          
          decryptedCredentials[key] = decrypted;
        } catch (error) {
          console.warn(`⚠️ USER EXCHANGE ACCOUNT SERVICE - Failed to decrypt credential ${key}:`, error);
          decryptedCredentials[key] = ''; // Fallback seguro
        }
      } else {
        decryptedCredentials[key] = '';
      }
    });
  }
  
  return decryptedCredentials;
}
```

### ❌ ERRADO: Credenciais em Texto Plano

```typescript
// ❌ NUNCA FAZER: Armazenar credenciais em texto plano
const account = await this.prisma.userExchangeAccounts.create({
  data: {
    user_id: userId,
    exchange_id: exchangeId,
    account_name: accountName,
    credentials: {
      api_key: 'sk-1234567890',      // ❌ Texto plano
      api_secret: 'secret123',       // ❌ Texto plano
      passphrase: 'mypassphrase'     // ❌ Texto plano
    }
  }
});
```

## Logging

### ✅ CORRETO: Logging Adequado

```typescript
// Logs de segurança e debugging
console.log(`🔍 USER EXCHANGE ACCOUNT SERVICE - Decrypting credentials:`, credentials);
console.log(`✅ USER EXCHANGE ACCOUNT SERVICE - Decrypted ${key}: ${decrypted}`);
console.warn(`⚠️ USER EXCHANGE ACCOUNT SERVICE - Failed to decrypt credential ${key}:`, error);
console.error(`❌ USER EXCHANGE ACCOUNT SERVICE - Error updating account ${accountId}:`, error);
```

### ❌ ERRADO: Logging Inadequado

```typescript
// ❌ NÃO FAZER: Logs sem contexto ou logs de credenciais
console.log(credentials); // ❌ Pode expor credenciais
console.log('Error');     // ❌ Sem contexto
```

## Referências

- [Arquitetura](./01-architecture.md)
- [Guia de Migração](./03-migration-guide.md)
- [Troubleshooting](./04-troubleshooting.md)
- [Exemplos Práticos](./05-examples.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
