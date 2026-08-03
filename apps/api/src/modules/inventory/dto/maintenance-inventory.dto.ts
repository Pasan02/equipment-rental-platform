import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class MaintenanceInventoryDto {
  @ApiProperty({
    description: 'Equipment ID sent to maintenance',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4')
  @IsNotEmpty()
  equipmentId: string;

  @ApiProperty({
    description: 'Quantity sent for maintenance',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Maintenance notes or reason',
    example: 'Scheduled sensor calibration and firmware update',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
