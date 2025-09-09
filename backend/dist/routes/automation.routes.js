"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.automationRoutes = automationRoutes;
const automation_controller_1 = require("@/controllers/automation.controller");
const auth_middleware_1 = require("@/middleware/auth.middleware");
const idor_middleware_1 = require("@/middleware/idor.middleware");
const user_rate_limit_middleware_1 = require("@/middleware/user-rate-limit.middleware");
async function automationRoutes(fastify, prisma) {
    const automationController = new automation_controller_1.AutomationController(prisma);
    fastify.addHook('preHandler', auth_middleware_1.authMiddleware);
    fastify.post('/automations', {
        preHandler: [user_rate_limit_middleware_1.automationRateLimitMiddleware],
        schema: {
            description: 'Create a new automation',
            tags: ['automations'],
            body: {
                type: 'object',
                required: ['type', 'config'],
                properties: {
                    type: {
                        type: 'string',
                        enum: ['margin_guard', 'tp_sl', 'auto_entry'],
                        description: 'Type of automation to create',
                    },
                    config: {
                        type: 'object',
                        description: 'Configuration object specific to automation type',
                        additionalProperties: true,
                    },
                },
            },
            response: {
                201: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                type: { type: 'string' },
                                config: { type: 'object' },
                                is_active: { type: 'boolean' },
                                created_at: { type: 'string' },
                                updated_at: { type: 'string' },
                            },
                        },
                    },
                },
                400: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' },
                        message: { type: 'string' },
                        details: { type: 'array' },
                    },
                },
            },
        },
    }, automationController.createAutomation.bind(automationController));
    fastify.get('/automations', {
        schema: {
            description: "Get user's automations",
            tags: ['automations'],
            querystring: {
                type: 'object',
                properties: {
                    type: {
                        type: 'string',
                        enum: ['margin_guard', 'tp_sl', 'auto_entry'],
                        description: 'Filter by automation type',
                    },
                    is_active: {
                        type: 'boolean',
                        description: 'Filter by active status',
                    },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'string' },
                                    type: { type: 'string' },
                                    config: { type: 'object' },
                                    is_active: { type: 'boolean' },
                                    created_at: { type: 'string' },
                                    updated_at: { type: 'string' },
                                },
                            },
                        },
                    },
                },
            },
        },
    }, automationController.getUserAutomations.bind(automationController));
    fastify.get('/automations/:id', {
        preHandler: [(0, idor_middleware_1.requireAutomationAccess)('id')],
        schema: {
            description: 'Get specific automation by ID',
            tags: ['automations'],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Automation ID',
                    },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                type: { type: 'string' },
                                config: { type: 'object' },
                                is_active: { type: 'boolean' },
                                created_at: { type: 'string' },
                                updated_at: { type: 'string' },
                            },
                        },
                    },
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, automationController.getAutomation.bind(automationController));
    fastify.put('/automations/:id', {
        preHandler: [
            (0, idor_middleware_1.requireAutomationAccess)('id'),
            user_rate_limit_middleware_1.automationRateLimitMiddleware,
        ],
        schema: {
            description: 'Update automation configuration',
            tags: ['automations'],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Automation ID',
                    },
                },
            },
            body: {
                type: 'object',
                properties: {
                    config: {
                        type: 'object',
                        description: 'Updated configuration object',
                        additionalProperties: true,
                    },
                    is_active: {
                        type: 'boolean',
                        description: 'Active status',
                    },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                type: { type: 'string' },
                                config: { type: 'object' },
                                is_active: { type: 'boolean' },
                                created_at: { type: 'string' },
                                updated_at: { type: 'string' },
                            },
                        },
                    },
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, automationController.updateAutomation.bind(automationController));
    fastify.delete('/automations/:id', {
        preHandler: [(0, idor_middleware_1.requireAutomationAccess)('id')],
        schema: {
            description: 'Delete automation',
            tags: ['automations'],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Automation ID',
                    },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                    },
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, automationController.deleteAutomation.bind(automationController));
    fastify.patch('/automations/:id/toggle', {
        schema: {
            description: 'Toggle automation active status',
            tags: ['automations'],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        format: 'uuid',
                        description: 'Automation ID',
                    },
                },
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                id: { type: 'string' },
                                type: { type: 'string' },
                                config: { type: 'object' },
                                is_active: { type: 'boolean' },
                                created_at: { type: 'string' },
                                updated_at: { type: 'string' },
                            },
                        },
                        message: { type: 'string' },
                    },
                },
                404: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        error: { type: 'string' },
                        message: { type: 'string' },
                    },
                },
            },
        },
    }, automationController.toggleAutomation.bind(automationController));
    fastify.get('/automations/stats', {
        schema: {
            description: 'Get automation statistics for user',
            tags: ['automations'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        data: {
                            type: 'object',
                            properties: {
                                total: { type: 'number' },
                                active: { type: 'number' },
                                inactive: { type: 'number' },
                                byType: {
                                    type: 'object',
                                    properties: {
                                        margin_guard: { type: 'number' },
                                        tp_sl: { type: 'number' },
                                        auto_entry: { type: 'number' },
                                    },
                                },
                                recentActivity: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' },
                                            type: { type: 'string' },
                                            is_active: { type: 'boolean' },
                                            updated_at: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }, automationController.getAutomationStats.bind(automationController));
}
//# sourceMappingURL=automation.routes.js.map