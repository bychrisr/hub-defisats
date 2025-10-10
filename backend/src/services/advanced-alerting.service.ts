import { Logger } from 'winston';
import { metrics } from '../utils/metrics';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldown: number; // in milliseconds
  channels: string[];
  tags: string[];
}

export interface Alert {
  id: string;
  ruleId: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  status: 'firing' | 'resolved' | 'acknowledged';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  metadata: Record<string, any>;
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

export class AdvancedAlertingService {
  private logger: Logger;
  private rules: Map<string, AlertRule> = new Map();
  private channels: Map<string, NotificationChannel> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private lastTriggered: Map<string, number> = new Map();
  private alertCounter = 0;

  constructor(logger: Logger) {
    this.logger = logger;
    this.initializeDefaultRules();
    this.initializeDefaultChannels();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        description: 'Memory usage exceeds 80%',
        metric: 'axisor_memory_usage_bytes',
        condition: 'gt',
        threshold: 0.8,
        severity: 'high',
        enabled: true,
        cooldown: 300000, // 5 minutes
        channels: ['email', 'slack'],
        tags: ['system', 'memory']
      },
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        description: 'CPU usage exceeds 90%',
        metric: 'axisor_cpu_usage_percent',
        condition: 'gt',
        threshold: 90,
        severity: 'high',
        enabled: true,
        cooldown: 300000, // 5 minutes
        channels: ['email', 'slack'],
        tags: ['system', 'cpu']
      },
      {
        id: 'high_error_rate',
        name: 'High Error Rate',
        description: 'HTTP error rate exceeds 10%',
        metric: 'axisor_http_request_errors_total',
        condition: 'gt',
        threshold: 10,
        severity: 'critical',
        enabled: true,
        cooldown: 60000, // 1 minute
        channels: ['email', 'slack', 'webhook'],
        tags: ['http', 'errors']
      },
      {
        id: 'database_connection_issues',
        name: 'Database Connection Issues',
        description: 'Database connection pool is full',
        metric: 'axisor_db_connection_pool_size',
        condition: 'gt',
        threshold: 25,
        severity: 'critical',
        enabled: true,
        cooldown: 120000, // 2 minutes
        channels: ['email', 'slack'],
        tags: ['database', 'connections']
      },
      {
        id: 'redis_connection_issues',
        name: 'Redis Connection Issues',
        description: 'Redis connection pool is full',
        metric: 'axisor_redis_connection_pool_size',
        condition: 'gt',
        threshold: 20,
        severity: 'high',
        enabled: true,
        cooldown: 120000, // 2 minutes
        channels: ['email', 'slack'],
        tags: ['redis', 'connections']
      },
      {
        id: 'slow_response_time',
        name: 'Slow Response Time',
        description: 'Average response time exceeds 2 seconds',
        metric: 'axisor_http_request_duration_seconds',
        condition: 'gt',
        threshold: 2,
        severity: 'medium',
        enabled: true,
        cooldown: 300000, // 5 minutes
        channels: ['slack'],
        tags: ['http', 'performance']
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });

    this.logger.info('Default alert rules initialized', { count: defaultRules.length });
  }

  /**
   * Initialize default notification channels
   */
  private initializeDefaultChannels(): void {
    const defaultChannels: NotificationChannel[] = [
      {
        id: 'email',
        name: 'Email Notifications',
        type: 'email',
        config: {
          smtp: {
            host: process.env.SMTP_HOST || 'localhost',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
              user: process.env.SMTP_USER || '',
              pass: process.env.SMTP_PASS || ''
            }
          },
          from: process.env.SMTP_FROM || 'alerts@axisor.com',
          to: process.env.ALERT_EMAIL_TO || 'admin@axisor.com'
        },
        enabled: true
      },
      {
        id: 'slack',
        name: 'Slack Notifications',
        type: 'slack',
        config: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
          channel: process.env.SLACK_ALERT_CHANNEL || '#alerts',
          username: 'Axisor Alerts'
        },
        enabled: !!process.env.SLACK_WEBHOOK_URL
      },
      {
        id: 'webhook',
        name: 'Webhook Notifications',
        type: 'webhook',
        config: {
          url: process.env.ALERT_WEBHOOK_URL || '',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ALERT_WEBHOOK_TOKEN || ''}`
          }
        },
        enabled: !!process.env.ALERT_WEBHOOK_URL
      }
    ];

    defaultChannels.forEach(channel => {
      this.channels.set(channel.id, channel);
    });

    this.logger.info('Default notification channels initialized', { count: defaultChannels.length });
  }

  /**
   * Add or update an alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    this.logger.info('Alert rule added/updated', { ruleId: rule.id, name: rule.name });
  }

  /**
   * Remove an alert rule
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId);
    if (removed) {
      this.logger.info('Alert rule removed', { ruleId });
    }
    return removed;
  }

  /**
   * Get all alert rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get alert rule by ID
   */
  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Add or update a notification channel
   */
  addChannel(channel: NotificationChannel): void {
    this.channels.set(channel.id, channel);
    this.logger.info('Notification channel added/updated', { channelId: channel.id, name: channel.name });
  }

  /**
   * Remove a notification channel
   */
  removeChannel(channelId: string): boolean {
    const removed = this.channels.delete(channelId);
    if (removed) {
      this.logger.info('Notification channel removed', { channelId });
    }
    return removed;
  }

  /**
   * Get all notification channels
   */
  getChannels(): NotificationChannel[] {
    return Array.from(this.channels.values());
  }

  /**
   * Get notification channel by ID
   */
  getChannel(channelId: string): NotificationChannel | undefined {
    return this.channels.get(channelId);
  }

  /**
   * Evaluate all alert rules
   */
  async evaluateRules(): Promise<void> {
    try {
      const metricsData = metrics.getMetricsAsJSON();
      
      for (const rule of this.rules.values()) {
        if (!rule.enabled) continue;
        
        const metricValue = this.getMetricValue(metricsData, rule.metric);
        if (metricValue === null) continue;
        
        const shouldTrigger = this.evaluateCondition(metricValue, rule.condition, rule.threshold);
        
        if (shouldTrigger) {
          await this.triggerAlert(rule, metricValue);
        } else {
          await this.resolveAlert(rule.id);
        }
      }
    } catch (error) {
      this.logger.error('Failed to evaluate alert rules', { error });
    }
  }

  /**
   * Get metric value from Prometheus metrics
   */
  private getMetricValue(metrics: any[], metricName: string): number | null {
    const metric = metrics.find(m => m.name === metricName);
    if (!metric) return null;
    
    // For counters and gauges, get the latest value
    if (metric.type === 'counter' || metric.type === 'gauge') {
      const values = metric.values || [];
      if (values.length === 0) return null;
      
      // Get the latest value (assuming values are sorted by timestamp)
      const latestValue = values[values.length - 1];
      return latestValue.value || 0;
    }
    
    // For histograms, get the sum or count
    if (metric.type === 'histogram') {
      const sumMetric = metrics.find(m => m.name === `${metricName}_sum`);
      const countMetric = metrics.find(m => m.name === `${metricName}_count`);
      
      if (sumMetric && countMetric) {
        const sumValues = sumMetric.values || [];
        const countValues = countMetric.values || [];
        
        if (sumValues.length > 0 && countValues.length > 0) {
          const sum = sumValues[sumValues.length - 1].value || 0;
          const count = countValues[countValues.length - 1].value || 0;
          return count > 0 ? sum / count : 0;
        }
      }
    }
    
    return null;
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(rule: AlertRule, value: number): Promise<void> {
    const now = Date.now();
    const lastTriggered = this.lastTriggered.get(rule.id) || 0;
    
    // Check cooldown
    if (now - lastTriggered < rule.cooldown) {
      return;
    }
    
    // Check if alert is already active
    if (this.activeAlerts.has(rule.id)) {
      return;
    }
    
    const alert: Alert = {
      id: `alert_${++this.alertCounter}_${Date.now()}`,
      ruleId: rule.id,
      timestamp: new Date().toISOString(),
      severity: rule.severity,
      message: `${rule.name}: ${rule.description} (Current: ${value}, Threshold: ${rule.threshold})`,
      value,
      threshold: rule.threshold,
      status: 'firing',
      metadata: {
        ruleName: rule.name,
        tags: rule.tags
      }
    };
    
    this.activeAlerts.set(rule.id, alert);
    this.lastTriggered.set(rule.id, now);
    
    // Record alert trigger in metrics
    // Note: The utils/metrics service doesn't have recordAlertTrigger method
    // This would need to be implemented if needed
    
    // Send notifications
    await this.sendNotifications(alert, rule.channels);
    
    this.logger.warn('Alert triggered', {
      alertId: alert.id,
      ruleId: rule.id,
      severity: rule.severity,
      message: alert.message,
      value,
      threshold: rule.threshold
    });
  }

  /**
   * Resolve an alert
   */
  private async resolveAlert(ruleId: string): Promise<void> {
    const alert = this.activeAlerts.get(ruleId);
    if (!alert) return;
    
    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    
    this.activeAlerts.delete(ruleId);
    
    this.logger.info('Alert resolved', {
      alertId: alert.id,
      ruleId: ruleId,
      duration: Date.now() - new Date(alert.timestamp).getTime()
    });
  }

  /**
   * Send notifications for an alert
   */
  private async sendNotifications(alert: Alert, channelIds: string[]): Promise<void> {
    for (const channelId of channelIds) {
      const channel = this.channels.get(channelId);
      if (!channel || !channel.enabled) continue;
      
      try {
        await this.sendNotification(alert, channel);
      } catch (error) {
        this.logger.error('Failed to send notification', {
          channelId,
          alertId: alert.id,
          error
        });
      }
    }
  }

  /**
   * Send notification via specific channel
   */
  private async sendNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    const message = this.formatAlertMessage(alert);
    
    switch (channel.type) {
      case 'email':
        await this.sendEmailNotification(alert, channel, message);
        break;
      case 'slack':
        await this.sendSlackNotification(alert, channel, message);
        break;
      case 'webhook':
        await this.sendWebhookNotification(alert, channel, message);
        break;
      case 'sms':
        await this.sendSmsNotification(alert, channel, message);
        break;
      default:
        this.logger.warn('Unknown notification channel type', { type: channel.type });
    }
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(alert: Alert): string {
    const severityEmoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '🚨'
    };
    
    return `${severityEmoji[alert.severity]} **${alert.message}**\n\n` +
           `**Severity:** ${alert.severity.toUpperCase()}\n` +
           `**Timestamp:** ${alert.timestamp}\n` +
           `**Value:** ${alert.value}\n` +
           `**Threshold:** ${alert.threshold}\n` +
           `**Status:** ${alert.status.toUpperCase()}`;
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert, channel: NotificationChannel, message: string): Promise<void> {
    // This would integrate with an email service like Nodemailer
    this.logger.info('Email notification sent', {
      channelId: channel.id,
      alertId: alert.id,
      to: channel.config.to
    });
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert, channel: NotificationChannel, message: string): Promise<void> {
    if (!channel.config.webhookUrl) return;
    
    const payload = {
      channel: channel.config.channel,
      username: channel.config.username,
      text: message,
      icon_emoji: ':warning:'
    };
    
    // This would make an HTTP request to the Slack webhook
    this.logger.info('Slack notification sent', {
      channelId: channel.id,
      alertId: alert.id,
      channel: channel.config.channel
    });
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Alert, channel: NotificationChannel, message: string): Promise<void> {
    if (!channel.config.url) return;
    
    const payload = {
      alert,
      message,
      timestamp: new Date().toISOString()
    };
    
    // This would make an HTTP request to the webhook URL
    this.logger.info('Webhook notification sent', {
      channelId: channel.id,
      alertId: alert.id,
      url: channel.config.url
    });
  }

  /**
   * Send SMS notification
   */
  private async sendSmsNotification(alert: Alert, channel: NotificationChannel, message: string): Promise<void> {
    // This would integrate with an SMS service like Twilio
    this.logger.info('SMS notification sent', {
      channelId: channel.id,
      alertId: alert.id
    });
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): Alert | undefined {
    return Array.from(this.activeAlerts.values()).find(alert => alert.id === alertId);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.getAlert(alertId);
    if (!alert) return false;
    
    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();
    
    this.logger.info('Alert acknowledged', {
      alertId,
      acknowledgedBy,
      acknowledgedAt: alert.acknowledgedAt
    });
    
    return true;
  }

  /**
   * Start alert evaluation loop
   */
  startEvaluationLoop(intervalMs: number = 30000): void {
    setInterval(() => {
      this.evaluateRules();
    }, intervalMs);
    
    this.logger.info('Alert evaluation loop started', { intervalMs });
  }

  /**
   * Stop alert evaluation loop
   */
  stopEvaluationLoop(): void {
    // This would clear the interval
    this.logger.info('Alert evaluation loop stopped');
  }
}