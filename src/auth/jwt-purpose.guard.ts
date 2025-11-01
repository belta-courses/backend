import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtPayload, JwtPurpose } from 'src/users/types';
import { JWT_PURPOSE_KEY } from './jwt-purpose.decorator';

@Injectable()
export class JWTPurposeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPurpose = this.reflector.getAllAndOverride<JwtPurpose[]>(
      JWT_PURPOSE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPurpose) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    return requiredPurpose.some((purpose) => purpose === user.purpose);
  }
}
