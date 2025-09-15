import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { SimulationService } from '../services/simulation.service';
import { PrismaClient, SimulationType, PriceScenario } from '@prisma/client';

// Validation schemas
const CreateSimulationSchema = z.object({
  name: z.string().min(1).max(100),
  automationType: z.enum(['margin_guard', 'take_profit', 'trailing_stop', 'auto_entry']),
  priceScenario: z.enum(['bull', 'bear', 'sideways', 'volatile']),
  initialPrice: z.number().positive(),
  duration: z.number().min(10).max(3600), // 10 seconds to 1 hour
  accountId: z.string().optional(),
  environment: z.string().default('testnet'),
});

const SimulationParamsSchema = z.object({
  id: z.string().uuid(),
});

export class SimulationController {
  private simulationService: SimulationService;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.simulationService = new SimulationService();
  }

  // Criar nova simulação
  async createSimulation(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const body = CreateSimulationSchema.parse(request.body);

      const simulation = await this.simulationService.createSimulation(user?.id || '', {
        name: body.name,
        automationType: body.automationType as SimulationType,
        priceScenario: body.priceScenario as PriceScenario,
        initialPrice: body.initialPrice,
        duration: body.duration,
        accountId: body.accountId || null,
        environment: body.environment,
      });

      return reply.status(201).send({
        success: true,
        data: simulation,
      });
    } catch (error: any) {
      console.error('Create simulation error:', error);
      return reply.status(400).send({
        success: false,
        error: error.message || 'Failed to create simulation',
      });
    }
  }

  // Listar simulações do usuário
  async getSimulations(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = (request as any).user;
      const simulations = await this.simulationService.getUserSimulations(user?.id || '');

      return reply.send({
        success: true,
        data: simulations,
      });
    } catch (error: any) {
      console.error('Get simulations error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch simulations',
      });
    }
  }

  // Obter simulação específica
  async getSimulation(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = SimulationParamsSchema.parse(request.params);
      const user = (request as any).user;

      const simulation = await this.simulationService.getSimulation(id);

      if (!simulation || simulation.user_id !== user?.id) {
        return reply.status(404).send({
          success: false,
          error: 'Simulation not found',
        });
      }

      return reply.send({
        success: true,
        data: simulation,
      });
    } catch (error: any) {
      console.error('Get simulation error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch simulation',
      });
    }
  }

  // Iniciar simulação
  async startSimulation(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = SimulationParamsSchema.parse(request.params);
      const user = (request as any).user;

      // Verificar se a simulação pertence ao usuário
      const simulation = await this.simulationService.getSimulation(id);
      if (!simulation || simulation.user_id !== user?.id) {
        return reply.status(404).send({
          success: false,
          error: 'Simulation not found',
        });
      }

      // Verificar se já está em execução
      if (simulation.status === 'running') {
        return reply.status(400).send({
          success: false,
          error: 'Simulation is already running',
        });
      }

      await this.simulationService.startSimulation(id);

      return reply.send({
        success: true,
        message: 'Simulation started successfully',
      });
    } catch (error: any) {
      console.error('Start simulation error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to start simulation',
      });
    }
  }

  // Obter progresso da simulação em tempo real
  async getSimulationProgress(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = SimulationParamsSchema.parse(request.params);
      const user = (request as any).user;

      // Verificar se a simulação pertence ao usuário
      const simulation = await this.simulationService.getSimulation(id);
      if (!simulation || simulation.user_id !== user?.id) {
        return reply.status(404).send({
          success: false,
          error: 'Simulation not found',
        });
      }

      // Obter dados em tempo real do Redis
      const redis = require('ioredis');
      const redisClient = new redis(process.env['REDIS_URL'] || 'redis://localhost:6379');

      const progress = await redisClient.get(`simulation:${id}:progress`);
      const currentPrice = await redisClient.get(`simulation:${id}:current_price`);

      await redisClient.disconnect();

      return reply.send({
        success: true,
        data: {
          simulationId: id,
          status: simulation.status,
          progress: progress ? parseFloat(progress) : 0,
          currentPrice: currentPrice ? parseFloat(currentPrice) : simulation.initial_price,
          started_at: simulation.started_at,
          completed_at: simulation.completed_at,
        },
      });
    } catch (error: any) {
      console.error('Get simulation progress error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch simulation progress',
      });
    }
  }

  // Obter métricas finais da simulação
  async getSimulationMetrics(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = SimulationParamsSchema.parse(request.params);
      const user = (request as any).user;

      // Verificar se a simulação pertence ao usuário
      const simulation = await this.prisma.simulation.findUnique({
        where: { id, user_id: user?.id },
        include: { results: { orderBy: { timestamp: 'asc' } } },
      });

      if (!simulation) {
        return reply.status(404).send({
          success: false,
          error: 'Simulation not found',
        });
      }

      if (!simulation.results || simulation.results.length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'Simulation has no results yet',
        });
      }

      const metrics = this.simulationService.calculateSimulationMetrics(simulation.results);

      return reply.send({
        success: true,
        data: {
          simulationId: id,
          metrics,
          summary: {
            automationType: simulation.automation_type,
            priceScenario: simulation.price_scenario,
            duration: simulation.duration,
            initialPrice: simulation.initial_price,
            status: simulation.status,
          },
        },
      });
    } catch (error: any) {
      console.error('Get simulation metrics error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch simulation metrics',
      });
    }
  }

  // Deletar simulação
  async deleteSimulation(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = SimulationParamsSchema.parse(request.params);
      const user = (request as any).user;

      await this.simulationService.deleteSimulation(id, user?.id || '');

      return reply.send({
        success: true,
        message: 'Simulation deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete simulation error:', error);
      return reply.status(500).send({
        success: false,
        error: error.message || 'Failed to delete simulation',
      });
    }
  }

  // Obter dados históricos da simulação (para gráficos)
  async getSimulationChartData(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = SimulationParamsSchema.parse(request.params);
      const user = (request as any).user;

      // Verificar se a simulação pertence ao usuário
      const simulation = await this.prisma.simulation.findUnique({
        where: { id, user_id: user?.id },
        include: { results: { orderBy: { timestamp: 'asc' } } },
      });

      if (!simulation) {
        return reply.status(404).send({
          success: false,
          error: 'Simulation not found',
        });
      }

      const simulationResults = simulation.results;

      if (!simulationResults || simulationResults.length === 0) {
        return reply.send({
          success: true,
          data: {
            priceData: [],
            pnlData: [],
            actions: [],
          },
        });
      }

      // Preparar dados para gráficos
      const priceData = simulationResults.map(result => ({
        timestamp: result.timestamp,
        price: result.price,
      }));

      const pnlData = simulationResults.map(result => ({
        timestamp: result.timestamp,
        pnl: result.pnl || 0,
        accountBalance: result.account_balance || 0,
      }));

      const actions = simulationResults
        .filter(result => result.action_type)
        .map(result => ({
          timestamp: result.timestamp,
          action: result.action_type,
          price: result.price,
          details: result.action_details,
        }));

      return reply.send({
        success: true,
        data: {
          priceData,
          pnlData,
          actions,
        },
      });
    } catch (error: any) {
      console.error('Get simulation chart data error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch simulation chart data',
      });
    }
  }
}
