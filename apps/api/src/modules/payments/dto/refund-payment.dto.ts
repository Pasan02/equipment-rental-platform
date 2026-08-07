import { IsOptional, IsNumber, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RefundPaymentDto {
  @ApiPropertyOptional({
    example: 600.0,
    description:
      'Amount to refund in USD (defaults to full original payment amount)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({
    example: 'Customer cancelled reservation within cancellation window',
    description: 'Optional refund reason or notes',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
