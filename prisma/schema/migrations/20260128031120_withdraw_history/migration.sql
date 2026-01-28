/*
  Warnings:

  - You are about to drop the column `failedAt` on the `withdraws` table. All the data in the column will be lost.
  - You are about to drop the column `failureReason` on the `withdraws` table. All the data in the column will be lost.
  - You are about to drop the column `paypalPayoutId` on the `withdraws` table. All the data in the column will be lost.
  - You are about to drop the column `paypalPayoutItemId` on the `withdraws` table. All the data in the column will be lost.
  - You are about to drop the column `processedAt` on the `withdraws` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[payoutId]` on the table `withdraws` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `payoutId` to the `withdraws` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paypalBatchId` to the `withdraws` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `withdraws` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "withdraws" DROP COLUMN "failedAt",
DROP COLUMN "failureReason",
DROP COLUMN "paypalPayoutId",
DROP COLUMN "paypalPayoutItemId",
DROP COLUMN "processedAt",
ADD COLUMN     "payoutId" TEXT NOT NULL,
ADD COLUMN     "paypalBatchId" TEXT NOT NULL,
ADD COLUMN     "paypalItemId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "withdraw_histories" (
    "id" TEXT NOT NULL,
    "withdrawId" TEXT NOT NULL,
    "status" "WithdrawStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "withdraw_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "withdraws_payoutId_key" ON "withdraws"("payoutId");

-- CreateIndex
CREATE INDEX "withdraws_payoutId_idx" ON "withdraws"("payoutId");

-- CreateIndex
CREATE INDEX "withdraws_paypalBatchId_idx" ON "withdraws"("paypalBatchId");

-- CreateIndex
CREATE INDEX "withdraws_paypalItemId_idx" ON "withdraws"("paypalItemId");

-- AddForeignKey
ALTER TABLE "withdraw_histories" ADD CONSTRAINT "withdraw_histories_withdrawId_fkey" FOREIGN KEY ("withdrawId") REFERENCES "withdraws"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
