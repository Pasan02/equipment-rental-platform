import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated user records with meta', async () => {
      const mockUsers = [
        {
          id: '1',
          email: 'user1@test.com',
          firstName: 'A',
          lastName: 'B',
          role: UserRole.CUSTOMER,
        },
      ];
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10 });
      expect(result.data).toEqual(mockUsers);
      expect(result.meta.total).toBe(1);
      expect(result.meta.totalPages).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return user details for self profile request', async () => {
      const mockUser = {
        id: 'u1',
        email: 'u1@test.com',
        role: UserRole.CUSTOMER,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('u1', {
        id: 'u1',
        role: UserRole.CUSTOMER,
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw ForbiddenException if customer attempts to view another user', async () => {
      await expect(
        service.findOne('u2', { id: 'u1', role: UserRole.CUSTOMER }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow ADMIN to view any user profile', async () => {
      const mockUser = {
        id: 'u2',
        email: 'u2@test.com',
        role: UserRole.CUSTOMER,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('u2', {
        id: 'admin1',
        role: UserRole.ADMIN,
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      await expect(
        service.findOne('u99', { id: 'admin1', role: UserRole.ADMIN }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should allow self profile update for name and phone', async () => {
      const mockUser = { id: 'u1', firstName: 'John', lastName: 'Doe' };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        firstName: 'Johnny',
      });

      const result = await service.update(
        'u1',
        { firstName: 'Johnny' },
        { id: 'u1', role: UserRole.CUSTOMER },
      );

      expect(result.firstName).toBe('Johnny');
    });

    it('should throw ForbiddenException if non-admin tries to change role or active status', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'u1' });
      await expect(
        service.update(
          'u1',
          { role: UserRole.ADMIN },
          { id: 'u1', role: UserRole.CUSTOMER },
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully when current password is correct', async () => {
      const hashedOldPassword = await bcrypt.hash('OldPassword1!', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: hashedOldPassword,
      });
      mockPrismaService.user.update.mockResolvedValue({});
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({});

      const result = await service.changePassword(
        'u1',
        { currentPassword: 'OldPassword1!', newPassword: 'NewSecureP@ss1' },
        { id: 'u1', role: UserRole.CUSTOMER },
      );

      expect(result.message).toBe('Password changed successfully');
      expect(mockPrismaService.user.update).toHaveBeenCalled();
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'u1', isRevoked: false },
        data: { isRevoked: true },
      });
    });

    it('should throw BadRequestException if current password is incorrect', async () => {
      const hashedOldPassword = await bcrypt.hash('OldPassword1!', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: hashedOldPassword,
      });

      await expect(
        service.changePassword(
          'u1',
          { currentPassword: 'WrongPassword!', newPassword: 'NewSecureP@ss1' },
          { id: 'u1', role: UserRole.CUSTOMER },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
