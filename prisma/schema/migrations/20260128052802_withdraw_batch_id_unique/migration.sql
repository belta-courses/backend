/*
  Warnings:

  - A unique constraint covering the columns `[paypalBatchId]` on the table `withdraws` will be added. If there are existing duplicate values, this will fail.
  - Made the column `paypalItemId` on table `withdraws` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "withdraws_paypalItemId_idx";

-- AlterTable
ALTER TABLE "withdraws" ALTER COLUMN "paypalItemId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "withdraws_paypalBatchId_key" ON "withdraws"("paypalBatchId");
