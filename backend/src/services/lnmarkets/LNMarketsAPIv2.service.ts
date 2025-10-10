/**
 * LN Markets API v2 - Serviço Principal Centralizado
 * 
 * Ponto de entrada único para todas as operações LN Markets API v2
 * - Organizado por domínio (user, futures, market)
 * - Type-safe com interfaces TypeScript
 * - Error handling correto (throw, não mask)
 * - Logging detalhado
 * - Documentação inline com exemplos
 */

import { Logger } from 'winston';
import { LNMarketsClient, LNMarketsCredentials, LNMarketsConfig } from './LNMarketsClient';
import { LNMarketsUserEndpoints } from './endpoints/user.endpoints';
import { LNMarketsFuturesEndpoints } from './endpoints/futures.endpoints';
import { LNMarketsMarketEndpoints } from './endpoints/market.endpoints';

// Re-export types for convenience
export * from './types/user.types';
export * from './types/futures.types';
export * from './types/market.types';

export { LNMarketsCredentials } from './LNMarketsClient';

/**
 * LN Markets API v2 Service
 * 
 * Serviço centralizado que fornece acesso a todos os endpoints LN Markets
 * organizados por domínio funcional.
 * 
 * @example
 * ```typescript
 * const api = new LNMarketsAPIv2({
 *   credentials: {
 *     apiKey: 'your-api-key',
 *     apiSecret: 'your-api-secret',
 *     passphrase: 'your-passphrase'
 *   },
 *   logger: winstonLogger
 * });
 * 
 * // Get user balance
 * const user = await api.user.getUser();
 * console.log('Balance:', user.balance);
 * 
 * // Get running positions
 * const positions = await api.futures.getRunningPositions();
 * console.log('Positions:', positions.length);
 * 
 * // Get current ticker
 * const ticker = await api.market.getTicker();
 * console.log('Current price:', ticker.lastPrice);
 * ```
 */
export class LNMarketsAPIv2 {
  public readonly user: LNMarketsUserEndpoints;
  public readonly futures: LNMarketsFuturesEndpoints;
  public readonly market: LNMarketsMarketEndpoints;

  private client: LNMarketsClient;
  private logger: Logger;

  constructor(config: LNMarketsConfig) {
    this.logger = config.logger;
    
    // Initialize HTTP client
    this.client = new LNMarketsClient(config);
    
    // Initialize endpoint modules
    this.user = new LNMarketsUserEndpoints(this.client);
    this.futures = new LNMarketsFuturesEndpoints(this.client);
    this.market = new LNMarketsMarketEndpoints(this.client);

    this.logger.info('🚀 LN Markets API v2 Service initialized', {
      baseURL: config.baseURL || (config.credentials.isTestnet 
        ? 'https://api.testnet4.lnmarkets.com/v2' 
        : 'https://api.lnmarkets.com/v2'),
      isTestnet: config.credentials.isTestnet
    });
  }

  /**
   * Get client statistics
   * @returns Request statistics and configuration
   */
  getStats() {
    return this.client.getStats();
  }

  /**
   * Test connection to LN Markets API
   * @returns Promise<boolean> - true if connection successful
   */
  async testConnection(): Promise<boolean> {
    try {
      this.logger.info('🧪 Testing LN Markets API connection...');
      
      // Try to get market info (public endpoint, no auth required)
      await this.market.getTicker();
      
      this.logger.info('✅ LN Markets API connection test successful');
      return true;
    } catch (error: any) {
      this.logger.error('❌ LN Markets API connection test failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Test authentication with LN Markets API
   * @returns Promise<boolean> - true if authentication successful
   */
  async testAuthentication(): Promise<boolean> {
    try {
      this.logger.info('🔐 Testing LN Markets API authentication...');
      
      // Try to get user data (requires authentication)
      const user = await this.user.getUser();
      
      this.logger.info('✅ LN Markets API authentication test successful', {
        userId: user.uid,
        username: user.username,
        balance: user.balance
      });
      return true;
    } catch (error: any) {
      this.logger.error('❌ LN Markets API authentication test failed', {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get comprehensive dashboard data
   * @returns Combined user, positions, and market data
   */
  async getDashboardData() {
    this.logger.info('📊 Fetching comprehensive dashboard data...');
    
    const startTime = Date.now();
    
    try {
      // Fetch all data in parallel for optimal performance
      const [user, positions, ticker] = await Promise.allSettled([
        this.user.getUser(),
        this.futures.getRunningPositions(),
        this.market.getTicker()
      ]);

      const dashboardData = {
        user: user.status === 'fulfilled' ? user.value : null,
        positions: positions.status === 'fulfilled' ? positions.value : [],
        ticker: ticker.status === 'fulfilled' ? ticker.value : null,
        timestamp: Date.now(),
        fetchDuration: Date.now() - startTime,
        errors: {
          user: user.status === 'rejected' ? user.reason.message : null,
          positions: positions.status === 'rejected' ? positions.reason.message : null,
          ticker: ticker.status === 'rejected' ? ticker.reason.message : null
        }
      };

      this.logger.info('✅ Dashboard data fetched successfully', {
        hasUser: !!dashboardData.user,
        positionsCount: dashboardData.positions.length,
        hasTicker: !!dashboardData.ticker,
        duration: dashboardData.fetchDuration,
        errors: Object.values(dashboardData.errors).filter(Boolean).length
      });

      return dashboardData;
    } catch (error: any) {
      this.logger.error('❌ Failed to fetch dashboard data', {
        error: error.message,
        duration: Date.now() - startTime
      });
      throw error;
    }
  }

  /**
   * Validate credentials and test all endpoints
   * @returns Comprehensive test results
   */
  async validateCredentials(): Promise<{
    success: boolean;
    connection: boolean;
    authentication: boolean;
    user?: any;
    errors: string[];
  }> {
    const results = {
      success: false,
      connection: false,
      authentication: false,
      user: null,
      errors: [] as string[]
    };

    try {
      // Test connection
      results.connection = await this.testConnection();
      if (!results.connection) {
        results.errors.push('Connection test failed');
      }

      // Test authentication
      results.authentication = await this.testAuthentication();
      if (!results.authentication) {
        results.errors.push('Authentication test failed');
      }

      // If auth works, get user data
      if (results.authentication) {
        try {
          results.user = await this.user.getUser();
        } catch (error: any) {
          results.errors.push(`User data fetch failed: ${error.message}`);
        }
      }

      results.success = results.connection && results.authentication;

      this.logger.info('🧪 Credential validation completed', {
        success: results.success,
        connection: results.connection,
        authentication: results.authentication,
        errorCount: results.errors.length
      });

      return results;
    } catch (error: any) {
      this.logger.error('❌ Credential validation failed', {
        error: error.message
      });
      results.errors.push(`Validation failed: ${error.message}`);
      return results;
    }
  }
}
