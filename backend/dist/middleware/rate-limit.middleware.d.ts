import { FastifyRequest, FastifyReply } from 'fastify';
export declare class RateLimitMiddleware {
    private redis;
    constructor();
    loginRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    registrationRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    passwordResetRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    userRateLimit(request: FastifyRequest, reply: FastifyReply, action: string, maxAttempts?: number, windowMs?: number): Promise<boolean>;
    apiRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<boolean>;
    automationRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<boolean>;
    tradeRateLimit(request: FastifyRequest, reply: FastifyReply): Promise<boolean>;
    clearLoginRateLimit(request: FastifyRequest): Promise<void>;
    clearUserRateLimit(userId: string, action: string): Promise<void>;
    private getClientIP;
}
//# sourceMappingURL=rate-limit.middleware.d.ts.map