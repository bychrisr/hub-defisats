import { FastifyRequest, FastifyReply } from 'fastify';
export declare class CSRFMiddleware {
    private redis;
    constructor();
    generateCSRFToken(userId: string): Promise<string>;
    validateCSRFToken(userId: string, token: string): Promise<boolean>;
    csrfProtection(request: FastifyRequest, reply: FastifyReply): Promise<void>;
    getCSRFToken(request: FastifyRequest, _reply: FastifyReply): Promise<string>;
}
//# sourceMappingURL=csrf.middleware.d.ts.map