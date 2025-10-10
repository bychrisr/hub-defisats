import { LNMarketsAPIv2 } from '../services/lnmarkets/LNMarketsAPIv2.service';

/**
 * Factory function to create LNMarketsAPIv2 instances
 * This allows for easier testing and dependency injection
 */
export function createLNMarketsService(credentials: any): LNMarketsAPIv2 {
  return new LNMarketsAPIv2({
    credentials: credentials,
    logger: console as any
  });
}

/**
 * Factory function to create LNMarketsAPIv2 with default test credentials
 * Used primarily for testing purposes
 */
export function createTestLNMarketsService(): LNMarketsAPIv2 {
  return new LNMarketsAPIv2({
    credentials: {
      apiKey: 'test-api-key',
      apiSecret: 'test-api-secret',
      passphrase: 'test-passphrase',
      isTestnet: false
    },
    logger: console as any
  });
}
