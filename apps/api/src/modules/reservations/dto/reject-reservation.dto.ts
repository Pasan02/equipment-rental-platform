import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectReservationDto {
  @ApiProperty({
    example: 'Incomplete identity verification documents',
    description: 'Mandatory reason for rejecting reservation',
    minLength: 5,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  rejectionReason: string;
}
