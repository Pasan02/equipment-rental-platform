import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { CreateEquipmentDto } from './create-equipment.dto';

export class UpdateEquipmentDto extends PartialType(CreateEquipmentDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Active availability status flag',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
