import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import crypto from 'crypto';

export interface LNMarketsCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
  isTestnet?: boolean;
}

export interface LNMarketsRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  data?: any;
  params?: any;
}

export class LNMarketsAPIService {
  private client: AxiosInstance;
  private credentials: LNMarketsCredentials;
  private baseURL: string;

  constructor(credentials: LNMarketsCredentials) {
    this.credentials = credentials;
    this.baseURL = credentials.isTestnet 
      ? 'https://api.testnet4.lnmarkets.com/v2'
      : 'https://api.lnmarkets.com/v2';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(this.authenticateRequest.bind(this));
  }

  private authenticateRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    const timestamp = Date.now().toString();
    const method = (config.method || 'GET').toUpperCase();
    const path = config.url || '';
    
    // Prepare data for signature
    let data = '';
    let fullPath = path;
    
    if (method === 'GET' || method === 'DELETE') {
      // For GET/DELETE, include params in the path for signature
      if (config.params && Object.keys(config.params).length > 0) {
        const queryString = new URLSearchParams(config.params).toString();
        fullPath = `${path}?${queryString}`;
      }
      data = ''; // No body data for GET/DELETE
    } else if (config.data) {
      data = JSON.stringify(config.data);
    }

    // Create signature using full path with params
    const message = timestamp + method + fullPath + data;
    const signature = crypto
      .createHmac('sha256', this.credentials.apiSecret)
      .update(message)
      .digest('base64');

    // Add headers
    config.headers = {
      ...config.headers,
      'LNM-ACCESS-KEY': this.credentials.apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': this.credentials.passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp,
    };

    // Set content type for POST/PUT requests
    if (method === 'POST' || method === 'PUT') {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  }

  async makeRequest<T = any>(request: LNMarketsRequest): Promise<T> {
    try {
      console.log(`[LNMarketsAPI] Making ${request.method} request to ${request.path}`, {
        data: request.data,
        params: request.params
      });

      const response = await this.client.request({
        method: request.method,
        url: request.path,
        data: request.data,
        params: request.params,
      });

      console.log(`[LNMarketsAPI] Request successful:`, {
        status: response.status,
        data: response.data
      });

      return response.data;
    } catch (error: any) {
      console.error(`[LNMarketsAPI] Request failed:`, {
        method: request.method,
        path: request.path,
        error: error.response?.data || error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  // Futures API Methods
  async addMargin(tradeId: string, amount: number) {
    return this.makeRequest({
      method: 'POST',
      path: '/futures/add-margin',
      data: { id: tradeId, amount }
    });
  }

  async cancelAllTrades() {
    return this.makeRequest({
      method: 'POST',
      path: '/futures/cancel-all-trades'
    });
  }

  async closeAllTrades() {
    return this.makeRequest({
      method: 'POST',
      path: '/futures/close-all-trades'
    });
  }

  async getTrades(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    type?: string;
  }) {
    return this.makeRequest({
      method: 'GET',
      path: '/futures/trades',
      params
    });
  }

  async updateTrade(tradeId: string, data: {
    stoploss?: number;
    takeprofit?: number;
    leverage?: number;
  }) {
    return this.makeRequest({
      method: 'PUT',
      path: `/futures/trades/${tradeId}`,
      data
    });
  }

  async createTrade(data: {
    side: 'b' | 's';
    quantity: number;
    leverage: number;
    stoploss?: number;
    takeprofit?: number;
    margin_mode?: 'isolated' | 'cross';
  }) {
    return this.makeRequest({
      method: 'POST',
      path: '/futures/trades',
      data
    });
  }

  async getFuturesMarket() {
    return this.makeRequest({
      method: 'GET',
      path: '/futures/market'
    });
  }

  async getTrade(tradeId: string) {
    return this.makeRequest({
      method: 'GET',
      path: `/futures/trades/${tradeId}`
    });
  }

  // Options API Methods
  async closeAllOptionsTrades() {
    return this.makeRequest({
      method: 'POST',
      path: '/options/close-all-trades'
    });
  }

  async getOptionsTrades(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) {
    return this.makeRequest({
      method: 'GET',
      path: '/options/trades',
      params
    });
  }

  async updateOptionsTrade(tradeId: string, data: {
    stoploss?: number;
    takeprofit?: number;
  }) {
    return this.makeRequest({
      method: 'PUT',
      path: `/options/trades/${tradeId}`,
      data
    });
  }

  async createOptionsTrade(data: {
    side: 'b' | 's';
    quantity: number;
    instrument: string;
    stoploss?: number;
    takeprofit?: number;
  }) {
    return this.makeRequest({
      method: 'POST',
      path: '/options/trades',
      data
    });
  }

  async getOptionsMarket() {
    return this.makeRequest({
      method: 'GET',
      path: '/options/market'
    });
  }

  async getOptionsTrade(tradeId: string) {
    return this.makeRequest({
      method: 'GET',
      path: `/options/trades/${tradeId}`
    });
  }

  // User API Methods
  async getUser() {
    return this.makeRequest({
      method: 'GET',
      path: '/user'
    });
  }

  async getUserBalance() {
    return this.makeRequest({
      method: 'GET',
      path: '/user/balance'
    });
  }

  async getUserHistory(params?: {
    limit?: number;
    offset?: number;
    type?: string;
  }) {
    return this.makeRequest({
      method: 'GET',
      path: '/user/history',
      params
    });
  }

  async getUserTrades(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) {
    return this.makeRequest({
      method: 'GET',
      path: '/user/trades',
      params
    });
  }

  async getUserPositions() {
    try {
      console.log('🔍 LN MARKETS - Attempting to get user positions from /futures');
      const result = await this.makeRequest({
        method: 'GET',
        path: '/futures',
        params: { type: 'running' }
      });
      console.log('✅ LN MARKETS - User positions retrieved successfully:', result);
      return result;
    } catch (error: any) {
      console.log('⚠️ LN MARKETS - Error getting user positions:', error.message);
      
      // If endpoint doesn't exist (404) or returns empty, return empty array
      if (error.response?.status === 404 || error.message?.includes('404')) {
        console.log('📝 LN MARKETS - Endpoint /futures not found, returning empty positions');
        return [];
      }
      
      // If no data returned, return empty array
      if (error.message?.includes('No data') || error.message?.includes('empty')) {
        console.log('📝 LN MARKETS - No positions data, returning empty array');
        return [];
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  async getUserOrders() {
    return this.makeRequest({
      method: 'GET',
      path: '/user/orders'
    });
  }

  // Market Data API Methods
  async getMarketData() {
    return this.makeRequest({
      method: 'GET',
      path: '/market'
    });
  }

  async getFuturesData() {
    return this.makeRequest({
      method: 'GET',
      path: '/futures/data'
    });
  }

  async getOptionsData() {
    return this.makeRequest({
      method: 'GET',
      path: '/options/data'
    });
  }

  // Utility Methods
  async testConnection() {
    try {
      await this.getUser();
      return { success: true, message: 'Connection successful' };
    } catch (error: any) {
      return { 
        success: false, 
        message: 'Connection failed', 
        error: error.response?.data || error.message 
      };
    }
  }

  // Get credentials (for debugging)
  getCredentials() {
    return {
      apiKey: this.credentials.apiKey,
      isTestnet: this.credentials.isTestnet,
      baseURL: this.baseURL
    };
  }
}
