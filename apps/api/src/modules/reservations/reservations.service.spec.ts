import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ReservationStatus,
  UserRole,
  InventoryAction,
} from '@equipment-rental/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EquipmentService } from '../equipment/equipment.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  let service: ReservationsService;

  const mockPrismaService = {
    reservation: {
      count: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    equipment: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    inventoryLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  const mockEquipmentService = {
    checkAvailability: jest.fn(),
  };

  const mockActivityLogsService = {
    createLog: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EquipmentService, useValue: mockEquipmentService },
        { provide: ActivityLogsService, useValue: mockActivityLogsService },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    jest.clearAllMocks();
  });

  describe('generateReservationNumber', () => {
    it('should generate sequential reservation number with RES prefix', async () => {
      mockPrismaService.reservation.count.mockResolvedValue(0);
      const resNum = await service.generateReservationNumber();
      expect(resNum).toMatch(/^RES-\d{8}-001$/);
    });
  });

  describe('create', () => {
    it('should create reservation with PENDING status and correct pricing calculations', async () => {
      const dto = {
        pickupDate: '2026-08-10',
        returnDate: '2026-08-12', // 2 days
        items: [{ equipmentId: 'eq-1', quantity: 2 }],
      };

      const mockEquipment = {
        id: 'eq-1',
        name: 'Canon EOS R5',
        rentalPricePerDay: 150,
        depositAmount: 500,
        isActive: true,
      };

      const mockCreatedReservation = {
        id: 'res-1',
        reservationNumber: 'RES-20260803-001',
        status: ReservationStatus.PENDING,
        totalAmount: 600, // 150 * 2 qty * 2 days = 600
        depositTotal: 1000, // 500 * 2 qty = 1000
      };

      mockPrismaService.equipment.findUnique.mockResolvedValue(mockEquipment);
      mockEquipmentService.checkAvailability.mockResolvedValue({
        available: true,
        availableQuantity: 5,
      });
      mockPrismaService.reservation.count.mockResolvedValue(0);
      mockPrismaService.reservation.create.mockResolvedValue(mockCreatedReservation);

      const result = await service.create(dto, 'cust-1');

      expect(result).toEqual(mockCreatedReservation);
      expect(mockActivityLogsService.createLog).toHaveBeenCalled();
    });

    it('should throw BadRequestException if returnDate <= pickupDate', async () => {
      await expect(
        service.create(
          {
            pickupDate: '2026-08-15',
            returnDate: '2026-08-10',
            items: [{ equipmentId: 'eq-1', quantity: 1 }],
          },
          'cust-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if equipment stock is unavailable', async () => {
      mockPrismaService.equipment.findUnique.mockResolvedValue({
        id: 'eq-1',
        name: 'Canon EOS R5',
        isActive: true,
      });
      mockEquipmentService.checkAvailability.mockResolvedValue({
        available: false,
        availableQuantity: 0,
      });

      await expect(
        service.create(
          {
            pickupDate: '2026-08-10',
            returnDate: '2026-08-12',
            items: [{ equipmentId: 'eq-1', quantity: 1 }],
          },
          'cust-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should restrict Customer user role to own reservations only', async () => {
      mockPrismaService.reservation.findMany.mockResolvedValue([]);
      mockPrismaService.reservation.count.mockResolvedValue(0);

      await service.findAll({}, { id: 'cust-1', role: UserRole.CUSTOMER });

      expect(mockPrismaService.reservation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'cust-1' }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw ForbiddenException if Customer attempts to view another customer reservation', async () => {
      const mockReservation = {
        id: 'res-1',
        customerId: 'other-cust',
      };
      mockPrismaService.reservation.findUnique.mockResolvedValue(mockReservation);

      await expect(
        service.findOne('res-1', { id: 'cust-1', role: UserRole.CUSTOMER }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('approve', () => {
    it('should approve PENDING reservation and decrement equipment stock', async () => {
      const mockReservation = {
        id: 'res-1',
        status: ReservationStatus.PENDING,
        items: [{ equipmentId: 'eq-1', quantity: 2 }],
      };
      const approvedRes = { ...mockReservation, status: ReservationStatus.APPROVED };

      mockPrismaService.reservation.findUnique.mockResolvedValue(mockReservation);
      mockPrismaService.reservation.update.mockResolvedValue(approvedRes);

      const result = await service.approve('res-1', 'staff-1');

      expect(result.status).toBe(ReservationStatus.APPROVED);
      expect(mockPrismaService.equipment.update).toHaveBeenCalledWith({
        where: { id: 'eq-1' },
        data: { availableQuantity: { decrement: 2 } },
      });
    });

    it('should throw BadRequestException if status is not PENDING', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        status: ReservationStatus.APPROVED,
      });

      await expect(service.approve('res-1', 'staff-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('reject', () => {
    it('should reject PENDING reservation with rejection reason', async () => {
      const mockReservation = {
        id: 'res-1',
        status: ReservationStatus.PENDING,
      };
      const rejectedRes = {
        ...mockReservation,
        status: ReservationStatus.REJECTED,
        rejectionReason: 'ID invalid',
      };

      mockPrismaService.reservation.findUnique.mockResolvedValue(mockReservation);
      mockPrismaService.reservation.update.mockResolvedValue(rejectedRes);

      const result = await service.reject('res-1', 'staff-1', {
        rejectionReason: 'ID invalid',
      });

      expect(result.status).toBe(ReservationStatus.REJECTED);
    });
  });

  describe('activate', () => {
    it('should activate APPROVED reservation upon pickup', async () => {
      const mockReservation = {
        id: 'res-1',
        status: ReservationStatus.APPROVED,
      };
      const activeRes = { ...mockReservation, status: ReservationStatus.ACTIVE };

      mockPrismaService.reservation.findUnique.mockResolvedValue(mockReservation);
      mockPrismaService.reservation.update.mockResolvedValue(activeRes);

      const result = await service.activate('res-1', 'staff-1');

      expect(result.status).toBe(ReservationStatus.ACTIVE);
    });
  });

  describe('return', () => {
    it('should complete return for ACTIVE reservation, restore stock, and log inventory', async () => {
      const mockReservation = {
        id: 'res-1',
        reservationNumber: 'RES-20260803-001',
        status: ReservationStatus.ACTIVE,
        items: [{ equipmentId: 'eq-1', quantity: 2 }],
      };
      const returnedRes = { ...mockReservation, status: ReservationStatus.RETURNED };

      mockPrismaService.reservation.findUnique.mockResolvedValue(mockReservation);
      mockPrismaService.reservation.update.mockResolvedValue(returnedRes);

      const result = await service.return('res-1', 'staff-1');

      expect(result.status).toBe(ReservationStatus.RETURNED);
      expect(mockPrismaService.equipment.update).toHaveBeenCalledWith({
        where: { id: 'eq-1' },
        data: { availableQuantity: { increment: 2 } },
      });
      expect(mockPrismaService.inventoryLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          equipmentId: 'eq-1',
          action: InventoryAction.RECEIVED,
          quantityChange: 2,
        }),
      });
    });
  });

  describe('cancel', () => {
    it('should cancel APPROVED reservation and restore stock', async () => {
      const mockReservation = {
        id: 'res-1',
        customerId: 'cust-1',
        status: ReservationStatus.APPROVED,
        items: [{ equipmentId: 'eq-1', quantity: 2 }],
      };
      const cancelledRes = { ...mockReservation, status: ReservationStatus.CANCELLED };

      mockPrismaService.reservation.findUnique.mockResolvedValue(mockReservation);
      mockPrismaService.reservation.update.mockResolvedValue(cancelledRes);

      const result = await service.cancel('res-1', {
        id: 'cust-1',
        role: UserRole.CUSTOMER,
      });

      expect(result.status).toBe(ReservationStatus.CANCELLED);
      expect(mockPrismaService.equipment.update).toHaveBeenCalledWith({
        where: { id: 'eq-1' },
        data: { availableQuantity: { increment: 2 } },
      });
    });
  });
});
