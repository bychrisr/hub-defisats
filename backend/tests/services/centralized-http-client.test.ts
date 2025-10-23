import { CentralizedHTTPClient, HTTPClientConfig } from '../../src/services/centralized-http-client.service';
import { Logger } from 'winston';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
} as unknown as Logger;

describe('CentralizedHTTPClient', () => {
  let client: CentralizedHTTPClient;
  let config: HTTPClientConfig;

  beforeEach(() => {
    config = {
      baseURL: 'https://api.example.com',
      timeout: 5000,
      retries: 3,
      retryDelay: 1000,
      rateLimit: {
        requests: 10,
        window: 60000
      },
      headers: {
        'Authorization': 'Bearer test-token'
      }
    };

    client = new CentralizedHTTPClient(config, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Configuration', () => {
    it('should initialize with correct configuration', () => {
      expect(client.getConfig()).toEqual(config);
    });

    it('should update configuration', () => {
      const newConfig = { timeout: 10000 };
      client.updateConfig(newConfig);
      
      const updatedConfig = client.getConfig();
      expect(updatedConfig.timeout).toBe(10000);
      expect(updatedConfig.baseURL).toBe(config.baseURL);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const endpoint = '/test';
      expect(client.getRateLimitStatus(endpoint).remaining).toBe(10);
    });

    it('should track rate limit status', () => {
      const endpoint = '/test';
      const status = client.getRateLimitStatus(endpoint);
      
      expect(status).toHaveProperty('count');
      expect(status).toHaveProperty('resetTime');
      expect(status).toHaveProperty('remaining');
    });

    it('should clear rate limit', () => {
      const endpoint = '/test';
      client.clearRateLimit(endpoint);
      
      const status = client.getRateLimitStatus(endpoint);
      expect(status.count).toBe(0);
    });

    it('should clear all rate limits', () => {
      client.clearAllRateLimits();
      
      const status = client.getRateLimitStatus('/test');
      expect(status.count).toBe(0);
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      // Mock axios
      jest.mock('axios');
    });

    it('should have GET method', () => {
      expect(typeof client.get).toBe('function');
    });

    it('should have POST method', () => {
      expect(typeof client.post).toBe('function');
    });

    it('should have PUT method', () => {
      expect(typeof client.put).toBe('function');
    });

    it('should have DELETE method', () => {
      expect(typeof client.delete).toBe('function');
    });

    it('should have PATCH method', () => {
      expect(typeof client.patch).toBe('function');
    });

    it('should have request method', () => {
      expect(typeof client.request).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Mock axios to throw network error
      const axios = require('axios');
      axios.create = jest.fn().mockReturnValue({
        get: jest.fn().mockRejectedValue(new Error('Network Error')),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() }
        }
      });

      const newClient = new CentralizedHTTPClient(config, mockLogger);
      
      try {
        await newClient.get('/test');
      } catch (error) {
        expect(error.message).toBe('Network Error');
      }
    });
  });

  describe('Logging', () => {
    it('should log requests', () => {
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it('should log errors', () => {
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
