import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Permission } from 'src/config/permissions.config';

export class CreateAccessGroupDto {
  @ApiProperty({
    example: 'Admin',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Access to all application resources',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'The permissions list of the access group',
    example: ['courses.create', 'users.read'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsEnum(Permission, { each: true, message: 'Invalid permission' })
  permissions?: string[];
}
