import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export interface AutomationAlert {
  id: string;
  automationId: string;
  userId: string;
  accountId: string;
  type: 'execution_failed' | 'performance_degraded' | 'rate_limit_exceeded' | 'credential_invalid' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  details: Record<string, any>;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  resolvedBy?: string;
  tags: string[];
  metadata: {
    automationName: string;
    accountName: string;
    exchangeName: string;
    userEmail: string;
    planType: string;
  };
}

export interface AutomationAlertConfig {
  enableExecutionFailed: boolean;
  enablePerformanceDegraded: boolean;
  enableRateLimitExceeded: boolean;
  enableCredentialInvalid: boolean;
  enableSystemError: boolean;
  performanceThreshold: {
    cpuUsage: number;
    memoryUsage: number;
    executionTime: number;
    errorRate: number;
  };
  rateLimitThreshold: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  alertCooldown: number; // em milissegundos
  maxAlertsPerUser: number;
  maxAlertsPerAutomation: number;
}

export interface AutomationAlertStats {
  totalAlerts: number;
  resolvedAlerts: number;
  unresolvedAlerts: number;
  alertsByType: Record<string, number>;
  alertsBySeverity: Record<string, number>;
  alertsByUser: Array<{
    userId: string;
    userEmail: string;
    totalAlerts: number;
    unresolvedAlerts: number;
  }>;
  alertsByAutomation: Array<{
    automationId: string;
    automationName: string;
    totalAlerts: number;
    unresolvedAlerts: number;
  }>;
  timeRange: {
    start: string;
    end: string;
  };
}

export class AutomationAlertService {
  private prisma: PrismaClient;
  private alerts: Map<string, AutomationAlert> = new Map();
  private alertConfig: AutomationAlertConfig;
  private cooldowns: Map<string, number> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    
    this.alertConfig = {
      enableExecutionFailed: true,
      enablePerformanceDegraded: true,
      enableRateLimitExceeded: true,
      enableCredentialInvalid: true,
      enableSystemError: true,
      performanceThreshold: {
        cpuUsage: 80,
        memoryUsage: 85,
        executionTime: 30000, // 30 segundos
        errorRate: 20 // 20%
      },
      rateLimitThreshold: {
        requestsPerMinute: 50,
        requestsPerHour: 500,
        requestsPerDay: 5000
      },
      alertCooldown: 300000, // 5 minutos
      maxAlertsPerUser: 100,
      maxAlertsPerAutomation: 50
    };

    console.log('🚀 AUTOMATION ALERT SERVICE - Service initialized');
  }

  // ===== CONFIGURAÇÃO =====

  public updateAlertConfig(config: Partial<AutomationAlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
    console.log('✅ AUTOMATION ALERT SERVICE - Updated alert config:', this.alertConfig);
  }

  public getAlertConfig(): AutomationAlertConfig {
    return { ...this.alertConfig };
  }

  // ===== CRIAÇÃO DE ALERTAS =====

  public async createAlert(
    automationId: string,
    userId: string,
    accountId: string,
    type: AutomationAlert['type'],
    severity: AutomationAlert['severity'],
    title: string,
    message: string,
    details: Record<string, any> = {}
  ): Promise<AutomationAlert | null> {
    try {
      console.log(`🚨 AUTOMATION ALERT SERVICE - Creating alert: ${type} for automation ${automationId}`);

      // Verificar se o tipo de alerta está habilitado
      if (!this.isAlertTypeEnabled(type)) {
        console.log(`⚠️ AUTOMATION ALERT SERVICE - Alert type ${type} is disabled`);
        return null;
      }

      // Verificar cooldown
      const cooldownKey = `${userId}-${automationId}-${type}`;
      if (this.isInCooldown(cooldownKey)) {
        console.log(`⏳ AUTOMATION ALERT SERVICE - Alert in cooldown for ${cooldownKey}`);
        return null;
      }

      // Verificar limites
      if (await this.isAlertLimitExceeded(userId, automationId)) {
        console.log(`🚫 AUTOMATION ALERT SERVICE - Alert limit exceeded for user ${userId} or automation ${automationId}`);
        return null;
      }

      // Obter informações da automação e conta
      const automation = await this.prisma.automation.findUnique({
        where: { id: automationId },
        include: {
          user: {
            select: { email: true, plan_type: true }
          },
          userExchangeAccount: {
            select: {
              account_name: true,
              exchange: {
                select: { name: true }
              }
            }
          }
        }
      });

      if (!automation) {
        console.error(`❌ AUTOMATION ALERT SERVICE - Automation ${automationId} not found`);
        return null;
      }

      const account = await this.prisma.userExchangeAccount.findUnique({
        where: { id: accountId },
        include: {
          exchange: {
            select: { name: true }
          }
        }
      });

      if (!account) {
        console.error(`❌ AUTOMATION ALERT SERVICE - Account ${accountId} not found`);
        return null;
      }

      // Criar alerta
      const alert: AutomationAlert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        automationId,
        userId,
        accountId,
        type,
        severity,
        title,
        message,
        details,
        timestamp: Date.now(),
        resolved: false,
        tags: this.generateTags(type, severity, details),
        metadata: {
          automationName: automation.name,
          accountName: account.account_name,
          exchangeName: account.exchange.name,
          userEmail: automation.user.email,
          planType: automation.user.plan_type
        }
      };

      // Salvar alerta
      this.alerts.set(alert.id, alert);
      this.cooldowns.set(cooldownKey, Date.now());

      // Enviar notificação (se configurado)
      await this.sendNotification(alert);

      console.log(`✅ AUTOMATION ALERT SERVICE - Alert created: ${alert.id}`);
      return alert;

    } catch (error) {
      console.error('❌ AUTOMATION ALERT SERVICE - Error creating alert:', error);
      return null;
    }
  }

  // ===== ALERTAS ESPECÍFICOS =====

  public async alertExecutionFailed(
    automationId: string,
    userId: string,
    accountId: string,
    errorMessage: string,
    details: Record<string, any> = {}
  ): Promise<AutomationAlert | null> {
    return this.createAlert(
      automationId,
      userId,
      accountId,
      'execution_failed',
      'high',
      'Automation Execution Failed',
      `Automation execution failed: ${errorMessage}`,
      { errorMessage, ...details }
    );
  }

  public async alertPerformanceDegraded(
    automationId: string,
    userId: string,
    accountId: string,
    performance: {
      cpuUsage: number;
      memoryUsage: number;
      executionTime: number;
      errorRate: number;
    },
    details: Record<string, any> = {}
  ): Promise<AutomationAlert | null> {
    const severity = this.calculatePerformanceSeverity(performance);
    
    return this.createAlert(
      automationId,
      userId,
      accountId,
      'performance_degraded',
      severity,
      'Automation Performance Degraded',
      `Automation performance is degraded: CPU ${performance.cpuUsage}%, Memory ${performance.memoryUsage}%, Execution ${performance.executionTime}ms`,
      { performance, ...details }
    );
  }

  public async alertRateLimitExceeded(
    automationId: string,
    userId: string,
    accountId: string,
    rateLimit: {
      requestsPerMinute: number;
      requestsPerHour: number;
      requestsPerDay: number;
    },
    details: Record<string, any> = {}
  ): Promise<AutomationAlert | null> {
    return this.createAlert(
      automationId,
      userId,
      accountId,
      'rate_limit_exceeded',
      'medium',
      'Rate Limit Exceeded',
      `Rate limit exceeded: ${rateLimit.requestsPerMinute} requests/minute`,
      { rateLimit, ...details }
    );
  }

  public async alertCredentialInvalid(
    automationId: string,
    userId: string,
    accountId: string,
    credentialError: string,
    details: Record<string, any> = {}
  ): Promise<AutomationAlert | null> {
    return this.createAlert(
      automationId,
      userId,
      accountId,
      'credential_invalid',
      'high',
      'Invalid Credentials',
      `Automation credentials are invalid: ${credentialError}`,
      { credentialError, ...details }
    );
  }

  public async alertSystemError(
    automationId: string,
    userId: string,
    accountId: string,
    systemError: string,
    details: Record<string, any> = {}
  ): Promise<AutomationAlert | null> {
    return this.createAlert(
      automationId,
      userId,
      accountId,
      'system_error',
      'critical',
      'System Error',
      `System error occurred: ${systemError}`,
      { systemError, ...details }
    );
  }

  // ===== CONSULTA DE ALERTAS =====

  public async getAlerts(query: {
    userId?: string;
    automationId?: string;
    type?: string;
    severity?: string;
    resolved?: boolean;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    alerts: AutomationAlert[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const {
        userId,
        automationId,
        type,
        severity,
        resolved,
        startDate,
        endDate,
        page = 1,
        limit = 50
      } = query;

      let alerts = Array.from(this.alerts.values());

      // Aplicar filtros
      if (userId) alerts = alerts.filter(alert => alert.userId === userId);
      if (automationId) alerts = alerts.filter(alert => alert.automationId === automationId);
      if (type) alerts = alerts.filter(alert => alert.type === type);
      if (severity) alerts = alerts.filter(alert => alert.severity === severity);
      if (resolved !== undefined) alerts = alerts.filter(alert => alert.resolved === resolved);
      
      if (startDate) {
        const start = new Date(startDate).getTime();
        alerts = alerts.filter(alert => alert.timestamp >= start);
      }
      
      if (endDate) {
        const end = new Date(endDate).getTime();
        alerts = alerts.filter(alert => alert.timestamp <= end);
      }

      // Ordenar por timestamp (mais recente primeiro)
      alerts.sort((a, b) => b.timestamp - a.timestamp);

      // Paginação
      const total = alerts.length;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAlerts = alerts.slice(startIndex, endIndex);

      return {
        alerts: paginatedAlerts,
        total,
        page,
        limit
      };

    } catch (error) {
      console.error('❌ AUTOMATION ALERT SERVICE - Error fetching alerts:', error);
      throw error;
    }
  }

  // ===== RESOLUÇÃO DE ALERTAS =====

  public async resolveAlert(
    alertId: string,
    resolvedBy?: string
  ): Promise<boolean> {
    try {
      const alert = this.alerts.get(alertId);
      if (!alert) {
        console.error(`❌ AUTOMATION ALERT SERVICE - Alert ${alertId} not found`);
        return false;
      }

      alert.resolved = true;
      alert.resolvedAt = Date.now();
      if (resolvedBy) alert.resolvedBy = resolvedBy;

      this.alerts.set(alertId, alert);

      console.log(`✅ AUTOMATION ALERT SERVICE - Alert ${alertId} resolved`);
      return true;

    } catch (error) {
      console.error('❌ AUTOMATION ALERT SERVICE - Error resolving alert:', error);
      return false;
    }
  }

  public async resolveAlertsByAutomation(
    automationId: string,
    resolvedBy?: string
  ): Promise<number> {
    try {
      let resolvedCount = 0;
      
      for (const [alertId, alert] of this.alerts.entries()) {
        if (alert.automationId === automationId && !alert.resolved) {
          alert.resolved = true;
          alert.resolvedAt = Date.now();
          if (resolvedBy) alert.resolvedBy = resolvedBy;
          
          this.alerts.set(alertId, alert);
          resolvedCount++;
        }
      }

      console.log(`✅ AUTOMATION ALERT SERVICE - Resolved ${resolvedCount} alerts for automation ${automationId}`);
      return resolvedCount;

    } catch (error) {
      console.error('❌ AUTOMATION ALERT SERVICE - Error resolving alerts:', error);
      return 0;
    }
  }

  // ===== ESTATÍSTICAS =====

  public async getAlertStats(query: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  } = {}): Promise<AutomationAlertStats> {
    try {
      const { userId, startDate, endDate } = query;
      
      let alerts = Array.from(this.alerts.values());

      // Aplicar filtros
      if (userId) alerts = alerts.filter(alert => alert.userId === userId);
      
      if (startDate) {
        const start = new Date(startDate).getTime();
        alerts = alerts.filter(alert => alert.timestamp >= start);
      }
      
      if (endDate) {
        const end = new Date(endDate).getTime();
        alerts = alerts.filter(alert => alert.timestamp <= end);
      }

      const totalAlerts = alerts.length;
      const resolvedAlerts = alerts.filter(alert => alert.resolved).length;
      const unresolvedAlerts = totalAlerts - resolvedAlerts;

      // Estatísticas por tipo
      const alertsByType: Record<string, number> = {};
      alerts.forEach(alert => {
        alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
      });

      // Estatísticas por severidade
      const alertsBySeverity: Record<string, number> = {};
      alerts.forEach(alert => {
        alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
      });

      // Estatísticas por usuário
      const userMap = new Map<string, { userId: string; userEmail: string; totalAlerts: number; unresolvedAlerts: number }>();
      alerts.forEach(alert => {
        const key = alert.userId;
        if (!userMap.has(key)) {
          userMap.set(key, {
            userId: alert.userId,
            userEmail: alert.metadata.userEmail,
            totalAlerts: 0,
            unresolvedAlerts: 0
          });
        }
        
        const userStats = userMap.get(key)!;
        userStats.totalAlerts++;
        if (!alert.resolved) userStats.unresolvedAlerts++;
      });

      // Estatísticas por automação
      const automationMap = new Map<string, { automationId: string; automationName: string; totalAlerts: number; unresolvedAlerts: number }>();
      alerts.forEach(alert => {
        const key = alert.automationId;
        if (!automationMap.has(key)) {
          automationMap.set(key, {
            automationId: alert.automationId,
            automationName: alert.metadata.automationName,
            totalAlerts: 0,
            unresolvedAlerts: 0
          });
        }
        
        const automationStats = automationMap.get(key)!;
        automationStats.totalAlerts++;
        if (!alert.resolved) automationStats.unresolvedAlerts++;
      });

      return {
        totalAlerts,
        resolvedAlerts,
        unresolvedAlerts,
        alertsByType,
        alertsBySeverity,
        alertsByUser: Array.from(userMap.values()),
        alertsByAutomation: Array.from(automationMap.values()),
        timeRange: {
          start: alerts.length > 0 ? new Date(Math.min(...alerts.map(a => a.timestamp))).toISOString() : new Date().toISOString(),
          end: alerts.length > 0 ? new Date(Math.max(...alerts.map(a => a.timestamp))).toISOString() : new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ AUTOMATION ALERT SERVICE - Error calculating stats:', error);
      throw error;
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  private isAlertTypeEnabled(type: AutomationAlert['type']): boolean {
    switch (type) {
      case 'execution_failed':
        return this.alertConfig.enableExecutionFailed;
      case 'performance_degraded':
        return this.alertConfig.enablePerformanceDegraded;
      case 'rate_limit_exceeded':
        return this.alertConfig.enableRateLimitExceeded;
      case 'credential_invalid':
        return this.alertConfig.enableCredentialInvalid;
      case 'system_error':
        return this.alertConfig.enableSystemError;
      default:
        return false;
    }
  }

  private isInCooldown(cooldownKey: string): boolean {
    const lastAlert = this.cooldowns.get(cooldownKey);
    if (!lastAlert) return false;
    
    return Date.now() - lastAlert < this.alertConfig.alertCooldown;
  }

  private async isAlertLimitExceeded(userId: string, automationId: string): Promise<boolean> {
    const userAlerts = Array.from(this.alerts.values()).filter(alert => alert.userId === userId);
    const automationAlerts = Array.from(this.alerts.values()).filter(alert => alert.automationId === automationId);
    
    return userAlerts.length >= this.alertConfig.maxAlertsPerUser ||
           automationAlerts.length >= this.alertConfig.maxAlertsPerAutomation;
  }

  private calculatePerformanceSeverity(performance: {
    cpuUsage: number;
    memoryUsage: number;
    executionTime: number;
    errorRate: number;
  }): 'low' | 'medium' | 'high' | 'critical' {
    const { cpuUsage, memoryUsage, executionTime, errorRate } = performance;
    const { performanceThreshold } = this.alertConfig;

    if (cpuUsage >= performanceThreshold.cpuUsage * 1.5 ||
        memoryUsage >= performanceThreshold.memoryUsage * 1.5 ||
        executionTime >= performanceThreshold.executionTime * 2 ||
        errorRate >= performanceThreshold.errorRate * 2) {
      return 'critical';
    }

    if (cpuUsage >= performanceThreshold.cpuUsage ||
        memoryUsage >= performanceThreshold.memoryUsage ||
        executionTime >= performanceThreshold.executionTime ||
        errorRate >= performanceThreshold.errorRate) {
      return 'high';
    }

    if (cpuUsage >= performanceThreshold.cpuUsage * 0.8 ||
        memoryUsage >= performanceThreshold.memoryUsage * 0.8 ||
        executionTime >= performanceThreshold.executionTime * 0.8 ||
        errorRate >= performanceThreshold.errorRate * 0.8) {
      return 'medium';
    }

    return 'low';
  }

  private generateTags(
    type: AutomationAlert['type'],
    severity: AutomationAlert['severity'],
    details: Record<string, any>
  ): string[] {
    const tags = [type, severity];
    
    if (details.exchangeName) tags.push(details.exchangeName);
    if (details.automationType) tags.push(details.automationType);
    if (details.planType) tags.push(details.planType);
    
    return tags;
  }

  private async sendNotification(alert: AutomationAlert): Promise<void> {
    try {
      // TODO: Implementar envio de notificações
      // - Email
      // - WebSocket
      // - Push notifications
      console.log(`📧 AUTOMATION ALERT SERVICE - Notification sent for alert ${alert.id}`);
    } catch (error) {
      console.error('❌ AUTOMATION ALERT SERVICE - Error sending notification:', error);
    }
  }

  // ===== MÉTODOS PÚBLICOS =====

  public async clearAlerts(userId?: string, automationId?: string): Promise<void> {
    try {
      if (userId && automationId) {
        // Limpar alertas específicos
        const keysToDelete = Array.from(this.alerts.keys()).filter(key => {
          const alert = this.alerts.get(key);
          return alert && alert.userId === userId && alert.automationId === automationId;
        });
        
        keysToDelete.forEach(key => this.alerts.delete(key));
        console.log(`🧹 AUTOMATION ALERT SERVICE - Cleared ${keysToDelete.length} alerts for user ${userId}, automation ${automationId}`);
      } else if (userId) {
        // Limpar alertas do usuário
        const keysToDelete = Array.from(this.alerts.keys()).filter(key => {
          const alert = this.alerts.get(key);
          return alert && alert.userId === userId;
        });
        
        keysToDelete.forEach(key => this.alerts.delete(key));
        console.log(`🧹 AUTOMATION ALERT SERVICE - Cleared ${keysToDelete.length} alerts for user ${userId}`);
      } else {
        // Limpar todos os alertas
        this.alerts.clear();
        this.cooldowns.clear();
        console.log('🧹 AUTOMATION ALERT SERVICE - Cleared all alerts');
      }
    } catch (error) {
      console.error('❌ AUTOMATION ALERT SERVICE - Error clearing alerts:', error);
    }
  }

  public getAlertsCount(): number {
    return this.alerts.size;
  }

  public getUnresolvedAlertsCount(): number {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved).length;
  }
}
