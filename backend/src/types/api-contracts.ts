import { z } from 'zod';
// import {
//   PlanType,
//   // AutomationType,
//   // TradeStatus,
//   // NotificationType,
//   // PaymentStatus,
//   // SocialProvider,
//   // AdminRole,
//   // AlertSeverity,
// } from '@prisma/client';

// Define PlanType enum since it's not exported from Prisma
export enum PlanType {
  FREE = 'free',
  BASIC = 'basic',
  ADVANCED = 'advanced',
  PRO = 'pro',
  LIFETIME = 'lifetime',
}

// Define enums that are not in Prisma schema
export enum AutomationType {
  MARGIN_GUARD = 'margin_guard',
  TAKE_PROFIT = 'take_profit',
  STOP_LOSS = 'stop_loss',
  DCA = 'dca',
}

export enum TradeStatus {
  PENDING = 'pending',
  EXECUTED = 'executed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum NotificationType {
  EMAIL = 'email',
  TELEGRAM = 'telegram',
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

// Coupon-related enums
export enum CouponValueType {
  FIXED = 'fixed',        // Valor fixo (ex: 1000 sats)
  PERCENTAGE = 'percentage', // Percentual (ex: 10% desconto)
}

export enum CouponTimeType {
  FIXED = 'fixed',        // Tempo fixo (ex: 5 dias)
  LIFETIME = 'lifetime',  // Vitalício
}

// ============================================================================
// AUTH CONTRACTS
// ============================================================================

export const RegisterRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  ln_markets_api_key: z
    .string()
    .min(16, 'LN Markets API key must be at least 16 characters'),
  ln_markets_api_secret: z
    .string()
    .min(16, 'LN Markets API secret must be at least 16 characters'),
  ln_markets_passphrase: z
    .string()
    .min(8, 'LN Markets passphrase must be at least 8 characters'),
  coupon_code: z.string().optional(),
});

export const LoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenRequestSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token is required'),
});

export const AuthResponseSchema = z.object({
  user_id: z.string().uuid(),
  token: z.string(),
  refresh_token: z.string().optional(),
  plan_type: z.nativeEnum(PlanType),
});

export const RefreshTokenResponseSchema = z.object({
  token: z.string(),
});

// ============================================================================
// USER CONTRACTS
// ============================================================================

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  plan_type: z.nativeEnum(PlanType),
  notifications: z.array(
    z.object({
      type: z.nativeEnum(NotificationType),
      is_enabled: z.boolean(),
      channel_config: z.record(z.any()),
    })
  ),
  automations: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.nativeEnum(AutomationType),
      is_active: z.boolean(),
      config: z.record(z.any()),
    })
  ),
});

export const UpdateUserRequestSchema = z.object({
  ln_markets_api_key: z.string().min(16).optional(),
  ln_markets_api_secret: z.string().min(16).optional(),
  session_timeout: z.number().min(5).max(1440).optional(), // 5 minutes to 24 hours
});

// ============================================================================
// AUTOMATION CONTRACTS
// ============================================================================

export const AutomationConfigSchema = z.object({
  margin_threshold: z.number().min(0.1).max(0.99).optional(), // 10% to 99%
  take_profit: z.number().min(0.001).max(1).optional(), // 0.1% to 100%
  stop_loss: z.number().min(0.001).max(1).optional(), // 0.1% to 100%
  entry_conditions: z.record(z.any()).optional(),
});

export const CreateAutomationRequestSchema = z.object({
  type: z.nativeEnum(AutomationType),
  config: AutomationConfigSchema,
});

export const UpdateAutomationRequestSchema = z.object({
  config: AutomationConfigSchema.optional(),
  is_active: z.boolean().optional(),
});

export const AutomationResponseSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(AutomationType),
  config: z.record(z.any()),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const AutomationListResponseSchema = z.array(AutomationResponseSchema);

// ============================================================================
// TRADE LOGS CONTRACTS
// ============================================================================

export const TradeLogResponseSchema = z.object({
  id: z.string().uuid(),
  trade_id: z.string(),
  automation_id: z.string().uuid().optional(),
  status: z.nativeEnum(TradeStatus),
  error_message: z.string().optional(),
  executed_at: z.string().datetime(),
  created_at: z.string().datetime(),
});

export const TradeLogDetailResponseSchema = TradeLogResponseSchema.extend({
  raw_response: z.record(z.any()).optional(),
});

export const TradeLogListResponseSchema = z.array(TradeLogResponseSchema);

export const TradeLogQuerySchema = z.object({
  status: z.nativeEnum(TradeStatus).optional(),
  automation_id: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

// ============================================================================
// BACKTEST CONTRACTS
// ============================================================================

export const BacktestConfigSchema = z.object({
  automation_type: z.nativeEnum(AutomationType),
  automation_config: AutomationConfigSchema,
  period: z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  }),
});

export const CreateBacktestRequestSchema = z.object({
  config: BacktestConfigSchema,
});

export const BacktestResultSchema = z.object({
  total_trades: z.number(),
  successful_trades: z.number(),
  failed_trades: z.number(),
  total_pnl: z.number(),
  max_drawdown: z.number(),
  win_rate: z.number(),
  trades: z.array(
    z.object({
      date: z.string().datetime(),
      type: z.enum(['buy', 'sell']),
      amount: z.number(),
      price: z.number(),
      pnl: z.number(),
      automation_triggered: z.boolean(),
    })
  ),
});

export const BacktestResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  config: z.record(z.any()),
  result: BacktestResultSchema.optional(),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
});

// ============================================================================
// NOTIFICATION CONTRACTS
// ============================================================================

export const NotificationChannelConfigSchema = z.object({
  telegram_chat_id: z.string().optional(),
  email: z.string().email().optional(),
  whatsapp_number: z.string().optional(),
});

export const CreateNotificationRequestSchema = z.object({
  type: z.nativeEnum(NotificationType),
  channel_config: NotificationChannelConfigSchema,
});

export const UpdateNotificationRequestSchema = z.object({
  is_enabled: z.boolean().optional(),
  channel_config: NotificationChannelConfigSchema.optional(),
});

export const NotificationResponseSchema = z.object({
  id: z.string().uuid(),
  type: z.nativeEnum(NotificationType),
  is_enabled: z.boolean(),
  channel_config: z.record(z.any()),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const NotificationListResponseSchema = z.array(
  NotificationResponseSchema
);

// ============================================================================
// PAYMENT CONTRACTS
// ============================================================================

export const CreatePaymentRequestSchema = z.object({
  plan_type: z
    .nativeEnum(PlanType)
    .refine(val => val !== 'free', 'Plan type must be basic, advanced, or pro'),
});

export const PaymentResponseSchema = z.object({
  payment_id: z.string().uuid(),
  invoice: z.string(),
  amount_sats: z.number(),
  expires_at: z.string().datetime(),
});

export const PaymentStatusResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.nativeEnum(PaymentStatus),
  amount_sats: z.number(),
  plan_type: z.nativeEnum(PlanType),
  paid_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
});

// ============================================================================
// ADMIN CONTRACTS
// ============================================================================

export const AdminKPISchema = z.object({
  total_users: z.number(),
  active_users: z.number(),
  total_trades: z.number(),
  successful_trades: z.number(),
  failed_trades: z.number(),
  total_revenue_sats: z.number(),
  active_automations: z.number(),
});

export const AdminUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  plan_type: z.nativeEnum(PlanType),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  last_activity: z.string().datetime().optional(),
  automations_count: z.number(),
  trades_count: z.number(),
});

export const AdminPaymentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  plan_type: z.nativeEnum(PlanType),
  amount_sats: z.number(),
  status: z.nativeEnum(PaymentStatus),
  paid_at: z.string().datetime().optional(),
});

export const AdminDashboardResponseSchema = z.object({
  kpis: AdminKPISchema,
  recent_users: z.array(AdminUserSchema),
  recent_payments: z.array(AdminPaymentSchema),
});

export const AdminUsersQuerySchema = z.object({
  plan_type: z.nativeEnum(PlanType).optional(),
  is_active: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export const AdminUsersResponseSchema = z.array(AdminUserSchema);

export const CreateCouponRequestSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(50)
    .regex(
      /^[A-Z0-9_-]+$/,
      'Code must contain only uppercase letters, numbers, hyphens, and underscores'
    ),
  plan_type: z.nativeEnum(PlanType),
  usage_limit: z.number().min(1).max(1000).default(1),
  expires_at: z.string().datetime().optional(),
  
  // Novos campos para o sistema de cupons
  value_type: z.nativeEnum(CouponValueType),
  value_amount: z.number().min(1).max(1000000), // 1 sats até 1M sats ou 1-100%
  time_type: z.nativeEnum(CouponTimeType),
  time_days: z.number().min(1).max(3650).optional(), // 1 dia até 10 anos (apenas se time_type = 'fixed')
  
  // Campos para administração
  description: z.string().optional(),
  is_active: z.boolean().default(true),
}).refine((data) => {
  // Se time_type é 'fixed', time_days deve ser obrigatório
  if (data.time_type === CouponTimeType.FIXED && !data.time_days) {
    return false;
  }
  // Se time_type é 'lifetime', time_days deve ser undefined
  if (data.time_type === CouponTimeType.LIFETIME && data.time_days) {
    return false;
  }
  // Se value_type é 'percentage', value_amount deve ser entre 1 e 100
  if (data.value_type === CouponValueType.PERCENTAGE && (data.value_amount < 1 || data.value_amount > 100)) {
    return false;
  }
  return true;
}, {
  message: "Invalid coupon configuration: time_days required for fixed time type, value_amount must be 1-100 for percentage type"
});

export const UpdateCouponRequestSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(50)
    .regex(
      /^[A-Z0-9_-]+$/,
      'Code must contain only uppercase letters, numbers, hyphens, and underscores'
    ).optional(),
  plan_type: z.nativeEnum(PlanType).optional(),
  usage_limit: z.number().min(1).max(1000).optional(),
  expires_at: z.string().datetime().optional(),
  
  // Novos campos para o sistema de cupons
  value_type: z.nativeEnum(CouponValueType).optional(),
  value_amount: z.number().min(1).max(1000000).optional(),
  time_type: z.nativeEnum(CouponTimeType).optional(),
  time_days: z.number().min(1).max(3650).optional(),
  
  // Campos para administração
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const CouponToggleActiveRequestSchema = z.object({
  is_active: z.boolean(),
});

export const CouponResponseSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  plan_type: z.nativeEnum(PlanType),
  usage_limit: z.number(),
  used_count: z.number(),
  expires_at: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  
  // Novos campos para o sistema de cupons
  value_type: z.nativeEnum(CouponValueType),
  value_amount: z.number(),
  time_type: z.nativeEnum(CouponTimeType),
  time_days: z.number().optional(),
  
  // Campos para administração
  is_active: z.boolean(),
  description: z.string().optional(),
  created_by: z.string().optional(),
  
  // Métricas
  total_revenue_saved: z.number(),
  new_users_count: z.number(),
  conversion_rate: z.number(),
});

export const CouponAnalyticsSchema = z.object({
  id: z.string().uuid(),
  coupon_id: z.string().uuid(),
  date: z.string().datetime(),
  views_count: z.number(),
  clicks_count: z.number(),
  uses_count: z.number(),
  new_users_count: z.number(),
  revenue_saved: z.number(),
  conversion_rate: z.number(),
  click_through_rate: z.number(),
  created_at: z.string().datetime(),
});

export const CouponDashboardSchema = z.object({
  total_coupons: z.number(),
  active_coupons: z.number(),
  inactive_coupons: z.number(),
  total_uses: z.number(),
  total_revenue_saved: z.number(),
  total_new_users: z.number(),
  average_conversion_rate: z.number(),
  top_coupons: z.array(z.object({
    id: z.string(),
    code: z.string(),
    uses_count: z.number(),
    revenue_saved: z.number(),
    conversion_rate: z.number(),
  })),
  recent_activity: z.array(z.object({
    id: z.string(),
    code: z.string(),
    action: z.string(),
    timestamp: z.string().datetime(),
  })),
  daily_metrics: z.array(z.object({
    date: z.string().datetime(),
    views: z.number(),
    clicks: z.number(),
    uses: z.number(),
    new_users: z.number(),
    revenue_saved: z.number(),
  })),
});

export const CouponListResponseSchema = z.array(CouponResponseSchema);

// ============================================================================
// WEBSOCKET CONTRACTS
// ============================================================================

export const WebSocketAuthSchema = z.object({
  token: z.string(),
});

export const MarginUpdateEventSchema = z.object({
  user_id: z.string().uuid(),
  margin_ratio: z.number(),
  margin_level: z.enum(['safe', 'warning', 'critical']),
  timestamp: z.string().datetime(),
});

export const AutomationExecutedEventSchema = z.object({
  automation_id: z.string().uuid(),
  trade_id: z.string(),
  status: z.nativeEnum(TradeStatus),
  message: z.string(),
  timestamp: z.string().datetime(),
});

export const NotificationSentEventSchema = z.object({
  type: z.nativeEnum(NotificationType),
  status: z.enum(['sent', 'failed']),
  message: z.string(),
  timestamp: z.string().datetime(),
});

// ============================================================================
// ERROR CONTRACTS
// ============================================================================

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
});

export const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).optional(),
});

export const ValidationErrorResponseSchema = ErrorResponseSchema.extend({
  validation_errors: z.array(ValidationErrorSchema),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;

export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;

export type AutomationConfig = z.infer<typeof AutomationConfigSchema>;
export type CreateAutomationRequest = z.infer<
  typeof CreateAutomationRequestSchema
>;
export type UpdateAutomationRequest = z.infer<
  typeof UpdateAutomationRequestSchema
>;
export type AutomationResponse = z.infer<typeof AutomationResponseSchema>;
export type AutomationListResponse = z.infer<
  typeof AutomationListResponseSchema
>;

export type TradeLogResponse = z.infer<typeof TradeLogResponseSchema>;
export type TradeLogDetailResponse = z.infer<
  typeof TradeLogDetailResponseSchema
>;
export type TradeLogListResponse = z.infer<typeof TradeLogListResponseSchema>;
export type TradeLogQuery = z.infer<typeof TradeLogQuerySchema>;

export type BacktestConfig = z.infer<typeof BacktestConfigSchema>;
export type CreateBacktestRequest = z.infer<typeof CreateBacktestRequestSchema>;
export type BacktestResult = z.infer<typeof BacktestResultSchema>;
export type BacktestResponse = z.infer<typeof BacktestResponseSchema>;

export type NotificationChannelConfig = z.infer<
  typeof NotificationChannelConfigSchema
>;
export type CreateNotificationRequest = z.infer<
  typeof CreateNotificationRequestSchema
>;
export type UpdateNotificationRequest = z.infer<
  typeof UpdateNotificationRequestSchema
>;
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
export type NotificationListResponse = z.infer<
  typeof NotificationListResponseSchema
>;

export type CreatePaymentRequest = z.infer<typeof CreatePaymentRequestSchema>;
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;
export type PaymentStatusResponse = z.infer<typeof PaymentStatusResponseSchema>;

export type AdminKPI = z.infer<typeof AdminKPISchema>;
export type AdminUser = z.infer<typeof AdminUserSchema>;
export type AdminPayment = z.infer<typeof AdminPaymentSchema>;
export type AdminDashboardResponse = z.infer<
  typeof AdminDashboardResponseSchema
>;
export type AdminUsersQuery = z.infer<typeof AdminUsersQuerySchema>;
export type AdminUsersResponse = z.infer<typeof AdminUsersResponseSchema>;
export type CreateCouponRequest = z.infer<typeof CreateCouponRequestSchema>;
export type UpdateCouponRequest = z.infer<typeof UpdateCouponRequestSchema>;
export type CouponToggleActiveRequest = z.infer<typeof CouponToggleActiveRequestSchema>;
export type CouponResponse = z.infer<typeof CouponResponseSchema>;
export type CouponListResponse = z.infer<typeof CouponListResponseSchema>;
export type CouponAnalytics = z.infer<typeof CouponAnalyticsSchema>;
export type CouponDashboard = z.infer<typeof CouponDashboardSchema>;

export type WebSocketAuth = z.infer<typeof WebSocketAuthSchema>;
export type MarginUpdateEvent = z.infer<typeof MarginUpdateEventSchema>;
export type AutomationExecutedEvent = z.infer<
  typeof AutomationExecutedEventSchema
>;
export type NotificationSentEvent = z.infer<typeof NotificationSentEventSchema>;

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ValidationErrorResponse = z.infer<
  typeof ValidationErrorResponseSchema
>;
