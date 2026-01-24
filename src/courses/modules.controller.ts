import {
  Body,
  Controller,
  Delete,
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
import { CreateModuleDto } from './dto/request/create-module.dto';
import { UpdateModuleDto } from './dto/request/update-module.dto';
import { Role } from 'src/generated/prisma/client';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { AccessedBy } from 'src/auth/permissions.decorator';
import { Permission } from 'src/core/config/permissions.config';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@ApiTags('Modules')
@ApiBearerAuth(Router.Integrated.ApiAuthName)
@UseGuards(AuthGuard)
@Controller('modules')
export class ModulesController {
  constructor(private readonly coursesService: CoursesService) {}

  @ApiOperation({
    summary: 'Create a module inside a course for the authenticated teacher',
  })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.teacher)
  @Post('course/:courseId')
  async createMyModule(
    @Param('courseId') courseId: string,
    @Body() dto: CreateModuleDto,
    @Request() req: { user: JwtPayload },
  ) {
    await this.coursesService.ensureOwnership({
      id: courseId,
      userId: req.user.sub,
      type: 'course',
    });

    const module = await this.coursesService.createModule(courseId, dto);
    return module;
  }

  @ApiOperation({
    summary: 'Create a module inside any course (admin/employee)',
  })
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(Permission.MODULES_CREATE, Permission.MODULES_FULL_ACCESS)
  @Post('admin/course/:courseId')
  async createModuleForCourse(
    @Param('courseId') courseId: string,
    @Body() dto: CreateModuleDto,
  ) {
    const module = await this.coursesService.createModule(courseId, dto);
    return module;
  }

  @ApiOperation({
    summary: 'Update a module (creator teacher or staff)',
  })
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee, Role.teacher)
  @AccessedBy(Permission.MODULES_UPDATE, Permission.MODULES_FULL_ACCESS)
  @Patch(':moduleId')
  async updateModule(
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateModuleDto,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.teacher)
      await this.coursesService.ensureOwnership({
        id: moduleId,
        userId: req.user.sub,
        type: 'module',
      });

    const module = await this.coursesService.updateModule(moduleId, dto);
    return module;
  }

  @ApiOperation({
    summary: 'Delete a module (creator teacher or staff)',
  })
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee, Role.teacher)
  @AccessedBy(Permission.MODULES_DELETE, Permission.MODULES_FULL_ACCESS)
  @Delete(':moduleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteModule(
    @Param('moduleId') moduleId: string,
    @Request() req: { user: JwtPayload },
  ) {
    if (req.user.role === Role.teacher)
      await this.coursesService.ensureOwnership({
        id: moduleId,
        userId: req.user.sub,
        type: 'module',
      });

    await this.coursesService.deleteModule(moduleId);
  }
}
