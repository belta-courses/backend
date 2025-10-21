import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/request/create-user.dto';
import { UpdateUserDto } from './dto/request/update-user.dto';
import { PrismaService } from 'src/prisma.service';
import { SignInDto } from './dto/request/sign-in.dto';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './types';
import { devEmails } from 'src/lib/config/dev-vars';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (user) {
      throw new BadRequestException('User already exists');
    }

    const newUser = await this.prisma.user.create({ data: createUserDto });
    const payload: JwtPayload = {
      sub: newUser.email,
      role: newUser.role,
      purpose: null,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return { ...newUser, accessToken };
  }

  async signIn(signInDto: SignInDto) {
    try {
      const user = await this.findOne(signInDto.email);
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

  findAll() {
    return `This action returns all users`;
  }

  async findOne(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return console.log(id, updateUserDto);
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
