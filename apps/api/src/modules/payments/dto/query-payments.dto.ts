import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, PaymentType } from '@equipment-rental/shared-types';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryPaymentsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: PaymentStatus,
    description: 'Filter by payment status',
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({
    enum: PaymentType,
    description: 'Filter by payment type',
  })
  @IsOptional()
  @IsEnum(PaymentType)
  type?: PaymentType;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Filter by reservation UUID',
  })
  @IsOptional()
  @IsUUID('4')
  reservationId?: string;
}
