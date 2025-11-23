import { Injectable, NotFoundException } from '@nestjs/common';
import { SignInDto } from 'src/users/dto/request/sign-in.dto';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/users/types';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from 'src/config/config.type';
import { devEmails } from 'src/config/constants.config';
import { RegisterDto } from './dto/request/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
    private readonly configService: ConfigService<AllConfig>,
  ) {}

  async signIn(signInDto: SignInDto) {
    const nodeEnv = this.configService.get('app.nodeEnv', {
      infer: true,
    });

    try {
      const user = await this.usersService.findOne(signInDto.email);
      const payload: JwtPayload = {
        sub: user.email,
        role: user.role,
        purpose: null,
      };
      const accessToken = await this.jwtService.signAsync(payload);

      if (nodeEnv !== 'production' && devEmails.includes(signInDto.email)) {
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

        if (nodeEnv !== 'production' && devEmails.includes(signInDto.email)) {
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

  async register(createUserDto: RegisterDto) {
    return this.usersService.create(createUserDto);
  }
}
