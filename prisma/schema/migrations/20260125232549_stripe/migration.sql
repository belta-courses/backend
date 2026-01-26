-- AlterTable
ALTER TABLE "users" ADD COLUMN     "stripeAccountId" TEXT;

-- AlterTable
ALTER TABLE "withdraws" ADD COLUMN     "failedAt" TIMESTAMP(3);
