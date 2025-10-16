---
title: Error Handling and Recovery
category: troubleshooting
subcategory: error-handling
tags: [error-handling, recovery, resilience, fault-tolerance, error-patterns]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["Backend Team", "Frontend Team"]
---

# Error Handling and Recovery

## Summary

Comprehensive guide to error handling and recovery strategies for the Axisor platform. This document covers error categorization, handling patterns, recovery mechanisms, and resilience strategies to ensure system stability and user experience.

## Error Categorization

### 1. Error Types and Severity

**Critical Errors (Severity: HIGH)**
- Database connection failures
- Authentication system failures
- Payment processing errors
- Data corruption issues
- Security breaches

**Major Errors (Severity: MEDIUM)**
- External API failures
- Performance degradation
- Feature unavailability
- User experience issues
- Configuration problems

**Minor Errors (Severity: LOW)**
- UI rendering issues
- Non-critical feature failures
- Logging problems
- Monitoring alerts
- Temporary glitches

### 2. Error Sources

**Application Errors**
- Business logic failures
- Validation errors
- Authentication/authorization issues
- Data processing errors

**Infrastructure Errors**
- Database connectivity issues
- Redis connection problems
- Network timeouts
- Container failures

**External Service Errors**
- LN Markets API failures
- LND service unavailability
- Third-party service outages
- Rate limiting issues

## Backend Error Handling

### 1. Centralized Error Handler

**Fastify Error Handler**
```typescript
// Centralized error handler for Fastify
export const errorHandler = (error: any, request: FastifyRequest, reply: FastifyReply) => {
  const errorId = uuidv4();
  const timestamp = new Date().toISOString();
  
  // Log error with context
  fastify.log.error('Request error occurred', {
    errorId,
    timestamp,
    error: error.message,
    stack: error.stack,
    method: request.method,
    url: request.url,
    headers: request.headers,
    body: request.body,
    user: request.user?.id,
    ip: request.ip,
    userAgent: request.headers['user-agent']
  });
  
  // Capture error in monitoring system
  if (monitoring) {
    monitoring.captureError(error, {
      request: {
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body,
      },
      user: request.user ? {
        id: request.user.id,
        email: request.user.email,
      } : undefined,
      errorId,
      timestamp
    });
  }
  
  // Handle specific error types
  if (error.code === 'P2002') {
    return reply.status(409).send({
      error: 'CONFLICT',
      message: 'Resource already exists',
      errorId: config.isDevelopment ? errorId : undefined,
      details: config.isDevelopment ? error.meta : undefined
    });
  }
  
  if (error.code === 'P2025') {
    return reply.status(404).send({
      error: 'NOT_FOUND',
      message: 'Resource not found',
      errorId: config.isDevelopment ? errorId : undefined
    });
  }
  
  if (error.validation) {
    return reply.status(400).send({
      error: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      errorId: config.isDevelopment ? errorId : undefined,
      details: config.isDevelopment ? error.validation : undefined
    });
  }
  
  if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
    return reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'Authorization header is required',
      errorId: config.isDevelopment ? errorId : undefined
    });
  }
  
  if (error.code === 'FST_JWT_AUTHORIZATION_TOKEN_INVALID') {
    return reply.status(401).send({
      error: 'UNAUTHORIZED',
      message: 'Invalid authorization token',
      errorId: config.isDevelopment ? errorId : undefined
    });
  }
  
  if (error.statusCode === 429) {
    const rateLimitData = error.data || {};
    return reply.status(429).send({
      error: 'RATE_LIMIT_EXCEEDED',
      message: rateLimitData.message || 'Too many requests, please try again later',
      retry_after: rateLimitData.retry_after || 60,
      limit: rateLimitData.limit || 100,
      remaining: rateLimitData.remaining || 0,
      reset_time: rateLimitData.reset_time,
      window_ms: rateLimitData.window_ms,
      type: rateLimitData.type || 'general',
      errorId: config.isDevelopment ? errorId : undefined
    });
  }
  
  // Default error response
  const statusCode = error.statusCode || 500;
  const message = config.isDevelopment ? error.message : 'Internal server error';
  
  return reply.status(statusCode).send({
    error: 'INTERNAL_SERVER_ERROR',
    message,
    errorId: config.isDevelopment ? errorId : undefined,
    ...(config.isDevelopment && { stack: error.stack })
  });
};
```

### 2. Service-Level Error Handling

**Database Service Error Handling**
```typescript
export class DatabaseService {
  private prisma: PrismaClient;
  private retryService: RetryService;
  
  constructor(prisma: PrismaClient, retryService: RetryService) {
    this.prisma = prisma;
    this.retryService = retryService;
  }
  
  async executeQuery<T>(
    queryFn: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await this.retryService.execute(
        queryFn,
        {
          maxAttempts: 3,
          baseDelay: 1000,
          backoffMultiplier: 2,
          retryCondition: (error) => {
            // Retry on connection errors
            return error.code === 'P1001' || // Connection error
                   error.code === 'P1002' || // Database unavailable
                   error.code === 'P1008' || // Operation timeout
                   error.code === 'P1017';   // Server closed connection
          }
        }
      );
    } catch (error) {
      logger.error(`Database operation failed: ${context}`, {
        error: error.message,
        code: error.code,
        context
      });
      
      // Categorize and handle specific database errors
      if (error.code === 'P1001') {
        throw new DatabaseConnectionError('Database connection failed', context);
      } else if (error.code === 'P1002') {
        throw new DatabaseUnavailableError('Database service unavailable', context);
      } else if (error.code === 'P2002') {
        throw new DuplicateResourceError('Resource already exists', context);
      } else if (error.code === 'P2025') {
        throw new ResourceNotFoundError('Resource not found', context);
      }
      
      throw new DatabaseError('Database operation failed', context, error);
    }
  }
  
  async withTransaction<T>(
    operations: (tx: PrismaClient) => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await this.prisma.$transaction(operations, {
        maxWait: 10000, // 10 seconds
        timeout: 15000  // 15 seconds
      });
    } catch (error) {
      logger.error(`Database transaction failed: ${context}`, {
        error: error.message,
        code: error.code,
        context
      });
      
      if (error.code === 'P2034') {
        throw new TransactionTimeoutError('Transaction timeout', context);
      } else if (error.code === 'P2024') {
        throw new TransactionConflictError('Transaction conflict', context);
      }
      
      throw new DatabaseTransactionError('Transaction failed', context, error);
    }
  }
}
```

**External API Error Handling**
```typescript
export class ExternalAPIService {
  private retryService: RetryService;
  private circuitBreaker: CircuitBreaker;
  
  constructor(retryService: RetryService) {
    this.retryService = retryService;
    this.circuitBreaker = new CircuitBreaker({
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000
    });
  }
  
  async makeAPICall<T>(
    apiCall: () => Promise<T>,
    context: string,
    options: APICallOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      timeout = 30000,
      circuitBreakerEnabled = true
    } = options;
    
    try {
      if (circuitBreakerEnabled) {
        return await this.circuitBreaker.fire(apiCall);
      }
      
      return await this.retryService.execute(
        apiCall,
        {
          maxAttempts: maxRetries,
          baseDelay: 1000,
          backoffMultiplier: 2,
          retryCondition: (error) => {
            // Retry on network errors and 5xx status codes
            return error.code === 'ECONNREFUSED' ||
                   error.code === 'ETIMEDOUT' ||
                   error.code === 'ENOTFOUND' ||
                   (error.response && error.response.status >= 500);
          }
        }
      );
    } catch (error) {
      logger.error(`External API call failed: ${context}`, {
        error: error.message,
        status: error.response?.status,
        context
      });
      
      // Handle specific API errors
      if (error.response) {
        const status = error.response.status;
        
        if (status === 401) {
          throw new AuthenticationError('API authentication failed', context);
        } else if (status === 403) {
          throw new AuthorizationError('API access forbidden', context);
        } else if (status === 404) {
          throw new NotFoundError('API resource not found', context);
        } else if (status === 429) {
          throw new RateLimitError('API rate limit exceeded', context);
        } else if (status >= 500) {
          throw new ServiceUnavailableError('API service unavailable', context);
        }
      }
      
      if (error.code === 'ECONNREFUSED') {
        throw new ConnectionError('API connection refused', context);
      } else if (error.code === 'ETIMEDOUT') {
        throw new TimeoutError('API request timeout', context);
      }
      
      throw new APIError('External API call failed', context, error);
    }
  }
}
```

### 3. Worker Error Handling

**BullMQ Worker Error Handling**
```typescript
export class WorkerErrorHandler {
  private logger: Logger;
  private notificationService: NotificationService;
  
  constructor(logger: Logger, notificationService: NotificationService) {
    this.logger = logger;
    this.notificationService = notificationService;
  }
  
  async handleWorkerError(
    job: Job,
    error: Error,
    workerType: string
  ): Promise<void> {
    const errorId = uuidv4();
    const context = {
      jobId: job.id,
      jobName: job.name,
      workerType,
      errorId,
      error: error.message,
      stack: error.stack,
      data: job.data,
      attempts: job.attemptsMade,
      maxAttempts: job.opts.attempts
    };
    
    // Log error with context
    this.logger.error(`Worker error: ${workerType}`, context);
    
    // Categorize error severity
    const severity = this.categorizeErrorSeverity(error, workerType);
    
    // Handle based on severity
    if (severity === 'CRITICAL') {
      await this.handleCriticalError(job, error, workerType);
    } else if (severity === 'HIGH') {
      await this.handleHighSeverityError(job, error, workerType);
    } else {
      await this.handleStandardError(job, error, workerType);
    }
    
    // Update job with error information
    await job.updateProgress({
      error: error.message,
      errorId,
      timestamp: new Date().toISOString(),
      severity
    });
  }
  
  private categorizeErrorSeverity(error: Error, workerType: string): string {
    // Critical errors that require immediate attention
    if (error.message.includes('Database connection') ||
        error.message.includes('Authentication failed') ||
        error.message.includes('Payment processing')) {
      return 'CRITICAL';
    }
    
    // High severity errors that affect user experience
    if (error.message.includes('API rate limit') ||
        error.message.includes('Service unavailable') ||
        error.message.includes('Timeout')) {
      return 'HIGH';
    }
    
    // Standard errors
    return 'STANDARD';
  }
  
  private async handleCriticalError(
    job: Job,
    error: Error,
    workerType: string
  ): Promise<void> {
    // Send immediate notification to administrators
    await this.notificationService.sendAdminAlert({
      type: 'CRITICAL_ERROR',
      workerType,
      jobId: job.id,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    // Mark job as failed with high priority
    await job.moveToFailed(error, true);
    
    // Log to critical error log
    this.logger.error('CRITICAL WORKER ERROR', {
      workerType,
      jobId: job.id,
      error: error.message,
      stack: error.stack
    });
  }
  
  private async handleHighSeverityError(
    job: Job,
    error: Error,
    workerType: string
  ): Promise<void> {
    // Send notification to administrators
    await this.notificationService.sendAdminAlert({
      type: 'HIGH_SEVERITY_ERROR',
      workerType,
      jobId: job.id,
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    // Retry with exponential backoff
    if (job.attemptsMade < (job.opts.attempts || 3)) {
      const delay = Math.pow(2, job.attemptsMade) * 1000;
      await job.moveToDelayed(delay);
    } else {
      await job.moveToFailed(error, false);
    }
  }
  
  private async handleStandardError(
    job: Job,
    error: Error,
    workerType: string
  ): Promise<void> {
    // Standard retry logic
    if (job.attemptsMade < (job.opts.attempts || 3)) {
      const delay = Math.pow(2, job.attemptsMade) * 1000;
      await job.moveToDelayed(delay);
    } else {
      await job.moveToFailed(error, false);
    }
  }
}
```

## Frontend Error Handling

### 1. API Error Handling

**Centralized API Error Handler**
```typescript
export const useApiErrorHandler = () => {
  const { displayError } = useErrorDisplay();
  const { t } = useTranslation();
  
  const handleApiError = useCallback((
    error: AxiosError | Error,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast = true,
      logError = true,
      customMessage,
      onError,
      retryAction,
      contactSupportAction
    } = options;

    let apiError: ApiError;

    if (error instanceof AxiosError) {
      const { response, request, message } = error;

      if (response) {
        // Server responded with error status
        apiError = {
          message: response.data?.message || response.data?.error || t('errors.unexpected_error'),
          code: response.data?.code,
          status: response.status,
          details: response.data,
        };

        if (logError) {
          globalDebug.error('api', `HTTP ${response.status}: ${apiError.message}`, {
            url: response.config?.url,
            method: response.config?.method,
            status: response.status,
            data: response.data,
            headers: response.headers,
          });
        }
      } else if (request) {
        // Request was made but no response received
        apiError = {
          message: t('errors.connection_problem'),
          code: 'NETWORK_ERROR',
          details: { request },
        };

        if (logError) {
          globalDebug.error('api', 'Network error - no response received', {
            url: request.responseURL || error.config?.url,
            method: error.config?.method,
          });
        }
      } else {
        // Something else happened
        apiError = {
          message: message || t('errors.unexpected_error'),
          code: 'UNKNOWN_ERROR',
        };

        if (logError) {
          globalDebug.error('api', 'Unknown error occurred', { message });
        }
      }
    } else {
      // Handle generic errors
      apiError = {
        message: error.message || t('errors.unexpected_error'),
        code: 'GENERIC_ERROR',
      };

      if (logError) {
        globalDebug.error('app', 'Generic error occurred', { message: error.message });
      }
    }

    // Call custom error handler if provided
    if (onError) {
      onError(apiError);
    }

    // Display error to user
    if (showToast) {
      displayError(apiError, {
        retryAction,
        contactSupportAction
      });
    }

    return apiError;
  };

  const isRetryableError = useCallback((error: ApiError): boolean => {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'SERVICE_UNAVAILABLE'];

    return (
      (error.status && retryableStatuses.includes(error.status)) ||
      (error.code && retryableCodes.includes(error.code))
    );
  }, []);

  const isAuthError = useCallback((error: ApiError): boolean => {
    return error.status === 401 || error.code === 'INVALID_CREDENTIALS';
  }, []);

  const isPermissionError = useCallback((error: ApiError): boolean => {
    return error.status === 403;
  }, []);

  const isValidationError = useCallback((error: ApiError): boolean => {
    return error.status === 400;
  }, []);

  return {
    handleApiError,
    isRetryableError,
    isAuthError,
    isPermissionError,
    isValidationError,
  };
};
```

### 2. Component Error Handling

**Error Boundary with Recovery**
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  lastError: Date | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastError: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      lastError: new Date()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    console.error('React Error Boundary caught an error:', error, errorInfo);
    
    // Send to error tracking service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        },
        tags: {
          errorBoundary: true,
          retryCount: this.state.retryCount
        }
      });
    }

    // Notify parent component if callback provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  componentDidUpdate(prevProps: ErrorBoundaryProps, prevState: ErrorBoundaryState) {
    // Auto-retry for certain types of errors
    if (this.state.hasError && !prevState.hasError) {
      const { error } = this.state;
      
      if (error && this.shouldAutoRetry(error)) {
        this.scheduleAutoRetry();
      }
    }
  }

  private shouldAutoRetry(error: Error): boolean {
    const autoRetryErrors = [
      'ChunkLoadError',
      'Loading chunk',
      'Loading CSS chunk',
      'NetworkError'
    ];
    
    return autoRetryErrors.some(errorType => 
      error.message.includes(errorType)
    ) && this.state.retryCount < 3;
  }

  private scheduleAutoRetry() {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000);
    
    this.retryTimeoutId = setTimeout(() => {
      this.handleRetry();
    }, delay);
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount, lastError } = this.state;
      const { fallback: FallbackComponent, showDetails = false } = this.props;

      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorInfo={errorInfo}
            retryCount={retryCount}
            onRetry={this.handleRetry}
            onReload={this.handleReload}
          />
        );
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h2>Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>
            
            <div className="error-boundary-actions">
              <button onClick={this.handleRetry} className="btn btn-primary">
                Try Again
              </button>
              <button onClick={this.handleReload} className="btn btn-secondary">
                Reload Page
              </button>
            </div>

            {showDetails && (
              <details className="error-boundary-details">
                <summary>Error Details</summary>
                <pre>{error && error.toString()}</pre>
                {errorInfo && (
                  <pre>{errorInfo.componentStack}</pre>
                )}
              </details>
            )}

            {retryCount > 0 && (
              <p className="error-boundary-retry-info">
                Retry attempt: {retryCount}
                {lastError && (
                  <span> (Last error: {lastError.toLocaleTimeString()})</span>
                )}
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3. State Management Error Handling

**Zustand Store Error Handling**
```typescript
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  lastError: Date | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  retryCount: 0,
  lastError: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authApi.login(credentials);
      
      set({ 
        user: response.user, 
        isLoading: false,
        error: null,
        retryCount: 0,
        lastError: null
      });
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      const currentRetryCount = get().retryCount;
      
      set({ 
        user: null, 
        isLoading: false, 
        error: errorMessage,
        retryCount: currentRetryCount + 1,
        lastError: new Date()
      });
      
      // Auto-retry for network errors
      if (isRetryableError(error) && currentRetryCount < 3) {
        setTimeout(() => {
          get().login(credentials);
        }, Math.pow(2, currentRetryCount) * 1000);
      }
    }
  },

  logout: () => {
    set({ 
      user: null, 
      isLoading: false, 
      error: null,
      retryCount: 0,
      lastError: null
    });
  },

  clearError: () => {
    set({ error: null, retryCount: 0, lastError: null });
  },

  retry: () => {
    const { user, error } = get();
    if (error && !user) {
      // Trigger retry logic based on last action
      get().login({}); // This would need to be improved with proper retry context
    }
  }
}));

// Error recovery hook
export const useErrorRecovery = () => {
  const { error, retryCount, lastError, clearError, retry } = useAuthStore();
  
  const canRetry = useMemo(() => {
    return error && retryCount < 3;
  }, [error, retryCount]);
  
  const shouldShowRetry = useMemo(() => {
    if (!error) return false;
    
    // Show retry option for certain error types
    const retryableErrors = [
      'Network Error',
      'Connection failed',
      'Service unavailable',
      'Timeout'
    ];
    
    return retryableErrors.some(errorType => 
      error.includes(errorType)
    );
  }, [error]);
  
  const handleRetry = useCallback(() => {
    if (canRetry) {
      retry();
    }
  }, [canRetry, retry]);
  
  const handleDismiss = useCallback(() => {
    clearError();
  }, [clearError]);
  
  return {
    error,
    retryCount,
    lastError,
    canRetry,
    shouldShowRetry,
    handleRetry,
    handleDismiss
  };
};
```

## Recovery Strategies

### 1. Automatic Recovery

**Circuit Breaker Pattern**
```typescript
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttempt = 0;
  
  constructor(private options: CircuitBreakerOptions) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new CircuitBreakerOpenError('Circuit breaker is open');
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.options.errorThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.options.resetTimeout;
    }
  }
}
```

**Retry with Exponential Backoff**
```typescript
export class RetryService {
  async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
      jitter = true,
      retryCondition = () => true
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts || !retryCondition(error)) {
          throw lastError;
        }

        const delay = this.calculateDelay(
          attempt, 
          baseDelay, 
          maxDelay, 
          backoffMultiplier, 
          jitter
        );
        
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }
  
  private calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    backoffMultiplier: number,
    jitter: boolean
  ): number {
    let delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
    
    if (jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.min(delay, maxDelay);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2. Graceful Degradation

**Feature Fallback Strategy**
```typescript
export class FeatureFallbackService {
  private featureStates: Map<string, FeatureState> = new Map();
  
  async executeWithFallback<T>(
    featureName: string,
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    options: FallbackOptions = {}
  ): Promise<T> {
    const {
      timeout = 5000,
      maxFailures = 3,
      recoveryTime = 30000
    } = options;
    
    const featureState = this.getFeatureState(featureName);
    
    // Check if feature is in fallback mode
    if (featureState.isInFallback) {
      if (Date.now() - featureState.lastFailure < recoveryTime) {
        return await fallbackOperation();
      } else {
        // Try to recover
        featureState.isInFallback = false;
        featureState.failureCount = 0;
      }
    }
    
    try {
      const result = await this.executeWithTimeout(primaryOperation, timeout);
      this.onFeatureSuccess(featureName);
      return result;
    } catch (error) {
      this.onFeatureFailure(featureName, error);
      
      if (featureState.failureCount >= maxFailures) {
        featureState.isInFallback = true;
        featureState.lastFailure = Date.now();
      }
      
      return await fallbackOperation();
    }
  }
  
  private getFeatureState(featureName: string): FeatureState {
    if (!this.featureStates.has(featureName)) {
      this.featureStates.set(featureName, {
        failureCount: 0,
        isInFallback: false,
        lastFailure: 0
      });
    }
    return this.featureStates.get(featureName)!;
  }
  
  private onFeatureSuccess(featureName: string): void {
    const state = this.getFeatureState(featureName);
    state.failureCount = 0;
    state.isInFallback = false;
  }
  
  private onFeatureFailure(featureName: string, error: Error): void {
    const state = this.getFeatureState(featureName);
    state.failureCount++;
    state.lastFailure = Date.now();
    
    logger.warn(`Feature failure: ${featureName}`, {
      error: error.message,
      failureCount: state.failureCount
    });
  }
}
```

## Checklist

### Error Handling Implementation
- [ ] Implement centralized error handling
- [ ] Categorize errors by severity
- [ ] Set up error monitoring and alerting
- [ ] Implement retry mechanisms
- [ ] Add circuit breaker patterns
- [ ] Create fallback strategies
- [ ] Test error scenarios
- [ ] Document error handling procedures

### Recovery Strategies
- [ ] Implement automatic retry logic
- [ ] Set up graceful degradation
- [ ] Create manual recovery procedures
- [ ] Test recovery mechanisms
- [ ] Monitor recovery success rates
- [ ] Update recovery strategies based on metrics
- [ ] Train team on recovery procedures
- [ ] Document recovery processes

### Monitoring and Alerting
- [ ] Set up error tracking
- [ ] Configure alert thresholds
- [ ] Create escalation procedures
- [ ] Monitor error trends
- [ ] Track recovery metrics
- [ ] Review error patterns regularly
- [ ] Update monitoring based on learnings
- [ ] Maintain error handling documentation
