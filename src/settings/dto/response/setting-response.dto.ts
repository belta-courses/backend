import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SettingResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  key: string;

  @ApiProperty()
  @Expose()
  value: string;
}
