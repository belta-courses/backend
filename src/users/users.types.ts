import { Role } from '@prisma/client';

export enum JwtPurpose {
  Register = 'register',
}

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role | null;
  iat: number;
  purpose: JwtPurpose | null;
};
