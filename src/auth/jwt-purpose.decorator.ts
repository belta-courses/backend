import { SetMetadata } from '@nestjs/common';
import { JwtPurpose } from 'src/users/types';

export const JWT_PURPOSE_KEY = 'jwt_purpose';
export const JWTPurpose = (...purposes: JwtPurpose[]) =>
  SetMetadata(JWT_PURPOSE_KEY, purposes);
