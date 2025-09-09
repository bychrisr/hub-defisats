"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alerting = exports.AlertingService = void 0;
const monitoring_service_1 = require("./monitoring.service");
const metrics_service_1 = require("./metrics.service");
const env_1 = require("@/config/env");
class AlertingService {
    static instance;
    alerts = [];
    rules = [];
    isInitialized = false;
    checkInterval = null;
    constructor() {
        this.initializeRules();
    }
    static getInstance() {
        if (!AlertingService.instance) {
            AlertingService.instance = new AlertingService();
        }
        return AlertingService.instance;
    }
    initializeRules() {
        this.rules = [
            {
                id: 'high_response_time',
                name: 'High Response Time',
                condition: async () => {
                    const metricsData = await metrics_service_1.metrics.getMetricsAsJSON();
                    const responseTimeMetric = metricsData.find(m => m.name === 'http_request_duration_seconds');
                    if (!responseTimeMetric)
                        return false;
                    const avgResponseTime = responseTimeMetric.values?.reduce((sum, val) => sum + val.value, 0) / responseTimeMetric.values?.length || 0;
                    return avgResponseTime > 2;
                },
                severity: 'high',
                message: 'Average response time is above 2 seconds',
                cooldown: 300,
            },
            {
                id: 'high_error_rate',
                name: 'High Error Rate',
                condition: async () => {
                    const metricsData = await metrics_service_1.metrics.getMetricsAsJSON();
                    const errorRateMetric = metricsData.find(m => m.name === 'http_requests_total');
                    if (!errorRateMetric)
                        return false;
                    const errorCount = errorRateMetric.values?.filter((v) => v.labels.status_code && v.labels.status_code >= '400').length || 0;
                    const totalCount = errorRateMetric.values?.length || 1;
                    const errorRate = errorCount / totalCount;
                    return errorRate > 0.05;
                },
                severity: 'critical',
                message: 'Error rate is above 5%',
                cooldown: 180,
            },
            {
                id: 'high_memory_usage',
                name: 'High Memory Usage',
                condition: async () => {
                    const metricsData = await metrics_service_1.metrics.getMetricsAsJSON();
                    const memoryMetric = metricsData.find(m => m.name === 'memory_usage_bytes' && m.labels.type === 'heapUsed');
                    if (!memoryMetric)
                        return false;
                    const memoryUsageMB = memoryMetric.values?.[0]?.value / 1024 / 1024 || 0;
                    return memoryUsageMB > 500;
                },
                severity: 'medium',
                message: 'Memory usage is above 500MB',
                cooldown: 600,
            },
            {
                id: 'high_cpu_usage',
                name: 'High CPU Usage',
                condition: async () => {
                    const metricsData = await metrics_service_1.metrics.getMetricsAsJSON();
                    const cpuMetric = metricsData.find(m => m.name === 'cpu_usage_percent');
                    if (!cpuMetric)
                        return false;
                    const cpuUsage = cpuMetric.values?.[0]?.value || 0;
                    return cpuUsage > 80;
                },
                severity: 'high',
                message: 'CPU usage is above 80%',
                cooldown: 300,
            },
            {
                id: 'high_auth_failures',
                name: 'High Authentication Failures',
                condition: async () => {
                    const metricsData = await metrics_service_1.metrics.getMetricsAsJSON();
                    const authFailuresMetric = metricsData.find(m => m.name === 'auth_failures_total');
                    if (!authFailuresMetric)
                        return false;
                    const recentFailures = authFailuresMetric.values?.filter((v) => {
                        const timestamp = new Date(v.timestamp);
                        const now = new Date();
                        return now.getTime() - timestamp.getTime() < 300000;
                    }).length || 0;
                    return recentFailures > 10;
                },
                severity: 'high',
                message: 'High number of authentication failures detected',
                cooldown: 300,
            },
            {
                id: 'rate_limit_abuse',
                name: 'Rate Limit Abuse',
                condition: async () => {
                    const metricsData = await metrics_service_1.metrics.getMetricsAsJSON();
                    const rateLimitMetric = metricsData.find(m => m.name === 'rate_limit_blocks_total');
                    if (!rateLimitMetric)
                        return false;
                    const recentBlocks = rateLimitMetric.values?.filter((v) => {
                        const timestamp = new Date(v.timestamp);
                        const now = new Date();
                        return now.getTime() - timestamp.getTime() < 600000;
                    }).length || 0;
                    return recentBlocks > 50;
                },
                severity: 'medium',
                message: 'High number of rate limit blocks detected',
                cooldown: 600,
            },
            {
                id: 'lnmarkets_api_errors',
                name: 'LN Markets API Errors',
                condition: async () => {
                    const metricsData = await metrics_service_1.metrics.getMetricsAsJSON();
                    const apiErrorsMetric = metricsData.find(m => m.name === 'lnmarkets_api_errors_total');
                    if (!apiErrorsMetric)
                        return false;
                    const recentErrors = apiErrorsMetric.values?.filter((v) => {
                        const timestamp = new Date(v.timestamp);
                        const now = new Date();
                        return now.getTime() - timestamp.getTime() < 300000;
                    }).length || 0;
                    return recentErrors > 5;
                },
                severity: 'high',
                message: 'High number of LN Markets API errors',
                cooldown: 300,
            },
            {
                id: 'worker_job_failures',
                name: 'Worker Job Failures',
                condition: async () => {
                    const metricsData = await metrics_service_1.metrics.getMetricsAsJSON();
                    const workerFailuresMetric = metricsData.find(m => m.name === 'worker_job_failures_total');
                    if (!workerFailuresMetric)
                        return false;
                    const recentFailures = workerFailuresMetric.values?.filter((v) => {
                        const timestamp = new Date(v.timestamp);
                        const now = new Date();
                        return now.getTime() - timestamp.getTime() < 600000;
                    }).length || 0;
                    return recentFailures > 3;
                },
                severity: 'medium',
                message: 'High number of worker job failures',
                cooldown: 600,
            },
        ];
    }
    initialize() {
        if (this.isInitialized) {
            return;
        }
        this.checkInterval = setInterval(() => {
            this.checkAlerts().catch(console.error);
        }, 30000);
        this.isInitialized = true;
        console.log('✅ Alerting service initialized');
    }
    async checkAlerts() {
        for (const rule of this.rules) {
            try {
                const shouldTrigger = await rule.condition();
                if (shouldTrigger) {
                    if (rule.lastTriggered) {
                        const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
                        if (timeSinceLastTrigger < rule.cooldown * 1000) {
                            continue;
                        }
                    }
                    await this.createAlert(rule);
                    rule.lastTriggered = new Date();
                }
            }
            catch (error) {
                console.error(`Error checking alert rule ${rule.id}:`, error);
            }
        }
    }
    async createAlert(rule) {
        const alert = {
            id: `${rule.id}_${Date.now()}`,
            ruleId: rule.id,
            severity: rule.severity,
            message: rule.message,
            timestamp: new Date(),
            resolved: false,
        };
        this.alerts.push(alert);
        monitoring_service_1.monitoring.captureMessage(alert.message, 'error', {
            alertId: alert.id,
            ruleId: rule.id,
            severity: rule.severity,
        });
        console.log(`🚨 ALERT [${rule.severity.toUpperCase()}] ${rule.name}: ${rule.message}`);
        await this.sendAlertNotification(alert);
    }
    async sendAlertNotification(alert) {
        if (env_1.config.monitoring.alerts?.webhook) {
            try {
                console.log(`📤 Sending alert notification: ${alert.message}`);
            }
            catch (error) {
                console.error('Failed to send alert notification:', error);
            }
        }
    }
    resolveAlert(alertId) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert && !alert.resolved) {
            alert.resolved = true;
            alert.resolvedAt = new Date();
            console.log(`✅ Alert resolved: ${alert.message}`);
        }
    }
    getActiveAlerts() {
        return this.alerts.filter(a => !a.resolved);
    }
    getAllAlerts() {
        return this.alerts;
    }
    getAlertsBySeverity(severity) {
        return this.alerts.filter(a => a.severity === severity);
    }
    cleanupOldAlerts(maxAge = 24 * 60 * 60 * 1000) {
        const cutoff = new Date(Date.now() - maxAge);
        this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
    }
    close() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.isInitialized = false;
        console.log('✅ Alerting service closed');
    }
}
exports.AlertingService = AlertingService;
exports.alerting = AlertingService.getInstance();
//# sourceMappingURL=alerting.service.js.map