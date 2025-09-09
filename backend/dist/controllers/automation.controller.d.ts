import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
export declare class AutomationController {
    private automationService;
    constructor(prisma: PrismaClient);
    createAutomation(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    getUserAutomations(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    getAutomation(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    updateAutomation(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    deleteAutomation(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    toggleAutomation(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    getAutomationStats(request: FastifyRequest, reply: FastifyReply): Promise<never>;
}
//# sourceMappingURL=automation.controller.d.ts.map