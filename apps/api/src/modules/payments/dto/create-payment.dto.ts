import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType } from '@equipment-rental/shared-types';

export class CreatePaymentDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Reservation UUID',
  })
  @IsUUID('4')
  @IsNotEmpty()
  reservationId: string;

  @ApiProperty({
    example: 600.0,
    description: 'Payment amount in USD',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({
    enum: PaymentType,
    example: PaymentType.RENTAL,
    description: 'Type of payment (RENTAL, DEPOSIT, REFUND, DAMAGE)',
  })
  @IsEnum(PaymentType)
  type: PaymentType;

  @ApiPropertyOptional({
    example: 'credit_card',
    description: 'Payment method string',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({
    example: { cardLast4: '4242', cardBrand: 'Visa' },
    description: 'Optional metadata dictionary',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
