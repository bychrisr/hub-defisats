"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CSRFMiddleware = void 0;
const ioredis_1 = require("ioredis");
const env_1 = require("@/config/env");
const crypto_1 = __importDefault(require("crypto"));
class CSRFMiddleware {
    redis;
    constructor() {
        this.redis = new ioredis_1.Redis(env_1.config.redis.url);
    }
    async generateCSRFToken(userId) {
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const key = `csrf:${userId}:${token}`;
        await this.redis.setex(key, 3600, '1');
        return token;
    }
    async validateCSRFToken(userId, token) {
        if (!token) {
            return false;
        }
        const key = `csrf:${userId}:${token}`;
        const exists = await this.redis.get(key);
        return exists === '1';
    }
    async csrfProtection(request, reply) {
        if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
            return;
        }
        if (request.url.startsWith('/api/') && request.headers.authorization) {
            return;
        }
        const user = request.user;
        if (!user) {
            return;
        }
        const csrfToken = request.headers['x-csrf-token'] ||
            request.body?.csrf_token;
        if (!csrfToken) {
            return reply.status(403).send({
                error: 'CSRF_TOKEN_MISSING',
                message: 'CSRF token is required',
            });
        }
        const isValid = await this.validateCSRFToken(user.id, csrfToken);
        if (!isValid) {
            return reply.status(403).send({
                error: 'CSRF_TOKEN_INVALID',
                message: 'Invalid CSRF token',
            });
        }
        const key = `csrf:${user.id}:${csrfToken}`;
        await this.redis.del(key);
    }
    async getCSRFToken(request, _reply) {
        const user = request.user;
        if (!user) {
            throw new Error('User not authenticated');
        }
        const token = await this.generateCSRFToken(user.id);
        return token;
    }
}
exports.CSRFMiddleware = CSRFMiddleware;
//# sourceMappingURL=csrf.middleware.js.map