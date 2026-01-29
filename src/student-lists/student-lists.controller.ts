import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Router } from 'src/core/router';
import { FindCoursesQueryDto } from 'src/courses/dto/request/find-courses-query.dto';
import { CourseResponseDto } from 'src/courses/dto/response/course-response.dto';
import { JwtPayload } from 'src/users/users.types';
import { plainToInstance } from 'class-transformer';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/generated/prisma/client';
import { getNoDecimalCourse } from 'src/courses/utils/convert-course';
import { StudentListsService } from './student-lists.service';

@ApiTags(Router.StudentLists.ApiTag)
@Controller(Router.StudentLists.Base)
export class StudentListsController {
  constructor(private readonly studentListsService: StudentListsService) {}

  @Get(Router.StudentLists.OwnedLists)
  @ApiOperation({
    summary: 'Get paginated list of courses owned by the authenticated student',
  })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.student)
  async findOwnedCourses(
    @Query() query: FindCoursesQueryDto,
    @Request() req: { user: JwtPayload },
  ) {
    const { data, meta } = await this.studentListsService.findOwnedCourses(
      req.user.sub,
      query,
    );

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

  @Get(Router.StudentLists.SaveLists)
  @ApiOperation({
    summary: 'Get paginated list of courses saved by the authenticated student',
  })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.student)
  async findSavedCourses(
    @Query() query: FindCoursesQueryDto,
    @Request() req: { user: JwtPayload },
  ) {
    const { data, meta } = await this.studentListsService.findSavedCourses(
      req.user.sub,
      query,
    );

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

  @Post(Router.StudentLists.SaveListByCourseId)
  @ApiOperation({
    summary: "Add a course to the authenticated student's save list",
  })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.student)
  @HttpCode(HttpStatus.NO_CONTENT)
  async addCourseToSaveList(
    @Param('courseId') courseId: string,
    @Request() req: { user: JwtPayload },
  ) {
    await this.studentListsService.addCourseToSaveList(req.user.sub, courseId);
  }

  @Delete(Router.StudentLists.SaveListByCourseId)
  @ApiOperation({
    summary: "Remove a course from the authenticated student's save list",
  })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.student)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCourseFromSaveList(
    @Param('courseId') courseId: string,
    @Request() req: { user: JwtPayload },
  ) {
    await this.studentListsService.removeCourseFromSaveList(
      req.user.sub,
      courseId,
    );
  }
}
