import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  PaymentStatus,
  PaymentType,
  UserRole,
  ActivityAction,
} from '@equipment-rental/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  /**
   * Helper utility generating unique mock transaction ID format: TXN-YYYYMMDD-HEX
   */
  public generateTransactionId(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN-${dateStr}-${randHex}`;
  }

  /**
   * Create a new mock payment record for a reservation.
   */
  async create(
    dto: CreatePaymentDto,
    currentUser: { id: string; role: UserRole },
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: dto.reservationId },
    });

    if (!reservation) {
      throw new NotFoundException(
        `Reservation with ID '${dto.reservationId}' not found`,
      );
    }

    if (
      currentUser.role === UserRole.CUSTOMER &&
      reservation.customerId !== currentUser.id
    ) {
      throw new ForbiddenException(
        'You are not authorized to make payments for this reservation',
      );
    }

    const transactionId = this.generateTransactionId();

    const payment = await this.prisma.payment.create({
      data: {
        reservationId: dto.reservationId,
        transactionId,
        amount: dto.amount,
        type: dto.type,
        status: PaymentStatus.PENDING,
        paymentMethod: dto.paymentMethod ?? 'credit_card',
        metadata: dto.metadata ?? {},
      },
      include: {
        reservation: {
          select: {
            id: true,
            reservationNumber: true,
            customerId: true,
          },
        },
      },
    });

    await this.activityLogsService.createLog({
      userId: currentUser.id,
      action: ActivityAction.PAYMENT,
      entityType: 'PAYMENT',
      entityId: payment.id,
      newValues: {
        transactionId: payment.transactionId,
        amount: payment.amount,
        type: payment.type,
        status: payment.status,
      },
    });

    return payment;
  }

  /**
   * List paginated payments with role-based customer ownership filtering.
   */
  async findAll(
    query: QueryPaymentsDto,
    currentUser: { id: string; role: UserRole },
  ) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const where: any = {};

    // Customer role restriction
    if (currentUser.role === UserRole.CUSTOMER) {
      where.reservation = { customerId: currentUser.id };
    }

    if (query.reservationId) {
      where.reservationId = query.reservationId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.search) {
      where.transactionId = { contains: query.search, mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          reservation: {
            select: {
              id: true,
              reservationNumber: true,
              customerId: true,
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize) || 1;

    return {
      data: items,
      meta: {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Get single payment detail with ownership security enforcement.
   */
  async findOne(id: string, currentUser?: { id: string; role: UserRole }) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        reservation: {
          include: {
            customer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment record with ID '${id}' not found`);
    }

    if (
      currentUser &&
      currentUser.role === UserRole.CUSTOMER &&
      payment.reservation.customerId !== currentUser.id
    ) {
      throw new ForbiddenException(
        'You are not authorized to view this payment record',
      );
    }

    return payment;
  }

  /**
   * Process mock payment approval (Admin). Updates status to PAID and sets paidAt.
   */
  async processPayment(
    id: string,
    dto?: ProcessPaymentDto,
    currentUserId?: string,
  ) {
    const payment = await this.findOne(id);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Cannot process payment with status '${payment.status}'. Only PENDING payments can be processed.`,
      );
    }

    const newStatus = dto?.status || PaymentStatus.PAID;

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        status: newStatus,
        paidAt: newStatus === PaymentStatus.PAID ? new Date() : null,
      },
      include: {
        reservation: true,
      },
    });

    if (currentUserId) {
      await this.activityLogsService.createLog({
        userId: currentUserId,
        action: ActivityAction.PAYMENT,
        entityType: 'PAYMENT',
        entityId: id,
        oldValues: { status: PaymentStatus.PENDING },
        newValues: { status: updated.status, paidAt: updated.paidAt },
      });
    }

    return updated;
  }

  /**
   * Refund a PAID payment (Admin). Creates new REFUND record and marks original as REFUNDED.
   */
  async refund(id: string, dto?: RefundPaymentDto, currentUserId?: string) {
    const originalPayment = await this.findOne(id);

    if (originalPayment.status !== PaymentStatus.PAID) {
      throw new BadRequestException(
        `Cannot refund payment with status '${originalPayment.status}'. Only PAID payments can be refunded.`,
      );
    }

    const refundAmount = dto?.amount || Number(originalPayment.amount);
    const refundTxnId = this.generateTransactionId();

    return this.prisma.$transaction(async (tx) => {
      // Mark original payment as REFUNDED
      await tx.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.REFUNDED,
        },
      });

      // Create new refund payment record
      const refundRecord = await tx.payment.create({
        data: {
          reservationId: originalPayment.reservationId,
          transactionId: refundTxnId,
          amount: refundAmount,
          type: PaymentType.REFUND,
          status: PaymentStatus.REFUNDED,
          paymentMethod: originalPayment.paymentMethod,
          paidAt: new Date(),
          metadata: {
            originalPaymentId: id,
            originalTransactionId: originalPayment.transactionId,
            reason: dto?.reason || 'Customer refund',
          },
        },
        include: {
          reservation: true,
        },
      });

      if (currentUserId) {
        await this.activityLogsService.createLog({
          userId: currentUserId,
          action: ActivityAction.PAYMENT,
          entityType: 'PAYMENT',
          entityId: refundRecord.id,
          newValues: {
            type: PaymentType.REFUND,
            amount: refundAmount,
            status: PaymentStatus.REFUNDED,
            originalPaymentId: id,
          },
        });
      }

      return refundRecord;
    });
  }
}
