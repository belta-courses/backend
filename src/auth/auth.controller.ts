import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { JwtPayload } from 'src/users/types';
import { SignInDto } from 'src/users/dto/request/sign-in.dto';
import { plainToInstance } from 'class-transformer';
import { userResponseDtoMap } from 'src/users/dto/response/user-response.dto';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JWTPurposeGuard } from './jwt-purpose.guard';
import { JWTPurpose } from './jwt-purpose.decorator';
import { jwtAuthName } from 'src/config/constants.config';
import { RegisterDto } from './dto/request/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  @JWTPurpose('register')
  @Post('/register')
  async register(
    @Body() createUserDto: RegisterDto,
    @Request() request: { user: JwtPayload },
  ) {
    const userPayload = request['user'];

    if (userPayload.sub !== createUserDto.email)
      throw new BadRequestException('Email mismatch');

    const newUser = await this.authService.register(createUserDto);
    return plainToInstance(userResponseDtoMap[newUser.role], newUser, {
      excludeExtraneousValues: true,
    });
  }
}
