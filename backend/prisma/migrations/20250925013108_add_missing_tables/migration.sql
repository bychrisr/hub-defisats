-- AlterTable
ALTER TABLE "User" ADD COLUMN     "risk_limits" JSONB,
ADD COLUMN     "risk_profile" VARCHAR(50) DEFAULT 'moderate';

-- CreateTable
CREATE TABLE "order_confirmations" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tradeParams" TEXT,
    "tradeId" TEXT,
    "updateValue" DECIMAL(65,30),
    "confirmationToken" TEXT,
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(6),
    "rejectedAt" TIMESTAMP(6),
    "rejectionReason" TEXT,

    CONSTRAINT "order_confirmations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trading_logs" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "tradeId" TEXT,
    "market" TEXT,
    "side" TEXT,
    "quantity" DECIMAL(65,30),
    "price" DECIMAL(65,30),
    "leverage" INTEGER,
    "stoploss" DECIMAL(65,30),
    "takeprofit" DECIMAL(65,30),
    "oldValue" DECIMAL(65,30),
    "newValue" DECIMAL(65,30),
    "reason" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,

    CONSTRAINT "trading_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_configs" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "environment" TEXT NOT NULL,
    "endpointType" TEXT NOT NULL,
    "maxRequests" INTEGER NOT NULL,
    "windowMs" INTEGER NOT NULL,
    "message" TEXT,
    "skipSuccessfulRequests" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "metadata" JSONB,

    CONSTRAINT "rate_limit_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_confirmations_userId_idx" ON "order_confirmations"("userId");

-- CreateIndex
CREATE INDEX "order_confirmations_status_idx" ON "order_confirmations"("status");

-- CreateIndex
CREATE INDEX "order_confirmations_expiresAt_idx" ON "order_confirmations"("expiresAt");

-- CreateIndex
CREATE INDEX "trading_logs_userId_idx" ON "trading_logs"("userId");

-- CreateIndex
CREATE INDEX "trading_logs_action_idx" ON "trading_logs"("action");

-- CreateIndex
CREATE INDEX "trading_logs_timestamp_idx" ON "trading_logs"("timestamp");

-- CreateIndex
CREATE INDEX "trading_logs_tradeId_idx" ON "trading_logs"("tradeId");

-- CreateIndex
CREATE INDEX "rate_limit_configs_environment_idx" ON "rate_limit_configs"("environment");

-- CreateIndex
CREATE INDEX "rate_limit_configs_endpointType_idx" ON "rate_limit_configs"("endpointType");

-- CreateIndex
CREATE INDEX "rate_limit_configs_isActive_idx" ON "rate_limit_configs"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_configs_environment_endpointType_key" ON "rate_limit_configs"("environment", "endpointType");

-- AddForeignKey
ALTER TABLE "order_confirmations" ADD CONSTRAINT "order_confirmations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trading_logs" ADD CONSTRAINT "trading_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
