# User Exchange Accounts - Examples

> **Status**: Active  
> **Última Atualização**: 2025-01-14  
> **Versão**: 1.0.0  
> **Responsável**: User Exchange Accounts System  

## Índice

- [Visão Geral](#visão-geral)
- [Configuração Básica](#configuração-básica)
- [Exemplos por Domínio](#exemplos-por-domínio)
- [Exemplos Avançados](#exemplos-avançados)
- [Casos de Uso Completos](#casos-de-uso-completos)
- [Referências](#referências)

## Visão Geral

Este documento contém exemplos práticos e funcionais do sistema de User Exchange Accounts, baseados no código real do projeto Axisor.

## Configuração Básica

### 1. Instanciação do Service

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

### 2. Configuração de Criptografia

```typescript
// backend/src/config/env.ts
export const securityConfig = {
  encryption: {
    key: process.env.SECURITY_ENCRYPTION_KEY!,
    algorithm: 'aes-256-cbc'
  }
};
```

### 3. Configuração de Cache

```typescript
// backend/src/services/account-credentials.service.ts
import { Redis } from 'ioredis';

// Lazy Redis connection for caching
let redis: Redis | null = null;

function getRedisConnection(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://redis:6379', {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: true,
      retryDelayOnFailover: 100,
      connectTimeout: 10000,
      family: 4, // Force IPv4
    });
  }
  return redis;
}
```

## Exemplos por Domínio

### 1. Controllers

#### Exemplo: LN Markets User Controller

```typescript
// backend/src/controllers/lnmarkets-user.controller.ts
export class LNMarketsUserController {
  constructor(
    private prisma: PrismaClient,
    private accountCredentialsService: AccountCredentialsService
  ) {}

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

  async getBalance(request: FastifyRequest, reply: FastifyReply) {
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

      const user = await lnMarketsService.user.getUser();
      return reply.send({ success: true, data: user });
    } catch (error) {
      console.error('❌ LN MARKETS USER CONTROLLER - Error getting balance:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
```

#### Exemplo: Profile Controller

```typescript
// backend/src/controllers/profile.controller.ts
export class ProfileController {
  constructor(
    private prisma: PrismaClient,
    private userExchangeAccountService: UserExchangeAccountService
  ) {}

  async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;
      
      // Buscar perfil do usuário
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          plan_type: true,
          created_at: true,
          updated_at: true
        }
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }

      // Buscar contas de exchange do usuário
      const exchangeAccounts = await this.userExchangeAccountService.getUserExchangeAccounts(userId);

      return reply.send({
        success: true,
        data: {
          ...user,
          exchange_accounts: exchangeAccounts
        }
      });
    } catch (error) {
      console.error('❌ PROFILE CONTROLLER - Error getting profile:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}
```

### 2. Services

#### Exemplo: Backtest Service

```typescript
// backend/src/services/backtest.service.ts
export class BacktestService {
  constructor(
    private prisma: PrismaClient,
    private accountCredentialsService: AccountCredentialsService
  ) {}

  async runBacktest(config: BacktestConfig) {
    try {
      // Usar AccountCredentialsService para credenciais ativas
      const credentials = await this.accountCredentialsService.getActiveAccountCredentials(config.userId);
      
      if (!credentials) {
        throw new Error('No active exchange account found');
      }

      // Usar credenciais para backtest
      const lnMarketsService = new LNMarketsAPIv2({
        credentials: credentials.credentials,
        logger: console as any
      });

      // Executar backtest com credenciais
      const result = await this.executeBacktest(lnMarketsService, config);
      
      return result;
    } catch (error) {
      console.error('❌ BACKTEST SERVICE - Error running backtest:', error);
      throw error;
    }
  }

  private async executeBacktest(lnMarketsService: LNMarketsAPIv2, config: BacktestConfig) {
    // Implementação do backtest...
    const user = await lnMarketsService.user.getUser();
    const positions = await lnMarketsService.positions.getPositions();
    
    // Processar dados para backtest...
    return {
      success: true,
      data: {
        user,
        positions,
        backtest_results: {}
      }
    };
  }
}
```

#### Exemplo: Automation Service

```typescript
// backend/src/services/automation.service.ts
export class AutomationService {
  constructor(
    private prisma: PrismaClient,
    private accountCredentialsService: AccountCredentialsService
  ) {}

  async getAllActiveAutomations(userId: string) {
    try {
      // Buscar automações com contas de exchange
      const automations = await this.prisma.automation.findMany({
        where: {
          user_id: userId,
          is_active: true
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          user_exchange_account: {
            include: {
              exchange: true
            }
          }
        }
      });

      return automations;
    } catch (error) {
      console.error('❌ AUTOMATION SERVICE - Error getting automations:', error);
      throw error;
    }
  }
}
```

### 3. Routes

#### Exemplo: LN Markets Routes

```typescript
// backend/src/routes/lnmarkets.routes.ts
export async function lnmarketsRoutes(fastify: FastifyInstance) {
  const accountCredentialsService = new AccountCredentialsService(fastify.prisma);

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

      const user = await lnMarketsService.user.getUser();
      return reply.send({ success: true, data: user });
    } catch (error) {
      console.error('❌ LN MARKETS ROUTES - Error getting balance:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}
```

#### Exemplo: Profile Routes

```typescript
// backend/src/routes/profile.routes.ts
export async function profileRoutes(fastify: FastifyInstance) {
  const userExchangeAccountService = new UserExchangeAccountService(fastify.prisma);

  fastify.get('/profile', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                plan_type: { type: 'string' },
                exchange_accounts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      account_name: { type: 'string' },
                      is_active: { type: 'boolean' },
                      is_verified: { type: 'boolean' },
                      exchange: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          slug: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const userId = request.user.id;
      
      // Buscar perfil do usuário
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          plan_type: true,
          created_at: true,
          updated_at: true
        }
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'User not found'
        });
      }

      // Buscar contas de exchange do usuário
      const exchangeAccounts = await userExchangeAccountService.getUserExchangeAccounts(userId);

      return reply.send({
        success: true,
        data: {
          ...user,
          exchange_accounts: exchangeAccounts
        }
      });
    } catch (error) {
      console.error('❌ PROFILE ROUTES - Error getting profile:', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}
```

## Exemplos Avançados

### 1. Criptografia de Credenciais

```typescript
// backend/src/services/userExchangeAccount.service.ts
export class UserExchangeAccountService {
  private decryptCredentials(credentials: any): Record<string, string> {
    const decryptedCredentials: Record<string, string> = {};
    
    console.log(`🔍 USER EXCHANGE ACCOUNT SERVICE - Decrypting credentials:`, credentials);
    
    if (credentials && typeof credentials === 'object') {
      Object.entries(credentials).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          try {
            // Usar a mesma lógica de descriptografia do AuthService
            const crypto = require('crypto');
            const { securityConfig } = require('../config/env');
            const algorithm = 'aes-256-cbc';
            const key = crypto.scryptSync(securityConfig.encryption.key, 'salt', 32);
            
            // Extrair IV e dados criptografados
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
            console.log(`✅ USER EXCHANGE ACCOUNT SERVICE - Decrypted ${key}: ${decrypted}`);
          } catch (error) {
            console.warn(`⚠️ USER EXCHANGE ACCOUNT SERVICE - Failed to decrypt credential ${key}:`, error);
            decryptedCredentials[key] = ''; // Fallback para string vazia
          }
        } else {
          decryptedCredentials[key] = '';
        }
      });
    }
    
    console.log(`🔍 USER EXCHANGE ACCOUNT SERVICE - Final decrypted credentials:`, decryptedCredentials);
    
    return decryptedCredentials;
  }
}
```

### 2. Cache de Credenciais

```typescript
// backend/src/services/account-credentials.service.ts
export class AccountCredentialsService {
  async getAccountCredentials(userId: string, accountId: string): Promise<AccountCredentials | null> {
    // Buscar conta no database
    const account = await this.prisma.userExchangeAccounts.findUnique({
      where: { id: accountId },
      include: { exchange: true }
    });

    if (!account) {
      return null;
    }

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

    // Descriptografar credenciais
    const credentials = this.userExchangeAccountService.decryptCredentials(account.credentials);
    
    // Cache the credentials
    try {
      await this.credentialCache.set(cacheKey, credentials, this.CACHE_TTL);
      console.log(`✅ ACCOUNT CREDENTIALS - Credentials cached for account ${account.account_name}`);
    } catch (cacheError) {
      console.warn(`⚠️ ACCOUNT CREDENTIALS - Failed to cache credentials for account ${account.account_name}:`, cacheError);
      // Continue without caching
    }

    return {
      userId,
      accountId: account.id,
      accountName: account.account_name,
      exchangeName: account.exchange.name,
      credentials,
      isActive: account.is_active,
      lastValidated: new Date(),
      validationStatus: 'valid'
    };
  }
}
```

## Casos de Uso Completos

### 1. Criação de Conta de Exchange

```typescript
// Exemplo completo de criação de conta
async createExchangeAccount(userId: string, accountData: CreateUserExchangeAccountData) {
  try {
    console.log(`🔍 USER EXCHANGE ACCOUNT SERVICE - Creating account for user ${userId}:`, accountData);

    // Verificar se a exchange existe
    const exchange = await this.prisma.exchange.findUnique({
      where: { id: accountData.exchange_id }
    });

    if (!exchange) {
      throw new Error('Exchange not found');
    }

    // Verificar se o usuário já tem uma conta com o mesmo nome para esta exchange
    const existingAccount = await this.prisma.userExchangeAccounts.findFirst({
      where: {
        user_id: userId,
        exchange_id: accountData.exchange_id,
        account_name: accountData.account_name
      }
    });

    if (existingAccount) {
      throw new Error('User already has an account with this name for this exchange');
    }

    // Verificar se já existe alguma conta ativa para esta exchange
    const hasActiveAccount = await this.prisma.userExchangeAccounts.findFirst({
      where: {
        user_id: userId,
        exchange_id: accountData.exchange_id,
        is_active: true
      }
    });

    // Criptografar credenciais
    const encryptedCredentials: Record<string, string> = {};
    
    Object.entries(accountData.credentials).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        try {
          const crypto = require('crypto');
          const { securityConfig } = require('../config/env');
          const algorithm = 'aes-256-cbc';
          const key = crypto.scryptSync(securityConfig.encryption.key, 'salt', 32);
          const iv = crypto.randomBytes(16);
          
          const cipher = crypto.createCipheriv(algorithm, key, iv);
          let encrypted = cipher.update(value, 'utf8', 'hex');
          encrypted += cipher.final('hex');
          
          encryptedCredentials[key] = `${iv.toString('hex')}:${encrypted}`;
          console.log(`✅ USER EXCHANGE ACCOUNT SERVICE - Encrypted credential ${key}`);
        } catch (error) {
          console.warn(`⚠️ USER EXCHANGE ACCOUNT SERVICE - Failed to encrypt credential ${key}:`, error);
          encryptedCredentials[key] = value; // Fallback para valor não criptografado
        }
      }
    });

    // Criar conta
    const account = await this.prisma.userExchangeAccounts.create({
      data: {
        user_id: userId,
        exchange_id: accountData.exchange_id,
        account_name: accountData.account_name,
        credentials: encryptedCredentials,
        is_active: !hasActiveAccount, // Apenas ativa se não houver conta ativa
        is_verified: false
      },
      include: { exchange: true }
    });

    console.log(`✅ USER EXCHANGE ACCOUNT SERVICE - Account created successfully:`, account);
    return account;

  } catch (error) {
    console.error(`❌ USER EXCHANGE ACCOUNT SERVICE - Error creating account:`, error);
    throw error;
  }
}
```

### 2. Ativação de Conta

```typescript
// Exemplo completo de ativação de conta
async activateAccount(accountId: string, userId: string) {
  try {
    console.log(`🔍 USER EXCHANGE ACCOUNT SERVICE - Activating account ${accountId} for user ${userId}`);

    // Verificar se a conta existe e pertence ao usuário
    const account = await this.prisma.userExchangeAccounts.findFirst({
      where: {
        id: accountId,
        user_id: userId
      }
    });

    if (!account) {
      throw new Error('Account not found or does not belong to user');
    }

    // VALIDAÇÃO DE SEGURANÇA: Se ativando esta conta, desativar TODAS as outras contas do usuário
    await this.prisma.userExchangeAccounts.updateMany({
      where: {
        user_id: userId,
        is_active: true
      },
      data: {
        is_active: false
      }
    });

    // Ativar a conta específica
    const updatedAccount = await this.prisma.userExchangeAccounts.update({
      where: { id: accountId },
      data: {
        is_active: true
      },
      include: { exchange: true }
    });

    console.log(`✅ USER EXCHANGE ACCOUNT SERVICE - Account activated successfully:`, updatedAccount);
    return updatedAccount;

  } catch (error) {
    console.error(`❌ USER EXCHANGE ACCOUNT SERVICE - Error activating account:`, error);
    throw error;
  }
}
```

## Referências

- [Arquitetura](./01-architecture.md)
- [Best Practices](./02-best-practices.md)
- [Guia de Migração](./03-migration-guide.md)
- [Troubleshooting](./04-troubleshooting.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
