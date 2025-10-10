/**
 * Dashboard Data Service - Multi-Account System
 * 
 * Serviço responsável por buscar dados da dashboard para a conta ativa do usuário.
 * Integra com AccountCredentialsService para obter credenciais da conta ativa e
 * com LNMarketsAPIService para buscar dados de posições, saldo e ticker.
 */

import { PrismaClient } from '@prisma/client';
import { AccountCredentialsService, AccountCredentials } from './account-credentials.service';
import { LNMarketsAPIv2 } from './lnmarkets/LNMarketsAPIv2.service';

// Interface for dashboard data response
export interface DashboardData {
  accountId: string;
  accountName: string;
  exchangeName: string;
  positions: any[];
  balance: any;
  ticker: any;
  timestamp: number;
}

// Interface for dashboard service configuration
export interface DashboardDataServiceConfig {
  prisma: PrismaClient;
  accountCredentialsService: AccountCredentialsService;
}

export class DashboardDataService {
  private prisma: PrismaClient;
  private accountCredentialsService: AccountCredentialsService;

  constructor(config: DashboardDataServiceConfig) {
    this.prisma = config.prisma;
    this.accountCredentialsService = config.accountCredentialsService;
  }

  /**
   * Get dashboard data for user's active account
   */
  async getDashboardDataForActiveAccount(userId: string): Promise<DashboardData> {
    try {
      console.log(`🔍 DASHBOARD DATA - Getting dashboard data for active account of user ${userId}`);
      
      // 1. Buscar credenciais da conta ativa
      const credentials = await this.accountCredentialsService.getActiveAccountCredentials(userId);
      
      if (!credentials) {
        console.warn(`❌ DASHBOARD DATA - No active account found for user ${userId}`);
        throw new Error('NO_ACTIVE_ACCOUNT');
      }

      console.log(`✅ DASHBOARD DATA - Found active account: ${credentials.accountName} (${credentials.exchangeName})`);

      // 2. Criar instância do LNMarketsAPIv2 com credenciais da conta ativa
      const lnMarketsService = new LNMarketsAPIv2({
        credentials: {
          apiKey: credentials.credentials['API Key'],
          apiSecret: credentials.credentials['API Secret'],
          passphrase: credentials.credentials['Passphrase'],
          isTestnet: false
        },
        logger: console as any // TODO: Pass proper logger
      });

      console.log(`🔄 DASHBOARD DATA - Fetching data from LN Markets API for account ${credentials.accountName}`);

      // 3. Buscar dados em paralelo
      const [positions, balance, ticker] = await Promise.all([
        this.getUserPositions(lnMarketsService),
        this.getUserBalance(lnMarketsService),
        this.getTicker(lnMarketsService)
      ]);

      const dashboardData: DashboardData = {
        accountId: credentials.accountId,
        accountName: credentials.accountName,
        exchangeName: credentials.exchangeName,
        positions: positions || [],
        balance: balance || null,
        ticker: ticker || null,
        timestamp: Date.now()
      };

      console.log(`✅ DASHBOARD DATA - Dashboard data fetched successfully for account ${credentials.accountName}:`, {
        positionsCount: dashboardData.positions.length,
        hasBalance: !!dashboardData.balance,
        hasTicker: !!dashboardData.ticker,
        timestamp: new Date(dashboardData.timestamp).toISOString()
      });

      return dashboardData;

    } catch (error) {
      console.error(`❌ DASHBOARD DATA - Failed to get dashboard data for user ${userId}:`, error);
      
      if (error.message === 'NO_ACTIVE_ACCOUNT') {
        throw error;
      }
      
      throw new Error(`Failed to fetch dashboard data: ${error.message}`);
    }
  }

  /**
   * Get user positions from LN Markets API v2
   */
  private async getUserPositions(lnMarketsService: LNMarketsAPIv2): Promise<any[]> {
    try {
      console.log(`🔄 DASHBOARD DATA - Fetching user positions`);
      
      const positions = await lnMarketsService.futures.getRunningPositions();
      
      console.log(`✅ DASHBOARD DATA - Fetched ${positions?.length || 0} positions`);
      
      return positions || [];
      
    } catch (error: any) {
      console.warn(`⚠️ DASHBOARD DATA - Failed to fetch positions:`, error.message);
      return [];
    }
  }

  /**
   * Get user balance from LN Markets API v2
   */
  private async getUserBalance(lnMarketsService: LNMarketsAPIv2): Promise<any | null> {
    try {
      console.log(`🔄 DASHBOARD DATA - Fetching user balance`);
      
      const user = await lnMarketsService.user.getUser();
      
      console.log(`✅ DASHBOARD DATA - Fetched balance:`, user.balance);
      
      return {
        balance: user.balance,
        synthetic_usd_balance: user.synthetic_usd_balance,
        uid: user.uid,
        username: user.username,
        role: user.role
      };
      
    } catch (error: any) {
      console.warn(`⚠️ DASHBOARD DATA - Failed to fetch balance:`, error.message);
      return null;
    }
  }

  /**
   * Get ticker data from LN Markets API v2
   */
  private async getTicker(lnMarketsService: LNMarketsAPIv2): Promise<any | null> {
    try {
      console.log(`🔄 DASHBOARD DATA - Fetching ticker data`);
      
      const ticker = await lnMarketsService.market.getTicker();
      
      console.log(`✅ DASHBOARD DATA - Fetched ticker:`, ticker.lastPrice);
      
      return ticker;
      
    } catch (error: any) {
      console.warn(`⚠️ DASHBOARD DATA - Failed to fetch ticker:`, error.message);
      return null;
    }
  }

  /**
   * Get dashboard data for specific account
   */
  async getDashboardDataForAccount(userId: string, accountId: string): Promise<DashboardData> {
    try {
      console.log(`🔍 DASHBOARD DATA - Getting dashboard data for account ${accountId} of user ${userId}`);
      
      // 1. Buscar credenciais da conta específica
      const credentials = await this.accountCredentialsService.getAccountCredentials(userId, accountId);
      
      if (!credentials) {
        console.warn(`❌ DASHBOARD DATA - Account ${accountId} not found for user ${userId}`);
        throw new Error('ACCOUNT_NOT_FOUND');
      }

      console.log(`✅ DASHBOARD DATA - Found account: ${credentials.accountName} (${credentials.exchangeName})`);

      // 2. Criar instância do LNMarketsAPIv2 com credenciais da conta
      const lnMarketsService = new LNMarketsAPIv2({
        credentials: {
          apiKey: credentials.credentials['API Key'],
          apiSecret: credentials.credentials['API Secret'],
          passphrase: credentials.credentials['Passphrase'],
          isTestnet: false
        },
        logger: console as any // TODO: Pass proper logger
      });

      console.log(`🔄 DASHBOARD DATA - Fetching data from LN Markets API for account ${credentials.accountName}`);

      // 3. Buscar dados em paralelo
      const [positions, balance, ticker] = await Promise.all([
        this.getUserPositions(lnMarketsService),
        this.getUserBalance(lnMarketsService),
        this.getTicker(lnMarketsService)
      ]);

      const dashboardData: DashboardData = {
        accountId: credentials.accountId,
        accountName: credentials.accountName,
        exchangeName: credentials.exchangeName,
        positions: positions || [],
        balance: balance || null,
        ticker: ticker || null,
        timestamp: Date.now()
      };

      console.log(`✅ DASHBOARD DATA - Dashboard data fetched successfully for account ${credentials.accountName}:`, {
        positionsCount: dashboardData.positions.length,
        hasBalance: !!dashboardData.balance,
        hasTicker: !!dashboardData.ticker,
        timestamp: new Date(dashboardData.timestamp).toISOString()
      });

      return dashboardData;

    } catch (error) {
      console.error(`❌ DASHBOARD DATA - Failed to get dashboard data for account ${accountId}:`, error);
      
      if (error.message === 'ACCOUNT_NOT_FOUND') {
        throw error;
      }
      
      throw new Error(`Failed to fetch dashboard data: ${error.message}`);
    }
  }

  /**
   * Validate if user has active account
   */
  async validateActiveAccount(userId: string): Promise<{
    hasActiveAccount: boolean;
    accountInfo?: {
      accountId: string;
      accountName: string;
      exchangeName: string;
    };
    error?: string;
  }> {
    try {
      console.log(`🔍 DASHBOARD DATA - Validating active account for user ${userId}`);
      
      const credentials = await this.accountCredentialsService.getActiveAccountCredentials(userId);
      
      if (!credentials) {
        return {
          hasActiveAccount: false,
          error: 'No active account found. Please configure your exchange credentials.'
        };
      }

      return {
        hasActiveAccount: true,
        accountInfo: {
          accountId: credentials.accountId,
          accountName: credentials.accountName,
          exchangeName: credentials.exchangeName
        }
      };

    } catch (error) {
      console.error(`❌ DASHBOARD DATA - Failed to validate active account for user ${userId}:`, error);
      
      return {
        hasActiveAccount: false,
        error: error.message || 'Failed to validate active account'
      };
    }
  }

  /**
   * Get dashboard data with fallback for missing data
   */
  async getDashboardDataWithFallback(userId: string): Promise<{
    success: boolean;
    data?: DashboardData;
    error?: string;
    hasActiveAccount: boolean;
  }> {
    try {
      console.log(`🔍 DASHBOARD DATA - Getting dashboard data with fallback for user ${userId}`);
      
      // Validate active account first
      const validation = await this.validateActiveAccount(userId);
      
      if (!validation.hasActiveAccount) {
        return {
          success: false,
          error: validation.error,
          hasActiveAccount: false
        };
      }

      // Get dashboard data
      const dashboardData = await this.getDashboardDataForActiveAccount(userId);
      
      return {
        success: true,
        data: dashboardData,
        hasActiveAccount: true
      };

    } catch (error) {
      console.error(`❌ DASHBOARD DATA - Failed to get dashboard data with fallback for user ${userId}:`, error);
      
      return {
        success: false,
        error: error.message || 'Failed to fetch dashboard data',
        hasActiveAccount: false
      };
    }
  }
}

console.log('🚀 DASHBOARD DATA - Multi-account dashboard data service started');
