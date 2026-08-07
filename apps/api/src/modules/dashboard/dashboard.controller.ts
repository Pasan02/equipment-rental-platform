import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { QueryMostRentedDto } from './dto/query-most-rented.dto';
import { QueryReservationTrendsDto } from './dto/query-reservation-trends.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get aggregated overview statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Overview statistics retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden action (Admin access required)',
  })
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('most-rented')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get most rented equipment list by time period (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Top rented equipment list retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden action (Admin access required)',
  })
  async getMostRented(@Query() query: QueryMostRentedDto) {
    return this.dashboardService.getMostRented(query);
  }

  @Get('reservation-trends')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get time-series reservation trends by status (Admin only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Reservation trends time-series data retrieved',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden action (Admin access required)',
  })
  async getReservationTrends(@Query() query: QueryReservationTrendsDto) {
    return this.dashboardService.getReservationTrends(query);
  }
}
