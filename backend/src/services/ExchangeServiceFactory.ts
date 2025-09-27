/**
 * Exchange Service Factory
 * 
 * Factory pattern implementation for creating exchange API services
 * Provides a centralized way to instantiate different exchange services
 */

import { Logger } from 'winston';
import { ExchangeApiService, ExchangeCredentials } from './ExchangeApiService.interface';
import { LNMarketsApiService, LNMarketsCredentials } from './LNMarketsApiService';

export type SupportedExchange = 'lnmarkets' | 'binance' | 'coinbase' | 'kraken';

export interface ExchangeServiceConfig {
  exchange: SupportedExchange;
  credentials: ExchangeCredentials;
  logger: Logger;
}

export class ExchangeServiceFactory {
  private static instance: ExchangeServiceFactory;
  private logger: Logger;

  private constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Get singleton instance of the factory
   */
  public static getInstance(logger: Logger): ExchangeServiceFactory {
    if (!ExchangeServiceFactory.instance) {
      ExchangeServiceFactory.instance = new ExchangeServiceFactory(logger);
    }
    return ExchangeServiceFactory.instance;
  }

  /**
   * Create an exchange service instance
   */
  public createService(config: ExchangeServiceConfig): ExchangeApiService {
    const { exchange, credentials, logger } = config;

    this.logger.info(`Creating ${exchange} exchange service`, {
      exchange,
      hasApiKey: !!credentials.apiKey,
      hasApiSecret: !!credentials.apiSecret,
      isSandbox: credentials.sandbox || false
    });

    switch (exchange) {
      case 'lnmarkets':
        return this.createLNMarketsService(credentials as LNMarketsCredentials, logger);
      
      case 'binance':
        throw new Error('Binance exchange service not implemented yet');
      
      case 'coinbase':
        throw new Error('Coinbase exchange service not implemented yet');
      
      case 'kraken':
        throw new Error('Kraken exchange service not implemented yet');
      
      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }
  }

  /**
   * Create LN Markets service instance
   */
  private createLNMarketsService(credentials: LNMarketsCredentials, logger: Logger): LNMarketsApiService {
    this.logger.debug('Creating LN Markets service', {
      hasApiKey: !!credentials.apiKey,
      hasApiSecret: !!credentials.apiSecret,
      hasPassphrase: !!credentials.passphrase,
      isTestnet: credentials.isTestnet || false
    });

    return new LNMarketsApiService(credentials, logger);
  }

  /**
   * Get list of supported exchanges
   */
  public getSupportedExchanges(): SupportedExchange[] {
    return ['lnmarkets'];
  }

  /**
   * Check if an exchange is supported
   */
  public isExchangeSupported(exchange: string): exchange is SupportedExchange {
    return this.getSupportedExchanges().includes(exchange as SupportedExchange);
  }

  /**
   * Get exchange service configuration requirements
   */
  public getExchangeRequirements(exchange: SupportedExchange): {
    requiredFields: string[];
    optionalFields: string[];
    description: string;
  } {
    switch (exchange) {
      case 'lnmarkets':
        return {
          requiredFields: ['apiKey', 'apiSecret', 'passphrase'],
          optionalFields: ['sandbox', 'isTestnet'],
          description: 'LN Markets API v2 - Lightning Network futures trading'
        };
      
      case 'binance':
        return {
          requiredFields: ['apiKey', 'apiSecret'],
          optionalFields: ['sandbox'],
          description: 'Binance API - Cryptocurrency exchange'
        };
      
      case 'coinbase':
        return {
          requiredFields: ['apiKey', 'apiSecret', 'passphrase'],
          optionalFields: ['sandbox'],
          description: 'Coinbase Pro API - Cryptocurrency exchange'
        };
      
      case 'kraken':
        return {
          requiredFields: ['apiKey', 'apiSecret'],
          optionalFields: ['sandbox'],
          description: 'Kraken API - Cryptocurrency exchange'
        };
      
      default:
        throw new Error(`Unknown exchange: ${exchange}`);
    }
  }

  /**
   * Validate credentials for a specific exchange
   */
  public validateCredentials(exchange: SupportedExchange, credentials: ExchangeCredentials): {
    valid: boolean;
    errors: string[];
  } {
    const requirements = this.getExchangeRequirements(exchange);
    const errors: string[] = [];

    // Check required fields
    for (const field of requirements.requiredFields) {
      if (!credentials[field as keyof ExchangeCredentials]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Exchange-specific validation
    switch (exchange) {
      case 'lnmarkets':
        const lnCredentials = credentials as LNMarketsCredentials;
        if (lnCredentials.apiKey && lnCredentials.apiKey.length < 10) {
          errors.push('LN Markets API key must be at least 10 characters');
        }
        if (lnCredentials.apiSecret && lnCredentials.apiSecret.length < 10) {
          errors.push('LN Markets API secret must be at least 10 characters');
        }
        if (lnCredentials.passphrase && lnCredentials.passphrase.length < 3) {
          errors.push('LN Markets passphrase must be at least 3 characters');
        }
        break;
      
      case 'binance':
        if (credentials.apiKey && credentials.apiKey.length < 10) {
          errors.push('Binance API key must be at least 10 characters');
        }
        if (credentials.apiSecret && credentials.apiSecret.length < 10) {
          errors.push('Binance API secret must be at least 10 characters');
        }
        break;
      
      case 'coinbase':
        const cbCredentials = credentials as LNMarketsCredentials; // Same structure
        if (cbCredentials.apiKey && cbCredentials.apiKey.length < 10) {
          errors.push('Coinbase API key must be at least 10 characters');
        }
        if (cbCredentials.apiSecret && cbCredentials.apiSecret.length < 10) {
          errors.push('Coinbase API secret must be at least 10 characters');
        }
        if (cbCredentials.passphrase && cbCredentials.passphrase.length < 3) {
          errors.push('Coinbase passphrase must be at least 3 characters');
        }
        break;
      
      case 'kraken':
        if (credentials.apiKey && credentials.apiKey.length < 10) {
          errors.push('Kraken API key must be at least 10 characters');
        }
        if (credentials.apiSecret && credentials.apiSecret.length < 10) {
          errors.push('Kraken API secret must be at least 10 characters');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create service with validation
   */
  public createServiceWithValidation(config: ExchangeServiceConfig): ExchangeApiService {
    const { exchange, credentials } = config;

    // Validate exchange is supported
    if (!this.isExchangeSupported(exchange)) {
      throw new Error(`Unsupported exchange: ${exchange}`);
    }

    // Validate credentials
    const validation = this.validateCredentials(exchange, credentials);
    if (!validation.valid) {
      throw new Error(`Invalid credentials for ${exchange}: ${validation.errors.join(', ')}`);
    }

    // Create service
    return this.createService(config);
  }

  /**
   * Test connection to an exchange
   */
  public async testConnection(config: ExchangeServiceConfig): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      const service = this.createServiceWithValidation(config);
      const isValid = await service.validateCredentials(config.credentials);
      
      if (isValid) {
        return {
          success: true,
          message: `Connection to ${config.exchange} successful`
        };
      } else {
        return {
          success: false,
          message: `Connection to ${config.exchange} failed`,
          error: 'Invalid credentials'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Connection to ${config.exchange} failed`,
        error: error.message
      };
    }
  }

  /**
   * Get exchange service info
   */
  public getExchangeInfo(exchange: SupportedExchange): {
    name: string;
    version: string;
    supportedFeatures: string[];
    documentation: string;
  } {
    switch (exchange) {
      case 'lnmarkets':
        return {
          name: 'LN Markets',
          version: '2.0',
          supportedFeatures: [
            'Futures Trading',
            'Lightning Network',
            'Real-time Data',
            'Position Management',
            'Order Management',
            'Market Data',
            'User Management'
          ],
          documentation: 'https://docs.lnmarkets.com/api/v2/'
        };
      
      case 'binance':
        return {
          name: 'Binance',
          version: '1.0',
          supportedFeatures: [
            'Spot Trading',
            'Futures Trading',
            'Margin Trading',
            'Real-time Data',
            'Order Management',
            'Market Data'
          ],
          documentation: 'https://binance-docs.github.io/apidocs/'
        };
      
      case 'coinbase':
        return {
          name: 'Coinbase Pro',
          version: '1.0',
          supportedFeatures: [
            'Spot Trading',
            'Real-time Data',
            'Order Management',
            'Market Data',
            'User Management'
          ],
          documentation: 'https://docs.pro.coinbase.com/'
        };
      
      case 'kraken':
        return {
          name: 'Kraken',
          version: '1.0',
          supportedFeatures: [
            'Spot Trading',
            'Futures Trading',
            'Real-time Data',
            'Order Management',
            'Market Data',
            'User Management'
          ],
          documentation: 'https://www.kraken.com/features/api'
        };
      
      default:
        throw new Error(`Unknown exchange: ${exchange}`);
    }
  }
}

// Export convenience functions
export function createExchangeService(config: ExchangeServiceConfig): ExchangeApiService {
  const factory = ExchangeServiceFactory.getInstance(config.logger);
  return factory.createService(config);
}

export function createExchangeServiceWithValidation(config: ExchangeServiceConfig): ExchangeApiService {
  const factory = ExchangeServiceFactory.getInstance(config.logger);
  return factory.createServiceWithValidation(config);
}

export function testExchangeConnection(config: ExchangeServiceConfig): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  const factory = ExchangeServiceFactory.getInstance(config.logger);
  return factory.testConnection(config);
}

export function getSupportedExchanges(): SupportedExchange[] {
  const factory = ExchangeServiceFactory.getInstance(console as any); // Dummy logger
  return factory.getSupportedExchanges();
}

export function isExchangeSupported(exchange: string): exchange is SupportedExchange {
  const factory = ExchangeServiceFactory.getInstance(console as any); // Dummy logger
  return factory.isExchangeSupported(exchange);
}
