import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Max } from 'class-validator';

export class InitVideoUploadDto {
  @ApiProperty({
    description: 'The name of the video',
    example: 'video.mp4',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The size of the video',
    example: 1000,
  })
  @IsNumber()
  @IsNotEmpty()
  @Max(1024 * 1024 * 100)
  size: number;
}
