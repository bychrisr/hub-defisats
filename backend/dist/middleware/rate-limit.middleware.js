"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitMiddleware = void 0;
const ioredis_1 = require("ioredis");
const env_1 = require("@/config/env");
class RateLimitMiddleware {
    redis;
    constructor() {
        this.redis = new ioredis_1.Redis(env_1.config.redis.url);
    }
    async loginRateLimit(request, reply) {
        const ip = this.getClientIP(request);
        const key = `login_attempts:${ip}`;
        try {
            const attempts = await this.redis.get(key);
            const count = attempts ? parseInt(attempts, 10) : 0;
            if (count >= 5) {
                return reply.status(429).send({
                    error: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many login attempts. Please try again in 15 minutes.',
                    retryAfter: 900,
                });
            }
            await this.redis.incr(key);
            await this.redis.expire(key, 900);
            if (count >= 2) {
                reply.header('X-Captcha-Required', 'true');
            }
        }
        catch (error) {
            console.error('Rate limit error:', error);
        }
    }
    async registrationRateLimit(request, reply) {
        const ip = this.getClientIP(request);
        const key = `registration_attempts:${ip}`;
        try {
            const attempts = await this.redis.get(key);
            const count = attempts ? parseInt(attempts, 10) : 0;
            if (count >= 3) {
                return reply.status(429).send({
                    error: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many registration attempts. Please try again in 1 hour.',
                    retryAfter: 3600,
                });
            }
            await this.redis.incr(key);
            await this.redis.expire(key, 3600);
        }
        catch (error) {
            console.error('Rate limit error:', error);
        }
    }
    async passwordResetRateLimit(request, reply) {
        const ip = this.getClientIP(request);
        const key = `password_reset_attempts:${ip}`;
        try {
            const attempts = await this.redis.get(key);
            const count = attempts ? parseInt(attempts, 10) : 0;
            if (count >= 3) {
                return reply.status(429).send({
                    error: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many password reset attempts. Please try again in 1 hour.',
                    retryAfter: 3600,
                });
            }
            await this.redis.incr(key);
            await this.redis.expire(key, 3600);
        }
        catch (error) {
            console.error('Rate limit error:', error);
        }
    }
    async userRateLimit(request, reply, action, maxAttempts = 10, windowMs = 3600000) {
        const user = request.user;
        if (!user) {
            return true;
        }
        const key = `user_${action}:${user.id}`;
        try {
            const attempts = await this.redis.get(key);
            const count = attempts ? parseInt(attempts, 10) : 0;
            if (count >= maxAttempts) {
                return reply.status(429).send({
                    error: 'RATE_LIMIT_EXCEEDED',
                    message: `Too many ${action} attempts. Please try again later.`,
                    retryAfter: Math.ceil(windowMs / 1000),
                });
            }
            await this.redis.incr(key);
            await this.redis.expire(key, Math.ceil(windowMs / 1000));
            return true;
        }
        catch (error) {
            console.error('User rate limit error:', error);
            return true;
        }
    }
    async apiRateLimit(request, reply) {
        return this.userRateLimit(request, reply, 'api_calls', 100, 60000);
    }
    async automationRateLimit(request, reply) {
        return this.userRateLimit(request, reply, 'automation_actions', 20, 3600000);
    }
    async tradeRateLimit(request, reply) {
        return this.userRateLimit(request, reply, 'trade_operations', 50, 3600000);
    }
    async clearLoginRateLimit(request) {
        const ip = this.getClientIP(request);
        const key = `login_attempts:${ip}`;
        try {
            await this.redis.del(key);
        }
        catch (error) {
            console.error('Clear rate limit error:', error);
        }
    }
    async clearUserRateLimit(userId, action) {
        const key = `user_${action}:${userId}`;
        try {
            await this.redis.del(key);
        }
        catch (error) {
            console.error('Clear user rate limit error:', error);
        }
    }
    getClientIP(request) {
        const forwarded = request.headers['x-forwarded-for'];
        const realIP = request.headers['x-real-ip'];
        if (forwarded) {
            return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
        }
        if (realIP) {
            return Array.isArray(realIP) ? realIP[0] : realIP;
        }
        return request.ip || 'unknown';
    }
}
exports.RateLimitMiddleware = RateLimitMiddleware;
//# sourceMappingURL=rate-limit.middleware.js.map