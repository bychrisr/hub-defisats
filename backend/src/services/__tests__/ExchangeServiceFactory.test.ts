/**
 * Exchange Service Factory Tests
 * 
 * Unit tests for ExchangeServiceFactory implementation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ExchangeServiceFactory, SupportedExchange } from '../ExchangeServiceFactory';
import { LNMarketsCredentials } from '../LNMarketsApiService';
import { Logger } from 'winston';

// Mock winston logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;

// Mock LNMarketsApiService
jest.mock('../LNMarketsApiService');

describe('ExchangeServiceFactory', () => {
  let factory: ExchangeServiceFactory;

  beforeEach(() => {
    factory = ExchangeServiceFactory.getInstance(mockLogger);
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = ExchangeServiceFactory.getInstance(mockLogger);
      const instance2 = ExchangeServiceFactory.getInstance(mockLogger);
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('createService', () => {
    it('should create LN Markets service', () => {
      const credentials: LNMarketsCredentials = {
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret',
        passphrase: 'test-passphrase',
        isTestnet: false
      };

      const config = {
        exchange: 'lnmarkets' as SupportedExchange,
        credentials,
        logger: mockLogger
      };

      const service = factory.createService(config);

      expect(service).toBeDefined();
      expect(service.getExchangeName()).toBe('LN Markets');
    });

    it('should throw error for unsupported exchange', () => {
      const credentials = {
        apiKey: 'test-key',
        apiSecret: 'test-secret'
      };

      const config = {
        exchange: 'unsupported' as SupportedExchange,
        credentials,
        logger: mockLogger
      };

      expect(() => factory.createService(config)).toThrow('Unsupported exchange: unsupported');
    });
  });

  describe('getSupportedExchanges', () => {
    it('should return list of supported exchanges', () => {
      const exchanges = factory.getSupportedExchanges();
      
      expect(exchanges).toContain('lnmarkets');
      expect(exchanges.length).toBeGreaterThan(0);
    });
  });

  describe('isExchangeSupported', () => {
    it('should return true for supported exchanges', () => {
      expect(factory.isExchangeSupported('lnmarkets')).toBe(true);
    });

    it('should return false for unsupported exchanges', () => {
      expect(factory.isExchangeSupported('unsupported')).toBe(false);
    });
  });

  describe('getExchangeRequirements', () => {
    it('should return requirements for LN Markets', () => {
      const requirements = factory.getExchangeRequirements('lnmarkets');
      
      expect(requirements.requiredFields).toContain('apiKey');
      expect(requirements.requiredFields).toContain('apiSecret');
      expect(requirements.requiredFields).toContain('passphrase');
      expect(requirements.optionalFields).toContain('sandbox');
      expect(requirements.optionalFields).toContain('isTestnet');
      expect(requirements.description).toContain('LN Markets');
    });

    it('should throw error for unknown exchange', () => {
      expect(() => factory.getExchangeRequirements('unknown' as SupportedExchange))
        .toThrow('Unknown exchange: unknown');
    });
  });

  describe('validateCredentials', () => {
    it('should validate LN Markets credentials successfully', () => {
      const credentials: LNMarketsCredentials = {
        apiKey: 'test-api-key-12345',
        apiSecret: 'test-api-secret-12345',
        passphrase: 'test-passphrase-123',
        isTestnet: false
      };

      const result = factory.validateCredentials('lnmarkets', credentials);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid LN Markets credentials', () => {
      const credentials: LNMarketsCredentials = {
        apiKey: 'short',
        apiSecret: 'short',
        passphrase: 'ab',
        isTestnet: false
      };

      const result = factory.validateCredentials('lnmarkets', credentials);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('LN Markets API key must be at least 10 characters');
      expect(result.errors).toContain('LN Markets API secret must be at least 10 characters');
      expect(result.errors).toContain('LN Markets passphrase must be at least 3 characters');
    });

    it('should return errors for missing required fields', () => {
      const credentials = {
        apiKey: 'test-key'
        // Missing apiSecret and passphrase
      };

      const result = factory.validateCredentials('lnmarkets', credentials);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: apiSecret');
      expect(result.errors).toContain('Missing required field: passphrase');
    });
  });

  describe('createServiceWithValidation', () => {
    it('should create service with valid credentials', () => {
      const credentials: LNMarketsCredentials = {
        apiKey: 'test-api-key-12345',
        apiSecret: 'test-api-secret-12345',
        passphrase: 'test-passphrase-123',
        isTestnet: false
      };

      const config = {
        exchange: 'lnmarkets' as SupportedExchange,
        credentials,
        logger: mockLogger
      };

      const service = factory.createServiceWithValidation(config);

      expect(service).toBeDefined();
    });

    it('should throw error for invalid credentials', () => {
      const credentials: LNMarketsCredentials = {
        apiKey: 'short',
        apiSecret: 'short',
        passphrase: 'ab',
        isTestnet: false
      };

      const config = {
        exchange: 'lnmarkets' as SupportedExchange,
        credentials,
        logger: mockLogger
      };

      expect(() => factory.createServiceWithValidation(config))
        .toThrow('Invalid credentials for lnmarkets');
    });

    it('should throw error for unsupported exchange', () => {
      const credentials = {
        apiKey: 'test-key',
        apiSecret: 'test-secret'
      };

      const config = {
        exchange: 'unsupported' as SupportedExchange,
        credentials,
        logger: mockLogger
      };

      expect(() => factory.createServiceWithValidation(config))
        .toThrow('Unsupported exchange: unsupported');
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      const credentials: LNMarketsCredentials = {
        apiKey: 'test-api-key-12345',
        apiSecret: 'test-api-secret-12345',
        passphrase: 'test-passphrase-123',
        isTestnet: false
      };

      const config = {
        exchange: 'lnmarkets' as SupportedExchange,
        credentials,
        logger: mockLogger
      };

      // Mock the service to return successful validation
      const mockService = {
        validateCredentials: jest.fn().mockResolvedValue(true)
      };
      
      jest.spyOn(factory as any, 'createServiceWithValidation').mockReturnValue(mockService);

      const result = await factory.testConnection(config);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Connection to lnmarkets successful');
    });

    it('should handle connection failure', async () => {
      const credentials: LNMarketsCredentials = {
        apiKey: 'test-api-key-12345',
        apiSecret: 'test-api-secret-12345',
        passphrase: 'test-passphrase-123',
        isTestnet: false
      };

      const config = {
        exchange: 'lnmarkets' as SupportedExchange,
        credentials,
        logger: mockLogger
      };

      // Mock the service to return failed validation
      const mockService = {
        validateCredentials: jest.fn().mockResolvedValue(false)
      };
      
      jest.spyOn(factory as any, 'createServiceWithValidation').mockReturnValue(mockService);

      const result = await factory.testConnection(config);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Connection to lnmarkets failed');
      expect(result.error).toBe('Invalid credentials');
    });

    it('should handle service creation error', async () => {
      const credentials: LNMarketsCredentials = {
        apiKey: 'short',
        apiSecret: 'short',
        passphrase: 'ab',
        isTestnet: false
      };

      const config = {
        exchange: 'lnmarkets' as SupportedExchange,
        credentials,
        logger: mockLogger
      };

      const result = await factory.testConnection(config);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Connection to lnmarkets failed');
      expect(result.error).toContain('Invalid credentials');
    });
  });

  describe('getExchangeInfo', () => {
    it('should return info for LN Markets', () => {
      const info = factory.getExchangeInfo('lnmarkets');

      expect(info.name).toBe('LN Markets');
      expect(info.version).toBe('2.0');
      expect(info.supportedFeatures).toContain('Futures Trading');
      expect(info.supportedFeatures).toContain('Lightning Network');
      expect(info.documentation).toContain('docs.lnmarkets.com');
    });

    it('should throw error for unknown exchange', () => {
      expect(() => factory.getExchangeInfo('unknown' as SupportedExchange))
        .toThrow('Unknown exchange: unknown');
    });
  });
});

describe('Convenience functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createExchangeService', () => {
    it('should create service using convenience function', () => {
      const credentials: LNMarketsCredentials = {
        apiKey: 'test-api-key',
        apiSecret: 'test-api-secret',
        passphrase: 'test-passphrase',
        isTestnet: false
      };

      const config = {
        exchange: 'lnmarkets' as SupportedExchange,
        credentials,
        logger: mockLogger
      };

      const service = require('../ExchangeServiceFactory').createExchangeService(config);

      expect(service).toBeDefined();
    });
  });

  describe('getSupportedExchanges', () => {
    it('should return supported exchanges', () => {
      const exchanges = require('../ExchangeServiceFactory').getSupportedExchanges();

      expect(exchanges).toContain('lnmarkets');
    });
  });

  describe('isExchangeSupported', () => {
    it('should check if exchange is supported', () => {
      const isSupported = require('../ExchangeServiceFactory').isExchangeSupported('lnmarkets');

      expect(isSupported).toBe(true);
    });
  });
});
