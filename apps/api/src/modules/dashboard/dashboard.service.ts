import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserRole, ReservationStatus, PaymentStatus } from '@prisma/client';
import { QueryMostRentedDto } from './dto/query-most-rented.dto';
import { QueryReservationTrendsDto } from './dto/query-reservation-trends.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get aggregated overview statistics (US-8.1, R-58 to R-61)
   */
  async getStats() {
    const now = new Date();

    // Start of current month & previous month
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalCustomers,
      activeReservations,
      pendingReservations,
      totalEquipment,
      allEquipment,
      totalRevenueAggregate,
      currentMonthRevenueAggregate,
      prevMonthRevenueAggregate,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { role: UserRole.CUSTOMER, isActive: true },
      }),
      this.prisma.reservation.count({
        where: { status: ReservationStatus.ACTIVE },
      }),
      this.prisma.reservation.count({
        where: { status: ReservationStatus.PENDING },
      }),
      this.prisma.equipment.count({
        where: { isActive: true },
      }),
      this.prisma.equipment.findMany({
        where: { isActive: true },
        select: { stockQuantity: true, availableQuantity: true },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: PaymentStatus.PAID },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: PaymentStatus.PAID,
          paidAt: { gte: startOfCurrentMonth },
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: PaymentStatus.PAID,
          paidAt: { gte: startOfPrevMonth, lte: endOfPrevMonth },
        },
      }),
    ]);

    const totalRevenue = Number(totalRevenueAggregate._sum.amount || 0);
    const monthlyRevenue = Number(currentMonthRevenueAggregate._sum.amount || 0);
    const prevMonthRevenue = Number(prevMonthRevenueAggregate._sum.amount || 0);

    // Calculate revenue growth percentage
    let revenueGrowth = 0;
    if (prevMonthRevenue > 0) {
      revenueGrowth = Number((((monthlyRevenue - prevMonthRevenue) / prevMonthRevenue) * 100).toFixed(1));
    } else if (monthlyRevenue > 0) {
      revenueGrowth = 100.0;
    }

    // Calculate equipment utilization rate percentage
    let totalStock = 0;
    let totalAvailable = 0;
    for (const eq of allEquipment) {
      totalStock += eq.stockQuantity;
      totalAvailable += eq.availableQuantity;
    }

    const equipmentUtilization =
      totalStock > 0
        ? Number((((totalStock - totalAvailable) / totalStock) * 100).toFixed(1))
        : 0;

    return {
      totalCustomers,
      activeReservations,
      pendingReservations,
      totalEquipment,
      totalRevenue,
      monthlyRevenue,
      revenueGrowth,
      equipmentUtilization,
    };
  }

  /**
   * Get top rented equipment items (US-8.2, R-62)
   */
  async getMostRented(dto: QueryMostRentedDto) {
    const { limit = 10, period = 'month' } = dto;

    const startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === 'quarter') {
      startDate.setDate(startDate.getDate() - 90);
    } else if (period === 'year') {
      startDate.setDate(startDate.getDate() - 365);
    }

    // Group reservation items by equipmentId
    const groupedItems = await this.prisma.reservationItem.groupBy({
      by: ['equipmentId'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      where: {
        reservation: {
          createdAt: { gte: startDate },
          status: { in: [ReservationStatus.APPROVED, ReservationStatus.ACTIVE, ReservationStatus.RETURNED] },
        },
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    if (groupedItems.length === 0) {
      // Fallback: return top active equipment if no reservation items found
      const activeEquipment = await this.prisma.equipment.findMany({
        take: limit,
        where: { isActive: true },
        include: {
          category: { select: { name: true } },
          images: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
        },
      });

      return activeEquipment.map((eq) => ({
        equipmentId: eq.id,
        equipmentName: eq.name,
        category: eq.category.name,
        totalRentals: 0,
        totalRevenue: 0,
        imageUrl: eq.images[0]?.imageUrl || null,
      }));
    }

    const equipmentIds = groupedItems.map((item) => item.equipmentId);
    const equipmentDetails = await this.prisma.equipment.findMany({
      where: { id: { in: equipmentIds } },
      include: {
        category: { select: { name: true } },
        images: { where: { isPrimary: true }, select: { imageUrl: true }, take: 1 },
      },
    });

    const equipmentMap = new Map(equipmentDetails.map((eq) => [eq.id, eq]));

    return groupedItems.map((item) => {
      const eq = equipmentMap.get(item.equipmentId);
      return {
        equipmentId: item.equipmentId,
        equipmentName: eq?.name || 'Unknown Equipment',
        category: eq?.category.name || 'Uncategorized',
        totalRentals: item._sum.quantity || 0,
        totalRevenue: Number(item._sum.subtotal || 0),
        imageUrl: eq?.images[0]?.imageUrl || null,
      };
    });
  }

  /**
   * Get reservation status trends over time (US-8.3, R-63)
   */
  async getReservationTrends(dto: QueryReservationTrendsDto) {
    const { period = 'daily', fromDate, toDate } = dto;

    const endDate = toDate ? new Date(toDate) : new Date();
    const startDate = fromDate ? new Date(fromDate) : new Date();
    if (!fromDate) {
      startDate.setDate(startDate.getDate() - 30); // Default to last 30 days
    }

    const reservations = await this.prisma.reservation.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by time bucket
    const trendMap = new Map<
      string,
      {
        date: string;
        total: number;
        pending: number;
        approved: number;
        active: number;
        returned: number;
        cancelled: number;
      }
    >();

    for (const res of reservations) {
      const dateKey = this.formatDateBucket(res.createdAt, period);

      if (!trendMap.has(dateKey)) {
        trendMap.set(dateKey, {
          date: dateKey,
          total: 0,
          pending: 0,
          approved: 0,
          active: 0,
          returned: 0,
          cancelled: 0,
        });
      }

      const bucket = trendMap.get(dateKey)!;
      bucket.total += 1;

      switch (res.status) {
        case ReservationStatus.PENDING:
          bucket.pending += 1;
          break;
        case ReservationStatus.APPROVED:
          bucket.approved += 1;
          break;
        case ReservationStatus.ACTIVE:
          bucket.active += 1;
          break;
        case ReservationStatus.RETURNED:
          bucket.returned += 1;
          break;
        case ReservationStatus.CANCELLED:
        case ReservationStatus.REJECTED:
          bucket.cancelled += 1;
          break;
      }
    }

    return Array.from(trendMap.values());
  }

  /**
   * Format date into bucket key based on period granularity
   */
  private formatDateBucket(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    if (period === 'monthly') {
      return `${yyyy}-${mm}`;
    }

    if (period === 'weekly') {
      // Calculate start of week (Sunday or Monday)
      const dayOfWeek = date.getDay();
      const firstDayOfWeek = new Date(date);
      firstDayOfWeek.setDate(date.getDate() - dayOfWeek);
      const wYyyy = firstDayOfWeek.getFullYear();
      const wMm = String(firstDayOfWeek.getMonth() + 1).padStart(2, '0');
      const wDd = String(firstDayOfWeek.getDate()).padStart(2, '0');
      return `${wYyyy}-${wMm}-${wDd}`;
    }

    // Default daily
    return `${yyyy}-${mm}-${dd}`;
  }
}
