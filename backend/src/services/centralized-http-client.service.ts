import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Logger } from 'winston';

export interface HTTPClientConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  rateLimit?: {
    requests: number;
    window: number; // milliseconds
  };
  headers?: Record<string, string>;
}

export interface HTTPClientResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: AxiosRequestConfig;
  request?: any;
}

export class CentralizedHTTPClient {
  private client: AxiosInstance;
  private logger: Logger;
  private rateLimiter: Map<string, { count: number; resetTime: number }> = new Map();
  private config: HTTPClientConfig;

  constructor(config: HTTPClientConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Axisor-Trading-Platform/1.0.0',
        ...config.headers
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        this.logger.info('HTTP Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          timeout: config.timeout
        });
        return config;
      },
      (error) => {
        this.logger.error('HTTP Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        this.logger.info('HTTP Response', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          responseTime: response.headers['x-response-time'] || 'unknown'
        });
        return response;
      },
      (error) => {
        this.logger.error('HTTP Response Error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check rate limit for a specific endpoint
   */
  private checkRateLimit(endpoint: string): boolean {
    if (!this.config.rateLimit) return true;

    const key = `${this.config.baseURL}:${endpoint}`;
    const now = Date.now();
    const limit = this.rateLimiter.get(key);

    if (!limit || now > limit.resetTime) {
      this.rateLimiter.set(key, {
        count: 1,
        resetTime: now + this.config.rateLimit.window
      });
      return true;
    }

    if (limit.count >= this.config.rateLimit.requests) {
      this.logger.warn('Rate limit exceeded', { endpoint, key });
      return false;
    }

    limit.count++;
    return true;
  }

  /**
   * Wait for rate limit reset
   */
  private async waitForRateLimit(endpoint: string): Promise<void> {
    if (!this.config.rateLimit) return;

    const key = `${this.config.baseURL}:${endpoint}`;
    const limit = this.rateLimiter.get(key);

    if (limit && Date.now() < limit.resetTime) {
      const waitTime = limit.resetTime - Date.now();
      this.logger.info('Waiting for rate limit reset', { endpoint, waitTime });
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Retry request with exponential backoff
   */
  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retries: number = 0
  ): Promise<AxiosResponse<T>> {
    try {
      return await requestFn();
    } catch (error: any) {
      if (retries < (this.config.retries || 3)) {
        const delay = (this.config.retryDelay || 1000) * Math.pow(2, retries);
        this.logger.warn('Request failed, retrying', { 
          retries, 
          delay, 
          error: error.message 
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, retries + 1);
      }
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<HTTPClientResponse<T>> {
    if (!this.checkRateLimit(url)) {
      await this.waitForRateLimit(url);
    }

    const requestFn = () => this.client.get<T>(url, config);
    const response = await this.retryRequest(requestFn);
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      config: response.config,
      request: response.request
    };
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<HTTPClientResponse<T>> {
    if (!this.checkRateLimit(url)) {
      await this.waitForRateLimit(url);
    }

    const requestFn = () => this.client.post<T>(url, data, config);
    const response = await this.retryRequest(requestFn);
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      config: response.config,
      request: response.request
    };
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<HTTPClientResponse<T>> {
    if (!this.checkRateLimit(url)) {
      await this.waitForRateLimit(url);
    }

    const requestFn = () => this.client.put<T>(url, data, config);
    const response = await this.retryRequest(requestFn);
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      config: response.config,
      request: response.request
    };
  }

  /**
   * DELETE request
   */
  async delete<T = any>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<HTTPClientResponse<T>> {
    if (!this.checkRateLimit(url)) {
      await this.waitForRateLimit(url);
    }

    const requestFn = () => this.client.delete<T>(url, config);
    const response = await this.retryRequest(requestFn);
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      config: response.config,
      request: response.request
    };
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<HTTPClientResponse<T>> {
    if (!this.checkRateLimit(url)) {
      await this.waitForRateLimit(url);
    }

    const requestFn = () => this.client.patch<T>(url, data, config);
    const response = await this.retryRequest(requestFn);
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      config: response.config,
      request: response.request
    };
  }

  /**
   * Generic request method
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<HTTPClientResponse<T>> {
    if (!this.checkRateLimit(config.url || '')) {
      await this.waitForRateLimit(config.url || '');
    }

    const requestFn = () => this.client.request<T>(config);
    const response = await this.retryRequest(requestFn);
    
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      config: response.config,
      request: response.request
    };
  }

  /**
   * Get rate limit status
   */
  getRateLimitStatus(endpoint: string): { count: number; resetTime: number; remaining: number } {
    const key = `${this.config.baseURL}:${endpoint}`;
    const limit = this.rateLimiter.get(key);
    
    if (!limit) {
      return { count: 0, resetTime: 0, remaining: this.config.rateLimit?.requests || 0 };
    }

    const remaining = Math.max(0, (this.config.rateLimit?.requests || 0) - limit.count);
    return {
      count: limit.count,
      resetTime: limit.resetTime,
      remaining
    };
  }

  /**
   * Clear rate limit for specific endpoint
   */
  clearRateLimit(endpoint: string): void {
    const key = `${this.config.baseURL}:${endpoint}`;
    this.rateLimiter.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAllRateLimits(): void {
    this.rateLimiter.clear();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<HTTPClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.baseURL) {
      this.client.defaults.baseURL = newConfig.baseURL;
    }
    
    if (newConfig.timeout) {
      this.client.defaults.timeout = newConfig.timeout;
    }
    
    if (newConfig.headers) {
      this.client.defaults.headers = { ...this.client.defaults.headers, ...newConfig.headers };
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): HTTPClientConfig {
    return { ...this.config };
  }
}
