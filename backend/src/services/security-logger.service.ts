import { Logger } from 'winston';
import { Request, Reply } from 'fastify';

export interface SecurityEvent {
  eventType: 'login' | 'logout' | 'register' | 'api_access' | 'suspicious_activity' | 'data_access' | 'admin_action';
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  riskScore: number;
  details: Record<string, any>;
  timestamp: string;
}

export interface SecurityAlert {
  id: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  userId?: string;
  ipAddress: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

export class SecurityLoggerService {
  private logger: Logger;
  private alerts: Map<string, SecurityAlert> = new Map();
  private riskThresholds = {
    low: 0.3,
    medium: 0.6,
    high: 0.8,
    critical: 0.9
  };

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Log a security event
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
        ...event,
      timestamp: new Date().toISOString()
    };

    // Log to security logger
    this.logger.security('Security event detected', securityEvent);

    // Check if event requires alert
    if (securityEvent.riskScore >= this.riskThresholds.medium) {
      this.createSecurityAlert(securityEvent);
    }
  }

  /**
   * Log API access
   */
  logApiAccess(request: Request, reply: Reply, userId?: string): void {
    const event: Omit<SecurityEvent, 'timestamp'> = {
      eventType: 'api_access',
      userId,
      ipAddress: this.getClientIP(request),
      userAgent: request.headers['user-agent'],
      endpoint: request.url,
      method: request.method,
      statusCode: reply.statusCode,
      riskScore: this.calculateApiAccessRiskScore(request, reply),
      details: {
        headers: this.sanitizeHeaders(request.headers),
        query: request.query,
        body: this.sanitizeBody(request.body)
      }
    };

    this.logSecurityEvent(event);
  }

  /**
   * Log login attempt
   */
  logLoginAttempt(email: string, success: boolean, ipAddress: string, userAgent?: string): void {
    const event: Omit<SecurityEvent, 'timestamp'> = {
      eventType: 'login',
      ipAddress,
      userAgent,
      riskScore: success ? 0.1 : 0.7,
      details: {
        email: this.maskEmail(email),
        success,
        attemptTime: new Date().toISOString()
      }
    };

    this.logSecurityEvent(event);
  }

  /**
   * Log registration attempt
   */
  logRegistrationAttempt(email: string, success: boolean, ipAddress: string, userAgent?: string): void {
    const event: Omit<SecurityEvent, 'timestamp'> = {
      eventType: 'register',
      ipAddress,
      userAgent,
      riskScore: success ? 0.2 : 0.6,
      details: {
        email: this.maskEmail(email),
        success,
        attemptTime: new Date().toISOString()
      }
    };

    this.logSecurityEvent(event);
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(
    userId: string,
    activity: string,
    ipAddress: string,
    details: Record<string, any> = {}
  ): void {
    const event: Omit<SecurityEvent, 'timestamp'> = {
      eventType: 'suspicious_activity',
      userId,
      ipAddress,
      riskScore: 0.8,
      details: {
        activity,
        ...details,
        detectedAt: new Date().toISOString()
      }
    };

    this.logSecurityEvent(event);
  }

  /**
   * Log data access
   */
  logDataAccess(
    userId: string,
    dataType: string,
    action: 'read' | 'write' | 'delete',
    ipAddress: string,
    details: Record<string, any> = {}
  ): void {
    const event: Omit<SecurityEvent, 'timestamp'> = {
      eventType: 'data_access',
      userId,
      ipAddress,
      riskScore: action === 'delete' ? 0.7 : 0.3,
      details: {
        dataType,
        action,
        ...details,
        accessedAt: new Date().toISOString()
      }
    };

    this.logSecurityEvent(event);
  }

  /**
   * Log admin action
   */
  logAdminAction(
    adminUserId: string,
    action: string,
    targetUserId?: string,
    ipAddress?: string,
    details: Record<string, any> = {}
  ): void {
    const event: Omit<SecurityEvent, 'timestamp'> = {
      eventType: 'admin_action',
      userId: adminUserId,
      ipAddress: ipAddress || 'unknown',
      riskScore: 0.5,
      details: {
        action,
        targetUserId,
        ...details,
        performedAt: new Date().toISOString()
      }
    };

    this.logSecurityEvent(event);
  }

  /**
   * Create security alert
   */
  private createSecurityAlert(event: SecurityEvent): void {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const severity = this.getSeverityFromRiskScore(event.riskScore);

    const alert: SecurityAlert = {
      id: alertId,
      eventType: event.eventType,
      severity,
      message: this.generateAlertMessage(event),
      userId: event.userId,
      ipAddress: event.ipAddress,
      timestamp: event.timestamp,
      resolved: false
    };

    this.alerts.set(alertId, alert);

    // Log alert
    this.logger.warn('Security alert created', alert);

    // TODO: Send alert to monitoring system
    this.sendAlertNotification(alert);
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): SecurityAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedBy = resolvedBy;

    this.logger.info('Security alert resolved', { alertId, resolvedBy });
    return true;
  }

  /**
   * Calculate risk score for API access
   */
  private calculateApiAccessRiskScore(request: Request, reply: Reply): number {
    let riskScore = 0.1; // Base risk

    // High risk endpoints
    const highRiskEndpoints = ['/api/auth', '/api/admin', '/api/payments'];
    if (highRiskEndpoints.some(endpoint => request.url?.includes(endpoint))) {
      riskScore += 0.3;
    }

    // Failed requests
    if (reply.statusCode >= 400) {
      riskScore += 0.2;
    }

    // Suspicious user agent
    const userAgent = request.headers['user-agent'];
    if (userAgent && this.isSuspiciousUserAgent(userAgent)) {
      riskScore += 0.4;
    }

    // Rate limiting
    const rateLimitRemaining = reply.getHeader('x-ratelimit-remaining');
    if (rateLimitRemaining && parseInt(rateLimitRemaining as string) < 10) {
      riskScore += 0.3;
    }

    return Math.min(riskScore, 1.0);
  }

  /**
   * Check if user agent is suspicious
   */
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * Sanitize headers for logging
   */
  private sanitizeHeaders(headers: any): Record<string, any> {
    const sanitized: Record<string, any> = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request body for logging
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sensitiveFields = ['password', 'apiKey', 'secret', 'token', 'passphrase'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Mask email for privacy
   */
  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;

    const maskedLocal = local.length > 2 
      ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
      : local;

    return `${maskedLocal}@${domain}`;
  }

  /**
   * Get severity from risk score
   */
  private getSeverityFromRiskScore(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= this.riskThresholds.critical) return 'critical';
    if (riskScore >= this.riskThresholds.high) return 'high';
    if (riskScore >= this.riskThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(event: SecurityEvent): string {
    const baseMessage = `Security event detected: ${event.eventType}`;
    
    if (event.userId) {
      return `${baseMessage} for user ${event.userId}`;
    }
    
    return `${baseMessage} from IP ${event.ipAddress}`;
  }

  /**
   * Send alert notification
   */
  private sendAlertNotification(alert: SecurityAlert): void {
    // TODO: Implement notification sending (email, Slack, etc.)
    this.logger.warn('Security alert notification', {
      alertId: alert.id,
      severity: alert.severity,
      message: alert.message,
      userId: alert.userId,
      ipAddress: alert.ipAddress
    });
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalEvents: number;
    activeAlerts: number;
    resolvedAlerts: number;
    eventsByType: Record<string, number>;
    alertsBySeverity: Record<string, number>;
  } {
    const alerts = Array.from(this.alerts.values());
      const eventsByType: Record<string, number> = {};
    const alertsBySeverity: Record<string, number> = {};

    // Count events by type (this would need to be tracked separately in production)
    // For now, we'll use alerts as a proxy
    alerts.forEach(alert => {
      eventsByType[alert.eventType] = (eventsByType[alert.eventType] || 0) + 1;
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
      });

      return {
      totalEvents: alerts.length,
      activeAlerts: alerts.filter(alert => !alert.resolved).length,
      resolvedAlerts: alerts.filter(alert => alert.resolved).length,
        eventsByType,
      alertsBySeverity
    };
  }
}