import { Injectable } from '@nestjs/common';
import { ActivityAction } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { QueryActivityLogsDto } from './dto/query-activity-logs.dto';

export interface CreateActivityLogParams {
  userId?: string;
  action: ActivityAction;
  entityType?: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class ActivityLogsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper method to record an activity log entry
   */
  async createLog(params: CreateActivityLogParams) {
    return this.prisma.activityLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        oldValues: params.oldValues || undefined,
        newValues: params.newValues || undefined,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  }

  /**
   * Find activity logs with pagination, search, and date filters (ADMIN only)
   */
  async findAll(query: QueryActivityLogsDto) {
    const {
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      userId,
      action,
      entityType,
      fromDate,
      toDate,
    } = query;

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = { equals: entityType, mode: 'insensitive' };
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        // Set to end of the day for inclusive date filtering
        const endOfToDate = new Date(toDate);
        endOfToDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfToDate;
      }
    }

    if (search) {
      where.OR = [
        { entityType: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          oldValues: true,
          newValues: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      data: logs,
      meta: {
        total,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}
