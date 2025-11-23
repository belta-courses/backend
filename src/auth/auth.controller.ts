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
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JWTPurposeGuard } from './jwt-purpose.guard';
import { JWTPurpose } from './jwt-purpose.decorator';
import { jwtAuthName } from 'src/config/constants.config';
import { RegisterDto } from './dto/request/register.dto';
import { Permission, permissionsList } from 'src/config/permissions.config';
import { CreateAccessGroupDto } from './dto/request/create-access-group.dto';
import { UpdateAccessGroupDto } from './dto/request/update-access-group.dto';
import { AssignEmployeeToAccessGroupDto } from './dto/request/assign-employee-to-access-group.dto';
import { UsersService } from 'src/users/users.service';
import { PermissionsGuard } from './permissions.guard';
import { AccessedBy } from './permissions.decorator';
import { AccessGroupDto } from './dto/response/access-group.dto';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'send redirect urls by email with one-time token for login and email for registration',
  })
  @HttpCode(HttpStatus.OK)
  @Post('/sign-in')
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @UseGuards(AuthGuard, JWTPurposeGuard)
  @ApiBearerAuth(jwtAuthName)
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

  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_READ,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All Application permissions',
  })
  @ApiBearerAuth(jwtAuthName)
  @HttpCode(HttpStatus.OK)
  @Get('/permissions')
  getPermissions() {
    return permissionsList;
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_READ,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All Application Access Groups',
  })
  @ApiBearerAuth(jwtAuthName)
  @HttpCode(HttpStatus.OK)
  @Get('/access-groups')
  getAccessGroups() {
    return this.authService.getRoles();
  }

  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_CREATE,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Create Access Group',
  })
  @ApiBearerAuth(jwtAuthName)
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

  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_UPDATE,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Update Access Group',
  })
  @ApiBearerAuth(jwtAuthName)
  @HttpCode(HttpStatus.OK)
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

  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_ASSIGN,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Add Employee to Access Group',
  })
  @ApiBearerAuth(jwtAuthName)
  @HttpCode(HttpStatus.OK)
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

  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_UNASSIGN,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Remove Employee From Access Group',
  })
  @ApiBearerAuth(jwtAuthName)
  @HttpCode(HttpStatus.OK)
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

  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(
    Permission.ACCESS_GROUPS_DELETE,
    Permission.ACCESS_GROUPS_FULL_ACCESS,
  )
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Delete Access Group',
  })
  @ApiBearerAuth(jwtAuthName)
  @HttpCode(HttpStatus.OK)
  @Delete('/access-groups/:accessGroupId')
  deleteAccessGroup(@Param('accessGroupId') accessGroupId: string) {
    return this.authService.deleteAccessGroup(accessGroupId);
  }
}
