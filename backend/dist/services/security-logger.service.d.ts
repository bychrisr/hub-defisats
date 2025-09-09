export interface SecurityEvent {
    type: 'LOGIN_SUCCESS' | 'LOGIN_FAILED' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET' | 'ACCOUNT_LOCKED' | 'SUSPICIOUS_ACTIVITY' | 'ADMIN_ACTION' | 'RATE_LIMIT_EXCEEDED' | 'CSRF_VIOLATION';
    userId?: string;
    email?: string;
    ipAddress?: string;
    userAgent?: string;
    details?: any;
    timestamp: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export declare class SecurityLoggerService {
    private redis;
    constructor();
    logSecurityEvent(event: SecurityEvent): Promise<void>;
    logLoginAttempt(email: string, success: boolean, ipAddress?: string, userAgent?: string, details?: any): Promise<void>;
    logLogout(userId: string, email: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logPasswordChange(userId: string, email: string, ipAddress?: string, userAgent?: string): Promise<void>;
    logPasswordReset(email: string, success: boolean, ipAddress?: string, userAgent?: string): Promise<void>;
    logSuspiciousActivity(type: string, userId?: string, email?: string, ipAddress?: string, userAgent?: string, details?: any): Promise<void>;
    logAdminAction(adminUserId: string, action: string, targetUserId?: string, details?: any, ipAddress?: string, userAgent?: string): Promise<void>;
    logRateLimitExceeded(ipAddress: string, endpoint: string, userAgent?: string): Promise<void>;
    logCSRFViolation(userId?: string, ipAddress?: string, userAgent?: string, details?: any): Promise<void>;
    getSecurityLogs(limit?: number, type?: string, severity?: string): Promise<SecurityEvent[]>;
    getSecurityStats(): Promise<{
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsBySeverity: Record<string, number>;
        recentEvents: SecurityEvent[];
    }>;
    private generateLogId;
    private sendSecurityAlert;
}
//# sourceMappingURL=security-logger.service.d.ts.map