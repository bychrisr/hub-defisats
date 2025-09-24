import { LNMarketsService, LNMarketsCredentials } from '../services/lnmarkets.service';

/**
 * Factory function to create LNMarketsService instances
 * This allows for easier testing and dependency injection
 */
export function createLNMarketsService(credentials: LNMarketsCredentials): LNMarketsService {
  return new LNMarketsService(credentials);
}

/**
 * Factory function to create LNMarketsService with default test credentials
 * Used primarily for testing purposes
 */
export function createTestLNMarketsService(): LNMarketsService {
  return new LNMarketsService({
    apiKey: 'test-api-key',
    apiSecret: 'test-api-secret',
    passphrase: 'test-passphrase',
  });
}
