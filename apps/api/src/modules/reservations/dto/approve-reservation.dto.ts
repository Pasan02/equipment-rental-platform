import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveReservationDto {
  @ApiPropertyOptional({
    example: 'Identity and documentation verified',
    description: 'Optional staff approval notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
