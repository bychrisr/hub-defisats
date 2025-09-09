import {
  register,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from 'prom-client';
import { monitoring } from './monitoring.service';

// Coletar métricas padrão do Node.js
collectDefaultMetrics({ register });

export class MetricsService {
  private static instance: MetricsService;
  private isInitialized = false;

  // Métricas de HTTP
  public readonly httpRequestsTotal: Counter<string>;
  public readonly httpRequestDuration: Histogram<string>;
  public readonly httpRequestSize: Histogram<string>;
  public readonly httpResponseSize: Histogram<string>;

  // Métricas de autenticação
  public readonly authAttemptsTotal: Counter<string>;
  public readonly authSuccessTotal: Counter<string>;
  public readonly authFailuresTotal: Counter<string>;

  // Métricas de rate limiting
  public readonly rateLimitHitsTotal: Counter<string>;
  public readonly rateLimitBlocksTotal: Counter<string>;

  // Métricas de banco de dados
  public readonly dbConnectionsActive: Gauge<string>;
  public readonly dbQueriesTotal: Counter<string>;
  public readonly dbQueryDuration: Histogram<string>;

  // Métricas de LN Markets API
  public readonly lnMarketsApiCallsTotal: Counter<string>;
  public readonly lnMarketsApiDuration: Histogram<string>;
  public readonly lnMarketsApiErrorsTotal: Counter<string>;

  // Métricas de workers
  public readonly workerJobsTotal: Counter<string>;
  public readonly workerJobDuration: Histogram<string>;
  public readonly workerJobFailuresTotal: Counter<string>;

  // Métricas de sistema
  public readonly memoryUsage: Gauge<string>;
  public readonly cpuUsage: Gauge<string>;
  public readonly activeUsers: Gauge<string>;

  private constructor() {
    // Métricas de HTTP
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10],
    });

    this.httpRequestSize = new Histogram({
      name: 'http_request_size_bytes',
      help: 'Size of HTTP requests in bytes',
      labelNames: ['method', 'route'],
      buckets: [100, 1000, 10000, 100000, 1000000],
    });

    this.httpResponseSize = new Histogram({
      name: 'http_response_size_bytes',
      help: 'Size of HTTP responses in bytes',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [100, 1000, 10000, 100000, 1000000],
    });

    // Métricas de autenticação
    this.authAttemptsTotal = new Counter({
      name: 'auth_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['type', 'result'],
    });

    this.authSuccessTotal = new Counter({
      name: 'auth_success_total',
      help: 'Total number of successful authentications',
      labelNames: ['type'],
    });

    this.authFailuresTotal = new Counter({
      name: 'auth_failures_total',
      help: 'Total number of failed authentications',
      labelNames: ['type', 'reason'],
    });

    // Métricas de rate limiting
    this.rateLimitHitsTotal = new Counter({
      name: 'rate_limit_hits_total',
      help: 'Total number of rate limit hits',
      labelNames: ['type', 'identifier'],
    });

    this.rateLimitBlocksTotal = new Counter({
      name: 'rate_limit_blocks_total',
      help: 'Total number of rate limit blocks',
      labelNames: ['type', 'identifier'],
    });

    // Métricas de banco de dados
    this.dbConnectionsActive = new Gauge({
      name: 'db_connections_active',
      help: 'Number of active database connections',
    });

    this.dbQueriesTotal = new Counter({
      name: 'db_queries_total',
      help: 'Total number of database queries',
      labelNames: ['operation', 'table'],
    });

    this.dbQueryDuration = new Histogram({
      name: 'db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    });

    // Métricas de LN Markets API
    this.lnMarketsApiCallsTotal = new Counter({
      name: 'lnmarkets_api_calls_total',
      help: 'Total number of LN Markets API calls',
      labelNames: ['endpoint', 'status'],
    });

    this.lnMarketsApiDuration = new Histogram({
      name: 'lnmarkets_api_duration_seconds',
      help: 'Duration of LN Markets API calls in seconds',
      labelNames: ['endpoint'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
    });

    this.lnMarketsApiErrorsTotal = new Counter({
      name: 'lnmarkets_api_errors_total',
      help: 'Total number of LN Markets API errors',
      labelNames: ['endpoint', 'error_type'],
    });

    // Métricas de workers
    this.workerJobsTotal = new Counter({
      name: 'worker_jobs_total',
      help: 'Total number of worker jobs processed',
      labelNames: ['worker_type', 'status'],
    });

    this.workerJobDuration = new Histogram({
      name: 'worker_job_duration_seconds',
      help: 'Duration of worker jobs in seconds',
      labelNames: ['worker_type'],
      buckets: [1, 5, 10, 30, 60, 300, 600],
    });

    this.workerJobFailuresTotal = new Counter({
      name: 'worker_job_failures_total',
      help: 'Total number of worker job failures',
      labelNames: ['worker_type', 'error_type'],
    });

    // Métricas de sistema
    this.memoryUsage = new Gauge({
      name: 'memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: ['type'],
    });

    this.cpuUsage = new Gauge({
      name: 'cpu_usage_percent',
      help: 'CPU usage percentage',
    });

    this.activeUsers = new Gauge({
      name: 'active_users_total',
      help: 'Number of active users',
    });
  }

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  /**
   * Inicializar métricas
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Registrar métricas
    register.registerMetric(this.httpRequestsTotal);
    register.registerMetric(this.httpRequestDuration);
    register.registerMetric(this.httpRequestSize);
    register.registerMetric(this.httpResponseSize);
    register.registerMetric(this.authAttemptsTotal);
    register.registerMetric(this.authSuccessTotal);
    register.registerMetric(this.authFailuresTotal);
    register.registerMetric(this.rateLimitHitsTotal);
    register.registerMetric(this.rateLimitBlocksTotal);
    register.registerMetric(this.dbConnectionsActive);
    register.registerMetric(this.dbQueriesTotal);
    register.registerMetric(this.dbQueryDuration);
    register.registerMetric(this.lnMarketsApiCallsTotal);
    register.registerMetric(this.lnMarketsApiDuration);
    register.registerMetric(this.lnMarketsApiErrorsTotal);
    register.registerMetric(this.workerJobsTotal);
    register.registerMetric(this.workerJobDuration);
    register.registerMetric(this.workerJobFailuresTotal);
    register.registerMetric(this.memoryUsage);
    register.registerMetric(this.cpuUsage);
    register.registerMetric(this.activeUsers);

    // Iniciar coleta de métricas do sistema
    this.startSystemMetricsCollection();

    this.isInitialized = true;
    console.log('✅ Metrics service initialized');
  }

  /**
   * Iniciar coleta de métricas do sistema
   */
  private startSystemMetricsCollection(): void {
    setInterval(() => {
      // Métricas de memória
      const memUsage = process.memoryUsage();
      this.memoryUsage.set({ type: 'rss' }, memUsage.rss);
      this.memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
      this.memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
      this.memoryUsage.set({ type: 'external' }, memUsage.external);

      // Métricas de CPU (simplificado)
      const cpuUsage = process.cpuUsage();
      this.cpuUsage.set(cpuUsage.user + cpuUsage.system);

      // Capturar métricas no Sentry também
      monitoring.captureMetric(
        'memory_usage_mb',
        memUsage.heapUsed / 1024 / 1024,
        'megabyte'
      );
      monitoring.captureMetric(
        'cpu_usage_microseconds',
        cpuUsage.user + cpuUsage.system,
        'microsecond'
      );
    }, 30000); // A cada 30 segundos
  }

  /**
   * Registrar tentativa de autenticação
   */
  recordAuthAttempt(
    type: string,
    result: 'success' | 'failure',
    reason?: string
  ): void {
    this.authAttemptsTotal.inc({ type, result });

    if (result === 'success') {
      this.authSuccessTotal.inc({ type });
    } else {
      this.authFailuresTotal.inc({ type, reason: reason || 'unknown' });
    }
  }

  /**
   * Registrar hit de rate limit
   */
  recordRateLimitHit(type: string, identifier: string): void {
    this.rateLimitHitsTotal.inc({ type, identifier });
  }

  /**
   * Registrar bloqueio de rate limit
   */
  recordRateLimitBlock(type: string, identifier: string): void {
    this.rateLimitBlocksTotal.inc({ type, identifier });
  }

  /**
   * Registrar query do banco
   */
  recordDbQuery(operation: string, table: string, duration: number): void {
    this.dbQueriesTotal.inc({ operation, table });
    this.dbQueryDuration.observe({ operation, table }, duration);
  }

  /**
   * Registrar chamada da API LN Markets
   */
  recordLnMarketsApiCall(
    endpoint: string,
    status: 'success' | 'error',
    duration: number,
    errorType?: string
  ): void {
    this.lnMarketsApiCallsTotal.inc({ endpoint, status });
    this.lnMarketsApiDuration.observe({ endpoint }, duration);

    if (status === 'error') {
      this.lnMarketsApiErrorsTotal.inc({
        endpoint,
        error_type: errorType || 'unknown',
      });
    }
  }

  /**
   * Registrar job de worker
   */
  recordWorkerJob(
    workerType: string,
    status: 'success' | 'failure',
    duration: number,
    errorType?: string
  ): void {
    this.workerJobsTotal.inc({ workerType, status });
    this.workerJobDuration.observe({ workerType }, duration);

    if (status === 'failure') {
      this.workerJobFailuresTotal.inc({
        workerType,
        error_type: errorType || 'unknown',
      });
    }
  }

  /**
   * Atualizar número de usuários ativos
   */
  updateActiveUsers(count: number): void {
    this.activeUsers.set(count);
  }

  /**
   * Obter métricas em formato Prometheus
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Obter métricas em formato JSON
   */
  async getMetricsAsJSON(): Promise<any> {
    return register.getMetricsAsJSON();
  }

  /**
   * Limpar métricas
   */
  clearMetrics(): void {
    register.clear();
  }
}

// Instância singleton
export const metrics = MetricsService.getInstance();
