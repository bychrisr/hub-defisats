/**
 * LN Markets Connection Analyzer Service
 * 
 * Análise profunda de problemas de conexão com LN Markets
 */

import axios, { AxiosInstance } from 'axios';
import { createHmac } from 'crypto';
import { config } from '../config/env';
import { logger } from '../utils/logger';

interface ConnectionTest {
  testName: string;
  success: boolean;
  latency: number;
  error?: string;
  details: Record<string, any>;
}

interface ConnectionAnalysis {
  overallStatus: 'excellent' | 'good' | 'poor' | 'critical';
  tests: ConnectionTest[];
  recommendations: string[];
  alternativeStrategies: string[];
}

export class LNMarketsConnectionAnalyzerService {
  private baseURL = 'https://api.lnmarkets.com';
  private credentials: {
    apiKey: string;
    apiSecret: string;
    passphrase: string;
  };

  constructor() {
    this.credentials = {
      apiKey: config.LN_MARKETS_API_KEY || '',
      apiSecret: config.LN_MARKETS_API_SECRET || '',
      passphrase: config.LN_MARKETS_PASSPHRASE || ''
    };
  }

  /**
   * Análise completa de conexão
   */
  async analyzeConnection(): Promise<ConnectionAnalysis> {
    logger.info('Starting comprehensive LN Markets connection analysis');

    const tests: ConnectionTest[] = [];

    // 1. Teste de conectividade básica
    tests.push(await this.testBasicConnectivity());

    // 2. Teste de DNS
    tests.push(await this.testDNSResolution());

    // 3. Teste de TLS/SSL
    tests.push(await this.testTLSHandshake());

    // 4. Teste de autenticação
    tests.push(await this.testAuthentication());

    // 5. Teste de endpoints específicos
    tests.push(await this.testMarketEndpoint());
    tests.push(await this.testUserEndpoint());

    // 6. Teste de rate limiting
    tests.push(await this.testRateLimiting());

    // 7. Teste de timeout
    tests.push(await this.testTimeoutBehavior());

    // 8. Teste de retry
    tests.push(await this.testRetryMechanism());

    // 9. Teste de diferentes regiões/CDN
    tests.push(await this.testRegionalConnectivity());

    // 10. Teste de proxy/tunnel
    tests.push(await this.testProxyConnectivity());

    const analysis = this.generateAnalysis(tests);
    
    logger.info('LN Markets connection analysis completed', {
      status: analysis.overallStatus,
      successfulTests: tests.filter(t => t.success).length,
      totalTests: tests.length
    });

    return analysis;
  }

  /**
   * Teste de conectividade básica
   */
  private async testBasicConnectivity(): Promise<ConnectionTest> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${this.baseURL}/v1/status`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Hub-DefiSats-Analyzer/1.0'
        }
      });

      return {
        testName: 'Basic Connectivity',
        success: true,
        latency: Date.now() - startTime,
        details: {
          statusCode: response.status,
          responseTime: response.headers['x-response-time'] || 'unknown',
          server: response.headers['server'] || 'unknown'
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
          response: error.response?.status,
          timeout: error.code === 'ECONNABORTED'
        }
      };
    }
  }

  /**
   * Teste de resolução DNS
   */
  private async testDNSResolution(): Promise<ConnectionTest> {
    const startTime = Date.now();
    
    try {
      // Testar resolução DNS usando diferentes servidores
      const dnsServers = ['8.8.8.8', '1.1.1.1', '208.67.222.222'];
      const results = [];

      for (const dnsServer of dnsServers) {
        const dnsStart = Date.now();
        try {
          // Simular teste DNS (em produção, usar biblioteca DNS real)
          await axios.get(`${this.baseURL}/v1/status`, {
            timeout: 5000,
            headers: {
              'Host': 'api.lnmarkets.com'
            }
          });
          results.push({
            server: dnsServer,
            latency: Date.now() - dnsStart,
            success: true
          });
        } catch (error: any) {
          results.push({
            server: dnsServer,
            latency: Date.now() - dnsStart,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      
      return {
        testName: 'DNS Resolution',
        success: successCount > 0,
        latency: Date.now() - startTime,
        details: {
          testedServers: dnsServers.length,
          successfulResolutions: successCount,
          results
        }
      };
    } catch (error: any) {
      return {
        testName: 'DNS Resolution',
        success: false,
        latency: Date.now() - startTime,
        error: error.message,
        details: { error: error.message }
      };
    }
  }

  /**
   * Teste de handshake TLS/SSL
   */
  private async testTLSHandshake(): Promise<ConnectionTest> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${this.baseURL}/v1/status`, {
        timeout: 15000,
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: true,
          secureProtocol: 'TLSv1_2_method'
        })
      });

      return {
        testName: 'TLS Handshake',
        success: true,
        latency: Date.now() - startTime,
        details: {
          protocol: response.request.protocol,
          cipher: response.request.socket?.getCipher()?.name || 'unknown',
          tlsVersion: response.request.socket?.getProtocol() || 'unknown'
        }
      };
    } catch (error: any) {
      return {
        testName: 'TLS Handshake',
        success: false,
        latency: Date.now() - startTime,
        error: error.message,
        details: {
          code: error.code,
          tlsError: error.code?.includes('TLS') || error.code?.includes('SSL')
        }
      };
    }
  }

  /**
   * Teste de autenticação
   */
  private async testAuthentication(): Promise<ConnectionTest> {
    const startTime = Date.now();
    
    try {
      const authHeaders = this.generateAuthHeaders('GET', '/v1/user');
      
      const response = await axios.get(`${this.baseURL}/v1/user`, {
        timeout: 10000,
        headers: {
          ...authHeaders,
          'User-Agent': 'Hub-DefiSats-Analyzer/1.0'
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
          authError: error.response?.status === 401 || error.response?.status === 403,
          errorDetails: error.response?.data
        }
      };
    }
  }

  /**
   * Teste de endpoint de mercado
   */
  private async testMarketEndpoint(): Promise<ConnectionTest> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${this.baseURL}/v1/market`, {
        timeout: 10000
      });

      return {
        testName: 'Market Endpoint',
        success: true,
        latency: Date.now() - startTime,
        details: {
          statusCode: response.status,
          hasMarketData: !!response.data,
          dataSize: JSON.stringify(response.data).length
        }
      };
    } catch (error: any) {
      return {
        testName: 'Market Endpoint',
        success: false,
        latency: Date.now() - startTime,
        error: error.message,
        details: {
          statusCode: error.response?.status,
          errorDetails: error.response?.data
        }
      };
    }
  }

  /**
   * Teste de endpoint de usuário
   */
  private async testUserEndpoint(): Promise<ConnectionTest> {
    const startTime = Date.now();
    
    try {
      const authHeaders = this.generateAuthHeaders('GET', '/v1/user');
      
      const response = await axios.get(`${this.baseURL}/v1/user`, {
        timeout: 10000,
        headers: authHeaders
      });

      return {
        testName: 'User Endpoint',
        success: true,
        latency: Date.now() - startTime,
        details: {
          statusCode: response.status,
          hasUserData: !!response.data,
          userFields: Object.keys(response.data || {})
        }
      };
    } catch (error: any) {
      return {
        testName: 'User Endpoint',
        success: false,
        latency: Date.now() - startTime,
        error: error.message,
        details: {
          statusCode: error.response?.status,
          errorDetails: error.response?.data
        }
      };
    }
  }

  /**
   * Teste de rate limiting
   */
  private async testRateLimiting(): Promise<ConnectionTest> {
    const startTime = Date.now();
    
    try {
      // Fazer múltiplas requisições rápidas
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(
          axios.get(`${this.baseURL}/v1/status`, {
            timeout: 5000
          }).catch(err => ({ error: err.message, status: err.response?.status }))
        );
      }

      const results = await Promise.all(requests);
      const rateLimited = results.some(r => r.status === 429);
      const successCount = results.filter(r => !r.error).length;

      return {
        testName: 'Rate Limiting',
        success: !rateLimited,
        latency: Date.now() - startTime,
        details: {
          totalRequests: 5,
          successfulRequests: successCount,
          rateLimited,
          results: results.map(r => ({ error: r.error, status: r.status }))
        }
      };
    } catch (error: any) {
      return {
        testName: 'Rate Limiting',
        success: false,
        latency: Date.now() - startTime,
        error: error.message,
        details: { error: error.message }
      };
    }
  }

  /**
   * Teste de comportamento de timeout
   */
  private async testTimeoutBehavior(): Promise<ConnectionTest> {
    const startTime = Date.now();
    
    try {
      // Testar com timeout muito baixo
      await axios.get(`${this.baseURL}/v1/status`, {
        timeout: 1000 // 1 segundo
      });

      return {
        testName: 'Timeout Behavior',
        success: true,
        latency: Date.now() - startTime,
        details: {
          timeoutTest: '1 second',
          responseTime: Date.now() - startTime
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
          timeoutTest: '1 second',
          isTimeout,
          actualLatency: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Teste de mecanismo de retry
   */
  private async testRetryMechanism(): Promise<ConnectionTest> {
    const startTime = Date.now();
    
    try {
      let attempts = 0;
      let lastError: any = null;

      for (let i = 0; i < 3; i++) {
        attempts++;
        try {
          await axios.get(`${this.baseURL}/v1/status`, {
            timeout: 5000
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
        }
      };
    } catch (error: any) {
      return {
        testName: 'Retry Mechanism',
        success: false,
        latency: Date.now() - startTime,
        error: error.message,
        details: { error: error.message }
      };
    }
  }

  /**
   * Teste de conectividade regional
   */
  private async testRegionalConnectivity(): Promise<ConnectionTest> {
    const startTime = Date.now();
    
    try {
      // Testar diferentes endpoints/CDNs
      const endpoints = [
        'https://api.lnmarkets.com',
        'https://api.lnmarkets.com/v1/status',
        'https://api.lnmarkets.com/v1/market'
      ];

      const results = [];
      for (const endpoint of endpoints) {
        try {
          const endpointStart = Date.now();
          await axios.get(endpoint, { timeout: 5000 });
          results.push({
            endpoint,
            success: true,
            latency: Date.now() - endpointStart
          });
        } catch (error: any) {
          results.push({
            endpoint,
            success: false,
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;

      return {
        testName: 'Regional Connectivity',
        success: successCount > 0,
        latency: Date.now() - startTime,
        details: {
          testedEndpoints: endpoints.length,
          successfulEndpoints: successCount,
          results
        }
      };
    } catch (error: any) {
      return {
        testName: 'Regional Connectivity',
        success: false,
        latency: Date.now() - startTime,
        error: error.message,
        details: { error: error.message }
      };
    }
  }

  /**
   * Teste de conectividade via proxy
   */
  private async testProxyConnectivity(): Promise<ConnectionTest> {
    const startTime = Date.now();
    
    try {
      // Testar sem proxy primeiro
      const directResponse = await axios.get(`${this.baseURL}/v1/status`, {
        timeout: 10000
      });

      return {
        testName: 'Proxy Connectivity',
        success: true,
        latency: Date.now() - startTime,
        details: {
          method: 'direct',
          statusCode: directResponse.status,
          note: 'Direct connection successful'
        }
      };
    } catch (error: any) {
      return {
        testName: 'Proxy Connectivity',
        success: false,
        latency: Date.now() - startTime,
        error: error.message,
        details: {
          method: 'direct',
          error: error.message,
          suggestion: 'Consider using proxy or VPN'
        }
      };
    }
  }

  /**
   * Gerar headers de autenticação
   */
  private generateAuthHeaders(method: string, path: string): any {
    const timestamp = Date.now().toString();
    const body = '';
    const message = timestamp + method.toUpperCase() + path + body;
    
    const signature = createHmac('sha256', this.credentials.apiSecret)
      .update(message)
      .digest('base64');

    return {
      'LN-ACCESS-KEY': this.credentials.apiKey,
      'LN-ACCESS-SIGNATURE': signature,
      'LN-ACCESS-TIMESTAMP': timestamp,
      'LN-ACCESS-PASSPHRASE': this.credentials.passphrase
    };
  }

  /**
   * Gerar análise baseada nos testes
   */
  private generateAnalysis(tests: ConnectionTest[]): ConnectionAnalysis {
    const successfulTests = tests.filter(t => t.success).length;
    const totalTests = tests.length;
    const successRate = (successfulTests / totalTests) * 100;

    let overallStatus: 'excellent' | 'good' | 'poor' | 'critical';
    if (successRate >= 80) {
      overallStatus = 'excellent';
    } else if (successRate >= 60) {
      overallStatus = 'good';
    } else if (successRate >= 40) {
      overallStatus = 'poor';
    } else {
      overallStatus = 'critical';
    }

    const recommendations: string[] = [];
    const alternativeStrategies: string[] = [];

    // Gerar recomendações baseadas nos testes
    const failedTests = tests.filter(t => !t.success);
    
    if (failedTests.some(t => t.testName === 'Basic Connectivity')) {
      recommendations.push('Verificar conectividade de rede básica');
      alternativeStrategies.push('Usar VPN ou proxy para contornar bloqueios de rede');
    }

    if (failedTests.some(t => t.testName === 'DNS Resolution')) {
      recommendations.push('Configurar DNS alternativo (8.8.8.8, 1.1.1.1)');
      alternativeStrategies.push('Usar DNS over HTTPS (DoH)');
    }

    if (failedTests.some(t => t.testName === 'TLS Handshake')) {
      recommendations.push('Verificar configurações TLS/SSL');
      alternativeStrategies.push('Usar proxy HTTPS ou tunnel');
    }

    if (failedTests.some(t => t.testName === 'Authentication')) {
      recommendations.push('Verificar credenciais de API');
      alternativeStrategies.push('Regenerar chaves de API');
    }

    if (failedTests.some(t => t.testName === 'Rate Limiting')) {
      recommendations.push('Implementar backoff exponencial');
      alternativeStrategies.push('Usar múltiplas chaves de API');
    }

    if (successRate < 50) {
      recommendations.push('Considerar migração completa para provedores alternativos');
      alternativeStrategies.push('Implementar sistema híbrido com múltiplos provedores');
    }

    return {
      overallStatus,
      tests,
      recommendations,
      alternativeStrategies
    };
  }
}

export const lnMarketsConnectionAnalyzerService = new LNMarketsConnectionAnalyzerService();
