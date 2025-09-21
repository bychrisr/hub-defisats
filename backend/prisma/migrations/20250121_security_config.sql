-- Create SecurityConfig table for admin-configurable security settings
CREATE TABLE "SecurityConfig" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'authentication',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "SecurityConfig_pkey" PRIMARY KEY ("id")
);

-- Create unique index on key
CREATE UNIQUE INDEX "SecurityConfig_key_key" ON "SecurityConfig"("key");

-- Insert default security configurations
INSERT INTO "SecurityConfig" ("id", "key", "value", "description", "category", "is_active") VALUES
('jwt_expires_in', 'jwt_expires_in', '2h', 'JWT Access Token expiration time', 'authentication', true),
('refresh_token_expires_in', 'refresh_token_expires_in', '7d', 'Refresh Token expiration time', 'authentication', true),
('max_login_attempts', 'max_login_attempts', '5', 'Maximum login attempts before lockout', 'security', true),
('lockout_duration', 'lockout_duration', '15m', 'Account lockout duration after max attempts', 'security', true),
('session_timeout', 'session_timeout', '30m', 'Session timeout for inactivity', 'security', true),
('require_2fa', 'require_2fa', 'false', 'Require 2FA for all users', 'security', true),
('token_rotation_enabled', 'token_rotation_enabled', 'true', 'Enable automatic token rotation', 'security', true),
('max_concurrent_sessions', 'max_concurrent_sessions', '3', 'Maximum concurrent sessions per user', 'security', true);

-- Create SecurityAuditLog table for monitoring
CREATE TABLE "SecurityAuditLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityAuditLog_pkey" PRIMARY KEY ("id")
);

-- Create indexes for audit log
CREATE INDEX "SecurityAuditLog_user_id_idx" ON "SecurityAuditLog"("user_id");
CREATE INDEX "SecurityAuditLog_action_idx" ON "SecurityAuditLog"("action");
CREATE INDEX "SecurityAuditLog_created_at_idx" ON "SecurityAuditLog"("created_at");

-- Create RefreshToken table for better management
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3),

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- Create indexes for refresh tokens
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");
CREATE INDEX "RefreshToken_user_id_idx" ON "RefreshToken"("user_id");
CREATE INDEX "RefreshToken_expires_at_idx" ON "RefreshToken"("expires_at");
CREATE INDEX "RefreshToken_is_revoked_idx" ON "RefreshToken"("is_revoked");

-- Add foreign key constraints
ALTER TABLE "SecurityConfig" ADD CONSTRAINT "SecurityConfig_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SecurityAuditLog" ADD CONSTRAINT "SecurityAuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
