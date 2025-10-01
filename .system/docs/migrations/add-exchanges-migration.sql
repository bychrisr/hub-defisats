-- Migration: Add Exchanges Tables
-- Description: Create tables for supporting multiple exchanges
-- Date: 2025-01-09

-- CreateTable
CREATE TABLE "exchanges" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "api_version" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchanges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_credential_types" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "exchange_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "field_type" TEXT NOT NULL DEFAULT 'text',
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_credential_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_exchange_credentials" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "user_id" TEXT NOT NULL,
    "exchange_id" TEXT NOT NULL,
    "credentials" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "last_test" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_exchange_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exchanges_name_key" ON "exchanges"("name");

-- CreateIndex
CREATE UNIQUE INDEX "exchanges_slug_key" ON "exchanges"("slug");

-- CreateIndex
CREATE INDEX "idx_exchanges_slug" ON "exchanges"("slug");

-- CreateIndex
CREATE INDEX "idx_exchanges_is_active" ON "exchanges"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "exchange_credential_types_exchange_id_field_name_key" ON "exchange_credential_types"("exchange_id", "field_name");

-- CreateIndex
CREATE INDEX "idx_exchange_credential_types_exchange_id" ON "exchange_credential_types"("exchange_id");

-- CreateIndex
CREATE INDEX "idx_exchange_credential_types_is_required" ON "exchange_credential_types"("is_required");

-- CreateIndex
CREATE UNIQUE INDEX "user_exchange_credentials_user_id_exchange_id_key" ON "user_exchange_credentials"("user_id", "exchange_id");

-- CreateIndex
CREATE INDEX "idx_user_exchange_credentials_user_id" ON "user_exchange_credentials"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_exchange_credentials_exchange_id" ON "user_exchange_credentials"("exchange_id");

-- CreateIndex
CREATE INDEX "idx_user_exchange_credentials_is_active" ON "user_exchange_credentials"("is_active");

-- CreateIndex
CREATE INDEX "idx_user_exchange_credentials_is_verified" ON "user_exchange_credentials"("is_verified");

-- AddForeignKey
ALTER TABLE "exchange_credential_types" ADD CONSTRAINT "exchange_credential_types_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_exchange_credentials" ADD CONSTRAINT "user_exchange_credentials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_exchange_credentials" ADD CONSTRAINT "user_exchange_credentials_exchange_id_fkey" FOREIGN KEY ("exchange_id") REFERENCES "exchanges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
