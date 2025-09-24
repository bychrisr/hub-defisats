-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('free', 'basic', 'advanced', 'pro', 'lifetime');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT,
    "social_provider" TEXT,
    "social_id" TEXT,
    "ln_markets_api_key" TEXT,
    "ln_markets_api_secret" TEXT,
    "last_activity_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "session_expires_at" TIMESTAMP(6),
    "email_verified" BOOLEAN DEFAULT false,
    "email_verification_token" TEXT,
    "email_verification_expires" TIMESTAMP(6),
    "password_reset_token" TEXT,
    "password_reset_expires" TIMESTAMP(6),
    "two_factor_enabled" BOOLEAN DEFAULT false,
    "two_factor_secret" TEXT,
    "two_factor_backup_codes" JSONB,
    "login_attempts" INTEGER DEFAULT 0,
    "locked_until" TIMESTAMP(6),
    "last_login_ip" TEXT,
    "last_login_user_agent" TEXT,
    "last_login_at" TIMESTAMP(6),
    "ln_markets_passphrase" VARCHAR(255),
    "plan_type" "PlanType" NOT NULL DEFAULT 'free',
    "preferences" JSONB,
    "bio" TEXT,
    "birthday" DATE,
    "website" VARCHAR(255),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "risk_level" TEXT,
    "plan_type" "PlanType",
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeLog" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "automation_id" TEXT,
    "trade_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "action" TEXT,
    "plan_type" "PlanType",
    "pnl" DOUBLE PRECISION,
    "amount" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "error_message" TEXT,
    "executed_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "channel_config" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "amount_sats" INTEGER NOT NULL,
    "lightning_invoice" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "paid_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan_type" "PlanType" NOT NULL,
    "description" TEXT,
    "expires_at" TIMESTAMP(6),
    "payment_hash" TEXT,
    "preimage" TEXT,
    "expiry_seconds" INTEGER,
    "payment_method" TEXT,
    "amount" DOUBLE PRECISION,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacktestReport" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "strategy" TEXT,
    "plan_type" "PlanType",
    "execution_time" INTEGER,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(6),

    CONSTRAINT "BacktestReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "code" TEXT NOT NULL,
    "usage_limit" INTEGER DEFAULT 1,
    "used_count" INTEGER DEFAULT 0,
    "expires_at" TIMESTAMP(6),
    "value_type" TEXT NOT NULL,
    "value_amount" INTEGER NOT NULL,
    "time_type" TEXT NOT NULL,
    "time_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_by" TEXT,
    "total_revenue_saved" INTEGER NOT NULL DEFAULT 0,
    "new_users_count" INTEGER NOT NULL DEFAULT 0,
    "conversion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plan_type" "PlanType" NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemAlert" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCoupon" (
    "user_id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "used_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCoupon_pkey" PRIMARY KEY ("user_id","coupon_id")
);

-- CreateTable
CREATE TABLE "CouponAnalytics" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "coupon_id" TEXT NOT NULL,
    "date" TIMESTAMP(6) NOT NULL,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "clicks_count" INTEGER NOT NULL DEFAULT 0,
    "uses_count" INTEGER NOT NULL DEFAULT 0,
    "new_users_count" INTEGER NOT NULL DEFAULT 0,
    "revenue_saved" INTEGER NOT NULL DEFAULT 0,
    "conversion_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "click_through_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CouponAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "mobileName" TEXT,
    "href" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "target" TEXT NOT NULL DEFAULT '_self',
    "badge" TEXT,
    "badgeColor" TEXT,
    "description" TEXT,
    "menuTypeId" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuType" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MenuType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemConfig" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_upgrade_history" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "old_plan" TEXT NOT NULL,
    "new_plan" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "effective_date" TIMESTAMP(6) NOT NULL,
    "upgraded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_upgrade_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_cards" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "category" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_admin_only" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "dashboard_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tooltip_configs" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "card_key" TEXT NOT NULL,
    "tooltip_text" TEXT NOT NULL,
    "tooltip_position" TEXT NOT NULL DEFAULT 'top',
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "tooltip_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price_sats" INTEGER NOT NULL DEFAULT 0,
    "price_monthly" INTEGER,
    "price_yearly" INTEGER,
    "features" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "stripe_price_id" TEXT,
    "has_api_access" BOOLEAN NOT NULL DEFAULT false,
    "has_advanced" BOOLEAN NOT NULL DEFAULT false,
    "has_priority" BOOLEAN NOT NULL DEFAULT false,
    "max_notifications" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "simulation_type" TEXT,
    "automation_type" TEXT,
    "price_scenario" TEXT,
    "duration" INTEGER,
    "initial_price" DOUBLE PRECISION,
    "progress" DOUBLE PRECISION DEFAULT 0,
    "started_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(6),
    "plan_type" "PlanType",

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_results" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "simulation_id" TEXT NOT NULL,
    "result_data" JSONB NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action_type" TEXT,
    "success_rate" DOUBLE PRECISION,
    "pnl" DOUBLE PRECISION,
    "account_balance" DOUBLE PRECISION,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "notification_id" TEXT NOT NULL,
    "user_id" TEXT,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "channel" TEXT,
    "sent_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityConfig" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'authentication',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_by" TEXT,

    CONSTRAINT "SecurityConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecurityAuditLog" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "details" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(6),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "channel" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "variables" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_reports" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "config" JSONB,
    "file_path" TEXT,
    "file_size" INTEGER,
    "generated_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "system_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resource_id" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "details" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_redirects" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "from_path" VARCHAR(500) NOT NULL,
    "to_path" VARCHAR(500) NOT NULL,
    "redirect_type" VARCHAR(20) NOT NULL DEFAULT 'temporary',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6),

    CONSTRAINT "route_redirects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "idx_user_email" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_user_email_verification_token" ON "User"("email_verification_token");

-- CreateIndex
CREATE INDEX "idx_user_password_reset_token" ON "User"("password_reset_token");

-- CreateIndex
CREATE INDEX "idx_automation_user_id" ON "Automation"("user_id");

-- CreateIndex
CREATE INDEX "Automation_type_idx" ON "Automation"("type");

-- CreateIndex
CREATE INDEX "Automation_status_idx" ON "Automation"("status");

-- CreateIndex
CREATE INDEX "Automation_risk_level_idx" ON "Automation"("risk_level");

-- CreateIndex
CREATE INDEX "Automation_plan_type_idx" ON "Automation"("plan_type");

-- CreateIndex
CREATE INDEX "idx_tradelog_automation_id" ON "TradeLog"("automation_id");

-- CreateIndex
CREATE INDEX "idx_tradelog_user_id" ON "TradeLog"("user_id");

-- CreateIndex
CREATE INDEX "TradeLog_status_idx" ON "TradeLog"("status");

-- CreateIndex
CREATE INDEX "TradeLog_action_idx" ON "TradeLog"("action");

-- CreateIndex
CREATE INDEX "TradeLog_plan_type_idx" ON "TradeLog"("plan_type");

-- CreateIndex
CREATE INDEX "TradeLog_executed_at_idx" ON "TradeLog"("executed_at");

-- CreateIndex
CREATE INDEX "idx_notification_user_id" ON "Notification"("user_id");

-- CreateIndex
CREATE INDEX "idx_payment_user_id" ON "Payment"("user_id");

-- CreateIndex
CREATE INDEX "Payment_payment_hash_idx" ON "Payment"("payment_hash");

-- CreateIndex
CREATE INDEX "Payment_expires_at_idx" ON "Payment"("expires_at");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_payment_method_idx" ON "Payment"("payment_method");

-- CreateIndex
CREATE INDEX "Payment_plan_type_idx" ON "Payment"("plan_type");

-- CreateIndex
CREATE INDEX "Payment_created_at_idx" ON "Payment"("created_at");

-- CreateIndex
CREATE INDEX "idx_backtestreport_user_id" ON "BacktestReport"("user_id");

-- CreateIndex
CREATE INDEX "BacktestReport_status_idx" ON "BacktestReport"("status");

-- CreateIndex
CREATE INDEX "BacktestReport_strategy_idx" ON "BacktestReport"("strategy");

-- CreateIndex
CREATE INDEX "BacktestReport_plan_type_idx" ON "BacktestReport"("plan_type");

-- CreateIndex
CREATE INDEX "BacktestReport_created_at_idx" ON "BacktestReport"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_user_id_key" ON "AdminUser"("user_id");

-- CreateIndex
CREATE INDEX "idx_adminuser_user_id" ON "AdminUser"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "idx_coupon_code" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "idx_coupon_active" ON "Coupon"("is_active");

-- CreateIndex
CREATE INDEX "idx_coupon_created" ON "Coupon"("created_at");

-- CreateIndex
CREATE INDEX "idx_coupon_analytics_coupon" ON "CouponAnalytics"("coupon_id");

-- CreateIndex
CREATE INDEX "idx_coupon_analytics_date" ON "CouponAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "idx_coupon_analytics_unique" ON "CouponAnalytics"("coupon_id", "date");

-- CreateIndex
CREATE INDEX "MenuItem_menuTypeId_idx" ON "MenuItem"("menuTypeId");

-- CreateIndex
CREATE INDEX "MenuItem_order_idx" ON "MenuItem"("order");

-- CreateIndex
CREATE INDEX "MenuItem_isActive_isVisible_idx" ON "MenuItem"("isActive", "isVisible");

-- CreateIndex
CREATE UNIQUE INDEX "MenuType_name_key" ON "MenuType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_key_key" ON "SystemConfig"("key");

-- CreateIndex
CREATE INDEX "SystemConfig_key_idx" ON "SystemConfig"("key");

-- CreateIndex
CREATE INDEX "SystemConfig_isActive_idx" ON "SystemConfig"("isActive");

-- CreateIndex
CREATE INDEX "user_upgrade_history_user_id_idx" ON "user_upgrade_history"("user_id");

-- CreateIndex
CREATE INDEX "user_upgrade_history_upgraded_by_idx" ON "user_upgrade_history"("upgraded_by");

-- CreateIndex
CREATE INDEX "user_upgrade_history_created_at_idx" ON "user_upgrade_history"("created_at");

-- CreateIndex
CREATE INDEX "user_upgrade_history_new_plan_idx" ON "user_upgrade_history"("new_plan");

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_cards_key_key" ON "dashboard_cards"("key");

-- CreateIndex
CREATE INDEX "dashboard_cards_category_idx" ON "dashboard_cards"("category");

-- CreateIndex
CREATE INDEX "dashboard_cards_is_active_idx" ON "dashboard_cards"("is_active");

-- CreateIndex
CREATE INDEX "dashboard_cards_order_index_idx" ON "dashboard_cards"("order_index");

-- CreateIndex
CREATE UNIQUE INDEX "tooltip_configs_card_key_key" ON "tooltip_configs"("card_key");

-- CreateIndex
CREATE INDEX "tooltip_configs_card_key_idx" ON "tooltip_configs"("card_key");

-- CreateIndex
CREATE INDEX "tooltip_configs_is_enabled_idx" ON "tooltip_configs"("is_enabled");

-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");

-- CreateIndex
CREATE UNIQUE INDEX "plans_slug_key" ON "plans"("slug");

-- CreateIndex
CREATE INDEX "plans_slug_idx" ON "plans"("slug");

-- CreateIndex
CREATE INDEX "plans_is_active_idx" ON "plans"("is_active");

-- CreateIndex
CREATE INDEX "plans_order_idx" ON "plans"("order");

-- CreateIndex
CREATE INDEX "simulations_user_id_idx" ON "simulations"("user_id");

-- CreateIndex
CREATE INDEX "simulations_status_idx" ON "simulations"("status");

-- CreateIndex
CREATE INDEX "simulations_simulation_type_idx" ON "simulations"("simulation_type");

-- CreateIndex
CREATE INDEX "simulations_automation_type_idx" ON "simulations"("automation_type");

-- CreateIndex
CREATE INDEX "simulations_plan_type_idx" ON "simulations"("plan_type");

-- CreateIndex
CREATE INDEX "simulation_results_simulation_id_idx" ON "simulation_results"("simulation_id");

-- CreateIndex
CREATE INDEX "simulation_results_timestamp_idx" ON "simulation_results"("timestamp");

-- CreateIndex
CREATE INDEX "notification_logs_notification_id_idx" ON "notification_logs"("notification_id");

-- CreateIndex
CREATE INDEX "notification_logs_user_id_idx" ON "notification_logs"("user_id");

-- CreateIndex
CREATE INDEX "notification_logs_status_idx" ON "notification_logs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SecurityConfig_key_key" ON "SecurityConfig"("key");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_user_id_idx" ON "SecurityAuditLog"("user_id");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_action_idx" ON "SecurityAuditLog"("action");

-- CreateIndex
CREATE INDEX "SecurityAuditLog_created_at_idx" ON "SecurityAuditLog"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_user_id_idx" ON "RefreshToken"("user_id");

-- CreateIndex
CREATE INDEX "RefreshToken_expires_at_idx" ON "RefreshToken"("expires_at");

-- CreateIndex
CREATE INDEX "RefreshToken_is_revoked_idx" ON "RefreshToken"("is_revoked");

-- CreateIndex
CREATE INDEX "notification_templates_channel_idx" ON "notification_templates"("channel");

-- CreateIndex
CREATE INDEX "notification_templates_category_idx" ON "notification_templates"("category");

-- CreateIndex
CREATE INDEX "notification_templates_is_active_idx" ON "notification_templates"("is_active");

-- CreateIndex
CREATE INDEX "system_reports_type_idx" ON "system_reports"("type");

-- CreateIndex
CREATE INDEX "system_reports_status_idx" ON "system_reports"("status");

-- CreateIndex
CREATE INDEX "system_reports_created_at_idx" ON "system_reports"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "route_redirects_is_active_idx" ON "route_redirects"("is_active");

-- CreateIndex
CREATE INDEX "route_redirects_redirect_type_idx" ON "route_redirects"("redirect_type");

-- CreateIndex
CREATE INDEX "route_redirects_created_at_idx" ON "route_redirects"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "route_redirects_from_path_key" ON "route_redirects"("from_path");

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TradeLog" ADD CONSTRAINT "TradeLog_automation_id_fkey" FOREIGN KEY ("automation_id") REFERENCES "Automation"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TradeLog" ADD CONSTRAINT "TradeLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "BacktestReport" ADD CONSTRAINT "BacktestReport_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AdminUser" ADD CONSTRAINT "AdminUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserCoupon" ADD CONSTRAINT "UserCoupon_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_menuTypeId_fkey" FOREIGN KEY ("menuTypeId") REFERENCES "MenuType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_upgrade_history" ADD CONSTRAINT "user_upgrade_history_upgraded_by_fkey" FOREIGN KEY ("upgraded_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_upgrade_history" ADD CONSTRAINT "user_upgrade_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_results" ADD CONSTRAINT "simulation_results_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityConfig" ADD CONSTRAINT "SecurityConfig_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecurityAuditLog" ADD CONSTRAINT "SecurityAuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
