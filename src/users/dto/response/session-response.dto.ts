import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { UserResponseDto } from './user-response.dto';

export class SessionResponseDto extends UserResponseDto {
  @ApiProperty({
    description: 'new valid access token without expiration',
  })
  @Expose()
  accessToken: string;
}
