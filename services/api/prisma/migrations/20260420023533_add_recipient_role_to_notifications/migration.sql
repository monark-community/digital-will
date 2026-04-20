-- CreateEnum
CREATE TYPE "NotificationRecipientRole" AS ENUM ('PM', 'SM', 'SM_TARGET');

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "recipientRole" "NotificationRecipientRole" NOT NULL DEFAULT 'SM';
