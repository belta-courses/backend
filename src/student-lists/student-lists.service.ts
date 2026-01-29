import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import { FindCoursesQueryDto } from 'src/courses/dto/request/find-courses-query.dto';

@Injectable()
export class StudentListsService {
  constructor(private readonly prisma: PrismaService) {}

  // OWNED LISTS

  async findOwnedCourses(studentId: string, query: FindCoursesQueryDto) {
    const { page = 1, limit = 10, search, teacherId } = query;

    const courseFilters: Prisma.CourseWhereInput = {
      status: query.status ?? undefined,
      AND: [
        teacherId ? { teacherId } : {},
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                {
                  teacher: {
                    name: { contains: search, mode: 'insensitive' },
                  },
                },
              ],
            }
          : {},
      ],
    };

    const where: Prisma.OwnedListWhereInput = {
      studentId,
      course: courseFilters,
    };

    const [ownedLists, total] = await this.prisma.$transaction([
      this.prisma.ownedList.findMany({
        where,
        include: {
          course: {
            include: { teacher: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ownedList.count({ where }),
    ]);

    return {
      data: ownedLists.map((item) => item.course),
      meta: {
        page,
        limit,
        count: ownedLists.length,
        total,
      },
    };
  }

  // SAVE LISTS

  async findSavedCourses(studentId: string, query: FindCoursesQueryDto) {
    const { page = 1, limit = 10, search, teacherId } = query;

    const courseFilters: Prisma.CourseWhereInput = {
      status: query.status ?? undefined,
      AND: [
        teacherId ? { teacherId } : {},
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                {
                  teacher: {
                    name: { contains: search, mode: 'insensitive' },
                  },
                },
              ],
            }
          : {},
      ],
    };

    const where: Prisma.SaveListWhereInput = {
      studentId,
      course: courseFilters,
    };

    const [saveLists, total] = await this.prisma.$transaction([
      this.prisma.saveList.findMany({
        where,
        include: {
          course: {
            include: { teacher: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.saveList.count({ where }),
    ]);

    return {
      data: saveLists.map((item) => item.course),
      meta: {
        page,
        limit,
        count: saveLists.length,
        total,
      },
    };
  }

  async addCourseToSaveList(studentId: string, courseId: string) {
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    // Check if already in save list
    const existing = await this.prisma.saveList.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Course is already in your save list');
    }

    await this.prisma.saveList.create({
      data: {
        studentId,
        courseId,
      },
    });
  }

  async removeCourseFromSaveList(studentId: string, courseId: string) {
    const saveListItem = await this.prisma.saveList.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (!saveListItem) {
      throw new NotFoundException('Course is not in your save list');
    }

    await this.prisma.saveList.delete({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });
  }
}
