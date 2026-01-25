import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  HttpStatus,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/request/create-user.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { CreateUserValidationPipe } from './pipes/create-user-validation.pipe';
import { UserResponseDto } from './dto/response/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { Role } from 'src/generated/prisma/client';
import { AuthGuard } from 'src/auth/auth.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtPayload } from './users.types';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { Permission } from 'src/core/config/permissions.config';
import { AccessedBy } from 'src/auth/permissions.decorator';
import { Router } from 'src/core/router';
import { FindUsersQueryDto } from './dto/request/find-users-query.dto';
import { AuthService } from 'src/auth/auth.service';
import { SessionResponseDto } from './dto/response/session-response.dto';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@ApiTags(Router.Users.ApiTag)
@ApiBearerAuth(Router.Integrated.ApiAuthName)
@Controller(Router.Users.Base)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (by Admins only)' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created',
    type: UserResponseDto,
  })
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(Permission.USERS_CREATE, Permission.USERS_FULL_ACCESS)
  async create(
    @Body(CreateUserValidationPipe)
    createUserDto: CreateUserDto,
  ) {
    const newUser = await this.usersService.create(createUserDto);
    return plainToInstance(UserResponseDto, newUser, {
      excludeExtraneousValues: true,
    });
  }

  @Get(Router.Users.List)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'The users have been successfully retrieved',
    type: UserResponseDto,
  })
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(Permission.USERS_READ, Permission.USERS_FULL_ACCESS)
  async findAll(
    @Query()
    { role: queryRole, ...dto }: FindUsersQueryDto,
    @Request() request: { user: JwtPayload },
  ) {
    const user = request['user'];

    if (
      user.role === Role.employee &&
      (queryRole === Role.admin || queryRole === Role.employee)
    ) {
      throw new ForbiddenException(
        'You are not allowed to access this resource',
      );
    }

    const role =
      user.role === Role.employee && !queryRole
        ? [Role.teacher, Role.student]
        : queryRole;

    const { data, meta } = await this.usersService.findAll({
      role,
      ...dto,
    });
    return {
      data: plainToInstance(UserResponseDto, data, {
        excludeExtraneousValues: true,
      }),
      meta,
    };
  }

  @Get(Router.Users.Me)
  @ApiOperation({
    summary: 'Get my profile',
    description: "Get the current user's profile with new Access Token",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user has been successfully retrieved',
    type: UserResponseDto,
  })
  @UseGuards(AuthGuard)
  async getMe(@Request() request: { user: JwtPayload }) {
    const { sub: id } = request['user'];

    const user = await this.usersService.findOne(id);
    const accessToken = await this.authService.generateAccessToken({
      payload: {
        sub: user.id,
        email: user.email,
        role: user.role,
        purpose: null,
      },
    });

    return plainToInstance(
      SessionResponseDto,
      { ...user, accessToken },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  @Patch(Router.Users.Me)
  @ApiOperation({ summary: 'Update my profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The profile has been successfully updated',
    type: UserResponseDto,
  })
  @UseGuards(AuthGuard)
  async updateMe(
    @Body()
    updateUserDto: UpdateUserDto,
    @Request() request: { user: JwtPayload },
  ) {
    const { sub: id } = request['user'];
    const oldUser = await this.usersService.findOne(id);

    const user = await this.usersService.update(
      id,
      new CreateUserValidationPipe().transform({
        ...updateUserDto,
        email: oldUser.email,
        role: oldUser.role,
      }),
    );

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Get(Router.Users.ById)
  @ApiOperation({ summary: 'Get a user by id (by Staffs only)' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully retrieved',
    type: UserResponseDto,
  })
  @ApiParam({
    name: 'id',
    example: '',
  })
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(Permission.USERS_READ, Permission.USERS_FULL_ACCESS)
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(Router.Users.ById)
  @ApiOperation({ summary: 'Update a user by email (by Staffs only)' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated',
    type: UserResponseDto,
  })
  @UseGuards(AuthGuard, RolesGuard, PermissionsGuard)
  @Roles(Role.admin, Role.employee)
  @AccessedBy(Permission.USERS_UPDATE, Permission.USERS_FULL_ACCESS)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() request: { user: JwtPayload },
  ) {
    const oldUser = await this.usersService.findOne(id);

    if (request['user'].role !== Role.admin && oldUser.role === Role.admin) {
      throw new ForbiddenException('You are not allowed to update this user');
    }

    const user = await this.usersService.update(
      id,
      new CreateUserValidationPipe().transform({
        ...updateUserDto,
        email: oldUser.email,
        role: oldUser.role,
      }),
    );

    return plainToInstance(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });
  }
}
