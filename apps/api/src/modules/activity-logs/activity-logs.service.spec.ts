import { Test, TestingModule } from '@nestjs/testing';
import { ActivityAction } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ActivityLogsService } from './activity-logs.service';

describe('ActivityLogsService', () => {
  let service: ActivityLogsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    activityLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ActivityLogsService>(ActivityLogsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('createLog', () => {
    it('should create an activity log entry', async () => {
      const mockLog = {
        id: 'log-1',
        action: ActivityAction.LOGIN,
        userId: 'u-1',
        ipAddress: '127.0.0.1',
      };
      mockPrismaService.activityLog.create.mockResolvedValue(mockLog);

      const result = await service.createLog({
        userId: 'u-1',
        action: ActivityAction.LOGIN,
        ipAddress: '127.0.0.1',
      });

      expect(result).toEqual(mockLog);
      expect(mockPrismaService.activityLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u-1',
          action: ActivityAction.LOGIN,
          ipAddress: '127.0.0.1',
        }),
      });
    });
  });

  describe('findAll', () => {
    it('should return paginated activity log records', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: ActivityAction.LOGIN,
          user: { id: 'u-1', email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
        },
      ];
      mockPrismaService.activityLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.activityLog.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, pageSize: 10, action: ActivityAction.LOGIN });

      expect(result.data).toEqual(mockLogs);
      expect(result.meta.total).toBe(1);
      expect(mockPrismaService.activityLog.findMany).toHaveBeenCalled();
    });
  });
});
