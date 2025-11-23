import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  ValidationPipe,
  UseGuards,
  Request,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/request/create-user.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { CreateUserValidationPipe } from './pipes/create-user-validation.pipe';
import {
  StudentUserResponseDto,
  userResponseDtoMap,
} from './dto/response/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { Role } from '@prisma/client';
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

@ApiTags(Router.Users.ApiTag)
@ApiBearerAuth(Router.Integrated.ApiAuthName)
@Controller(Router.Users.Base)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create a new user (by Admins only)' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created',
    type: StudentUserResponseDto,
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(Permission.USERS_CREATE, Permission.USERS_FULL_ACCESS)
  @Post()
  async create(
    @Body(ValidationPipe, CreateUserValidationPipe)
    createUserDto: CreateUserDto,
  ) {
    const newUser = await this.usersService.create(createUserDto);
    return plainToInstance(userResponseDtoMap[newUser.role], newUser, {
      excludeExtraneousValues: true,
    });
  }

  @Get(Router.Users.List)
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Get my profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The user has been successfully retrieved',
    type: StudentUserResponseDto,
  })
  @UseGuards(AuthGuard)
  @Get(Router.Users.Me)
  async getMe(@Request() request: { user: JwtPayload }) {
    const userPayload = request['user'];
    const user = await this.usersService.findOne(userPayload.email);

    return plainToInstance(userResponseDtoMap[user.role], user, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Update my profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The profile has been successfully updated',
    type: StudentUserResponseDto,
  })
  @UseGuards(AuthGuard)
  @Patch(Router.Users.Me)
  async updateMe(
    @Body(ValidationPipe, CreateUserValidationPipe)
    updateUserDto: UpdateUserDto,
    @Request() request: { user: JwtPayload },
  ) {
    const { email } = request['user'];
    const oldUser = await this.usersService.findOne(email);

    const user = await this.usersService.update(
      email,
      new CreateUserValidationPipe().transform({
        ...updateUserDto,
        email,
        role: oldUser.role,
      }),
    );

    return plainToInstance(userResponseDtoMap[user.role], user, {
      excludeExtraneousValues: true,
    });
  }

  @ApiOperation({ summary: 'Get a user by email (by Staffs only)' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully retrieved',
    type: StudentUserResponseDto,
  })
  @ApiParam({
    name: 'email',
    example: 'student@beltacourses.com',
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(Permission.USERS_READ, Permission.USERS_FULL_ACCESS)
  @Get(Router.Users.ByEmail)
  findOne(@Param('email') email: string) {
    return this.usersService.findOne(email);
  }

  @ApiOperation({ summary: 'Update a user by email (by Staffs only)' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated',
    type: StudentUserResponseDto,
  })
  @UseGuards(AuthGuard, PermissionsGuard)
  @AccessedBy(Permission.USERS_UPDATE, Permission.USERS_FULL_ACCESS)
  @Patch(Router.Users.ByEmail)
  async update(
    @Param('email') email: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @Request() request: { user: JwtPayload },
  ) {
    const oldUser = await this.usersService.findOne(email);

    if (request['user'].role !== Role.admin && oldUser.role === Role.admin) {
      throw new ForbiddenException('You are not allowed to update this user');
    }

    const user = await this.usersService.update(
      email,
      new CreateUserValidationPipe().transform({
        ...updateUserDto,
        email,
        role: oldUser.role,
      }),
    );

    return plainToInstance(userResponseDtoMap[user.role], user, {
      excludeExtraneousValues: true,
    });
  }
}
