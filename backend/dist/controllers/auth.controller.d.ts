import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
export declare class AuthController {
    private authService;
    constructor(prisma: PrismaClient, fastify: FastifyInstance);
    register(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    login(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    checkUsername(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    refreshToken(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    logout(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    me(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    googleCallback(request: FastifyRequest, reply: FastifyReply): Promise<never>;
    githubCallback(request: FastifyRequest, reply: FastifyReply): Promise<never>;
}
//# sourceMappingURL=auth.controller.d.ts.map