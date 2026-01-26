import {
  Body,
  Controller,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { PurchaseCourseDto } from './dto/request/purchase-course.dto';
import { PurchaseResponseDto } from './dto/response/purchase-response.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/generated/prisma/client';
import { Router } from 'src/core/router';
import { JwtPayload } from 'src/users/users.types';

@ApiTags(Router.Purchases.ApiTag)
@ApiBearerAuth(Router.Integrated.ApiAuthName)
@Controller(Router.Purchases.Base)
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.student)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post(Router.Purchases.CourseById)
  @ApiOperation({ summary: 'Purchase a course' })
  @ApiParam({
    name: 'courseId',
    description: 'Course ID to purchase',
  })
  @ApiResponse({
    status: 200,
    description: 'Purchase initiated successfully',
    type: PurchaseResponseDto,
  })
  async purchaseCourse(
    @Param('courseId') courseId: string,
    @Body() dto: PurchaseCourseDto,
    @Request() request: { user: JwtPayload },
  ) {
    const { sub: studentId } = request.user;
    return this.purchasesService.initiatePurchase(courseId, studentId, dto);
  }
}
