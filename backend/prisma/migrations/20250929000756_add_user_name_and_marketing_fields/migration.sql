-- AlterTable
ALTER TABLE "User" ADD COLUMN     "email_marketing_consent" BOOLEAN DEFAULT false,
ADD COLUMN     "email_marketing_consent_at" TIMESTAMP(6),
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "marketing_preferences" JSONB;
