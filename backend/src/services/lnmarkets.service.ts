import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { config } from '@/config/env';

export interface LNMarketsUser {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface LNMarketsPosition {
  id: string;
  side: 'long' | 'short';
  size: number;
  entry_price: number;
  current_price: number;
  margin: number;
  margin_ratio: number;
  pnl: number;
  created_at: string;
}

export interface LNMarketsBalance {
  balance: number;
  margin: number;
  available_balance: number;
  margin_ratio: number;
}

export interface LNMarketsTrade {
  id: string;
  side: 'buy' | 'sell';
  size: number;
  price: number;
  fee: number;
  created_at: string;
}

export class LNMarketsService {
  private api: AxiosInstance;
  private apiKey: string;
  private apiSecret: string;

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;

    this.api = axios.create({
      baseURL: config.lnMarkets.apiUrl,
      timeout: config.lnMarkets.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.api.interceptors.request.use((config) => {
      if (this.apiKey && this.apiSecret) {
        config.headers['X-API-Key'] = this.apiKey;
        config.headers['X-API-Secret'] = this.apiSecret;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // API returned an error response
          const { status, data } = error.response;
          throw new Error(`LN Markets API Error ${status}: ${data.message || data.error || 'Unknown error'}`);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('LN Markets API: No response received');
        } else {
          // Something else happened
          throw new Error(`LN Markets API: ${error.message}`);
        }
      }
    );
  }

  /**
   * Validate API keys by making a test request
   */
  async validateKeys(): Promise<boolean> {
    try {
      await this.getUserInfo();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(): Promise<LNMarketsUser> {
    try {
      const response: AxiosResponse<LNMarketsUser> = await this.api.get('/user');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get user info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user balance and margin information
   */
  async getBalance(): Promise<LNMarketsBalance> {
    try {
      const response: AxiosResponse<LNMarketsBalance> = await this.api.get('/balance');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user positions
   */
  async getPositions(): Promise<LNMarketsPosition[]> {
    try {
      const response: AxiosResponse<LNMarketsPosition[]> = await this.api.get('/positions');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get positions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user trade history
   */
  async getTradeHistory(limit: number = 100, offset: number = 0): Promise<LNMarketsTrade[]> {
    try {
      const response: AxiosResponse<LNMarketsTrade[]> = await this.api.get('/trades', {
        params: { limit, offset },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get trade history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new position (long or short)
   */
  async createPosition(
    side: 'long' | 'short',
    size: number,
    leverage: number = 1
  ): Promise<LNMarketsPosition> {
    try {
      const response: AxiosResponse<LNMarketsPosition> = await this.api.post('/positions', {
        side,
        size,
        leverage,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create position: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Close a position
   */
  async closePosition(positionId: string): Promise<LNMarketsTrade> {
    try {
      const response: AxiosResponse<LNMarketsTrade> = await this.api.post(`/positions/${positionId}/close`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to close position: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Close all positions
   */
  async closeAllPositions(): Promise<LNMarketsTrade[]> {
    try {
      const response: AxiosResponse<LNMarketsTrade[]> = await this.api.post('/positions/close-all');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to close all positions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add margin to a position
   */
  async addMargin(positionId: string, amount: number): Promise<LNMarketsPosition> {
    try {
      const response: AxiosResponse<LNMarketsPosition> = await this.api.post(`/positions/${positionId}/margin`, {
        amount,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to add margin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get current Bitcoin price
   */
  async getCurrentPrice(): Promise<number> {
    try {
      const response: AxiosResponse<{ price: number }> = await this.api.get('/price');
      return response.data.price;
    } catch (error) {
      throw new Error(`Failed to get current price: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get price history
   */
  async getPriceHistory(
    timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h',
    limit: number = 100
  ): Promise<Array<{ timestamp: string; price: number }>> {
    try {
      const response: AxiosResponse<Array<{ timestamp: string; price: number }>> = await this.api.get('/price/history', {
        params: { timeframe, limit },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get price history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if user is at risk of liquidation
   */
  async isAtRiskOfLiquidation(threshold: number = 0.8): Promise<{
    isAtRisk: boolean;
    marginRatio: number;
    positions: LNMarketsPosition[];
  }> {
    try {
      const [balance, positions] = await Promise.all([
        this.getBalance(),
        this.getPositions(),
      ]);

      const isAtRisk = balance.margin_ratio >= threshold;
      const riskyPositions = positions.filter(pos => pos.margin_ratio >= threshold);

      return {
        isAtRisk,
        marginRatio: balance.margin_ratio,
        positions: riskyPositions,
      };
    } catch (error) {
      throw new Error(`Failed to check liquidation risk: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute margin guard protection
   */
  async executeMarginGuard(threshold: number = 0.8): Promise<{
    executed: boolean;
    action: 'closed_positions' | 'added_margin' | 'no_action';
    details: any;
  }> {
    try {
      const riskCheck = await this.isAtRiskOfLiquidation(threshold);

      if (!riskCheck.isAtRisk) {
        return {
          executed: false,
          action: 'no_action',
          details: { marginRatio: riskCheck.marginRatio },
        };
      }

      // Close all positions if margin ratio is critical
      if (riskCheck.marginRatio >= 0.95) {
        const closedPositions = await this.closeAllPositions();
        return {
          executed: true,
          action: 'closed_positions',
          details: { closedPositions, marginRatio: riskCheck.marginRatio },
        };
      }

      // Try to add margin if possible
      const balance = await this.getBalance();
      if (balance.available_balance > 0) {
        // Add 50% of available balance as margin
        const marginToAdd = balance.available_balance * 0.5;
        
        // Add margin to the most risky position
        const mostRiskyPosition = riskCheck.positions.reduce((prev, current) => 
          prev.margin_ratio > current.margin_ratio ? prev : current
        );

        const updatedPosition = await this.addMargin(mostRiskyPosition.id, marginToAdd);
        
        return {
          executed: true,
          action: 'added_margin',
          details: { 
            positionId: mostRiskyPosition.id, 
            marginAdded: marginToAdd,
            updatedPosition,
            marginRatio: riskCheck.marginRatio,
          },
        };
      }

      // If we can't add margin, close positions
      const closedPositions = await this.closeAllPositions();
      return {
        executed: true,
        action: 'closed_positions',
        details: { closedPositions, marginRatio: riskCheck.marginRatio },
      };
    } catch (error) {
      throw new Error(`Failed to execute margin guard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<{
    connected: boolean;
    latency: number;
    user?: LNMarketsUser;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const user = await this.getUserInfo();
      const latency = Date.now() - startTime;
      
      return {
        connected: true,
        latency,
        user,
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      
      return {
        connected: false,
        latency,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
