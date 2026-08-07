import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class ReleaseInventoryDto {
  @ApiProperty({
    description: 'Equipment ID released for reservation/pickup',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4')
  @IsNotEmpty()
  equipmentId: string;

  @ApiProperty({
    description: 'Quantity of equipment released',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Associated reservation ID if applicable',
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  })
  @IsOptional()
  @IsUUID('4')
  reservationId?: string;

  @ApiPropertyOptional({
    description: 'Optional notes regarding equipment release',
    example: 'Released to customer for reservation RES-20260803-001',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
