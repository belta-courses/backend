import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Router } from 'src/core/router';
import {
  CreateCourseDto,
  TeacherCreateCourseDto,
} from './dto/request/create-course.dto';
import { UpdateCourseDto } from './dto/request/update-course.dto';
import { FindCoursesQueryDto } from './dto/request/find-courses-query.dto';
import { CoursesService } from './courses.service';
import { JwtPayload } from 'src/users/users.types';
import { CourseResponseDto } from './dto/response/course-response.dto';
import { CourseDetailedResponseDto } from './dto/response/course-detailed-response.dto';
import { plainToInstance } from 'class-transformer';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/generated/prisma/client';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { AccessedBy } from 'src/auth/permissions.decorator';
import { Permission } from 'src/core/config/permissions.config';
import { getNoDecimalCourse } from './utils/convert-course';

@ApiTags(Router.Courses.ApiTag)
@Controller(Router.Courses.Base)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new course by Teacher',
  })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.teacher)
  async createMyCourse(
    @Body() dto: TeacherCreateCourseDto,
    @Request() req: { user: JwtPayload },
  ) {
    const course = await this.coursesService.createCourse({
      ...dto,
      teacherId: req.user.sub,
    });
    return plainToInstance(CourseResponseDto, getNoDecimalCourse(course), {
      excludeExtraneousValues: true,
    });
  }

  @Post(Router.Courses.Admin)
  @ApiOperation({
    summary: 'Create a new course by Admin/Employee',
  })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(Permission.COURSES_CREATE, Permission.COURSES_FULL_ACCESS)
  async createCourseForTeacher(@Body() dto: CreateCourseDto) {
    const course = await this.coursesService.createCourse(dto);
    return plainToInstance(CourseResponseDto, getNoDecimalCourse(course), {
      excludeExtraneousValues: true,
    });
  }

  @Patch(Router.Courses.ById)
  @ApiOperation({ summary: 'Update a course (creator teacher or staff)' })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee, Role.teacher)
  @AccessedBy(Permission.COURSES_UPDATE, Permission.COURSES_FULL_ACCESS)
  async updateCourse(
    @Param('courseId') courseId: string,
    @Body() dto: UpdateCourseDto,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.teacher)
      await this.coursesService.ensureOwnership({
        id: courseId,
        userId: req.user.sub,
        type: 'course',
      });

    const updatedCourse = await this.coursesService.updateCourse(courseId, dto);
    return plainToInstance(
      CourseResponseDto,
      getNoDecimalCourse(updatedCourse),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Delete(Router.Courses.ById)
  @ApiOperation({
    summary: 'Delete a course (creator teacher or staff, not purchased)',
  })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee, Role.teacher)
  @AccessedBy(Permission.COURSES_DELETE, Permission.COURSES_FULL_ACCESS)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCourse(
    @Param('courseId') courseId: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.teacher)
      await this.coursesService.ensureOwnership({
        id: courseId,
        userId: req.user.sub,
        type: 'course',
      });

    await this.coursesService.deleteCourse(courseId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all courses with pagination, search and teacher filter',
  })
  async findAllPublic(@Query() query: FindCoursesQueryDto) {
    const { data, meta } = await this.coursesService.findAllCourses(query);

    return {
      data: plainToInstance(
        CourseResponseDto,
        data.map((item) => getNoDecimalCourse(item)),
        {
          excludeExtraneousValues: true,
        },
      ),
      meta,
    };
  }

  @Get(Router.Courses.ById)
  @ApiOperation({
    summary: 'Get a single course by id (basic details only)',
  })
  async findOne(@Param('courseId') courseId: string) {
    const course = await this.coursesService.findCourseById(courseId);
    return plainToInstance(CourseResponseDto, getNoDecimalCourse(course), {
      excludeExtraneousValues: true,
    });
  }

  @Get(Router.Courses.Detailed)
  @ApiOperation({
    summary:
      'Get a single course by id with modules and lectures (names, descriptions) and teacher details',
  })
  async findOneDetailed(@Param('courseId') courseId: string) {
    const course = await this.coursesService.findCourseDetailedById(courseId);
    return plainToInstance(
      CourseDetailedResponseDto,
      getNoDecimalCourse(course),
      {
        excludeExtraneousValues: true,
      },
    );
  }
}
