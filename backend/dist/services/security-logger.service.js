"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityLoggerService = void 0;
const ioredis_1 = require("ioredis");
const env_1 = require("@/config/env");
class SecurityLoggerService {
    redis;
    constructor() {
        this.redis = new ioredis_1.Redis(env_1.config.redis.url);
    }
    async logSecurityEvent(event) {
        try {
            const logEntry = {
                ...event,
                id: this.generateLogId(),
                timestamp: new Date().toISOString(),
            };
            await this.redis.lpush('security_logs', JSON.stringify(logEntry));
            await this.redis.ltrim('security_logs', 0, 9999);
            if (env_1.config.isDevelopment) {
                console.log('Security Event:', logEntry);
            }
            if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
                await this.sendSecurityAlert(logEntry);
            }
        }
        catch (error) {
            console.error('Security logging error:', error);
        }
    }
    async logLoginAttempt(email, success, ipAddress, userAgent, details) {
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
    async logLogout(userId, email, ipAddress, userAgent) {
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
    async logPasswordChange(userId, email, ipAddress, userAgent) {
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
    async logPasswordReset(email, success, ipAddress, userAgent) {
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
    async logSuspiciousActivity(type, userId, email, ipAddress, userAgent, details) {
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
    async logAdminAction(adminUserId, action, targetUserId, details, ipAddress, userAgent) {
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
    async logRateLimitExceeded(ipAddress, endpoint, userAgent) {
        await this.logSecurityEvent({
            type: 'RATE_LIMIT_EXCEEDED',
            ipAddress,
            userAgent,
            details: { endpoint },
            timestamp: new Date().toISOString(),
            severity: 'MEDIUM',
        });
    }
    async logCSRFViolation(userId, ipAddress, userAgent, details) {
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
    async getSecurityLogs(limit = 100, type, severity) {
        try {
            const logs = await this.redis.lrange('security_logs', 0, limit - 1);
            let parsedLogs = logs.map(log => JSON.parse(log));
            if (type) {
                parsedLogs = parsedLogs.filter(log => log.type === type);
            }
            if (severity) {
                parsedLogs = parsedLogs.filter(log => log.severity === severity);
            }
            return parsedLogs;
        }
        catch (error) {
            console.error('Get security logs error:', error);
            return [];
        }
    }
    async getSecurityStats() {
        try {
            const logs = await this.redis.lrange('security_logs', 0, 999);
            const parsedLogs = logs.map(log => JSON.parse(log));
            const eventsByType = {};
            const eventsBySeverity = {};
            parsedLogs.forEach(log => {
                eventsByType[log.type] = (eventsByType[log.type] || 0) + 1;
                eventsBySeverity[log.severity] =
                    (eventsBySeverity[log.severity] || 0) + 1;
            });
            return {
                totalEvents: parsedLogs.length,
                eventsByType,
                eventsBySeverity,
                recentEvents: parsedLogs.slice(0, 10),
            };
        }
        catch (error) {
            console.error('Get security stats error:', error);
            return {
                totalEvents: 0,
                eventsByType: {},
                eventsBySeverity: {},
                recentEvents: [],
            };
        }
    }
    generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async sendSecurityAlert(logEntry) {
        console.error('SECURITY ALERT:', logEntry);
    }
}
exports.SecurityLoggerService = SecurityLoggerService;
//# sourceMappingURL=security-logger.service.js.map