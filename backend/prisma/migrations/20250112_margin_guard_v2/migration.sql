-- CreateTable
CREATE TABLE "marginGuardConfig" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "mode" TEXT NOT NULL DEFAULT 'global',
    "margin_threshold" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "add_margin_percentage" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "selected_positions" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marginGuardConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inAppNotification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inAppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userNotificationPreferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "enabled_channels" TEXT[] DEFAULT ARRAY['in_app', 'push'],
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "email_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "in_app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "userNotificationPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userPushTokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device_type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "userPushTokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marginGuardConfig_user_id_key" ON "marginGuardConfig"("user_id");

-- CreateIndex
CREATE INDEX "marginGuardConfig_user_id_idx" ON "marginGuardConfig"("user_id");

-- CreateIndex
CREATE INDEX "marginGuardConfig_is_active_idx" ON "marginGuardConfig"("is_active");

-- CreateIndex
CREATE INDEX "inAppNotification_user_id_idx" ON "inAppNotification"("user_id");

-- CreateIndex
CREATE INDEX "inAppNotification_type_idx" ON "inAppNotification"("type");

-- CreateIndex
CREATE INDEX "inAppNotification_read_idx" ON "inAppNotification"("read");

-- CreateIndex
CREATE INDEX "inAppNotification_created_at_idx" ON "inAppNotification"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "userNotificationPreferences_user_id_key" ON "userNotificationPreferences"("user_id");

-- CreateIndex
CREATE INDEX "userPushTokens_user_id_idx" ON "userPushTokens"("user_id");

-- CreateIndex
CREATE INDEX "userPushTokens_is_active_idx" ON "userPushTokens"("is_active");

-- AddForeignKey
ALTER TABLE "marginGuardConfig" ADD CONSTRAINT "marginGuardConfig_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inAppNotification" ADD CONSTRAINT "inAppNotification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userNotificationPreferences" ADD CONSTRAINT "userNotificationPreferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userPushTokens" ADD CONSTRAINT "userPushTokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
