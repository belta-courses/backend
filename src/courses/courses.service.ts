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
import { StorageService } from 'src/storage/storage.service';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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
        coverId: dto.coverId ?? undefined,
      },
      include: {
        teacher: { include: { cover: true } },
        cover: true,
        introVideo: true,
      },
    });
  }

  async updateCourse(
    courseId: string,
    dto: UpdateCourseDto,
    teacherId?: string,
  ) {
    const course = await this.findCourseById(courseId);

    if (teacherId && course.teacherId !== teacherId)
      throw new ForbiddenException('You are not the owner of this course');

    if (
      course.coverId &&
      dto.coverId !== undefined &&
      dto.coverId !== course.coverId
    ) {
      await this.storageService.deleteFile(course.coverId);
    }

    if (
      dto.introVideoId &&
      course.introVideoId &&
      dto.introVideoId !== course.introVideoId
    ) {
      await this.storageService.deleteFile(course.introVideoId);
    }

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price ? new Prisma.Decimal(dto.price) : undefined,
        coverId: dto.coverId ?? undefined,
        introVideoId: dto.introVideoId,
      },
      include: {
        teacher: { include: { cover: true } },
        cover: true,
        introVideo: true,
      },
    });
  }

  async deleteCourse(courseId: string, teacherId?: string) {
    const course = await this.findCourseById(courseId);

    if (teacherId && course.teacherId !== teacherId)
      throw new ForbiddenException('You are not the owner of this course');

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

    // Soft delte Files
    if (course.coverId) {
      await this.storageService.deleteFile(course.coverId);
    }

    if (course.introVideoId) {
      await this.storageService.deleteFile(course.introVideoId);
    }
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
        include: {
          teacher: { include: { cover: true } },
          cover: true,
          introVideo: true,
        },
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

  async findAllCoursesForStudent(query: FindCoursesQueryDto, userId: string) {
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
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          teacher: { include: { cover: true } },
          cover: true,
          introVideo: true,
          saveLists: {
            where: { studentId: userId },
            select: { id: true },
          },
          ownedLists: {
            where: { studentId: userId },
            select: { id: true },
          },
        },
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
      include: {
        teacher: { include: { cover: true } },
        cover: true,
        introVideo: true,
      },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async findCourseDetailedById(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: { include: { cover: true } },
        cover: true,
        introVideo: true,
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

  async createModule(
    courseId: string,
    dto: CreateModuleDto,
    teacherId?: string,
  ) {
    let order = dto.order;
    if (!order) {
      const max = await this.prisma.module.aggregate({
        where: { courseId },
        _max: { order: true },
      });
      order = (max._max.order ?? 0) + 1;
    }

    const course = await this.findCourseById(courseId);
    if (teacherId && course.teacherId !== teacherId)
      throw new ForbiddenException('You are not the owner of this course');

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

  async updateModule(
    moduleId: string,
    dto: UpdateModuleDto,
    teacherId?: string,
  ) {
    const module = await this.findModuleById(moduleId);
    if (teacherId && module.course.teacherId !== teacherId)
      throw new ForbiddenException('You are not the owner of this module');

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

  async deleteModule(moduleId: string, teacherId?: string) {
    const module = await this.findModuleById(moduleId);

    if (teacherId && module.course.teacherId !== teacherId)
      throw new ForbiddenException('You are not the owner of this module');

    await this.prisma.lecture.deleteMany({
      where: { moduleId },
    });

    await this.prisma.module.delete({
      where: { id: moduleId },
    });
  }

  async findModuleById(moduleId: string) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });
    if (!module) throw new NotFoundException('Module not found');
    return module;
  }

  // LECTURES

  async createLecture(
    moduleId: string,
    dto: CreateLectureDto,
    teacherId?: string,
  ) {
    let order = dto.order;
    if (!order) {
      const max = await this.prisma.lecture.aggregate({
        where: { moduleId },
        _max: { order: true },
      });
      order = (max._max.order ?? 0) + 1;
    }

    const module = await this.findModuleById(moduleId);
    if (teacherId && module.course.teacherId !== teacherId)
      throw new ForbiddenException('You are not the owner of this module');

    return this.prisma.lecture.create({
      data: {
        name: dto.name,
        description: dto.description,
        duration: dto.duration,
        content: dto.content ?? '',
        videoId: dto.videoId,
        demo: dto.demo ?? false,
        order,
        moduleId,
        courseId: module.courseId,
      },
      include: {
        video: true,
      },
    });
  }

  async updateLecture(
    lectureId: string,
    dto: UpdateLectureDto,
    teacherId?: string,
  ) {
    const lecture = await this.findLectureById(lectureId);
    if (teacherId && lecture.module.course.teacherId !== teacherId)
      throw new ForbiddenException('You are not the owner of this lecture');

    if (
      lecture.videoId &&
      dto.videoId !== undefined &&
      dto.videoId !== lecture.videoId
    ) {
      await this.storageService.deleteFile(lecture.videoId);
    }

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
      include: {
        video: true,
      },
    });
  }

  async deleteLecture(lectureId: string, teacherId?: string) {
    const lecture = await this.findLectureById(lectureId);
    if (teacherId && lecture.module.course.teacherId !== teacherId)
      throw new ForbiddenException('You are not the owner of this lecture');

    // Soft delete video
    if (lecture.videoId) {
      await this.storageService.deleteFile(lecture.videoId);
    }

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
      include: {
        video: true,
        module: { include: { course: true } },
      },
    });
    if (!lecture) throw new NotFoundException('Lecture not found');
    return lecture;
  }

  async findLectureByIdWithPermissions(
    lectureId: string,
    teacherId?: string,
    studentId?: string,
  ) {
    const lecture = await this.findLectureById(lectureId);
    if (teacherId && lecture.module.course.teacherId !== teacherId)
      throw new ForbiddenException('You are not the owner of this lecture');
    if (studentId && !lecture.demo) {
      await this.ensurePurchased({
        id: lectureId,
        userId: studentId,
        type: 'lecture',
      });
    }
    return lecture;
  }
}
