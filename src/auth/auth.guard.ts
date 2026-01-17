import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { jwtConstants } from 'src/core/constants/auth.constants';
import { Router } from 'src/core/router';
import { UsersService } from 'src/users/users.service';
import { JwtPayload } from 'src/users/users.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new UnauthorizedException();

    try {
      const jwtPayload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: jwtConstants.secret,
      });
      if (!this.isRevalidateUserRoute(request)) {
        await this.checkUserPermissionsChange(jwtPayload);
      }

      request['user'] = jwtPayload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private isRevalidateUserRoute(request: Request): boolean {
    return (
      request.url === `/${Router.Users.Base}/${Router.Users.Me}` &&
      request.method === 'GET'
    );
  }

  private async checkUserPermissionsChange({ iat, sub, role }: JwtPayload) {
    if (role === Role.employee) {
      if (!iat) throw new UnauthorizedException();

      const user = await this.usersService.findOne(sub);
      // check if there is a change, mostlye due to assigne/unassigne to access group
      if (iat < user.updated_at.getTime() / 1000) {
        throw new UnauthorizedException();
      }
      // check if there is a change in access group, mostly due to change in permissions
      if (iat < (user.accessGroup?.updated_at?.getTime() ?? 0) / 1000) {
        throw new UnauthorizedException();
      }
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
