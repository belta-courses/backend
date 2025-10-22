import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { JwtPayload } from 'src/users/types';
import { SignInDto } from 'src/users/dto/request/sign-in.dto';
import { plainToInstance } from 'class-transformer';
import { userResponseDtoMap } from 'src/users/dto/response/user-response.dto';
import { CreateUserDto } from 'src/users/dto/request/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @UseGuards(AuthGuard)
  @Post('/register')
  async register(
    @Body() createUserDto: CreateUserDto,
    @Request() request: { user: JwtPayload },
  ) {
    const userPayload = request['user'];

    if (
      userPayload.purpose !== 'register' ||
      userPayload.sub !== createUserDto.email
    )
      throw new UnauthorizedException();

    const newUser = await this.authService.register(createUserDto);
    return plainToInstance(userResponseDtoMap[newUser.role], newUser, {
      excludeExtraneousValues: true,
    });
  }

  @UseGuards(AuthGuard)
  @Get('/me')
  async getMe(@Request() request: { user: JwtPayload }) {
    const userPayload = request['user'];
    const user = await this.authService.getMe(userPayload.sub);

    return plainToInstance(userResponseDtoMap[user.role], user, {
      excludeExtraneousValues: true,
    });
  }
}
