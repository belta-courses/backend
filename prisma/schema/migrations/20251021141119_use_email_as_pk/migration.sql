-- DropIndex
DROP INDEX "public"."users_email_idx";

-- AlterTable
ALTER TABLE "public"."users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("email");

-- DropIndex
DROP INDEX "public"."users_email_key";
