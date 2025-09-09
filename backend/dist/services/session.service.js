"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const ioredis_1 = require("ioredis");
const env_1 = require("@/config/env");
const crypto_1 = __importDefault(require("crypto"));
class SessionService {
    prisma;
    redis;
    constructor(prisma) {
        this.prisma = prisma;
        this.redis = new ioredis_1.Redis(env_1.config.redis.url);
    }
    async createSession(userId) {
        const sessionId = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await this.redis.setex(`session:${sessionId}`, 7 * 24 * 60 * 60, JSON.stringify({
            userId,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
        }));
        await this.prisma.user.update({
            where: { id: userId },
            data: { session_expires_at: expiresAt },
        });
        return sessionId;
    }
    async validateSession(sessionId) {
        try {
            const sessionData = await this.redis.get(`session:${sessionId}`);
            if (!sessionData) {
                return null;
            }
            const session = JSON.parse(sessionData);
            const user = await this.prisma.user.findUnique({
                where: { id: session.userId },
            });
            if (!user || !user.is_active) {
                await this.destroySession(sessionId);
                return null;
            }
            await this.redis.setex(`session:${sessionId}`, 7 * 24 * 60 * 60, JSON.stringify({
                ...session,
                lastActivity: new Date().toISOString(),
            }));
            return user;
        }
        catch (error) {
            console.error('Session validation error:', error);
            return null;
        }
    }
    async destroySession(sessionId) {
        try {
            await this.redis.del(`session:${sessionId}`);
        }
        catch (error) {
            console.error('Session destruction error:', error);
        }
    }
    async destroyAllUserSessions(userId) {
        try {
            const keys = await this.redis.keys(`session:*`);
            for (const key of keys) {
                const sessionData = await this.redis.get(key);
                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    if (session.userId === userId) {
                        await this.redis.del(key);
                    }
                }
            }
            await this.prisma.user.update({
                where: { id: userId },
                data: { session_expires_at: null },
            });
        }
        catch (error) {
            console.error('Destroy all sessions error:', error);
        }
    }
    async getUserActiveSessions(userId) {
        try {
            const keys = await this.redis.keys(`session:*`);
            const sessions = [];
            for (const key of keys) {
                const sessionData = await this.redis.get(key);
                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    if (session.userId === userId) {
                        const sessionId = key.replace('session:', '');
                        sessions.push({
                            sessionId,
                            createdAt: session.createdAt,
                            lastActivity: session.lastActivity,
                            ipAddress: session.ipAddress,
                            userAgent: session.userAgent,
                        });
                    }
                }
            }
            return sessions;
        }
        catch (error) {
            console.error('Get user sessions error:', error);
            return [];
        }
    }
    async cleanExpiredSessions() {
        try {
            const keys = await this.redis.keys(`session:*`);
            for (const key of keys) {
                const ttl = await this.redis.ttl(key);
                if (ttl <= 0) {
                    await this.redis.del(key);
                }
            }
        }
        catch (error) {
            console.error('Clean expired sessions error:', error);
        }
    }
    async hasActiveSession(userId) {
        try {
            const keys = await this.redis.keys(`session:*`);
            for (const key of keys) {
                const sessionData = await this.redis.get(key);
                if (sessionData) {
                    const session = JSON.parse(sessionData);
                    if (session.userId === userId) {
                        return true;
                    }
                }
            }
            return false;
        }
        catch (error) {
            console.error('Check active session error:', error);
            return false;
        }
    }
}
exports.SessionService = SessionService;
//# sourceMappingURL=session.service.js.map