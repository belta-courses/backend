import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { PaginationDto } from 'src/core/dto/pagination.dto';

export class GetPayoutHistoryQueryDto extends PaginationDto {
  @ApiProperty({
    example: '',
  })
  @IsString()
  userId: string;
}
