import { IsEmail, IsNotEmpty, IsUrl } from 'class-validator';

export class SignInDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  login_redirect_url: string;

  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  register_redirect_url: string;
}
