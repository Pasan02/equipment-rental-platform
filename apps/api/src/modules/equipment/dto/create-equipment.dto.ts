import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsInt,
  IsUUID,
  Min,
  MaxLength,
  MinLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EquipmentImageItemDto {
  @ApiProperty({
    example: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32',
    description: 'Image URL',
  })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Is primary display image',
    default: false,
  })
  @IsOptional()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    example: 0,
    description: 'Sort order position',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateEquipmentDto {
  @ApiProperty({
    example: 'Canon EOS R5',
    description: 'Equipment title / name',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: '8K RAW mirrorless camera with 45MP full-frame sensor',
    description: 'Detailed description of equipment',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 150.0,
    description: 'Daily rental rate in USD',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  rentalPricePerDay: number;

  @ApiPropertyOptional({
    example: 500.0,
    description: 'Refundable security deposit amount in USD',
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  depositAmount?: number = 0;

  @ApiProperty({
    example: 5,
    description: 'Total warehouse inventory stock quantity',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  stockQuantity: number;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    description: 'Parent Category UUID',
  })
  @IsUUID('4')
  @IsNotEmpty()
  categoryId: string;

  @ApiPropertyOptional({
    example: { sensor: '45MP CMOS', video: '8K RAW', weight: '738g' },
    description: 'Technical specifications dictionary',
  })
  @IsOptional()
  specifications?: Record<string, any>;

  @ApiPropertyOptional({
    type: [EquipmentImageItemDto],
    description: 'Gallery images list',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentImageItemDto)
  images?: EquipmentImageItemDto[];
}
