import { StandardizedErrorHandler, ErrorContext } from '../../src/services/standardized-error-handler.service';
import { Logger } from 'winston';

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
} as unknown as Logger;

describe('StandardizedErrorHandler', () => {
  let errorHandler: StandardizedErrorHandler;
  let mockReply: any;

  beforeEach(() => {
    errorHandler = new StandardizedErrorHandler(mockLogger);
    
    mockReply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('External API Error Handling', () => {
    it('should handle API response errors', () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Not Found' },
          headers: {},
          config: { url: '/test', method: 'GET' }
        },
        config: { url: '/test', method: 'GET' }
      };

      const context: ErrorContext = {
        service: 'test-service',
        operation: 'test-operation',
        userId: 'user123',
        requestId: 'req123'
      };

      const apiError = errorHandler.handleExternalAPIError(error, context);

      expect(apiError.code).toBe('NOT_FOUND');
      expect(apiError.statusCode).toBe(404);
      expect(apiError.message).toBe('Resource not found');
      expect(apiError.details).toHaveProperty('response');
      expect(apiError.details).toHaveProperty('headers');
      expect(apiError.details).toHaveProperty('url');
      expect(apiError.details).toHaveProperty('method');
    });

    it('should handle network errors', () => {
      const error = {
        request: {},
        config: { url: '/test', method: 'GET' },
        code: 'ECONNABORTED'
      };

      const context: ErrorContext = {
        service: 'test-service',
        operation: 'test-operation'
      };

      const apiError = errorHandler.handleExternalAPIError(error, context);

      expect(apiError.code).toBe('NETWORK_ERROR');
      expect(apiError.statusCode).toBe(503);
      expect(apiError.message).toBe('No response from external API');
      expect(apiError.details).toHaveProperty('url');
      expect(apiError.details).toHaveProperty('method');
      expect(apiError.details).toHaveProperty('timeout');
    });

    it('should handle unknown errors', () => {
      const error = new Error('Unknown error');

      const context: ErrorContext = {
        service: 'test-service',
        operation: 'test-operation'
      };

      const apiError = errorHandler.handleExternalAPIError(error, context);

      expect(apiError.code).toBe('UNKNOWN_ERROR');
      expect(apiError.statusCode).toBe(500);
      expect(apiError.message).toBe('Unknown error');
      expect(apiError.details).toHaveProperty('originalError');
      expect(apiError.details).toHaveProperty('stack');
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle authentication errors', () => {
      const error = new Error('Invalid credentials');
      const context: ErrorContext = {
        service: 'test-service',
        operation: 'test-operation',
        userId: 'user123'
      };

      const apiError = errorHandler.handleAuthenticationError(error, context);

      expect(apiError.code).toBe('AUTHENTICATION_FAILED');
      expect(apiError.statusCode).toBe(401);
      expect(apiError.message).toBe('Authentication failed');
      expect(apiError.details).toHaveProperty('reason');
      expect(apiError.details).toHaveProperty('service');
    });
  });

  describe('Authorization Error Handling', () => {
    it('should handle authorization errors', () => {
      const error = new Error('Insufficient permissions');
      const context: ErrorContext = {
        service: 'test-service',
        operation: 'test-operation',
        userId: 'user123'
      };

      const apiError = errorHandler.handleAuthorizationError(error, context);

      expect(apiError.code).toBe('AUTHORIZATION_FAILED');
      expect(apiError.statusCode).toBe(403);
      expect(apiError.message).toBe('Insufficient permissions');
      expect(apiError.details).toHaveProperty('reason');
      expect(apiError.details).toHaveProperty('service');
      expect(apiError.details).toHaveProperty('operation');
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle validation errors', () => {
      const error = {
        message: 'Validation failed',
        details: ['Field is required', 'Invalid format']
      };

      const context: ErrorContext = {
        service: 'test-service',
        operation: 'test-operation'
      };

      const apiError = errorHandler.handleValidationError(error, context);

      expect(apiError.code).toBe('VALIDATION_ERROR');
      expect(apiError.statusCode).toBe(400);
      expect(apiError.message).toBe('Invalid input data');
      expect(apiError.details).toHaveProperty('validationErrors');
      expect(apiError.details).toHaveProperty('service');
      expect(apiError.details).toHaveProperty('operation');
    });
  });

  describe('Rate Limit Error Handling', () => {
    it('should handle rate limit errors', () => {
      const error = {
        message: 'Rate limit exceeded',
        retryAfter: 60
      };

      const context: ErrorContext = {
        service: 'test-service',
        operation: 'test-operation'
      };

      const apiError = errorHandler.handleRateLimitError(error, context);

      expect(apiError.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(apiError.statusCode).toBe(429);
      expect(apiError.message).toBe('Rate limit exceeded');
      expect(apiError.details).toHaveProperty('retryAfter');
      expect(apiError.details).toHaveProperty('service');
      expect(apiError.details).toHaveProperty('operation');
    });
  });

  describe('Database Error Handling', () => {
    it('should handle database errors', () => {
      const error = new Error('Connection failed');
      const context: ErrorContext = {
        service: 'test-service',
        operation: 'test-operation'
      };

      const apiError = errorHandler.handleDatabaseError(error, context);

      expect(apiError.code).toBe('DATABASE_ERROR');
      expect(apiError.statusCode).toBe(500);
      expect(apiError.message).toBe('Database operation failed');
      expect(apiError.details).toHaveProperty('reason');
      expect(apiError.details).toHaveProperty('service');
      expect(apiError.details).toHaveProperty('operation');
    });
  });

  describe('Encryption Error Handling', () => {
    it('should handle encryption errors', () => {
      const error = new Error('Decryption failed');
      const context: ErrorContext = {
        service: 'test-service',
        operation: 'test-operation'
      };

      const apiError = errorHandler.handleEncryptionError(error, context);

      expect(apiError.code).toBe('ENCRYPTION_ERROR');
      expect(apiError.statusCode).toBe(500);
      expect(apiError.message).toBe('Encryption/decryption failed');
      expect(apiError.details).toHaveProperty('reason');
      expect(apiError.details).toHaveProperty('service');
      expect(apiError.details).toHaveProperty('operation');
    });
  });

  describe('Internal Error Handling', () => {
    it('should handle internal errors', () => {
      const error = new Error('Internal server error');
      const context: ErrorContext = {
        service: 'test-service',
        operation: 'test-operation'
      };

      const apiError = errorHandler.handleInternalError(error, context);

      expect(apiError.code).toBe('INTERNAL_ERROR');
      expect(apiError.statusCode).toBe(500);
      expect(apiError.message).toBe('Internal server error');
      expect(apiError.details).toHaveProperty('service');
      expect(apiError.details).toHaveProperty('operation');
    });
  });

  describe('Error Response Sending', () => {
    it('should send error response', () => {
      const apiError = {
        code: 'TEST_ERROR',
        message: 'Test error message',
        statusCode: 400,
        details: { test: 'data' },
        timestamp: new Date().toISOString(),
        requestId: 'req123'
      };

      errorHandler.sendErrorResponse(mockReply, apiError);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'TEST_ERROR',
        message: 'Test error message',
        details: { test: 'data' },
        timestamp: apiError.timestamp,
        requestId: 'req123'
      });
    });
  });

  describe('Context Creation', () => {
    it('should create error context', () => {
      const context = errorHandler.createContext('test-service', 'test-operation', 'user123', 'req123');

      expect(context.service).toBe('test-service');
      expect(context.operation).toBe('test-operation');
      expect(context.userId).toBe('user123');
      expect(context.requestId).toBe('req123');
      expect(context.metadata).toHaveProperty('timestamp');
    });
  });

  describe('Error Logging', () => {
    it('should log errors with context', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        service: 'test-service',
        operation: 'test-operation',
        userId: 'user123',
        requestId: 'req123',
        metadata: { test: 'data' }
      };

      errorHandler.logError(error, context, 'error');

      expect(mockLogger.error).toHaveBeenCalledWith('Error occurred', {
        service: 'test-service',
        operation: 'test-operation',
        userId: 'user123',
        requestId: 'req123',
        error: 'Test error',
        stack: error.stack,
        metadata: { test: 'data' }
      });
    });

    it('should log warnings with context', () => {
      const error = new Error('Test warning');
      const context: ErrorContext = {
        service: 'test-service',
        operation: 'test-operation'
      };

      errorHandler.logError(error, context, 'warn');

      expect(mockLogger.warn).toHaveBeenCalledWith('Warning occurred', {
        service: 'test-service',
        operation: 'test-operation',
        userId: undefined,
        requestId: undefined,
        error: 'Test warning',
        stack: error.stack,
        metadata: undefined
      });
    });

    it('should log info with context', () => {
      const error = new Error('Test info');
      const context: ErrorContext = {
        service: 'test-service',
        operation: 'test-operation'
      };

      errorHandler.logError(error, context, 'info');

      expect(mockLogger.info).toHaveBeenCalledWith('Info message', {
        service: 'test-service',
        operation: 'test-operation',
        userId: undefined,
        requestId: undefined,
        error: 'Test info',
        stack: error.stack,
        metadata: undefined
      });
    });
  });
});
