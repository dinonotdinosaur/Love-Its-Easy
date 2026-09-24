-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "pinFailedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pinLockedUntil" TIMESTAMP(3),
ADD COLUMN     "pinLockouts" INTEGER NOT NULL DEFAULT 0;
