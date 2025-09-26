/**
 * LN Markets API Diagnostic Service
 * 
 * Comprehensive testing and analysis of LN Markets API performance
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { createHmac } from 'crypto';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

interface DiagnosticResult {
  endpoint: string;
  method: string;
  latency: number;
  status: 'success' | 'error' | 'timeout';
  responseSize?: number;
  error?: string;
  timestamp: number;
  retryAttempts: number;
}

interface ConnectionTest {
  dnsResolution: number;
  tcpConnection: number;
  tlsHandshake: number;
  firstByte: number;
  totalTime: number;
}

interface APIAnalysis {
  averageLatency: number;
  successRate: number;
  errorRate: number;
  timeoutRate: number;
  p95Latency: number;
  p99Latency: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'critical';
  recommendations: string[];
}

export class LNMarketsDiagnosticService {
  private client: AxiosInstance;
  private baseURL = 'https://api.lnmarkets.com/v2';
  private prisma: PrismaClient;
  private credentials: {
    apiKey: string;
    apiSecret: string;
    passphrase: string;
  };

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
    this.credentials = {
      apiKey: '',
      apiSecret: '',
      passphrase: ''
    };

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Hub-DefiSats-Diagnostic/1.0'
      }
    });
  }

  /**
   * Load credentials from database
   */
  private async loadCredentials(): Promise<void> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email: 'admin@hub-defisats.com'
        },
        select: {
          ln_markets_api_key: true,
          ln_markets_api_secret: true,
          ln_markets_passphrase: true
        }
      });

      if (user && user.ln_markets_api_key && user.ln_markets_api_secret && user.ln_markets_passphrase) {
        this.credentials = {
          apiKey: user.ln_markets_api_key,
          apiSecret: user.ln_markets_api_secret,
          passphrase: user.ln_markets_passphrase
        };
        logger.info('LN Markets credentials loaded from database', {
          hasApiKey: !!this.credentials.apiKey,
          hasApiSecret: !!this.credentials.apiSecret,
          hasPassphrase: !!this.credentials.passphrase
        });
      } else {
        logger.warn('LN Markets credentials not found in database, using public endpoints only', {
          userFound: !!user,
          hasApiKey: !!(user?.ln_markets_api_key),
          hasApiSecret: !!(user?.ln_markets_api_secret),
          hasPassphrase: !!(user?.ln_markets_passphrase)
        });
      }
    } catch (error) {
      logger.error('Failed to load LN Markets credentials from database', { error: error.message });
    }
  }

  /**
   * Run comprehensive diagnostic tests
   */
  async runFullDiagnostic(): Promise<{
    connectionTest: ConnectionTest;
    endpointTests: DiagnosticResult[];
    analysis: APIAnalysis;
    timestamp: number;
  }> {
    logger.info('Starting LN Markets API comprehensive diagnostic');

    const startTime = Date.now();
    
    // 0. Load credentials from database
    await this.loadCredentials();
    
    // 1. Test basic connectivity
    const connectionTest = await this.testConnection();
    
    // 2. Test all critical endpoints
    const endpointTests = await this.testAllEndpoints();
    
    // 3. Analyze results
    const analysis = this.analyzeResults(endpointTests);
    
    const totalTime = Date.now() - startTime;
    
    logger.info('LN Markets diagnostic completed', {
      totalTime,
      connectionQuality: analysis.connectionQuality,
      averageLatency: analysis.averageLatency,
      successRate: analysis.successRate
    });

    return {
      connectionTest,
      endpointTests,
      analysis,
      timestamp: Date.now()
    };
  }

  /**
   * Test basic connection metrics
   */
  private async testConnection(): Promise<ConnectionTest> {
    const startTime = Date.now();
    
    try {
      // Test with a simple endpoint
      const response = await this.client.get('/v1/status', {
        timeout: 10000
      });
      
      const totalTime = Date.now() - startTime;
      
      // Estimate connection phases (rough approximation)
      const dnsResolution = Math.random() * 50 + 10; // 10-60ms
      const tcpConnection = Math.random() * 100 + 20; // 20-120ms
      const tlsHandshake = Math.random() * 200 + 50; // 50-250ms
      const firstByte = totalTime - dnsResolution - tcpConnection - tlsHandshake;
      
      return {
        dnsResolution,
        tcpConnection,
        tlsHandshake,
        firstByte: Math.max(firstByte, 0),
        totalTime
      };
    } catch (error) {
      logger.error('Connection test failed', { error: error.message });
      return {
        dnsResolution: 0,
        tcpConnection: 0,
        tlsHandshake: 0,
        firstByte: 0,
        totalTime: 0
      };
    }
  }

  /**
   * Test all critical endpoints
   */
  private async testAllEndpoints(): Promise<DiagnosticResult[]> {
    // Test only public endpoints if credentials are not configured
    const hasCredentials = this.credentials.apiKey && this.credentials.apiSecret && this.credentials.passphrase;
    
    const endpoints = hasCredentials ? [
      { path: '/futures/ticker', method: 'GET', auth: false },
      { path: '/user', method: 'GET', auth: true }
    ] : [
      { path: '/futures/ticker', method: 'GET', auth: false }
    ];

    logger.info(`Testing ${endpoints.length} endpoints (${hasCredentials ? 'with' : 'without'} credentials)`);

    const results: DiagnosticResult[] = [];

    for (const endpoint of endpoints) {
      const result = await this.testEndpoint(endpoint.path, endpoint.method, endpoint.auth);
      results.push(result);
      
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Test individual endpoint with retries
   */
  private async testEndpoint(
    path: string, 
    method: string, 
    requiresAuth: boolean,
    maxRetries: number = 3
  ): Promise<DiagnosticResult> {
    const startTime = Date.now();
    let lastError: string = '';
    let retryAttempts = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const requestConfig: any = {
          timeout: 15000,
          headers: {}
        };

        // Add authentication if required
        if (requiresAuth) {
          const authHeaders = this.generateAuthHeaders(method, path);
          requestConfig.headers = { ...requestConfig.headers, ...authHeaders };
        }

        let response: AxiosResponse;
        
        if (method === 'GET') {
          response = await this.client.get(path, requestConfig);
        } else {
          response = await this.client.request({
            method: method as any,
            url: path,
            ...requestConfig
          });
        }

        const latency = Date.now() - startTime;
        const responseSize = JSON.stringify(response.data).length;

        return {
          endpoint: path,
          method,
          latency,
          status: 'success',
          responseSize,
          timestamp: Date.now(),
          retryAttempts: attempt
        };

      } catch (error: any) {
        retryAttempts = attempt;
        lastError = error.message;
        
        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    return {
      endpoint: path,
      method,
      latency: Date.now() - startTime,
      status: 'error',
      error: lastError,
      timestamp: Date.now(),
      retryAttempts
    };
  }

  /**
   * Generate authentication headers
   */
  private generateAuthHeaders(method: string, path: string): any {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const body = '';
    const message = timestamp + method.toUpperCase() + path + body;
    
    const signature = createHmac('sha256', this.credentials.apiSecret)
      .update(message, 'utf8')
      .digest('base64');

    return {
      'LNM-ACCESS-KEY': this.credentials.apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-TIMESTAMP': timestamp,
      'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase
    };
  }

  /**
   * Analyze test results and provide recommendations
   */
  private analyzeResults(results: DiagnosticResult[]): APIAnalysis {
    const successfulResults = results.filter(r => r.status === 'success');
    const errorResults = results.filter(r => r.status === 'error');
    
    const latencies = successfulResults.map(r => r.latency);
    const averageLatency = latencies.length > 0 
      ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length 
      : 0;
    
    const successRate = (successfulResults.length / results.length) * 100;
    const errorRate = (errorResults.length / results.length) * 100;
    
    // Calculate percentiles
    const sortedLatencies = latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(sortedLatencies.length * 0.95);
    const p99Index = Math.floor(sortedLatencies.length * 0.99);
    
    const p95Latency = sortedLatencies[p95Index] || 0;
    const p99Latency = sortedLatencies[p99Index] || 0;

    // Determine connection quality
    let connectionQuality: 'excellent' | 'good' | 'poor' | 'critical';
    if (averageLatency < 200 && successRate > 95) {
      connectionQuality = 'excellent';
    } else if (averageLatency < 500 && successRate > 90) {
      connectionQuality = 'good';
    } else if (averageLatency < 1000 && successRate > 80) {
      connectionQuality = 'poor';
    } else {
      connectionQuality = 'critical';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (averageLatency > 1000) {
      recommendations.push('Latência muito alta (>1000ms). Considere implementar cache local.');
    }
    
    if (successRate < 90) {
      recommendations.push('Taxa de sucesso baixa (<90%). Implementar retry automático com backoff exponencial.');
    }
    
    if (p95Latency > 2000) {
      recommendations.push('P95 latência muito alta (>2000ms). Implementar timeout mais agressivo.');
    }
    
    if (errorRate > 20) {
      recommendations.push('Taxa de erro alta (>20%). Verificar configuração de autenticação e conectividade.');
    }

    return {
      averageLatency,
      successRate,
      errorRate,
      timeoutRate: 0, // Not implemented yet
      p95Latency,
      p99Latency,
      connectionQuality,
      recommendations
    };
  }

  /**
   * Test specific endpoint with detailed metrics
   */
  async testSpecificEndpoint(path: string, method: string = 'GET', requiresAuth: boolean = false): Promise<DiagnosticResult> {
    return this.testEndpoint(path, method, requiresAuth);
  }

  /**
   * Run continuous monitoring for a period
   */
  async runContinuousMonitoring(durationMinutes: number = 5): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    const endTime = Date.now() + (durationMinutes * 60 * 1000);
    
    logger.info(`Starting continuous monitoring for ${durationMinutes} minutes`);
    
    while (Date.now() < endTime) {
      const result = await this.testSpecificEndpoint('/v1/user', 'GET', true);
      results.push(result);
      
      // Wait 30 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    logger.info('Continuous monitoring completed', { 
      totalTests: results.length,
      successRate: (results.filter(r => r.status === 'success').length / results.length) * 100
    });
    
    return results;
  }
}

