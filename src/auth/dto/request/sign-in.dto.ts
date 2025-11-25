import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsUrl } from 'class-validator';

export class SignInDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'student@beltacourses.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'the redirect url if user exists',
    example: 'https://www.beltacourses.com/login',
  })
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  login_redirect_url: string;

  @ApiProperty({
    description: 'the redirect url if user does not exist',
    example: 'https://www.beltacourses.com/register',
  })
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  register_redirect_url: string;
}
