import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UseGuards,
  Request,
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
import { jwtAuthName } from 'src/config/constants.config';
import { RolesGuard } from 'src/auth/role.guard';
import { Roles } from 'src/auth/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth(jwtAuthName)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.admin)
  @ApiOperation({ summary: 'Create a new user (by Admins only' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created',
    type: StudentUserResponseDto,
  })
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

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.admin, Role.employee)
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
  @Get('/:email')
  findOne(@Param('email') email: string) {
    return this.usersService.findOne(email);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
