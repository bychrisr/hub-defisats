# LN Markets API v2 - Guia de Migração

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 2.0.0  
> **Responsável**: Sistema LN Markets API v2  

## Índice

- [Visão Geral](#visão-geral)
- [Mapeamento de Métodos](#mapeamento-de-métodos)
- [Migração por Tipo de Arquivo](#migração-por-tipo-de-arquivo)
- [Exemplos de Migração](#exemplos-de-migração)
- [Checklist de Migração](#checklist-de-migração)
- [Troubleshooting](#troubleshooting)

## Visão Geral

Este guia detalha como migrar do `LNMarketsAPIService` (v1) para o `LNMarketsAPIv2` (v2), incluindo mapeamento de métodos, mudanças de estrutura e exemplos práticos.

## Mapeamento de Métodos

### User Methods

| v1 (LNMarketsAPIService) | v2 (LNMarketsAPIv2) | Notas |
|---------------------------|---------------------|-------|
| `getUserBalance()` | `user.getUser().balance` | Agora retorna objeto completo |
| `getUserDeposits(type)` | `user.getDeposits(type)` | Mantém mesma interface |
| `getUserWithdrawals()` | `user.getWithdrawals()` | Mantém mesma interface |

### Futures Methods

| v1 (LNMarketsAPIService) | v2 (LNMarketsAPIv2) | Notas |
|---------------------------|---------------------|-------|
| `getUserPositions()` | `futures.getRunningPositions()` | Nome mais descritivo |
| `closePosition(id)` | `futures.closePosition(id)` | Mantém mesma interface |
| `openPosition(data)` | `futures.openPosition(data)` | Mantém mesma interface |

### Market Methods

| v1 (LNMarketsAPIService) | v2 (LNMarketsAPIv2) | Notas |
|---------------------------|---------------------|-------|
| `getFuturesTicker()` | `market.getTicker()` | Nome simplificado |
| `getIndexHistory()` | `market.getIndexHistory()` | Mantém mesma interface |

## Migração por Tipo de Arquivo

### 1. Services

#### Antes (v1)

```typescript
import { LNMarketsAPIService } from '../services/lnmarkets-api.service';

export class DashboardDataService {
  private lnMarketsService: LNMarketsAPIService;

  constructor() {
    this.lnMarketsService = new LNMarketsAPIService();
  }

  async getDashboardDataForActiveAccount(userId: string): Promise<DashboardData> {
    const credentials = await this.getCredentials(userId);
    
    const balance = await this.lnMarketsService.getUserBalance(credentials);
    const positions = await this.lnMarketsService.getUserPositions(credentials);
    const ticker = await this.lnMarketsService.getFuturesTicker();
    
    return { balance, positions, ticker };
  }
}
```

#### Depois (v2)

```typescript
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';

export class DashboardDataService {
  async getDashboardDataForActiveAccount(userId: string): Promise<DashboardData> {
    const credentials = await this.getCredentials(userId);
    
    const lnMarketsService = new LNMarketsAPIv2({
      credentials: {
        apiKey: credentials.credentials['API Key'],
        apiSecret: credentials.credentials['API Secret'],
        passphrase: credentials.credentials['Passphrase'],
        isTestnet: false
      },
      logger: this.logger
    });

    const [balance, positions, ticker] = await Promise.all([
      lnMarketsService.user.getUser(),
      lnMarketsService.futures.getRunningPositions(),
      lnMarketsService.market.getTicker()
    ]);
    
    return {
      balance: balance.balance,
      positions,
      ticker
    };
  }
}
```

### 2. Controllers

#### Antes (v1)

```typescript
export class TradingController {
  constructor(private lnMarketsService: LNMarketsAPIService) {}

  async getPositions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;
      const credentials = await this.getCredentials(userId);
      
      const positions = await this.lnMarketsService.getUserPositions(credentials);
      reply.send(positions);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  }
}
```

#### Depois (v2)

```typescript
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';

export class TradingController {
  async getPositions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;
      const credentials = await this.getCredentials(userId);
      
      const lnMarketsService = new LNMarketsAPIv2({
        credentials: {
          apiKey: credentials.credentials['API Key'],
          apiSecret: credentials.credentials['API Secret'],
          passphrase: credentials.credentials['Passphrase'],
          isTestnet: false
        },
        logger: this.logger
      });

      const positions = await lnMarketsService.futures.getRunningPositions();
      reply.send(positions);
    } catch (error) {
      this.logger.error('Failed to get positions', { userId: request.user.id, error });
      reply.status(500).send({ error: 'Failed to retrieve positions' });
    }
  }
}
```

### 3. Workers

#### Antes (v1)

```typescript
export class MarginGuardWorker {
  constructor(private lnMarketsService: LNMarketsAPIService) {}

  async checkMarginLevels(userId: string): Promise<void> {
    const credentials = await this.getCredentials(userId);
    
    const positions = await this.lnMarketsService.getUserPositions(credentials);
    const balance = await this.lnMarketsService.getUserBalance(credentials);
    
    for (const position of positions) {
      if (this.isLowMargin(position, balance)) {
        await this.lnMarketsService.closePosition(credentials, position.id);
      }
    }
  }
}
```

#### Depois (v2)

```typescript
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';

export class MarginGuardWorker {
  async checkMarginLevels(userId: string): Promise<void> {
    const credentials = await this.getCredentials(userId);
    
    const lnMarketsService = new LNMarketsAPIv2({
      credentials: {
        apiKey: credentials.credentials['API Key'],
        apiSecret: credentials.credentials['API Secret'],
        passphrase: credentials.credentials['Passphrase'],
        isTestnet: false
      },
      logger: this.logger
    });

    const [positions, user] = await Promise.all([
      lnMarketsService.futures.getRunningPositions(),
      lnMarketsService.user.getUser()
    ]);
    
    for (const position of positions) {
      if (this.isLowMargin(position, user.balance)) {
        await lnMarketsService.futures.closePosition(position.id);
      }
    }
  }
}
```

### 4. Routes

#### Antes (v1)

```typescript
import { LNMarketsAPIService } from '../services/lnmarkets-api.service';

export async function tradingRoutes(fastify: FastifyInstance) {
  const lnMarketsService = new LNMarketsAPIService();

  fastify.get('/balance', async (request, reply) => {
    const userId = request.user.id;
    const credentials = await getCredentials(userId);
    
    const balance = await lnMarketsService.getUserBalance(credentials);
    reply.send({ balance });
  });
}
```

#### Depois (v2)

```typescript
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';

export async function tradingRoutes(fastify: FastifyInstance) {
  fastify.get('/balance', async (request, reply) => {
    try {
      const userId = request.user.id;
      const credentials = await getCredentials(userId);
      
      const lnMarketsService = new LNMarketsAPIv2({
        credentials: {
          apiKey: credentials.credentials['API Key'],
          apiSecret: credentials.credentials['API Secret'],
          passphrase: credentials.credentials['Passphrase'],
          isTestnet: false
        },
        logger: fastify.log
      });

      const user = await lnMarketsService.user.getUser();
      reply.send({ balance: user.balance });
    } catch (error) {
      fastify.log.error('Failed to get balance', { userId: request.user.id, error });
      reply.status(500).send({ error: 'Failed to retrieve balance' });
    }
  });
}
```

## Exemplos de Migração

### Exemplo 1: Dashboard Service Completo

#### Antes (v1)

```typescript
export class DashboardDataService {
  private lnMarketsService: LNMarketsAPIService;

  async getDashboardDataForActiveAccount(userId: string): Promise<DashboardData> {
    try {
      const credentials = await this.accountCredentialsService.getCredentials(userId);
      
      if (!credentials || !credentials.credentials) {
        throw new Error('No credentials found');
      }

      const [balance, positions, ticker] = await Promise.all([
        this.getUserBalance(credentials),
        this.getUserPositions(credentials),
        this.getTicker()
      ]);

      return {
        balance: balance || 0,
        positions: positions || [],
        ticker: ticker,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  private async getUserBalance(credentials: any): Promise<number> {
    try {
      const balance = await this.lnMarketsService.getUserBalance(credentials);
      return balance;
    } catch (error: any) {
      this.logger.error('Error getting user balance:', error);
      return 0; // Error masking
    }
  }

  private async getUserPositions(credentials: any): Promise<any[]> {
    try {
      const positions = await this.lnMarketsService.getUserPositions(credentials);
      return positions || [];
    } catch (error: any) {
      this.logger.error('Error getting user positions:', error);
      return [];
    }
  }

  private async getTicker(): Promise<any> {
    try {
      const ticker = await this.lnMarketsService.getFuturesTicker();
      return ticker;
    } catch (error: any) {
      this.logger.error('Error getting ticker:', error);
      return null;
    }
  }
}
```

#### Depois (v2)

```typescript
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';

export class DashboardDataService {
  async getDashboardDataForActiveAccount(userId: string): Promise<DashboardData> {
    try {
      const credentials = await this.accountCredentialsService.getCredentials(userId);
      
      if (!credentials || !credentials.credentials) {
        throw new Error('No credentials found');
      }

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
        this.getUserPositions(lnMarketsService),
        this.getUserBalance(lnMarketsService),
        this.getTicker(lnMarketsService)
      ]);

      return {
        balance: balance?.balance || 0,
        positions: positions || [],
        ticker: ticker,
        lastUpdate: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error getting dashboard data:', error);
      throw error;
    }
  }

  private async getUserPositions(lnMarketsService: LNMarketsAPIv2): Promise<any[]> {
    try {
      const positions = await lnMarketsService.futures.getRunningPositions();
      return positions || [];
    } catch (error: any) {
      this.logger.error('Error getting user positions:', error);
      return [];
    }
  }

  private async getUserBalance(lnMarketsService: LNMarketsAPIv2): Promise<any | null> {
    try {
      const user = await lnMarketsService.user.getUser();
      return {
        balance: user.balance,
        synthetic_usd_balance: user.synthetic_usd_balance,
        uid: user.uid,
        username: user.username,
        role: user.role
      };
    } catch (error: any) {
      this.logger.error('Error getting user balance:', error);
      return null;
    }
  }

  private async getTicker(lnMarketsService: LNMarketsAPIv2): Promise<any | null> {
    try {
      const ticker = await lnMarketsService.market.getTicker();
      return ticker;
    } catch (error: any) {
      this.logger.error('Error getting ticker:', error);
      return null;
    }
  }
}
```

## Checklist de Migração

### Para Cada Arquivo:

- [ ] **Import**: Mudar de `LNMarketsAPIService` para `LNMarketsAPIv2`
- [ ] **Instanciação**: Usar novo construtor com `credentials` e `logger`
- [ ] **Credenciais**: Acessar com `credentials.credentials['API Key']` em vez de `credentials.api_key`
- [ ] **Métodos**: Mapear para novos métodos (ex: `getUserPositions()` → `futures.getRunningPositions()`)
- [ ] **Response**: Ajustar acesso aos dados (ex: `balance` → `user.balance`)
- [ ] **Error Handling**: Remover error masking, propagar erros reais
- [ ] **Logging**: Adicionar logging estruturado
- [ ] **Testes**: Executar testes após migração
- [ ] **Validação**: Testar com credenciais reais

### Para o Projeto:

- [ ] **Varredura**: Identificar todos os 80+ arquivos que usam LN Markets
- [ ] **Priorização**: Migrar por ordem: Routes → Controllers → Workers → Services
- [ ] **Testes**: Testar cada endpoint após migração
- [ ] **Documentação**: Atualizar documentação referente
- [ ] **Cleanup**: Remover serviços obsoletos após migração completa

## Troubleshooting

### Erro: "Cannot find module 'LNMarketsAPIService'"

**Causa**: Import ainda apontando para serviço antigo.

**Solução**:
```typescript
// ❌ Antigo
import { LNMarketsAPIService } from '../services/lnmarkets-api.service';

// ✅ Novo
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';
```

### Erro: "Cannot read properties of undefined (reading 'balance')"

**Causa**: Tentativa de acessar propriedade em objeto que não existe.

**Solução**:
```typescript
// ❌ Antigo
const balance = await lnMarketsService.getUserBalance(credentials);

// ✅ Novo
const user = await lnMarketsService.user.getUser();
const balance = user.balance;
```

### Erro: "Signature is not valid"

**Causa**: Credenciais sendo acessadas incorretamente.

**Solução**:
```typescript
// ❌ Antigo
const credentials = {
  api_key: credentials.api_key,
  api_secret: credentials.api_secret,
  passphrase: credentials.passphrase
};

// ✅ Novo
const credentials = {
  apiKey: credentials.credentials['API Key'],
  apiSecret: credentials.credentials['API Secret'],
  passphrase: credentials.credentials['Passphrase'],
  isTestnet: false
};
```

## Referências

- [Arquitetura do Sistema](./01-architecture.md)
- [Best Practices](./02-best-practices.md)
- [Troubleshooting](./04-troubleshooting.md)
- [Exemplos Práticos](./05-examples.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
