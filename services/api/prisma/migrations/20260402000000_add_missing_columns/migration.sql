-- AlterEnum: add SM_SIGNATURE_REFUSED and PROTECTION_PERIOD_REMINDER
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SM_SIGNATURE_REFUSED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PROTECTION_PERIOD_REMINDER';

-- AlterTable: add amount column to notifications
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "amount" DOUBLE PRECISION;

-- AlterTable: add lastReminderAt column to protectionperiodtimers
ALTER TABLE "protectionperiodtimers" ADD COLUMN IF NOT EXISTS "lastReminderAt" TIMESTAMP(3);
