import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityAction } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryActivityLogsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by user ID (UUID)' })
  @IsOptional()
  @IsUUID('4', { message: 'userId must be a valid UUID' })
  userId?: string;

  @ApiPropertyOptional({ enum: ActivityAction, description: 'Filter by activity action' })
  @IsOptional()
  @IsEnum(ActivityAction, { message: 'Invalid activity action' })
  action?: ActivityAction;

  @ApiPropertyOptional({ description: 'Filter by entity type (e.g. USER, EQUIPMENT, RESERVATION)' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Filter logs created on or after date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'fromDate must be a valid ISO 8601 date string (YYYY-MM-DD)' })
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter logs created on or before date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'toDate must be a valid ISO 8601 date string (YYYY-MM-DD)' })
  toDate?: string;
}
