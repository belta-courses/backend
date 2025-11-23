import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { PermissionDto } from './permission.dto';

export class AccessGroupDto {
  @ApiProperty({
    description: 'The id of the access group',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'The name of the access group',
    example: 'Admin',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'The description of the access group',
    example: 'Access to all application resources',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'The permissions of the access group',
    example: ['users:read', 'users:write'],
  })
  @Expose()
  @Transform(({ value }: { value?: PermissionDto[] }) =>
    value?.map((p) => p.key),
  )
  permissions: string[];
}
