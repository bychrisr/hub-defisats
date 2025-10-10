/**
 * LND Client
 * 
 * Base HTTP client for LND (Lightning Network Daemon) REST API.
 * Handles authentication, retry logic, error handling, and request/response processing.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { LNDConfig, LNDRequestOptions, LNDResponse, LNDServiceError, LNDNetwork } from './types/lnd.types';

export class LNDClient {
  private httpClient: AxiosInstance;
  private config: LNDConfig;
  private logger: any;

  constructor(config: LNDConfig, logger: any) {
    this.config = config;
    this.logger = logger;
    
    // Create HTTP client with base configuration
    this.httpClient = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Grpc-Metadata-macaroon': config.credentials.macaroon,
      },
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug('🔗 LND Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          network: this.config.network
        });
        return config;
      },
      (error) => {
        this.logger.error('❌ LND Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and error handling
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug('✅ LND Response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
          network: this.config.network
        });
        return response;
      },
      (error) => {
        this.logger.error('❌ LND Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          network: this.config.network
        });
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Handle HTTP errors and convert to LNDServiceError
   */
  private handleError(error: any): LNDServiceError {
    if (error.response) {
      // Server responded with error status
      const statusCode = error.response.status;
      const errorData = error.response.data;
      
      let message = `LND API error: ${statusCode}`;
      let code = 'LND_API_ERROR';
      
      if (errorData && errorData.message) {
        message = errorData.message;
      } else if (errorData && errorData.error) {
        message = errorData.error;
      }
      
      // Map common HTTP status codes to specific error codes
      switch (statusCode) {
        case 400:
          code = 'LND_BAD_REQUEST';
          break;
        case 401:
          code = 'LND_UNAUTHORIZED';
          message = 'Invalid macaroon or TLS certificate';
          break;
        case 403:
          code = 'LND_FORBIDDEN';
          message = 'Insufficient permissions';
          break;
        case 404:
          code = 'LND_NOT_FOUND';
          message = 'Resource not found';
          break;
        case 429:
          code = 'LND_RATE_LIMITED';
          message = 'Rate limit exceeded';
          break;
        case 500:
          code = 'LND_INTERNAL_ERROR';
          message = 'LND internal server error';
          break;
        case 503:
          code = 'LND_SERVICE_UNAVAILABLE';
          message = 'LND service unavailable';
          break;
      }
      
      return new LNDServiceError(message, code, statusCode, errorData);
    } else if (error.request) {
      // Network error
      return new LNDServiceError(
        'Network error: Unable to connect to LND',
        'LND_NETWORK_ERROR',
        undefined,
        { originalError: error.message }
      );
    } else {
      // Other error
      return new LNDServiceError(
        error.message || 'Unknown LND client error',
        'LND_CLIENT_ERROR',
        undefined,
        { originalError: error }
      );
    }
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequest<T = any>(
    options: LNDRequestOptions,
    attempt: number = 1
  ): Promise<LNDResponse<T>> {
    const maxAttempts = this.config.retryAttempts || 3;
    const retryDelay = this.config.retryDelay || 1000;

    try {
      const axiosConfig: AxiosRequestConfig = {
        method: options.method,
        url: options.url,
        data: options.data,
        params: options.params,
        timeout: options.timeout || this.config.timeout,
      };

      const response: AxiosResponse<T> = await this.httpClient.request(axiosConfig);

      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };

    } catch (error) {
      if (error instanceof LNDServiceError) {
        // Check if error is retryable
        const isRetryable = this.isRetryableError(error);
        
        if (isRetryable && attempt < maxAttempts) {
          this.logger.warn(`⚠️ LND Request failed, retrying (${attempt}/${maxAttempts}):`, {
            error: error.message,
            code: error.code,
            url: options.url,
            network: this.config.network
          });
          
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.executeRequest(options, attempt + 1);
        }
        
        return {
          success: false,
          error: error.message,
          statusCode: error.statusCode,
        };
      }
      
      // Non-LNDServiceError
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: LNDServiceError): boolean {
    const retryableCodes = [
      'LND_NETWORK_ERROR',
      'LND_SERVICE_UNAVAILABLE',
      'LND_RATE_LIMITED',
      'LND_INTERNAL_ERROR',
    ];
    
    const retryableStatusCodes = [500, 502, 503, 504, 429];
    
    return retryableCodes.includes(error.code) || 
           (error.statusCode && retryableStatusCodes.includes(error.statusCode));
  }

  /**
   * GET request
   */
  public async get<T = any>(url: string, params?: Record<string, any>): Promise<LNDResponse<T>> {
    return this.executeRequest<T>({
      method: 'GET',
      url,
      params,
    });
  }

  /**
   * POST request
   */
  public async post<T = any>(url: string, data?: any): Promise<LNDResponse<T>> {
    return this.executeRequest<T>({
      method: 'POST',
      url,
      data,
    });
  }

  /**
   * PUT request
   */
  public async put<T = any>(url: string, data?: any): Promise<LNDResponse<T>> {
    return this.executeRequest<T>({
      method: 'PUT',
      url,
      data,
    });
  }

  /**
   * DELETE request
   */
  public async delete<T = any>(url: string): Promise<LNDResponse<T>> {
    return this.executeRequest<T>({
      method: 'DELETE',
      url,
    });
  }

  /**
   * Get network information
   */
  public getNetwork(): LNDNetwork {
    return this.config.network;
  }

  /**
   * Get base URL
   */
  public getBaseURL(): string {
    return this.config.baseURL;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<LNDConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update HTTP client configuration
    if (newConfig.baseURL) {
      this.httpClient.defaults.baseURL = newConfig.baseURL;
    }
    
    if (newConfig.credentials?.macaroon) {
      this.httpClient.defaults.headers['Grpc-Metadata-macaroon'] = newConfig.credentials.macaroon;
    }
    
    if (newConfig.timeout) {
      this.httpClient.defaults.timeout = newConfig.timeout;
    }
    
    this.logger.info('🔄 LND Client configuration updated', {
      network: this.config.network,
      baseURL: this.config.baseURL
    });
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/v1/getinfo');
      return response.success;
    } catch (error) {
      this.logger.error('❌ LND Health check failed:', error);
      return false;
    }
  }

  /**
   * Get client statistics
   */
  public getStats(): {
    network: LNDNetwork;
    baseURL: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  } {
    return {
      network: this.config.network,
      baseURL: this.config.baseURL,
      timeout: this.config.timeout || 30000,
      retryAttempts: this.config.retryAttempts || 3,
      retryDelay: this.config.retryDelay || 1000,
    };
  }
}
