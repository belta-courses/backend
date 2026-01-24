/*
  Warnings:

  - Made the column `courseId` on table `lectures` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "lectures" DROP CONSTRAINT "lectures_courseId_fkey";

-- AlterTable
ALTER TABLE "lectures" ALTER COLUMN "courseId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
