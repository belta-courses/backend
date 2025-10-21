import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/request/create-user.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { CreateUserValidationPipe } from './pipes/create-user-validation.pipe';
import { userResponseDtoMap } from './dto/response/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { SignInDto } from './dto/request/sign-in.dto';
import { AuthGuard } from 'src/lib/guards/auth.guard';
import { JwtPayload } from './types';
import { Role } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(
    @Body(ValidationPipe, CreateUserValidationPipe)
    createUserDto: CreateUserDto,
    @Request() request: { user: JwtPayload },
  ) {
    const userPayload = request['user'];

    if (
      (userPayload.purpose !== 'register' ||
        userPayload.sub !== createUserDto.email) &&
      userPayload.role !== Role.admin
    )
      throw new UnauthorizedException();

    const newUser = await this.usersService.create(createUserDto);
    return plainToInstance(userResponseDtoMap[newUser.role], newUser, {
      excludeExtraneousValues: true,
    });
  }

  @Post('/sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto) {
    return this.usersService.signIn(signInDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard)
  @Get('/me')
  async getMe(@Request() request: { user: JwtPayload }) {
    const userPayload = request['user'];
    const user = await this.usersService.findOne(userPayload.sub);

    return plainToInstance(userResponseDtoMap[user.role], user, {
      excludeExtraneousValues: true,
    });
  }

  @UseGuards(AuthGuard)
  @Get('/:email')
  findOne(
    @Param('email') email: string,
    @Request() request: { user: JwtPayload },
  ) {
    const userPayload = request['user'];
    if (userPayload.role !== Role.admin && userPayload.role !== Role.employee)
      throw new UnauthorizedException();

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
