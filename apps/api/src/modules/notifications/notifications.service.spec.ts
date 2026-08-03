import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationType } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;

  const mockNotification = {
    id: 'notif-uuid-1',
    userId: 'user-uuid-1',
    title: 'Reservation Approved',
    message: 'Your reservation RES-20260803-001 has been approved',
    type: NotificationType.RESERVATION_APPROVED,
    isRead: false,
    data: { reservationId: 'res-1' },
    readAt: null,
    createdAt: new Date(),
  };

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create an in-app notification', async () => {
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await service.createNotification(
        'user-uuid-1',
        'Reservation Approved',
        'Your reservation RES-20260803-001 has been approved',
        NotificationType.RESERVATION_APPROVED,
        { reservationId: 'res-1' },
      );

      expect(result).toBeDefined();
      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-uuid-1',
          title: 'Reservation Approved',
          message: 'Your reservation RES-20260803-001 has been approved',
          type: NotificationType.RESERVATION_APPROVED,
          data: { reservationId: 'res-1' },
        },
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated list of notifications for user', async () => {
      mockPrismaService.notification.count.mockResolvedValue(1);
      mockPrismaService.notification.findMany.mockResolvedValue([mockNotification]);

      const result = await service.findAll('user-uuid-1', { page: 1, pageSize: 10 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockPrismaService.notification.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user-uuid-1');

      expect(result.count).toBe(5);
      expect(mockPrismaService.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1', isRead: false },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read for owner', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(mockNotification);
      mockPrismaService.notification.update.mockResolvedValue({
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
      });

      const result = await service.markAsRead('notif-uuid-1', 'user-uuid-1');

      expect(result.isRead).toBe(true);
    });

    it('should throw ForbiddenException if user attempts to mark another user notification as read', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(mockNotification);

      await expect(service.markAsRead('notif-uuid-1', 'user-uuid-other')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      mockPrismaService.notification.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead('invalid-notif-id', 'user-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for user', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.markAllAsRead('user-uuid-1');

      expect(result.count).toBe(3);
      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1', isRead: false },
        data: { isRead: true, readAt: expect.any(Date) },
      });
    });
  });
});
