import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { InventoryAction } from '@prisma/client';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: PrismaService;

  const mockEquipment = {
    id: 'eq-uuid-1',
    name: 'Sony FX3 Camera',
    stockQuantity: 10,
    availableQuantity: 5,
    rentalPricePerDay: 200,
    depositAmount: 500,
    isActive: true,
    category: { id: 'cat-1', name: 'Camera Gear', slug: 'camera-gear' },
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    equipment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    inventoryLog: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    payment: {
      create: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
    reservation: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStockOverview', () => {
    it('should return aggregated stock summary and item details', async () => {
      mockPrismaService.equipment.findMany.mockResolvedValue([mockEquipment]);

      const result = await service.getStockOverview();

      expect(result.summary).toBeDefined();
      expect(result.summary.totalStockQuantity).toBe(10);
      expect(result.summary.totalAvailableQuantity).toBe(5);
      expect(result.summary.totalReservedQuantity).toBe(5);
      expect(result.items).toHaveLength(1);
    });
  });

  describe('getHistory', () => {
    it('should return paginated inventory logs for target equipment', async () => {
      mockPrismaService.equipment.findUnique.mockResolvedValue(mockEquipment);
      mockPrismaService.inventoryLog.count.mockResolvedValue(1);
      mockPrismaService.inventoryLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          equipmentId: mockEquipment.id,
          action: InventoryAction.RECEIVED,
          quantityChange: 5,
        },
      ]);

      const result = await service.getHistory(mockEquipment.id, {
        page: 1,
        pageSize: 10,
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should throw NotFoundException if specified equipment does not exist', async () => {
      mockPrismaService.equipment.findUnique.mockResolvedValue(null);

      await expect(service.getHistory('invalid-eq-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('receive', () => {
    it('should increase stock and available quantities', async () => {
      mockPrismaService.equipment.findUnique.mockResolvedValue(mockEquipment);
      mockPrismaService.equipment.update.mockResolvedValue({
        ...mockEquipment,
        stockQuantity: 15,
        availableQuantity: 10,
      });
      mockPrismaService.inventoryLog.create.mockResolvedValue({
        id: 'log-1',
        action: InventoryAction.RECEIVED,
        quantityChange: 5,
      });

      const result = await service.receive(
        {
          equipmentId: mockEquipment.id,
          quantity: 5,
          notes: 'Supplier delivery',
        },
        'user-uuid-1',
      );

      expect(result.message).toContain('Successfully received 5 unit(s)');
      expect(mockPrismaService.equipment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            stockQuantity: { increment: 5 },
            availableQuantity: { increment: 5 },
          },
        }),
      );
    });

    it('should throw NotFoundException if equipment missing', async () => {
      mockPrismaService.equipment.findUnique.mockResolvedValue(null);

      await expect(
        service.receive(
          { equipmentId: 'invalid-eq-id', quantity: 5 },
          'user-uuid-1',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('release', () => {
    it('should decrease available quantity for valid release', async () => {
      mockPrismaService.equipment.findUnique.mockResolvedValue(mockEquipment);
      mockPrismaService.equipment.update.mockResolvedValue({
        ...mockEquipment,
        availableQuantity: 3,
      });
      mockPrismaService.inventoryLog.create.mockResolvedValue({
        id: 'log-2',
        action: InventoryAction.RELEASED,
        quantityChange: -2,
      });

      const result = await service.release(
        { equipmentId: mockEquipment.id, quantity: 2 },
        'user-uuid-1',
      );

      expect(result.message).toContain('Successfully released 2 unit(s)');
    });

    it('should throw BadRequestException if available quantity is less than release quantity', async () => {
      mockPrismaService.equipment.findUnique.mockResolvedValue(mockEquipment); // availableQuantity = 5

      await expect(
        service.release(
          { equipmentId: mockEquipment.id, quantity: 10 },
          'user-uuid-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('damage', () => {
    it('should decrease stock and available quantity for damage report', async () => {
      mockPrismaService.equipment.findUnique.mockResolvedValue(mockEquipment);
      mockPrismaService.equipment.update.mockResolvedValue({
        ...mockEquipment,
        stockQuantity: 9,
        availableQuantity: 4,
      });
      mockPrismaService.inventoryLog.create.mockResolvedValue({
        id: 'log-3',
        action: InventoryAction.DAMAGED,
        quantityChange: -1,
      });

      const result = await service.damage(
        { equipmentId: mockEquipment.id, quantity: 1, notes: 'Cracked screen' },
        'user-uuid-1',
      );

      expect(result.message).toContain('Reported 1 unit(s)');
    });

    it('should optionally create damage fee payment if requested', async () => {
      mockPrismaService.equipment.findUnique.mockResolvedValue(mockEquipment);
      mockPrismaService.reservation.findUnique.mockResolvedValue({
        id: 'res-uuid-1',
      });
      mockPrismaService.equipment.update.mockResolvedValue({
        ...mockEquipment,
        stockQuantity: 9,
        availableQuantity: 4,
      });
      mockPrismaService.payment.create.mockResolvedValue({
        id: 'pay-uuid-1',
        amount: 150,
      });

      const result = await service.damage(
        {
          equipmentId: mockEquipment.id,
          quantity: 1,
          reservationId: 'res-uuid-1',
          chargeDamageFee: true,
          damageFeeAmount: 150,
        },
        'user-uuid-1',
      );

      expect(result.damagePayment).toBeDefined();
      expect(mockPrismaService.payment.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if damage quantity exceeds stock', async () => {
      mockPrismaService.equipment.findUnique.mockResolvedValue(mockEquipment); // stockQuantity = 10

      await expect(
        service.damage(
          { equipmentId: mockEquipment.id, quantity: 20 },
          'user-uuid-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('maintenance', () => {
    it('should decrease available quantity while leaving total stock unchanged', async () => {
      mockPrismaService.equipment.findUnique.mockResolvedValue(mockEquipment);
      mockPrismaService.equipment.update.mockResolvedValue({
        ...mockEquipment,
        availableQuantity: 3,
      });

      const result = await service.maintenance(
        { equipmentId: mockEquipment.id, quantity: 2, notes: 'Routine check' },
        'user-uuid-1',
      );

      expect(result.message).toContain('Placed 2 unit(s)');
      expect(mockPrismaService.equipment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            availableQuantity: { decrement: 2 },
          },
        }),
      );
    });

    it('should throw BadRequestException if available stock is insufficient', async () => {
      mockPrismaService.equipment.findUnique.mockResolvedValue(mockEquipment); // availableQuantity = 5

      await expect(
        service.maintenance(
          { equipmentId: mockEquipment.id, quantity: 8 },
          'user-uuid-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
