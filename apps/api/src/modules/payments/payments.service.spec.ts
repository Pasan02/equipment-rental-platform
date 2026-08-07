import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PaymentStatus,
  PaymentType,
  UserRole,
} from '@equipment-rental/shared-types';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPrismaService = {
    payment: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    reservation: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  const mockActivityLogsService = {
    createLog: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ActivityLogsService, useValue: mockActivityLogsService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('generateTransactionId', () => {
    it('should generate a string starting with TXN prefix', () => {
      const txnId = service.generateTransactionId();
      expect(txnId).toMatch(/^TXN-\d{8}-[A-Z0-9]{6}$/);
    });
  });

  describe('create', () => {
    it('should create payment with PENDING status', async () => {
      const dto = {
        reservationId: 'res-1',
        amount: 600,
        type: PaymentType.RENTAL,
        paymentMethod: 'credit_card',
      };

      const mockReservation = { id: 'res-1', customerId: 'cust-1' };
      const mockPayment = {
        id: 'pay-1',
        transactionId: 'TXN-20260803-123456',
        ...dto,
        status: PaymentStatus.PENDING,
      };

      mockPrismaService.reservation.findUnique.mockResolvedValue(
        mockReservation,
      );
      mockPrismaService.payment.create.mockResolvedValue(mockPayment);

      const result = await service.create(dto, {
        id: 'cust-1',
        role: UserRole.CUSTOMER,
      });

      expect(result).toEqual(mockPayment);
      expect(mockActivityLogsService.createLog).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if customer creates payment for another customer reservation', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue({
        id: 'res-1',
        customerId: 'other-cust',
      });

      await expect(
        service.create(
          {
            reservationId: 'res-1',
            amount: 100,
            type: PaymentType.RENTAL,
          },
          { id: 'cust-1', role: UserRole.CUSTOMER },
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if reservation does not exist', async () => {
      mockPrismaService.reservation.findUnique.mockResolvedValue(null);

      await expect(
        service.create(
          {
            reservationId: 'non-existent',
            amount: 100,
            type: PaymentType.RENTAL,
          },
          { id: 'cust-1', role: UserRole.CUSTOMER },
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should restrict Customer user role to own reservation payments only', async () => {
      mockPrismaService.payment.findMany.mockResolvedValue([]);
      mockPrismaService.payment.count.mockResolvedValue(0);

      await service.findAll({}, { id: 'cust-1', role: UserRole.CUSTOMER });

      expect(mockPrismaService.payment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reservation: { customerId: 'cust-1' },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw ForbiddenException if Customer views another user payment record', async () => {
      const mockPayment = {
        id: 'pay-1',
        reservation: { customerId: 'other-cust' },
      };
      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);

      await expect(
        service.findOne('pay-1', { id: 'cust-1', role: UserRole.CUSTOMER }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('processPayment', () => {
    it('should process PENDING payment to PAID status', async () => {
      const mockPayment = {
        id: 'pay-1',
        status: PaymentStatus.PENDING,
        reservation: { id: 'res-1' },
      };
      const processedPayment = {
        ...mockPayment,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      };

      mockPrismaService.payment.findUnique.mockResolvedValue(mockPayment);
      mockPrismaService.payment.update.mockResolvedValue(processedPayment);

      const result = await service.processPayment('pay-1', {
        status: PaymentStatus.PAID,
      });

      expect(result.status).toBe(PaymentStatus.PAID);
    });

    it('should throw BadRequestException if payment status is not PENDING', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: PaymentStatus.PAID,
        reservation: { id: 'res-1' },
      });

      await expect(service.processPayment('pay-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('refund', () => {
    it('should refund PAID payment by marking original as REFUNDED and creating a REFUND payment record', async () => {
      const originalPayment = {
        id: 'pay-1',
        reservationId: 'res-1',
        transactionId: 'TXN-20260803-111111',
        amount: 600,
        status: PaymentStatus.PAID,
        paymentMethod: 'credit_card',
        reservation: { id: 'res-1', customerId: 'cust-1' },
      };

      const refundRecord = {
        id: 'pay-refund-1',
        reservationId: 'res-1',
        transactionId: 'TXN-20260803-222222',
        amount: 600,
        type: PaymentType.REFUND,
        status: PaymentStatus.REFUNDED,
      };

      mockPrismaService.payment.findUnique.mockResolvedValue(originalPayment);
      mockPrismaService.payment.update.mockResolvedValue({
        ...originalPayment,
        status: PaymentStatus.REFUNDED,
      });
      mockPrismaService.payment.create.mockResolvedValue(refundRecord);

      const result = await service.refund(
        'pay-1',
        { reason: 'Cancellation' },
        'admin-1',
      );

      expect(result).toEqual(refundRecord);
      expect(mockPrismaService.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { status: PaymentStatus.REFUNDED },
      });
    });

    it('should throw BadRequestException if original payment status is not PAID', async () => {
      mockPrismaService.payment.findUnique.mockResolvedValue({
        id: 'pay-1',
        status: PaymentStatus.PENDING,
        reservation: { id: 'res-1' },
      });

      await expect(service.refund('pay-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
