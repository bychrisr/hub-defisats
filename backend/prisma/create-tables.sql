-- Create tables based on Prisma schema

-- Users table
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    social_provider TEXT,
    social_id TEXT,
    ln_markets_api_key TEXT NOT NULL,
    ln_markets_api_secret TEXT NOT NULL,
    plan_type TEXT NOT NULL DEFAULT 'free',
    last_activity_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    session_expires_at TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token TEXT,
    email_verification_expires TIMESTAMP,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    two_factor_backup_codes JSONB,
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login_ip TEXT,
    last_login_user_agent TEXT
);

-- Automations table
CREATE TABLE IF NOT EXISTS "Automation" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    config JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- TradeLogs table
CREATE TABLE IF NOT EXISTS "TradeLog" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    automation_id TEXT REFERENCES "Automation"(id) ON DELETE SET NULL,
    trade_id TEXT NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    executed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS "Notification" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    channel_config JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS "Payment" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL,
    amount_sats INTEGER NOT NULL,
    lightning_invoice TEXT NOT NULL,
    status TEXT NOT NULL,
    paid_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- BacktestReports table
CREATE TABLE IF NOT EXISTS "BacktestReport" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    config JSONB NOT NULL,
    result JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- AdminUsers table
CREATE TABLE IF NOT EXISTS "AdminUser" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Coupons table
CREATE TABLE IF NOT EXISTS "Coupon" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code TEXT UNIQUE NOT NULL,
    usage_limit INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    plan_type TEXT NOT NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- SystemAlerts table
CREATE TABLE IF NOT EXISTS "SystemAlert" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    message TEXT NOT NULL,
    severity TEXT NOT NULL,
    is_global BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- UserCoupon junction table
CREATE TABLE IF NOT EXISTS "UserCoupon" (
    user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    coupon_id TEXT NOT NULL REFERENCES "Coupon"(id) ON DELETE CASCADE,
    used_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, coupon_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_email_verification_token ON "User"(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_user_password_reset_token ON "User"(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_automation_user_id ON "Automation"(user_id);
CREATE INDEX IF NOT EXISTS idx_tradelog_user_id ON "TradeLog"(user_id);
CREATE INDEX IF NOT EXISTS idx_tradelog_automation_id ON "TradeLog"(automation_id);
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON "Notification"(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_user_id ON "Payment"(user_id);
CREATE INDEX IF NOT EXISTS idx_backtestreport_user_id ON "BacktestReport"(user_id);
CREATE INDEX IF NOT EXISTS idx_adminuser_user_id ON "AdminUser"(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_code ON "Coupon"(code);