/**
 * LN Markets Endpoint Discovery Service
 * 
 * Descobre automaticamente os endpoints corretos da LN Markets
 */

import axios from 'axios';
import { logger } from '../utils/logger';

interface EndpointTest {
  url: string;
  method: string;
  success: boolean;
  latency: number;
  statusCode?: number;
  error?: string;
  response?: any;
}

interface DiscoveryResult {
  baseURL: string;
  workingEndpoints: EndpointTest[];
  failedEndpoints: EndpointTest[];
  recommendations: string[];
}

export class LNMarketsEndpointDiscoveryService {
  private baseURLs = [
    'https://api.lnmarkets.com',
    'https://api.lnmarkets.io',
    'https://lnmarkets.com/api',
    'https://lnmarkets.io/api',
    'https://api.lnmarkets.co',
    'https://lnmarkets.co/api'
  ];

  private endpoints = [
    { path: '/v1/status', method: 'GET', requiresAuth: false },
    { path: '/v1/market', method: 'GET', requiresAuth: false },
    { path: '/v1/user', method: 'GET', requiresAuth: true },
    { path: '/v1/positions', method: 'GET', requiresAuth: true },
    { path: '/v2/status', method: 'GET', requiresAuth: false },
    { path: '/v2/market', method: 'GET', requiresAuth: false },
    { path: '/v2/user', method: 'GET', requiresAuth: true },
    { path: '/status', method: 'GET', requiresAuth: false },
    { path: '/market', method: 'GET', requiresAuth: false },
    { path: '/user', method: 'GET', requiresAuth: true },
    { path: '/positions', method: 'GET', requiresAuth: true },
    { path: '/api/v1/status', method: 'GET', requiresAuth: false },
    { path: '/api/v1/market', method: 'GET', requiresAuth: false },
    { path: '/api/v1/user', method: 'GET', requiresAuth: true },
    { path: '/api/v2/status', method: 'GET', requiresAuth: false },
    { path: '/api/v2/market', method: 'GET', requiresAuth: false },
    { path: '/api/v2/user', method: 'GET', requiresAuth: true }
  ];

  /**
   * Descobrir endpoints funcionais
   */
  async discoverEndpoints(): Promise<DiscoveryResult> {
    logger.info('Starting LN Markets endpoint discovery');

    const workingEndpoints: EndpointTest[] = [];
    const failedEndpoints: EndpointTest[] = [];

    for (const baseURL of this.baseURLs) {
      logger.debug(`Testing base URL: ${baseURL}`);
      
      for (const endpoint of this.endpoints) {
        const fullURL = `${baseURL}${endpoint.path}`;
        const test = await this.testEndpoint(fullURL, endpoint.method, endpoint.requiresAuth);
        
        if (test.success) {
          workingEndpoints.push(test);
          logger.info(`✅ Working endpoint found: ${fullURL}`);
        } else {
          failedEndpoints.push(test);
          logger.debug(`❌ Failed endpoint: ${fullURL} - ${test.error}`);
        }
      }
    }

    const result = this.generateDiscoveryResult(workingEndpoints, failedEndpoints);
    
    logger.info('Endpoint discovery completed', {
      workingEndpoints: workingEndpoints.length,
      failedEndpoints: failedEndpoints.length,
      bestBaseURL: result.baseURL
    });

    return result;
  }

  /**
   * Testar um endpoint específico
   */
  private async testEndpoint(url: string, method: string, requiresAuth: boolean): Promise<EndpointTest> {
    const startTime = Date.now();
    
    try {
      const config: any = {
        method,
        url,
        timeout: 5000,
        headers: {
          'User-Agent': 'Hub-DefiSats-Discovery/1.0'
        }
      };

      // Se requer autenticação, usar credenciais de teste
      if (requiresAuth) {
        config.headers = {
          ...config.headers,
          'LN-ACCESS-KEY': 'test-key',
          'LN-ACCESS-SIGNATURE': 'test-signature',
          'LN-ACCESS-TIMESTAMP': Date.now().toString(),
          'LN-ACCESS-PASSPHRASE': 'test-passphrase'
        };
      }

      const response = await axios(config);
      
      return {
        url,
        method,
        success: true,
        latency: Date.now() - startTime,
        statusCode: response.status,
        response: response.data
      };
    } catch (error: any) {
      return {
        url,
        method,
        success: false,
        latency: Date.now() - startTime,
        statusCode: error.response?.status,
        error: error.message
      };
    }
  }

  /**
   * Gerar resultado da descoberta
   */
  private generateDiscoveryResult(workingEndpoints: EndpointTest[], failedEndpoints: EndpointTest[]): DiscoveryResult {
    const recommendations: string[] = [];
    
    if (workingEndpoints.length === 0) {
      recommendations.push('Nenhum endpoint funcional encontrado - LN Markets pode estar offline');
      recommendations.push('Verificar se a API mudou de domínio ou versão');
      recommendations.push('Considerar usar provedores alternativos temporariamente');
    } else {
      const bestBaseURL = this.findBestBaseURL(workingEndpoints);
      recommendations.push(`Usar base URL: ${bestBaseURL}`);
      recommendations.push(`Endpoints funcionais encontrados: ${workingEndpoints.length}`);
      
      if (workingEndpoints.length < 5) {
        recommendations.push('Poucos endpoints funcionais - implementar fallback robusto');
      }
    }

    return {
      baseURL: workingEndpoints.length > 0 ? this.findBestBaseURL(workingEndpoints) : 'none',
      workingEndpoints,
      failedEndpoints,
      recommendations
    };
  }

  /**
   * Encontrar a melhor base URL
   */
  private findBestBaseURL(workingEndpoints: EndpointTest[]): string {
    const baseURLCounts: Record<string, number> = {};
    
    workingEndpoints.forEach(endpoint => {
      const baseURL = endpoint.url.split('/').slice(0, 3).join('/');
      baseURLCounts[baseURL] = (baseURLCounts[baseURL] || 0) + 1;
    });

    return Object.entries(baseURLCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
  }

  /**
   * Testar conectividade básica
   */
  async testBasicConnectivity(): Promise<{ success: boolean; latency: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      // Testar conectividade básica com diferentes URLs
      const testURLs = [
        'https://api.lnmarkets.com',
        'https://lnmarkets.com',
        'https://api.lnmarkets.io',
        'https://lnmarkets.io'
      ];

      for (const url of testURLs) {
        try {
          await axios.get(url, { timeout: 5000 });
          return {
            success: true,
            latency: Date.now() - startTime
          };
        } catch (error: any) {
          // Continuar testando outras URLs
        }
      }

      return {
        success: false,
        latency: Date.now() - startTime,
        error: 'All test URLs failed'
      };
    } catch (error: any) {
      return {
        success: false,
        latency: Date.now() - startTime,
        error: error.message
      };
    }
  }

  /**
   * Verificar se LN Markets está online
   */
  async checkLNMarketsStatus(): Promise<{
    online: boolean;
    latency: number;
    error?: string;
    details: Record<string, any>;
  }> {
    const startTime = Date.now();
    
    try {
      // Tentar diferentes formas de verificar se está online
      const checks = [
        this.checkMainWebsite(),
        this.checkAPIStatus(),
        this.checkDNSResolution()
      ];

      const results = await Promise.allSettled(checks);
      const successfulChecks = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      
      return {
        online: successfulChecks > 0,
        latency: Date.now() - startTime,
        details: {
          successfulChecks,
          totalChecks: checks.length,
          results: results.map(r => r.status === 'fulfilled' ? r.value : { error: 'Failed' })
        }
      };
    } catch (error: any) {
      return {
        online: false,
        latency: Date.now() - startTime,
        error: error.message,
        details: {}
      };
    }
  }

  /**
   * Verificar site principal
   */
  private async checkMainWebsite(): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.get('https://lnmarkets.com', { timeout: 5000 });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar status da API
   */
  private async checkAPIStatus(): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.get('https://api.lnmarkets.com', { timeout: 5000 });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar resolução DNS
   */
  private async checkDNSResolution(): Promise<{ success: boolean; error?: string }> {
    try {
      // Simular verificação DNS
      await axios.get('https://api.lnmarkets.com/v1/status', { timeout: 3000 });
      return { success: true };
    } catch (error: any) {
      // DNS pode estar funcionando mesmo se o endpoint não existir
      if (error.code === 'ENOTFOUND') {
        return { success: false, error: 'DNS resolution failed' };
      }
      return { success: true }; // DNS funciona, endpoint pode não existir
    }
  }
}

export const lnMarketsEndpointDiscoveryService = new LNMarketsEndpointDiscoveryService();
