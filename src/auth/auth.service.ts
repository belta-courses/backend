import { Injectable, NotFoundException } from '@nestjs/common';
import { SignInDto } from 'src/users/dto/request/sign-in.dto';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/users/types';
import { devEmails } from 'src/lib/config/dev-vars';
import { CreateUserDto } from 'src/users/dto/request/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
  ) {}

  async signIn(signInDto: SignInDto) {
    try {
      const user = await this.usersService.findOne(signInDto.email);
      const payload: JwtPayload = {
        sub: user.email,
        role: user.role,
        purpose: null,
      };
      const accessToken = await this.jwtService.signAsync(payload);

      if (
        process.env.NODE_ENV !== 'production' &&
        devEmails.includes(signInDto.email)
      ) {
        return { accessToken };
      } else {
        await this.mail.sendTemplate({
          to: signInDto.email,
          name: 'confirm-login',
          data: {
            name: 'Beltagy',
            confirmUrl: signInDto.login_redirect_url + `?token=${accessToken}`,
            expirIn: '10',
          },
        });
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        const payload: JwtPayload = {
          sub: signInDto.email,
          role: null,
          purpose: 'register',
        };
        const oneTimeToken = await this.jwtService.signAsync(payload);

        if (
          process.env.NODE_ENV !== 'production' &&
          devEmails.includes(signInDto.email)
        ) {
          return { oneTimeToken };
        } else {
          await this.mail.sendTemplate({
            to: signInDto.email,
            name: 'new-user',
            data: {
              name: 'Beltagy',
              confirmUrl:
                signInDto.register_redirect_url +
                `?token=${oneTimeToken}&email=${signInDto.email}`,
            },
          });
        }
      } else {
        throw error;
      }
    }
  }

  async register(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  async getMe(email: string) {
    return this.usersService.findOne(email);
  }
}
