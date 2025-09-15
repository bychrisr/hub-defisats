import { PrismaClient, Simulation, SimulationResult, PriceScenario, SimulationType } from '@prisma/client';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

interface SimulationConfig {
  name: string;
  automationType: SimulationType;
  priceScenario: PriceScenario;
  initialPrice: number;
  duration: number;
  accountId?: string | null;
  environment?: string;
}

interface PriceDataPoint {
  timestamp: Date;
  price: number;
}

interface SimulationMetrics {
  successRate: number;
  totalActions: number;
  averageResponseTime: number;
  totalPnL: number;
  maxDrawdown: number;
  finalBalance: number;
}

export class SimulationService {
  private prisma: PrismaClient;
  private redis: Redis;
  private simulationQueue: Queue;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env['REDIS_URL'] || 'redis://localhost:6379');
    this.simulationQueue = new Queue('simulation', {
      connection: this.redis,
      defaultJobOptions: {
        priority: 3,
        removeOnComplete: 10,
        removeOnFail: 10,
      },
    });
  }

  // Criar nova simulação
  async createSimulation(userId: string, config: SimulationConfig): Promise<Simulation> {
    try {
      const simulation = await this.prisma.simulation.create({
        data: {
          user_id: userId,
          name: config.name,
          automation_type: config.automationType,
          price_scenario: config.priceScenario,
          initial_price: config.initialPrice,
          duration: config.duration,
          account_id: config.accountId || null,
          environment: config.environment || 'testnet',
        },
      });

      console.log(`✅ Simulation created: ${simulation.id} for user ${userId}`);
      return simulation;
    } catch (error) {
      console.error('❌ Failed to create simulation:', error);
      throw new Error('Failed to create simulation');
    }
  }

  // Executar simulação
  async startSimulation(simulationId: string): Promise<void> {
    try {
      const simulation = await this.prisma.simulation.findUnique({
        where: { id: simulationId },
      });

      if (!simulation) {
        throw new Error('Simulation not found');
      }

      if (simulation.status !== 'created') {
        throw new Error('Simulation is not in created status');
      }

      // Atualizar status para running
      await this.prisma.simulation.update({
        where: { id: simulationId },
        data: {
          status: 'running',
          started_at: new Date(),
        },
      });

      // Adicionar job na fila
      await this.simulationQueue.add(
        'execute-simulation',
        {
          simulationId,
          userId: simulation.user_id,
        },
        {
          priority: 3,
          delay: 0,
          removeOnComplete: 10,
          removeOnFail: 10,
        }
      );

      console.log(`🚀 Simulation ${simulationId} started`);
    } catch (error) {
      console.error('❌ Failed to start simulation:', error);
      throw error;
    }
  }

  // Gerar dados de preço baseado no cenário
  generatePriceData(
    scenario: PriceScenario,
    initialPrice: number,
    duration: number
  ): PriceDataPoint[] {
    const priceData: PriceDataPoint[] = [];
    const points = duration * 10; // 10 pontos por segundo para dados detalhados
    let currentPrice = initialPrice;
    const startTime = new Date();

    for (let i = 0; i < points; i++) {
      const timestamp = new Date(startTime.getTime() + (i * 100)); // 100ms intervals

      switch (scenario) {
        case 'bull':
          // Mercado em alta: tendência positiva com volatilidade baixa
          currentPrice += this.generateBullMovement(currentPrice);
          break;

        case 'bear':
          // Mercado em queda: tendência negativa com volatilidade média
          currentPrice += this.generateBearMovement(currentPrice);
          break;

        case 'sideways':
          // Mercado lateral: sem tendência, movimentos aleatórios
          currentPrice += this.generateSidewaysMovement(currentPrice);
          break;

        case 'volatile':
          // Mercado volátil: alta oscilação, imprevisível
          currentPrice += this.generateVolatileMovement(currentPrice);
          break;
      }

      // Garantir que o preço não seja negativo
      currentPrice = Math.max(currentPrice, 100);

      priceData.push({
        timestamp,
        price: currentPrice,
      });
    }

    return priceData;
  }

  // Gerar movimento para cenário bull
  private generateBullMovement(currentPrice: number): number {
    const trendStrength = 0.001; // 0.1% tendência positiva por passo
    const volatility = 0.002; // 0.2% volatilidade
    const random = (Math.random() - 0.5) * 2;

    return currentPrice * (trendStrength + random * volatility);
  }

  // Gerar movimento para cenário bear
  private generateBearMovement(currentPrice: number): number {
    const trendStrength = -0.002; // -0.2% tendência negativa por passo
    const volatility = 0.003; // 0.3% volatilidade
    const random = (Math.random() - 0.5) * 2;

    return currentPrice * (trendStrength + random * volatility);
  }

  // Gerar movimento para cenário sideways
  private generateSidewaysMovement(currentPrice: number): number {
    const volatility = 0.005; // 0.5% volatilidade
    const random = (Math.random() - 0.5) * 2;

    return currentPrice * random * volatility;
  }

  // Gerar movimento para cenário volatile
  private generateVolatileMovement(currentPrice: number): number {
    const volatility = 0.01; // 1% volatilidade
    const random = (Math.random() - 0.5) * 2;
    const extremeEvent = Math.random() < 0.05; // 5% chance de evento extremo

    if (extremeEvent) {
      // Evento extremo: movimento de até 5%
      return currentPrice * random * 0.05;
    }

    return currentPrice * random * volatility;
  }

  // Executar lógica de automação baseada no tipo
  executeAutomationLogic(
    automationType: SimulationType,
    currentPrice: number,
    initialPrice: number,
    accountBalance: number,
    positionSize: number,
    pnl: number
  ): { action: string; details: any } | null {
    switch (automationType) {
      case 'margin_guard':
        return this.executeMarginGuardLogic(currentPrice, initialPrice, accountBalance, positionSize, pnl);

      case 'take_profit':
        return this.executeTakeProfitLogic(currentPrice, initialPrice, pnl);

      case 'trailing_stop':
        return this.executeTrailingStopLogic(currentPrice, initialPrice);

      case 'auto_entry':
        return this.executeAutoEntryLogic(currentPrice, initialPrice);

      default:
        return null;
    }
  }

  // Lógica do Margin Guard
  private executeMarginGuardLogic(
    currentPrice: number,
    initialPrice: number,
    accountBalance: number,
    positionSize: number,
    pnl: number
  ): { action: string; details: any } | null {
    const priceDrop = ((initialPrice - currentPrice) / initialPrice) * 100;

    if (priceDrop >= 5) { // 5% drop trigger
      const marginLevel = (accountBalance + pnl) / (positionSize * currentPrice * 0.1); // 10% maintenance margin

      if (marginLevel < 0.15) { // Below 15% margin threshold
        return {
          action: 'close_position',
          details: {
            reason: 'margin_below_threshold',
            marginLevel: marginLevel,
            priceDrop: priceDrop,
          },
        };
      }
    }

    return null;
  }

  // Lógica do Take Profit
  private executeTakeProfitLogic(
    currentPrice: number,
    initialPrice: number,
    pnl: number
  ): { action: string; details: any } | null {
    const priceIncrease = ((currentPrice - initialPrice) / initialPrice) * 100;

    if (priceIncrease >= 10 && pnl > 0) { // 10% increase and positive P&L
      return {
        action: 'take_profit',
        details: {
          priceIncrease: priceIncrease,
          pnl: pnl,
        },
      };
    }

    return null;
  }

  // Lógica do Trailing Stop
  private executeTrailingStopLogic(
    currentPrice: number,
    initialPrice: number
  ): { action: string; details: any } | null {
    const priceChange = ((currentPrice - initialPrice) / initialPrice) * 100;

    if (Math.abs(priceChange) >= 2) { // 2% movement trigger
      return {
        action: 'adjust_stop',
        details: {
          priceChange: priceChange,
          newStopLevel: currentPrice * 0.98, // 2% below current price
        },
      };
    }

    return null;
  }

  // Lógica do Auto Entry
  private executeAutoEntryLogic(
    currentPrice: number,
    initialPrice: number
  ): { action: string; details: any } | null {
    const priceDeviation = ((currentPrice - initialPrice) / initialPrice) * 100;

    // RSI simulation (simplified)
    const rsi = this.calculateRSI(currentPrice, initialPrice);

    if (rsi < 30 && priceDeviation < -3) { // Oversold condition
      return {
        action: 'enter_position',
        details: {
          rsi: rsi,
          priceDeviation: priceDeviation,
          entryPrice: currentPrice,
        },
      };
    }

    return null;
  }

  // Calcular RSI simplificado
  private calculateRSI(currentPrice: number, initialPrice: number): number {
    // Simplified RSI calculation for simulation
    const change = currentPrice - initialPrice;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    if (loss === 0) return 100;
    const rs = gain / loss;
    return 100 - (100 / (1 + rs));
  }

  // Calcular métricas da simulação
  calculateSimulationMetrics(results: SimulationResult[]): SimulationMetrics {
    if (results.length === 0) {
      return {
        successRate: 0,
        totalActions: 0,
        averageResponseTime: 0,
        totalPnL: 0,
        maxDrawdown: 0,
        finalBalance: 0,
      };
    }

    const totalActions = results.filter(r => r.action_type).length;
    const successfulActions = results.filter(r => r.success_rate && r.success_rate > 0).length;
    const successRate = totalActions > 0 ? (successfulActions / totalActions) * 100 : 0;

    const pnlValues = results.map(r => r.pnl || 0);
    const totalPnL = pnlValues[pnlValues.length - 1] || 0;

    const maxDrawdown = Math.min(...pnlValues);

    const finalBalance = results[results.length - 1]?.account_balance || 0;

    // Calculate average response time (simplified)
    const averageResponseTime = 100; // ms

    return {
      successRate,
      totalActions,
      averageResponseTime,
      totalPnL,
      maxDrawdown,
      finalBalance,
    };
  }

  // Obter simulação por ID
  async getSimulation(simulationId: string): Promise<Simulation | null> {
    return this.prisma.simulation.findUnique({
      where: { id: simulationId },
      include: {
        results: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
  }

  // Listar simulações do usuário
  async getUserSimulations(userId: string): Promise<Simulation[]> {
    return this.prisma.simulation.findMany({
      where: { user_id: userId },
      include: {
        results: {
          orderBy: { timestamp: 'asc' },
          take: 1, // Apenas o último resultado para performance
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // Deletar simulação
  async deleteSimulation(simulationId: string, userId: string): Promise<void> {
    await this.prisma.simulation.deleteMany({
      where: {
        id: simulationId,
        user_id: userId,
        status: { not: 'running' }, // Não permitir deletar simulações em execução
      },
    });
  }

  // Cleanup
  async close(): Promise<void> {
    await this.prisma.$disconnect();
    await this.redis.disconnect();
    await this.simulationQueue.close();
  }
}
