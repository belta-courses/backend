import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, Role } from '@prisma/client';
import { JwtPayload } from 'src/users/types';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { PrismaService } from 'src/prisma.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prismaService: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions) {
      return true;
    }
    const {
      user: { role, sub: email },
    } = context.switchToHttp().getRequest<{ user: JwtPayload }>();

    if (role === Role.admin) return true;
    // student or teacher => false
    if (role !== Role.employee) return false;

    try {
      const user = await this.usersService.findOne(email);

      if (!user.accessGroupId) return false;

      const accessGroup = await this.prismaService.accessGroup.findUnique({
        where: { id: user.accessGroupId },
        include: { permissions: true },
      });

      return (
        accessGroup?.permissions.some((permission) =>
          requiredPermissions.includes(permission.key as unknown as Permission),
        ) || false
      );
    } catch (ignore) {
      return false;
    }
  }
}
