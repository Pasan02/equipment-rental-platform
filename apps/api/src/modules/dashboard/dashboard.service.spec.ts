import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReservationStatus } from '@prisma/client';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      count: jest.fn(),
    },
    reservation: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    equipment: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    payment: {
      aggregate: jest.fn(),
    },
    reservationItem: {
      groupBy: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStats', () => {
    it('should return aggregated dashboard statistics', async () => {
      mockPrismaService.user.count.mockResolvedValue(150);
      mockPrismaService.reservation.count.mockImplementation(({ where }) => {
        if (where?.status === ReservationStatus.ACTIVE) return Promise.resolve(23);
        if (where?.status === ReservationStatus.PENDING) return Promise.resolve(8);
        return Promise.resolve(0);
      });
      mockPrismaService.equipment.count.mockResolvedValue(85);
      mockPrismaService.equipment.findMany.mockResolvedValue([
        { stockQuantity: 10, availableQuantity: 3 },
      ]);
      mockPrismaService.payment.aggregate.mockResolvedValue({
        _sum: { amount: 1000 },
      });

      const stats = await service.getStats();

      expect(stats.totalCustomers).toBe(150);
      expect(stats.activeReservations).toBe(23);
      expect(stats.pendingReservations).toBe(8);
      expect(stats.totalEquipment).toBe(85);
      expect(stats.equipmentUtilization).toBe(70.0);
      expect(stats.totalRevenue).toBe(1000);
    });
  });

  describe('getMostRented', () => {
    it('should return top rented equipment based on reservation items', async () => {
      mockPrismaService.reservationItem.groupBy.mockResolvedValue([
        {
          equipmentId: 'eq-1',
          _sum: { quantity: 25, subtotal: 3750 },
        },
      ]);
      mockPrismaService.equipment.findMany.mockResolvedValue([
        {
          id: 'eq-1',
          name: 'Canon EOS R5',
          category: { name: 'Camera Gear' },
          images: [{ imageUrl: 'https://example.com/cam.jpg' }],
        },
      ]);

      const result = await service.getMostRented({ limit: 10, period: 'month' });

      expect(result).toHaveLength(1);
      expect(result[0].equipmentName).toBe('Canon EOS R5');
      expect(result[0].totalRentals).toBe(25);
      expect(result[0].totalRevenue).toBe(3750);
    });
  });

  describe('getReservationTrends', () => {
    it('should calculate date bucket status trends', async () => {
      const today = new Date();
      mockPrismaService.reservation.findMany.mockResolvedValue([
        { id: 'res-1', status: ReservationStatus.ACTIVE, createdAt: today },
        { id: 'res-2', status: ReservationStatus.APPROVED, createdAt: today },
      ]);

      const result = await service.getReservationTrends({ period: 'daily' });

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].total).toBe(2);
      expect(result[0].active).toBe(1);
      expect(result[0].approved).toBe(1);
    });
  });
});
