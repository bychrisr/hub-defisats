import { FastifyRequest, FastifyReply } from 'fastify';
declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            id: string;
            email: string;
            username: string;
            plan_type: string;
        };
    }
}
export declare function authMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function optionalAuthMiddleware(request: FastifyRequest, _reply: FastifyReply): Promise<void>;
export declare function adminAuthMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function superAdminAuthMiddleware(request: FastifyRequest, reply: FastifyReply): Promise<void>;
export declare function planAuthMiddleware(requiredPlan: string): Promise<(request: FastifyRequest, reply: FastifyReply) => Promise<void>>;
//# sourceMappingURL=auth.middleware.d.ts.map