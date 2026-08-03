import { IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '@equipment-rental/shared-types';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryReservationsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: ReservationStatus,
    description: 'Filter reservations by status',
  })
  @IsOptional()
  @IsEnum(ReservationStatus)
  status?: ReservationStatus;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Filter by customer UUID (Admin/Staff only)',
  })
  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Filter pickup date from (inclusive)',
  })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({
    example: '2026-08-31',
    description: 'Filter pickup date to (inclusive)',
  })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
