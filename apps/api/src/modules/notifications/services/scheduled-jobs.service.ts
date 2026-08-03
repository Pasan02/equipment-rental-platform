import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications.service';
import { MailService } from './mail.service';
import { ReservationStatus, NotificationType } from '@prisma/client';

@Injectable()
export class ScheduledJobsService {
  private readonly logger = new Logger(ScheduledJobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Daily Cron at 8:00 AM — Check for upcoming returns due tomorrow (US-6.3, R-51)
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkUpcomingReturns() {
    this.logger.log('Executing Scheduled Task: Upcoming Return Reminders...');

    const tomorrowStart = new Date();
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        status: { in: [ReservationStatus.APPROVED, ReservationStatus.ACTIVE] },
        returnDate: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
      },
      include: {
        customer: true,
      },
    });

    this.logger.log(`Found ${reservations.length} reservation(s) due for return tomorrow`);

    for (const reservation of reservations) {
      const returnDateStr = reservation.returnDate.toISOString().split('T')[0];
      const title = 'Upcoming Equipment Return';
      const message = `Your rental equipment for reservation ${reservation.reservationNumber} is due for return tomorrow (${returnDateStr}).`;

      // 1. Create in-app notification
      await this.notificationsService.createNotification(
        reservation.customerId,
        title,
        message,
        NotificationType.UPCOMING_RETURN,
        { reservationId: reservation.id, reservationNumber: reservation.reservationNumber },
      );

      // 2. Send email
      if (reservation.customer?.email) {
        await this.mailService.sendUpcomingReturnEmail(reservation.customer.email, {
          customerName: `${reservation.customer.firstName} ${reservation.customer.lastName}`,
          reservationNumber: reservation.reservationNumber,
          returnDate: returnDateStr,
        });
      }
    }

    return { processedCount: reservations.length };
  }

  /**
   * Hourly Cron — Check for expired pending reservations older than 48 hours (US-6.4, R-52)
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiredReservations() {
    this.logger.log('Executing Scheduled Task: Check Expired Reservations...');

    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 48);

    const expiredReservations = await this.prisma.reservation.findMany({
      where: {
        status: ReservationStatus.PENDING,
        createdAt: {
          lt: cutoffDate,
        },
      },
      include: {
        customer: true,
      },
    });

    this.logger.log(`Found ${expiredReservations.length} expired pending reservation(s)`);

    for (const reservation of expiredReservations) {
      await this.prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          status: ReservationStatus.CANCELLED,
          rejectionReason: 'Auto-cancelled: Expired after 48 hours without approval',
        },
      });

      const title = 'Reservation Expired';
      const message = `Your reservation ${reservation.reservationNumber} has expired and was auto-cancelled because it was not approved within 48 hours.`;

      // 1. Create in-app notification
      await this.notificationsService.createNotification(
        reservation.customerId,
        title,
        message,
        NotificationType.RESERVATION_EXPIRED,
        { reservationId: reservation.id, reservationNumber: reservation.reservationNumber },
      );

      // 2. Send email
      if (reservation.customer?.email) {
        await this.mailService.sendReservationExpiredEmail(reservation.customer.email, {
          customerName: `${reservation.customer.firstName} ${reservation.customer.lastName}`,
          reservationNumber: reservation.reservationNumber,
        });
      }
    }

    return { processedCount: expiredReservations.length };
  }
}
