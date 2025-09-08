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

    // Try different authentication methods
    const authHeaders = this.buildAuthHeaders();

    this.client = axios.create({
      baseURL: 'https://api.lnmarkets.com/v2',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders
      },
      timeout: 15000, // Increased timeout
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('LN Markets API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url,
          method: error.config?.method
        });
        throw error;
      }
    );
  }

  /**
   * Build authentication headers trying different methods
   */
  private buildAuthHeaders() {
    const { apiKey, apiSecret } = this.credentials;

    // Try different authentication methods
    // Method 1: Bearer token with colon separator
    return {
      'Authorization': `Bearer ${apiKey}:${apiSecret}`
    };
  }

  /**
   * Try alternative authentication methods
   */
  private async tryAlternativeAuth(endpoint: string): Promise<any> {
    const { apiKey, apiSecret } = this.credentials;

    // Method 2: Basic auth
    try {
      const response = await axios.get(`${this.client.defaults.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      console.log('✅ Basic auth successful');
      return response;
    } catch (error) {
      console.log('❌ Basic auth failed');
    }

    // Method 3: API key in headers
    try {
      const response = await axios.get(`${this.client.defaults.baseURL}${endpoint}`, {
        headers: {
          'X-API-Key': apiKey,
          'X-API-Secret': apiSecret,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      console.log('✅ API key headers successful');
      return response;
    } catch (error) {
      console.log('❌ API key headers failed');
    }

    // Method 4: Query parameters
    try {
      const response = await axios.get(`${this.client.defaults.baseURL}${endpoint}`, {
        params: {
          api_key: apiKey,
          api_secret: apiSecret
        },
        timeout: 10000
      });
      console.log('✅ Query parameters successful');
      return response;
    } catch (error) {
      console.log('❌ Query parameters failed');
    }

    throw new Error('All authentication methods failed');
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
      // Try multiple endpoints to validate credentials
      const endpoints = ['/futures/user/balance', '/futures/user/margin', '/futures/user/positions'];

      for (const endpoint of endpoints) {
        try {
          // First try with main auth method
          await this.client.get(endpoint);
          console.log(`✅ LN Markets API validation successful with endpoint: ${endpoint}`);
          return true;
        } catch (error) {
          console.log(`❌ Main auth failed for ${endpoint}:`, (error as any).response?.status);

          // If main auth fails, try alternative methods
          try {
            await this.tryAlternativeAuth(endpoint);
            console.log(`✅ Alternative auth successful for ${endpoint}`);
            return true;
          } catch (altError) {
            console.log(`❌ Alternative auth also failed for ${endpoint}`);
            continue; // Try next endpoint
          }
        }
      }

      console.error('❌ All LN Markets API endpoints and auth methods failed');
      return false;
    } catch (error) {
      console.error('❌ LN Markets API validation error:', error);
      return false;
    }
  }

  /**
   * Test basic connectivity
   */
  async testConnectivity(): Promise<{success: boolean, message: string, details?: any}> {
    try {
      // Test with different public endpoints
      const endpoints = [
        'https://api.lnmarkets.com/v2/futures/markets',
        'https://api.lnmarkets.com/v2/futures/ticker',
        'https://api.lnmarkets.com/v2/health'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, { timeout: 5000 });
          return {
            success: true,
            message: `Basic connectivity test successful with ${endpoint}`,
            details: {
              status: response.status,
              endpoint,
              dataSize: JSON.stringify(response.data).length
            }
          };
        } catch (error) {
          console.log(`Endpoint ${endpoint} failed:`, (error as any).response?.status);
          continue;
        }
      }

      return {
        success: false,
        message: 'All connectivity tests failed',
        details: 'No public endpoints responded'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Basic connectivity test failed',
        details: (error as Error).message
      };
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
