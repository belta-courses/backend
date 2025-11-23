import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Param,
  Patch,
  ValidationPipe,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { JwtPayload, JwtPurpose } from 'src/users/users.types';
import { SignInDto } from 'src/users/dto/request/sign-in.dto';
import { plainToInstance } from 'class-transformer';
import { userResponseDtoMap } from 'src/users/dto/response/user-response.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JWTPurposeGuard } from './jwt-purpose.guard';
import { JWTPurpose } from './jwt-purpose.decorator';
import { jwtAuthName } from 'src/config/constants.config';
import { RegisterDto } from './dto/request/register.dto';
import { Permission, permissionsList } from 'src/config/permissions.config';
import { CreateAccessGroupDto } from './dto/request/create-access-group.dto';
import { UpdateAccessGroupDto } from './dto/request/update-access-group.dto';
import { AssignEmployeeToAccessGroupDto } from './dto/request/assign-employee-to-access-group.dto';
import { PermissionsGuard } from './permissions.guard';
import { AccessedBy } from './permissions.decorator';
import { AccessGroupDto } from './dto/response/access-group.dto';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    description:
      'send redirect urls by email with one-time token for login and email for registration',
  })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  @HttpCode(HttpStatus.OK)
  @Post('/sign-in')
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @ApiOperation({
    summary: 'Create my Account',
    description: 'Create account for the one-time token received by email',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
  })
  @ApiBearerAuth(jwtAuthName)
  @UseGuards(AuthGuard, JWTPurposeGuard)
  @JWTPurpose(JwtPurpose.Register)
  @Post('/register')
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
    @Request() request: { user: JwtPayload },
  ) {
    const { email, role } = request['user'];
    const newUser = await this.authService.register({
      ...registerDto,
      email,
      role: role || Role.student,
    });
    return plainToInstance(userResponseDtoMap[newUser.role], newUser, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Get all application permissions' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(jwtAuthName)
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_READ,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @HttpCode(HttpStatus.OK)
  @Get('/permissions')
  getPermissions() {
    return permissionsList;
  }

  @ApiOperation({ summary: 'Get all application access groups' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(jwtAuthName)
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_READ,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @HttpCode(HttpStatus.OK)
  @Get('/access-groups')
  getAccessGroups() {
    return this.authService.getRoles();
  }

  @ApiOperation({ summary: 'Create a new access group' })
  @ApiResponse({ status: HttpStatus.CREATED })
  @ApiBearerAuth(jwtAuthName)
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_CREATE,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @HttpCode(HttpStatus.CREATED)
  @Post('/access-groups')
  createAccessGroup(
    @Body(ValidationPipe) createAccessGroupDto: CreateAccessGroupDto,
  ) {
    return plainToInstance(
      AccessGroupDto,
      this.authService.createAccessGroup(createAccessGroupDto),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @ApiOperation({ summary: 'Update an access group' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(jwtAuthName)
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_UPDATE,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @Patch('/access-groups/:accessGroupId')
  updateAccessGroup(
    @Param('accessGroupId') accessGroupId: string,
    @Body(ValidationPipe) updateAccessGroupDto: UpdateAccessGroupDto,
  ) {
    return plainToInstance(
      AccessGroupDto,
      this.authService.updateAccessGroup(accessGroupId, updateAccessGroupDto),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @ApiOperation({ summary: 'Add an employee to an access group' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(jwtAuthName)
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_ASSIGN,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @Post('/access-groups/:accessGroupId/add-employee')
  async addEmployeeToAccessGroup(
    @Param('accessGroupId') accessGroupId: string,
    @Body(ValidationPipe) dto: AssignEmployeeToAccessGroupDto,
  ) {
    const user = await this.authService.addEmployeeToAccessGroup(
      accessGroupId,
      dto.email,
    );

    return plainToInstance(userResponseDtoMap[user.role], user, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Remove an employee from an access group' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(jwtAuthName)
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_UNASSIGN,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @Delete('/access-groups/remove-employee')
  async removeEmployeeFromAccessGroup(
    @Body(ValidationPipe) dto: AssignEmployeeToAccessGroupDto,
  ) {
    const user = await this.authService.removeEmployeeFromAccessGroup(
      dto.email,
    );

    return plainToInstance(userResponseDtoMap[user.role], user, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Delete an access group' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(jwtAuthName)
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_DELETE,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @Delete('/access-groups/:accessGroupId')
  deleteAccessGroup(@Param('accessGroupId') accessGroupId: string) {
    return this.authService.deleteAccessGroup(accessGroupId);
  }
}
