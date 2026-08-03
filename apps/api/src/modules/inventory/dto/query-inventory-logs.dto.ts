import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { InventoryAction } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryInventoryLogsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter logs by equipment ID',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsOptional()
  @IsUUID('4')
  equipmentId?: string;

  @ApiPropertyOptional({
    enum: InventoryAction,
    description: 'Filter logs by inventory action type',
  })
  @IsOptional()
  @IsEnum(InventoryAction)
  action?: InventoryAction;

  @ApiPropertyOptional({
    description: 'Filter logs by user ID who performed action',
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  })
  @IsOptional()
  @IsUUID('4')
  userId?: string;
}
