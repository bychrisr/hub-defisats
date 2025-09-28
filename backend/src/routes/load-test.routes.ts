/**
 * Load Test Routes
 * 
 * Rotas para execução e monitoramento de testes de carga
 * - Execução de testes de carga programáticos
 * - Monitoramento de performance em tempo real
 * - Histórico de testes executados
 * - Métricas detalhadas de performance
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { WebSocket } from 'ws';
import { performance } from 'perf_hooks';

interface LoadTestConfig {
  concurrentUsers: number;
  requestsPerUser: number;
  durationSeconds: number;
  rampUpSeconds: number;
  testType: 'dashboard' | 'positions' | 'websocket' | 'full';
}

interface LoadTestResult {
  id: string;
  config: LoadTestConfig;
  startTime: number;
  endTime: number;
  duration: number;
  metrics: {
    requests: {
      total: number;
      successful: number;
      failed: number;
      responseTimes: number[];
    };
    websocket: {
      connections: number;
      messages: number;
      errors: number;
      latency: number[];
    };
    errors: Array<{
      userId: string;
      endpoint?: string;
      type?: string;
      error: string;
      timestamp: string;
    }>;
  };
  summary: {
    successRate: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    requestsPerSecond: number;
    status: 'excellent' | 'good' | 'critical';
  };
}

export async function loadTestRoutes(fastify: FastifyInstance) {
  console.log('🚀 LOAD TEST ROUTES - Initializing...');
  
  const prisma = (fastify as any).prisma as PrismaClient;
  
  // Armazenar resultados de testes em memória (futuramente será no banco)
  const testResults: LoadTestResult[] = [];
  const activeTests = new Map<string, { status: 'running' | 'completed' | 'failed', startTime: number }>();

  // ============================================================================
  // EXECUTAR TESTE DE CARGA
  // ============================================================================
  
  fastify.post('/execute', {
    preHandler: [(fastify as any).authenticate],
    schema: {
      description: 'Execute load test with specified configuration',
      tags: ['Load Test'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          concurrentUsers: { type: 'number', minimum: 1, maximum: 100, default: 10 },
          requestsPerUser: { type: 'number', minimum: 1, maximum: 100, default: 20 },
          durationSeconds: { type: 'number', minimum: 10, maximum: 300, default: 60 },
          rampUpSeconds: { type: 'number', minimum: 5, maximum: 60, default: 10 },
          testType: { 
            type: 'string', 
            enum: ['dashboard', 'positions', 'websocket', 'full'],
            default: 'full'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            testId: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const startTime = Date.now();
      const testId = `load-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        const userId = (request as any).user?.id;
        if (!userId) {
          return reply.status(401).send({
            success: false,
            error: 'UNAUTHORIZED',
            message: 'User not authenticated'
          });
        }

        const config = request.body as LoadTestConfig;
        
        console.log(`🚀 [${testId}] Starting load test:`, config);
        
        // Marcar teste como ativo
        activeTests.set(testId, { status: 'running', startTime });
        
        // Executar teste em background
        executeLoadTest(testId, config, userId).then(result => {
          testResults.push(result);
          activeTests.set(testId, { status: 'completed', startTime });
          console.log(`✅ [${testId}] Load test completed successfully`);
        }).catch(error => {
          activeTests.set(testId, { status: 'failed', startTime });
          console.error(`❌ [${testId}] Load test failed:`, error);
        });

        return reply.status(200).send({
          success: true,
          testId,
          message: 'Load test started successfully',
          config,
          estimatedDuration: config.durationSeconds + config.rampUpSeconds
        });

      } catch (error: any) {
        console.error(`❌ [${testId}] Error starting load test:`, error);
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_ERROR',
          message: error.message
        });
      }
    }
  });

  // ============================================================================
  // STATUS DO TESTE ATIVO
  // ============================================================================
  
  fastify.get('/status/:testId', {
    preHandler: [(fastify as any).authenticate],
    schema: {
      description: 'Get status of active load test',
      tags: ['Load Test'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          testId: { type: 'string' }
        }
      }
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { testId } = request.params as { testId: string };
        const activeTest = activeTests.get(testId);
        
        if (!activeTest) {
          return reply.status(404).send({
            success: false,
            error: 'TEST_NOT_FOUND',
            message: 'Test not found or not active'
          });
        }

        const duration = Date.now() - activeTest.startTime;
        
        return reply.status(200).send({
          success: true,
          testId,
          status: activeTest.status,
          duration: Math.floor(duration / 1000),
          startTime: new Date(activeTest.startTime).toISOString()
        });

      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_ERROR',
          message: error.message
        });
      }
    }
  });

  // ============================================================================
  // RESULTADOS DO TESTE
  // ============================================================================
  
  fastify.get('/results/:testId', {
    preHandler: [(fastify as any).authenticate],
    schema: {
      description: 'Get detailed results of completed load test',
      tags: ['Load Test'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          testId: { type: 'string' }
        }
      }
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { testId } = request.params as { testId: string };
        const result = testResults.find(r => r.id === testId);
        
        if (!result) {
          return reply.status(404).send({
            success: false,
            error: 'RESULT_NOT_FOUND',
            message: 'Test results not found'
          });
        }

        return reply.status(200).send({
          success: true,
          result
        });

      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_ERROR',
          message: error.message
        });
      }
    }
  });

  // ============================================================================
  // HISTÓRICO DE TESTES
  // ============================================================================
  
  fastify.get('/history', {
    preHandler: [(fastify as any).authenticate],
    schema: {
      description: 'Get history of all load tests',
      tags: ['Load Test'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'number', default: 10 },
          offset: { type: 'number', default: 0 }
        }
      }
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { limit = 10, offset = 0 } = request.query as { limit: number, offset: number };
        
        const paginatedResults = testResults
          .sort((a, b) => b.startTime - a.startTime)
          .slice(offset, offset + limit);

        return reply.status(200).send({
          success: true,
          results: paginatedResults,
          total: testResults.length,
          limit,
          offset
        });

      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          error: 'INTERNAL_ERROR',
          message: error.message
        });
      }
    }
  });

  // ============================================================================
  // FUNÇÃO PARA EXECUTAR TESTE DE CARGA
  // ============================================================================
  
  async function executeLoadTest(testId: string, config: LoadTestConfig, userId: string): Promise<LoadTestResult> {
    const startTime = performance.now();
    const metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        responseTimes: [] as number[]
      },
      websocket: {
        connections: 0,
        messages: 0,
        errors: 0,
        latency: [] as number[]
      },
      errors: [] as Array<{
        userId: string;
        endpoint?: string;
        type?: string;
        error: string;
        timestamp: string;
      }>
    };

    try {
      // 1. Autenticar usuário de teste
      console.log(`🔐 [${testId}] Authenticating test user...`);
      const authResponse = await axios.post('http://localhost:13000/api/auth/login', {
        email: 'brainoschris@gmail.com',
        password: 'TestPassword123!'
      });
      
      const token = authResponse.data.token;
      console.log(`✅ [${testId}] Authentication successful`);

      // 2. Criar simuladores de usuários
      const userSimulators = [];
      for (let i = 0; i < config.concurrentUsers; i++) {
        userSimulators.push(new UserSimulator(`user-${i}`, token, testId, metrics));
      }

      console.log(`👥 [${testId}] Created ${config.concurrentUsers} user simulators`);

      // 3. Executar testes em paralelo com ramp-up
      const rampUpDelay = config.rampUpSeconds * 1000 / config.concurrentUsers;
      
      const promises = userSimulators.map(async (simulator, index) => {
        await sleep(index * rampUpDelay);
        return simulator.simulateUserSession(config);
      });

      // 4. Aguardar conclusão
      await Promise.all(promises);

    } catch (error: any) {
      console.error(`❌ [${testId}] Critical error in load test:`, error);
      metrics.errors.push({
        userId: 'system',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Calcular métricas
    const avgResponseTime = metrics.requests.responseTimes.length > 0 
      ? metrics.requests.responseTimes.reduce((a, b) => a + b, 0) / metrics.requests.responseTimes.length 
      : 0;
    
    const p95ResponseTime = metrics.requests.responseTimes.length > 0
      ? metrics.requests.responseTimes.sort((a, b) => a - b)[Math.floor(metrics.requests.responseTimes.length * 0.95)]
      : 0;
    
    const successRate = metrics.requests.total > 0 
      ? (metrics.requests.successful / metrics.requests.total) * 100 
      : 0;
    
    const requestsPerSecond = metrics.requests.total / (duration / 1000);

    // Determinar status
    let status: 'excellent' | 'good' | 'critical' = 'critical';
    if (successRate >= 95 && avgResponseTime <= 500 && requestsPerSecond >= 10) {
      status = 'excellent';
    } else if (successRate >= 90 && avgResponseTime <= 1000 && requestsPerSecond >= 5) {
      status = 'good';
    }

    const result: LoadTestResult = {
      id: testId,
      config,
      startTime,
      endTime,
      duration,
      metrics,
      summary: {
        successRate,
        avgResponseTime,
        p95ResponseTime,
        requestsPerSecond,
        status
      }
    };

    return result;
  }

  // ============================================================================
  // CLASSE SIMULADOR DE USUÁRIO
  // ============================================================================
  
  class UserSimulator {
    constructor(
      private userId: string, 
      private token: string, 
      private testId: string,
      private metrics: any
    ) {}

    async simulateUserSession(config: LoadTestConfig) {
      try {
        // Conectar WebSocket
        await this.connectWebSocket();
        
        // Simular atividade contínua
        const endTime = Date.now() + (config.durationSeconds * 1000);
        
        while (Date.now() < endTime && this.metrics.requests.total < config.requestsPerUser) {
          const activity = Math.random();
          
          if (activity < 0.3) {
            await this.testDashboardEndpoint();
          } else if (activity < 0.6) {
            await this.testPositionsEndpoint();
          } else if (activity < 0.8) {
            await this.testWebSocketPing();
          } else {
            await sleep(randomDelay(500, 2000));
          }
          
          await sleep(randomDelay(100, 1000));
        }
        
      } catch (error: any) {
        this.metrics.errors.push({
          userId: this.userId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    async testDashboardEndpoint() {
      const startTime = performance.now();
      
      try {
        const response = await axios.get('http://localhost:13000/api/lnmarkets-robust/dashboard', {
          headers: { 'Authorization': `Bearer ${this.token}` },
          timeout: 10000
        });
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        this.metrics.requests.total++;
        this.metrics.requests.successful++;
        this.metrics.requests.responseTimes.push(responseTime);
        
      } catch (error: any) {
        this.metrics.requests.failed++;
        this.metrics.errors.push({
          userId: this.userId,
          endpoint: 'dashboard',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    async testPositionsEndpoint() {
      const startTime = performance.now();
      
      try {
        const response = await axios.get('http://localhost:13000/api/lnmarkets-robust/positions', {
          headers: { 'Authorization': `Bearer ${this.token}` },
          timeout: 10000
        });
        
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        this.metrics.requests.total++;
        this.metrics.requests.successful++;
        this.metrics.requests.responseTimes.push(responseTime);
        
      } catch (error: any) {
        this.metrics.requests.failed++;
        this.metrics.errors.push({
          userId: this.userId,
          endpoint: 'positions',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    async connectWebSocket() {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket(`ws://localhost:13000/ws?userId=${this.userId}`);
        
        ws.on('open', () => {
          this.metrics.websocket.connections++;
          resolve(undefined);
        });
        
        ws.on('message', (data) => {
          this.metrics.websocket.messages++;
          const message = JSON.parse(data.toString());
          if (message.type === 'data_update') {
            const latency = performance.now() - (message.timestamp || Date.now());
            this.metrics.websocket.latency.push(latency);
          }
        });
        
        ws.on('error', (error) => {
          this.metrics.websocket.errors++;
          reject(error);
        });
      });
    }

    async testWebSocketPing() {
      // Implementar ping WebSocket se necessário
    }
  }

  // Utilitários
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const randomDelay = (min: number, max: number) => Math.random() * (max - min) + min;

  console.log('✅ LOAD TEST ROUTES - Initialized successfully');
}
