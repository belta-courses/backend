-- DropForeignKey
ALTER TABLE "completed_lectures" DROP CONSTRAINT "completed_lectures_lectureId_fkey";

-- DropForeignKey
ALTER TABLE "completed_lectures" DROP CONSTRAINT "completed_lectures_studentId_fkey";

-- DropForeignKey
ALTER TABLE "save_lists" DROP CONSTRAINT "save_lists_courseId_fkey";

-- DropForeignKey
ALTER TABLE "save_lists" DROP CONSTRAINT "save_lists_studentId_fkey";

-- AddForeignKey
ALTER TABLE "save_lists" ADD CONSTRAINT "save_lists_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "save_lists" ADD CONSTRAINT "save_lists_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completed_lectures" ADD CONSTRAINT "completed_lectures_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "completed_lectures" ADD CONSTRAINT "completed_lectures_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
