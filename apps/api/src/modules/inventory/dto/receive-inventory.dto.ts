import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class ReceiveInventoryDto {
  @ApiProperty({
    description: 'Equipment ID receiving stock',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4')
  @IsNotEmpty()
  equipmentId: string;

  @ApiProperty({
    description: 'Quantity of equipment received',
    example: 5,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Optional notes regarding received shipment',
    example: 'New stock delivered from supplier',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
