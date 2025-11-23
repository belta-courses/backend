import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PermissionDto {
  @ApiProperty({
    description: 'The key of the permission',
    example: 'users:read',
  })
  @Expose()
  key: string;
}
