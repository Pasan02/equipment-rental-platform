import {
  Controller,
  Get,
  Post,
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
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { Roles, CurrentUser } from '../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new mock payment record' })
  @ApiResponse({ status: 201, description: 'Payment record created with PENDING status.' })
  @ApiResponse({ status: 400, description: 'Invalid payload.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Cannot pay for another user reservation).' })
  @ApiResponse({ status: 404, description: 'Reservation not found.' })
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.paymentsService.create(createPaymentDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List payments (Customer views own; Admin/Staff view all)' })
  @ApiResponse({ status: 200, description: 'Paginated payment list.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async findAll(
    @Query() query: QueryPaymentsDto,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.paymentsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details by ID' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Payment details.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Customer cannot view other users payment records).' })
  @ApiResponse({ status: 404, description: 'Payment record not found.' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.paymentsService.findOne(id, user);
  }

  @Post(':id/process')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Process / mock approve payment (Admin only)' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Payment status changed to PAID.' })
  @ApiResponse({ status: 400, description: 'Only PENDING payments can be processed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  @ApiResponse({ status: 404, description: 'Payment record not found.' })
  async processPayment(
    @Param('id') id: string,
    @Body() processPaymentDto: ProcessPaymentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.paymentsService.processPayment(id, processPaymentDto, user.id);
  }

  @Post(':id/refund')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Refund a paid payment (Admin only)' })
  @ApiParam({ name: 'id', description: 'Original Payment UUID' })
  @ApiResponse({ status: 201, description: 'Refund record created and original status updated to REFUNDED.' })
  @ApiResponse({ status: 400, description: 'Only PAID payments can be refunded.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden (Admin role required).' })
  @ApiResponse({ status: 404, description: 'Payment record not found.' })
  async refund(
    @Param('id') id: string,
    @Body() refundPaymentDto: RefundPaymentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.paymentsService.refund(id, refundPaymentDto, user.id);
  }
}
