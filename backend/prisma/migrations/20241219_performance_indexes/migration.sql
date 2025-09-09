-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_created_at_idx" ON "User"("created_at");

-- CreateIndex
CREATE INDEX "Automation_user_id_idx" ON "Automation"("user_id");

-- CreateIndex
CREATE INDEX "Automation_type_idx" ON "Automation"("type");

-- CreateIndex
CREATE INDEX "Automation_is_active_idx" ON "Automation"("is_active");

-- CreateIndex
CREATE INDEX "Automation_created_at_idx" ON "Automation"("created_at");

-- CreateIndex
CREATE INDEX "TradeLog_user_id_idx" ON "TradeLog"("user_id");

-- CreateIndex
CREATE INDEX "TradeLog_symbol_idx" ON "TradeLog"("symbol");

-- CreateIndex
CREATE INDEX "TradeLog_status_idx" ON "TradeLog"("status");

-- CreateIndex
CREATE INDEX "TradeLog_executed_at_idx" ON "TradeLog"("executed_at");

-- CreateIndex
CREATE INDEX "TradeLog_created_at_idx" ON "TradeLog"("created_at");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_is_active_idx" ON "Coupon"("is_active");

-- CreateIndex
CREATE INDEX "Coupon_expires_at_idx" ON "Coupon"("expires_at");

-- CreateIndex
CREATE INDEX "AdminUser_user_id_idx" ON "AdminUser"("user_id");

-- CreateIndex
CREATE INDEX "AdminUser_role_idx" ON "AdminUser"("role");

-- CreateIndex
CREATE INDEX "RefreshToken_user_id_idx" ON "RefreshToken"("user_id");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_expires_at_idx" ON "RefreshToken"("expires_at");

-- CreateIndex
CREATE INDEX "RefreshToken_created_at_idx" ON "RefreshToken"("created_at");

-- CreateIndex
CREATE INDEX "User_plan_type_idx" ON "User"("plan_type");

-- CreateIndex
CREATE INDEX "User_updated_at_idx" ON "User"("updated_at");

-- CreateIndex
CREATE INDEX "Automation_user_id_type_idx" ON "Automation"("user_id", "type");

-- CreateIndex
CREATE INDEX "Automation_user_id_is_active_idx" ON "Automation"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "TradeLog_user_id_status_idx" ON "TradeLog"("user_id", "status");

-- CreateIndex
CREATE INDEX "TradeLog_user_id_executed_at_idx" ON "TradeLog"("user_id", "executed_at");

-- CreateIndex
CREATE INDEX "TradeLog_symbol_status_idx" ON "TradeLog"("symbol", "status");

-- CreateIndex
CREATE INDEX "Coupon_code_is_active_idx" ON "Coupon"("code", "is_active");

-- CreateIndex
CREATE INDEX "RefreshToken_user_id_expires_at_idx" ON "RefreshToken"("user_id", "expires_at");
