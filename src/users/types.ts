import { Role } from '@prisma/client';

export type JwtPurpose = 'register' | null;

export type JwtPayload = {
  sub: string;
  role: Role | null;
  purpose: JwtPurpose;
};
