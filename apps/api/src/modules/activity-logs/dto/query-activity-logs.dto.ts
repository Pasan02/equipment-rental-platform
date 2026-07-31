import { ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityAction } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
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
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter logs created on or before date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  toDate?: string;
}
