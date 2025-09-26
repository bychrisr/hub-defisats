import { LNMarketsAPIService, LNMarketsCredentials } from '../services/lnmarkets-api.service';

/**
 * Factory function to create LNMarketsAPIService instances
 * This allows for easier testing and dependency injection
 */
export function createLNMarketsService(credentials: LNMarketsCredentials): LNMarketsAPIService {
  return new LNMarketsAPIService(credentials, console as any);
}

/**
 * Factory function to create LNMarketsAPIService with default test credentials
 * Used primarily for testing purposes
 */
export function createTestLNMarketsService(): LNMarketsAPIService {
  return new LNMarketsAPIService({
    apiKey: 'test-api-key',
    apiSecret: 'test-api-secret',
    passphrase: 'test-passphrase',
  }, console as any);
}
