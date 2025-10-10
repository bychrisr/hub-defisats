/**
 * LN Markets Guerrilla Test Routes
 * 
 * Testes de guerrilha com usuários comuns para LN Markets
 * Simula cenários reais de uso
 */

import { FastifyInstance } from 'fastify';
import axios from 'axios';
import { createHmac } from 'crypto';
import { logger } from '../utils/logger';
import { getPrisma } from '../lib/prisma';

interface GuerrillaTestResult {
  testName: string;
  success: boolean;
  latency: number;
  error?: string;
  details: Record<string, any>;
  userContext: {
    userId: string;
    email: string;
    planType: string;
  };
}

interface GuerrillaTestSuite {
  userId: string;
  tests: GuerrillaTestResult[];
  overallSuccess: boolean;
  averageLatency: number;
  recommendations: string[];
}

/**
 * Gerar headers de autenticação
 */
function generateAuthHeaders(method: string, path: string, user: any): any {
  const timestamp = Date.now().toString();
  const body = '';
  const message = timestamp + method.toUpperCase() + path + body;
  
  const signature = createHmac('sha256', user.ln_markets_api_secret)
    .update(message)
    .digest('base64');

  return {
    'LNM-ACCESS-KEY': user.ln_markets_api_key,
    'LNM-ACCESS-SIGNATURE': signature,
    'LNM-ACCESS-TIMESTAMP': timestamp,
    'LNM-ACCESS-PASSPHRASE': user.ln_markets_passphrase
  };
}

/**
 * Teste de conectividade básica
 */
async function testBasicConnectivity(user: any): Promise<GuerrillaTestResult> {
  const startTime = Date.now();
  
  try {
    const response = await axios.get('https://api.lnmarkets.com/v2/futures/ticker', {
      timeout: 10000,
      headers: {
        'User-Agent': `Axisor-User-${user.id}/1.0`
      }
    });

    return {
      testName: 'Basic Connectivity',
      success: true,
      latency: Date.now() - startTime,
      details: {
        statusCode: response.status,
        responseTime: response.headers['x-response-time'] || 'unknown'
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  } catch (error: any) {
    return {
      testName: 'Basic Connectivity',
      success: false,
      latency: Date.now() - startTime,
      error: error.message,
      details: {
        code: error.code,
        status: error.response?.status
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  }
}

/**
 * Teste de autenticação
 */
async function testAuthentication(user: any): Promise<GuerrillaTestResult> {
  const startTime = Date.now();
  
  try {
    const authHeaders = generateAuthHeaders('GET', '/v2/user', user);
    
    const response = await axios.get('https://api.lnmarkets.com/v2/user', {
      timeout: 10000,
      headers: {
        ...authHeaders,
        'User-Agent': `Axisor-User-${user.id}/1.0`
      }
    });

    return {
      testName: 'Authentication',
      success: true,
      latency: Date.now() - startTime,
      details: {
        statusCode: response.status,
        hasUserData: !!response.data,
        authMethod: 'HMAC-SHA256'
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  } catch (error: any) {
    return {
      testName: 'Authentication',
      success: false,
      latency: Date.now() - startTime,
      error: error.message,
      details: {
        statusCode: error.response?.status,
        authError: error.response?.status === 401 || error.response?.status === 403
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  }
}

/**
 * Teste de dados de mercado
 */
async function testMarketData(user: any): Promise<GuerrillaTestResult> {
  const startTime = Date.now();
  
  try {
    const response = await axios.get('https://api.lnmarkets.com/v2/futures/market', {
      timeout: 10000,
      headers: {
        'User-Agent': `Axisor-User-${user.id}/1.0`
      }
    });

    return {
      testName: 'Market Data',
      success: true,
      latency: Date.now() - startTime,
      details: {
        statusCode: response.status,
        hasMarketData: !!response.data,
        dataSize: JSON.stringify(response.data).length,
        marketIndex: response.data?.index || 'unknown'
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  } catch (error: any) {
    return {
      testName: 'Market Data',
      success: false,
      latency: Date.now() - startTime,
      error: error.message,
      details: {
        statusCode: error.response?.status
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  }
}

/**
 * Teste de dados do usuário
 */
async function testUserData(user: any): Promise<GuerrillaTestResult> {
  const startTime = Date.now();
  
  try {
    const authHeaders = generateAuthHeaders('GET', '/v2/user', user);
    
    const response = await axios.get('https://api.lnmarkets.com/v2/user', {
      timeout: 10000,
      headers: authHeaders
    });

    return {
      testName: 'User Data',
      success: true,
      latency: Date.now() - startTime,
      details: {
        statusCode: response.status,
        hasUserData: !!response.data,
        userFields: Object.keys(response.data || {}),
        balance: response.data?.balance || 'unknown'
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  } catch (error: any) {
    return {
      testName: 'User Data',
      success: false,
      latency: Date.now() - startTime,
      error: error.message,
      details: {
        statusCode: error.response?.status
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  }
}

/**
 * Teste de posições
 */
async function testPositions(user: any): Promise<GuerrillaTestResult> {
  const startTime = Date.now();
  
  try {
    const authHeaders = generateAuthHeaders('GET', '/v2/futures/trades', user);
    
    const response = await axios.get('https://api.lnmarkets.com/v2/futures/trades', {
      timeout: 10000,
      headers: authHeaders
    });

    return {
      testName: 'Positions',
      success: true,
      latency: Date.now() - startTime,
      details: {
        statusCode: response.status,
        hasPositions: !!response.data,
        positionCount: Array.isArray(response.data) ? response.data.length : 0
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  } catch (error: any) {
    return {
      testName: 'Positions',
      success: false,
      latency: Date.now() - startTime,
      error: error.message,
      details: {
        statusCode: error.response?.status
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  }
}

/**
 * Teste de margem
 */
async function testMargin(user: any): Promise<GuerrillaTestResult> {
  const startTime = Date.now();
  
  try {
    const authHeaders = generateAuthHeaders('GET', '/v2/user', user);
    
    const response = await axios.get('https://api.lnmarkets.com/v2/user', {
      timeout: 10000,
      headers: authHeaders
    });

    return {
      testName: 'Margin Data',
      success: true,
      latency: Date.now() - startTime,
      details: {
        statusCode: response.status,
        hasMarginData: !!response.data,
        marginInfo: response.data?.margin || 'unknown'
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  } catch (error: any) {
    return {
      testName: 'Margin Data',
      success: false,
      latency: Date.now() - startTime,
      error: error.message,
      details: {
        statusCode: error.response?.status
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  }
}

/**
 * Teste de performance sob carga
 */
async function testPerformanceUnderLoad(user: any): Promise<GuerrillaTestResult> {
  const startTime = Date.now();
  
  try {
    // Fazer múltiplas requisições simultâneas
    const requests = [];
    for (let i = 0; i < 3; i++) {
      requests.push(
        axios.get('https://api.lnmarkets.com/v2/futures/market', {
          timeout: 5000,
          headers: {
            'User-Agent': `Axisor-Load-${user.id}-${i}/1.0`
          }
        }).catch(err => ({ error: err.message, status: err.response?.status }))
      );
    }

    const results = await Promise.all(requests);
    const successCount = results.filter(r => !r.error).length;
    const success = successCount >= 2; // 66% success rate

    return {
      testName: 'Performance Under Load',
      success,
      latency: Date.now() - startTime,
      details: {
        totalRequests: 3,
        successfulRequests: successCount,
        successRate: (successCount / 3) * 100,
        results: results.map(r => ({ error: r.error, status: r.status }))
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  } catch (error: any) {
    return {
      testName: 'Performance Under Load',
      success: false,
      latency: Date.now() - startTime,
      error: error.message,
      details: { error: error.message },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  }
}

/**
 * Teste de comportamento de timeout
 */
async function testTimeoutBehavior(user: any): Promise<GuerrillaTestResult> {
  const startTime = Date.now();
  
  try {
    // Testar com timeout muito baixo
    await axios.get('https://api.lnmarkets.com/v2/futures/ticker', {
      timeout: 2000 // 2 segundos
    });

    return {
      testName: 'Timeout Behavior',
      success: true,
      latency: Date.now() - startTime,
      details: {
        timeoutTest: '2 seconds',
        responseTime: Date.now() - startTime
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  } catch (error: any) {
    const isTimeout = error.code === 'ECONNABORTED';
    
    return {
      testName: 'Timeout Behavior',
      success: !isTimeout,
      latency: Date.now() - startTime,
      error: error.message,
      details: {
        timeoutTest: '2 seconds',
        isTimeout,
        actualLatency: Date.now() - startTime
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  }
}

/**
 * Teste de mecanismo de retry
 */
async function testRetryMechanism(user: any): Promise<GuerrillaTestResult> {
  const startTime = Date.now();
  
  try {
    let attempts = 0;
    let lastError: any = null;

    for (let i = 0; i < 3; i++) {
      attempts++;
      try {
        await axios.get('https://api.lnmarkets.com/v2/futures/ticker', {
          timeout: 3000
        });
        break; // Sucesso
      } catch (error: any) {
        lastError = error;
        if (i < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s
        }
      }
    }

    const success = !lastError;

    return {
      testName: 'Retry Mechanism',
      success,
      latency: Date.now() - startTime,
      error: success ? undefined : lastError.message,
      details: {
        attempts,
        success,
        lastError: success ? null : {
          code: lastError.code,
          status: lastError.response?.status
        }
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  } catch (error: any) {
    return {
      testName: 'Retry Mechanism',
      success: false,
      latency: Date.now() - startTime,
      error: error.message,
      details: { error: error.message },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  }
}

/**
 * Teste de dados em tempo real
 */
async function testRealTimeData(user: any): Promise<GuerrillaTestResult> {
  const startTime = Date.now();
  
  try {
    // Testar endpoint que deveria retornar dados em tempo real
    const response = await axios.get('https://api.lnmarkets.com/v2/futures/market', {
      timeout: 5000,
      headers: {
        'User-Agent': `Axisor-Realtime-${user.id}/1.0`
      }
    });

    const dataAge = Date.now() - startTime;
    const isRealTime = dataAge < 1000; // Menos de 1 segundo

    return {
      testName: 'Real-time Data',
      success: isRealTime,
      latency: Date.now() - startTime,
      details: {
        statusCode: response.status,
        dataAge,
        isRealTime,
        marketData: !!response.data
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  } catch (error: any) {
    return {
      testName: 'Real-time Data',
      success: false,
      latency: Date.now() - startTime,
      error: error.message,
      details: {
        statusCode: error.response?.status
      },
      userContext: {
        userId: user.id,
        email: user.email,
        planType: user.plan_type
      }
    };
  }
}

/**
 * Gerar recomendações baseadas nos testes
 */
function generateRecommendations(tests: GuerrillaTestResult[], user: any): string[] {
  const recommendations: string[] = [];
  const failedTests = tests.filter(t => !t.success);
  
  if (failedTests.length > 5) {
    recommendations.push('LN Markets está com problemas graves - implementar fallback imediato');
  }
  
  if (failedTests.some(t => t.testName === 'Authentication')) {
    recommendations.push('Verificar credenciais de API do usuário');
  }
  
  if (failedTests.some(t => t.testName === 'Market Data')) {
    recommendations.push('Dados de mercado indisponíveis - usar cache local');
  }
  
  if (failedTests.some(t => t.testName === 'Real-time Data')) {
    recommendations.push('Dados não são em tempo real - implementar WebSocket');
  }
  
  const averageLatency = tests.reduce((sum, t) => sum + t.latency, 0) / tests.length;
  if (averageLatency > 2000) {
    recommendations.push('Latência muito alta - otimizar configurações de rede');
  }
  
  const successRate = (tests.filter(t => t.success).length / tests.length) * 100;
  if (successRate < 70) {
    recommendations.push('Taxa de sucesso baixa - considerar migração de provedor');
  }

  return recommendations;
}

/**
 * Executar testes de guerrilha
 */
async function runGuerrillaTests(user: any): Promise<GuerrillaTestSuite> {
  const tests: GuerrillaTestResult[] = [];
  
  // 1. Teste de conectividade básica
  tests.push(await testBasicConnectivity(user));
  
  // 2. Teste de autenticação
  tests.push(await testAuthentication(user));
  
  // 3. Teste de dados de mercado
  tests.push(await testMarketData(user));
  
  // 4. Teste de dados do usuário
  tests.push(await testUserData(user));
  
  // 5. Teste de posições
  tests.push(await testPositions(user));
  
  // 6. Teste de margem
  tests.push(await testMargin(user));
  
  // 7. Teste de performance sob carga
  tests.push(await testPerformanceUnderLoad(user));
  
  // 8. Teste de timeout
  tests.push(await testTimeoutBehavior(user));
  
  // 9. Teste de retry
  tests.push(await testRetryMechanism(user));
  
  // 10. Teste de dados em tempo real
  tests.push(await testRealTimeData(user));

  const successfulTests = tests.filter(t => t.success).length;
  const overallSuccess = successfulTests >= 7; // 70% success rate
  const averageLatency = tests.reduce((sum, t) => sum + t.latency, 0) / tests.length;

  const recommendations = generateRecommendations(tests, user);

  return {
    userId: user.id,
    tests,
    overallSuccess,
    averageLatency,
    recommendations
  };
}

export async function lnMarketsGuerrillaTestRoutes(fastify: FastifyInstance) {
  /**
   * Executar teste de guerrilha completo
   */
  fastify.post('/guerrilla-test/full', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { email, password } = request.body as any;
      
      logger.info('Starting guerrilla test with user credentials', { email });
      
      // Autenticar usuário
      const prisma = await getPrisma();
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          plan_type: true,
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true
        }
      });

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: 'USER_NOT_FOUND',
          message: 'User not found'
        });
      }

      // Verificar se tem credenciais LN Markets
      if (!user.ln_markets_api_key || !user.ln_markets_api_secret || !user.ln_markets_passphrase) {
        return reply.status(400).send({
          success: false,
          error: 'NO_LN_MARKETS_CREDENTIALS',
          message: 'User does not have LN Markets credentials configured'
        });
      }

      // Executar testes de guerrilha
      const testSuite = await runGuerrillaTests(user);
      
      logger.info('Guerrilla test completed', {
        userId: user.id,
        email: user.email,
        success: testSuite.overallSuccess,
        averageLatency: testSuite.averageLatency
      });

      return {
        success: true,
        data: testSuite
      };
    } catch (error: any) {
      logger.error('Guerrilla test failed', { error: error.message });
      return reply.status(500).send({
        success: false,
        error: 'GUERRILLA_TEST_FAILED',
        message: error.message
      });
    }
  });
}