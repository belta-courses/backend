-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('pending', 'completed', 'canceled', 'rejected');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");
