import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/request/create-user.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { CreateUserValidationPipe } from './pipes/create-user-validation.pipe';
import { userResponseDtoMap } from './dto/response/user-response.dto';
import { plainToInstance } from 'class-transformer';
import { SignInDto } from './dto/request/sign-in.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(
    @Body(ValidationPipe, CreateUserValidationPipe)
    createUserDto: CreateUserDto,
  ) {
    const user = await this.usersService.create(createUserDto);
    return plainToInstance(userResponseDtoMap[user.role], user, {
      excludeExtraneousValues: true,
    });
  }

  @Post('/sign-in')
  // @HttpCode(HttpStatus.NO_CONTENT)
  async signIn(@Body() signInDto: SignInDto) {
    return this.usersService.signIn(signInDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':email')
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
