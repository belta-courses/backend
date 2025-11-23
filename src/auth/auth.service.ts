import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SignInDto } from 'src/users/dto/request/sign-in.dto';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, JwtPurpose } from 'src/users/types';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from 'src/config/config.type';
import { devEmails } from 'src/config/constants.config';
import { RegisterDto } from './dto/request/register.dto';
import { PrismaService } from 'src/prisma.service';
import { CreateAccessGroupDto } from './dto/request/create-access-group.dto';
import { UpdateAccessGroupDto } from './dto/request/update-access-group.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
    private readonly configService: ConfigService<AllConfig>,
    private readonly prismaService: PrismaService,
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
          purpose: JwtPurpose.Register,
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

  async getRoles() {
    const roles = await this.prismaService.accessGroup.findMany({
      include: { permissions: true },
    });
    return roles;
  }

  async createAccessGroup(createAccessGroupDto: CreateAccessGroupDto) {
    const { name, description, permissions } = createAccessGroupDto;

    const accessGroup = await this.prismaService.accessGroup.create({
      data: {
        name,
        description,
      },
    });

    if (!permissions || permissions.length === 0) return accessGroup;

    await this.prismaService.permission.createMany({
      data: permissions.map((permission) => ({
        key: permission,
        accessGroupId: accessGroup.id,
      })),
    });

    const newAccessGroup = await this.prismaService.accessGroup.findUnique({
      where: { id: accessGroup.id },
      include: { permissions: true },
    });
    return newAccessGroup;
  }

  async updateAccessGroup(
    accessGroupId: string,
    updateAccessGroupDto: UpdateAccessGroupDto,
  ) {
    const { name, description, permissions } = updateAccessGroupDto;
    const accessGroup = await this.prismaService.accessGroup.update({
      where: { id: accessGroupId },
      data: { name, description },
    });

    if (!accessGroup) {
      throw new NotFoundException('Access group not found');
    }

    if (!permissions) return accessGroup;

    await this.prismaService.permission.deleteMany({
      where: { accessGroupId },
    });

    await this.prismaService.permission.createMany({
      data: permissions.map((permission) => ({
        key: permission,
        accessGroupId: accessGroup.id,
      })),
    });

    const updatedAccessGroup = await this.prismaService.accessGroup.findUnique({
      where: { id: accessGroup.id },
      include: { permissions: true },
    });
    return updatedAccessGroup;
  }

  async addEmployeeToAccessGroup(accessGroupId: string, email: string) {
    const oldUser = await this.usersService.findOne(email);

    if (oldUser.role !== Role.employee)
      throw new BadRequestException(
        "You can't add non-employee user to access group",
      );

    if (oldUser.accessGroupId)
      throw new BadRequestException('User is already in an access group');

    const accessGroup = await this.prismaService.accessGroup.findUnique({
      where: { id: accessGroupId },
    });
    if (!accessGroup) {
      throw new NotFoundException('Access group not found');
    }

    const user = await this.prismaService.user.update({
      where: { email },
      data: { accessGroupId },
      include: { accessGroup: true },
    });
    return user;
  }

  async removeEmployeeFromAccessGroup(email: string) {
    await this.usersService.findOne(email);

    const user = await this.prismaService.user.update({
      where: { email },
      data: { accessGroupId: null },
    });

    const cover = user.coverId
      ? await this.prismaService.file.findUnique({
          where: { id: user.coverId },
        })
      : null;

    return { ...user, coverId: undefined, cover: cover?.url };
  }

  async deleteAccessGroup(accessGroupId: string) {
    const accessGroup = await this.prismaService.accessGroup.findUnique({
      where: { id: accessGroupId },
      include: { users: true, permissions: true },
    });
    if (!accessGroup) {
      throw new NotFoundException('Access group not found');
    }

    // delete all users with this access group
    await this.prismaService.user.updateMany({
      where: { id: { in: accessGroup.users.map((user) => user.id) } },
      data: { accessGroupId: null },
    });

    // delete all permissions with this access group
    await this.prismaService.permission.deleteMany({
      where: { accessGroupId },
    });

    // delete the access group
    await this.prismaService.accessGroup.delete({
      where: { id: accessGroupId },
    });
  }
}
