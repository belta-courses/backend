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
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/auth/auth.guard';
import { Router } from 'src/core/router';
import { CoursesService } from './courses.service';
import { JwtPayload } from 'src/users/users.types';
import { CreateLectureDto } from './dto/request/create-lecture.dto';
import { UpdateLectureDto } from './dto/request/update-lecture.dto';
import { plainToInstance } from 'class-transformer';
import { LectureResponseDto } from './dto/response/lecture-response.dto';
import { Role } from 'src/generated/prisma/client';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { AccessedBy } from 'src/auth/permissions.decorator';
import { Permission } from 'src/core/config/permissions.config';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@ApiTags(Router.Lectures.ApiTag)
@Controller(Router.Lectures.Base)
export class LecturesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post(Router.Lectures.ByModuleId)
  @ApiOperation({
    summary: 'Create a lecture inside a module for the authenticated teacher',
  })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.teacher)
  async createMyLecture(
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateLectureDto,
    @Request() req: { user: JwtPayload },
  ) {
    await this.coursesService.ensureOwnership({
      id: moduleId,
      userId: req.user.sub,
      type: 'module',
    });

    const lecture = await this.coursesService.createLecture(moduleId, dto);
    return plainToInstance(LectureResponseDto, lecture, {
      excludeExtraneousValues: true,
    });
  }

  @Post(Router.Lectures.AdminByModuleId)
  @ApiOperation({
    summary: 'Create a lecture inside any module (admin/employee)',
  })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(Permission.LECTURES_CREATE, Permission.LECTURES_FULL_ACCESS)
  async createLectureForModule(
    @Param('moduleId') moduleId: string,
    @Body() dto: CreateLectureDto,
  ) {
    const lecture = await this.coursesService.createLecture(moduleId, dto);
    return plainToInstance(LectureResponseDto, lecture, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(Router.Lectures.ById)
  @ApiOperation({
    summary: 'Update a lecture (creator teacher or staff)',
  })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee, Role.teacher)
  @AccessedBy(Permission.LECTURES_UPDATE, Permission.LECTURES_FULL_ACCESS)
  async updateLecture(
    @Param('lectureId') lectureId: string,
    @Body() dto: UpdateLectureDto,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.teacher)
      await this.coursesService.ensureOwnership({
        id: lectureId,
        userId: req.user.sub,
        type: 'lecture',
      });

    const lecture = await this.coursesService.updateLecture(lectureId, dto);
    return plainToInstance(LectureResponseDto, lecture, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(Router.Lectures.ById)
  @ApiOperation({
    summary: 'Delete a lecture (creator teacher or staff)',
  })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee, Role.teacher)
  @AccessedBy(Permission.LECTURES_DELETE, Permission.LECTURES_FULL_ACCESS)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLecture(
    @Param('lectureId') lectureId: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.teacher)
      await this.coursesService.ensureOwnership({
        id: lectureId,
        userId: req.user.sub,
        type: 'lecture',
      });

    await this.coursesService.deleteLecture(lectureId);
  }

  @Get(Router.Lectures.ById)
  @ApiOperation({
    summary: 'Get a single lecture by id (public)',
  })
  async findLecture(@Param('lectureId') lectureId: string) {
    const lecture = await this.coursesService.findLectureById(lectureId);
    return plainToInstance(LectureResponseDto, lecture, {
      excludeExtraneousValues: true,
    });
  }
}
