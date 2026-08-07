import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class DamageInventoryDto {
  @ApiProperty({
    description: 'Equipment ID reported as damaged',
    example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  })
  @IsUUID('4')
  @IsNotEmpty()
  equipmentId: string;

  @ApiProperty({
    description: 'Quantity damaged',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({
    description: 'Associated reservation ID',
    example: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  })
  @IsOptional()
  @IsUUID('4')
  reservationId?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the damage',
    example: 'Lens glass cracked upon return inspection',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Whether to issue a damage fee payment record',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  chargeDamageFee?: boolean;

  @ApiPropertyOptional({
    description: 'Damage fee amount if charging fee',
    example: 150.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  damageFeeAmount?: number;
}
