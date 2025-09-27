import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';
import type { Logger } from 'winston';

export class MetricsService {
  private logger: Logger;
  private isInitialized = false;

  // HTTP Metrics
  private httpRequestDuration: Histogram<string>;
  private httpRequestTotal: Counter<string>;
  private httpRequestErrors: Counter<string>;

  // Database Metrics
  private dbQueryDuration: Histogram<string>;
  private dbQueryTotal: Counter<string>;
  private dbConnectionPool: Gauge<string>;

  // Redis Metrics
  private redisOperationDuration: Histogram<string>;
  private redisOperationTotal: Counter<string>;
  private redisConnectionPool: Gauge<string>;

  // Business Metrics
  private userRegistrations: Counter<string>;
  private userLogins: Counter<string>;
  private tradeExecutions: Counter<string>;
  private automationExecutions: Counter<string>;
  private alertTriggers: Counter<string>;

  // System Metrics
  private memoryUsage: Gauge<string>;
  private cpuUsage: Gauge<string>;
  private activeConnections: Gauge<string>;
  private queueSize: Gauge<string>;

  // LN Markets Migration Metrics
  private lnMarketsRefactoredEndpointCalls: Counter<string>;
  private lnMarketsRefactoredEndpointDuration: Histogram<string>;
  private lnMarketsDeprecatedEndpointCalls: Counter<string>;
  private lnMarketsDeprecatedEndpointDuration: Histogram<string>;

  // Custom Metrics
  private customMetrics: Map<string, any> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
    
    // Initialize all metrics
    this.httpRequestDuration = new Histogram({
      name: 'hub_defisats_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
    });

    this.httpRequestTotal = new Counter({
      name: 'hub_defisats_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code']
    });

    this.httpRequestErrors = new Counter({
      name: 'hub_defisats_http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'status_code']
    });

    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
    });

    this.dbQueryTotal = new Counter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table']
    });

    this.dbConnectionPool = new Gauge({
      name: 'db_connection_pool_size',
      help: 'Number of connections in the database pool',
      labelNames: ['state']
    });

    this.redisOperationDuration = new Histogram({
      name: 'redis_operation_duration_seconds',
      help: 'Duration of Redis operations in seconds',
      labelNames: ['operation'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.5]
    });

    this.redisOperationTotal = new Counter({
      name: 'redis_operations_total',
      help: 'Total number of Redis operations',
      labelNames: ['operation']
    });

    this.redisConnectionPool = new Gauge({
      name: 'redis_connection_pool_size',
      help: 'Number of connections in the Redis pool',
      labelNames: ['state']
    });

    this.userRegistrations = new Counter({
      name: 'user_registrations_total',
      help: 'Total number of user registrations',
      labelNames: ['method']
    });

    this.userLogins = new Counter({
      name: 'user_logins_total',
      help: 'Total number of user logins',
      labelNames: ['method']
    });

    this.tradeExecutions = new Counter({
      name: 'trade_executions_total',
      help: 'Total number of trade executions',
      labelNames: ['symbol', 'side']
    });

    this.automationExecutions = new Counter({
      name: 'automation_executions_total',
      help: 'Total number of automation executions',
      labelNames: ['type', 'status']
    });

    this.alertTriggers = new Counter({
      name: 'alert_triggers_total',
      help: 'Total number of alert triggers',
      labelNames: ['type', 'severity']
    });

    this.memoryUsage = new Gauge({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type']
    });

    this.cpuUsage = new Gauge({
      name: 'cpu_usage_percent',
      help: 'CPU usage percentage'
    });

    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['type']
    });

    this.queueSize = new Gauge({
      name: 'queue_size',
      help: 'Number of items in queue',
      labelNames: ['queue_name']
    });

    // LN Markets Migration Metrics
    this.lnMarketsRefactoredEndpointCalls = new Counter({
      name: 'lnmarkets_refactored_endpoint_calls_total',
      help: 'Total calls to refactored LN Markets endpoints',
      labelNames: ['endpoint', 'method', 'status_code'],
      registers: [register],
    });

    this.lnMarketsRefactoredEndpointDuration = new Histogram({
      name: 'lnmarkets_refactored_endpoint_duration_seconds',
      help: 'Duration of refactored LN Markets endpoint calls',
      labelNames: ['endpoint', 'method'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [register],
    });

    this.lnMarketsDeprecatedEndpointCalls = new Counter({
      name: 'lnmarkets_deprecated_endpoint_calls_total',
      help: 'Total calls to deprecated LN Markets endpoints',
      labelNames: ['endpoint', 'method', 'status_code'],
      registers: [register],
    });

    this.lnMarketsDeprecatedEndpointDuration = new Histogram({
      name: 'lnmarkets_deprecated_endpoint_duration_seconds',
      help: 'Duration of deprecated LN Markets endpoint calls',
      labelNames: ['endpoint', 'method'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
      registers: [register],
    });

    this.initializeMetrics();
  }

  /**
   * Initialize all metrics
   */
  private initializeMetrics(): void {
    if (this.isInitialized) return;

    try {
      // Collect default system metrics
      collectDefaultMetrics({
        register,
        prefix: 'hub_defisats_',
        gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
      });

      // HTTP Metrics - Already initialized in constructor
      // No need to re-initialize here

      // Database Metrics - Already initialized in constructor
      // No need to re-initialize here

      // Redis Metrics - Already initialized in constructor
      // No need to re-initialize here

      // Business and System Metrics - Already initialized in constructor
      // No need to re-initialize here

      this.isInitialized = true;
      this.logger.info('Metrics service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize metrics service', { error });
      throw error;
    }
  }

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    duration: number
  ): void {
    try {
      this.httpRequestDuration
        .labels(method, route, statusCode.toString())
        .observe(duration);

      this.httpRequestTotal
        .labels(method, route, statusCode.toString())
        .inc();

      if (statusCode >= 400) {
        this.httpRequestErrors
          .labels(method, route, this.getErrorType(statusCode))
          .inc();
      }
    } catch (error) {
      this.logger.error('Failed to record HTTP request metrics', { error });
    }
  }

  /**
   * Record database query metrics
   */
  recordDbQuery(
    operation: string,
    table: string,
    duration: number,
    success: boolean = true
  ): void {
    try {
      const status = success ? 'success' : 'error';
      
      this.dbQueryDuration
        .labels(operation, table, status)
        .observe(duration);

      this.dbQueryTotal
        .labels(operation, table, status)
        .inc();
    } catch (error) {
      this.logger.error('Failed to record database query metrics', { error });
    }
  }

  /**
   * Record Redis operation metrics
   */
  recordRedisOperation(
    operation: string,
    duration: number,
    success: boolean = true
  ): void {
    try {
      const status = success ? 'success' : 'error';
      
      this.redisOperationDuration
        .labels(operation, status)
        .observe(duration);

      this.redisOperationTotal
        .labels(operation, status)
        .inc();
    } catch (error) {
      this.logger.error('Failed to record Redis operation metrics', { error });
    }
  }

  /**
   * Record user registration
   */
  recordUserRegistration(source: string = 'direct'): void {
    try {
      this.userRegistrations.labels(source).inc();
    } catch (error) {
      this.logger.error('Failed to record user registration metrics', { error });
    }
  }

  /**
   * Record user login
   */
  recordUserLogin(method: string = 'password'): void {
    try {
      this.userLogins.labels(method).inc();
    } catch (error) {
      this.logger.error('Failed to record user login metrics', { error });
    }
  }

  /**
   * Record authentication attempt
   */
  recordAuthAttempt(type: string, status: string, error?: string): void {
    try {
      if (type === 'login') {
        this.userLogins.labels(status).inc();
      } else if (type === 'register') {
        this.userRegistrations.labels(status).inc();
      }
      
      // Log error details if provided
      if (error) {
        this.logger.warn('Auth attempt failed', { type, status, error });
      }
    } catch (err) {
      this.logger.error('Failed to record auth attempt metrics', { error: err });
    }
  }

  /**
   * Record trade execution
   */
  recordTradeExecution(symbol: string, side: string, status: string): void {
    try {
      this.tradeExecutions.labels(symbol, side, status).inc();
    } catch (error) {
      this.logger.error('Failed to record trade execution metrics', { error });
    }
  }

  /**
   * Record automation execution
   */
  recordAutomationExecution(type: string, status: string): void {
    try {
      this.automationExecutions.labels(type, status).inc();
    } catch (error) {
      this.logger.error('Failed to record automation execution metrics', { error });
    }
  }

  /**
   * Record alert trigger
   */
  recordAlertTrigger(type: string, severity: string): void {
    try {
      this.alertTriggers.labels(type, severity).inc();
    } catch (error) {
      this.logger.error('Failed to record alert trigger metrics', { error });
    }
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics(): void {
    try {
      const memUsage = process.memoryUsage();
      
      this.memoryUsage.labels('rss').set(memUsage.rss);
      this.memoryUsage.labels('heapTotal').set(memUsage.heapTotal);
      this.memoryUsage.labels('heapUsed').set(memUsage.heapUsed);
      this.memoryUsage.labels('external').set(memUsage.external);

      // CPU usage monitoring (simplified)
      const cpuUsage = process.cpuUsage();
      this.cpuUsage.set(cpuUsage.user + cpuUsage.system);
    } catch (error) {
      this.logger.error('Failed to update system metrics', { error });
    }
  }

  /**
   * Update connection pool metrics
   */
  updateConnectionPoolMetrics(dbPoolSize: number, redisPoolSize: number): void {
    try {
      this.dbConnectionPool.labels('active').set(dbPoolSize);
      this.redisConnectionPool.labels('active').set(redisPoolSize);
      
      // Update active connections
      this.activeConnections.labels('database').set(dbPoolSize);
      this.activeConnections.labels('redis').set(redisPoolSize);
    } catch (error) {
      this.logger.error('Failed to update connection pool metrics', { error });
    }
  }

  /**
   * Update queue size metrics
   */
  updateQueueSize(queueName: string, size: number): void {
    try {
      this.queueSize.labels(queueName).set(size);
    } catch (error) {
      this.logger.error('Failed to update queue size metrics', { error });
    }
  }

  /**
   * Create custom counter
   */
  createCounter(name: string, help: string, labelNames: string[] = []): Counter<string> {
    try {
      const counter = new Counter({
        name: `hub_defisats_${name}`,
        help,
        labelNames,
        registers: [register],
      });

      this.customMetrics.set(name, counter);
      return counter;
    } catch (error) {
      this.logger.error('Failed to create custom counter', { error, name });
      throw error;
    }
  }

  /**
   * Create custom gauge
   */
  createGauge(name: string, help: string, labelNames: string[] = []): Gauge<string> {
    try {
      const gauge = new Gauge({
        name: `hub_defisats_${name}`,
        help,
        labelNames,
        registers: [register],
      });

      this.customMetrics.set(name, gauge);
      return gauge;
    } catch (error) {
      this.logger.error('Failed to create custom gauge', { error, name });
      throw error;
    }
  }

  /**
   * Create custom histogram
   */
  createHistogram(name: string, help: string, labelNames: string[] = [], buckets: number[] = []): Histogram<string> {
    try {
      const histogram = new Histogram({
        name: `hub_defisats_${name}`,
        help,
        labelNames,
        buckets: buckets.length > 0 ? buckets : [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
        registers: [register],
      });

      this.customMetrics.set(name, histogram);
      return histogram;
    } catch (error) {
      this.logger.error('Failed to create custom histogram', { error, name });
      throw error;
    }
  }

  /**
   * Get metrics in Prometheus format
   */
  async getMetrics(): Promise<string> {
    try {
      return await register.metrics();
    } catch (error) {
      this.logger.error('Failed to get metrics', { error });
      throw error;
    }
  }

  /**
   * Get metrics as JSON
   */
  async getMetricsAsJson(): Promise<any> {
    try {
      return await register.getMetricsAsJson();
    } catch (error) {
      this.logger.error('Failed to get metrics as JSON', { error });
      throw error;
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    try {
      register.clear();
      this.customMetrics.clear();
      this.logger.info('All metrics cleared');
    } catch (error) {
      this.logger.error('Failed to clear metrics', { error });
    }
  }

  /**
   * Get error type from status code
   */
  private getErrorType(statusCode: number): string {
    if (statusCode >= 500) return 'server_error';
    if (statusCode >= 400) return 'client_error';
    return 'unknown';
  }

  /**
   * Record refactored endpoint call
   */
  public recordRefactoredEndpointCall(endpoint: string, method: string, statusCode: number): void {
    this.lnMarketsRefactoredEndpointCalls.inc({
      endpoint,
      method,
      status_code: statusCode.toString()
    });
  }

  /**
   * Record refactored endpoint duration
   */
  public recordRefactoredEndpointDuration(endpoint: string, method: string, duration: number): void {
    this.lnMarketsRefactoredEndpointDuration.observe({
      endpoint,
      method
    }, duration);
  }

  /**
   * Record deprecated endpoint call
   */
  public recordDeprecatedEndpointCall(endpoint: string, method: string, statusCode: number): void {
    this.lnMarketsDeprecatedEndpointCalls.inc({
      endpoint,
      method,
      status_code: statusCode.toString()
    });
  }

  /**
   * Record deprecated endpoint duration
   */
  public recordDeprecatedEndpointDuration(endpoint: string, method: string, duration: number): void {
    this.lnMarketsDeprecatedEndpointDuration.observe({
      endpoint,
      method
    }, duration);
  }

  /**
   * Get migration metrics
   */
  public getMigrationMetrics(): {
    refactoredCalls: number;
    deprecatedCalls: number;
    migrationProgress: number;
  } {
    const refactoredCalls = this.lnMarketsRefactoredEndpointCalls.get().values.reduce((sum, val) => sum + val.value, 0);
    const deprecatedCalls = this.lnMarketsDeprecatedEndpointCalls.get().values.reduce((sum, val) => sum + val.value, 0);
    const totalCalls = refactoredCalls + deprecatedCalls;
    const migrationProgress = totalCalls > 0 ? (refactoredCalls / totalCalls) * 100 : 0;

    return {
      refactoredCalls,
      deprecatedCalls,
      migrationProgress
    };
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection(intervalMs: number = 30000): void {
    try {
      setInterval(() => {
        this.updateSystemMetrics();
      }, intervalMs);

      this.logger.info('Metrics collection started', { intervalMs });
    } catch (error) {
      this.logger.error('Failed to start metrics collection', { error });
    }
  }
}

// Singleton instance
let metricsInstance: MetricsService | null = null;

export const getMetricsService = (logger: Logger): MetricsService => {
  if (!metricsInstance) {
    metricsInstance = new MetricsService(logger);
  }
  return metricsInstance;
};

// Export metrics instance for direct use (using singleton)
// Only create once to avoid duplicate metric registration
export const metrics = (() => {
  if (!metricsInstance) {
    metricsInstance = new MetricsService({
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
} as any);
  }
  return metricsInstance;
})();

// Export Prometheus metrics for direct use
export { Counter, Histogram, Gauge, Summary } from 'prom-client';