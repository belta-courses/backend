import { SetMetadata } from '@nestjs/common';
import { Permission } from 'src/core/config/permissions.config';

export const PERMISSIONS_KEY = 'permissions';
export const AccessedBy = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
