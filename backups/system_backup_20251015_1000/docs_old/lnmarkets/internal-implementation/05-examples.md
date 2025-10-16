# LN Markets API v2 - Exemplos Práticos

> **Status**: Active  
> **Última Atualização**: 2025-01-09  
> **Versão**: 2.0.0  
> **Responsável**: Sistema LN Markets API v2  

## Índice

- [Visão Geral](#visão-geral)
- [Configuração Básica](#configuração-básica)
- [Exemplos por Domínio](#exemplos-por-domínio)
- [Exemplos Avançados](#exemplos-avançados)
- [Testes com Credenciais Reais](#testes-com-credenciais-reais)
- [Casos de Uso Completos](#casos-de-uso-completos)

## Visão Geral

Este documento apresenta exemplos práticos de uso da LNMarketsAPIv2 em diferentes contextos, desde configuração básica até casos de uso complexos.

## Configuração Básica

### 1. Instanciação Simples

```typescript
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';

// Configuração básica
const lnMarketsService = new LNMarketsAPIv2({
  credentials: {
    apiKey: '8N0ZtEaYiZQZNQopDDgoTr8FkuV0jJr6HMOd0MiHF9w=',
    apiSecret: '6qmuTLGZpvUH2kchz3Ww9vnYOYtBgDZ741LpF1fYz3Ro62DOncRu/GXCSshCf2ThFOE90/kLUju9orcuUEIddQ==',
    passphrase: 'passcphasec1',
    isTestnet: false
  },
  logger: console
});

console.log('🚀 LN Markets API v2 Service initialized');
```

### 2. Configuração com Logger Estruturado

```typescript
import winston from 'winston';
import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';

// Configurar logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'lnmarkets.log' })
  ]
});

const lnMarketsService = new LNMarketsAPIv2({
  credentials: {
    apiKey: process.env.LNMARKETS_API_KEY!,
    apiSecret: process.env.LNMARKETS_API_SECRET!,
    passphrase: process.env.LNMARKETS_PASSPHRASE!,
    isTestnet: process.env.NODE_ENV === 'development'
  },
  logger: logger
});
```

### 3. Factory Pattern para Múltiplos Usuários

```typescript
export class LNMarketsServiceFactory {
  private static instances: Map<string, LNMarketsAPIv2> = new Map();

  static createForUser(userId: string, credentials: any, logger: any): LNMarketsAPIv2 {
    if (this.instances.has(userId)) {
      return this.instances.get(userId)!;
    }

    const service = new LNMarketsAPIv2({
      credentials: {
        apiKey: credentials.credentials['API Key'],
        apiSecret: credentials.credentials['API Secret'],
        passphrase: credentials.credentials['Passphrase'],
        isTestnet: false
      },
      logger: logger
    });

    this.instances.set(userId, service);
    return service;
  }

  static clearUser(userId: string): void {
    this.instances.delete(userId);
  }
}
```

## Exemplos por Domínio

### User Domain

#### 1. Obter Dados do Usuário

```typescript
async function getUserInfo(lnMarketsService: LNMarketsAPIv2) {
  try {
    console.log('👤 Fetching user information...');
    
    const user = await lnMarketsService.user.getUser();
    
    console.log('✅ User data retrieved:', {
      uid: user.uid,
      username: user.username,
      balance: user.balance,
      synthetic_usd_balance: user.synthetic_usd_balance,
      role: user.role
    });
    
    return user;
  } catch (error: any) {
    console.error('❌ Failed to get user info:', error.message);
    throw error;
  }
}
```

#### 2. Histórico de Depósitos

```typescript
async function getDepositHistory(lnMarketsService: LNMarketsAPIv2) {
  try {
    console.log('💰 Fetching deposit history...');
    
    const [bitcoinDeposits, lightningDeposits] = await Promise.all([
      lnMarketsService.user.getDeposits('bitcoin'),
      lnMarketsService.user.getDeposits('lightning')
    ]);
    
    console.log('✅ Deposit history retrieved:', {
      bitcoinDeposits: bitcoinDeposits.length,
      lightningDeposits: lightningDeposits.length,
      totalBitcoinDeposits: bitcoinDeposits.reduce((sum, dep) => sum + dep.amount, 0),
      totalLightningDeposits: lightningDeposits.reduce((sum, dep) => sum + dep.amount, 0)
    });
    
    return {
      bitcoin: bitcoinDeposits,
      lightning: lightningDeposits
    };
  } catch (error: any) {
    console.error('❌ Failed to get deposit history:', error.message);
    throw error;
  }
}
```

#### 3. Histórico de Saques

```typescript
async function getWithdrawalHistory(lnMarketsService: LNMarketsAPIv2) {
  try {
    console.log('💸 Fetching withdrawal history...');
    
    const withdrawals = await lnMarketsService.user.getWithdrawals();
    
    console.log('✅ Withdrawal history retrieved:', {
      count: withdrawals.length,
      totalAmount: withdrawals.reduce((sum, w) => sum + w.amount, 0),
      recentWithdrawals: withdrawals.slice(0, 5).map(w => ({
        id: w.id,
        amount: w.amount,
        status: w.status,
        created_at: w.created_at
      }))
    });
    
    return withdrawals;
  } catch (error: any) {
    console.error('❌ Failed to get withdrawal history:', error.message);
    throw error;
  }
}
```

### Futures Domain

#### 1. Posições Ativas

```typescript
async function getActivePositions(lnMarketsService: LNMarketsAPIv2) {
  try {
    console.log('📊 Fetching active positions...');
    
    const positions = await lnMarketsService.futures.getRunningPositions();
    
    console.log('✅ Active positions retrieved:', {
      count: positions.length,
      totalPnL: positions.reduce((sum, pos) => sum + pos.pnl, 0),
      totalMargin: positions.reduce((sum, pos) => sum + pos.margin, 0),
      positions: positions.map(pos => ({
        id: pos.id,
        side: pos.side,
        quantity: pos.quantity,
        leverage: pos.leverage,
        entry_price: pos.entry_price,
        current_price: pos.current_price,
        pnl: pos.pnl,
        margin: pos.margin
      }))
    });
    
    return positions;
  } catch (error: any) {
    console.error('❌ Failed to get active positions:', error.message);
    throw error;
  }
}
```

#### 2. Abrir Nova Posição

```typescript
async function openPosition(lnMarketsService: LNMarketsAPIv2, positionData: {
  type: 'm' | 'l';
  side: 'b' | 's';
  quantity: number;
  leverage: number;
}) {
  try {
    console.log('🚀 Opening new position:', positionData);
    
    const position = await lnMarketsService.futures.openPosition(positionData);
    
    console.log('✅ Position opened successfully:', {
      id: position.id,
      type: position.type,
      side: position.side,
      quantity: position.quantity,
      leverage: position.leverage,
      entry_price: position.entry_price,
      margin: position.margin,
      created_at: position.created_at
    });
    
    return position;
  } catch (error: any) {
    console.error('❌ Failed to open position:', error.message);
    throw error;
  }
}
```

#### 3. Fechar Posição

```typescript
async function closePosition(lnMarketsService: LNMarketsAPIv2, positionId: string) {
  try {
    console.log(`🔒 Closing position: ${positionId}`);
    
    const result = await lnMarketsService.futures.closePosition(positionId);
    
    console.log('✅ Position closed successfully:', {
      id: result.id,
      status: result.status,
      pnl: result.pnl,
      closed_at: result.closed_at
    });
    
    return result;
  } catch (error: any) {
    console.error('❌ Failed to close position:', error.message);
    throw error;
  }
}
```

### Market Domain

#### 1. Dados de Mercado

```typescript
async function getMarketData(lnMarketsService: LNMarketsAPIv2) {
  try {
    console.log('📈 Fetching market data...');
    
    const ticker = await lnMarketsService.market.getTicker();
    
    console.log('✅ Market data retrieved:', {
      bid: ticker.bid,
      ask: ticker.ask,
      last: ticker.last,
      spread: ticker.ask - ticker.bid,
      volume_24h: ticker.volume_24h,
      high_24h: ticker.high_24h,
      low_24h: ticker.low_24h,
      timestamp: ticker.timestamp
    });
    
    return ticker;
  } catch (error: any) {
    console.error('❌ Failed to get market data:', error.message);
    throw error;
  }
}
```

#### 2. Histórico de Índice

```typescript
async function getIndexHistory(lnMarketsService: LNMarketsAPIv2, from?: string, to?: string) {
  try {
    console.log('📊 Fetching index history...');
    
    const history = await lnMarketsService.market.getIndexHistory(from, to);
    
    console.log('✅ Index history retrieved:', {
      count: history.length,
      firstPrice: history[0]?.price,
      lastPrice: history[history.length - 1]?.price,
      priceChange: history.length > 1 ? 
        history[history.length - 1].price - history[0].price : 0
    });
    
    return history;
  } catch (error: any) {
    console.error('❌ Failed to get index history:', error.message);
    throw error;
  }
}
```

## Exemplos Avançados

### 1. Dashboard Data Completo

```typescript
async function getCompleteDashboardData(lnMarketsService: LNMarketsAPIv2) {
  try {
    console.log('📊 Fetching complete dashboard data...');
    
    const startTime = Date.now();
    
    // Fetch all data in parallel
    const [user, positions, ticker, deposits, withdrawals] = await Promise.all([
      lnMarketsService.user.getUser(),
      lnMarketsService.futures.getRunningPositions(),
      lnMarketsService.market.getTicker(),
      lnMarketsService.user.getDeposits('bitcoin'),
      lnMarketsService.user.getWithdrawals()
    ]);
    
    const duration = Date.now() - startTime;
    
    // Calculate metrics
    const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
    const totalMargin = positions.reduce((sum, pos) => sum + pos.margin, 0);
    const totalDeposits = deposits.reduce((sum, dep) => sum + dep.amount, 0);
    const totalWithdrawals = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    
    const dashboardData = {
      user: {
        uid: user.uid,
        username: user.username,
        balance: user.balance,
        synthetic_usd_balance: user.synthetic_usd_balance
      },
      trading: {
        positions: {
          count: positions.length,
          totalPnL,
          totalMargin,
          list: positions.map(pos => ({
            id: pos.id,
            side: pos.side,
            quantity: pos.quantity,
            pnl: pos.pnl,
            margin: pos.margin
          }))
        }
      },
      market: {
        ticker: {
          bid: ticker.bid,
          ask: ticker.ask,
          last: ticker.last,
          spread: ticker.ask - ticker.bid,
          volume_24h: ticker.volume_24h
        }
      },
      finances: {
        totalDeposits,
        totalWithdrawals,
        netDeposits: totalDeposits - totalWithdrawals
      },
      metadata: {
        fetchDuration: duration,
        lastUpdate: new Date().toISOString()
      }
    };
    
    console.log('✅ Complete dashboard data retrieved:', {
      duration: `${duration}ms`,
      positionsCount: positions.length,
      totalPnL,
      balance: user.balance
    });
    
    return dashboardData;
  } catch (error: any) {
    console.error('❌ Failed to get complete dashboard data:', error.message);
    throw error;
  }
}
```

### 2. Margin Guard Monitor

```typescript
class MarginGuardMonitor {
  constructor(private lnMarketsService: LNMarketsAPIv2, private logger: any) {}

  async checkMarginLevels(): Promise<void> {
    try {
      console.log('🛡️ Checking margin levels...');
      
      const [positions, user] = await Promise.all([
        this.lnMarketsService.futures.getRunningPositions(),
        this.lnMarketsService.user.getUser()
      ]);
      
      const criticalPositions = positions.filter(position => {
        const marginRatio = position.margin / user.balance;
        return marginRatio < 0.1; // 10% margin threshold
      });
      
      if (criticalPositions.length > 0) {
        console.warn('⚠️ Critical margin levels detected:', {
          count: criticalPositions.length,
          positions: criticalPositions.map(pos => ({
            id: pos.id,
            margin: pos.margin,
            marginRatio: (pos.margin / user.balance * 100).toFixed(2) + '%'
          }))
        });
        
        // Close critical positions
        for (const position of criticalPositions) {
          await this.closeCriticalPosition(position);
        }
      } else {
        console.log('✅ All positions within safe margin levels');
      }
    } catch (error: any) {
      console.error('❌ Margin guard check failed:', error.message);
      throw error;
    }
  }

  private async closeCriticalPosition(position: any): Promise<void> {
    try {
      console.log(`🔒 Closing critical position: ${position.id}`);
      
      await this.lnMarketsService.futures.closePosition(position.id);
      
      console.log('✅ Critical position closed successfully');
    } catch (error: any) {
      console.error(`❌ Failed to close critical position ${position.id}:`, error.message);
    }
  }
}
```

### 3. Automation Executor

```typescript
class AutomationExecutor {
  constructor(private lnMarketsService: LNMarketsAPIv2, private logger: any) {}

  async executeAutomation(automation: {
    id: string;
    conditions: any[];
    actions: any[];
  }): Promise<{ success: boolean; executedActions: number }> {
    try {
      console.log(`🤖 Executing automation: ${automation.id}`);
      
      // Check conditions
      const conditionsMet = await this.checkConditions(automation.conditions);
      
      if (!conditionsMet) {
        console.log('❌ Automation conditions not met');
        return { success: false, executedActions: 0 };
      }
      
      // Execute actions
      let executedActions = 0;
      
      for (const action of automation.actions) {
        try {
          await this.executeAction(action);
          executedActions++;
        } catch (error: any) {
          console.error(`❌ Failed to execute action:`, error.message);
          // Continue with other actions
        }
      }
      
      console.log(`✅ Automation executed successfully: ${executedActions} actions`);
      
      return { success: true, executedActions };
    } catch (error: any) {
      console.error('❌ Automation execution failed:', error.message);
      throw error;
    }
  }

  private async checkConditions(conditions: any[]): Promise<boolean> {
    // Implementation for checking automation conditions
    // This would check market conditions, user balance, etc.
    return true; // Simplified for example
  }

  private async executeAction(action: any): Promise<void> {
    switch (action.type) {
      case 'open_position':
        await this.lnMarketsService.futures.openPosition(action.params);
        break;
      case 'close_position':
        await this.lnMarketsService.futures.closePosition(action.params.positionId);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
}
```

## Testes com Credenciais Reais

### 1. Teste C1 - Main Account

```typescript
async function testC1MainAccount() {
  console.log('🧪 Testing C1 - Main Account...');
  
  const lnMarketsService = new LNMarketsAPIv2({
    credentials: {
      apiKey: '8N0ZtEaYiZQZNQopDDgoTr8FkuV0jJr6HMOd0MiHF9w=',
      apiSecret: '6qmuTLGZpvUH2kchz3Ww9vnYOYtBgDZ741LpF1fYz3Ro62DOncRu/GXCSshCf2ThFOE90/kLUju9orcuUEIddQ==',
      passphrase: 'passcphasec1',
      isTestnet: false
    },
    logger: console
  });

  try {
    // Test user endpoint
    const user = await lnMarketsService.user.getUser();
    console.log('✅ C1 User data:', {
      balance: user.balance,
      username: user.username,
      uid: user.uid
    });

    // Test futures endpoint
    const positions = await lnMarketsService.futures.getRunningPositions();
    console.log('✅ C1 Positions:', {
      count: positions.length,
      totalPnL: positions.reduce((sum, pos) => sum + pos.pnl, 0)
    });

    // Test market endpoint
    const ticker = await lnMarketsService.market.getTicker();
    console.log('✅ C1 Market data:', {
      bid: ticker.bid,
      ask: ticker.ask,
      last: ticker.last
    });

    return { success: true, balance: user.balance };
  } catch (error: any) {
    console.error('❌ C1 Test failed:', error.message);
    return { success: false, error: error.message };
  }
}
```

### 2. Teste C2 - Test Account

```typescript
async function testC2TestAccount() {
  console.log('🧪 Testing C2 - Test Account...');
  
  const lnMarketsService = new LNMarketsAPIv2({
    credentials: {
      apiKey: '8N0ZtEaYiZQZNQopDDgoTr8FkuV0jJr6HMOd0MiHF9w=',
      apiSecret: '6qmuTLGZpvUH2kchz3Ww9vnYOYtBgDZ741LpF1fYz3Ro62DOncRu/GXCSshCf2ThFOE90/kLUju9orcuUEIddQ==',
      passphrase: 'passcphasec2',
      isTestnet: false
    },
    logger: console
  });

  try {
    const user = await lnMarketsService.user.getUser();
    console.log('✅ C2 User data:', {
      balance: user.balance,
      username: user.username,
      uid: user.uid
    });

    return { success: true, balance: user.balance };
  } catch (error: any) {
    console.error('❌ C2 Test failed:', error.message);
    return { success: false, error: error.message };
  }
}
```

### 3. Teste Completo de Todos os Endpoints

```typescript
async function testAllEndpoints() {
  console.log('🧪 Testing all LN Markets API v2 endpoints...');
  
  const lnMarketsService = new LNMarketsAPIv2({
    credentials: {
      apiKey: '8N0ZtEaYiZQZNQopDDgoTr8FkuV0jJr6HMOd0MiHF9w=',
      apiSecret: '6qmuTLGZpvUH2kchz3Ww9vnYOYtBgDZ741LpF1fYz3Ro62DOncRu/GXCSshCf2ThFOE90/kLUju9orcuUEIddQ==',
      passphrase: 'passcphasec1',
      isTestnet: false
    },
    logger: console
  });

  const results = {
    user: { success: false, error: null },
    futures: { success: false, error: null },
    market: { success: false, error: null },
    deposits: { success: false, error: null },
    withdrawals: { success: false, error: null }
  };

  try {
    // Test user endpoints
    const user = await lnMarketsService.user.getUser();
    results.user = { success: true, error: null };
    console.log('✅ User endpoint working');

    // Test futures endpoints
    const positions = await lnMarketsService.futures.getRunningPositions();
    results.futures = { success: true, error: null };
    console.log('✅ Futures endpoint working');

    // Test market endpoints
    const ticker = await lnMarketsService.market.getTicker();
    results.market = { success: true, error: null };
    console.log('✅ Market endpoint working');

    // Test deposit endpoints
    const deposits = await lnMarketsService.user.getDeposits('bitcoin');
    results.deposits = { success: true, error: null };
    console.log('✅ Deposits endpoint working');

    // Test withdrawal endpoints
    const withdrawals = await lnMarketsService.user.getWithdrawals();
    results.withdrawals = { success: true, error: null };
    console.log('✅ Withdrawals endpoint working');

  } catch (error: any) {
    console.error('❌ Endpoint test failed:', error.message);
  }

  console.log('📋 Test Results Summary:', results);
  return results;
}
```

## Casos de Uso Completos

### 1. Trading Bot Simples

```typescript
class SimpleTradingBot {
  constructor(
    private lnMarketsService: LNMarketsAPIv2,
    private logger: any,
    private config: {
      maxPositions: number;
      minBalance: number;
      leverage: number;
    }
  ) {}

  async run(): Promise<void> {
    try {
      console.log('🤖 Starting trading bot...');
      
      while (true) {
        await this.tradingCycle();
        await this.sleep(60000); // Wait 1 minute
      }
    } catch (error: any) {
      console.error('❌ Trading bot failed:', error.message);
      throw error;
    }
  }

  private async tradingCycle(): Promise<void> {
    try {
      const [user, positions, ticker] = await Promise.all([
        this.lnMarketsService.user.getUser(),
        this.lnMarketsService.futures.getRunningPositions(),
        this.lnMarketsService.market.getTicker()
      ]);

      // Check if we can open new positions
      if (positions.length < this.config.maxPositions && user.balance > this.config.minBalance) {
        const signal = this.analyzeMarket(ticker);
        
        if (signal.shouldTrade) {
          await this.openPosition(signal);
        }
      }

      // Check existing positions
      for (const position of positions) {
        await this.managePosition(position, ticker);
      }

    } catch (error: any) {
      console.error('❌ Trading cycle failed:', error.message);
    }
  }

  private analyzeMarket(ticker: any): { shouldTrade: boolean; side?: 'b' | 's'; quantity?: number } {
    // Simple moving average strategy
    const spread = ticker.ask - ticker.bid;
    const midPrice = (ticker.ask + ticker.bid) / 2;
    
    // Simplified logic - in real implementation would use technical indicators
    return {
      shouldTrade: spread < midPrice * 0.001, // Low spread
      side: 'b', // Buy
      quantity: 100 // Fixed quantity
    };
  }

  private async openPosition(signal: any): Promise<void> {
    try {
      const position = await this.lnMarketsService.futures.openPosition({
        type: 'm',
        side: signal.side,
        quantity: signal.quantity,
        leverage: this.config.leverage
      });

      console.log('✅ Position opened:', {
        id: position.id,
        side: position.side,
        quantity: position.quantity,
        entry_price: position.entry_price
      });
    } catch (error: any) {
      console.error('❌ Failed to open position:', error.message);
    }
  }

  private async managePosition(position: any, ticker: any): Promise<void> {
    // Simple stop-loss / take-profit logic
    const pnlPercentage = position.pnl / position.margin;
    
    if (pnlPercentage > 0.5) { // 50% profit
      await this.lnMarketsService.futures.closePosition(position.id);
      console.log('✅ Position closed for profit:', position.id);
    } else if (pnlPercentage < -0.2) { // 20% loss
      await this.lnMarketsService.futures.closePosition(position.id);
      console.log('✅ Position closed for loss:', position.id);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2. Portfolio Manager

```typescript
class PortfolioManager {
  constructor(private lnMarketsService: LNMarketsAPIv2, private logger: any) {}

  async getPortfolioSummary(): Promise<any> {
    try {
      console.log('📊 Generating portfolio summary...');
      
      const [user, positions, ticker] = await Promise.all([
        this.lnMarketsService.user.getUser(),
        this.lnMarketsService.futures.getRunningPositions(),
        this.lnMarketsService.market.getTicker()
      ]);

      const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
      const totalMargin = positions.reduce((sum, pos) => sum + pos.margin, 0);
      const availableBalance = user.balance - totalMargin;

      const summary = {
        account: {
          balance: user.balance,
          availableBalance,
          synthetic_usd_balance: user.synthetic_usd_balance
        },
        positions: {
          count: positions.length,
          totalPnL,
          totalMargin,
          averageLeverage: positions.length > 0 ? 
            positions.reduce((sum, pos) => sum + pos.leverage, 0) / positions.length : 0
        },
        market: {
          currentPrice: ticker.last,
          spread: ticker.ask - ticker.bid,
          volume24h: ticker.volume_24h
        },
        risk: {
          marginRatio: totalMargin / user.balance,
          maxDrawdown: Math.min(...positions.map(pos => pos.pnl / pos.margin), 0)
        }
      };

      console.log('✅ Portfolio summary generated:', {
        balance: summary.account.balance,
        positions: summary.positions.count,
        totalPnL: summary.positions.totalPnL,
        marginRatio: (summary.risk.marginRatio * 100).toFixed(2) + '%'
      });

      return summary;
    } catch (error: any) {
      console.error('❌ Failed to generate portfolio summary:', error.message);
      throw error;
    }
  }
}
```

## Referências

- [Arquitetura do Sistema](./01-architecture.md)
- [Best Practices](./02-best-practices.md)
- [Migration Guide](./03-migration-guide.md)
- [Troubleshooting](./04-troubleshooting.md)

---
*Documentação gerada seguindo DOCUMENTATION_STANDARDS.md*
