import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsUrl } from 'class-validator';

export class AdminSignInDto {
  @ApiProperty({
    description: 'The email of the user',
    example: 'employee@beltacourses.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'the redirect url to login',
    example: 'https://www.beltacourses.com/login',
  })
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  login_redirect_url: string;
}
