/**
 * Exchange API Service Interface
 * 
 * Generic interface for exchange API services
 * Provides a common contract for all exchange integrations
 */

// Common types for exchange operations
export interface ExchangeCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  sandbox?: boolean;
}

export interface ExchangePosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  margin: number;
  maintenanceMargin: number;
  leverage: number;
  status: 'open' | 'closed' | 'liquidated';
  createdAt: Date;
  updatedAt: Date;
}

export interface ExchangeTicker {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: Date;
}

export interface ExchangeOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  size: number;
  price?: number;
  stopPrice?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  filledSize: number;
  averagePrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExchangeTrade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  size: number;
  price: number;
  fee: number;
  pnl?: number;
  timestamp: Date;
}

export interface ExchangeBalance {
  currency: string;
  available: number;
  locked: number;
  total: number;
}

export interface ExchangeUser {
  id: string;
  email: string;
  username?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface ExchangeDeposit {
  id: string;
  currency: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface ExchangeWithdrawal {
  id: string;
  currency: string;
  amount: number;
  address: string;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface ExchangeMarketData {
  symbol: string;
  price: number;
  volume24h: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  timestamp: Date;
}

export interface ExchangeHistoryOptions {
  symbol?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ExchangeOrderOptions {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  size: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK';
}

export interface ExchangeClosePositionOptions {
  positionId: string;
  size?: number; // If not provided, closes entire position
  price?: number; // For limit orders
}

export interface ExchangeApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface ExchangeApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

/**
 * Generic Exchange API Service Interface
 * 
 * This interface defines the contract that all exchange API services must implement.
 * It provides a common API for different exchanges while allowing for exchange-specific implementations.
 */
export interface ExchangeApiService {
  // Authentication
  validateCredentials(credentials: ExchangeCredentials): Promise<boolean>;
  
  // User operations
  getUser(): Promise<ExchangeApiResponse<ExchangeUser>>;
  getUserProfile(): Promise<ExchangeApiResponse<any>>; // LN Markets specific
  getUserBalance(): Promise<ExchangeApiResponse<ExchangeBalance[]>>;
  getUserDeposits(options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<ExchangeDeposit[]>>;
  getUserWithdrawals(options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<ExchangeWithdrawal[]>>;
  getUserHistory(options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<any[]>>; // LN Markets specific
  getUserOrders(options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<ExchangeOrder[]>>; // LN Markets specific
  
  // Position operations
  getPositions(symbol?: string): Promise<ExchangeApiResponse<ExchangePosition[]>>;
  getPosition(positionId: string): Promise<ExchangeApiResponse<ExchangePosition>>;
  closePosition(options: ExchangeClosePositionOptions): Promise<ExchangeApiResponse<ExchangeOrder>>;
  
  // Order operations
  getOrders(symbol?: string, status?: string): Promise<ExchangeApiResponse<ExchangeOrder[]>>;
  getOrder(orderId: string): Promise<ExchangeApiResponse<ExchangeOrder>>;
  placeOrder(options: ExchangeOrderOptions): Promise<ExchangeApiResponse<ExchangeOrder>>;
  cancelOrder(orderId: string): Promise<ExchangeApiResponse<boolean>>;
  cancelAllOrders(symbol?: string): Promise<ExchangeApiResponse<boolean>>;
  
  // Trade operations
  getTrades(symbol?: string, options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<ExchangeTrade[]>>;
  getTrade(tradeId: string): Promise<ExchangeApiResponse<ExchangeTrade>>;
  
  // Market data
  getTicker(symbol: string): Promise<ExchangeApiResponse<ExchangeTicker>>;
  getTickers(symbols?: string[]): Promise<ExchangeApiResponse<ExchangeTicker[]>>;
  getMarketData(symbol: string): Promise<ExchangeApiResponse<ExchangeMarketData>>;
  getMarketHistory(symbol: string, options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<ExchangeMarketData[]>>;
  
  // System operations
  getSystemStatus(): Promise<ExchangeApiResponse<{ status: string; message?: string }>>;
  getSystemHealth(): Promise<ExchangeApiResponse<{ healthy: boolean; services: Record<string, boolean> }>>;
  
  // Utility methods
  getExchangeName(): string;
  getExchangeVersion(): string;
  isSandbox(): boolean;
  getRateLimit(): Promise<ExchangeApiResponse<{ remaining: number; reset: Date }>>;
}

/**
 * Abstract base class for Exchange API Services
 * 
 * Provides common functionality and error handling for all exchange implementations.
 * Extend this class to implement specific exchange APIs.
 */
export abstract class BaseExchangeApiService implements ExchangeApiService {
  protected credentials: ExchangeCredentials;
  protected baseUrl: string;
  protected timeout: number;
  protected retries: number;

  constructor(credentials: ExchangeCredentials, baseUrl: string, timeout: number = 30000, retries: number = 3) {
    this.credentials = credentials;
    this.baseUrl = baseUrl;
    this.timeout = timeout;
    this.retries = retries;
  }

  // Abstract methods that must be implemented by subclasses
  abstract validateCredentials(credentials: ExchangeCredentials): Promise<boolean>;
  abstract getUser(): Promise<ExchangeApiResponse<ExchangeUser>>;
  abstract getUserProfile(): Promise<ExchangeApiResponse<any>>; // LN Markets specific
  abstract getUserBalance(): Promise<ExchangeApiResponse<ExchangeBalance[]>>;
  abstract getUserDeposits(options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<ExchangeDeposit[]>>;
  abstract getUserWithdrawals(options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<ExchangeWithdrawal[]>>;
  abstract getUserHistory(options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<any[]>>; // LN Markets specific
  abstract getUserOrders(options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<ExchangeOrder[]>>; // LN Markets specific
  abstract getPositions(symbol?: string): Promise<ExchangeApiResponse<ExchangePosition[]>>;
  abstract getPosition(positionId: string): Promise<ExchangeApiResponse<ExchangePosition>>;
  abstract closePosition(options: ExchangeClosePositionOptions): Promise<ExchangeApiResponse<ExchangeOrder>>;
  abstract getOrders(symbol?: string, status?: string): Promise<ExchangeApiResponse<ExchangeOrder[]>>;
  abstract getOrder(orderId: string): Promise<ExchangeApiResponse<ExchangeOrder>>;
  abstract placeOrder(options: ExchangeOrderOptions): Promise<ExchangeApiResponse<ExchangeOrder>>;
  abstract cancelOrder(orderId: string): Promise<ExchangeApiResponse<boolean>>;
  abstract cancelAllOrders(symbol?: string): Promise<ExchangeApiResponse<boolean>>;
  abstract getTrades(symbol?: string, options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<ExchangeTrade[]>>;
  abstract getTrade(tradeId: string): Promise<ExchangeApiResponse<ExchangeTrade>>;
  abstract getTicker(symbol: string): Promise<ExchangeApiResponse<ExchangeTicker>>;
  abstract getTickers(symbols?: string[]): Promise<ExchangeApiResponse<ExchangeTicker[]>>;
  abstract getMarketData(symbol: string): Promise<ExchangeApiResponse<ExchangeMarketData>>;
  abstract getMarketHistory(symbol: string, options?: ExchangeHistoryOptions): Promise<ExchangeApiResponse<ExchangeMarketData[]>>;
  abstract getSystemStatus(): Promise<ExchangeApiResponse<{ status: string; message?: string }>>;
  abstract getSystemHealth(): Promise<ExchangeApiResponse<{ healthy: boolean; services: Record<string, boolean> }>>;
  abstract getExchangeName(): string;
  abstract getExchangeVersion(): string;
  abstract isSandbox(): boolean;
  abstract getRateLimit(): Promise<ExchangeApiResponse<{ remaining: number; reset: Date }>>;

  // Common utility methods
  protected createSuccessResponse<T>(data: T): ExchangeApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date(),
    };
  }

  protected createErrorResponse(error: string, message?: string): ExchangeApiResponse {
    return {
      success: false,
      error,
      message,
      timestamp: new Date(),
    };
  }

  protected createApiError(code: string, message: string, details?: any): ExchangeApiError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
    };
  }

  protected async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.retries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}
