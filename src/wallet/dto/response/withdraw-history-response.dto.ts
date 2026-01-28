import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { WithdrawStatus } from 'src/generated/prisma/enums';

export class WithdrawHistoryResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  status: WithdrawStatus;

  @ApiProperty()
  @Expose()
  note: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}
