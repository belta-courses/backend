import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

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

  @ApiProperty()
  @Expose()
  @Transform(
    ({ value }: { value: { url: string } | null }) => value?.url ?? null,
  )
  @Expose()
  video: string | null;

  @ApiProperty()
  @Expose()
  demo: boolean;
}
