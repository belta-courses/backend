/*
  Warnings:

  - Added the required column `paypalEmail` to the `withdraws` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WithdrawStatus" AS ENUM ('pending', 'completed', 'failed');

-- AlterTable
ALTER TABLE "withdraws" ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "paypalEmail" TEXT NOT NULL,
ADD COLUMN     "paypalPayoutId" TEXT,
ADD COLUMN     "paypalPayoutItemId" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "status" "WithdrawStatus" NOT NULL DEFAULT 'pending',
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "withdraws_status_idx" ON "withdraws"("status");
