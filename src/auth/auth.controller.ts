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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { JwtPayload, JwtPurpose } from 'src/users/users.types';
import { SignInDto } from 'src/users/dto/request/sign-in.dto';
import { plainToInstance } from 'class-transformer';
import { userResponseDtoMap } from 'src/users/dto/response/user-response.dto';
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
import { AssignEmployeeToAccessGroupDto } from './dto/request/assign-employee-to-access-group.dto';
import { PermissionsGuard } from './permissions.guard';
import { AccessedBy } from './permissions.decorator';
import { AccessGroupDto } from './dto/response/access-group.dto';
import { Role } from '@prisma/client';
import { Router } from 'src/core/router';

@ApiTags(Router.Auth.ApiTag)
@Controller(Router.Auth.Base)
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
  @Post(Router.Auth.SignIn)
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
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, JWTPurposeGuard)
  @JWTPurpose(JwtPurpose.Register)
  @Post(Router.Auth.Register)
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
    return plainToInstance(userResponseDtoMap[newUser.role], newUser, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Get all application permissions' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_READ,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @HttpCode(HttpStatus.OK)
  @Get(Router.Auth.Permissions)
  getPermissions() {
    return permissionsList;
  }

  @ApiOperation({ summary: 'Get all application access groups' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_READ,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @HttpCode(HttpStatus.OK)
  @Get(Router.Auth.AccessGroups.Base)
  getAccessGroups() {
    return this.authService.getRoles();
  }

  @ApiOperation({ summary: 'Create a new access group' })
  @ApiResponse({ status: HttpStatus.CREATED })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_CREATE,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @HttpCode(HttpStatus.CREATED)
  @Post(Router.Auth.AccessGroups.Base)
  createAccessGroup(@Body() createAccessGroupDto: CreateAccessGroupDto) {
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
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_UPDATE,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @Patch(Router.Auth.AccessGroups.ById)
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

  @ApiOperation({ summary: 'Add an employee to an access group' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_ASSIGN,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @Post(Router.Auth.AccessGroups.AddEmployee)
  async addEmployeeToAccessGroup(
    @Param('accessGroupId') accessGroupId: string,
    @Body() dto: AssignEmployeeToAccessGroupDto,
  ) {
    const user = await this.authService.addEmployeeToAccessGroup(
      accessGroupId,
      dto.id,
    );

    return plainToInstance(userResponseDtoMap[user.role], user, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Remove an employee from an access group' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_UNASSIGN,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @Delete(Router.Auth.AccessGroups.RemoveEmployee)
  async removeEmployeeFromAccessGroup(
    @Body() dto: AssignEmployeeToAccessGroupDto,
  ) {
    const user = await this.authService.removeEmployeeFromAccessGroup(dto.id);

    return plainToInstance(userResponseDtoMap[user.role], user, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Delete an access group' })
  @ApiResponse({ status: HttpStatus.OK })
  @ApiBearerAuth(Router.Integrated.ApiAuthName)
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_DELETE,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @Delete(Router.Auth.AccessGroups.ById)
  deleteAccessGroup(@Param('accessGroupId') accessGroupId: string) {
    return this.authService.deleteAccessGroup(accessGroupId);
  }
}
