import { ApiProperty } from '@nestjs/swagger';
import { RefundStatus, TransactionStatus } from 'src/generated/prisma/client';

export class RefundInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  status: RefundStatus;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false })
  response?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  reviewedAt?: Date;
}

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty()
  teacherId: string;

  @ApiProperty()
  courseId?: string;

  @ApiProperty()
  originalPrice: number;

  @ApiProperty()
  finalPrice: number;

  @ApiProperty()
  paidPrice: number;

  @ApiProperty()
  teacherProfitPercent: number;

  @ApiProperty()
  teacherProfit: number;

  @ApiProperty({ required: false })
  stripePaymentId?: string;

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false, type: RefundInfoDto })
  refund?: RefundInfoDto;
}
