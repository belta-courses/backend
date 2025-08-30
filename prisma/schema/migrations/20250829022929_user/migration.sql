-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('admin', 'employee', 'teacher', 'student');

-- CreateEnum
CREATE TYPE "public"."Gender" AS ENUM ('male', 'female');

-- CreateTable
CREATE TABLE "public"."users" (
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'student',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "gender" "public"."Gender",
    "date_of_birth" TIMESTAMP(3),
    "is_mentor" BOOLEAN,
    "session_price" DOUBLE PRECISION,
    "is_new" BOOLEAN
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");
