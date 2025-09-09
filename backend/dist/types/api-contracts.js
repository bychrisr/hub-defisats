"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationErrorResponseSchema = exports.ValidationErrorSchema = exports.ErrorResponseSchema = exports.NotificationSentEventSchema = exports.AutomationExecutedEventSchema = exports.MarginUpdateEventSchema = exports.WebSocketAuthSchema = exports.CouponListResponseSchema = exports.CouponResponseSchema = exports.CreateCouponRequestSchema = exports.AdminUsersResponseSchema = exports.AdminUsersQuerySchema = exports.AdminDashboardResponseSchema = exports.AdminPaymentSchema = exports.AdminUserSchema = exports.AdminKPISchema = exports.PaymentStatusResponseSchema = exports.PaymentResponseSchema = exports.CreatePaymentRequestSchema = exports.NotificationListResponseSchema = exports.NotificationResponseSchema = exports.UpdateNotificationRequestSchema = exports.CreateNotificationRequestSchema = exports.NotificationChannelConfigSchema = exports.BacktestResponseSchema = exports.BacktestResultSchema = exports.CreateBacktestRequestSchema = exports.BacktestConfigSchema = exports.TradeLogQuerySchema = exports.TradeLogListResponseSchema = exports.TradeLogDetailResponseSchema = exports.TradeLogResponseSchema = exports.AutomationListResponseSchema = exports.AutomationResponseSchema = exports.UpdateAutomationRequestSchema = exports.CreateAutomationRequestSchema = exports.AutomationConfigSchema = exports.UpdateUserRequestSchema = exports.UserResponseSchema = exports.RefreshTokenResponseSchema = exports.AuthResponseSchema = exports.RefreshTokenRequestSchema = exports.LoginRequestSchema = exports.RegisterRequestSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.RegisterRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    username: zod_1.z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be at most 20 characters'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    ln_markets_api_key: zod_1.z
        .string()
        .min(16, 'LN Markets API key must be at least 16 characters'),
    ln_markets_api_secret: zod_1.z
        .string()
        .min(16, 'LN Markets API secret must be at least 16 characters'),
    ln_markets_passphrase: zod_1.z
        .string()
        .min(8, 'LN Markets passphrase must be at least 8 characters'),
    coupon_code: zod_1.z.string().optional(),
});
exports.LoginRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.RefreshTokenRequestSchema = zod_1.z.object({
    refresh_token: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.AuthResponseSchema = zod_1.z.object({
    user_id: zod_1.z.string().uuid(),
    token: zod_1.z.string(),
    plan_type: zod_1.z.nativeEnum(client_1.PlanType),
});
exports.RefreshTokenResponseSchema = zod_1.z.object({
    token: zod_1.z.string(),
});
exports.UserResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    plan_type: zod_1.z.nativeEnum(client_1.PlanType),
    notifications: zod_1.z.array(zod_1.z.object({
        type: zod_1.z.nativeEnum(client_1.NotificationType),
        is_enabled: zod_1.z.boolean(),
        channel_config: zod_1.z.record(zod_1.z.any()),
    })),
    automations: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        type: zod_1.z.nativeEnum(client_1.AutomationType),
        is_active: zod_1.z.boolean(),
        config: zod_1.z.record(zod_1.z.any()),
    })),
});
exports.UpdateUserRequestSchema = zod_1.z.object({
    ln_markets_api_key: zod_1.z.string().min(16).optional(),
    ln_markets_api_secret: zod_1.z.string().min(16).optional(),
    session_timeout: zod_1.z.number().min(5).max(1440).optional(),
});
exports.AutomationConfigSchema = zod_1.z.object({
    margin_threshold: zod_1.z.number().min(0.1).max(0.99).optional(),
    take_profit: zod_1.z.number().min(0.001).max(1).optional(),
    stop_loss: zod_1.z.number().min(0.001).max(1).optional(),
    entry_conditions: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.CreateAutomationRequestSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(client_1.AutomationType),
    config: exports.AutomationConfigSchema,
});
exports.UpdateAutomationRequestSchema = zod_1.z.object({
    config: exports.AutomationConfigSchema.optional(),
    is_active: zod_1.z.boolean().optional(),
});
exports.AutomationResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.nativeEnum(client_1.AutomationType),
    config: zod_1.z.record(zod_1.z.any()),
    is_active: zod_1.z.boolean(),
    created_at: zod_1.z.string().datetime(),
    updated_at: zod_1.z.string().datetime(),
});
exports.AutomationListResponseSchema = zod_1.z.array(exports.AutomationResponseSchema);
exports.TradeLogResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    trade_id: zod_1.z.string(),
    automation_id: zod_1.z.string().uuid().optional(),
    status: zod_1.z.nativeEnum(client_1.TradeStatus),
    error_message: zod_1.z.string().optional(),
    executed_at: zod_1.z.string().datetime(),
    created_at: zod_1.z.string().datetime(),
});
exports.TradeLogDetailResponseSchema = exports.TradeLogResponseSchema.extend({
    raw_response: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.TradeLogListResponseSchema = zod_1.z.array(exports.TradeLogResponseSchema);
exports.TradeLogQuerySchema = zod_1.z.object({
    status: zod_1.z.nativeEnum(client_1.TradeStatus).optional(),
    automation_id: zod_1.z.string().uuid().optional(),
    from: zod_1.z.string().datetime().optional(),
    to: zod_1.z.string().datetime().optional(),
    limit: zod_1.z.number().min(1).max(100).default(50),
    offset: zod_1.z.number().min(0).default(0),
});
exports.BacktestConfigSchema = zod_1.z.object({
    automation_type: zod_1.z.nativeEnum(client_1.AutomationType),
    automation_config: exports.AutomationConfigSchema,
    period: zod_1.z.object({
        from: zod_1.z.string().datetime(),
        to: zod_1.z.string().datetime(),
    }),
});
exports.CreateBacktestRequestSchema = zod_1.z.object({
    config: exports.BacktestConfigSchema,
});
exports.BacktestResultSchema = zod_1.z.object({
    total_trades: zod_1.z.number(),
    successful_trades: zod_1.z.number(),
    failed_trades: zod_1.z.number(),
    total_pnl: zod_1.z.number(),
    max_drawdown: zod_1.z.number(),
    win_rate: zod_1.z.number(),
    trades: zod_1.z.array(zod_1.z.object({
        date: zod_1.z.string().datetime(),
        type: zod_1.z.enum(['buy', 'sell']),
        amount: zod_1.z.number(),
        price: zod_1.z.number(),
        pnl: zod_1.z.number(),
        automation_triggered: zod_1.z.boolean(),
    })),
});
exports.BacktestResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    status: zod_1.z.enum(['pending', 'processing', 'completed', 'failed']),
    config: zod_1.z.record(zod_1.z.any()),
    result: exports.BacktestResultSchema.optional(),
    created_at: zod_1.z.string().datetime(),
    completed_at: zod_1.z.string().datetime().optional(),
});
exports.NotificationChannelConfigSchema = zod_1.z.object({
    telegram_chat_id: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    whatsapp_number: zod_1.z.string().optional(),
});
exports.CreateNotificationRequestSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(client_1.NotificationType),
    channel_config: exports.NotificationChannelConfigSchema,
});
exports.UpdateNotificationRequestSchema = zod_1.z.object({
    is_enabled: zod_1.z.boolean().optional(),
    channel_config: exports.NotificationChannelConfigSchema.optional(),
});
exports.NotificationResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    type: zod_1.z.nativeEnum(client_1.NotificationType),
    is_enabled: zod_1.z.boolean(),
    channel_config: zod_1.z.record(zod_1.z.any()),
    created_at: zod_1.z.string().datetime(),
    updated_at: zod_1.z.string().datetime(),
});
exports.NotificationListResponseSchema = zod_1.z.array(exports.NotificationResponseSchema);
exports.CreatePaymentRequestSchema = zod_1.z.object({
    plan_type: zod_1.z
        .nativeEnum(client_1.PlanType)
        .refine(val => val !== 'free', 'Plan type must be basic, advanced, or pro'),
});
exports.PaymentResponseSchema = zod_1.z.object({
    payment_id: zod_1.z.string().uuid(),
    invoice: zod_1.z.string(),
    amount_sats: zod_1.z.number(),
    expires_at: zod_1.z.string().datetime(),
});
exports.PaymentStatusResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    status: zod_1.z.nativeEnum(client_1.PaymentStatus),
    amount_sats: zod_1.z.number(),
    plan_type: zod_1.z.nativeEnum(client_1.PlanType),
    paid_at: zod_1.z.string().datetime().optional(),
    created_at: zod_1.z.string().datetime(),
});
exports.AdminKPISchema = zod_1.z.object({
    total_users: zod_1.z.number(),
    active_users: zod_1.z.number(),
    total_trades: zod_1.z.number(),
    successful_trades: zod_1.z.number(),
    failed_trades: zod_1.z.number(),
    total_revenue_sats: zod_1.z.number(),
    active_automations: zod_1.z.number(),
});
exports.AdminUserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    plan_type: zod_1.z.nativeEnum(client_1.PlanType),
    is_active: zod_1.z.boolean(),
    created_at: zod_1.z.string().datetime(),
    last_activity: zod_1.z.string().datetime().optional(),
    automations_count: zod_1.z.number(),
    trades_count: zod_1.z.number(),
});
exports.AdminPaymentSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    user_id: zod_1.z.string().uuid(),
    plan_type: zod_1.z.nativeEnum(client_1.PlanType),
    amount_sats: zod_1.z.number(),
    status: zod_1.z.nativeEnum(client_1.PaymentStatus),
    paid_at: zod_1.z.string().datetime().optional(),
});
exports.AdminDashboardResponseSchema = zod_1.z.object({
    kpis: exports.AdminKPISchema,
    recent_users: zod_1.z.array(exports.AdminUserSchema),
    recent_payments: zod_1.z.array(exports.AdminPaymentSchema),
});
exports.AdminUsersQuerySchema = zod_1.z.object({
    plan_type: zod_1.z.nativeEnum(client_1.PlanType).optional(),
    is_active: zod_1.z.boolean().optional(),
    limit: zod_1.z.number().min(1).max(100).default(50),
    offset: zod_1.z.number().min(0).default(0),
});
exports.AdminUsersResponseSchema = zod_1.z.array(exports.AdminUserSchema);
exports.CreateCouponRequestSchema = zod_1.z.object({
    code: zod_1.z
        .string()
        .min(3)
        .max(50)
        .regex(/^[A-Z0-9_-]+$/, 'Code must contain only uppercase letters, numbers, hyphens, and underscores'),
    plan_type: zod_1.z.nativeEnum(client_1.PlanType),
    usage_limit: zod_1.z.number().min(1).max(1000).default(1),
    expires_at: zod_1.z.string().datetime().optional(),
});
exports.CouponResponseSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    code: zod_1.z.string(),
    plan_type: zod_1.z.nativeEnum(client_1.PlanType),
    usage_limit: zod_1.z.number(),
    used_count: zod_1.z.number(),
    expires_at: zod_1.z.string().datetime().optional(),
    created_at: zod_1.z.string().datetime(),
});
exports.CouponListResponseSchema = zod_1.z.array(exports.CouponResponseSchema);
exports.WebSocketAuthSchema = zod_1.z.object({
    token: zod_1.z.string(),
});
exports.MarginUpdateEventSchema = zod_1.z.object({
    user_id: zod_1.z.string().uuid(),
    margin_ratio: zod_1.z.number(),
    margin_level: zod_1.z.enum(['safe', 'warning', 'critical']),
    timestamp: zod_1.z.string().datetime(),
});
exports.AutomationExecutedEventSchema = zod_1.z.object({
    automation_id: zod_1.z.string().uuid(),
    trade_id: zod_1.z.string(),
    status: zod_1.z.nativeEnum(client_1.TradeStatus),
    message: zod_1.z.string(),
    timestamp: zod_1.z.string().datetime(),
});
exports.NotificationSentEventSchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(client_1.NotificationType),
    status: zod_1.z.enum(['sent', 'failed']),
    message: zod_1.z.string(),
    timestamp: zod_1.z.string().datetime(),
});
exports.ErrorResponseSchema = zod_1.z.object({
    error: zod_1.z.string(),
    message: zod_1.z.string(),
    code: zod_1.z.string().optional(),
    details: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.ValidationErrorSchema = zod_1.z.object({
    field: zod_1.z.string(),
    message: zod_1.z.string(),
    value: zod_1.z.union([zod_1.z.string(), zod_1.z.number(), zod_1.z.boolean(), zod_1.z.null()]).optional(),
});
exports.ValidationErrorResponseSchema = exports.ErrorResponseSchema.extend({
    validation_errors: zod_1.z.array(exports.ValidationErrorSchema),
});
//# sourceMappingURL=api-contracts.js.map