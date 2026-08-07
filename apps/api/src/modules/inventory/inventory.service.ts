import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  InventoryAction,
  ActivityAction,
  PaymentType,
  PaymentStatus,
} from '@prisma/client';
import { ReceiveInventoryDto } from './dto/receive-inventory.dto';
import { ReleaseInventoryDto } from './dto/release-inventory.dto';
import { DamageInventoryDto } from './dto/damage-inventory.dto';
import { MaintenanceInventoryDto } from './dto/maintenance-inventory.dto';
import { QueryInventoryLogsDto } from './dto/query-inventory-logs.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * View current inventory stock levels across all equipment
   */
  async getStockOverview() {
    const equipmentList = await this.prisma.equipment.findMany({
      orderBy: { name: 'asc' },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    let totalStock = 0;
    let totalAvailable = 0;

    const items = equipmentList.map((item) => {
      totalStock += item.stockQuantity;
      totalAvailable += item.availableQuantity;
      const reservedQuantity = Math.max(
        0,
        item.stockQuantity - item.availableQuantity,
      );

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        stockQuantity: item.stockQuantity,
        availableQuantity: item.availableQuantity,
        reservedQuantity,
        rentalPricePerDay: Number(item.rentalPricePerDay),
        depositAmount: Number(item.depositAmount),
        isActive: item.isActive,
        updatedAt: item.updatedAt,
      };
    });

    return {
      summary: {
        totalEquipmentCount: equipmentList.length,
        totalStockQuantity: totalStock,
        totalAvailableQuantity: totalAvailable,
        totalReservedQuantity: Math.max(0, totalStock - totalAvailable),
        utilizationRatePercent:
          totalStock > 0
            ? Number(
                (((totalStock - totalAvailable) / totalStock) * 100).toFixed(1),
              )
            : 0,
      },
      items,
    };
  }

  /**
   * View inventory log history for specific equipment or overall
   */
  async getHistory(equipmentId?: string, query: QueryInventoryLogsDto = {}) {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      action,
      userId,
    } = query;
    const skip = (page - 1) * pageSize;

    if (equipmentId) {
      const equipment = await this.prisma.equipment.findUnique({
        where: { id: equipmentId },
      });
      if (!equipment) {
        throw new NotFoundException(
          `Equipment with ID "${equipmentId}" not found`,
        );
      }
    }

    const where: any = {};
    if (equipmentId) {
      where.equipmentId = equipmentId;
    }
    if (action) {
      where.action = action;
    }
    if (userId) {
      where.userId = userId;
    }

    const [total, items] = await Promise.all([
      this.prisma.inventoryLog.count({ where }),
      this.prisma.inventoryLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          equipment: {
            select: {
              id: true,
              name: true,
              stockQuantity: true,
              availableQuantity: true,
            },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Record equipment received (increases stock and available quantity)
   */
  async receive(dto: ReceiveInventoryDto, userId: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: dto.equipmentId },
    });

    if (!equipment) {
      throw new NotFoundException(
        `Equipment with ID "${dto.equipmentId}" not found`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedEquipment = await tx.equipment.update({
        where: { id: dto.equipmentId },
        data: {
          stockQuantity: { increment: dto.quantity },
          availableQuantity: { increment: dto.quantity },
        },
      });

      const log = await tx.inventoryLog.create({
        data: {
          equipmentId: dto.equipmentId,
          userId,
          action: InventoryAction.RECEIVED,
          quantityChange: dto.quantity,
          notes: dto.notes || `Received ${dto.quantity} unit(s)`,
        },
        include: {
          equipment: {
            select: {
              id: true,
              name: true,
              stockQuantity: true,
              availableQuantity: true,
            },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: ActivityAction.INVENTORY_CHANGE,
          entityType: 'equipment',
          entityId: dto.equipmentId,
          oldValues: {
            stockQuantity: equipment.stockQuantity,
            availableQuantity: equipment.availableQuantity,
          },
          newValues: {
            stockQuantity: updatedEquipment.stockQuantity,
            availableQuantity: updatedEquipment.availableQuantity,
            action: 'RECEIVED',
            quantity: dto.quantity,
          },
        },
      });

      return {
        message: `Successfully received ${dto.quantity} unit(s) of ${equipment.name}`,
        equipment: updatedEquipment,
        log,
      };
    });
  }

  /**
   * Record equipment released for pickup (decreases available quantity)
   */
  async release(dto: ReleaseInventoryDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const equipment = await tx.equipment.findUnique({
        where: { id: dto.equipmentId },
      });

      if (!equipment) {
        throw new NotFoundException(
          `Equipment with ID "${dto.equipmentId}" not found`,
        );
      }

      if (equipment.availableQuantity < dto.quantity) {
        throw new BadRequestException(
          `Insufficient available quantity to release. Available: ${equipment.availableQuantity}, Requested: ${dto.quantity}`,
        );
      }

      const updatedEquipment = await tx.equipment.update({
        where: { id: dto.equipmentId },
        data: {
          availableQuantity: { decrement: dto.quantity },
        },
      });

      const log = await tx.inventoryLog.create({
        data: {
          equipmentId: dto.equipmentId,
          userId,
          action: InventoryAction.RELEASED,
          quantityChange: -dto.quantity,
          notes:
            dto.notes ||
            `Released ${dto.quantity} unit(s)` +
              (dto.reservationId
                ? ` for reservation ${dto.reservationId}`
                : ''),
        },
        include: {
          equipment: {
            select: {
              id: true,
              name: true,
              stockQuantity: true,
              availableQuantity: true,
            },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: ActivityAction.INVENTORY_CHANGE,
          entityType: 'equipment',
          entityId: dto.equipmentId,
          oldValues: { availableQuantity: equipment.availableQuantity },
          newValues: {
            availableQuantity: updatedEquipment.availableQuantity,
            action: 'RELEASED',
            quantity: dto.quantity,
            reservationId: dto.reservationId,
          },
        },
      });

      return {
        message: `Successfully released ${dto.quantity} unit(s) of ${equipment.name}`,
        equipment: updatedEquipment,
        log,
      };
    });
  }

  /**
   * Record equipment damage (decreases total stock and available quantity, optionally charges damage fee)
   */
  async damage(dto: DamageInventoryDto, userId: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id: dto.equipmentId },
    });

    if (!equipment) {
      throw new NotFoundException(
        `Equipment with ID "${dto.equipmentId}" not found`,
      );
    }

    if (equipment.stockQuantity < dto.quantity) {
      throw new BadRequestException(
        `Damage quantity (${dto.quantity}) exceeds total stock quantity (${equipment.stockQuantity})`,
      );
    }

    const availableDecrement = Math.min(
      equipment.availableQuantity,
      dto.quantity,
    );

    return this.prisma.$transaction(async (tx) => {
      const updatedEquipment = await tx.equipment.update({
        where: { id: dto.equipmentId },
        data: {
          stockQuantity: { decrement: dto.quantity },
          availableQuantity: { decrement: availableDecrement },
        },
      });

      const log = await tx.inventoryLog.create({
        data: {
          equipmentId: dto.equipmentId,
          userId,
          action: InventoryAction.DAMAGED,
          quantityChange: -dto.quantity,
          notes: dto.notes || `Reported ${dto.quantity} unit(s) damaged`,
        },
        include: {
          equipment: {
            select: {
              id: true,
              name: true,
              stockQuantity: true,
              availableQuantity: true,
            },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      let damagePaymentRecord: any = null;
      if (
        dto.chargeDamageFee &&
        dto.reservationId &&
        dto.damageFeeAmount &&
        dto.damageFeeAmount > 0
      ) {
        const reservation = await tx.reservation.findUnique({
          where: { id: dto.reservationId },
        });

        if (reservation) {
          const transactionId = `TXN-DAM-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
          damagePaymentRecord = await tx.payment.create({
            data: {
              reservationId: dto.reservationId,
              transactionId,
              amount: dto.damageFeeAmount,
              type: PaymentType.DAMAGE,
              status: PaymentStatus.PENDING,
              paymentMethod: 'system',
              metadata: {
                equipmentId: dto.equipmentId,
                equipmentName: equipment.name,
                damagedQuantity: dto.quantity,
                notes: dto.notes,
              },
            },
          });
        }
      }

      await tx.activityLog.create({
        data: {
          userId,
          action: ActivityAction.INVENTORY_CHANGE,
          entityType: 'equipment',
          entityId: dto.equipmentId,
          oldValues: {
            stockQuantity: equipment.stockQuantity,
            availableQuantity: equipment.availableQuantity,
          },
          newValues: {
            stockQuantity: updatedEquipment.stockQuantity,
            availableQuantity: updatedEquipment.availableQuantity,
            action: 'DAMAGED',
            quantity: dto.quantity,
            damageFeePaymentId: damagePaymentRecord?.id || null,
          },
        },
      });

      return {
        message: `Reported ${dto.quantity} unit(s) of ${equipment.name} as damaged`,
        equipment: updatedEquipment,
        log,
        damagePayment: damagePaymentRecord,
      };
    });
  }

  /**
   * Record equipment sent to maintenance (decreases available quantity, stock remains unchanged)
   */
  async maintenance(dto: MaintenanceInventoryDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const equipment = await tx.equipment.findUnique({
        where: { id: dto.equipmentId },
      });

      if (!equipment) {
        throw new NotFoundException(
          `Equipment with ID "${dto.equipmentId}" not found`,
        );
      }

      if (equipment.availableQuantity < dto.quantity) {
        throw new BadRequestException(
          `Insufficient available stock for maintenance. Available: ${equipment.availableQuantity}, Requested: ${dto.quantity}`,
        );
      }

      const updatedEquipment = await tx.equipment.update({
        where: { id: dto.equipmentId },
        data: {
          availableQuantity: { decrement: dto.quantity },
        },
      });

      const log = await tx.inventoryLog.create({
        data: {
          equipmentId: dto.equipmentId,
          userId,
          action: InventoryAction.MAINTENANCE,
          quantityChange: -dto.quantity,
          notes: dto.notes || `Sent ${dto.quantity} unit(s) to maintenance`,
        },
        include: {
          equipment: {
            select: {
              id: true,
              name: true,
              stockQuantity: true,
              availableQuantity: true,
            },
          },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      await tx.activityLog.create({
        data: {
          userId,
          action: ActivityAction.INVENTORY_CHANGE,
          entityType: 'equipment',
          entityId: dto.equipmentId,
          oldValues: { availableQuantity: equipment.availableQuantity },
          newValues: {
            availableQuantity: updatedEquipment.availableQuantity,
            action: 'MAINTENANCE',
            quantity: dto.quantity,
          },
        },
      });

      return {
        message: `Placed ${dto.quantity} unit(s) of ${equipment.name} in maintenance`,
        equipment: updatedEquipment,
        log,
      };
    });
  }
}
