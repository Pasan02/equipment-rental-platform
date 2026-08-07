import {
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CheckAvailabilityDto {
  @ApiProperty({
    example: '2026-08-10',
    description: 'Pickup date (YYYY-MM-DD)',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2026-08-15',
    description: 'Return date (YYYY-MM-DD)',
  })
  @IsNotEmpty()
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Requested rental quantity',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number = 1;
}
