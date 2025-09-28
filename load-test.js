#!/usr/bin/env node

/**
 * 🚀 TESTE DE CARGA - Hub DeFiSats
 * 
 * Este script realiza testes de carga abrangentes para validar a performance
 * da aplicação após as otimizações implementadas.
 */

const axios = require('axios');
const WebSocket = require('ws');
const { performance } = require('perf_hooks');

// Configurações
const CONFIG = {
  BASE_URL: 'http://localhost:13000',
  WS_URL: 'ws://localhost:13000/ws',
  TEST_USER: {
    email: 'brainoschris@gmail.com',
    password: 'TestPassword123!'
  },
  LOAD_TEST: {
    CONCURRENT_USERS: 10,
    REQUESTS_PER_USER: 20,
    DURATION_SECONDS: 60,
    RAMP_UP_SECONDS: 10
  }
};

// Métricas coletadas
const metrics = {
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    responseTimes: []
  },
  websocket: {
    connections: 0,
    messages: 0,
    errors: 0,
    latency: []
  },
  errors: [],
  startTime: null,
  endTime: null
};

// Utilitários
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = (min = 100, max = 500) => Math.random() * (max - min) + min;

// Classe para teste de usuário individual
class UserSimulator {
  constructor(userId, token) {
    this.userId = userId;
    this.token = token;
    this.ws = null;
    this.requestCount = 0;
    this.errors = [];
  }

  async simulateUserSession() {
    console.log(`👤 Usuário ${this.userId} iniciando sessão...`);
    
    try {
      // 1. Testar endpoint de dashboard
      await this.testDashboardEndpoint();
      
      // 2. Testar endpoint de posições
      await this.testPositionsEndpoint();
      
      // 3. Conectar WebSocket
      await this.connectWebSocket();
      
      // 4. Simular atividade contínua
      await this.simulateContinuousActivity();
      
    } catch (error) {
      console.error(`❌ Erro na sessão do usuário ${this.userId}:`, error.message);
      this.errors.push(error);
    } finally {
      if (this.ws) {
        this.ws.close();
      }
    }
  }

  async testDashboardEndpoint() {
    const startTime = performance.now();
    
    try {
      const response = await axios.get(`${CONFIG.BASE_URL}/api/lnmarkets-robust/dashboard`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      metrics.requests.total++;
      metrics.requests.successful++;
      metrics.requests.responseTimes.push(responseTime);
      
      console.log(`✅ Dashboard - Usuário ${this.userId}: ${response.status} (${responseTime.toFixed(2)}ms)`);
      
      // Validar estrutura de dados
      if (response.data?.data?.lnMarkets) {
        console.log(`📊 Dados recebidos - Posições: ${response.data.data.lnMarkets.positions?.length || 0}`);
      }
      
    } catch (error) {
      metrics.requests.failed++;
      metrics.errors.push({
        userId: this.userId,
        endpoint: 'dashboard',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      console.error(`❌ Dashboard - Usuário ${this.userId}: ${error.message}`);
    }
  }

  async testPositionsEndpoint() {
    const startTime = performance.now();
    
    try {
      const response = await axios.get(`${CONFIG.BASE_URL}/api/lnmarkets-robust/positions`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      metrics.requests.total++;
      metrics.requests.successful++;
      metrics.requests.responseTimes.push(responseTime);
      
      console.log(`✅ Positions - Usuário ${this.userId}: ${response.status} (${responseTime.toFixed(2)}ms)`);
      
    } catch (error) {
      metrics.requests.failed++;
      metrics.errors.push({
        userId: this.userId,
        endpoint: 'positions',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      console.error(`❌ Positions - Usuário ${this.userId}: ${error.message}`);
    }
  }

  async connectWebSocket() {
    return new Promise((resolve, reject) => {
      const wsUrl = `${CONFIG.WS_URL}?userId=${this.userId}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.on('open', () => {
        console.log(`🔌 WebSocket conectado - Usuário ${this.userId}`);
        metrics.websocket.connections++;
        resolve();
      });
      
      this.ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        metrics.websocket.messages++;
        
        if (message.type === 'data_update') {
          const latency = performance.now() - (message.timestamp || Date.now());
          metrics.websocket.latency.push(latency);
          console.log(`📡 WebSocket data - Usuário ${this.userId}: ${message.data?.positions?.length || 0} posições`);
        }
      });
      
      this.ws.on('error', (error) => {
        metrics.websocket.errors++;
        metrics.errors.push({
          userId: this.userId,
          type: 'websocket',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        reject(error);
      });
      
      this.ws.on('close', () => {
        console.log(`🔌 WebSocket desconectado - Usuário ${this.userId}`);
      });
    });
  }

  async simulateContinuousActivity() {
    const endTime = Date.now() + (CONFIG.LOAD_TEST.DURATION_SECONDS * 1000);
    
    while (Date.now() < endTime && this.requestCount < CONFIG.LOAD_TEST.REQUESTS_PER_USER) {
      // Simular atividade aleatória
      const activity = Math.random();
      
      if (activity < 0.3) {
        // 30% - Refresh dashboard
        await this.testDashboardEndpoint();
      } else if (activity < 0.6) {
        // 30% - Refresh positions
        await this.testPositionsEndpoint();
      } else if (activity < 0.8) {
        // 20% - WebSocket ping
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'ping',
            userId: this.userId,
            timestamp: Date.now()
          }));
        }
      } else {
        // 20% - Pausa
        await sleep(randomDelay(500, 2000));
      }
      
      this.requestCount++;
      await sleep(randomDelay(100, 1000));
    }
  }
}

// Função principal de teste de carga
async function runLoadTest() {
  console.log('🚀 INICIANDO TESTE DE CARGA - Hub DeFiSats');
  console.log('=' .repeat(60));
  
  metrics.startTime = performance.now();
  
  try {
    // 1. Autenticar usuário de teste
    console.log('🔐 Autenticando usuário de teste...');
    const authResponse = await axios.post(`${CONFIG.BASE_URL}/api/auth/login`, {
      email: CONFIG.TEST_USER.email,
      password: CONFIG.TEST_USER.password
    });
    
    const token = authResponse.data.token;
    console.log('✅ Autenticação bem-sucedida');
    
    // 2. Criar simuladores de usuários
    const userSimulators = [];
    for (let i = 0; i < CONFIG.LOAD_TEST.CONCURRENT_USERS; i++) {
      userSimulators.push(new UserSimulator(`user-${i}`, token));
    }
    
    console.log(`👥 Criados ${CONFIG.LOAD_TEST.CONCURRENT_USERS} simuladores de usuário`);
    
    // 3. Executar testes em paralelo com ramp-up
    console.log('🔄 Iniciando ramp-up gradual...');
    const rampUpDelay = CONFIG.LOAD_TEST.RAMP_UP_SECONDS * 1000 / CONFIG.LOAD_TEST.CONCURRENT_USERS;
    
    const promises = userSimulators.map(async (simulator, index) => {
      // Ramp-up gradual
      await sleep(index * rampUpDelay);
      return simulator.simulateUserSession();
    });
    
    // 4. Aguardar conclusão
    await Promise.all(promises);
    
  } catch (error) {
    console.error('❌ Erro crítico no teste de carga:', error);
  } finally {
    metrics.endTime = performance.now();
    await generateReport();
  }
}

// Gerar relatório de performance
async function generateReport() {
  const duration = metrics.endTime - metrics.startTime;
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
  
  console.log('\n📊 RELATÓRIO DE PERFORMANCE');
  console.log('=' .repeat(60));
  console.log(`⏱️  Duração total: ${(duration / 1000).toFixed(2)}s`);
  console.log(`👥 Usuários simultâneos: ${CONFIG.LOAD_TEST.CONCURRENT_USERS}`);
  console.log(`📡 Total de requests: ${metrics.requests.total}`);
  console.log(`✅ Requests bem-sucedidos: ${metrics.requests.successful}`);
  console.log(`❌ Requests falharam: ${metrics.requests.failed}`);
  console.log(`📈 Taxa de sucesso: ${successRate.toFixed(2)}%`);
  console.log(`🚀 Requests por segundo: ${requestsPerSecond.toFixed(2)}`);
  console.log(`⏱️  Tempo de resposta médio: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`📊 P95 tempo de resposta: ${p95ResponseTime.toFixed(2)}ms`);
  
  console.log('\n🔌 WEBSOCKET METRICS');
  console.log('=' .repeat(30));
  console.log(`🔗 Conexões estabelecidas: ${metrics.websocket.connections}`);
  console.log(`📨 Mensagens recebidas: ${metrics.websocket.messages}`);
  console.log(`❌ Erros WebSocket: ${metrics.websocket.errors}`);
  
  if (metrics.websocket.latency.length > 0) {
    const avgLatency = metrics.websocket.latency.reduce((a, b) => a + b, 0) / metrics.websocket.latency.length;
    console.log(`⏱️  Latência média WebSocket: ${avgLatency.toFixed(2)}ms`);
  }
  
  console.log('\n❌ ERROS DETALHADOS');
  console.log('=' .repeat(30));
  if (metrics.errors.length > 0) {
    metrics.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.userId || 'Sistema'}: ${error.error}`);
    });
  } else {
    console.log('✅ Nenhum erro detectado!');
  }
  
  // Avaliação de performance
  console.log('\n🎯 AVALIAÇÃO DE PERFORMANCE');
  console.log('=' .repeat(40));
  
  if (successRate >= 95) {
    console.log('✅ EXCELENTE: Taxa de sucesso >= 95%');
  } else if (successRate >= 90) {
    console.log('🟡 BOM: Taxa de sucesso >= 90%');
  } else {
    console.log('❌ CRÍTICO: Taxa de sucesso < 90%');
  }
  
  if (avgResponseTime <= 500) {
    console.log('✅ EXCELENTE: Tempo de resposta <= 500ms');
  } else if (avgResponseTime <= 1000) {
    console.log('🟡 BOM: Tempo de resposta <= 1000ms');
  } else {
    console.log('❌ CRÍTICO: Tempo de resposta > 1000ms');
  }
  
  if (requestsPerSecond >= 10) {
    console.log('✅ EXCELENTE: Throughput >= 10 req/s');
  } else if (requestsPerSecond >= 5) {
    console.log('🟡 BOM: Throughput >= 5 req/s');
  } else {
    console.log('❌ CRÍTICO: Throughput < 5 req/s');
  }
  
  console.log('\n🏁 TESTE DE CARGA CONCLUÍDO!');
}

// Executar teste
if (require.main === module) {
  runLoadTest().catch(console.error);
}

module.exports = { runLoadTest, CONFIG };
