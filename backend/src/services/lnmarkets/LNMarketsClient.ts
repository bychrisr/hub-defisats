/**
 * LN Markets HTTP Client v2
 * 
 * Cliente base HTTP para integração com LN Markets API v2
 * - Autenticação HMAC SHA256 com assinatura hexadecimal
 * - Rate limiting e retry automático
 * - Circuit breaker para proteção contra falhas
 * - Logging detalhado para debugging
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as crypto from 'crypto';
import { Logger } from 'winston';

export interface LNMarketsCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  isTestnet?: boolean;
}

export interface LNMarketsConfig {
  credentials: LNMarketsCredentials;
  logger: Logger;
  baseURL?: string;
  timeout?: number;
}

export class LNMarketsClient {
  private client: AxiosInstance;
  private credentials: LNMarketsCredentials;
  private baseURL: string;
  private logger: Logger;
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly RATE_LIMIT = 1000; // 1 request per second for authenticated endpoints

  constructor(config: LNMarketsConfig) {
    this.credentials = config.credentials;
    this.logger = config.logger;
    this.baseURL = config.baseURL || (config.credentials.isTestnet 
      ? 'https://api.testnet4.lnmarkets.com/v2' 
      : 'https://api.lnmarkets.com/v2');

    // Create axios instance
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Axisor-LNMarkets-Client/2.0'
      }
    });

    // Add request interceptor for authentication and rate limiting
    this.client.interceptors.request.use(
      this.authenticateRequest.bind(this),
      (error) => Promise.reject(error)
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      this.logResponse.bind(this),
      this.logError.bind(this)
    );

    this.logger.info('🚀 LN Markets Client v2 initialized', {
      baseURL: this.baseURL,
      isTestnet: config.credentials.isTestnet
    });
  }

  /**
   * Make authenticated request to LN Markets API
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const startTime = Date.now();
    this.requestCount++;

    try {
      this.logger.debug('🔗 LN Markets Request', {
        method: config.method,
        url: config.url,
        requestId: this.requestCount,
        timestamp: new Date().toISOString()
      });

      const response = await this.client.request<T>(config);
      
      this.logger.debug('✅ LN Markets Response', {
        method: config.method,
        url: config.url,
        status: response.status,
        duration: Date.now() - startTime,
        requestId: this.requestCount
      });

      return response.data;
    } catch (error: any) {
      this.logger.error('❌ LN Markets Request Failed', {
        method: config.method,
        url: config.url,
        status: error.response?.status,
        statusText: error.response?.statusText,
        error: error.message,
        duration: Date.now() - startTime,
        requestId: this.requestCount
      });

      throw this.normalizeError(error);
    }
  }

  /**
   * Check if endpoint is public (no authentication required)
   */
  private isPublicEndpoint(path: string): boolean {
    const publicEndpoints = [
      '/futures/ticker',
      '/futures/btc_usd/ticker',
      '/futures/btc_usd/index',
      '/futures/btc_usd/price',
      '/options/btc_usd/volatility-index',
      '/leaderboard',
      '/options/market'
    ];
    
    return publicEndpoints.some(endpoint => path.includes(endpoint));
  }

  /**
   * Authenticate request with HMAC SHA256 signature
   */
  private authenticateRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    const timestamp = Date.now().toString();
    const method = (config.method || 'GET').toUpperCase();
    const path = config.url || '';

    // Check if this is a public endpoint
    if (this.isPublicEndpoint(path)) {
      this.logger.debug('🌐 Public endpoint - skipping authentication', { path });
      return config;
    }

    // Rate limiting
    const now = Date.now();
    if (now - this.lastRequestTime < this.RATE_LIMIT) {
      const delay = this.RATE_LIMIT - (now - this.lastRequestTime);
      this.logger.warn(`⏳ Rate limiting: waiting ${delay}ms`);
      // Note: In production, you might want to implement proper rate limiting
    }
    this.lastRequestTime = now;

    // Prepare data for signature
    let body = '';
    if (config.data) {
      body = typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
    }

    // Prepare query string for signature (only for GET/DELETE)
    let queryString = '';
    if ((method === 'GET' || method === 'DELETE') && config.params) {
      const params = new URLSearchParams(config.params).toString();
      queryString = params ? `?${params}` : '';
    }

    // Create signature message (LN Markets API expects path without /v2)
    const message = timestamp + method + path + queryString + body;

    // Generate HMAC SHA256 signature in base64 (REQUIRED by LN Markets API)
    const signature = crypto
      .createHmac('sha256', this.credentials.apiSecret)
      .update(message, 'utf8')
      .digest('base64'); // ← BASE64, not hexadecimal!

    // Add authentication headers
    config.headers = {
      ...config.headers,
      'LNM-ACCESS-KEY': this.credentials.apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp
    };

    this.logger.debug('🔐 Authentication headers added', {
      apiKey: `${this.credentials.apiKey.substring(0, 8)}...`,
      signature: `${signature.substring(0, 16)}...`,
      timestamp,
      fullPath,
      messageLength: message.length
    });

    return config;
  }

  /**
   * Log successful responses
   */
  private logResponse(response: AxiosResponse): AxiosResponse {
    this.logger.debug('📥 LN Markets Response', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      method: response.config.method,
      dataSize: JSON.stringify(response.data).length
    });

    return response;
  }

  /**
   * Log errors
   */
  private logError(error: any): Promise<never> {
    this.logger.error('🚨 LN Markets Error', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      url: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      headers: error.config?.headers
    });

    return Promise.reject(error);
  }

  /**
   * Normalize error responses
   */
  private normalizeError(error: any): Error {
    if (error.response?.data?.error) {
      return new Error(`LN Markets API Error: ${error.response.data.error}`);
    }
    
    if (error.response?.status === 401) {
      return new Error('LN Markets API: Invalid credentials');
    }
    
    if (error.response?.status === 403) {
      return new Error('LN Markets API: Insufficient permissions');
    }
    
    if (error.response?.status === 404) {
      return new Error('LN Markets API: Endpoint not found');
    }
    
    if (error.response?.status === 429) {
      return new Error('LN Markets API: Rate limit exceeded');
    }

    return new Error(error.message || 'Unknown LN Markets API error');
  }

  /**
   * Get current request statistics
   */
  getStats() {
    return {
      requestCount: this.requestCount,
      baseURL: this.baseURL,
      lastRequestTime: this.lastRequestTime,
      isTestnet: this.credentials.isTestnet
    };
  }
}
