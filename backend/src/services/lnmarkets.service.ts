import axios, { AxiosInstance } from 'axios';

export interface LNMarketsCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface MarginInfo {
  margin: number;
  availableMargin: number;
  marginLevel: number;
  totalValue: number;
  totalUnrealizedPnl: number;
  positions: any[];
}

export interface Position {
  id: string;
  market: string;
  side: 'b' | 's';
  size: number;
  entryPrice: number;
  liquidationPrice: number;
  unrealizedPnl: number;
}

export class LNMarketsService {
  private client: AxiosInstance;
  private credentials: LNMarketsCredentials;

  constructor(credentials: LNMarketsCredentials) {
    this.credentials = credentials;

    this.client = axios.create({
      baseURL: 'https://api.lnmarkets.com/v2',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${credentials.apiKey}:${credentials.apiSecret}`
      },
      timeout: 10000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('LN Markets API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  /**
   * Get user margin information
   */
  async getMarginInfo(): Promise<MarginInfo> {
    try {
      const response = await this.client.get('/futures/user/margin');
      return response.data;
    } catch (error) {
      console.error('Error fetching margin info:', error);
      throw new Error('Failed to fetch margin information');
    }
  }

  /**
   * Get user positions
   */
  async getPositions(): Promise<Position[]> {
    try {
      const response = await this.client.get('/futures/user/positions');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw new Error('Failed to fetch positions');
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<any> {
    try {
      const response = await this.client.get('/futures/user/balance');
      return response.data;
    } catch (error) {
      console.error('Error fetching balance:', error);
      throw new Error('Failed to fetch balance');
    }
  }

  /**
   * Validate API credentials
   */
  async validateCredentials(): Promise<boolean> {
    try {
      await this.getBalance();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Close position by ID
   */
  async closePosition(positionId: string): Promise<any> {
    try {
      const response = await this.client.post(`/futures/position/${positionId}/close`);
      return response.data;
    } catch (error) {
      console.error('Error closing position:', error);
      throw new Error('Failed to close position');
    }
  }

  /**
   * Create market order to reduce position size
   */
  async reducePosition(market: string, side: 'b' | 's', size: number): Promise<any> {
    try {
      const response = await this.client.post('/futures/order', {
        market,
        side,
        type: 'm', // market order
        size,
        reduce_only: true
      });
      return response.data;
    } catch (error) {
      console.error('Error reducing position:', error);
      throw new Error('Failed to reduce position');
    }
  }

  /**
   * Get market data
   */
  async getMarketData(market: string): Promise<any> {
    try {
      const response = await this.client.get(`/futures/market/${market}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw new Error('Failed to fetch market data');
    }
  }

  /**
   * Calculate liquidation risk
   */
  calculateLiquidationRisk(marginInfo: MarginInfo, positions: Position[]): {
    atRisk: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  } {
    if (!marginInfo || !positions) {
      return { atRisk: false, riskLevel: 'low', message: 'Unable to calculate risk' };
    }

    const marginLevel = marginInfo.marginLevel || 0;
    const availableMargin = marginInfo.availableMargin || 0;

    // LN Markets typically liquidates at 10% margin level
    const liquidationThreshold = 10;

    if (marginLevel <= liquidationThreshold) {
      return {
        atRisk: true,
        riskLevel: 'critical',
        message: `Critical: Margin level at ${marginLevel.toFixed(2)}% - Immediate liquidation risk!`
      };
    } else if (marginLevel <= 20) {
      return {
        atRisk: true,
        riskLevel: 'high',
        message: `High Risk: Margin level at ${marginLevel.toFixed(2)}% - Close positions immediately`
      };
    } else if (marginLevel <= 50) {
      return {
        atRisk: true,
        riskLevel: 'medium',
        message: `Medium Risk: Margin level at ${marginLevel.toFixed(2)}% - Monitor closely`
      };
    }

    return {
      atRisk: false,
      riskLevel: 'low',
      message: `Low Risk: Margin level at ${marginLevel.toFixed(2)}% - Position healthy`
    };
  }
}

// Factory function to create LN Markets service instance
export function createLNMarketsService(credentials: LNMarketsCredentials): LNMarketsService {
  return new LNMarketsService(credentials);
}
