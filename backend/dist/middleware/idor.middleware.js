"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserResourceAccess = validateUserResourceAccess;
exports.requireUserResourceAccess = requireUserResourceAccess;
exports.validateAutomationAccess = validateAutomationAccess;
exports.requireAutomationAccess = requireAutomationAccess;
exports.validateTradeLogAccess = validateTradeLogAccess;
exports.requireTradeLogAccess = requireTradeLogAccess;
exports.requireResourceAccess = requireResourceAccess;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function validateUserResourceAccess(request, reply, resourceUserId) {
    try {
        const user = request.user;
        if (!user) {
            return reply.status(401).send({
                error: 'UNAUTHORIZED',
                message: 'User not authenticated',
            });
        }
        if (user.id === resourceUserId) {
            return true;
        }
        const adminUser = await prisma.adminUser.findUnique({
            where: { user_id: user.id },
        });
        if (adminUser) {
            return true;
        }
        return reply.status(403).send({
            error: 'FORBIDDEN',
            message: 'Access denied to this resource',
        });
    }
    catch (error) {
        console.error('IDOR validation error:', error);
        return reply.status(500).send({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to validate resource access',
        });
    }
}
function requireUserResourceAccess(resourceUserIdParam = 'userId') {
    return async (request, reply) => {
        const resourceUserId = request.params[resourceUserIdParam];
        if (!resourceUserId) {
            return reply.status(400).send({
                error: 'BAD_REQUEST',
                message: 'Resource user ID is required',
            });
        }
        const hasAccess = await validateUserResourceAccess(request, reply, resourceUserId);
        if (!hasAccess) {
            return;
        }
    };
}
async function validateAutomationAccess(request, reply, automationId) {
    try {
        const user = request.user;
        if (!user) {
            return reply.status(401).send({
                error: 'UNAUTHORIZED',
                message: 'User not authenticated',
            });
        }
        const automation = await prisma.automation.findUnique({
            where: { id: automationId },
            select: { user_id: true },
        });
        if (!automation) {
            return reply.status(404).send({
                error: 'NOT_FOUND',
                message: 'Automation not found',
            });
        }
        if (automation.user_id === user.id) {
            return true;
        }
        const adminUser = await prisma.adminUser.findUnique({
            where: { user_id: user.id },
        });
        if (adminUser) {
            return true;
        }
        return reply.status(403).send({
            error: 'FORBIDDEN',
            message: 'Access denied to this automation',
        });
    }
    catch (error) {
        console.error('Automation IDOR validation error:', error);
        return reply.status(500).send({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to validate automation access',
        });
    }
}
function requireAutomationAccess(automationIdParam = 'automationId') {
    return async (request, reply) => {
        const automationId = request.params[automationIdParam];
        if (!automationId) {
            return reply.status(400).send({
                error: 'BAD_REQUEST',
                message: 'Automation ID is required',
            });
        }
        const hasAccess = await validateAutomationAccess(request, reply, automationId);
        if (!hasAccess) {
            return;
        }
    };
}
async function validateTradeLogAccess(request, reply, tradeLogId) {
    try {
        const user = request.user;
        if (!user) {
            return reply.status(401).send({
                error: 'UNAUTHORIZED',
                message: 'User not authenticated',
            });
        }
        const tradeLog = await prisma.tradeLog.findUnique({
            where: { id: tradeLogId },
            select: { user_id: true },
        });
        if (!tradeLog) {
            return reply.status(404).send({
                error: 'NOT_FOUND',
                message: 'Trade log not found',
            });
        }
        if (tradeLog.user_id === user.id) {
            return true;
        }
        const adminUser = await prisma.adminUser.findUnique({
            where: { user_id: user.id },
        });
        if (adminUser) {
            return true;
        }
        return reply.status(403).send({
            error: 'FORBIDDEN',
            message: 'Access denied to this trade log',
        });
    }
    catch (error) {
        console.error('Trade log IDOR validation error:', error);
        return reply.status(500).send({
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to validate trade log access',
        });
    }
}
function requireTradeLogAccess(tradeLogIdParam = 'tradeLogId') {
    return async (request, reply) => {
        const tradeLogId = request.params[tradeLogIdParam];
        if (!tradeLogId) {
            return reply.status(400).send({
                error: 'BAD_REQUEST',
                message: 'Trade log ID is required',
            });
        }
        const hasAccess = await validateTradeLogAccess(request, reply, tradeLogId);
        if (!hasAccess) {
            return;
        }
    };
}
function requireResourceAccess(resourceIdParam, tableName, userIdField = 'user_id') {
    return async (request, reply) => {
        try {
            const user = request.user;
            if (!user) {
                return reply.status(401).send({
                    error: 'UNAUTHORIZED',
                    message: 'User not authenticated',
                });
            }
            const resourceId = request.params[resourceIdParam];
            if (!resourceId) {
                return reply.status(400).send({
                    error: 'BAD_REQUEST',
                    message: 'Resource ID is required',
                });
            }
            const adminUser = await prisma.adminUser.findUnique({
                where: { user_id: user.id },
            });
            if (adminUser) {
                return;
            }
            const resource = await prisma[tableName].findUnique({
                where: { id: resourceId },
                select: { [userIdField]: true },
            });
            if (!resource) {
                return reply.status(404).send({
                    error: 'NOT_FOUND',
                    message: 'Resource not found',
                });
            }
            if (resource[userIdField] === user.id) {
                return;
            }
            return reply.status(403).send({
                error: 'FORBIDDEN',
                message: 'Access denied to this resource',
            });
        }
        catch (error) {
            console.error('Generic IDOR validation error:', error);
            return reply.status(500).send({
                error: 'INTERNAL_SERVER_ERROR',
                message: 'Failed to validate resource access',
            });
        }
    };
}
//# sourceMappingURL=idor.middleware.js.map