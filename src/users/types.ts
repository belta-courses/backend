import { Role } from '@prisma/client';

export enum JwtPurpose {
  Register = 'register',
}

export type JwtPayload = {
  sub: string;
  role: Role | null;
  purpose: JwtPurpose | null;
};
