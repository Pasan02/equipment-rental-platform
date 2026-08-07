import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ReservationStatus,
  UserRole,
  InventoryAction,
  ActivityAction,
} from '@equipment-rental/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EquipmentService } from '../equipment/equipment.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { QueryReservationsDto } from './dto/query-reservations.dto';
import { ApproveReservationDto } from './dto/approve-reservation.dto';
import { RejectReservationDto } from './dto/reject-reservation.dto';
import { ReturnReservationDto } from './dto/return-reservation.dto';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly equipmentService: EquipmentService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  /**
   * Helper utility to generate unique sequential reservation number format: RES-YYYYMMDD-XXX
   */
  public async generateReservationNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await this.prisma.reservation.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const sequence = String(count + 1).padStart(3, '0');
    return `RES-${dateStr}-${sequence}`;
  }

  /**
   * Create a new reservation with item pricing, availability check, and total deposit calculations.
   */
  async create(dto: CreateReservationDto, customerId: string) {
    const pickup = new Date(dto.pickupDate);
    const returnD = new Date(dto.returnDate);

    if (isNaN(pickup.getTime()) || isNaN(returnD.getTime())) {
      throw new BadRequestException('Invalid pickupDate or returnDate format');
    }

    if (returnD <= pickup) {
      throw new BadRequestException('returnDate must be after pickupDate');
    }

    // Duration in days (minimum 1 day)
    const durationDays = Math.max(
      1,
      Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24)),
    );

    const processedItems: Array<{
      equipmentId: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
      deposit: number;
    }> = [];
    let totalAmount = 0;
    let depositTotal = 0;

    for (const item of dto.items) {
      const equipment = await this.prisma.equipment.findUnique({
        where: { id: item.equipmentId },
      });

      if (!equipment || !equipment.isActive) {
        throw new NotFoundException(
          `Equipment with ID '${item.equipmentId}' not found or inactive`,
        );
      }

      // Check date range availability
      const availability = await this.equipmentService.checkAvailability(
        item.equipmentId,
        {
          startDate: dto.pickupDate,
          endDate: dto.returnDate,
          quantity: item.quantity,
        },
      );

      if (!availability.available) {
        throw new BadRequestException(
          `Equipment '${equipment.name}' does not have requested quantity (${item.quantity}) available for selected dates (Available: ${availability.availableQuantity})`,
        );
      }

      const unitPrice = Number(equipment.rentalPricePerDay);
      const subtotal = unitPrice * item.quantity * durationDays;
      const deposit = Number(equipment.depositAmount) * item.quantity;

      totalAmount += subtotal;
      depositTotal += deposit;

      processedItems.push({
        equipmentId: item.equipmentId,
        quantity: item.quantity,
        unitPrice,
        subtotal,
        deposit,
      });
    }

    const reservationNumber = await this.generateReservationNumber();

    const reservation = await this.prisma.reservation.create({
      data: {
        reservationNumber,
        customerId,
        status: ReservationStatus.PENDING,
        pickupDate: pickup,
        returnDate: returnD,
        totalAmount,
        depositTotal,
        notes: dto.notes,
        items: {
          create: processedItems.map((item) => ({
            equipmentId: item.equipmentId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            deposit: item.deposit,
          })),
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            equipment: {
              select: {
                id: true,
                name: true,
                qrCode: true,
              },
            },
          },
        },
      },
    });

    await this.activityLogsService.createLog({
      userId: customerId,
      action: ActivityAction.RESERVATION_CREATED,
      entityType: 'RESERVATION',
      entityId: reservation.id,
      newValues: {
        reservationNumber: reservation.reservationNumber,
        totalAmount,
        status: reservation.status,
      },
    });

    return reservation;
  }

  /**
   * List paginated reservations with role enforcement (Customers view own; Admin/Staff view all).
   */
  async findAll(
    query: QueryReservationsDto,
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
      where.customerId = currentUser.id;
    } else if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.fromDate || query.toDate) {
      where.pickupDate = {};
      if (query.fromDate) where.pickupDate.gte = new Date(query.fromDate);
      if (query.toDate) where.pickupDate.lte = new Date(query.toDate);
    }

    if (query.search) {
      where.OR = [
        { reservationNumber: { contains: query.search, mode: 'insensitive' } },
        {
          customer: {
            firstName: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          customer: {
            lastName: { contains: query.search, mode: 'insensitive' },
          },
        },
        {
          customer: { email: { contains: query.search, mode: 'insensitive' } },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              equipment: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.reservation.count({ where }),
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
   * Get single reservation detail with ownership security enforcement.
   */
  async findOne(id: string, currentUser?: { id: string; role: UserRole }) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          include: {
            equipment: true,
          },
        },
        payments: true,
        uploads: true,
      },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID '${id}' not found`);
    }

    if (
      currentUser &&
      currentUser.role === UserRole.CUSTOMER &&
      reservation.customerId !== currentUser.id
    ) {
      throw new ForbiddenException(
        'You are not authorized to view this reservation',
      );
    }

    return reservation;
  }

  /**
   * Approve a PENDING reservation (Staff/Admin). Decrements equipment available stock.
   */
  async approve(id: string, staffId: string, dto?: ApproveReservationDto) {
    const reservation = await this.findOne(id);

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve reservation with status '${reservation.status}'. Only PENDING reservations can be approved.`,
      );
    }

    // Transaction: Decrement available stock per equipment item + update reservation
    return this.prisma.$transaction(async (tx) => {
      for (const item of reservation.items) {
        await tx.equipment.update({
          where: { id: item.equipmentId },
          data: {
            availableQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      const updated = await tx.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.APPROVED,
          approvedBy: staffId,
          notes: dto?.notes
            ? `${reservation.notes || ''}\n[Staff Note]: ${dto.notes}`.trim()
            : reservation.notes,
        },
        include: {
          customer: true,
          items: { include: { equipment: true } },
        },
      });

      await this.activityLogsService.createLog({
        userId: staffId,
        action: ActivityAction.RESERVATION_UPDATED,
        entityType: 'RESERVATION',
        entityId: id,
        oldValues: { status: ReservationStatus.PENDING },
        newValues: { status: ReservationStatus.APPROVED, approvedBy: staffId },
      });

      return updated;
    });
  }

  /**
   * Reject a PENDING reservation with rejection reason (Staff/Admin).
   */
  async reject(id: string, staffId: string, dto: RejectReservationDto) {
    const reservation = await this.findOne(id);

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject reservation with status '${reservation.status}'. Only PENDING reservations can be rejected.`,
      );
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.REJECTED,
        approvedBy: staffId,
        rejectionReason: dto.rejectionReason,
      },
      include: {
        customer: true,
        items: { include: { equipment: true } },
      },
    });

    await this.activityLogsService.createLog({
      userId: staffId,
      action: ActivityAction.RESERVATION_UPDATED,
      entityType: 'RESERVATION',
      entityId: id,
      oldValues: { status: ReservationStatus.PENDING },
      newValues: {
        status: ReservationStatus.REJECTED,
        rejectionReason: dto.rejectionReason,
      },
    });

    return updated;
  }

  /**
   * Activate an APPROVED reservation upon pickup (Staff/Admin).
   */
  async activate(id: string, staffId: string) {
    const reservation = await this.findOne(id);

    if (reservation.status !== ReservationStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot activate reservation with status '${reservation.status}'. Only APPROVED reservations can be activated.`,
      );
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.ACTIVE,
      },
      include: {
        customer: true,
        items: { include: { equipment: true } },
      },
    });

    await this.activityLogsService.createLog({
      userId: staffId,
      action: ActivityAction.RESERVATION_UPDATED,
      entityType: 'RESERVATION',
      entityId: id,
      oldValues: { status: ReservationStatus.APPROVED },
      newValues: { status: ReservationStatus.ACTIVE },
    });

    return updated;
  }

  /**
   * Complete return of ACTIVE reservation (Staff/Warehouse). Restores available stock + inventory logs.
   */
  async return(id: string, staffUserId: string, dto?: ReturnReservationDto) {
    const reservation = await this.findOne(id);

    if (reservation.status !== ReservationStatus.ACTIVE) {
      throw new BadRequestException(
        `Cannot return reservation with status '${reservation.status}'. Only ACTIVE reservations can be marked as returned.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.RETURNED,
          actualReturnDate: new Date(),
          notes: dto?.notes
            ? `${reservation.notes || ''}\n[Return Note]: ${dto.notes}`.trim()
            : reservation.notes,
        },
        include: {
          customer: true,
          items: { include: { equipment: true } },
        },
      });

      for (const item of reservation.items) {
        // Restore available stock
        await tx.equipment.update({
          where: { id: item.equipmentId },
          data: {
            availableQuantity: {
              increment: item.quantity,
            },
          },
        });

        // Record inventory log
        await tx.inventoryLog.create({
          data: {
            equipmentId: item.equipmentId,
            userId: staffUserId,
            action: InventoryAction.RECEIVED,
            quantityChange: item.quantity,
            notes: `Returned from reservation ${reservation.reservationNumber}`,
          },
        });
      }

      await this.activityLogsService.createLog({
        userId: staffUserId,
        action: ActivityAction.RESERVATION_UPDATED,
        entityType: 'RESERVATION',
        entityId: id,
        oldValues: { status: ReservationStatus.ACTIVE },
        newValues: { status: ReservationStatus.RETURNED },
      });

      return updated;
    });
  }

  /**
   * Cancel a PENDING or APPROVED reservation (Customer own / Admin). Restores stock if approved.
   */
  async cancel(id: string, currentUser: { id: string; role: UserRole }) {
    const reservation = await this.findOne(id, currentUser);

    if (
      reservation.status !== ReservationStatus.PENDING &&
      reservation.status !== ReservationStatus.APPROVED
    ) {
      throw new BadRequestException(
        `Cannot cancel reservation with status '${reservation.status}'. Only PENDING or APPROVED reservations can be cancelled.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // If reservation was APPROVED, restore stock
      if (reservation.status === ReservationStatus.APPROVED) {
        for (const item of reservation.items) {
          await tx.equipment.update({
            where: { id: item.equipmentId },
            data: {
              availableQuantity: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      const updated = await tx.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.CANCELLED,
        },
        include: {
          customer: true,
          items: { include: { equipment: true } },
        },
      });

      await this.activityLogsService.createLog({
        userId: currentUser.id,
        action: ActivityAction.RESERVATION_UPDATED,
        entityType: 'RESERVATION',
        entityId: id,
        oldValues: { status: reservation.status },
        newValues: { status: ReservationStatus.CANCELLED },
      });

      return updated;
    });
  }
}
