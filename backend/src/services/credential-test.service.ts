import { ExchangeService } from './exchange.service';
import { PrismaClient } from '@prisma/client';

export interface CredentialTestResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface ExchangeTestHandler {
  testCredentials(credentials: Record<string, string>): Promise<CredentialTestResult>;
}

export class CredentialTestService {
  private testHandlers: Map<string, ExchangeTestHandler> = new Map();

  constructor(
    private prisma: PrismaClient,
    private exchangeService: ExchangeService
  ) {
    this.registerTestHandlers();
  }

  /**
   * Register test handlers for different exchanges
   */
  private registerTestHandlers(): void {
    console.log('🔧 CREDENTIAL TEST SERVICE - Registering test handlers...');
    
    // Register LN Markets test handler
    this.testHandlers.set('ln-markets', new LNMarketsTestHandler());
    
    // Future exchanges can be registered here
    // this.testHandlers.set('binance', new BinanceTestHandler());
    // this.testHandlers.set('coinbase', new CoinbaseTestHandler());
    
    console.log('✅ CREDENTIAL TEST SERVICE - Test handlers registered:', Array.from(this.testHandlers.keys()));
  }

  /**
   * Test user credentials for a specific exchange
   */
  async testUserCredentials(userId: string, exchangeId: string): Promise<CredentialTestResult> {
    console.log('🧪 CREDENTIAL TEST SERVICE - Testing credentials:', { userId, exchangeId });
    
    try {
      // Get exchange info
      const exchange = await this.exchangeService.getExchangeById(exchangeId);
      if (!exchange) {
        return {
          success: false,
          message: 'Exchange not found',
          error: 'EXCHANGE_NOT_FOUND'
        };
      }

      // ✅ NOVA ARQUITETURA: Usar credenciais da nova estrutura de múltiplas exchanges
      const userCredentials = await this.exchangeService.getUserCredentialsForExchange(userId, exchangeId);
      if (!userCredentials) {
        return {
          success: false,
          message: 'No credentials found for this exchange',
          error: 'NO_CREDENTIALS'
        };
      }

      // Get test handler for this exchange
      const testHandler = this.testHandlers.get(exchange.slug);
      if (!testHandler) {
        return {
          success: false,
          message: `No test handler available for ${exchange.name}`,
          error: 'NO_TEST_HANDLER'
        };
      }

      // ✅ NOVA ARQUITETURA: Usar credenciais descriptografadas da nova estrutura
      const { AuthService } = await import('./auth.service');
      const authService = new AuthService(this.prisma, {} as any);
      
      // Descriptografar credenciais da nova estrutura
      const decryptedCredentials: Record<string, string> = {};
      // Usar Object.keys para evitar corrupção das chaves
      const keys = Object.keys(userCredentials.credentials as Record<string, string>);
      for (const key of keys) {
        const encryptedValue = userCredentials.credentials[key];
        try {
          decryptedCredentials[key] = authService.decryptData(encryptedValue);
        } catch (error: any) {
          console.error(`❌ CREDENTIAL TEST SERVICE - Error decrypting ${key}:`, error);
          return {
            success: false,
            message: `Failed to decrypt ${key}`,
            error: 'DECRYPTION_ERROR'
          };
        }
      }

      // Test credentials
      const result = await testHandler.testCredentials(decryptedCredentials);
      
      // Update verification status
      await this.exchangeService.updateCredentialVerification(
        userId,
        exchangeId,
        result.success,
        new Date()
      );

      console.log('✅ CREDENTIAL TEST SERVICE - Test completed:', {
        exchange: exchange.name,
        success: result.success,
        message: result.message
      });

      return result;

    } catch (error: any) {
      console.error('❌ CREDENTIAL TEST SERVICE - Error testing credentials:', error);
      return {
        success: false,
        message: 'Internal error during credential test',
        error: error.message
      };
    }
  }

  /**
   * Test credentials for any exchange (generic)
   */
  async testCredentialsForExchange(
    exchangeSlug: string, 
    credentials: Record<string, string>
  ): Promise<CredentialTestResult> {
    console.log('🧪 CREDENTIAL TEST SERVICE - Testing credentials for exchange:', exchangeSlug);
    
    const testHandler = this.testHandlers.get(exchangeSlug);
    if (!testHandler) {
      return {
        success: false,
        message: `No test handler available for ${exchangeSlug}`,
        error: 'NO_TEST_HANDLER'
      };
    }

    try {
      const result = await testHandler.testCredentials(credentials);
      console.log('✅ CREDENTIAL TEST SERVICE - Test completed:', result);
      return result;
    } catch (error: any) {
      console.error('❌ CREDENTIAL TEST SERVICE - Error testing credentials:', error);
      return {
        success: false,
        message: 'Error during credential test',
        error: error.message
      };
    }
  }

  /**
   * Get available test handlers
   */
  getAvailableTestHandlers(): string[] {
    return Array.from(this.testHandlers.keys());
  }
}

/**
 * LN Markets Test Handler
 */
class LNMarketsTestHandler implements ExchangeTestHandler {
  async testCredentials(credentials: Record<string, string>): Promise<CredentialTestResult> {
    console.log('🧪 LN MARKETS TEST HANDLER - Testing LN Markets credentials...');
    
    try {
      // Import LN Markets API v2 service dynamically to avoid circular dependencies
      const { LNMarketsAPIv2 } = await import('./lnmarkets/LNMarketsAPIv2.service');
      
      // Create a simple logger for testing
      const logger = {
        info: (message: string) => console.log(`[TEST] ${message}`),
        error: (message: string) => console.error(`[TEST] ${message}`),
        warn: (message: string) => console.warn(`[TEST] ${message}`),
        debug: (message: string) => console.debug(`[TEST] ${message}`)
      } as any;
      
      // Create API service instance with test credentials
      const apiService = new LNMarketsAPIv2({
        credentials: {
          apiKey: credentials.api_key,
          apiSecret: credentials.api_secret,
          passphrase: credentials.passphrase,
          isTestnet: false
        },
        logger: logger
      });

      // Test with a simple API call (get user info)
      const userInfo = await apiService.user.getUser();
      
      console.log('✅ LN MARKETS TEST HANDLER - Credentials test successful');
      return {
        success: true,
        message: 'LN Markets credentials are valid',
        data: {
          user_id: userInfo.id,
          username: userInfo.username,
          email: userInfo.email
        }
      };

    } catch (error: any) {
      console.error('❌ LN MARKETS TEST HANDLER - Credentials test failed:', error);
      
      let errorMessage = 'Invalid credentials';
      if (error.message?.includes('401')) {
        errorMessage = 'Invalid API credentials';
      } else if (error.message?.includes('403')) {
        errorMessage = 'API access denied';
      } else if (error.message?.includes('429')) {
        errorMessage = 'Rate limit exceeded';
      } else if (error.message?.includes('network')) {
        errorMessage = 'Network error - please check your connection';
      }

      return {
        success: false,
        message: errorMessage,
        error: error.message
      };
    }
  }
}

/**
 * Future: Binance Test Handler
 */
// class BinanceTestHandler implements ExchangeTestHandler {
//   async testCredentials(credentials: Record<string, string>): Promise<CredentialTestResult> {
//     // Implementation for Binance API test
//     return { success: true, message: 'Binance credentials are valid' };
//   }
// }

/**
 * Future: Coinbase Test Handler
 */
// class CoinbaseTestHandler implements ExchangeTestHandler {
//   async testCredentials(credentials: Record<string, string>): Promise<CredentialTestResult> {
//     // Implementation for Coinbase API test
//     return { success: true, message: 'Coinbase credentials are valid' };
//   }
// }
