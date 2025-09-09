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
export declare function validateUserResourceAccess(request: FastifyRequest, reply: FastifyReply, resourceUserId: string): Promise<boolean>;
export declare function requireUserResourceAccess(resourceUserIdParam?: string): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare function validateAutomationAccess(request: FastifyRequest, reply: FastifyReply, automationId: string): Promise<boolean>;
export declare function requireAutomationAccess(automationIdParam?: string): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare function validateTradeLogAccess(request: FastifyRequest, reply: FastifyReply, tradeLogId: string): Promise<boolean>;
export declare function requireTradeLogAccess(tradeLogIdParam?: string): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
export declare function requireResourceAccess(resourceIdParam: string, tableName: string, userIdField?: string): (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
//# sourceMappingURL=idor.middleware.d.ts.map