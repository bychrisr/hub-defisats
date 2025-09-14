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
    "plan_type" TEXT NOT NULL DEFAULT 'free',
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
    "ln_markets_passphrase" VARCHAR(255),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
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
    "plan_type" TEXT NOT NULL,
    "amount_sats" INTEGER NOT NULL,
    "lightning_invoice" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "paid_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BacktestReport" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "plan_type" TEXT NOT NULL,
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
CREATE INDEX "idx_tradelog_automation_id" ON "TradeLog"("automation_id");

-- CreateIndex
CREATE INDEX "idx_tradelog_user_id" ON "TradeLog"("user_id");

-- CreateIndex
CREATE INDEX "idx_notification_user_id" ON "Notification"("user_id");

-- CreateIndex
CREATE INDEX "idx_payment_user_id" ON "Payment"("user_id");

-- CreateIndex
CREATE INDEX "idx_backtestreport_user_id" ON "BacktestReport"("user_id");

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
ALTER TABLE "user_upgrade_history" ADD CONSTRAINT "user_upgrade_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_upgrade_history" ADD CONSTRAINT "user_upgrade_history_upgraded_by_fkey" FOREIGN KEY ("upgraded_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
