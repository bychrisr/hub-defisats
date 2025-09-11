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
    console.log('🚨 TESTE SIMPLES - CONSTRUTOR LNMarketsAPIService CHAMADO!');
    console.log('🚨 TESTE SIMPLES - Credentials:', {
      hasApiKey: !!credentials.apiKey,
      hasApiSecret: !!credentials.apiSecret,
      hasPassphrase: !!credentials.passphrase,
      isTestnet: credentials.isTestnet
    });
    
    this.credentials = credentials;
    this.baseURL = credentials.isTestnet 
      ? 'https://api.testnet4.lnmarkets.com/v2'
      : 'https://api.lnmarkets.com/v2';
    
    console.log('🚨 TESTE SIMPLES - BaseURL:', this.baseURL);
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
    });

    // Add request interceptor for authentication
    console.log('🚨 TESTE SIMPLES - REGISTRANDO INTERCEPTOR!');
    this.client.interceptors.request.use(this.authenticateRequest.bind(this) as any);
    console.log('🚨 TESTE SIMPLES - INTERCEPTOR REGISTRADO!');
  }

  private authenticateRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    console.log('🚨 TESTE SIMPLES - AUTHENTICATE REQUEST CHAMADO!');
    console.log('🔐 LN MARKETS AUTH - Starting authentication process');
    console.log('🔐 LN MARKETS AUTH - Original config:', {
      method: config.method,
      url: config.url,
      params: config.params,
      data: config.data
    });
    
    const timestamp = Date.now().toString();
    const method = (config.method || 'GET').toUpperCase();
    const path = config.url ? `/v2${config.url}` : '';
    
    // Limpar credenciais para evitar espaços/caracteres invisíveis
    const apiKey = this.credentials.apiKey.trim();
    const apiSecret = this.credentials.apiSecret.trim();
    const passphrase = this.credentials.passphrase.trim();
    
    console.log('🔐 LN MARKETS AUTH - Basic info:', {
      timestamp,
      method,
      path,
      baseURL: this.baseURL
    });
    
    console.log('🔐 LN MARKETS AUTH - Credentials lengths:', {
      apiKeyLength: apiKey.length,
      apiSecretLength: apiSecret.length,
      passphraseLength: passphrase.length
    });
    
    // Prepare data for signature
    let params = '';
    
    if (method === 'GET' || method === 'DELETE') {
      // For GET/DELETE, params should be query string for signature
      if (config.params) {
        params = new URLSearchParams(config.params).toString();
        console.log('🔐 LN MARKETS AUTH - GET/DELETE with params:', {
          originalPath: path,
          params: config.params,
          queryString: params,
          note: 'Params converted to query string for signature'
        });
      } else {
        params = '';
      }
    } else if (config.data) {
      // For POST/PUT, params should be JSON string
      params = JSON.stringify(config.data);
      console.log('🔐 LN MARKETS AUTH - POST/PUT with data:', {
        data: config.data,
        jsonData: params
      });
    }
    
    // Create signature using: timestamp + method + path + params
    const message = timestamp + method + path + params;
    console.log('🔐 LN MARKETS AUTH - Message para assinatura:', `"${message}"`);
    console.log('🔐 LN MARKETS AUTH - Signature components:', {
      timestamp,
      method,
      path,
      params,
      message
    });
    
    // Gerar assinatura com UTF-8 explícito
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(message, 'utf8')
      .digest('base64');

    console.log('🔐 LN MARKETS AUTH - Assinatura gerada:', signature);
    console.log('🔐 LN MARKETS AUTH - Credentials info:', {
      apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'MISSING',
      apiSecret: apiSecret ? `${apiSecret.substring(0, 10)}...` : 'MISSING',
      passphrase: passphrase ? `${passphrase.substring(0, 5)}...` : 'MISSING',
      isTestnet: this.credentials.isTestnet
    });

    // Add headers
    config.headers = {
      ...config.headers,
      'LNM-ACCESS-KEY': apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp,
    };
    
    console.log('🔐 LN MARKETS AUTH - Final headers:', {
      'LNM-ACCESS-KEY': config.headers['LNM-ACCESS-KEY'] ? `${String(config.headers['LNM-ACCESS-KEY']).substring(0, 10)}...` : 'MISSING',
      'LNM-ACCESS-SIGNATURE': config.headers['LNM-ACCESS-SIGNATURE'] ? `${String(config.headers['LNM-ACCESS-SIGNATURE']).substring(0, 10)}...` : 'MISSING',
      'LNM-ACCESS-PASSPHRASE': config.headers['LNM-ACCESS-PASSPHRASE'] ? `${String(config.headers['LNM-ACCESS-PASSPHRASE']).substring(0, 5)}...` : 'MISSING',
      'LNM-ACCESS-TIMESTAMP': config.headers['LNM-ACCESS-TIMESTAMP']
    });

    // Set content type for POST/PUT requests
    if (method === 'POST' || method === 'PUT') {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  }

  async makeRequest<T = any>(request: LNMarketsRequest): Promise<T> {
    console.log('🚀 LN MARKETS REQUEST - Starting request:', {
      method: request.method,
      path: request.path,
      params: request.params,
      data: request.data,
      baseURL: this.baseURL
    });
    
    try {
      console.log(`[LNMarketsAPI] Making ${request.method} request to ${request.path}`, {
        data: request.data,
        params: request.params,
        fullURL: `${this.baseURL}${request.path}`
      });

      const response = await this.client.request({
        method: request.method,
        url: request.path,
        data: request.data,
        params: request.params,
      });

      console.log(`[LNMarketsAPI] Request successful:`, {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });

      // LN Markets API returns data directly, not wrapped in an object
      return response.data;
    } catch (error: any) {
      console.error(`[LNMarketsAPI] Request failed:`, {
        method: request.method,
        path: request.path,
        fullURL: `${this.baseURL}${request.path}`,
        error: error.response?.data || error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        config: {
          method: error.config?.method,
          url: error.config?.url,
          params: error.config?.params,
          data: error.config?.data,
          headers: error.config?.headers
        }
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
    console.log('🔍 LN MARKETS POSITIONS - Starting getUserPositions');
    console.log('🔍 LN MARKETS POSITIONS - Service credentials:', {
      apiKey: this.credentials.apiKey ? `${this.credentials.apiKey.substring(0, 10)}...` : 'MISSING',
      apiSecret: this.credentials.apiSecret ? `${this.credentials.apiSecret.substring(0, 10)}...` : 'MISSING',
      passphrase: this.credentials.passphrase ? `${this.credentials.passphrase.substring(0, 5)}...` : 'MISSING',
      isTestnet: this.credentials.isTestnet,
      baseURL: this.baseURL
    });
    
    try {
      console.log('🔍 LN MARKETS POSITIONS - Attempting to get user positions from /futures');
      const result = await this.makeRequest({
        method: 'GET',
        path: '/futures',
        params: { type: 'running' }
      });
      console.log('✅ LN MARKETS POSITIONS - User positions retrieved successfully:', result);
      console.log('🔍 LN MARKETS POSITIONS - Result type:', typeof result);
      console.log('🔍 LN MARKETS POSITIONS - Result is array:', Array.isArray(result));
      console.log('🔍 LN MARKETS POSITIONS - Result length:', Array.isArray(result) ? result.length : 'not array');
      if (Array.isArray(result) && result.length > 0) {
        console.log('🔍 LN MARKETS POSITIONS - First position:', result[0]);
        console.log('🔍 LN MARKETS POSITIONS - First position keys:', Object.keys(result[0]));
        console.log('🔍 LN MARKETS POSITIONS - First position values:', {
          id: result[0].id,
          side: result[0].side,
          quantity: result[0].quantity,
          price: result[0].price,
          liquidation: result[0].liquidation,
          margin: result[0].margin,
          pl: result[0].pl,
          leverage: result[0].leverage
        });
      }
      return result;
    } catch (error: any) {
      console.log('⚠️ LN MARKETS POSITIONS - Error getting user positions:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        fullError: error
      });
      
      // If endpoint doesn't exist (404) or returns empty, return empty array
      if (error.response?.status === 404 || error.message?.includes('404')) {
        console.log('📝 LN MARKETS POSITIONS - Endpoint /futures not found, returning empty positions');
        return [];
      }
      
      // If no data returned, return empty array
      if (error.message?.includes('No data') || error.message?.includes('empty')) {
        console.log('📝 LN MARKETS POSITIONS - No positions data, returning empty array');
        return [];
      }
      
      // Re-throw other errors
      console.log('❌ LN MARKETS POSITIONS - Re-throwing error:', error);
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
