import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UploadResponseDto {
  @ApiProperty({
    description: 'The metadata id',
    type: String,
    format: 'uuid',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'The file url on s3',
    type: String,
    format: 'uri',
  })
  @Expose()
  url: string;
}
