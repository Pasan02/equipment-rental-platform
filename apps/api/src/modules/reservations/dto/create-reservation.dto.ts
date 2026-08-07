import {
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationItemDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Equipment UUID',
  })
  @IsUUID('4')
  @IsNotEmpty()
  equipmentId: string;

  @ApiProperty({
    example: 1,
    description: 'Quantity of equipment to reserve',
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number = 1;
}

export class CreateReservationDto {
  @ApiProperty({
    example: '2026-08-10',
    description: 'Pickup date (YYYY-MM-DD)',
  })
  @IsNotEmpty()
  @IsDateString()
  pickupDate: string;

  @ApiProperty({
    example: '2026-08-15',
    description: 'Return date (YYYY-MM-DD)',
  })
  @IsNotEmpty()
  @IsDateString()
  returnDate: string;

  @ApiProperty({
    type: [CreateReservationItemDto],
    description: 'List of equipment items and quantities to reserve',
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least one equipment item is required for reservation',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateReservationItemDto)
  items: CreateReservationItemDto[];

  @ApiPropertyOptional({
    example: 'Need for outdoor documentary shoot',
    description: 'Optional notes or special instructions',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
