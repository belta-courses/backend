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

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });
    if (user) {
      throw new BadRequestException('User already exists');
    }

    return this.prisma.user.create({ data: createUserDto });
  }

  async signIn(signInDto: SignInDto) {
    try {
      await this.mail.sendTemplate({
        to: signInDto.email,
        name: 'confirm-login',
        data: {
          name: 'Beltagy',
          confirmUrl: 'https://www.google.com',
          expirIn: '10',
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        await this.mail.sendTemplate({
          to: signInDto.email,
          name: 'new-user',
          data: {
            name: 'Beltagy',
            confirmUrl: 'https://www.google.com',
          },
        });
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
