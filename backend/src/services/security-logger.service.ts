import { Redis } from 'ioredis';
import { config } from '@/config/env';

export interface SecurityEvent {
  type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'PASSWORD_CHANGE' | 
        'PASSWORD_RESET' | 'ACCOUNT_LOCKED' | 'SUSPICIOUS_ACTIVITY' | 
        'ADMIN_ACTION' | 'RATE_LIMIT_EXCEEDED' | 'CSRF_VIOLATION';
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: any;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export class SecurityLoggerService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(config.redis.url);
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const logEntry = {
        ...event,
        id: this.generateLogId(),
        timestamp: new Date().toISOString(),
      };

      // Store in Redis
      await this.redis.lpush('security_logs', JSON.stringify(logEntry));
      await this.redis.ltrim('security_logs', 0, 9999); // Keep last 10000 logs

      // Also log to console for development
      if (config.isDevelopment) {
        console.log('Security Event:', logEntry);
      }

      // Send alerts for critical events
      if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
        await this.sendSecurityAlert(logEntry);
      }
    } catch (error) {
      console.error('Security logging error:', error);
    }
  }

  /**
   * Log login attempt
   */
  async logLoginAttempt(
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
    await this.logSecurityEvent({
      type: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
      email,
      ipAddress,
      userAgent,
      details,
      timestamp: new Date().toISOString(),
      severity: success ? 'LOW' : 'MEDIUM',
    });
  }

  /**
   * Log logout
   */
  async logLogout(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'LOGOUT',
      userId,
      email,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
      severity: 'LOW',
    });
  }

  /**
   * Log password change
   */
  async logPasswordChange(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'PASSWORD_CHANGE',
      userId,
      email,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
    });
  }

  /**
   * Log password reset
   */
  async logPasswordReset(
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'PASSWORD_RESET',
      email,
      ipAddress,
      userAgent,
      details: { success },
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
    });
  }

  /**
   * Log suspicious activity
   */
  async logSuspiciousActivity(
    type: string,
    userId?: string,
    email?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      userId,
      email,
      ipAddress,
      userAgent,
      details: { activityType: type, ...details },
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
    });
  }

  /**
   * Log admin action
   */
  async logAdminAction(
    adminUserId: string,
    action: string,
    targetUserId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'ADMIN_ACTION',
      userId: adminUserId,
      ipAddress,
      userAgent,
      details: { action, targetUserId, ...details },
      timestamp: new Date().toISOString(),
      severity: 'MEDIUM',
    });
  }

  /**
   * Log rate limit exceeded
   */
  async logRateLimitExceeded(
    ipAddress: string,
    endpoint: string,
    userAgent?: string
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      ipAddress,
      userAgent,
      details: { endpoint },
      timestamp: new Date().toISOString(),
      severity: 'MEDIUM',
    });
  }

  /**
   * Log CSRF violation
   */
  async logCSRFViolation(
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
    await this.logSecurityEvent({
      type: 'CSRF_VIOLATION',
      userId,
      ipAddress,
      userAgent,
      details,
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
    });
  }

  /**
   * Get security logs
   */
  async getSecurityLogs(
    limit: number = 100,
    type?: string,
    severity?: string
  ): Promise<SecurityEvent[]> {
    try {
      const logs = await this.redis.lrange('security_logs', 0, limit - 1);
      let parsedLogs = logs.map(log => JSON.parse(log));

      // Filter by type if specified
      if (type) {
        parsedLogs = parsedLogs.filter(log => log.type === type);
      }

      // Filter by severity if specified
      if (severity) {
        parsedLogs = parsedLogs.filter(log => log.severity === severity);
      }

      return parsedLogs;
    } catch (error) {
      console.error('Get security logs error:', error);
      return [];
    }
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    recentEvents: SecurityEvent[];
  }> {
    try {
      const logs = await this.redis.lrange('security_logs', 0, 999);
      const parsedLogs = logs.map(log => JSON.parse(log));

      const eventsByType: Record<string, number> = {};
      const eventsBySeverity: Record<string, number> = {};

      parsedLogs.forEach(log => {
        eventsByType[log.type] = (eventsByType[log.type] || 0) + 1;
        eventsBySeverity[log.severity] = (eventsBySeverity[log.severity] || 0) + 1;
      });

      return {
        totalEvents: parsedLogs.length,
        eventsByType,
        eventsBySeverity,
        recentEvents: parsedLogs.slice(0, 10),
      };
    } catch (error) {
      console.error('Get security stats error:', error);
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        recentEvents: [],
      };
    }
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send security alert
   */
  private async sendSecurityAlert(logEntry: any): Promise<void> {
    // This would integrate with your notification system
    // For now, just log to console
    console.error('SECURITY ALERT:', logEntry);
    
    // TODO: Send email/SMS/Slack notification
    // await this.notificationService.sendSecurityAlert(logEntry);
  }
}
