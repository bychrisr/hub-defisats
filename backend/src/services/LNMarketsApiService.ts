/**
 * LN Markets API Service Implementation
 * 
 * Implements the ExchangeApiService interface for LN Markets API v2
 * Provides a clean, standardized interface for all LN Markets operations
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as crypto from 'crypto';
import { Logger } from 'winston';
import { 
  ExchangeApiService, 
  ExchangeCredentials, 
  ExchangeApiResponse,
  ExchangePosition,
  ExchangeTicker,
  ExchangeOrder,
  ExchangeTrade,
  ExchangeBalance,
  ExchangeUser,
  ExchangeDeposit,
  ExchangeWithdrawal,
  ExchangeMarketData,
  ExchangeHistoryOptions,
  ExchangeOrderOptions,
  ExchangeClosePositionOptions,
  BaseExchangeApiService
} from './ExchangeApiService.interface';
import { LN_MARKETS_ENDPOINTS, getLNMarketsEndpoint } from '../config/lnmarkets-endpoints';
import { CircuitBreaker } from './circuit-breaker.service';
import { RetryService } from './retry.service';

export interface LNMarketsCredentials extends ExchangeCredentials {
  passphrase: string;
  isTestnet?: boolean;
}

export class LNMarketsApiService extends BaseExchangeApiService {
  private client: AxiosInstance;
  private baseURL: string;
  private circuitBreaker: CircuitBreaker;
  private retryService: RetryService;
  private logger: Logger;

  constructor(credentials: LNMarketsCredentials, logger: Logger) {
    super(credentials, '', 30000, 3);
    
    this.credentials = credentials;
    this.baseURL = credentials.isTestnet 
      ? 'https://api.testnet4.lnmarkets.com/v2'
      : 'https://api.lnmarkets.com/v2';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
    });

    // Initialize circuit breaker with 5 failures threshold and 60s timeout
    this.circuitBreaker = new CircuitBreaker({ 
      failureThreshold: 5, 
      recoveryTimeout: 60000,
      monitoringPeriod: 60000
    });
    this.retryService = new RetryService(logger);
    this.logger = logger;

    // Add request interceptor for authentication
    this.client.interceptors.request.use(this.authenticateRequest.bind(this) as any);
  }

  /**
   * Authenticate request with LN Markets API v2
   * Implements HMAC-SHA256 signature as required by LN Markets
   */
  private authenticateRequest(config: AxiosRequestConfig): AxiosRequestConfig {
    const timestamp = Date.now().toString();
    const method = (config.method || 'GET').toUpperCase();
    const path = config.url || '';  // CORREÇÃO: Não duplicar /v2, baseURL já inclui
    
    // Clean credentials to avoid spaces/invisible characters
    const apiKey = this.credentials.apiKey.trim();
    const apiSecret = this.credentials.apiSecret.trim();
    const passphrase = this.credentials.passphrase.trim();
    
    // Prepare data for signature
    let params = '';
    
    if (method === 'GET' || method === 'DELETE') {
      // For GET/DELETE, params should be query string for signature
      if (config.params) {
        params = new URLSearchParams(config.params).toString();
      }
    } else if (config.data) {
      // For POST/PUT, params should be JSON string
      params = JSON.stringify(config.data);
    }
    
    // Create signature using: timestamp + method + path + params
    const message = timestamp + method + path + params;
    
    // Generate signature with UTF-8 explicit - LN Markets API v2 requires BASE64
    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(message, 'utf8')
      .digest('base64');

    // Add headers
    config.headers = {
      ...config.headers,
      'LNM-ACCESS-KEY': apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp,
    };
    
    // Set content type for POST/PUT requests
    if (method === 'POST' || method === 'PUT') {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  }

  /**
   * Make authenticated request to LN Markets API
   */
  private async makeAuthenticatedRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    params?: any
  ): Promise<T> {
    try {
      // Use circuit breaker to protect against API failures
      const result = await this.circuitBreaker.execute(async () => {
        return await this.retryService.executeApiOperation(async () => {
          this.logger.debug(`[LNMarketsAPI] Making ${method} request to ${endpoint}`, {
            data,
            params,
            fullURL: `${this.baseURL}${endpoint}`
          });

          const response = await this.client.request({
            method,
            url: endpoint,
            data,
            params,
          });

          this.logger.debug(`[LNMarketsAPI] Request successful:`, {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
            headers: response.headers
          });

          // LN Markets API returns data directly, not wrapped in an object
          return response.data;
        }, `LNMarkets-${method}-${endpoint}`, {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000,
          backoffMultiplier: 2,
          jitter: true
        });
      });

      return result;
    } catch (error: any) {
      this.logger.error(`[LNMarketsAPI] Request failed:`, {
        method,
        endpoint,
        fullURL: `${this.baseURL}${endpoint}`,
        error: error?.response?.data || error?.message || 'Unknown error',
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        headers: error?.response?.headers,
        config: {
          method: error?.config?.method,
          url: error?.config?.url,
          params: error?.config?.params,
          data: error?.config?.data,
          headers: error?.config?.headers
        }
      });
      throw error;
    }
  }

  // Authentication
  async validateCredentials(credentials: ExchangeCredentials): Promise<boolean> {
    try {
      // Allow test credentials for development
      if (credentials.apiKey.startsWith('test-') || credentials.apiKey.startsWith('dummy-')) {
        this.logger.debug('Test credentials detected, skipping validation');
        return true;
      }
      
      // Try to get user info to validate credentials
      await this.getUser();
      this.logger.debug('Credentials are valid');
      return true;
    } catch (error: any) {
      this.logger.error('Credentials validation failed:', {
        status: error?.response?.status,
        message: error?.message,
        data: error?.response?.data
      });
      return false;
    }
  }

  // User operations
  async getUser(): Promise<ExchangeApiResponse<ExchangeUser>> {
    try {
      const data = await this.makeAuthenticatedRequest('GET', getLNMarketsEndpoint('user'));
      
      const user: ExchangeUser = {
        id: data.uid || data.id || 'unknown',
        email: data.email || '',
        username: data.username || '',
        isActive: data.role !== 'banned',
        createdAt: new Date(data.created_at || Date.now())
      };

      return this.createSuccessResponse(user);
    } catch (error: any) {
      return this.createErrorResponse('USER_FETCH_FAILED', error.message);
    }
  }

  async getUserProfile(): Promise<ExchangeApiResponse<any>> {
    try {
      const data = await this.makeAuthenticatedRequest('GET', getLNMarketsEndpoint('user'));
      return this.createSuccessResponse(data);
    } catch (error: any) {
      return this.createErrorResponse('USER_PROFILE_FETCH_FAILED', error.message);
    }
  }

  async getUserHistory(options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (options?.symbol) params.append('symbol', options.symbol);
      if (options?.startDate) params.append('start_date', options.startDate.toISOString());
      if (options?.endDate) params.append('end_date', options.endDate.toISOString());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const data = await this.makeAuthenticatedRequest('GET', `${getLNMarketsEndpoint('user')}/history?${params.toString()}`);
      return this.createSuccessResponse(data);
    } catch (error: any) {
      return this.createErrorResponse('USER_HISTORY_FETCH_FAILED', error.message);
    }
  }

  async getUserOrders(options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<ExchangeOrder[]>> {
    try {
      const params = new URLSearchParams();
      if (options?.symbol) params.append('symbol', options.symbol);
      if (options?.startDate) params.append('start_date', options.startDate.toISOString());
      if (options?.endDate) params.append('end_date', options.endDate.toISOString());
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const data = await this.makeAuthenticatedRequest('GET', `${getLNMarketsEndpoint('user')}/orders?${params.toString()}`);
      
      const orders: ExchangeOrder[] = data.map((order: any) => ({
        id: order.id,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        size: order.size,
        price: order.price,
        stopPrice: order.stop_price,
        status: order.status,
        filledSize: order.filled_size || 0,
        averagePrice: order.average_price,
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at)
      }));

      return this.createSuccessResponse(orders);
    } catch (error: any) {
      return this.createErrorResponse('USER_ORDERS_FETCH_FAILED', error.message);
    }
  }

  async getUserBalance(): Promise<ExchangeApiResponse<ExchangeBalance[]>> {
    try {
      const data = await this.makeAuthenticatedRequest('GET', getLNMarketsEndpoint('user'));
      
      const balance: ExchangeBalance = {
        currency: 'BTC',
        available: data.balance || 0,
        locked: 0,
        total: data.balance || 0
      };

      return this.createSuccessResponse([balance]);
    } catch (error: any) {
      return this.createErrorResponse('BALANCE_FETCH_FAILED', error.message);
    }
  }

  async getUserDeposits(options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<ExchangeDeposit[]>> {
    try {
      const data = await this.makeAuthenticatedRequest('GET', getLNMarketsEndpoint('userDeposits'), undefined, {
        limit: options?.limit || 100,
        offset: options?.offset || 0
      });

      const deposits: ExchangeDeposit[] = Array.isArray(data) ? data.map((deposit: any) => ({
        id: deposit.id || deposit.tx_hash || 'unknown',
        currency: 'BTC',
        amount: deposit.amount || 0,
        status: deposit.status === 'confirmed' ? 'confirmed' : 'pending',
        txHash: deposit.tx_hash,
        createdAt: new Date(deposit.created_at || Date.now()),
        confirmedAt: deposit.status === 'confirmed' ? new Date(deposit.updated_at || Date.now()) : undefined
      })) : [];

      return this.createSuccessResponse(deposits);
    } catch (error: any) {
      // Return empty array for optional endpoints
      return this.createSuccessResponse([]);
    }
  }

  async getUserWithdrawals(options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<ExchangeWithdrawal[]>> {
    try {
      const data = await this.makeAuthenticatedRequest('GET', getLNMarketsEndpoint('userWithdrawals'), undefined, {
        limit: options?.limit || 100,
        offset: options?.offset || 0
      });

      const withdrawals: ExchangeWithdrawal[] = Array.isArray(data) ? data.map((withdrawal: any) => ({
        id: withdrawal.id || withdrawal.tx_hash || 'unknown',
        currency: 'BTC',
        amount: withdrawal.amount || 0,
        address: withdrawal.address || '',
        status: withdrawal.status === 'confirmed' ? 'confirmed' : 'pending',
        txHash: withdrawal.tx_hash,
        createdAt: new Date(withdrawal.created_at || Date.now()),
        confirmedAt: withdrawal.status === 'confirmed' ? new Date(withdrawal.updated_at || Date.now()) : undefined
      })) : [];

      return this.createSuccessResponse(withdrawals);
    } catch (error: any) {
      // Return empty array for optional endpoints
      return this.createSuccessResponse([]);
    }
  }

  // Position operations
  async getPositions(symbol?: string): Promise<ExchangeApiResponse<ExchangePosition[]>> {
    try {
      const data = await this.makeAuthenticatedRequest('GET', getLNMarketsEndpoint('futures'), undefined, {
        type: 'running'
      });

      const positions: ExchangePosition[] = Array.isArray(data) ? data.map((position: any) => ({
        id: position.id || 'unknown',
        symbol: 'BTCUSD',
        side: position.side === 'b' ? 'long' : 'short',
        size: position.quantity || 0,
        entryPrice: position.price || 0,
        currentPrice: position.current_price || position.price || 0,
        pnl: position.pl || 0,
        margin: position.margin || 0,
        maintenanceMargin: position.maintenance_margin || 0,
        leverage: position.leverage || 1,
        status: position.status === 'open' ? 'open' : 'closed',
        createdAt: new Date(position.created_at || Date.now()),
        updatedAt: new Date(position.updated_at || Date.now())
      })) : [];

      return this.createSuccessResponse(positions);
    } catch (error: any) {
      return this.createErrorResponse('POSITIONS_FETCH_FAILED', error.message);
    }
  }

  async getPosition(positionId: string): Promise<ExchangeApiResponse<ExchangePosition>> {
    try {
      const data = await this.makeAuthenticatedRequest('GET', `${getLNMarketsEndpoint('futures')}/${positionId}`);
      
      const position: ExchangePosition = {
        id: data.id || 'unknown',
        symbol: 'BTCUSD',
        side: data.side === 'b' ? 'long' : 'short',
        size: data.quantity || 0,
        entryPrice: data.price || 0,
        currentPrice: data.current_price || data.price || 0,
        pnl: data.pl || 0,
        margin: data.margin || 0,
        maintenanceMargin: data.maintenance_margin || 0,
        leverage: data.leverage || 1,
        status: data.status === 'open' ? 'open' : 'closed',
        createdAt: new Date(data.created_at || Date.now()),
        updatedAt: new Date(data.updated_at || Date.now())
      };

      return this.createSuccessResponse(position);
    } catch (error: any) {
      return this.createErrorResponse('POSITION_FETCH_FAILED', error.message);
    }
  }

  async closePosition(options: ExchangeClosePositionOptions): Promise<ExchangeApiResponse<ExchangeOrder>> {
    try {
      const data = await this.makeAuthenticatedRequest('POST', `${getLNMarketsEndpoint('futuresClose')}/${options.positionId}`, {
        size: options.size
      });

      const order: ExchangeOrder = {
        id: data.id || 'unknown',
        symbol: 'BTCUSD',
        side: 'sell',
        type: 'market',
        size: options.size || 0,
        status: 'filled',
        filledSize: options.size || 0,
        averagePrice: data.price || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return this.createSuccessResponse(order);
    } catch (error: any) {
      return this.createErrorResponse('POSITION_CLOSE_FAILED', error.message);
    }
  }

  // Order operations
  async getOrders(symbol?: string, status?: string): Promise<ExchangeApiResponse<ExchangeOrder[]>> {
    try {
      const data = await this.makeAuthenticatedRequest('GET', getLNMarketsEndpoint('futuresTrades'), undefined, {
        status: status || 'open'
      });

      const orders: ExchangeOrder[] = Array.isArray(data) ? data.map((order: any) => ({
        id: order.id || 'unknown',
        symbol: 'BTCUSD',
        side: order.side === 'b' ? 'buy' : 'sell',
        type: 'market',
        size: order.quantity || 0,
        price: order.price || 0,
        status: order.status === 'open' ? 'pending' : 'filled',
        filledSize: order.filled_quantity || 0,
        averagePrice: order.average_price || order.price || 0,
        createdAt: new Date(order.created_at || Date.now()),
        updatedAt: new Date(order.updated_at || Date.now())
      })) : [];

      return this.createSuccessResponse(orders);
    } catch (error: any) {
      return this.createErrorResponse('ORDERS_FETCH_FAILED', error.message);
    }
  }

  async getOrder(orderId: string): Promise<ExchangeApiResponse<ExchangeOrder>> {
    try {
      const data = await this.makeAuthenticatedRequest('GET', `${getLNMarketsEndpoint('futuresTrades')}/${orderId}`);
      
      const order: ExchangeOrder = {
        id: data.id || 'unknown',
        symbol: 'BTCUSD',
        side: data.side === 'b' ? 'buy' : 'sell',
        type: 'market',
        size: data.quantity || 0,
        price: data.price || 0,
        status: data.status === 'open' ? 'pending' : 'filled',
        filledSize: data.filled_quantity || 0,
        averagePrice: data.average_price || data.price || 0,
        createdAt: new Date(data.created_at || Date.now()),
        updatedAt: new Date(data.updated_at || Date.now())
      };

      return this.createSuccessResponse(order);
    } catch (error: any) {
      return this.createErrorResponse('ORDER_FETCH_FAILED', error.message);
    }
  }

  async placeOrder(options: ExchangeOrderOptions): Promise<ExchangeApiResponse<ExchangeOrder>> {
    try {
      const data = await this.makeAuthenticatedRequest('POST', getLNMarketsEndpoint('futuresNewTrade'), {
        side: options.side === 'buy' ? 'b' : 's',
        quantity: options.size,
        leverage: 10, // Default leverage
        stoploss: options.stopPrice,
        takeprofit: options.price
      });

      const order: ExchangeOrder = {
        id: data.id || 'unknown',
        symbol: options.symbol,
        side: options.side,
        type: options.type,
        size: options.size,
        price: options.price,
        stopPrice: options.stopPrice,
        status: 'pending',
        filledSize: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return this.createSuccessResponse(order);
    } catch (error: any) {
      return this.createErrorResponse('ORDER_PLACE_FAILED', error.message);
    }
  }

  async cancelOrder(orderId: string): Promise<ExchangeApiResponse<boolean>> {
    try {
      await this.makeAuthenticatedRequest('DELETE', `${getLNMarketsEndpoint('futuresTrades')}/${orderId}`);
      return this.createSuccessResponse(true);
    } catch (error: any) {
      return this.createErrorResponse('ORDER_CANCEL_FAILED', error.message);
    }
  }

  async cancelAllOrders(symbol?: string): Promise<ExchangeApiResponse<boolean>> {
    try {
      await this.makeAuthenticatedRequest('POST', getLNMarketsEndpoint('futures'));
      return this.createSuccessResponse(true);
    } catch (error: any) {
      return this.createErrorResponse('ORDERS_CANCEL_FAILED', error.message);
    }
  }

  // Trade operations
  async getTrades(symbol?: string, options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<ExchangeTrade[]>> {
    try {
      const data = await this.makeAuthenticatedRequest('GET', getLNMarketsEndpoint('futuresTrades'), undefined, {
        type: 'closed',
        limit: options?.limit || 100,
        offset: options?.offset || 0
      });

      const trades: ExchangeTrade[] = Array.isArray(data) ? data.map((trade: any) => ({
        id: trade.id || 'unknown',
        symbol: 'BTCUSD',
        side: trade.side === 'b' ? 'buy' : 'sell',
        size: trade.quantity || 0,
        price: trade.price || 0,
        fee: trade.fee || 0,
        pnl: trade.pl || 0,
        timestamp: new Date(trade.created_at || Date.now())
      })) : [];

      return this.createSuccessResponse(trades);
    } catch (error: any) {
      return this.createErrorResponse('TRADES_FETCH_FAILED', error.message);
    }
  }

  async getTrade(tradeId: string): Promise<ExchangeApiResponse<ExchangeTrade>> {
    try {
      const data = await this.makeAuthenticatedRequest('GET', `${getLNMarketsEndpoint('futuresTrades')}/${tradeId}`);
      
      const trade: ExchangeTrade = {
        id: data.id || 'unknown',
        symbol: 'BTCUSD',
        side: data.side === 'b' ? 'buy' : 'sell',
        size: data.quantity || 0,
        price: data.price || 0,
        fee: data.fee || 0,
        pnl: data.pl || 0,
        timestamp: new Date(data.created_at || Date.now())
      };

      return this.createSuccessResponse(trade);
    } catch (error: any) {
      return this.createErrorResponse('TRADE_FETCH_FAILED', error.message);
    }
  }

  // Market data
  async getTicker(symbol: string): Promise<ExchangeApiResponse<ExchangeTicker>> {
    try {
      const data = await this.makeAuthenticatedRequest('GET', getLNMarketsEndpoint('futuresTicker'));
      
      const ticker: ExchangeTicker = {
        symbol: 'BTCUSD',
        price: data.lastPrice || data.index || 0,
        change24h: 0, // LN Markets doesn't provide 24h change in ticker
        changePercent24h: 0, // LN Markets doesn't provide 24h change % in ticker
        volume24h: 0, // LN Markets doesn't provide volume in ticker
        high24h: data.lastPrice || data.index || 0,
        low24h: data.lastPrice || data.index || 0,
        timestamp: new Date()
      };

      return this.createSuccessResponse(ticker);
    } catch (error: any) {
      return this.createErrorResponse('TICKER_FETCH_FAILED', error.message);
    }
  }

  async getTickers(symbols?: string[]): Promise<ExchangeApiResponse<ExchangeTicker[]>> {
    try {
      const ticker = await this.getTicker('BTCUSD');
      if (!ticker.success) {
        return this.createErrorResponse('TICKERS_FETCH_FAILED', ticker.error || 'Failed to fetch ticker');
      }
      
      return this.createSuccessResponse([ticker.data!]);
    } catch (error: any) {
      return this.createErrorResponse('TICKERS_FETCH_FAILED', error.message);
    }
  }

  async getMarketData(symbol: string): Promise<ExchangeApiResponse<ExchangeMarketData>> {
    try {
      const data = await this.makeAuthenticatedRequest('GET', getLNMarketsEndpoint('futuresTicker'));
      
      const marketData: ExchangeMarketData = {
        symbol: 'BTCUSD',
        price: data.lastPrice || data.index || 0,
        volume24h: 0, // LN Markets doesn't provide volume
        change24h: 0, // LN Markets doesn't provide 24h change
        changePercent24h: 0, // LN Markets doesn't provide 24h change %
        high24h: data.lastPrice || data.index || 0,
        low24h: data.lastPrice || data.index || 0,
        timestamp: new Date()
      };

      return this.createSuccessResponse(marketData);
    } catch (error: any) {
      return this.createErrorResponse('MARKET_DATA_FETCH_FAILED', error.message);
    }
  }

  async getMarketHistory(symbol: string, options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<ExchangeMarketData[]>> {
    try {
      const data = await this.makeAuthenticatedRequest('GET', getLNMarketsEndpoint('futuresHistory'), undefined, {
        limit: options?.limit || 100,
        offset: options?.offset || 0
      });

      const history: ExchangeMarketData[] = Array.isArray(data) ? data.map((item: any) => ({
        symbol: 'BTCUSD',
        price: item.price || 0,
        volume24h: 0,
        change24h: 0,
        changePercent24h: 0,
        high24h: item.high || item.price || 0,
        low24h: item.low || item.price || 0,
        timestamp: new Date(item.timestamp || Date.now())
      })) : [];

      return this.createSuccessResponse(history);
    } catch (error: any) {
      return this.createErrorResponse('MARKET_HISTORY_FETCH_FAILED', error.message);
    }
  }

  // System operations
  async getSystemStatus(): Promise<ExchangeApiResponse<{ status: string; message?: string }>> {
    try {
      await this.makeAuthenticatedRequest('GET', getLNMarketsEndpoint('systemStatus'));
      return this.createSuccessResponse({ status: 'operational' });
    } catch (error: any) {
      return this.createSuccessResponse({ status: 'degraded', message: error.message });
    }
  }

  async getSystemHealth(): Promise<ExchangeApiResponse<{ healthy: boolean; services: Record<string, boolean> }>> {
    try {
      await this.makeAuthenticatedRequest('GET', getLNMarketsEndpoint('systemHealth'));
      return this.createSuccessResponse({ 
        healthy: true, 
        services: { 
          api: true, 
          trading: true, 
          market_data: true 
        } 
      });
    } catch (error: any) {
      return this.createSuccessResponse({ 
        healthy: false, 
        services: { 
          api: false, 
          trading: false, 
          market_data: false 
        } 
      });
    }
  }

  // Utility methods
  getExchangeName(): string {
    return 'LN Markets';
  }

  getExchangeVersion(): string {
    return '2.0';
  }

  isSandbox(): boolean {
    return (this.credentials as LNMarketsCredentials).isTestnet || false;
  }

  async getRateLimit(): Promise<ExchangeApiResponse<{ remaining: number; reset: Date }>> {
    // LN Markets doesn't provide rate limit info in response headers
    // Return default values
    return this.createSuccessResponse({
      remaining: 100,
      reset: new Date(Date.now() + 60000) // Reset in 1 minute
    });
  }

  // Legacy methods for backward compatibility
  async getUserPositions(type: 'running' | 'open' | 'closed' = 'running') {
    console.log('🔍 LN MARKETS POSITIONS - Starting getUserPositions (Legacy)');
    console.log('🔍 LN MARKETS POSITIONS - Service credentials:', {
      apiKey: this.credentials.apiKey ? `${this.credentials.apiKey.substring(0, 10)}...` : 'MISSING',
      apiSecret: this.credentials.apiSecret ? `${this.credentials.apiSecret.substring(0, 10)}...` : 'MISSING',
      passphrase: this.credentials.passphrase ? `${this.credentials.passphrase.substring(0, 5)}...` : 'MISSING',
      isTestnet: (this.credentials as LNMarketsCredentials).isTestnet,
      baseURL: this.baseURL
    });
    
    try {
      console.log('🔍 LN MARKETS POSITIONS - Attempting to get user positions from /futures');
      // Usar makeAuthenticatedRequest diretamente como no sistema antigo
      const result = await this.makeAuthenticatedRequest('GET', '/futures', undefined, {
        type: 'running'
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
      
      return result; // Retornar dados diretamente como no sistema antigo
    } catch (error: any) {
      console.log('⚠️ LN MARKETS POSITIONS - Error getting user positions:', {
        message: error.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        fullError: error
      });
      
      // If endpoint doesn't exist (404) or returns empty, return empty array
      if (error?.response?.status === 404 || error?.message?.includes('404')) {
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
}
