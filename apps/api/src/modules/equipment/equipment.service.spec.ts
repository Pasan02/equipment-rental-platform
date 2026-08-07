import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@equipment-rental/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { EquipmentService } from './equipment.service';

describe('EquipmentService', () => {
  let service: EquipmentService;

  const mockPrismaService = {
    equipment: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    category: {
      findUnique: jest.fn(),
    },
    reservationItem: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    equipmentImage: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  const mockActivityLogsService = {
    createLog: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ActivityLogsService, useValue: mockActivityLogsService },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
    jest.clearAllMocks();
  });

  describe('generateQrCode', () => {
    it('should generate a string with EQP prefix', () => {
      const qrCode = service.generateQrCode('Canon EOS R5');
      expect(qrCode).toMatch(/^EQP-CANONE-[A-Z0-9]{6}$/);
    });
  });

  describe('findAll', () => {
    it('should return paginated equipment list for public request (isActive = true)', async () => {
      const mockEquipment = [
        {
          id: 'eq-1',
          name: 'Canon EOS R5',
          rentalPricePerDay: 150,
          isActive: true,
          category: { id: 'cat-1', name: 'Camera Gear', slug: 'camera-gear' },
          images: [],
        },
      ];
      mockPrismaService.equipment.findMany.mockResolvedValue(mockEquipment);
      mockPrismaService.equipment.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10 });
      expect(result.data).toEqual(mockEquipment);
      expect(result.meta.total).toBe(1);
      expect(mockPrismaService.equipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        }),
      );
    });

    it('should allow Admin/Staff to query inactive equipment', async () => {
      mockPrismaService.equipment.findMany.mockResolvedValue([]);
      mockPrismaService.equipment.count.mockResolvedValue(0);

      await service.findAll({ isActive: false }, UserRole.ADMIN);
      expect(mockPrismaService.equipment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: false }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return equipment details when found', async () => {
      const mockItem = {
        id: 'eq-1',
        name: 'Canon EOS R5',
        category: { name: 'Camera Gear' },
        images: [],
      };
      mockPrismaService.equipment.findUnique.mockResolvedValue(mockItem);

      const result = await service.findOne('eq-1');
      expect(result).toEqual(mockItem);
    });

    it('should throw NotFoundException when equipment does not exist', async () => {
      mockPrismaService.equipment.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('checkAvailability', () => {
    it('should calculate available quantity considering overlapping reservations', async () => {
      const mockItem = {
        id: 'eq-1',
        name: 'Canon EOS R5',
        stockQuantity: 5,
        availableQuantity: 5,
      };
      mockPrismaService.equipment.findUnique.mockResolvedValue(mockItem);
      mockPrismaService.reservationItem.findMany.mockResolvedValue([
        { quantity: 2 },
      ]);

      const result = await service.checkAvailability('eq-1', {
        startDate: '2026-08-10',
        endDate: '2026-08-15',
        quantity: 2,
      });

      expect(result).toEqual({
        equipmentId: 'eq-1',
        available: true,
        availableQuantity: 3, // 5 stock - 2 reserved = 3
        requestedQuantity: 2,
        conflictingReservations: 1,
      });
    });

    it('should throw BadRequestException if startDate > endDate', async () => {
      await expect(
        service.checkAvailability('eq-1', {
          startDate: '2026-08-20',
          endDate: '2026-08-10',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('create', () => {
    it('should create equipment with auto-generated QR code', async () => {
      const dto = {
        name: 'DJI Mavic 3 Pro',
        description: '4K Drone',
        rentalPricePerDay: 120,
        depositAmount: 400,
        stockQuantity: 3,
        categoryId: 'cat-drone',
      };
      const createdItem = {
        id: 'eq-2',
        ...dto,
        availableQuantity: 3,
        qrCode: 'EQP-DJIMAV-123456',
      };

      mockPrismaService.category.findUnique.mockResolvedValue({
        id: 'cat-drone',
      });
      mockPrismaService.equipment.create.mockResolvedValue(createdItem);

      const result = await service.create(dto, 'admin-1');
      expect(result).toEqual(createdItem);
      expect(mockActivityLogsService.createLog).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category is invalid', async () => {
      mockPrismaService.category.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            name: 'Item',
            rentalPricePerDay: 50,
            stockQuantity: 1,
            categoryId: 'invalid-cat',
          },
          'admin-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update equipment and adjust available quantity if stock changes', async () => {
      const existing = {
        id: 'eq-1',
        stockQuantity: 5,
        availableQuantity: 3,
        categoryId: 'cat-1',
      };
      const updated = {
        id: 'eq-1',
        stockQuantity: 8,
        availableQuantity: 6, // 3 + (8 - 5) = 6
      };

      mockPrismaService.equipment.findUnique.mockResolvedValue(existing);
      mockPrismaService.equipment.update.mockResolvedValue(updated);

      const result = await service.update(
        'eq-1',
        { stockQuantity: 8 },
        'admin-1',
      );
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should soft-delete equipment if no active reservations exist', async () => {
      const existing = { id: 'eq-1', name: 'Canon EOS R5', isActive: true };
      const deactivated = { id: 'eq-1', isActive: false };

      mockPrismaService.equipment.findUnique.mockResolvedValue(existing);
      mockPrismaService.reservationItem.count.mockResolvedValue(0);
      mockPrismaService.equipment.update.mockResolvedValue(deactivated);

      const result = await service.remove('eq-1', 'admin-1');
      expect(result).toEqual(deactivated);
    });

    it('should throw BadRequestException if equipment has active reservations', async () => {
      const existing = { id: 'eq-1', name: 'Canon EOS R5', isActive: true };

      mockPrismaService.equipment.findUnique.mockResolvedValue(existing);
      mockPrismaService.reservationItem.count.mockResolvedValue(2);

      await expect(service.remove('eq-1', 'admin-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
