"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = exports.MetricsService = void 0;
const prom_client_1 = require("prom-client");
const monitoring_service_1 = require("./monitoring.service");
(0, prom_client_1.collectDefaultMetrics)({ register: prom_client_1.register });
class MetricsService {
    static instance;
    isInitialized = false;
    httpRequestsTotal;
    httpRequestDuration;
    httpRequestSize;
    httpResponseSize;
    authAttemptsTotal;
    authSuccessTotal;
    authFailuresTotal;
    rateLimitHitsTotal;
    rateLimitBlocksTotal;
    dbConnectionsActive;
    dbQueriesTotal;
    dbQueryDuration;
    lnMarketsApiCallsTotal;
    lnMarketsApiDuration;
    lnMarketsApiErrorsTotal;
    workerJobsTotal;
    workerJobDuration;
    workerJobFailuresTotal;
    memoryUsage;
    cpuUsage;
    activeUsers;
    constructor() {
        this.httpRequestsTotal = new prom_client_1.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
        });
        this.httpRequestDuration = new prom_client_1.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.5, 1, 2, 5, 10],
        });
        this.httpRequestSize = new prom_client_1.Histogram({
            name: 'http_request_size_bytes',
            help: 'Size of HTTP requests in bytes',
            labelNames: ['method', 'route'],
            buckets: [100, 1000, 10000, 100000, 1000000],
        });
        this.httpResponseSize = new prom_client_1.Histogram({
            name: 'http_response_size_bytes',
            help: 'Size of HTTP responses in bytes',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [100, 1000, 10000, 100000, 1000000],
        });
        this.authAttemptsTotal = new prom_client_1.Counter({
            name: 'auth_attempts_total',
            help: 'Total number of authentication attempts',
            labelNames: ['type', 'result'],
        });
        this.authSuccessTotal = new prom_client_1.Counter({
            name: 'auth_success_total',
            help: 'Total number of successful authentications',
            labelNames: ['type'],
        });
        this.authFailuresTotal = new prom_client_1.Counter({
            name: 'auth_failures_total',
            help: 'Total number of failed authentications',
            labelNames: ['type', 'reason'],
        });
        this.rateLimitHitsTotal = new prom_client_1.Counter({
            name: 'rate_limit_hits_total',
            help: 'Total number of rate limit hits',
            labelNames: ['type', 'identifier'],
        });
        this.rateLimitBlocksTotal = new prom_client_1.Counter({
            name: 'rate_limit_blocks_total',
            help: 'Total number of rate limit blocks',
            labelNames: ['type', 'identifier'],
        });
        this.dbConnectionsActive = new prom_client_1.Gauge({
            name: 'db_connections_active',
            help: 'Number of active database connections',
        });
        this.dbQueriesTotal = new prom_client_1.Counter({
            name: 'db_queries_total',
            help: 'Total number of database queries',
            labelNames: ['operation', 'table'],
        });
        this.dbQueryDuration = new prom_client_1.Histogram({
            name: 'db_query_duration_seconds',
            help: 'Duration of database queries in seconds',
            labelNames: ['operation', 'table'],
            buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
        });
        this.lnMarketsApiCallsTotal = new prom_client_1.Counter({
            name: 'lnmarkets_api_calls_total',
            help: 'Total number of LN Markets API calls',
            labelNames: ['endpoint', 'status'],
        });
        this.lnMarketsApiDuration = new prom_client_1.Histogram({
            name: 'lnmarkets_api_duration_seconds',
            help: 'Duration of LN Markets API calls in seconds',
            labelNames: ['endpoint'],
            buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
        });
        this.lnMarketsApiErrorsTotal = new prom_client_1.Counter({
            name: 'lnmarkets_api_errors_total',
            help: 'Total number of LN Markets API errors',
            labelNames: ['endpoint', 'error_type'],
        });
        this.workerJobsTotal = new prom_client_1.Counter({
            name: 'worker_jobs_total',
            help: 'Total number of worker jobs processed',
            labelNames: ['worker_type', 'status'],
        });
        this.workerJobDuration = new prom_client_1.Histogram({
            name: 'worker_job_duration_seconds',
            help: 'Duration of worker jobs in seconds',
            labelNames: ['worker_type'],
            buckets: [1, 5, 10, 30, 60, 300, 600],
        });
        this.workerJobFailuresTotal = new prom_client_1.Counter({
            name: 'worker_job_failures_total',
            help: 'Total number of worker job failures',
            labelNames: ['worker_type', 'error_type'],
        });
        this.memoryUsage = new prom_client_1.Gauge({
            name: 'memory_usage_bytes',
            help: 'Memory usage in bytes',
            labelNames: ['type'],
        });
        this.cpuUsage = new prom_client_1.Gauge({
            name: 'cpu_usage_percent',
            help: 'CPU usage percentage',
        });
        this.activeUsers = new prom_client_1.Gauge({
            name: 'active_users_total',
            help: 'Number of active users',
        });
    }
    static getInstance() {
        if (!MetricsService.instance) {
            MetricsService.instance = new MetricsService();
        }
        return MetricsService.instance;
    }
    initialize() {
        if (this.isInitialized) {
            return;
        }
        prom_client_1.register.registerMetric(this.httpRequestsTotal);
        prom_client_1.register.registerMetric(this.httpRequestDuration);
        prom_client_1.register.registerMetric(this.httpRequestSize);
        prom_client_1.register.registerMetric(this.httpResponseSize);
        prom_client_1.register.registerMetric(this.authAttemptsTotal);
        prom_client_1.register.registerMetric(this.authSuccessTotal);
        prom_client_1.register.registerMetric(this.authFailuresTotal);
        prom_client_1.register.registerMetric(this.rateLimitHitsTotal);
        prom_client_1.register.registerMetric(this.rateLimitBlocksTotal);
        prom_client_1.register.registerMetric(this.dbConnectionsActive);
        prom_client_1.register.registerMetric(this.dbQueriesTotal);
        prom_client_1.register.registerMetric(this.dbQueryDuration);
        prom_client_1.register.registerMetric(this.lnMarketsApiCallsTotal);
        prom_client_1.register.registerMetric(this.lnMarketsApiDuration);
        prom_client_1.register.registerMetric(this.lnMarketsApiErrorsTotal);
        prom_client_1.register.registerMetric(this.workerJobsTotal);
        prom_client_1.register.registerMetric(this.workerJobDuration);
        prom_client_1.register.registerMetric(this.workerJobFailuresTotal);
        prom_client_1.register.registerMetric(this.memoryUsage);
        prom_client_1.register.registerMetric(this.cpuUsage);
        prom_client_1.register.registerMetric(this.activeUsers);
        this.startSystemMetricsCollection();
        this.isInitialized = true;
        console.log('✅ Metrics service initialized');
    }
    startSystemMetricsCollection() {
        setInterval(() => {
            const memUsage = process.memoryUsage();
            this.memoryUsage.set({ type: 'rss' }, memUsage.rss);
            this.memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
            this.memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
            this.memoryUsage.set({ type: 'external' }, memUsage.external);
            const cpuUsage = process.cpuUsage();
            this.cpuUsage.set(cpuUsage.user + cpuUsage.system);
            monitoring_service_1.monitoring.captureMetric('memory_usage_mb', memUsage.heapUsed / 1024 / 1024, 'megabyte');
            monitoring_service_1.monitoring.captureMetric('cpu_usage_microseconds', cpuUsage.user + cpuUsage.system, 'microsecond');
        }, 30000);
    }
    recordAuthAttempt(type, result, reason) {
        this.authAttemptsTotal.inc({ type, result });
        if (result === 'success') {
            this.authSuccessTotal.inc({ type });
        }
        else {
            this.authFailuresTotal.inc({ type, reason: reason || 'unknown' });
        }
    }
    recordRateLimitHit(type, identifier) {
        this.rateLimitHitsTotal.inc({ type, identifier });
    }
    recordRateLimitBlock(type, identifier) {
        this.rateLimitBlocksTotal.inc({ type, identifier });
    }
    recordDbQuery(operation, table, duration) {
        this.dbQueriesTotal.inc({ operation, table });
        this.dbQueryDuration.observe({ operation, table }, duration);
    }
    recordLnMarketsApiCall(endpoint, status, duration, errorType) {
        this.lnMarketsApiCallsTotal.inc({ endpoint, status });
        this.lnMarketsApiDuration.observe({ endpoint }, duration);
        if (status === 'error') {
            this.lnMarketsApiErrorsTotal.inc({
                endpoint,
                error_type: errorType || 'unknown',
            });
        }
    }
    recordWorkerJob(workerType, status, duration, errorType) {
        this.workerJobsTotal.inc({ workerType, status });
        this.workerJobDuration.observe({ workerType }, duration);
        if (status === 'failure') {
            this.workerJobFailuresTotal.inc({
                workerType,
                error_type: errorType || 'unknown',
            });
        }
    }
    updateActiveUsers(count) {
        this.activeUsers.set(count);
    }
    async getMetrics() {
        return prom_client_1.register.metrics();
    }
    async getMetricsAsJSON() {
        return prom_client_1.register.getMetricsAsJSON();
    }
    clearMetrics() {
        prom_client_1.register.clear();
    }
}
exports.MetricsService = MetricsService;
exports.metrics = MetricsService.getInstance();
//# sourceMappingURL=metrics.service.js.map