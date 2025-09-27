import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import { CircuitBreaker } from './circuit-breaker.service';
import { RetryService } from './retry.service';
import { Logger } from 'winston';

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

export interface LNMarketsPosition {
  uid: string;
  type: string;
  id: string;
  side: 'b' | 's';
  opening_fee: number;
  closing_fee: number;
  maintenance_margin: number;
  quantity: number;
  margin: number;
  leverage: number;
  price: number;
  liquidation: number;
  pl: number;
  creation_ts: number;
  market_filled_ts: number;
  closed_ts: number | null;
  entry_price: number;
  entry_margin: number;
  open: boolean;
  running: boolean;
  canceled: boolean;
  closed: boolean;
  sum_carry_fees: number;
  stoploss?: number;
  takeprofit?: number;
}

export interface LNMarketsUser {
  account_type: string;
  auto_withdraw_enabled: boolean;
  auto_withdraw_lightning_address: string | null;
  totp_enabled: boolean;
  webauthn_enabled: boolean;
  fee_tier: number;
  balance?: number;
  synthetic_usd_balance?: number;
  uid?: string;
  username?: string;
  role?: string;
  email?: string;
}

export interface LNMarketsTicker {
  index: number;
  lastPrice: number;
  askPrice: number;
  bidPrice: number;
  carryFeeRate: number;
  carryFeeTimestamp: number;
  exchangesWeights: Record<string, any>;
}

export interface LNMarketsMarket {
  active: boolean;
  limits: {
    quantity: { min: number; max: number };
    trade: number;
    leverage: { min: number; max: number };
    count: { max: number };
  };
  fees: {
    carry: { min: number; hours: number[] };
    trading: Array<{ minVolume: number; fees: number }>;
  };
}

export interface LNMarketsDeposit {
  id: string;
  amount: number;
  tx_id: string;
  is_confirmed: boolean;
  ts: number;
  type: string;
}

export interface LNMarketsWithdrawal {
  id: string;
  paymentHash: string;
  amount: number;
  fee: number;
  successTime: number;
}

export class LNMarketsAPIServiceV2 {
  private client: AxiosInstance;
  private credentials: LNMarketsCredentials;
  private baseURL: string;
  private circuitBreaker: CircuitBreaker;
  private retryService: RetryService;
  private logger: Logger;

  constructor(credentials: LNMarketsCredentials, logger: Logger) {
    console.log('🚀 LN MARKETS API V2 - Initializing service');
    console.log('🔐 LN MARKETS API V2 - Credentials:', {
      hasApiKey: !!credentials.apiKey,
      hasApiSecret: !!credentials.apiSecret,
      hasPassphrase: !!credentials.passphrase,
      isTestnet: credentials.isTestnet
    });
    
    this.credentials = credentials;
    this.baseURL = credentials.isTestnet 
      ? 'https://api.testnet4.lnmarkets.com/v2'
      : 'https://api.lnmarkets.com/v2';
    
    console.log('🌐 LN MARKETS API V2 - BaseURL:', this.baseURL);
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
    });

    // Initialize circuit breaker with conservative settings
    this.circuitBreaker = new CircuitBreaker({ 
      failureThreshold: 3, 
      recoveryTimeout: 30000,
      monitoringPeriod: 60000
    });
    this.retryService = new RetryService(logger);
    this.logger = logger;

    // Add request interceptor for authentication
    this.client.interceptors.request.use(this.authenticateRequest.bind(this) as any);
  }

  private authenticateRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    console.log('🔐 LN MARKETS API V2 - Authenticating request');
    
    const timestamp = Date.now().toString();
    const method = (config.method || 'GET').toUpperCase();
    const path = config.url || '';
    
    // Clean credentials to avoid invisible characters
    const apiKey = this.credentials.apiKey.trim();
    const apiSecret = this.credentials.apiSecret.trim();
    const passphrase = this.credentials.passphrase.trim();
    
    console.log('🔐 LN MARKETS API V2 - Request details:', {
      timestamp,
      method,
      path,
      baseURL: this.baseURL
    });
    
    // Prepare data for signature
    let params = '';
    
    if (method === 'GET' || method === 'DELETE') {
      if (config.params) {
        const sortedParams = new URLSearchParams(config.params).toString();
        params = sortedParams;
      }
    } else if (method === 'POST' || method === 'PUT') {
      if (config.data) {
        params = JSON.stringify(config.data);
      }
    }
    
    // Create signature string
    const signatureString = timestamp + method + path + params;
    console.log('🔐 LN MARKETS API V2 - Signature string:', signatureString);
    
    // Create HMAC signature
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(signatureString)
      .digest('base64');
    
    console.log('🔐 LN MARKETS API V2 - Generated signature:', signature);
    
    // Add authentication headers
    config.headers = {
      ...config.headers,
      'LNM-ACCESS-KEY': apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp,
      'Content-Type': 'application/json'
    };
    
    console.log('🔐 LN MARKETS API V2 - Headers set:', {
      'LNM-ACCESS-KEY': apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING',
      'LNM-ACCESS-SIGNATURE': signature ? `${signature.substring(0, 10)}...` : 'MISSING',
      'LNM-ACCESS-PASSPHRASE': passphrase ? `${passphrase.substring(0, 4)}...` : 'MISSING',
      'LNM-ACCESS-TIMESTAMP': timestamp
    });
    
    return config;
  }

  private async makeRequest(request: LNMarketsRequest): Promise<any> {
    console.log('🔄 LN MARKETS API V2 - Making request:', request);
    
    try {
      const response = await this.circuitBreaker.execute(async () => {
        return await this.retryService.executeWithRetry(async () => {
          const config: AxiosRequestConfig = {
            method: request.method,
            url: request.path,
            params: request.params,
            data: request.data
          };
          
          const response = await this.client.request(config);
          return response.data;
        });
      });
      
      console.log('✅ LN MARKETS API V2 - Request successful');
      return response;
    } catch (error: any) {
      console.error('❌ LN MARKETS API V2 - Request failed:', {
        message: error.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url
      });
      throw error;
    }
  }

  // User API Methods (LN Markets API v2)
  async getUser(): Promise<LNMarketsUser> {
    console.log('👤 LN MARKETS API V2 - Getting user info');
    return this.makeRequest({
      method: 'GET',
      path: '/user'
    });
  }

  async getUserBalance(): Promise<LNMarketsUser> {
    console.log('💰 LN MARKETS API V2 - Getting user balance (via /user endpoint)');
    // LN Markets API v2 doesn't have a separate balance endpoint
    // User balance is included in the /user endpoint
    return this.makeRequest({
      method: 'GET',
      path: '/user'
    });
  }

  // Positions API Methods (LN Markets API v2)
  async getUserPositions(type: 'running' | 'open' | 'closed' = 'running'): Promise<LNMarketsPosition[]> {
    console.log('📊 LN MARKETS API V2 - Getting user positions:', { type });
    return this.makeRequest({
      method: 'GET',
      path: '/futures',
      params: { type }
    });
  }

  async getPositionById(id: string): Promise<LNMarketsPosition> {
    console.log('📊 LN MARKETS API V2 - Getting position by ID:', id);
    return this.makeRequest({
      method: 'GET',
      path: `/futures/${id}`
    });
  }

  async closePosition(id: string): Promise<LNMarketsPosition> {
    console.log('❌ LN MARKETS API V2 - Closing position:', id);
    return this.makeRequest({
      method: 'DELETE',
      path: `/futures/${id}`
    });
  }

  async updateStopLossTakeProfit(id: string, stopLoss?: number, takeProfit?: number): Promise<LNMarketsPosition> {
    console.log('🎯 LN MARKETS API V2 - Updating stop loss/take profit:', { id, stopLoss, takeProfit });
    return this.makeRequest({
      method: 'PUT',
      path: `/futures/${id}/stop-loss-take-profit`,
      data: { stopLoss, takeProfit }
    });
  }

  async addMargin(id: string, amount: number): Promise<LNMarketsPosition> {
    console.log('➕ LN MARKETS API V2 - Adding margin:', { id, amount });
    return this.makeRequest({
      method: 'POST',
      path: `/futures/${id}/add-margin`,
      data: { amount }
    });
  }

  // Market Data API Methods (LN Markets API v2)
  async getTicker(): Promise<LNMarketsTicker> {
    console.log('📈 LN MARKETS API V2 - Getting ticker data');
    return this.makeRequest({
      method: 'GET',
      path: '/futures/btc_usd/ticker'
    });
  }

  async getMarketIndex(from: number, to: number, limit: number = 100): Promise<Array<{ time: number; value: number }>> {
    console.log('📊 LN MARKETS API V2 - Getting market index:', { from, to, limit });
    return this.makeRequest({
      method: 'GET',
      path: '/futures/btc_usd/index',
      params: { from, to, limit }
    });
  }

  async getMarketPrice(from: number, to: number, limit: number = 100): Promise<Array<{ time: number; value: number }>> {
    console.log('💰 LN MARKETS API V2 - Getting market price:', { from, to, limit });
    return this.makeRequest({
      method: 'GET',
      path: '/futures/btc_usd/price',
      params: { from, to, limit }
    });
  }

  async getMarketDetails(): Promise<LNMarketsMarket> {
    console.log('🏪 LN MARKETS API V2 - Getting market details');
    return this.makeRequest({
      method: 'GET',
      path: '/futures/market'
    });
  }

  async getCarryFees(from: number, to: number, limit: number = 100): Promise<Array<{ id: string; time: number; price: number; fee_rate: number }>> {
    console.log('💸 LN MARKETS API V2 - Getting carry fees:', { from, to, limit });
    return this.makeRequest({
      method: 'GET',
      path: '/futures/carry-fees',
      params: { from, to, limit }
    });
  }

  // Deposits and Withdrawals API Methods (LN Markets API v2)
  async getDeposits(types?: string): Promise<LNMarketsDeposit[]> {
    console.log('💳 LN MARKETS API V2 - Getting deposits:', { types });
    return this.makeRequest({
      method: 'GET',
      path: '/user/deposits',
      params: types ? { types } : {}
    });
  }

  async getDepositById(id: string): Promise<LNMarketsDeposit> {
    console.log('💳 LN MARKETS API V2 - Getting deposit by ID:', id);
    return this.makeRequest({
      method: 'GET',
      path: `/user/deposits/${id}`
    });
  }

  async createBitcoinDeposit(format: 'p2wpkh' | 'p2tr' = 'p2wpkh'): Promise<{ address: string; creation_ts: number }> {
    console.log('💳 LN MARKETS API V2 - Creating Bitcoin deposit:', { format });
    return this.makeRequest({
      method: 'POST',
      path: '/user/deposits/bitcoin',
      data: { format }
    });
  }

  async createLightningDeposit(amount: number): Promise<{ depositId: string; paymentRequest: string; expiry: number }> {
    console.log('⚡ LN MARKETS API V2 - Creating Lightning deposit:', { amount });
    return this.makeRequest({
      method: 'POST',
      path: '/user/deposits/lightning',
      data: { amount }
    });
  }

  async getWithdrawals(types?: string): Promise<LNMarketsWithdrawal[]> {
    console.log('💸 LN MARKETS API V2 - Getting withdrawals:', { types });
    return this.makeRequest({
      method: 'GET',
      path: '/user/withdrawals',
      params: types ? { types } : {}
    });
  }

  async getWithdrawalById(id: string): Promise<LNMarketsWithdrawal> {
    console.log('💸 LN MARKETS API V2 - Getting withdrawal by ID:', id);
    return this.makeRequest({
      method: 'GET',
      path: `/user/withdrawals/${id}`
    });
  }

  async createWithdrawal(invoice: string): Promise<LNMarketsWithdrawal> {
    console.log('💸 LN MARKETS API V2 - Creating withdrawal:', { invoice: invoice.substring(0, 50) + '...' });
    return this.makeRequest({
      method: 'POST',
      path: '/user/withdrawals',
      data: { invoice }
    });
  }

  // Legacy methods for backward compatibility
  async getUserTrades(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    type?: string;
  }): Promise<any[]> {
    console.log('📈 LN MARKETS API V2 - Getting user trades (legacy method)');
    // LN Markets API v2 doesn't have a separate trades endpoint
    // Trades are included in positions or history
    return [];
  }

  async getUserOrders(): Promise<any[]> {
    console.log('📋 LN MARKETS API V2 - Getting user orders (legacy method)');
    // LN Markets API v2 doesn't have a separate orders endpoint
    // Orders are included in positions
    return [];
  }

  async getUserHistory(params?: {
    limit?: number;
    offset?: number;
    type?: string;
  }): Promise<any[]> {
    console.log('📚 LN MARKETS API V2 - Getting user history (legacy method)');
    // LN Markets API v2 doesn't have a separate history endpoint
    // History can be reconstructed from positions and deposits/withdrawals
    return [];
  }

  async getMarketData(): Promise<any> {
    console.log('📊 LN MARKETS API V2 - Getting market data (legacy method)');
    const ticker = await this.getTicker();
    const market = await this.getMarketDetails();
    
    return {
      symbol: 'BTCUSD',
      price: ticker.lastPrice || ticker.index,
      change24h: 0,
      changePercent24h: 0,
      volume24h: 0,
      high24h: ticker.lastPrice || ticker.index,
      low24h: ticker.lastPrice || ticker.index,
      timestamp: Date.now(),
      source: 'lnmarkets',
      rawData: ticker,
      market: market
    };
  }
}
