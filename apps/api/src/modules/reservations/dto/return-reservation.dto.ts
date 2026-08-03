import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReturnReservationDto {
  @ApiPropertyOptional({
    example: 'Equipment inspected and returned in good condition',
    description: 'Optional staff return inspection notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
