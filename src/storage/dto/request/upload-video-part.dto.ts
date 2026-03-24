import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';

export class UploadVideoPartDto {
  @ApiProperty({
    description: 'The id of the upload',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'The part number',
    example: 1,
  })
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  partNumber: number;
}
