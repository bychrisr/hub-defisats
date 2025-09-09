"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetService = void 0;
const ioredis_1 = require("ioredis");
const env_1 = require("@/config/env");
const email_service_1 = require("./email.service");
const hibp_service_1 = require("./hibp.service");
const password_validator_1 = require("@/utils/password.validator");
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
class PasswordResetService {
    prisma;
    redis;
    emailService;
    hibpService;
    constructor(prisma) {
        this.prisma = prisma;
        this.redis = new ioredis_1.Redis(env_1.config.redis.url);
        this.emailService = new email_service_1.EmailService();
        this.hibpService = new hibp_service_1.HIBPService();
    }
    async requestPasswordReset(email, ipAddress) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { email },
            });
            const message = 'If the email exists, we have sent a password reset link.';
            if (!user) {
                await this.logPasswordResetAttempt(email, ipAddress, false);
                return { success: true, message };
            }
            const rateLimitKey = `password_reset:${ipAddress || 'unknown'}`;
            const attempts = await this.redis.get(rateLimitKey);
            if (attempts && parseInt(attempts) >= 3) {
                await this.logPasswordResetAttempt(email, ipAddress, false, 'Rate limit exceeded');
                return { success: true, message };
            }
            const token = crypto_1.default.randomBytes(32).toString('hex');
            await this.redis.setex(`password_reset:${token}`, 900, JSON.stringify({
                userId: user.id,
                email: user.email,
                createdAt: new Date().toISOString(),
                ipAddress,
            }));
            await this.emailService.sendPasswordReset(user.email, token);
            await this.redis.incr(rateLimitKey);
            await this.redis.expire(rateLimitKey, 3600);
            await this.logPasswordResetAttempt(email, ipAddress, true);
            return { success: true, message };
        }
        catch (error) {
            console.error('Password reset request error:', error);
            return {
                success: true,
                message: 'If the email exists, we have sent a password reset link.',
            };
        }
    }
    async resetPassword(token, newPassword, ipAddress) {
        try {
            const tokenData = await this.redis.get(`password_reset:${token}`);
            if (!tokenData) {
                return {
                    success: false,
                    message: 'Invalid or expired reset token',
                };
            }
            const resetData = JSON.parse(tokenData);
            const passwordValidation = password_validator_1.PasswordSchema.safeParse(newPassword);
            if (!passwordValidation.success) {
                return {
                    success: false,
                    message: 'Password does not meet requirements',
                };
            }
            const isCompromised = await this.hibpService.isPasswordCompromised(newPassword);
            if (isCompromised) {
                return {
                    success: false,
                    message: 'This password has been found in data breaches. Please choose a different password.',
                };
            }
            const hashedPassword = await bcrypt_1.default.hash(newPassword, 12);
            await this.prisma.user.update({
                where: { id: resetData.userId },
                data: {
                    password_hash: hashedPassword,
                    session_expires_at: null,
                },
            });
            await this.redis.del(`password_reset:${token}`);
            await this.logPasswordReset(resetData.userId, ipAddress, true);
            return {
                success: true,
                message: 'Password has been reset successfully',
            };
        }
        catch (error) {
            console.error('Password reset error:', error);
            return {
                success: false,
                message: 'An error occurred while resetting your password',
            };
        }
    }
    async validateResetToken(token) {
        try {
            const tokenData = await this.redis.get(`password_reset:${token}`);
            if (!tokenData) {
                return {
                    valid: false,
                    message: 'Invalid or expired reset token',
                };
            }
            const resetData = JSON.parse(tokenData);
            return {
                valid: true,
                email: resetData.email,
            };
        }
        catch (error) {
            console.error('Token validation error:', error);
            return {
                valid: false,
                message: 'Invalid token',
            };
        }
    }
    async logPasswordResetAttempt(email, ipAddress, success = false, reason) {
        try {
            const logData = {
                email,
                ipAddress,
                success,
                reason,
                timestamp: new Date().toISOString(),
            };
            await this.redis.lpush('password_reset_logs', JSON.stringify(logData));
            await this.redis.ltrim('password_reset_logs', 0, 999);
            console.log('Password reset attempt:', logData);
        }
        catch (error) {
            console.error('Log password reset attempt error:', error);
        }
    }
    async logPasswordReset(userId, ipAddress, success = true) {
        try {
            const logData = {
                userId,
                ipAddress,
                success,
                timestamp: new Date().toISOString(),
            };
            await this.redis.lpush('password_reset_completions', JSON.stringify(logData));
            await this.redis.ltrim('password_reset_completions', 0, 999);
            console.log('Password reset completion:', logData);
        }
        catch (error) {
            console.error('Log password reset completion error:', error);
        }
    }
    async getPasswordResetLogs(limit = 100) {
        try {
            const logs = await this.redis.lrange('password_reset_logs', 0, limit - 1);
            return logs.map(log => JSON.parse(log));
        }
        catch (error) {
            console.error('Get password reset logs error:', error);
            return [];
        }
    }
}
exports.PasswordResetService = PasswordResetService;
//# sourceMappingURL=password-reset.service.js.map