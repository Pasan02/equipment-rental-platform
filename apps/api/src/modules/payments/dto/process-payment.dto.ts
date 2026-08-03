import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '@equipment-rental/shared-types';

export class ProcessPaymentDto {
  @ApiPropertyOptional({
    enum: [PaymentStatus.PAID, PaymentStatus.FAILED],
    example: PaymentStatus.PAID,
    description: 'Payment process status outcome (PAID or FAILED)',
    default: PaymentStatus.PAID,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus = PaymentStatus.PAID;

  @ApiPropertyOptional({
    example: 'Mock gateway payment settled successfully',
    description: 'Optional processing notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
