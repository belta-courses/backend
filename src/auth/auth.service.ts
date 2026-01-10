import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SignInDto } from 'src/auth/dto/request/sign-in.dto';
import { UsersService } from 'src/users/users.service';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, JwtPurpose } from 'src/users/users.types';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from 'src/core/config/config.type';
import { devEmails } from 'src/core/constants/auth.constants';
import { PrismaService } from 'src/prisma.service';
import { CreateAccessGroupDto } from './dto/request/create-access-group.dto';
import { UpdateAccessGroupDto } from './dto/request/update-access-group.dto';
import { Role } from '@prisma/client';
import { CreateUserDto } from 'src/users/dto/request/create-user.dto';
import { AdminSignInDto } from './dto/request/admin-sign-in.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mail: MailService,
    private readonly configService: ConfigService<AllConfig>,
    private readonly prismaService: PrismaService,
  ) {}

  async generateAccessToken({
    payload,
    expiresIn,
  }: {
    payload: JwtPayload;
    expiresIn?: string;
  }) {
    return this.jwtService.signAsync(
      payload,
      expiresIn
        ? {
            expiresIn: parseInt(expiresIn),
          }
        : undefined,
    );
  }

  async signIn(signInDto: SignInDto | AdminSignInDto, roles?: Role[]) {
    const nodeEnv = this.configService.get('app.nodeEnv', {
      infer: true,
    });

    try {
      const user = await this.usersService.findOneByEmail(
        signInDto.email,
        roles?.length ? { role: { in: roles } } : undefined,
      );

      const accessToken = await this.generateAccessToken({
        payload: {
          sub: user.id,
          email: user.email,
          role: user.role,
          purpose: null,
        },
        expiresIn: '10m',
      });

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
      if (
        error instanceof NotFoundException &&
        signInDto instanceof SignInDto
      ) {
        const oneTimeToken = await this.generateAccessToken({
          payload: {
            sub: 'new-user',
            email: signInDto.email,
            role: null,
            purpose: JwtPurpose.Register,
          },
        });

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

  async register(createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  async getRoles() {
    const roles = await this.prismaService.accessGroup.findMany({
      include: { permissions: true },
      orderBy: { created_at: 'desc' },
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

  async addEmployeeToAccessGroup(accessGroupId: string, userId: string) {
    const oldUser = await this.usersService.findOne(userId);

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
      where: { id: userId },
      data: { accessGroupId },
      include: { accessGroup: true },
    });
    return user;
  }

  async removeEmployeeFromAccessGroup(userId: string) {
    await this.usersService.findOne(userId);

    const user = await this.prismaService.user.update({
      where: { id: userId },
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
