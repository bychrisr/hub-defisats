import axios, { AxiosInstance } from 'axios';
import { createHmac } from 'crypto';

export interface LNMarketsCredentials {
  apiKey: string;
  apiSecret: string;
  passphrase: string;
}

export interface MarginInfo {
  margin: number;
  availableMargin: number;
  marginLevel: number;
  totalValue: number;
  totalUnrealizedPnl: number;
  positions: Position[];
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
      },
      timeout: 15000, // Increased timeout
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(config => {
      const authHeaders = this.generateAuthHeaders(
        config.method?.toUpperCase() || 'GET',
        config.url || '',
        config.params,
        config.data
      );
      Object.assign(config.headers, authHeaders);
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('LN Markets API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          url: error.config?.url,
          method: error.config?.method,
        });
        throw error;
      }
    );
  }

  /**
   * Generate LN Markets authentication headers
   */
  private generateAuthHeaders(
    method: string,
    path: string,
    params?: Record<string, unknown>,
    data?: Record<string, unknown>
  ): Record<string, string> {
    const { apiKey, apiSecret, passphrase } = this.credentials;
    const timestamp = Date.now().toString();

    // Ensure path includes /v2 prefix for signature
    const fullPath = path.startsWith('/v2') ? path : `/v2${path}`;

    // Build params string
    let paramsStr = '';
    if (method === 'GET' || method === 'DELETE') {
      if (params) {
        paramsStr = new URLSearchParams(params as Record<string, string>).toString();
      }
    } else if (data) {
      paramsStr = JSON.stringify(data);
    }

    // Create signature
    const message = `${timestamp}${method}${fullPath}${paramsStr}`;
    const signature = createHmac('sha256', apiSecret)
      .update(message)
      .digest('base64');

    return {
      'LNM-ACCESS-KEY': apiKey,
      'LNM-ACCESS-SIGNATURE': signature,
      'LNM-ACCESS-PASSPHRASE': passphrase,
      'LNM-ACCESS-TIMESTAMP': timestamp,
    };
  }

  /**
   * Try alternative authentication methods
   */
  private async tryAlternativeAuth(endpoint: string): Promise<any> {
    const { apiKey, apiSecret } = this.credentials;

    // Method 2: Basic auth
    try {
      const response = await axios.get(
        `${this.client.defaults.baseURL}${endpoint}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      console.log('✅ Basic auth successful');
      return response;
    } catch (error) {
      console.log('❌ Basic auth failed');
    }

    // Method 3: API key in headers
    try {
      const response = await axios.get(
        `${this.client.defaults.baseURL}${endpoint}`,
        {
          headers: {
            'X-API-Key': apiKey,
            'X-API-Secret': apiSecret,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      console.log('✅ API key headers successful');
      return response;
    } catch (error) {
      console.log('❌ API key headers failed');
    }

    // Method 4: Query parameters
    try {
      const response = await axios.get(
        `${this.client.defaults.baseURL}${endpoint}`,
        {
          params: {
            api_key: apiKey,
            api_secret: apiSecret,
          },
          timeout: 10000,
        }
      );
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
      // Use the correct endpoint for user information
      const response = await this.client.get('/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching margin info:', error);
      throw error; // Propagate the original error
    }
  }

  /**
   * Get user positions
   */
  async getPositions(): Promise<Position[]> {
    try {
      const response = await this.client.get('/futures/positions');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching positions:', error);
      throw error; // Propagate the original error
    }
  }

  /**
   * Get running trades
   */
  async getRunningTrades(): Promise<any[]> {
    try {
      const response = await this.client.get('/futures/trades', {
        params: { type: 'running' },
      });
      return response.data || [];
    } catch (error) {
      console.error('Error fetching running trades:', error);
      throw new Error('Failed to fetch running trades');
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<any> {
    try {
      // Use the correct endpoint for user information
      const response = await this.client.get('/user');
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
      console.log('🔍 Starting LN Markets credentials validation...');
      console.log('📋 Credentials provided:', {
        hasApiKey: !!this.credentials.apiKey,
        hasApiSecret: !!this.credentials.apiSecret,
        hasPassphrase: !!this.credentials.passphrase,
        apiKeyLength: this.credentials.apiKey?.length,
        apiSecretLength: this.credentials.apiSecret?.length,
        passphraseLength: this.credentials.passphrase?.length,
      });

      // ❌ REMOVIDO: Validação de test credentials em dev
      // Agora validamos SEMPRE as credenciais reais - mesmo em dev/staging
      // Use credenciais de sandbox/testnet da LN Markets - não invente keys

      // Try multiple endpoints to validate credentials
      const endpoints = [
        '/user',
        '/futures/positions',
        '/futures/trades',
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`🔗 Testing endpoint: ${endpoint}`);
          // First try with main auth method
          const response = await this.client.get(endpoint);
          console.log(
            `✅ LN Markets API validation successful with endpoint: ${endpoint}`
          );
          console.log(`📊 Response status: ${response.status}`);
          return true;
        } catch (error: unknown) {
          console.log(`❌ Main auth failed for ${endpoint}:`, {
            status: (error as any).response?.status,
            statusText: (error as any).response?.statusText,
            data: (error as any).response?.data,
            message: (error as Error).message,
          });

          // If main auth fails, try alternative methods
          try {
            console.log(`🔄 Trying alternative auth for ${endpoint}...`);
            await this.tryAlternativeAuth(endpoint);
            console.log(`✅ Alternative auth successful for ${endpoint}`);
            return true;
          } catch (altError: unknown) {
            console.log(`❌ Alternative auth also failed for ${endpoint}:`, {
              status: (altError as any).response?.status,
              statusText: (altError as any).response?.statusText,
              data: (altError as any).response?.data,
              message: (altError as Error).message,
            });
            continue; // Try next endpoint
          }
        }
      }

      console.error('❌ All LN Markets API endpoints and auth methods failed');
      return false;
    } catch (error: unknown) {
      console.error('❌ LN Markets API validation error:', {
        message: (error as Error).message,
        stack: (error as Error).stack,
        response: (error as any).response?.data,
      });
      return false;
    }
  }

  /**
   * Test basic connectivity
   */
  async testConnectivity(): Promise<{
    success: boolean;
    message: string;
    details?: Record<string, unknown>;
  }> {
    try {
      // Test with different public endpoints
      const endpoints = [
        '/futures/markets',
        '/futures/ticker',
        '/health',
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
              dataSize: JSON.stringify(response.data).length,
            },
          };
        } catch (error) {
          console.log(
            `Endpoint ${endpoint} failed:`,
            (error as { response?: { status?: number } }).response?.status
          );
          continue;
        }
      }

      return {
        success: false,
        message: 'All connectivity tests failed',
        details: { message: 'No public endpoints responded' },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Basic connectivity test failed',
        details: { message: (error as Error).message },
      };
    }
  }

  /**
   * Close position by ID
   */
  async closePosition(positionId: string): Promise<any> {
    try {
      const response = await this.client.post(
        `/futures/position/${positionId}/close`
      );
      return response.data;
    } catch (error) {
      console.error('Error closing position:', error);
      throw new Error('Failed to close position');
    }
  }

  /**
   * Create market order to reduce position size
   */
  async reducePosition(
    market: string,
    side: 'b' | 's',
    size: number
  ): Promise<any> {
    try {
      const response = await this.client.post('/futures/order', {
        market,
        side,
        type: 'm', // market order
        size,
        reduce_only: true,
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
  calculateLiquidationRisk(
    marginInfo: MarginInfo,
    positions: Position[]
  ): {
    atRisk: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    message: string;
  } {
    if (!marginInfo || !positions) {
      return {
        atRisk: false,
        riskLevel: 'low',
        message: 'Unable to calculate risk',
      };
    }

    const marginLevel = marginInfo.marginLevel || 0;
    // const availableMargin = marginInfo.availableMargin || 0;

    // LN Markets typically liquidates at 10% margin level
    const liquidationThreshold = 10;

    if (marginLevel <= liquidationThreshold) {
      return {
        atRisk: true,
        riskLevel: 'critical',
        message: `Critical: Margin level at ${marginLevel.toFixed(2)}% - Immediate liquidation risk!`,
      };
    } else if (marginLevel <= 20) {
      return {
        atRisk: true,
        riskLevel: 'high',
        message: `High Risk: Margin level at ${marginLevel.toFixed(2)}% - Close positions immediately`,
      };
    } else if (marginLevel <= 50) {
      return {
        atRisk: true,
        riskLevel: 'medium',
        message: `Medium Risk: Margin level at ${marginLevel.toFixed(2)}% - Monitor closely`,
      };
    }

    return {
      atRisk: false,
      riskLevel: 'low',
      message: `Low Risk: Margin level at ${marginLevel.toFixed(2)}% - Position healthy`,
    };
  }
}

// Factory function to create LN Markets service instance
export function createLNMarketsService(
  credentials: LNMarketsCredentials
): LNMarketsService {
  return new LNMarketsService(credentials);
}

// Test function for sandbox credentials
export async function testSandboxCredentials(): Promise<void> {
  console.log('🧪 Testing LN Markets sandbox credentials...');

  const sandboxCredentials = {
    apiKey: 'hC8B4VoDm1X6i2L3qLrdUopNggl3yaJh6S3Zz1tPCoE=',
    apiSecret:
      'r6tDhZmafgGH/ay2lLmSHnEKoBzwOPN+1O0mDSaX8yq4UKnuz2UnexvONrO1Ph87+AKoEIn39ZpeEBhPT9r7dA==',
    passphrase: 'a6c1bh56jc33',
  };

  console.log('📋 Sandbox credentials:', {
    hasApiKey: !!sandboxCredentials.apiKey,
    hasApiSecret: !!sandboxCredentials.apiSecret,
    hasPassphrase: !!sandboxCredentials.passphrase,
    apiKeyLength: sandboxCredentials.apiKey?.length,
    apiSecretLength: sandboxCredentials.apiSecret?.length,
    passphraseLength: sandboxCredentials.passphrase?.length,
  });

  const service = createLNMarketsService(sandboxCredentials);

  try {
    console.log('🔍 Testing connectivity...');
    const connectivityTest = await service.testConnectivity();
    console.log('📡 Connectivity test result:', connectivityTest);

    console.log('✅ Testing credentials validation...');
    const isValid = await service.validateCredentials();
    console.log('🎯 Credentials validation result:', isValid);

    if (isValid) {
      console.log('✅ Sandbox credentials are valid!');
    } else {
      console.log('❌ Sandbox credentials validation failed');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}
