/**
 * LND Service
 * 
 * Main service class for LND (Lightning Network Daemon) integration.
 * Factory pattern implementation supporting both testnet and mainnet networks.
 */

import { LNDClient } from './LNDClient';
import { LNDInfoEndpoints } from './endpoints/info.endpoints';
import { LNDWalletEndpoints } from './endpoints/wallet.endpoints';
import { LNDInvoiceEndpoints } from './endpoints/invoice.endpoints';
import { LNDChannelEndpoints } from './endpoints/channel.endpoints';
import { LNDPeerEndpoints } from './endpoints/peer.endpoints';
import { LNDOnchainEndpoints } from './endpoints/onchain.endpoints';
import { 
  LNDConfig, 
  LNDNetwork, 
  LNDServiceInterface,
  LNDHealthStatus 
} from './types/lnd.types';
import * as fs from 'fs';
import * as path from 'path';

export class LNDService implements LNDServiceInterface {
  private testnetClient: LNDClient | null = null;
  private mainnetClient: LNDClient | null = null;
  private activeNetwork: LNDNetwork;
  private logger: any;

  // Endpoint services
  public info: LNDInfoEndpoints | null = null;
  public wallet: LNDWalletEndpoints | null = null;
  public invoice: LNDInvoiceEndpoints | null = null;
  public channel: LNDChannelEndpoints | null = null;
  public peer: LNDPeerEndpoints | null = null;
  public onchain: LNDOnchainEndpoints | null = null;

  constructor(config: Partial<LNDConfig> = {}, logger: any = console) {
    this.logger = logger;
    this.activeNetwork = config.network || 'testnet';
    
    this.logger.info('🚀 LND Service initializing', {
      activeNetwork: this.activeNetwork,
      timestamp: new Date().toISOString()
    });

    // Initialize clients based on configuration
    this.initializeClients(config);
  }

  /**
   * Initialize LND clients for testnet and mainnet
   */
  private initializeClients(config: Partial<LNDConfig>): void {
    try {
      // Initialize testnet client
      if (process.env.LND_TESTNET_ENABLED === 'true') {
        const testnetConfig = this.buildTestnetConfig(config);
        this.testnetClient = new LNDClient(testnetConfig, this.logger);
        this.logger.info('✅ LND Testnet client initialized', {
          baseURL: testnetConfig.baseURL
        });
      }

      // Initialize mainnet client
      if (process.env.LND_MAINNET_ENABLED === 'true') {
        const mainnetConfig = this.buildMainnetConfig(config);
        this.mainnetClient = new LNDClient(mainnetConfig, this.logger);
        this.logger.info('✅ LND Mainnet client initialized', {
          baseURL: mainnetConfig.baseURL
        });
      }

      // Set active client and initialize endpoints
      this.setActiveClient();

    } catch (error) {
      this.logger.error('❌ Failed to initialize LND clients:', error);
      throw error;
    }
  }

  /**
   * Build testnet configuration
   */
  private buildTestnetConfig(baseConfig: Partial<LNDConfig>): LNDConfig {
    const baseURL = process.env.LND_TESTNET_BASE_URL || 'https://localhost:18080';
    const macaroonPath = process.env.LND_TESTNET_MACAROON_PATH || '/tmp/admin.macaroon';
    const tlsCertPath = process.env.LND_TESTNET_TLS_CERT_PATH || '/tmp/tls.cert';

    this.logger.info('🔧 Building testnet config:', {
      baseURL,
      macaroonPath,
      tlsCertPath,
      macaroonExists: fs.existsSync(macaroonPath),
      tlsCertExists: fs.existsSync(tlsCertPath)
    });

    const macaroon = this.readMacaroon(macaroonPath);
    const tlsCert = this.readTLSCert(tlsCertPath);

    this.logger.info('🔧 Credentials loaded:', {
      macaroonLength: macaroon.length,
      tlsCertLength: tlsCert.length
    });

    return {
      network: 'testnet',
      baseURL,
      credentials: {
        macaroon,
        tlsCert
      },
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...baseConfig
    };
  }

  /**
   * Build mainnet configuration
   */
  private buildMainnetConfig(baseConfig: Partial<LNDConfig>): LNDConfig {
    const baseURL = process.env.LND_MAINNET_REST_URL || 'http://lnd-mainnet:8081';
    const macaroonPath = process.env.LND_MAINNET_MACAROON_PATH || '/lnd/data/chain/bitcoin/mainnet/admin.macaroon';
    const tlsCertPath = process.env.LND_MAINNET_TLS_CERT_PATH || '/lnd/tls.cert';

    return {
      network: 'mainnet',
      baseURL,
      credentials: {
        macaroon: this.readMacaroon(macaroonPath),
        tlsCert: this.readTLSCert(tlsCertPath)
      },
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...baseConfig
    };
  }

  /**
   * Read macaroon from file
   */
  private readMacaroon(macaroonPath: string): string {
    try {
      if (!fs.existsSync(macaroonPath)) {
        this.logger.warn(`⚠️ Macaroon file not found: ${macaroonPath}`);
        return '';
      }
      
      const macaroon = fs.readFileSync(macaroonPath);
      return macaroon.toString('hex');
    } catch (error) {
      this.logger.error(`❌ Failed to read macaroon from ${macaroonPath}:`, error);
      return '';
    }
  }

  /**
   * Read TLS certificate from file
   */
  private readTLSCert(tlsCertPath: string): string {
    try {
      if (!fs.existsSync(tlsCertPath)) {
        this.logger.warn(`⚠️ TLS certificate file not found: ${tlsCertPath}`);
        return '';
      }
      
      const tlsCert = fs.readFileSync(tlsCertPath);
      return tlsCert.toString();
    } catch (error) {
      this.logger.error(`❌ Failed to read TLS certificate from ${tlsCertPath}:`, error);
      return '';
    }
  }

  /**
   * Set active client and initialize endpoints
   */
  private setActiveClient(): void {
    const activeClient = this.getActiveClient();
    
    if (!activeClient) {
      this.logger.error(`❌ No LND client available for network: ${this.activeNetwork}`);
      return;
    }

    // Initialize endpoint services
    this.info = new LNDInfoEndpoints(activeClient);
    this.wallet = new LNDWalletEndpoints(activeClient);
    this.invoice = new LNDInvoiceEndpoints(activeClient);
    this.channel = new LNDChannelEndpoints(activeClient);
    this.peer = new LNDPeerEndpoints(activeClient);
    this.onchain = new LNDOnchainEndpoints(activeClient);

    this.logger.info('✅ LND endpoints initialized', {
      network: this.activeNetwork,
      baseURL: activeClient.getBaseURL()
    });
  }

  /**
   * Get active client based on current network
   */
  public getActiveClient(): LNDClient | null {
    switch (this.activeNetwork) {
      case 'testnet':
        return this.testnetClient;
      case 'mainnet':
        return this.mainnetClient;
      default:
        return null;
    }
  }

  /**
   * Get testnet client
   */
  public getTestnetClient(): LNDClient | null {
    return this.testnetClient;
  }

  /**
   * Get mainnet client
   */
  public getMainnetClient(): LNDClient | null {
    return this.mainnetClient;
  }

  /**
   * Switch active network
   */
  public switchNetwork(network: LNDNetwork): void {
    if (this.activeNetwork === network) {
      this.logger.info(`ℹ️ Already using network: ${network}`);
      return;
    }

    const targetClient = network === 'testnet' ? this.testnetClient : this.mainnetClient;
    
    if (!targetClient) {
      throw new Error(`LND client not available for network: ${network}`);
    }

    this.activeNetwork = network;
    this.setActiveClient();
    
    this.logger.info('🔄 Switched LND network', {
      previousNetwork: this.activeNetwork === 'testnet' ? 'mainnet' : 'testnet',
      newNetwork: this.activeNetwork,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get current network
   */
  public getNetwork(): LNDNetwork {
    return this.activeNetwork;
  }

  /**
   * Check if service is healthy
   */
  public async isHealthy(): Promise<boolean> {
    try {
      const activeClient = this.getActiveClient();
      if (!activeClient) {
        return false;
      }
      
      return await activeClient.healthCheck();
    } catch (error) {
      this.logger.error('❌ Health check failed:', error);
      return false;
    }
  }

  /**
   * Get detailed health status
   */
  public async getHealthStatus(): Promise<LNDHealthStatus> {
    try {
      const isHealthy = await this.isHealthy();
      const lastChecked = new Date();
      
      if (isHealthy) {
        return {
          isHealthy: true,
          network: this.activeNetwork,
          lastChecked
        };
      } else {
        return {
          isHealthy: false,
          network: this.activeNetwork,
          lastChecked,
          error: 'Health check failed'
        };
      }
    } catch (error) {
      return {
        isHealthy: false,
        network: this.activeNetwork,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get node information
   */
  public async getInfo(): Promise<any> {
    if (!this.info) {
      throw new Error('LND service not properly initialized');
    }
    
    return this.info.getInfo();
  }

  /**
   * Get service statistics
   */
  public getStats(): {
    activeNetwork: LNDNetwork;
    testnetAvailable: boolean;
    mainnetAvailable: boolean;
    endpointsInitialized: boolean;
  } {
    return {
      activeNetwork: this.activeNetwork,
      testnetAvailable: this.testnetClient !== null,
      mainnetAvailable: this.mainnetClient !== null,
      endpointsInitialized: this.info !== null && this.wallet !== null && this.invoice !== null
    };
  }

  /**
   * Update configuration for active network
   */
  public updateConfig(newConfig: Partial<LNDConfig>): void {
    const activeClient = this.getActiveClient();
    if (!activeClient) {
      throw new Error('No active LND client available');
    }
    
    activeClient.updateConfig(newConfig);
    this.logger.info('🔄 LND configuration updated', {
      network: this.activeNetwork,
      config: Object.keys(newConfig)
    });
  }

  // ========================================
  // TESTNET SPECIFIC METHODS
  // ========================================

  /**
   * Get testnet node information
   */
  public async getTestnetInfo(): Promise<any> {
    if (!this.testnetClient) {
      throw new Error('Testnet client not initialized');
    }

    // Temporarily switch to testnet
    const originalNetwork = this.activeNetwork;
    this.activeNetwork = 'testnet';
    this.initializeEndpoints();

    try {
      const info = await this.getInfo();
      return info;
    } finally {
      // Restore original network
      this.activeNetwork = originalNetwork;
      this.initializeEndpoints();
    }
  }

  /**
   * Create testnet invoice
   */
  public async createTestnetInvoice(request: { amount: number; memo?: string; expiry?: number }): Promise<any> {
    if (!this.testnetClient) {
      throw new Error('Testnet client not initialized');
    }

    // Temporarily switch to testnet
    const originalNetwork = this.activeNetwork;
    this.activeNetwork = 'testnet';
    this.initializeEndpoints();

    try {
      if (!this.invoice) {
        throw new Error('Invoice endpoints not initialized');
      }
      
      const invoice = await this.invoice.createInvoice({
        value: request.amount,
        memo: request.memo || 'Testnet invoice',
        expiry: request.expiry || 3600
      });

      return invoice;
    } finally {
      // Restore original network
      this.activeNetwork = originalNetwork;
      this.initializeEndpoints();
    }
  }

  /**
   * Get testnet wallet balance
   */
  public async getTestnetBalance(): Promise<number> {
    if (!this.testnetClient) {
      throw new Error('Testnet client not initialized');
    }

    // Temporarily switch to testnet
    const originalNetwork = this.activeNetwork;
    this.activeNetwork = 'testnet';
    this.initializeEndpoints();

    try {
      if (!this.wallet) {
        throw new Error('Wallet endpoints not initialized');
      }
      
      const balance = await this.wallet.getBalance();
      return balance.total_balance || 0;
    } finally {
      // Restore original network
      this.activeNetwork = originalNetwork;
      this.initializeEndpoints();
    }
  }

  /**
   * Get testnet channels
   */
  public async getTestnetChannels(): Promise<any> {
    if (!this.testnetClient) {
      throw new Error('Testnet client not initialized');
    }

    // Temporarily switch to testnet
    const originalNetwork = this.activeNetwork;
    this.activeNetwork = 'testnet';
    this.initializeEndpoints();

    try {
      if (!this.channel) {
        throw new Error('Channel endpoints not initialized');
      }
      
      const channels = await this.channel.getChannels();
      return channels;
    } finally {
      // Restore original network
      this.activeNetwork = originalNetwork;
      this.initializeEndpoints();
    }
  }
}

// Export singleton instance
let lndServiceInstance: LNDService | null = null;

export function getLNDService(logger: any = console): LNDService {
  if (!lndServiceInstance) {
    lndServiceInstance = new LNDService({}, logger);
  }
  return lndServiceInstance;
}

export function resetLNDService(): void {
  lndServiceInstance = null;
}
