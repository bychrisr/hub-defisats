import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { SimulationController } from '../controllers/simulation.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export async function simulationRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const simulationController = new SimulationController(prisma);

  // Apply authentication middleware to all routes
  fastify.addHook('preHandler', authMiddleware);

  // Criar nova simulação
  fastify.post(
    '/simulations',
    {
      schema: {
        description: 'Create a new simulation',
        tags: ['simulations'],
        body: {
          type: 'object',
          required: ['name', 'automationType', 'priceScenario', 'initialPrice', 'duration'],
          properties: {
            name: {
              type: 'string',
              description: 'Descriptive name for the simulation',
              minLength: 1,
              maxLength: 100,
            },
            automationType: {
              type: 'string',
              enum: ['margin_guard', 'take_profit', 'trailing_stop', 'auto_entry'],
              description: 'Type of automation to simulate',
            },
            priceScenario: {
              type: 'string',
              enum: ['bull', 'bear', 'sideways', 'volatile'],
              description: 'Market scenario for the simulation',
            },
            initialPrice: {
              type: 'number',
              description: 'Starting Bitcoin price in USD',
              minimum: 0,
            },
            duration: {
              type: 'number',
              description: 'Simulation duration in seconds',
              minimum: 10,
              maximum: 3600,
            },
            accountId: {
              type: 'string',
              description: 'Test account ID (optional)',
            },
            environment: {
              type: 'string',
              description: 'Environment for simulation',
              default: 'testnet',
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  automation_type: { type: 'string' },
                  price_scenario: { type: 'string' },
                  initial_price: { type: 'number' },
                  duration: { type: 'number' },
                  status: { type: 'string' },
                  created_at: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    simulationController.createSimulation.bind(simulationController)
  );

  // Listar simulações do usuário
  fastify.get(
    '/simulations',
    {
      schema: {
        description: 'Get user simulations',
        tags: ['simulations'],
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    automation_type: { type: 'string' },
                    price_scenario: { type: 'string' },
                    initial_price: { type: 'number' },
                    duration: { type: 'number' },
                    status: { type: 'string' },
                    created_at: { type: 'string' },
                    results: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          timestamp: { type: 'string' },
                          price: { type: 'number' },
                          pnl: { type: 'number' },
                          action_type: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    simulationController.getSimulations.bind(simulationController)
  );

  // Obter simulação específica
  fastify.get(
    '/simulations/:id',
    {
      schema: {
        description: 'Get specific simulation',
        tags: ['simulations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'Simulation ID',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  automation_type: { type: 'string' },
                  price_scenario: { type: 'string' },
                  initial_price: { type: 'number' },
                  duration: { type: 'number' },
                  status: { type: 'string' },
                  created_at: { type: 'string' },
                  started_at: { type: 'string' },
                  completed_at: { type: 'string' },
                  results: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        timestamp: { type: 'string' },
                        price: { type: 'number' },
                        pnl: { type: 'number' },
                        action_type: { type: 'string' },
                        action_details: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    simulationController.getSimulation.bind(simulationController)
  );

  // Iniciar simulação
  fastify.post(
    '/simulations/:id/start',
    {
      schema: {
        description: 'Start a simulation',
        tags: ['simulations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'Simulation ID',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    simulationController.startSimulation.bind(simulationController)
  );

  // Obter progresso da simulação em tempo real
  fastify.get(
    '/simulations/:id/progress',
    {
      schema: {
        description: 'Get simulation real-time progress',
        tags: ['simulations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'Simulation ID',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  simulationId: { type: 'string' },
                  status: { type: 'string' },
                  progress: { type: 'number' },
                  currentPrice: { type: 'number' },
                  started_at: { type: 'string' },
                  completed_at: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    simulationController.getSimulationProgress.bind(simulationController)
  );

  // Obter métricas da simulação
  fastify.get(
    '/simulations/:id/metrics',
    {
      schema: {
        description: 'Get simulation metrics',
        tags: ['simulations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'Simulation ID',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  simulationId: { type: 'string' },
                  metrics: {
                    type: 'object',
                    properties: {
                      successRate: { type: 'number' },
                      totalActions: { type: 'number' },
                      averageResponseTime: { type: 'number' },
                      totalPnL: { type: 'number' },
                      maxDrawdown: { type: 'number' },
                      finalBalance: { type: 'number' },
                    },
                  },
                  summary: {
                    type: 'object',
                    properties: {
                      automationType: { type: 'string' },
                      priceScenario: { type: 'string' },
                      duration: { type: 'number' },
                      initialPrice: { type: 'number' },
                      status: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    simulationController.getSimulationMetrics.bind(simulationController)
  );

  // Obter dados para gráficos
  fastify.get(
    '/simulations/:id/chart',
    {
      schema: {
        description: 'Get simulation chart data',
        tags: ['simulations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'Simulation ID',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  priceData: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        timestamp: { type: 'string' },
                        price: { type: 'number' },
                      },
                    },
                  },
                  pnlData: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        timestamp: { type: 'string' },
                        pnl: { type: 'number' },
                        accountBalance: { type: 'number' },
                      },
                    },
                  },
                  actions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        timestamp: { type: 'string' },
                        action: { type: 'string' },
                        price: { type: 'number' },
                        details: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    simulationController.getSimulationChartData.bind(simulationController)
  );

  // Deletar simulação
  fastify.delete(
    '/simulations/:id',
    {
      schema: {
        description: 'Delete a simulation',
        tags: ['simulations'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'Simulation ID',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    simulationController.deleteSimulation.bind(simulationController)
  );
}
