import { FastifyRequest, FastifyReply } from 'fastify';
export declare function apiRateLimitMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function automationRateLimitMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function tradeRateLimitMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function loginRateLimitMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function registrationRateLimitMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function passwordResetRateLimitMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void>;
//# sourceMappingURL=user-rate-limit.middleware.d.ts.map