"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationService = void 0;
const zod_1 = require("zod");
const MarginGuardConfigSchema = zod_1.z.object({
    margin_threshold: zod_1.z.number().min(0.1).max(100),
    action: zod_1.z.enum(['close_position', 'reduce_position', 'add_margin']),
    reduce_percentage: zod_1.z.number().min(1).max(100).optional(),
    add_margin_amount: zod_1.z.number().min(0).optional(),
    enabled: zod_1.z.boolean().default(true),
});
const TPSLConfigSchema = zod_1.z.object({
    take_profit_percentage: zod_1.z.number().min(0.1).max(1000),
    stop_loss_percentage: zod_1.z.number().min(0.1).max(100),
    trailing_stop: zod_1.z.boolean().default(false),
    trailing_percentage: zod_1.z.number().min(0.1).max(10).optional(),
    enabled: zod_1.z.boolean().default(true),
});
const AutoEntryConfigSchema = zod_1.z.object({
    entry_condition: zod_1.z.enum([
        'price_above',
        'price_below',
        'rsi_oversold',
        'rsi_overbought',
    ]),
    entry_price: zod_1.z.number().min(0).optional(),
    rsi_period: zod_1.z.number().min(5).max(50).optional(),
    rsi_threshold: zod_1.z.number().min(10).max(90).optional(),
    position_size: zod_1.z.number().min(0.001).max(1),
    enabled: zod_1.z.boolean().default(true),
});
const AutomationConfigSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({
        type: zod_1.z.literal('margin_guard'),
        config: MarginGuardConfigSchema,
    }),
    zod_1.z.object({ type: zod_1.z.literal('tp_sl'), config: TPSLConfigSchema }),
    zod_1.z.object({ type: zod_1.z.literal('auto_entry'), config: AutoEntryConfigSchema }),
]);
class AutomationService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    validateAutomationConfig(type, config) {
        try {
            const validation = AutomationConfigSchema.parse({ type, config });
            return validation.config;
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                throw new Error(`Invalid configuration for ${type}: ${error.errors.map(e => e.message).join(', ')}`);
            }
            throw error;
        }
    }
    async createAutomation(data) {
        const validatedConfig = this.validateAutomationConfig(data.type, data.config);
        const existingAutomation = await this.prisma.automation.findFirst({
            where: {
                user_id: data.userId,
                type: data.type,
                is_active: true,
            },
        });
        if (existingAutomation) {
            throw new Error(`User already has an active ${data.type} automation`);
        }
        const automation = await this.prisma.automation.create({
            data: {
                user_id: data.userId,
                type: data.type,
                config: validatedConfig,
                is_active: true,
            },
        });
        return automation;
    }
    async getUserAutomations(data) {
        const where = {
            user_id: data.userId,
        };
        if (data.type) {
            where.type = data.type;
        }
        if (data.isActive !== undefined) {
            where.is_active = data.isActive;
        }
        const automations = await this.prisma.automation.findMany({
            where,
            orderBy: {
                created_at: 'desc',
            },
        });
        return automations;
    }
    async getAutomation(data) {
        const automation = await this.prisma.automation.findFirst({
            where: {
                id: data.automationId,
                user_id: data.userId,
            },
        });
        return automation;
    }
    async updateAutomation(data) {
        const existingAutomation = await this.prisma.automation.findFirst({
            where: {
                id: data.automationId,
                user_id: data.userId,
            },
        });
        if (!existingAutomation) {
            return null;
        }
        let validatedConfig = data.updates.config;
        if (data.updates.config) {
            validatedConfig = this.validateAutomationConfig(existingAutomation.type, data.updates.config);
        }
        const automation = await this.prisma.automation.update({
            where: {
                id: data.automationId,
            },
            data: {
                config: validatedConfig || existingAutomation.config,
                is_active: data.updates.is_active !== undefined
                    ? data.updates.is_active
                    : existingAutomation.is_active,
                updated_at: new Date(),
            },
        });
        return automation;
    }
    async deleteAutomation(data) {
        const result = await this.prisma.automation.deleteMany({
            where: {
                id: data.automationId,
                user_id: data.userId,
            },
        });
        return result.count > 0;
    }
    async toggleAutomation(data) {
        const existingAutomation = await this.prisma.automation.findFirst({
            where: {
                id: data.automationId,
                user_id: data.userId,
            },
        });
        if (!existingAutomation) {
            return null;
        }
        const automation = await this.prisma.automation.update({
            where: {
                id: data.automationId,
            },
            data: {
                is_active: !existingAutomation.is_active,
                updated_at: new Date(),
            },
        });
        return automation;
    }
    async getAutomationStats(userId) {
        const [total, active, inactive] = await Promise.all([
            this.prisma.automation.count({
                where: { user_id: userId },
            }),
            this.prisma.automation.count({
                where: { user_id: userId, is_active: true },
            }),
            this.prisma.automation.count({
                where: { user_id: userId, is_active: false },
            }),
        ]);
        const byType = await this.prisma.automation.groupBy({
            by: ['type'],
            where: { user_id: userId },
            _count: {
                type: true,
            },
        });
        const byTypeMap = {
            margin_guard: 0,
            tp_sl: 0,
            auto_entry: 0,
        };
        byType.forEach(item => {
            byTypeMap[item.type] = item._count.type;
        });
        const recentActivity = await this.prisma.automation.findMany({
            where: { user_id: userId },
            orderBy: { updated_at: 'desc' },
            take: 10,
            select: {
                id: true,
                type: true,
                is_active: true,
                updated_at: true,
            },
        });
        return {
            total,
            active,
            inactive,
            byType: byTypeMap,
            recentActivity,
        };
    }
    async getActiveAutomations(userId) {
        const automations = await this.prisma.automation.findMany({
            where: {
                user_id: userId,
                is_active: true,
            },
        });
        return automations;
    }
    async getAllActiveAutomations() {
        const automations = await this.prisma.automation.findMany({
            where: {
                is_active: true,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        ln_markets_api_key: true,
                        ln_markets_api_secret: true,
                    },
                },
            },
        });
        return automations;
    }
    async validateConfig(type, config) {
        try {
            this.validateAutomationConfig(type, config);
            return { valid: true };
        }
        catch (error) {
            if (error instanceof Error) {
                return { valid: false, errors: [error.message] };
            }
            return { valid: false, errors: ['Unknown validation error'] };
        }
    }
}
exports.AutomationService = AutomationService;
//# sourceMappingURL=automation.service.js.map