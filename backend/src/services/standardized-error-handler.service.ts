import { FastifyReply } from 'fastify';
import { Logger } from 'winston';

export interface APIError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export interface ErrorContext {
  service: string;
  operation: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export class StandardizedErrorHandler {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Handle external API errors
   */
  handleExternalAPIError(error: any, context: ErrorContext): APIError {
    this.logger.error('External API Error', {
      service: context.service,
      operation: context.operation,
      error: error.message,
      stack: error.stack,
      context
    });

    if (error.response) {
      // API responded with error status
      return {
        code: this.getErrorCode(error.response.status),
        message: this.getErrorMessage(error.response.status, error.response.data?.message),
        statusCode: error.response.status,
        details: {
          response: error.response.data,
          headers: error.response.headers,
          url: error.config?.url,
          method: error.config?.method
        },
        timestamp: new Date().toISOString(),
        requestId: context.requestId
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        code: 'NETWORK_ERROR',
        message: 'No response from external API',
        statusCode: 503,
        details: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.code === 'ECONNABORTED'
        },
        timestamp: new Date().toISOString(),
        requestId: context.requestId
      };
    } else {
      // Something else happened
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unknown error occurred',
        statusCode: 500,
        details: {
          originalError: error.message,
          stack: error.stack
        },
        timestamp: new Date().toISOString(),
        requestId: context.requestId
      };
    }
  }

  /**
   * Handle authentication errors
   */
  handleAuthenticationError(error: any, context: ErrorContext): APIError {
    this.logger.warn('Authentication Error', {
      service: context.service,
      operation: context.operation,
      userId: context.userId,
      error: error.message,
      context
    });

    return {
      code: 'AUTHENTICATION_FAILED',
      message: 'Authentication failed',
      statusCode: 401,
      details: {
        reason: error.message,
        service: context.service
      },
      timestamp: new Date().toISOString(),
      requestId: context.requestId
    };
  }

  /**
   * Handle authorization errors
   */
  handleAuthorizationError(error: any, context: ErrorContext): APIError {
    this.logger.warn('Authorization Error', {
      service: context.service,
      operation: context.operation,
      userId: context.userId,
      error: error.message,
      context
    });

    return {
      code: 'AUTHORIZATION_FAILED',
      message: 'Insufficient permissions',
      statusCode: 403,
      details: {
        reason: error.message,
        service: context.service,
        operation: context.operation
      },
      timestamp: new Date().toISOString(),
      requestId: context.requestId
    };
  }

  /**
   * Handle validation errors
   */
  handleValidationError(error: any, context: ErrorContext): APIError {
    this.logger.warn('Validation Error', {
      service: context.service,
      operation: context.operation,
      error: error.message,
      context
    });

    return {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      statusCode: 400,
      details: {
        validationErrors: error.details || error.message,
        service: context.service,
        operation: context.operation
      },
      timestamp: new Date().toISOString(),
      requestId: context.requestId
    };
  }

  /**
   * Handle rate limiting errors
   */
  handleRateLimitError(error: any, context: ErrorContext): APIError {
    this.logger.warn('Rate Limit Error', {
      service: context.service,
      operation: context.operation,
      error: error.message,
      context
    });

    return {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Rate limit exceeded',
      statusCode: 429,
      details: {
        retryAfter: error.retryAfter || 60,
        service: context.service,
        operation: context.operation
      },
      timestamp: new Date().toISOString(),
      requestId: context.requestId
    };
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error: any, context: ErrorContext): APIError {
    this.logger.error('Database Error', {
      service: context.service,
      operation: context.operation,
      error: error.message,
      stack: error.stack,
      context
    });

    return {
      code: 'DATABASE_ERROR',
      message: 'Database operation failed',
      statusCode: 500,
      details: {
        reason: error.message,
        service: context.service,
        operation: context.operation
      },
      timestamp: new Date().toISOString(),
      requestId: context.requestId
    };
  }

  /**
   * Handle encryption/decryption errors
   */
  handleEncryptionError(error: any, context: ErrorContext): APIError {
    this.logger.error('Encryption Error', {
      service: context.service,
      operation: context.operation,
      error: error.message,
      stack: error.stack,
      context
    });

    return {
      code: 'ENCRYPTION_ERROR',
      message: 'Encryption/decryption failed',
      statusCode: 500,
      details: {
        reason: error.message,
        service: context.service,
        operation: context.operation
      },
      timestamp: new Date().toISOString(),
      requestId: context.requestId
    };
  }

  /**
   * Handle generic internal errors
   */
  handleInternalError(error: any, context: ErrorContext): APIError {
    this.logger.error('Internal Error', {
      service: context.service,
      operation: context.operation,
      error: error.message,
      stack: error.stack,
      context
    });

    return {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      statusCode: 500,
      details: {
        service: context.service,
        operation: context.operation
      },
      timestamp: new Date().toISOString(),
      requestId: context.requestId
    };
  }

  /**
   * Send standardized error response
   */
  sendErrorResponse(reply: FastifyReply, apiError: APIError): void {
    reply.status(apiError.statusCode).send({
      success: false,
      error: apiError.code,
      message: apiError.message,
      details: apiError.details,
      timestamp: apiError.timestamp,
      requestId: apiError.requestId
    });
  }

  /**
   * Get error code based on HTTP status
   */
  private getErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT'
    };

    return errorCodes[status] || 'UNKNOWN_ERROR';
  }

  /**
   * Get user-friendly error message based on HTTP status
   */
  private getErrorMessage(status: number, originalMessage?: string): string {
    const errorMessages: Record<number, string> = {
      400: 'Invalid request parameters',
      401: 'Authentication required',
      403: 'Access denied',
      404: 'Resource not found',
      409: 'Resource conflict',
      422: 'Invalid data format',
      429: 'Too many requests',
      500: 'Internal server error',
      502: 'Bad gateway',
      503: 'Service unavailable',
      504: 'Gateway timeout'
    };

    return originalMessage || errorMessages[status] || 'An error occurred';
  }

  /**
   * Create error context
   */
  createContext(service: string, operation: string, userId?: string, requestId?: string): ErrorContext {
    return {
      service,
      operation,
      userId,
      requestId,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Log error with context
   */
  logError(error: any, context: ErrorContext, level: 'error' | 'warn' | 'info' = 'error'): void {
    const logData = {
      service: context.service,
      operation: context.operation,
      userId: context.userId,
      requestId: context.requestId,
      error: error.message,
      stack: error.stack,
      metadata: context.metadata
    };

    switch (level) {
      case 'error':
        this.logger.error('Error occurred', logData);
        break;
      case 'warn':
        this.logger.warn('Warning occurred', logData);
        break;
      case 'info':
        this.logger.info('Info message', logData);
        break;
    }
  }
}
