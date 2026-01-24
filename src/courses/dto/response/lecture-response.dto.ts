import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class LectureResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  description: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  duration: string | null;

  @ApiProperty()
  @Expose()
  content: string;

  @ApiProperty({ required: false, nullable: true })
  @Expose()
  videoId: string | null;

  @ApiProperty()
  @Expose()
  demo: boolean;
}
