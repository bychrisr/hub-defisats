-- CreateTable
CREATE TABLE "registration_progress" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "current_step" TEXT NOT NULL DEFAULT 'personal_data',
    "completed_steps" JSONB NOT NULL DEFAULT '[]',
    "personal_data" JSONB,
    "selected_plan" TEXT,
    "payment_data" JSONB,
    "credentials_data" JSONB,
    "coupon_code" TEXT,
    "session_token" TEXT,
    "expires_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registration_progress_user_id_key" ON "registration_progress"("user_id");

-- CreateIndex
CREATE INDEX "registration_progress_user_id_idx" ON "registration_progress"("user_id");

-- CreateIndex
CREATE INDEX "registration_progress_current_step_idx" ON "registration_progress"("current_step");

-- CreateIndex
CREATE INDEX "registration_progress_session_token_idx" ON "registration_progress"("session_token");

-- CreateIndex
CREATE INDEX "registration_progress_expires_at_idx" ON "registration_progress"("expires_at");

-- AddForeignKey
ALTER TABLE "registration_progress" ADD CONSTRAINT "registration_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
