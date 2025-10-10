# LN Markets API v2 - Guia de Boas Práticas

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 2.0.0  
> **Responsável**: Sistema LN Markets API v2  

## Índice

- [Visão Geral](#visão-geral)
- [Instanciação e Configuração](#instanciação-e-configuração)
- [Uso em Rotas](#uso-em-rotas)
- [Uso em Controllers](#uso-em-controllers)
- [Uso em Workers](#uso-em-workers)
- [Error Handling](#error-handling)
- [Performance](#performance)
- [Segurança](#segurança)
- [Logging](#logging)

## Visão Geral

Este guia apresenta as melhores práticas para usar a LNMarketsAPIv2 em diferentes contextos da aplicação, garantindo código limpo, performático e seguro.

## Instanciação e Configuração

### ✅ Boa Prática: Factory Pattern

```typescript
// ✅ CORRETO: Usar factory para criar instâncias
class LNMarketsServiceFactory {
  static createForUser(userId: string, logger: Logger): LNMarketsAPIv2 {
    const credentials = this.getUserCredentials(userId);
    
    return new LNMarketsAPIv2({
      credentials: {
        apiKey: credentials.credentials['API Key'],
        apiSecret: credentials.credentials['API Secret'],
        passphrase: credentials.credentials['Passphrase'],
        isTestnet: credentials.isTestnet || false
      },
      logger: logger
    });
  }
}
```

### ❌ Evitar: Instanciação Direta Repetitiva

```typescript
// ❌ ERRADO: Repetir lógica de instanciação
const service1 = new LNMarketsAPIv2({ credentials: {...}, logger: ... });
const service2 = new LNMarketsAPIv2({ credentials: {...}, logger: ... });
```

### ✅ Boa Prática: Dependency Injection

```typescript
// ✅ CORRETO: Injetar dependências
export class TradingService {
  constructor(
    private lnMarketsFactory: LNMarketsServiceFactory,
    private logger: Logger
  ) {}

  async getUserBalance(userId: string): Promise<number> {
    const service = this.lnMarketsFactory.createForUser(userId, this.logger);
    const user = await service.user.getUser();
    return user.balance;
  }
}
```

## Uso em Rotas

### ✅ Boa Prática: Service Layer

```typescript
// routes/trading.routes.ts
export async function tradingRoutes(fastify: FastifyInstance) {
  fastify.get('/balance', async (request, reply) => {
    try {
      const userId = request.user.id;
      const balance = await fastify.tradingService.getUserBalance(userId);
      
      reply.send({ balance });
    } catch (error) {
      fastify.log.error('Error fetching balance:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
```

### ✅ Boa Prática: Validação de Input

```typescript
// routes/positions.routes.ts
const closePositionSchema = {
  params: {
    type: 'object',
    properties: {
      positionId: { type: 'string', minLength: 1 }
    },
    required: ['positionId']
  }
};

fastify.delete('/positions/:positionId', { schema: closePositionSchema }, async (request, reply) => {
  const { positionId } = request.params;
  const userId = request.user.id;
  
  try {
    await fastify.tradingService.closePosition(userId, positionId);
    reply.send({ success: true });
  } catch (error) {
    if (error.message.includes('Position not found')) {
      reply.status(404).send({ error: 'Position not found' });
    } else {
      reply.status(500).send({ error: 'Failed to close position' });
    }
  }
});
```

## Uso em Controllers

### ✅ Boa Prática: Controller Focado

```typescript
// controllers/trading.controller.ts
export class TradingController {
  constructor(
    private tradingService: TradingService,
    private logger: Logger
  ) {}

  async getDashboardData(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;
      const data = await this.tradingService.getDashboardData(userId);
      
      this.logger.info('Dashboard data retrieved', { userId, positionsCount: data.positions.length });
      reply.send(data);
    } catch (error) {
      this.logger.error('Failed to get dashboard data', { userId: request.user.id, error });
      reply.status(500).send({ error: 'Failed to retrieve dashboard data' });
    }
  }

  async openPosition(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.user.id;
      const positionData = request.body as OpenPositionRequest;
      
      // Validação de negócio
      if (positionData.leverage > 10) {
        return reply.status(400).send({ error: 'Leverage too high' });
      }
      
      const position = await this.tradingService.openPosition(userId, positionData);
      
      this.logger.info('Position opened', { 
        userId, 
        positionId: position.id, 
        side: position.side,
        quantity: position.quantity 
      });
      
      reply.send(position);
    } catch (error) {
      this.logger.error('Failed to open position', { userId: request.user.id, error });
      reply.status(500).send({ error: 'Failed to open position' });
    }
  }
}
```

## Uso em Workers

### ✅ Boa Prática: Worker com Retry Logic

```typescript
// workers/margin-guard.worker.ts
export class MarginGuardWorker {
  constructor(
    private lnMarketsFactory: LNMarketsServiceFactory,
    private logger: Logger
  ) {}

  async checkMarginLevels(userId: string): Promise<void> {
    try {
      const service = this.lnMarketsFactory.createForUser(userId, this.logger);
      const [positions, user] = await Promise.all([
        service.futures.getRunningPositions(),
        service.user.getUser()
      ]);

      for (const position of positions) {
        const marginRatio = this.calculateMarginRatio(position, user.balance);
        
        if (marginRatio < 0.1) { // 10% margin
          await this.closePosition(service, position.id);
          this.logger.warn('Position closed due to low margin', {
            userId,
            positionId: position.id,
            marginRatio
          });
        }
      }
    } catch (error) {
      this.logger.error('Margin guard check failed', { userId, error });
      // Implementar retry logic ou notificação
    }
  }

  private async closePosition(service: LNMarketsAPIv2, positionId: string): Promise<void> {
    try {
      await service.futures.closePosition(positionId);
    } catch (error) {
      // Log error mas não falha o worker
      this.logger.error('Failed to close position', { positionId, error });
    }
  }
}
```

### ✅ Boa Prática: Automation Worker

```typescript
// workers/automation.worker.ts
export class AutomationWorker {
  async executeAutomation(userId: string, automationId: string): Promise<void> {
    const service = this.lnMarketsFactory.createForUser(userId, this.logger);
    
    try {
      // 1. Verificar condições
      const conditions = await this.checkAutomationConditions(service);
      
      if (!conditions.met) {
        this.logger.debug('Automation conditions not met', { userId, automationId });
        return;
      }
      
      // 2. Executar ação
      const result = await this.executeAutomationAction(service, automationId);
      
      this.logger.info('Automation executed', { 
        userId, 
        automationId, 
        action: result.action,
        success: result.success 
      });
      
    } catch (error) {
      this.logger.error('Automation execution failed', { userId, automationId, error });
      throw error; // Re-throw para retry do sistema de filas
    }
  }
}
```

## Error Handling

### ✅ Boa Prática: Error Classification

```typescript
export class LNMarketsErrorHandler {
  static handle(error: any): never {
    if (error.response?.status === 401) {
      throw new Error('Invalid LN Markets credentials');
    }
    
    if (error.response?.status === 403) {
      throw new Error('LN Markets API rate limit exceeded');
    }
    
    if (error.response?.status === 404) {
      throw new Error('LN Markets resource not found');
    }
    
    if (error.code === 'ECONNREFUSED') {
      throw new Error('LN Markets API unavailable');
    }
    
    // Log error details para debugging
    console.error('LN Markets API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    throw new Error('LN Markets API error occurred');
  }
}
```

### ✅ Boa Prática: Graceful Degradation

```typescript
export class DashboardService {
  async getDashboardData(userId: string): Promise<DashboardData> {
    try {
      const service = this.lnMarketsFactory.createForUser(userId, this.logger);
      
      const [positions, balance, ticker] = await Promise.allSettled([
        service.futures.getRunningPositions(),
        service.user.getUser(),
        service.market.getTicker()
      ]);
      
      return {
        positions: positions.status === 'fulfilled' ? positions.value : [],
        balance: balance.status === 'fulfilled' ? balance.value.balance : 0,
        ticker: ticker.status === 'fulfilled' ? ticker.value : null,
        lastUpdate: new Date().toISOString()
      };
      
    } catch (error) {
      this.logger.error('Dashboard data fetch failed', { userId, error });
      
      // Retornar dados padrão em caso de erro
      return {
        positions: [],
        balance: 0,
        ticker: null,
        lastUpdate: new Date().toISOString(),
        error: 'Unable to fetch live data'
      };
    }
  }
}
```

## Performance

### ✅ Boa Prática: Connection Pooling

```typescript
export class LNMarketsConnectionPool {
  private connections: Map<string, LNMarketsAPIv2> = new Map();
  
  getConnection(userId: string, logger: Logger): LNMarketsAPIv2 {
    if (!this.connections.has(userId)) {
      const service = this.lnMarketsFactory.createForUser(userId, logger);
      this.connections.set(userId, service);
    }
    
    return this.connections.get(userId)!;
  }
  
  clearConnection(userId: string): void {
    this.connections.delete(userId);
  }
}
```

### ✅ Boa Prática: Caching de Dados de Mercado

```typescript
export class MarketDataCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly TTL = 5000; // 5 segundos
  
  async getTicker(service: LNMarketsAPIv2): Promise<LNMarketsTicker> {
    const cached = this.cache.get('ticker');
    
    if (cached && (Date.now() - cached.timestamp) < this.TTL) {
      return cached.data;
    }
    
    const ticker = await service.market.getTicker();
    this.cache.set('ticker', { data: ticker, timestamp: Date.now() });
    
    return ticker;
  }
}
```

## Segurança

### ✅ Boa Prática: Validação de Credenciais

```typescript
export class CredentialsValidator {
  static validate(credentials: any): boolean {
    if (!credentials || typeof credentials !== 'object') {
      return false;
    }
    
    const required = ['API Key', 'API Secret', 'Passphrase'];
    
    for (const field of required) {
      if (!credentials[field] || typeof credentials[field] !== 'string') {
        return false;
      }
    }
    
    return true;
  }
}
```

### ✅ Boa Prática: Sanitização de Logs

```typescript
export class SecureLogger {
  static logApiCall(service: string, endpoint: string, userId: string): void {
    console.log(`🔗 ${service} - API call to ${endpoint}`, {
      userId,
      endpoint,
      timestamp: new Date().toISOString()
      // NÃO logar credenciais ou dados sensíveis
    });
  }
  
  static logError(error: any, context: any): void {
    console.error('❌ LN Markets API Error', {
      message: error.message,
      status: error.response?.status,
      context: this.sanitizeContext(context)
    });
  }
  
  private static sanitizeContext(context: any): any {
    const sanitized = { ...context };
    delete sanitized.credentials;
    delete sanitized.apiKey;
    delete sanitized.apiSecret;
    return sanitized;
  }
}
```

## Logging

### ✅ Boa Prática: Logging Estruturado

```typescript
export class LNMarketsLogger {
  constructor(private logger: Logger) {}
  
  logApiRequest(endpoint: string, userId: string): void {
    this.logger.info('🚀 LN Markets API Request', {
      endpoint,
      userId,
      timestamp: new Date().toISOString()
    });
  }
  
  logApiResponse(endpoint: string, userId: string, duration: number, success: boolean): void {
    this.logger.info('✅ LN Markets API Response', {
      endpoint,
      userId,
      duration,
      success,
      timestamp: new Date().toISOString()
    });
  }
  
  logError(endpoint: string, userId: string, error: any): void {
    this.logger.error('❌ LN Markets API Error', {
      endpoint,
      userId,
      error: error.message,
      status: error.response?.status,
      timestamp: new Date().toISOString()
    });
  }
}
```

## Referências

- [Arquitetura do Sistema](./01-architecture.md)
- [Migration Guide](./03-migration-guide.md)
- [Troubleshooting](./04-troubleshooting.md)
- [Exemplos Práticos](./05-examples.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
