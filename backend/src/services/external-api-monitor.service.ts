/**
 * External API Monitor Service
 * 
 * Monitors individual external APIs with detailed metrics
 */

import axios, { AxiosInstance } from 'axios';
import { createHmac } from 'crypto';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { HealthStatus } from './health-checker.service';

interface APIMetrics {
  latency: number;
  status: HealthStatus;
  lastCheck: number;
  successRate: number;
  errorCount: number;
  totalRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  lastError?: string;
  consecutiveFailures: number;
}

interface APIConfig {
  name: string;
  baseURL: string;
  endpoints: {
    health: string;
    test: string;
  };
  timeout: number;
  requiresAuth?: boolean;
  authConfig?: {
    apiKey: string;
    apiSecret: string;
    passphrase: string;
  };
}

export class ExternalAPIMonitorService {
  private metrics: Map<string, APIMetrics> = new Map();
  private configs: Map<string, APIConfig> = new Map();
  private clients: Map<string, AxiosInstance> = new Map();
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.initializeAPIs();
  }

  private initializeAPIs() {
    // LN Markets Configuration
    this.configs.set('lnMarkets', {
      name: 'LN Markets',
      baseURL: 'https://api.lnmarkets.com',
      endpoints: {
        health: '/v1/status',
        test: '/v1/user'
      },
      timeout: 10000,
      requiresAuth: true,
      authConfig: {
        apiKey: config.LN_MARKETS_API_KEY || '',
        apiSecret: config.LN_MARKETS_API_SECRET || '',
        passphrase: config.LN_MARKETS_PASSPHRASE || ''
      }
    });

    // CoinGecko Configuration
    this.configs.set('coinGecko', {
      name: 'CoinGecko',
      baseURL: 'https://api.coingecko.com',
      endpoints: {
        health: '/api/v3/ping',
        test: '/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
      },
      timeout: 8000,
      requiresAuth: false
    });

    // Initialize clients
    for (const [name, apiConfig] of this.configs) {
      const client = axios.create({
        baseURL: apiConfig.baseURL,
        timeout: apiConfig.timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Axisor-Monitor/1.0'
        }
      });

      this.clients.set(name, client);
      this.initializeMetrics(name);
    }
  }

  private initializeMetrics(apiName: string) {
    this.metrics.set(apiName, {
      latency: 0,
      status: 'unknown',
      lastCheck: 0,
      successRate: 0,
      errorCount: 0,
      totalRequests: 0,
      averageLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      consecutiveFailures: 0
    });
  }

  /**
   * Start monitoring all APIs
   */
  start(intervalMs: number = 30000) {
    if (this.isRunning) {
      logger.warn('External API monitoring is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting external API monitoring', { intervalMs });

    // Run initial check
    this.checkAllAPIs();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.checkAllAPIs();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    logger.info('External API monitoring stopped');
  }

  /**
   * Check all configured APIs
   */
  private async checkAllAPIs() {
    const promises = Array.from(this.configs.keys()).map(apiName => 
      this.checkAPI(apiName)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Check individual API
   */
  private async checkAPI(apiName: string): Promise<void> {
    const apiConfig = this.configs.get(apiName);
    const client = this.clients.get(apiName);
    const metrics = this.metrics.get(apiName);

    if (!apiConfig || !client || !metrics) {
      logger.error('API configuration not found', { apiName });
      return;
    }

    const startTime = Date.now();
    
    try {
      // Test health endpoint first
      await this.testEndpoint(client, apiConfig.endpoints.health, apiConfig);
      
      // If health check passes, test main endpoint
      if (apiConfig.endpoints.test !== apiConfig.endpoints.health) {
        await this.testEndpoint(client, apiConfig.endpoints.test, apiConfig);
      }

      const latency = Date.now() - startTime;
      this.updateMetrics(apiName, true, latency);

    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.updateMetrics(apiName, false, latency, error.message);
      
      logger.warn('API check failed', {
        apiName,
        error: error.message,
        latency
      });
    }
  }

  /**
   * Test specific endpoint
   */
  private async testEndpoint(client: AxiosInstance, endpoint: string, config: APIConfig): Promise<any> {
    const requestConfig: any = {
      timeout: config.timeout
    };

    // Add authentication if required
    if (config.requiresAuth && config.authConfig) {
      const authHeaders = this.generateAuthHeaders('GET', endpoint, config.authConfig);
      requestConfig.headers = { ...requestConfig.headers, ...authHeaders };
    }

    const response = await client.get(endpoint, requestConfig);
    return response.data;
  }

  /**
   * Generate authentication headers for LN Markets
   */
  private generateAuthHeaders(method: string, path: string, authConfig: any): any {
    const timestamp = Date.now().toString();
    const body = '';
    const message = timestamp + method.toUpperCase() + path + body;
    
    const signature = createHmac('sha256', authConfig.apiSecret)
      .update(message)
      .digest('base64');

    return {
      'LN-ACCESS-KEY': authConfig.apiKey,
      'LN-ACCESS-SIGNATURE': signature,
      'LN-ACCESS-TIMESTAMP': timestamp,
      'LN-ACCESS-PASSPHRASE': authConfig.passphrase
    };
  }

  /**
   * Update metrics for an API
   */
  private updateMetrics(apiName: string, success: boolean, latency: number, error?: string) {
    const metrics = this.metrics.get(apiName);
    if (!metrics) return;

    const now = Date.now();
    
    // Update basic metrics
    metrics.lastCheck = now;
    metrics.totalRequests++;
    
    if (success) {
      metrics.consecutiveFailures = 0;
      metrics.latency = latency;
      
      // Update average latency (simple moving average)
      metrics.averageLatency = (metrics.averageLatency * (metrics.totalRequests - 1) + latency) / metrics.totalRequests;
      
      // Determine status based on latency
      if (latency < 500) {
        metrics.status = 'healthy';
      } else if (latency < 1000) {
        metrics.status = 'degraded';
      } else {
        metrics.status = 'unhealthy';
      }
    } else {
      metrics.errorCount++;
      metrics.consecutiveFailures++;
      metrics.lastError = error;
      
      // Determine status based on consecutive failures
      if (metrics.consecutiveFailures >= 3) {
        metrics.status = 'unhealthy';
      } else if (metrics.consecutiveFailures >= 1) {
        metrics.status = 'degraded';
      }
    }
    
    // Calculate success rate
    metrics.successRate = ((metrics.totalRequests - metrics.errorCount) / metrics.totalRequests) * 100;
    
    // Update percentiles (simplified calculation)
    this.updatePercentiles(apiName, latency);
    
    this.metrics.set(apiName, metrics);
  }

  /**
   * Update latency percentiles (simplified)
   */
  private updatePercentiles(apiName: string, latency: number) {
    const metrics = this.metrics.get(apiName);
    if (!metrics) return;

    // Simple percentile estimation based on average
    metrics.p95Latency = metrics.averageLatency * 1.5;
    metrics.p99Latency = metrics.averageLatency * 2.0;
  }

  /**
   * Get metrics for all APIs
   */
  getMetrics(): Record<string, APIMetrics> {
    const result: Record<string, APIMetrics> = {};
    
    for (const [name, metrics] of this.metrics) {
      result[name] = { ...metrics };
    }
    
    return result;
  }

  /**
   * Get metrics for specific API
   */
  getAPIMetrics(apiName: string): APIMetrics | null {
    const metrics = this.metrics.get(apiName);
    return metrics ? { ...metrics } : null;
  }

  /**
   * Get overall API health status
   */
  getOverallStatus(): HealthStatus {
    const metrics = Array.from(this.metrics.values());
    
    if (metrics.length === 0) {
      return 'unknown';
    }
    
    const unhealthyCount = metrics.filter(m => m.status === 'unhealthy').length;
    const degradedCount = metrics.filter(m => m.status === 'degraded').length;
    
    if (unhealthyCount > 0) {
      return 'unhealthy';
    } else if (degradedCount > 0) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  /**
   * Get average latency across all APIs
   */
  getAverageLatency(): number {
    const metrics = Array.from(this.metrics.values());
    
    if (metrics.length === 0) {
      return 0;
    }
    
    const totalLatency = metrics.reduce((sum, m) => sum + m.averageLatency, 0);
    return totalLatency / metrics.length;
  }

  /**
   * Test specific API manually
   */
  async testAPI(apiName: string): Promise<{ success: boolean; latency: number; error?: string }> {
    const apiConfig = this.configs.get(apiName);
    const client = this.clients.get(apiName);

    if (!apiConfig || !client) {
      throw new Error(`API configuration not found: ${apiName}`);
    }

    const startTime = Date.now();
    
    try {
      await this.testEndpoint(client, apiConfig.endpoints.health, apiConfig);
      const latency = Date.now() - startTime;
      
      return { success: true, latency };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      return { success: false, latency, error: error.message };
    }
  }
}

export const externalAPIMonitorService = new ExternalAPIMonitorService();
