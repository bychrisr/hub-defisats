-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_created_at" ON "users"("created_at");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_users_is_active" ON "users"("is_active");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_automations_user_id" ON "automations"("user_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_automations_type" ON "automations"("type");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_automations_is_active" ON "automations"("is_active");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_automations_user_id_is_active" ON "automations"("user_id", "is_active");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_trade_logs_user_id" ON "trade_logs"("user_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_trade_logs_created_at" ON "trade_logs"("created_at");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_trade_logs_status" ON "trade_logs"("status");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_trade_logs_user_id_created_at" ON "trade_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_trade_logs_automation_id" ON "trade_logs"("automation_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_simulations_user_id" ON "simulations"("user_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_simulations_status" ON "simulations"("status");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_simulations_created_at" ON "simulations"("created_at");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_simulations_user_id_status" ON "simulations"("user_id", "status");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_user_id" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_status" ON "notifications"("status");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_created_at" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_user_id_status" ON "notifications"("user_id", "status");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payments_user_id" ON "payments"("user_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payments_status" ON "payments"("status");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payments_created_at" ON "payments"("created_at");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_payments_user_id_status" ON "payments"("user_id", "status");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_coupons_code" ON "coupons"("code");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_coupons_is_active" ON "coupons"("is_active");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_coupons_expires_at" ON "coupons"("expires_at");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_coupons_user_id" ON "user_coupons"("user_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_coupons_coupon_id" ON "user_coupons"("coupon_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_user_coupons_used_at" ON "user_coupons"("used_at");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_backtest_reports_user_id" ON "backtest_reports"("user_id");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_backtest_reports_created_at" ON "backtest_reports"("created_at");

-- CreateIndex
CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_backtest_reports_user_id_created_at" ON "backtest_reports"("user_id", "created_at");