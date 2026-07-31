import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    activityLog: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked-token'),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.secret') return 'jwt-secret';
      if (key === 'jwt.accessExpiration') return '15m';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('SEC-02: refreshToken Reuse Detection', () => {
    it('should revoke all active user sessions if a revoked refresh token is presented', async () => {
      const revokedTokenRecord = {
        id: 'token-123',
        userId: 'user-456',
        token: 'revoked-token-string',
        isRevoked: true,
        expiresAt: new Date(Date.now() + 100000),
        user: { id: 'user-456', isActive: true, role: UserRole.CUSTOMER },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(revokedTokenRecord);

      await expect(
        service.refreshToken({ refreshToken: 'revoked-token-string' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-456', isRevoked: false },
        data: { isRevoked: true },
      });
    });
  });

  describe('SEC-01: forgotPassword Log Security', () => {
    it('should return standard success message and not throw when processing forgotPassword', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hash',
        isActive: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const response = await service.forgotPassword({ email: 'test@example.com' });
      expect(response).toEqual({
        message: 'If the email exists, a password reset link has been sent',
      });
      expect(mockJwtService.sign).toHaveBeenCalled();
    });
  });
});
