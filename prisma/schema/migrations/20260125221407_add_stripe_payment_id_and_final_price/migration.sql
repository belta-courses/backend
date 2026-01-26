/*
  Warnings:

  - Added the required column `finalPrice` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "finalPrice" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "stripePaymentId" TEXT;

-- CreateIndex
CREATE INDEX "transactions_stripePaymentId_idx" ON "transactions"("stripePaymentId");

-- CreateIndex
CREATE INDEX "transactions_studentId_idx" ON "transactions"("studentId");

-- CreateIndex
CREATE INDEX "transactions_teacherId_idx" ON "transactions"("teacherId");
