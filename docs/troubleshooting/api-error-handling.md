---
title: API Error Handling and Recovery
category: troubleshooting
subcategory: api-error-handling
tags: [api-errors, error-handling, recovery, retry-logic, circuit-breaker, troubleshooting]
priority: high
status: active
last_updated: 2025-01-06
version: "2.0"
authors: ["Axisor Team"]
reviewers: ["Backend Team", "DevOps Team"]
---

# API Error Handling and Recovery

## Summary

Comprehensive guide to API error handling and recovery strategies in the Axisor platform. This document covers error classification, retry mechanisms, circuit breaker patterns, and recovery procedures for various types of API failures.

## Error Classification

### 1. Error Categories

**Transient Errors**
- Network timeouts
- Temporary service unavailability
- Rate limiting (429)
- Server errors (5xx)

**Permanent Errors**
- Authentication failures (401)
- Authorization failures (403)
- Resource not found (404)
- Validation errors (400)

**Business Logic Errors**
- Insufficient funds
- Invalid parameters
- Business rule violations
- Account restrictions

### 2. Error Response Format

**Standard Error Response**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field": "specific field error",
      "context": "additional context"
    },
    "timestamp": "2025-01-06T10:30:00Z",
    "requestId": "req_123456789",
    "retryAfter": 60,
    "category": "TRANSIENT|PERMANENT|BUSINESS"
  }
}
```

## Retry Mechanisms

### 1. Exponential Backoff Strategy

**Implementation**
```typescript
export class RetryService {
  private logger: Logger;
  
  constructor(logger: Logger) {
    this.logger = logger;
  }
  
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
      jitter = true
    } = options;
    
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logger.debug(`Retry attempt ${attempt}/${maxAttempts}`);
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxAttempts) {
          this.logger.error(`All retry attempts failed after ${maxAttempts} attempts`, {
            error: lastError.message,
            stack: lastError.stack
          });
          throw lastError;
        }
        
        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          this.logger.warn(`Non-retryable error encountered: ${error.message}`);
          throw error;
        }
        
        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, baseDelay, maxDelay, backoffMultiplier, jitter);
        
        this.logger.warn(`Retry attempt ${attempt} failed, retrying in ${delay}ms`, {
          error: lastError.message,
          nextAttempt: attempt + 1,
          delay
        });
        
        await this.sleep(delay);
      }
    }
    
    throw lastError!;
  }
  
  private isRetryableError(error: any): boolean {
    // Check HTTP status codes
    if (error.response?.status) {
      const status = error.response.status;
      return status >= 500 || status === 429 || status === 408;
    }
    
    // Check error codes
    if (error.code) {
      const retryableCodes = [
        'ECONNRESET',
        'ENOTFOUND',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENETUNREACH'
      ];
      return retryableCodes.includes(error.code);
    }
    
    // Check error message patterns
    const retryablePatterns = [
      'timeout',
      'network',
      'connection',
      'temporary',
      'unavailable'
    ];
    
    const message = error.message?.toLowerCase() || '';
    return retryablePatterns.some(pattern => message.includes(pattern));
  }
  
  private calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    backoffMultiplier: number,
    jitter: boolean
  ): number {
    let delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
    
    // Cap at maximum delay
    delay = Math.min(delay, maxDelay);
    
    // Add jitter to prevent thundering herd
    if (jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    
    return Math.floor(delay);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 2. Retry Configuration

**Retry Options**
```typescript
interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

// Service-specific retry configurations
export const RETRY_CONFIGS = {
  LN_MARKETS: {
    maxAttempts: 5,
    baseDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    jitter: true
  },
  LND: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
  },
  DATABASE: {
    maxAttempts: 3,
    baseDelay: 500,
    maxDelay: 5000,
    backoffMultiplier: 2,
    jitter: false
  }
};
```

## Circuit Breaker Pattern

### 1. Circuit Breaker Implementation

**Circuit Breaker Service**
```typescript
export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttempt = 0;
  private halfOpenCalls = 0;
  
  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000,
    private halfOpenMaxCalls: number = 3,
    private name: string = 'CircuitBreaker'
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      }
      this.state = 'HALF_OPEN';
      this.halfOpenCalls = 0;
    }
    
    if (this.state === 'HALF_OPEN') {
      if (this.halfOpenCalls >= this.halfOpenMaxCalls) {
        throw new Error(`Circuit breaker ${this.name} is HALF_OPEN (max calls reached)`);
      }
      this.halfOpenCalls++;
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
    this.halfOpenCalls = 0;
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.recoveryTimeout;
    }
  }
  
  getState(): string {
    return this.state;
  }
  
  getFailureCount(): number {
    return this.failureCount;
  }
  
  getNextAttempt(): number {
    return this.nextAttempt;
  }
}
```

### 2. Circuit Breaker Configuration

**Service-Specific Circuit Breakers**
```typescript
export class CircuitBreakerManager {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  
  constructor() {
    // LN Markets API circuit breaker
    this.circuitBreakers.set('lnmarkets', new CircuitBreaker(
      5,    // failure threshold
      60000, // recovery timeout (1 minute)
      3,    // half-open max calls
      'LN Markets API'
    ));
    
    // LND API circuit breaker
    this.circuitBreakers.set('lnd', new CircuitBreaker(
      3,    // failure threshold
      30000, // recovery timeout (30 seconds)
      2,    // half-open max calls
      'LND API'
    ));
    
    // Database circuit breaker
    this.circuitBreakers.set('database', new CircuitBreaker(
      10,   // failure threshold
      120000, // recovery timeout (2 minutes)
      5,    // half-open max calls
      'Database'
    ));
  }
  
  getCircuitBreaker(service: string): CircuitBreaker {
    return this.circuitBreakers.get(service) || this.circuitBreakers.get('default')!;
  }
  
  getStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    
    for (const [service, breaker] of this.circuitBreakers.entries()) {
      status[service] = {
        state: breaker.getState(),
        failureCount: breaker.getFailureCount(),
        nextAttempt: breaker.getNextAttempt()
      };
    }
    
    return status;
  }
}
```

## Error Recovery Strategies

### 1. Graceful Degradation

**Service Degradation Handler**
```typescript
export class ServiceDegradationHandler {
  private logger: Logger;
  private fallbackServices: Map<string, any> = new Map();
  
  constructor(logger: Logger) {
    this.logger = logger;
  }
  
  async executeWithFallback<T>(
    primaryOperation: () => Promise<T>,
    fallbackOperation: () => Promise<T>,
    serviceName: string
  ): Promise<T> {
    try {
      return await primaryOperation();
    } catch (error) {
      this.logger.warn(`Primary service ${serviceName} failed, attempting fallback`, {
        error: error.message,
        service: serviceName
      });
      
      try {
        return await fallbackOperation();
      } catch (fallbackError) {
        this.logger.error(`Both primary and fallback services failed for ${serviceName}`, {
          primaryError: error.message,
          fallbackError: fallbackError.message,
          service: serviceName
        });
        throw fallbackError;
      }
    }
  }
  
  async executeWithCachedFallback<T>(
    operation: () => Promise<T>,
    cacheKey: string,
    serviceName: string,
    ttl: number = 300000 // 5 minutes
  ): Promise<T> {
    try {
      const result = await operation();
      // Cache the result
      await this.cacheResult(cacheKey, result, ttl);
      return result;
    } catch (error) {
      this.logger.warn(`Service ${serviceName} failed, attempting cached fallback`, {
        error: error.message,
        service: serviceName,
        cacheKey
      });
      
      const cachedResult = await this.getCachedResult(cacheKey);
      if (cachedResult) {
        this.logger.info(`Using cached result for ${serviceName}`, { cacheKey });
        return cachedResult;
      }
      
      throw error;
    }
  }
  
  private async cacheResult<T>(key: string, result: T, ttl: number): Promise<void> {
    // Implementation would use Redis or similar
    console.log(`Caching result for key: ${key}, TTL: ${ttl}`);
  }
  
  private async getCachedResult<T>(key: string): Promise<T | null> {
    // Implementation would use Redis or similar
    console.log(`Retrieving cached result for key: ${key}`);
    return null;
  }
}
```

### 2. Error Notification and Alerting

**Error Alerting Service**
```typescript
export class ErrorAlertingService {
  private logger: Logger;
  private notificationService: NotificationService;
  
  constructor(logger: Logger, notificationService: NotificationService) {
    this.logger = logger;
    this.notificationService = notificationService;
  }
  
  async handleError(error: Error, context: ErrorContext): Promise<void> {
    const errorInfo = this.analyzeError(error, context);
    
    // Log the error
    this.logger.error(`API Error: ${errorInfo.message}`, {
      error: errorInfo,
      context
    });
    
    // Send alerts for critical errors
    if (errorInfo.severity === 'CRITICAL') {
      await this.sendCriticalAlert(errorInfo, context);
    }
    
    // Send alerts for high severity errors
    if (errorInfo.severity === 'HIGH') {
      await this.sendHighSeverityAlert(errorInfo, context);
    }
    
    // Update error metrics
    await this.updateErrorMetrics(errorInfo, context);
  }
  
  private analyzeError(error: Error, context: ErrorContext): ErrorInfo {
    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      severity: 'LOW',
      category: 'UNKNOWN',
      service: context.service || 'unknown',
      endpoint: context.endpoint || 'unknown',
      userId: context.userId,
      requestId: context.requestId
    };
    
    // Determine severity based on error type and context
    if (error.message.includes('CRITICAL') || context.service === 'database') {
      errorInfo.severity = 'CRITICAL';
    } else if (error.message.includes('HIGH') || context.service === 'lnmarkets') {
      errorInfo.severity = 'HIGH';
    } else if (error.message.includes('MEDIUM')) {
      errorInfo.severity = 'MEDIUM';
    }
    
    // Determine category
    if (error.message.includes('timeout')) {
      errorInfo.category = 'TIMEOUT';
    } else if (error.message.includes('network')) {
      errorInfo.category = 'NETWORK';
    } else if (error.message.includes('authentication')) {
      errorInfo.category = 'AUTHENTICATION';
    } else if (error.message.includes('authorization')) {
      errorInfo.category = 'AUTHORIZATION';
    } else if (error.message.includes('validation')) {
      errorInfo.category = 'VALIDATION';
    }
    
    return errorInfo;
  }
  
  private async sendCriticalAlert(errorInfo: ErrorInfo, context: ErrorContext): Promise<void> {
    const alert = {
      type: 'CRITICAL_ERROR',
      title: `Critical API Error: ${errorInfo.service}`,
      message: errorInfo.message,
      details: {
        error: errorInfo,
        context
      },
      timestamp: new Date().toISOString()
    };
    
    // Send to multiple channels
    await Promise.all([
      this.notificationService.sendSlackAlert(alert),
      this.notificationService.sendEmailAlert(alert),
      this.notificationService.sendPagerDutyAlert(alert)
    ]);
  }
  
  private async sendHighSeverityAlert(errorInfo: ErrorInfo, context: ErrorContext): Promise<void> {
    const alert = {
      type: 'HIGH_SEVERITY_ERROR',
      title: `High Severity API Error: ${errorInfo.service}`,
      message: errorInfo.message,
      details: {
        error: errorInfo,
        context
      },
      timestamp: new Date().toISOString()
    };
    
    // Send to Slack and email
    await Promise.all([
      this.notificationService.sendSlackAlert(alert),
      this.notificationService.sendEmailAlert(alert)
    ]);
  }
  
  private async updateErrorMetrics(errorInfo: ErrorInfo, context: ErrorContext): Promise<void> {
    // Update Prometheus metrics
    const errorCounter = require('prom-client').register.getSingleMetric('api_errors_total');
    if (errorCounter) {
      errorCounter.inc({
        service: errorInfo.service,
        category: errorInfo.category,
        severity: errorInfo.severity
      });
    }
  }
}
```

## Error Monitoring and Metrics

### 1. Error Metrics Collection

**Error Metrics Service**
```typescript
export class ErrorMetricsService {
  private logger: Logger;
  
  constructor(logger: Logger) {
    this.logger = logger;
    this.initializeMetrics();
  }
  
  private initializeMetrics(): void {
    const promClient = require('prom-client');
    
    // Error counter
    new promClient.Counter({
      name: 'api_errors_total',
      help: 'Total number of API errors',
      labelNames: ['service', 'category', 'severity', 'endpoint']
    });
    
    // Error rate
    new promClient.Gauge({
      name: 'api_error_rate',
      help: 'API error rate per minute',
      labelNames: ['service', 'category']
    });
    
    // Error duration histogram
    new promClient.Histogram({
      name: 'api_error_duration_seconds',
      help: 'Duration of API errors',
      labelNames: ['service', 'category', 'severity'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
    });
    
    // Circuit breaker status
    new promClient.Gauge({
      name: 'circuit_breaker_state',
      help: 'Circuit breaker state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)',
      labelNames: ['service']
    });
  }
  
  recordError(error: Error, context: ErrorContext): void {
    const errorInfo = this.analyzeError(error, context);
    
    // Increment error counter
    const errorCounter = require('prom-client').register.getSingleMetric('api_errors_total');
    if (errorCounter) {
      errorCounter.inc({
        service: errorInfo.service,
        category: errorInfo.category,
        severity: errorInfo.severity,
        endpoint: errorInfo.endpoint
      });
    }
    
    // Update error rate
    this.updateErrorRate(errorInfo.service, errorInfo.category);
    
    // Record error duration
    const errorDuration = require('prom-client').register.getSingleMetric('api_error_duration_seconds');
    if (errorDuration) {
      errorDuration.observe(
        {
          service: errorInfo.service,
          category: errorInfo.category,
          severity: errorInfo.severity
        },
        Date.now() - (context.startTime || Date.now())
      );
    }
  }
  
  private analyzeError(error: Error, context: ErrorContext): ErrorInfo {
    // Similar to ErrorAlertingService.analyzeError
    return {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      severity: 'LOW',
      category: 'UNKNOWN',
      service: context.service || 'unknown',
      endpoint: context.endpoint || 'unknown',
      userId: context.userId,
      requestId: context.requestId
    };
  }
  
  private updateErrorRate(service: string, category: string): void {
    // Implementation would calculate error rate per minute
    console.log(`Updating error rate for service: ${service}, category: ${category}`);
  }
}
```

### 2. Error Dashboard and Alerting

**Error Dashboard Configuration**
```yaml
# Grafana dashboard configuration for API errors
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-error-dashboard
  namespace: axisor
data:
  dashboard.json: |
    {
      "dashboard": {
        "title": "API Error Monitoring",
        "panels": [
          {
            "title": "API Error Rate",
            "type": "graph",
            "targets": [
              {
                "expr": "rate(api_errors_total[5m])",
                "legendFormat": "{{service}} - {{category}}"
              }
            ]
          },
          {
            "title": "Circuit Breaker Status",
            "type": "singlestat",
            "targets": [
              {
                "expr": "circuit_breaker_state",
                "legendFormat": "{{service}}"
              }
            ]
          },
          {
            "title": "Error Duration",
            "type": "histogram",
            "targets": [
              {
                "expr": "api_error_duration_seconds_bucket",
                "legendFormat": "{{service}} - {{category}}"
              }
            ]
          }
        ]
      }
    }
```

## Troubleshooting Commands

### 1. Error Analysis Commands

```bash
# Check API error rates
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkErrorRates() {
  const errors = await prisma.apiErrorLog.findMany({
    where: {
      timestamp: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    select: {
      service: true,
      category: true,
      severity: true,
      count: true
    },
    orderBy: {
      count: 'desc'
    }
  });
  
  console.log('Error rates in last 24 hours:');
  errors.forEach(error => {
    console.log(`${error.service} - ${error.category} - ${error.severity}: ${error.count}`);
  });
}

checkErrorRates();
"

# Check circuit breaker status
kubectl exec -n axisor <backend-pod> -- node -e "
const { CircuitBreakerManager } = require('./src/services/circuit-breaker-manager');
const manager = new CircuitBreakerManager();

async function checkCircuitBreakers() {
  const status = manager.getStatus();
  console.log('Circuit breaker status:');
  Object.entries(status).forEach(([service, info]) => {
    console.log(`${service}: ${info.state} (failures: ${info.failureCount})`);
  });
}

checkCircuitBreakers();
"

# Check retry statistics
kubectl exec -n axisor <backend-pod> -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRetryStats() {
  const retries = await prisma.retryLog.findMany({
    where: {
      timestamp: {
        gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
      }
    },
    select: {
      service: true,
      operation: true,
      attempts: true,
      success: true
    }
  });
  
  console.log('Retry statistics in last hour:');
  retries.forEach(retry => {
    console.log(`${retry.service} - ${retry.operation}: ${retry.attempts} attempts, success: ${retry.success}`);
  });
}

checkRetryStats();
"
```

### 2. Error Recovery Commands

```bash
# Reset circuit breaker
kubectl exec -n axisor <backend-pod> -- node -e "
const { CircuitBreakerManager } = require('./src/services/circuit-breaker-manager');
const manager = new CircuitBreakerManager();

async function resetCircuitBreaker(service) {
  const breaker = manager.getCircuitBreaker(service);
  breaker.reset(); // Assuming reset method exists
  console.log(`Circuit breaker for ${service} has been reset`);
}

resetCircuitBreaker('lnmarkets');
"

# Clear error cache
kubectl exec -n axisor <backend-pod> -- node -e "
const redis = require('ioredis');
const client = new redis(process.env.REDIS_URL);

async function clearErrorCache() {
  const keys = await client.keys('error:*');
  if (keys.length > 0) {
    await client.del(...keys);
    console.log(`Cleared ${keys.length} error cache entries`);
  } else {
    console.log('No error cache entries found');
  }
}

clearErrorCache();
"

# Test error recovery
kubectl exec -n axisor <backend-pod> -- node -e "
const { RetryService } = require('./src/services/retry.service');
const retryService = new RetryService();

async function testErrorRecovery() {
  let attempt = 0;
  const operation = async () => {
    attempt++;
    if (attempt < 3) {
      throw new Error('Simulated error');
    }
    return 'Success';
  };
  
  try {
    const result = await retryService.executeWithRetry(operation, {
      maxAttempts: 5,
      baseDelay: 1000
    });
    console.log('Error recovery test result:', result);
  } catch (error) {
    console.error('Error recovery test failed:', error.message);
  }
}

testErrorRecovery();
"
```

## Checklist

### Error Handling Setup
- [ ] Configure retry mechanisms
- [ ] Set up circuit breakers
- [ ] Implement error classification
- [ ] Configure error alerting
- [ ] Set up error metrics
- [ ] Test error recovery
- [ ] Monitor error rates
- [ ] Document error procedures

### Error Monitoring
- [ ] Set up error dashboards
- [ ] Configure error alerts
- [ ] Monitor circuit breaker status
- [ ] Track retry statistics
- [ ] Analyze error patterns
- [ ] Review error logs
- [ ] Update error handling
- [ ] Test error scenarios

### Error Recovery
- [ ] Test retry logic
- [ ] Verify circuit breaker behavior
- [ ] Test fallback mechanisms
- [ ] Validate error notifications
- [ ] Check error metrics
- [ ] Review error procedures
- [ ] Update documentation
- [ ] Train team on procedures
