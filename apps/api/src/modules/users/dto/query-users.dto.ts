import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryUsersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: UserRole, description: 'Filter users by role' })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid role filter' })
  role?: UserRole;
}
