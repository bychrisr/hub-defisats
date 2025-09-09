"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationController = void 0;
const zod_1 = require("zod");
const automation_service_1 = require("@/services/automation.service");
const CreateAutomationSchema = zod_1.z.object({
    type: zod_1.z.enum(['margin_guard', 'tp_sl', 'auto_entry']),
    config: zod_1.z.record(zod_1.z.unknown()),
});
const UpdateAutomationSchema = zod_1.z.object({
    config: zod_1.z.record(zod_1.z.unknown()).optional(),
    is_active: zod_1.z.boolean().optional(),
});
const AutomationParamsSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
});
class AutomationController {
    automationService;
    constructor(prisma) {
        this.automationService = new automation_service_1.AutomationService(prisma);
    }
    async createAutomation(request, reply) {
        try {
            const user = request.user;
            const body = CreateAutomationSchema.parse(request.body);
            const automation = await this.automationService.createAutomation({
                userId: user.id,
                type: body.type,
                config: body.config,
            });
            return reply.status(201).send({
                success: true,
                data: automation,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: error.errors,
                });
            }
            console.error('Create automation error:', error);
            return reply.status(500).send({
                success: false,
                error: 'INTERNAL_ERROR',
                message: 'Failed to create automation',
            });
        }
    }
    async getUserAutomations(request, reply) {
        try {
            const user = request.user;
            const { type, is_active } = request.query;
            const automations = await this.automationService.getUserAutomations({
                userId: user.id,
                type,
                isActive: is_active,
            });
            return reply.send({
                success: true,
                data: automations,
            });
        }
        catch (error) {
            console.error('Get user automations error:', error);
            return reply.status(500).send({
                success: false,
                error: 'INTERNAL_ERROR',
                message: 'Failed to get automations',
            });
        }
    }
    async getAutomation(request, reply) {
        try {
            const user = request.user;
            const params = AutomationParamsSchema.parse(request.params);
            const automation = await this.automationService.getAutomation({
                automationId: params.id,
                userId: user.id,
            });
            if (!automation) {
                return reply.status(404).send({
                    success: false,
                    error: 'NOT_FOUND',
                    message: 'Automation not found',
                });
            }
            return reply.send({
                success: true,
                data: automation,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid automation ID',
                });
            }
            console.error('Get automation error:', error);
            return reply.status(500).send({
                success: false,
                error: 'INTERNAL_ERROR',
                message: 'Failed to get automation',
            });
        }
    }
    async updateAutomation(request, reply) {
        try {
            const user = request.user;
            const params = AutomationParamsSchema.parse(request.params);
            const body = UpdateAutomationSchema.parse(request.body);
            const automation = await this.automationService.updateAutomation({
                automationId: params.id,
                userId: user.id,
                updates: body,
            });
            if (!automation) {
                return reply.status(404).send({
                    success: false,
                    error: 'NOT_FOUND',
                    message: 'Automation not found',
                });
            }
            return reply.send({
                success: true,
                data: automation,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid request data',
                    details: error.errors,
                });
            }
            console.error('Update automation error:', error);
            return reply.status(500).send({
                success: false,
                error: 'INTERNAL_ERROR',
                message: 'Failed to update automation',
            });
        }
    }
    async deleteAutomation(request, reply) {
        try {
            const user = request.user;
            const params = AutomationParamsSchema.parse(request.params);
            const deleted = await this.automationService.deleteAutomation({
                automationId: params.id,
                userId: user.id,
            });
            if (!deleted) {
                return reply.status(404).send({
                    success: false,
                    error: 'NOT_FOUND',
                    message: 'Automation not found',
                });
            }
            return reply.send({
                success: true,
                message: 'Automation deleted successfully',
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid automation ID',
                });
            }
            console.error('Delete automation error:', error);
            return reply.status(500).send({
                success: false,
                error: 'INTERNAL_ERROR',
                message: 'Failed to delete automation',
            });
        }
    }
    async toggleAutomation(request, reply) {
        try {
            const user = request.user;
            const params = AutomationParamsSchema.parse(request.params);
            const automation = await this.automationService.toggleAutomation({
                automationId: params.id,
                userId: user.id,
            });
            if (!automation) {
                return reply.status(404).send({
                    success: false,
                    error: 'NOT_FOUND',
                    message: 'Automation not found',
                });
            }
            return reply.send({
                success: true,
                data: automation,
                message: `Automation ${automation.is_active ? 'activated' : 'deactivated'}`,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return reply.status(400).send({
                    success: false,
                    error: 'VALIDATION_ERROR',
                    message: 'Invalid automation ID',
                });
            }
            console.error('Toggle automation error:', error);
            return reply.status(500).send({
                success: false,
                error: 'INTERNAL_ERROR',
                message: 'Failed to toggle automation',
            });
        }
    }
    async getAutomationStats(request, reply) {
        try {
            const user = request.user;
            const stats = await this.automationService.getAutomationStats(user.id);
            return reply.send({
                success: true,
                data: stats,
            });
        }
        catch (error) {
            console.error('Get automation stats error:', error);
            return reply.status(500).send({
                success: false,
                error: 'INTERNAL_ERROR',
                message: 'Failed to get automation statistics',
            });
        }
    }
}
exports.AutomationController = AutomationController;
//# sourceMappingURL=automation.controller.js.map