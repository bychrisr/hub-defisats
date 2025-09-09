"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuthMiddleware = optionalAuthMiddleware;
exports.adminAuthMiddleware = adminAuthMiddleware;
exports.superAdminAuthMiddleware = superAdminAuthMiddleware;
exports.planAuthMiddleware = planAuthMiddleware;
const auth_service_1 = require("@/services/auth.service");
const client_1 = require("@prisma/client");
async function authMiddleware(request, reply) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.status(401).send({
                error: 'UNAUTHORIZED',
                message: 'Authorization header with Bearer token is required',
            });
        }
        const token = authHeader.substring(7);
        const prisma = new client_1.PrismaClient();
        const authService = new auth_service_1.AuthService(prisma, fastify);
        const user = await authService.validateSession(token);
        request.user = user;
        await prisma.$disconnect();
    }
    catch (error) {
        return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: error instanceof Error ? error.message : 'Invalid token',
        });
    }
}
async function optionalAuthMiddleware(request, _reply) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return;
        }
        const token = authHeader.substring(7);
        const prisma = new client_1.PrismaClient();
        const authService = new auth_service_1.AuthService(prisma, fastify);
        const user = await authService.validateSession(token);
        request.user = user;
        await prisma.$disconnect();
    }
    catch (error) {
        return;
    }
}
async function adminAuthMiddleware(request, reply) {
    try {
        await authMiddleware(request, reply);
        const user = request.user;
        if (!user) {
            return reply.status(401).send({
                error: 'UNAUTHORIZED',
                message: 'User not authenticated',
            });
        }
        const prisma = new client_1.PrismaClient();
        const adminUser = await prisma.adminUser.findUnique({
            where: { user_id: user.id },
        });
        await prisma.$disconnect();
        if (!adminUser) {
            return reply.status(403).send({
                error: 'FORBIDDEN',
                message: 'Admin access required',
            });
        }
        request.user = { ...user, adminRole: adminUser.role };
    }
    catch (error) {
        return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: error instanceof Error ? error.message : 'Authentication failed',
        });
    }
}
async function superAdminAuthMiddleware(request, reply) {
    try {
        await authMiddleware(request, reply);
        const user = request.user;
        if (!user) {
            return reply.status(401).send({
                error: 'UNAUTHORIZED',
                message: 'User not authenticated',
            });
        }
        const prisma = new client_1.PrismaClient();
        const adminUser = await prisma.adminUser.findUnique({
            where: { user_id: user.id },
        });
        await prisma.$disconnect();
        if (!adminUser || adminUser.role !== 'superadmin') {
            return reply.status(403).send({
                error: 'FORBIDDEN',
                message: 'Superadmin access required',
            });
        }
        request.user = { ...user, adminRole: adminUser.role };
    }
    catch (error) {
        return reply.status(401).send({
            error: 'UNAUTHORIZED',
            message: error instanceof Error ? error.message : 'Authentication failed',
        });
    }
}
async function planAuthMiddleware(requiredPlan) {
    return async (request, reply) => {
        try {
            await authMiddleware(request, reply);
            const user = request.user;
            if (!user) {
                return reply.status(401).send({
                    error: 'UNAUTHORIZED',
                    message: 'User not authenticated',
                });
            }
            const planHierarchy = {
                free: 0,
                basic: 1,
                advanced: 2,
                pro: 3,
            };
            const userPlanLevel = planHierarchy[user.plan_type] || 0;
            const requiredPlanLevel = planHierarchy[requiredPlan] || 0;
            if (userPlanLevel < requiredPlanLevel) {
                return reply.status(403).send({
                    error: 'PLAN_LIMIT_EXCEEDED',
                    message: `${requiredPlan} plan or higher is required`,
                    current_plan: user.plan_type,
                    required_plan: requiredPlan,
                });
            }
        }
        catch (error) {
            return reply.status(401).send({
                error: 'UNAUTHORIZED',
                message: error instanceof Error ? error.message : 'Authentication failed',
            });
        }
    };
}
//# sourceMappingURL=auth.middleware.js.map