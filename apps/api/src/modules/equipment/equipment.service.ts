import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ReservationStatus,
  UserRole,
  ActivityAction,
} from '@equipment-rental/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { QueryEquipmentDto } from './dto/query-equipment.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';

@Injectable()
export class EquipmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  /**
   * Auto-generate QR code representation identifier.
   */
  public generateQrCode(name: string): string {
    const slugSegment = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 6);
    const randHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `EQP-${slugSegment.toUpperCase()}-${randHex}`;
  }

  /**
   * Retrieve paginated equipment list with search, filtering, and role-based visibility.
   */
  async findAll(query: QueryEquipmentDto, currentUserRole?: UserRole) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const where: any = {};

    // Role-based visibility logic: Non-admin/staff users only see active equipment
    const isStaffOrAdmin =
      currentUserRole === UserRole.ADMIN || currentUserRole === UserRole.STAFF;

    if (!isStaffOrAdmin) {
      where.isActive = true;
    } else if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    // Category filter
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    // Search filter across name and description
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Price range filters
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.rentalPricePerDay = {};
      if (query.minPrice !== undefined) {
        where.rentalPricePerDay.gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        where.rentalPricePerDay.lte = query.maxPrice;
      }
    }

    // Availability filter (availableQuantity > 0)
    if (query.available === true) {
      where.availableQuantity = { gt: 0 };
    }

    const [items, total] = await Promise.all([
      this.prisma.equipment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      this.prisma.equipment.count({ where }),
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
   * Get single equipment details by ID with category and image gallery.
   */
  async findOne(id: string) {
    const equipment = await this.prisma.equipment.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { reservationItems: true },
        },
      },
    });

    if (!equipment) {
      throw new NotFoundException(`Equipment with ID '${id}' not found`);
    }

    return equipment;
  }

  /**
   * Check equipment availability for a specified date range considering active reservations.
   */
  async checkAvailability(id: string, dto: CheckAvailabilityDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate format');
    }

    if (start > end) {
      throw new BadRequestException('startDate cannot be after endDate');
    }

    const equipment = await this.findOne(id);
    const requestedQty = dto.quantity || 1;

    // Find overlapping reservation items with active, pending, or approved status
    const overlappingReservationItems =
      await this.prisma.reservationItem.findMany({
        where: {
          equipmentId: id,
          reservation: {
            status: {
              in: [
                ReservationStatus.PENDING,
                ReservationStatus.APPROVED,
                ReservationStatus.ACTIVE,
              ],
            },
            pickupDate: { lte: end },
            returnDate: { gte: start },
          },
        },
        select: {
          quantity: true,
        },
      });

    const totalReservedInPeriod = overlappingReservationItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const availableQuantityInPeriod = Math.max(
      0,
      equipment.stockQuantity - totalReservedInPeriod,
    );

    return {
      equipmentId: id,
      available: availableQuantityInPeriod >= requestedQty,
      availableQuantity: availableQuantityInPeriod,
      requestedQuantity: requestedQty,
      conflictingReservations: overlappingReservationItems.length,
    };
  }

  /**
   * Create new equipment with auto-generated QR code and initial images.
   */
  async create(dto: CreateEquipmentDto, currentUserId?: string) {
    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID '${dto.categoryId}' not found`,
      );
    }

    const qrCode = this.generateQrCode(dto.name);
    const availableQuantity = dto.stockQuantity;

    const equipment = await this.prisma.equipment.create({
      data: {
        name: dto.name,
        description: dto.description,
        rentalPricePerDay: dto.rentalPricePerDay,
        depositAmount: dto.depositAmount ?? 0,
        stockQuantity: dto.stockQuantity,
        availableQuantity,
        specifications: dto.specifications ?? {},
        qrCode,
        categoryId: dto.categoryId,
        images:
          dto.images && dto.images.length > 0
            ? {
                create: dto.images.map((img, idx) => ({
                  imageUrl: img.imageUrl,
                  isPrimary: img.isPrimary ?? idx === 0,
                  sortOrder: img.sortOrder ?? idx,
                })),
              }
            : undefined,
      },
      include: {
        category: true,
        images: true,
      },
    });

    // Record activity log
    if (currentUserId) {
      await this.activityLogsService.createLog({
        userId: currentUserId,
        action: ActivityAction.EQUIPMENT_CREATED,
        entityType: 'EQUIPMENT',
        entityId: equipment.id,
        newValues: {
          name: equipment.name,
          stockQuantity: equipment.stockQuantity,
        },
      });
    }

    return equipment;
  }

  /**
   * Update equipment details and adjust available quantity if stock quantity changes.
   */
  async update(id: string, dto: UpdateEquipmentDto, currentUserId?: string) {
    const existing = await this.findOne(id);

    if (dto.categoryId && dto.categoryId !== existing.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID '${dto.categoryId}' not found`,
        );
      }
    }

    const updateData: any = { ...dto };
    delete updateData.images;

    // Recalculate available quantity if stock quantity changes
    if (
      dto.stockQuantity !== undefined &&
      dto.stockQuantity !== existing.stockQuantity
    ) {
      const stockDiff = dto.stockQuantity - existing.stockQuantity;
      updateData.availableQuantity = Math.max(
        0,
        existing.availableQuantity + stockDiff,
      );
    }

    // Handle images update if provided
    if (dto.images !== undefined) {
      await this.prisma.equipmentImage.deleteMany({
        where: { equipmentId: id },
      });

      if (dto.images.length > 0) {
        await this.prisma.equipmentImage.createMany({
          data: dto.images.map((img, idx) => ({
            equipmentId: id,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary ?? idx === 0,
            sortOrder: img.sortOrder ?? idx,
          })),
        });
      }
    }

    const updated = await this.prisma.equipment.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Record activity log
    if (currentUserId) {
      await this.activityLogsService.createLog({
        userId: currentUserId,
        action: ActivityAction.EQUIPMENT_UPDATED,
        entityType: 'EQUIPMENT',
        entityId: id,
        oldValues: {
          name: existing.name,
          stockQuantity: existing.stockQuantity,
        },
        newValues: { name: updated.name, stockQuantity: updated.stockQuantity },
      });
    }

    return updated;
  }

  /**
   * Soft delete (deactivate) equipment. Blocks if active/pending reservations exist.
   */
  async remove(id: string, currentUserId?: string) {
    const equipment = await this.findOne(id);

    // Check for active/pending reservations
    const activeReservationsCount = await this.prisma.reservationItem.count({
      where: {
        equipmentId: id,
        reservation: {
          status: {
            in: [
              ReservationStatus.PENDING,
              ReservationStatus.APPROVED,
              ReservationStatus.ACTIVE,
            ],
          },
        },
      },
    });

    if (activeReservationsCount > 0) {
      throw new BadRequestException(
        `Cannot deactivate equipment '${equipment.name}' because it has ${activeReservationsCount} active or pending reservation(s)`,
      );
    }

    const deactivated = await this.prisma.equipment.update({
      where: { id },
      data: { isActive: false },
    });

    if (currentUserId) {
      await this.activityLogsService.createLog({
        userId: currentUserId,
        action: ActivityAction.EQUIPMENT_DELETED,
        entityType: 'EQUIPMENT',
        entityId: id,
        oldValues: { isActive: true },
        newValues: { isActive: false },
      });
    }

    return deactivated;
  }
}
