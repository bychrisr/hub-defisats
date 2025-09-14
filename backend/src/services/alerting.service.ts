import { monitoring } from './monitoring.service';
import { metrics } from './metrics.service';
import { config } from '@/config/env';

// Interface for metric values
interface MetricValue {
  value: number;
  labels: {
    status_code?: string;
    [key: string]: string | undefined;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  condition: () => Promise<boolean>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cooldown: number; // em segundos
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export class AlertingService {
  private static instance: AlertingService;
  private alerts: Alert[] = [];
  private rules: AlertRule[] = [];
  private isInitialized = false;
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeRules();
  }

  static getInstance(): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService();
    }
    return AlertingService.instance;
  }

  /**
   * Inicializar regras de alerta
   */
  private initializeRules(): void {
    this.rules = [
      // Alertas de performance
      {
        id: 'high_response_time',
        name: 'High Response Time',
        condition: async () => {
          const metricsData = await metrics.getMetricsAsJSON();
          const responseTimeMetric = metricsData.find(
            (m: any) => m.name === 'http_request_duration_seconds'
          );
          if (!responseTimeMetric) return false;

          const avgResponseTime =
            responseTimeMetric.values?.reduce(
              (sum: number, val: MetricValue) => sum + val.value,
              0
            ) / responseTimeMetric.values?.length || 0;
          return avgResponseTime > 2; // 2 segundos
        },
        severity: 'high',
        message: 'Average response time is above 2 seconds',
        cooldown: 300, // 5 minutos
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        condition: async () => {
          const metricsData = await metrics.getMetricsAsJSON();
          const errorRateMetric = metricsData.find(
            (m: any) => m.name === 'http_requests_total'
          );
          if (!errorRateMetric) return false;

          const errorCount =
            errorRateMetric.values?.filter(
              (v: MetricValue) => v.labels.status_code && v.labels.status_code >= '400'
            ).length || 0;
          const totalCount = errorRateMetric.values?.length || 1;
          const errorRate = errorCount / totalCount;

          return errorRate > 0.05; // 5%
        },
        severity: 'critical',
        message: 'Error rate is above 5%',
        cooldown: 180, // 3 minutos
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        condition: async () => {
          const metricsData = await metrics.getMetricsAsJSON();
          const memoryMetric = metricsData.find(
            (m: any) => m.name === 'memory_usage_bytes' && m.labels?.type === 'heapUsed'
          );
          if (!memoryMetric) return false;

          const memoryUsageMB =
            memoryMetric.values?.[0]?.value / 1024 / 1024 || 0;
          return memoryUsageMB > 500; // 500MB
        },
        severity: 'medium',
        message: 'Memory usage is above 500MB',
        cooldown: 600, // 10 minutos
      },
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        condition: async () => {
          const metricsData = await metrics.getMetricsAsJSON();
          const cpuMetric = metricsData.find(
            (m: any) => m.name === 'cpu_usage_percent'
          );
          if (!cpuMetric) return false;

          const cpuUsage = cpuMetric.values?.[0]?.value || 0;
          return cpuUsage > 80; // 80%
        },
        severity: 'high',
        message: 'CPU usage is above 80%',
        cooldown: 300, // 5 minutos
      },
      // Alertas de autenticação
      {
        id: 'high_auth_failures',
        name: 'High Authentication Failures',
        condition: async () => {
          const metricsData = await metrics.getMetricsAsJSON();
          const authFailuresMetric = metricsData.find(
            (m: any) => m.name === 'auth_failures_total'
          );
          if (!authFailuresMetric) return false;

          const recentFailures =
            authFailuresMetric.values?.filter((v: MetricValue) => {
              const timestamp = new Date((v as any).timestamp);
              const now = new Date();
              return now.getTime() - timestamp.getTime() < 300000; // últimos 5 minutos
            }).length || 0;

          return recentFailures > 10; // 10 falhas em 5 minutos
        },
        severity: 'high',
        message: 'High number of authentication failures detected',
        cooldown: 300, // 5 minutos
      },
      {
        id: 'rate_limit_abuse',
        name: 'Rate Limit Abuse',
        condition: async () => {
          const metricsData = await metrics.getMetricsAsJSON();
          const rateLimitMetric = metricsData.find(
            (m: any) => m.name === 'rate_limit_blocks_total'
          );
          if (!rateLimitMetric) return false;

          const recentBlocks =
            rateLimitMetric.values?.filter((v: MetricValue) => {
              const timestamp = new Date((v as any).timestamp);
              const now = new Date();
              return now.getTime() - timestamp.getTime() < 600000; // últimos 10 minutos
            }).length || 0;

          return recentBlocks > 50; // 50 bloqueios em 10 minutos
        },
        severity: 'medium',
        message: 'High number of rate limit blocks detected',
        cooldown: 600, // 10 minutos
      },
      // Alertas de API externa
      {
        id: 'lnmarkets_api_errors',
        name: 'LN Markets API Errors',
        condition: async () => {
          const metricsData = await metrics.getMetricsAsJSON();
          const apiErrorsMetric = metricsData.find(
            (m: any) => m.name === 'lnmarkets_api_errors_total'
          );
          if (!apiErrorsMetric) return false;

          const recentErrors =
            apiErrorsMetric.values?.filter((v: MetricValue) => {
              const timestamp = new Date((v as any).timestamp);
              const now = new Date();
              return now.getTime() - timestamp.getTime() < 300000; // últimos 5 minutos
            }).length || 0;

          return recentErrors > 5; // 5 erros em 5 minutos
        },
        severity: 'high',
        message: 'High number of LN Markets API errors',
        cooldown: 300, // 5 minutos
      },
      // Alertas de workers
      {
        id: 'worker_job_failures',
        name: 'Worker Job Failures',
        condition: async () => {
          const metricsData = await metrics.getMetricsAsJSON();
          const workerFailuresMetric = metricsData.find(
            (m: any) => m.name === 'worker_job_failures_total'
          );
          if (!workerFailuresMetric) return false;

          const recentFailures =
            workerFailuresMetric.values?.filter((v: MetricValue) => {
              const timestamp = new Date((v as any).timestamp);
              const now = new Date();
              return now.getTime() - timestamp.getTime() < 600000; // últimos 10 minutos
            }).length || 0;

          return recentFailures > 3; // 3 falhas em 10 minutos
        },
        severity: 'medium',
        message: 'High number of worker job failures',
        cooldown: 600, // 10 minutos
      },
    ];
  }

  /**
   * Inicializar serviço de alertas
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Verificar alertas a cada 30 segundos
    this.checkInterval = setInterval(() => {
      this.checkAlerts().catch(console.error);
    }, 30000);

    this.isInitialized = true;
    console.log('✅ Alerting service initialized');
  }

  /**
   * Verificar todas as regras de alerta
   */
  private async checkAlerts(): Promise<void> {
    for (const rule of this.rules) {
      try {
        const shouldTrigger = await rule.condition();

        if (shouldTrigger) {
          // Verificar cooldown
          if (rule.lastTriggered) {
            const timeSinceLastTrigger =
              Date.now() - rule.lastTriggered.getTime();
            if (timeSinceLastTrigger < rule.cooldown * 1000) {
              continue; // Ainda em cooldown
            }
          }

          // Criar alerta
          await this.createAlert(rule);
          rule.lastTriggered = new Date();
        }
      } catch (error) {
        console.error(`Error checking alert rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Criar novo alerta
   */
  private async createAlert(rule: AlertRule): Promise<void> {
    const alert: Alert = {
      id: `${rule.id}_${Date.now()}`,
      ruleId: rule.id,
      severity: rule.severity,
      message: rule.message,
      timestamp: new Date(),
      resolved: false,
    };

    this.alerts.push(alert);

    // Enviar para Sentry
    monitoring.captureMessage(alert.message, 'error', {
      alertId: alert.id,
      ruleId: rule.id,
      severity: rule.severity,
    });

    // Log do alerta
    console.log(
      `🚨 ALERT [${rule.severity.toUpperCase()}] ${rule.name}: ${rule.message}`
    );

    // Aqui você pode adicionar integrações com Slack, Discord, email, etc.
    await this.sendAlertNotification(alert);
  }

  /**
   * Enviar notificação de alerta
   */
  private async sendAlertNotification(alert: Alert): Promise<void> {
    // Implementar notificações aqui
    // Ex: Slack, Discord, email, webhook, etc.

    if ((config.monitoring as any).alerts?.webhook) {
      try {
        // Exemplo de webhook
        console.log(`📤 Sending alert notification: ${alert.message}`);
      } catch (error) {
        console.error('Failed to send alert notification:', error);
      }
    }
  }

  /**
   * Resolver alerta
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      console.log(`✅ Alert resolved: ${alert.message}`);
    }
  }

  /**
   * Obter alertas ativos
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Obter todos os alertas
   */
  getAllAlerts(): Alert[] {
    return this.alerts;
  }

  /**
   * Obter alertas por severidade
   */
  getAlertsBySeverity(severity: string): Alert[] {
    return this.alerts.filter(a => a.severity === severity);
  }

  /**
   * Limpar alertas antigos
   */
  cleanupOldAlerts(maxAge: number = 24 * 60 * 60 * 1000): void {
    // 24 horas
    const cutoff = new Date(Date.now() - maxAge);
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
  }

  /**
   * Fechar serviço
   */
  close(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isInitialized = false;
    console.log('✅ Alerting service closed');
  }
}

// Instância singleton
export const alerting = AlertingService.getInstance();
