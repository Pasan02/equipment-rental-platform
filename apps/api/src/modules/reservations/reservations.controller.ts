import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserRole } from '@equipment-rental/shared-types';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { QueryReservationsDto } from './dto/query-reservations.dto';
import { ApproveReservationDto } from './dto/approve-reservation.dto';
import { RejectReservationDto } from './dto/reject-reservation.dto';
import { ReturnReservationDto } from './dto/return-reservation.dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';

@ApiTags('reservations')
@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new reservation (Customer)' })
  @ApiResponse({
    status: 201,
    description: 'Reservation created successfully with PENDING status.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid date range, insufficient stock, or bad payload.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Equipment not found.' })
  async create(
    @Body() createReservationDto: CreateReservationDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.reservationsService.create(createReservationDto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'List reservations (Customer views own; Admin/Staff view all)',
  })
  @ApiResponse({ status: 200, description: 'Paginated reservation list.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(
    @Query() query: QueryReservationsDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.reservationsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reservation details by ID' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({ status: 200, description: 'Reservation details.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden (Customer cannot view other customers reservations).',
  })
  @ApiResponse({ status: 404, description: 'Reservation not found.' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.reservationsService.findOne(id, user);
  }

  @Patch(':id/approve')
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve a pending reservation (Staff / Admin)' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({
    status: 200,
    description: 'Reservation approved successfully. Stock decremented.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition (Not PENDING).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Staff/Admin role required).',
  })
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveReservationDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.reservationsService.approve(id, user.id, dto);
  }

  @Patch(':id/reject')
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reject a pending reservation with reason (Staff / Admin)',
  })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({
    status: 200,
    description: 'Reservation rejected successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition (Not PENDING) or missing reason.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Staff/Admin role required).',
  })
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectReservationDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.reservationsService.reject(id, user.id, dto);
  }

  @Patch(':id/activate')
  @Roles(UserRole.STAFF, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Mark reservation as active upon pickup (Staff / Admin)',
  })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({
    status: 200,
    description: 'Reservation status changed to ACTIVE.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition (Not APPROVED).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (Staff/Admin role required).',
  })
  async activate(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.reservationsService.activate(id, user.id);
  }

  @Patch(':id/return')
  @Roles(UserRole.STAFF, UserRole.ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Complete equipment return (Staff / Warehouse)' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({
    status: 200,
    description: 'Reservation returned. Stock restored and inventory logged.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition (Not ACTIVE).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async return(
    @Param('id') id: string,
    @Body() dto: ReturnReservationDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.reservationsService.return(id, user.id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a reservation (Customer for own / Admin)' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({
    status: 200,
    description:
      'Reservation cancelled. Stock restored if previously approved.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid status transition (Only PENDING/APPROVED).',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.reservationsService.cancel(id, user);
  }
}
