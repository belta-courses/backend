import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseStatus, Prisma, Role } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma.service';
import { CreateCourseDto } from './dto/request/create-course.dto';
import { UpdateCourseDto } from './dto/request/update-course.dto';
import { FindCoursesQueryDto } from './dto/request/find-courses-query.dto';
import { CreateModuleDto } from './dto/request/create-module.dto';
import { UpdateModuleDto } from './dto/request/update-module.dto';
import { CreateLectureDto } from './dto/request/create-lecture.dto';
import { UpdateLectureDto } from './dto/request/update-lecture.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureCourseOwnership(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (course.teacherId !== userId)
      throw new ForbiddenException('You are not the owner of this course');
  }

  async ensureOwnership({
    id,
    userId,
    type,
  }: {
    id: string;
    userId: string;
    type: 'course' | 'module' | 'lecture';
  }) {
    let ownerId: string | undefined;

    switch (type) {
      case 'course': {
        const course = await this.prisma.course.findUnique({
          where: { id },
        });
        ownerId = course?.teacherId;
        break;
      }
      case 'module': {
        const module = await this.prisma.module.findUnique({
          where: { id },
          include: { course: true },
        });
        ownerId = module?.course?.teacherId;
        break;
      }
      case 'lecture': {
        const lecture = await this.prisma.lecture.findUnique({
          where: { id },
          include: { module: { include: { course: true } } },
        });
        ownerId = lecture?.module?.course?.teacherId;
        break;
      }
    }

    if (!ownerId) throw new NotFoundException('Item not found');
    if (ownerId !== userId)
      throw new ForbiddenException('You are not the owner of this item');
  }

  async ensurePurchased({
    id,
    userId,
    type,
  }: {
    id: string;
    userId: string;
    type: 'course' | 'module' | 'lecture';
  }) {
    switch (type) {
      case 'course': {
        const course = await this.prisma.ownedList.findUnique({
          where: { studentId_courseId: { studentId: userId, courseId: id } },
        });
        if (!course)
          throw new ForbiddenException('You need to buy course first.');
        break;
      }
      case 'module': {
        const module = await this.prisma.module.findUnique({
          where: { id },
        });
        if (!module)
          throw new ForbiddenException('You need to buy course first.');
        const course = await this.prisma.ownedList.findUnique({
          where: {
            studentId_courseId: {
              studentId: userId,
              courseId: module.courseId,
            },
          },
        });
        if (!course)
          throw new ForbiddenException('You need to buy course first.');
        break;
      }
      case 'lecture': {
        const lecture = await this.prisma.lecture.findUnique({
          where: { id },
        });
        if (!lecture)
          throw new ForbiddenException('You need to buy course first.');
        if (lecture.demo) break;
        const course = await this.prisma.ownedList.findUnique({
          where: {
            studentId_courseId: {
              studentId: userId,
              courseId: lecture.courseId,
            },
          },
        });
        if (!course)
          throw new ForbiddenException('You need to buy course first.');
        break;
      }
    }
  }

  // COURSES

  async createCourse(dto: CreateCourseDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.teacherId },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== Role.teacher)
      throw new ForbiddenException('Only teachers can own courses');

    return this.prisma.course.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: new Prisma.Decimal(dto.price),
        teacherId: dto.teacherId,
      },
      include: {
        teacher: true,
      },
    });
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto) {
    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price ? new Prisma.Decimal(dto.price) : undefined,
      },
      include: {
        teacher: true,
      },
    });
  }

  async deleteCourse(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) throw new NotFoundException('Course not found');
    if (course.status !== CourseStatus.draft) {
      throw new BadRequestException(
        'Course cannot be deleted because it has already been published',
      );
    }

    await this.prisma.lecture.deleteMany({
      where: { courseId },
    });

    await this.prisma.module.deleteMany({
      where: { courseId },
    });

    await this.prisma.course.delete({
      where: { id: courseId },
    });
  }

  async findAllCourses(query: FindCoursesQueryDto) {
    const { page = 1, limit = 10, search, teacherId } = query;

    const where: Prisma.CourseWhereInput = {
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

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        include: { teacher: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses,
      meta: {
        page,
        limit,
        count: courses.length,
        total,
      },
    };
  }

  async findCourseById(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async findCourseDetailedById(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: true,
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lectures: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  // MODULES

  async createModule(courseId: string, dto: CreateModuleDto) {
    let order = dto.order;
    if (!order) {
      const max = await this.prisma.module.aggregate({
        where: { courseId },
        _max: { order: true },
      });
      order = (max._max.order ?? 0) + 1;
    }

    return this.prisma.module.create({
      data: {
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        order,
        courseId,
      },
    });
  }

  async updateModule(moduleId: string, dto: UpdateModuleDto) {
    return this.prisma.module.update({
      where: { id: moduleId },
      data: {
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        order: dto.order,
      },
    });
  }

  async deleteModule(moduleId: string) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });

    if (!module) throw new NotFoundException('Module not found');

    await this.prisma.lecture.deleteMany({
      where: { moduleId },
    });

    await this.prisma.module.delete({
      where: { id: moduleId },
    });
  }

  // LECTURES

  async createLecture(moduleId: string, dto: CreateLectureDto) {
    let order = dto.order;
    if (!order) {
      const max = await this.prisma.lecture.aggregate({
        where: { moduleId },
        _max: { order: true },
      });
      order = (max._max.order ?? 0) + 1;
    }

    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
    });
    if (!module) throw new NotFoundException('Module not found');

    return this.prisma.lecture.create({
      data: {
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        content: dto.content,
        videoId: dto.videoId,
        demo: dto.demo ?? false,
        order,
        moduleId,
        courseId: module.courseId,
      },
    });
  }

  async updateLecture(lectureId: string, dto: UpdateLectureDto) {
    return this.prisma.lecture.update({
      where: { id: lectureId },
      data: {
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        content: dto.content,
        videoId: dto.videoId,
        demo: dto.demo,
        order: dto.order,
      },
    });
  }

  async deleteLecture(lectureId: string) {
    const lecture = await this.prisma.lecture.findUnique({
      where: { id: lectureId },
    });
    if (!lecture) throw new NotFoundException('Lecture not found');

    // delete completed Status
    await this.prisma.completedLecture.deleteMany({
      where: { lectureId },
    });

    // delete lecture
    await this.prisma.lecture.delete({
      where: { id: lectureId },
    });
  }

  async findLectureById(lectureId: string) {
    const lecture = await this.prisma.lecture.findUnique({
      where: { id: lectureId },
    });
    if (!lecture) throw new NotFoundException('Lecture not found');
    return lecture;
  }
}
