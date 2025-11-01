import { SetMetadata } from '@nestjs/common';
import { JwtPurpose } from 'src/users/types';

export const JWT_PURPOSE_KEY = 'jwt_purpose';
export const JWTPurpose = (purpose: JwtPurpose) =>
  SetMetadata(JWT_PURPOSE_KEY, purpose);
