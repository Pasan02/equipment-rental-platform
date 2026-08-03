import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class QueryReservationTrendsDto {
  @ApiPropertyOptional({
    description: 'Time bucket granularity',
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
  })
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  period?: 'daily' | 'weekly' | 'monthly' = 'daily';

  @ApiPropertyOptional({
    description: 'Start date for trend data (ISO 8601)',
    example: '2026-07-01',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'End date for trend data (ISO 8601)',
    example: '2026-08-01',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
