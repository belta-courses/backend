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
  Delete,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { JwtPayload, JwtPurpose } from 'src/users/users.types';
import { SignInDto } from 'src/auth/dto/request/sign-in.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from 'src/users/dto/response/user-response.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JWTPurposeGuard } from './jwt-purpose.guard';
import { JWTPurpose } from './jwt-purpose.decorator';
import { RegisterDto } from './dto/request/register.dto';
import {
  Permission,
  permissionsList,
} from 'src/core/config/permissions.config';
import { CreateAccessGroupDto } from './dto/request/create-access-group.dto';
import { UpdateAccessGroupDto } from './dto/request/update-access-group.dto';
import { PermissionsGuard } from './permissions.guard';
import { AccessedBy } from './permissions.decorator';
import { AccessGroupDto } from './dto/response/access-group.dto';
import { Role } from 'src/generated/prisma/client';
import { Router } from 'src/core/router';
import { AdminSignInDto } from './dto/request/admin-sign-in.dto';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@ApiTags(Router.Auth.ApiTag)
@Controller(Router.Auth.Base)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(Router.Auth.SignIn)
  @ApiOperation({
    description:
      'send redirect urls by email with one-time token for registration and regular token for login',
  })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Post(Router.Auth.AdminSignIn)
  @ApiOperation({
    description:
      'Sign in for only Admin and Employee, without register redirect url',
  })
  @ApiResponse({
    status: HttpStatus.OK,
  })
  @HttpCode(HttpStatus.OK)
  async adminSignIn(@Body() signInDto: AdminSignInDto) {
    try {
      const res = await this.authService.signIn(signInDto, [
        Role.admin,
        Role.employee,
      ]);
      return res;
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new UnauthorizedException('Invalid user email');

      throw error;
    }
  }

  @Post(Router.Auth.Register)
  @ApiOperation({
    summary: 'Create my Account',
    description: 'Create account for the one-time token received by email',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
  })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, JWTPurposeGuard)
  @JWTPurpose(JwtPurpose.Register)
  async register(
    @Body() registerDto: RegisterDto,
    @Request() request: { user: JwtPayload },
  ) {
    const { email, role } = request['user'];
    const newUser = await this.authService.register({
      ...registerDto,
      email,
      role: role || Role.student,
    });
    return plainToInstance(UserResponseDto, newUser, {
      excludeExtraneousValues: true,
    });
  }

  @Get(Router.Auth.Permissions)
  @ApiOperation({ summary: 'Get all application permissions' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(
    Permission.ACCESS_GROUPS_READ,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  getPermissions() {
    return permissionsList;
  }

  @Get(Router.Auth.AccessGroups.Base)
  @ApiOperation({ summary: 'Get all application access groups' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(
    Permission.ACCESS_GROUPS_READ,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  getAccessGroups() {
    return this.authService.getRoles();
  }

  @Post(Router.Auth.AccessGroups.Base)
  @ApiOperation({ summary: 'Create a new access group' })
  @ApiResponse({ status: HttpStatus.CREATED })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(
    Permission.ACCESS_GROUPS_CREATE,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  createAccessGroup(@Body() createAccessGroupDto: CreateAccessGroupDto) {
    return plainToInstance(
      AccessGroupDto,
      this.authService.createAccessGroup(createAccessGroupDto),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Patch(Router.Auth.AccessGroups.ById)
  @ApiOperation({ summary: 'Update an access group' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_UPDATE,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  updateAccessGroup(
    @Param('accessGroupId') accessGroupId: string,
    @Body() updateAccessGroupDto: UpdateAccessGroupDto,
  ) {
    return plainToInstance(
      AccessGroupDto,
      this.authService.updateAccessGroup(accessGroupId, updateAccessGroupDto),
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Post(Router.Auth.AccessGroups.AddEmployee)
  @ApiOperation({ summary: 'Add an employee to an access group' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(
    Permission.ACCESS_GROUPS_ASSIGN,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  async addEmployeeToAccessGroup(
    @Param('accessGroupId') accessGroupId: string,
    @Param('userId') userId: string,
  ) {
    const user = await this.authService.addEmployeeToAccessGroup(
      accessGroupId,
      userId,
    );

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(Router.Auth.AccessGroups.RemoveEmployee)
  @ApiOperation({ summary: 'Remove an employee from an access group' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(
    Permission.ACCESS_GROUPS_UNASSIGN,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  async removeEmployeeFromAccessGroup(@Param('userId') userId: string) {
    const user = await this.authService.removeEmployeeFromAccessGroup(userId);

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(Router.Auth.AccessGroups.ById)
  @ApiOperation({ summary: 'Delete an access group' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(
    Permission.ACCESS_GROUPS_DELETE,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  deleteAccessGroup(@Param('accessGroupId') accessGroupId: string) {
    return this.authService.deleteAccessGroup(accessGroupId);
  }
}
