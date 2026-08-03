import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { MailService } from './services/mail.service';
import { ScheduledJobsService } from './services/scheduled-jobs.service';
import { EmailProcessor } from './processors/email.processor';
import { NotificationProcessor } from './processors/notification.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host') || 'localhost',
          port: configService.get<number>('redis.port') || 6379,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'emails' },
      { name: 'scheduled' },
    ),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    MailService,
    ScheduledJobsService,
    EmailProcessor,
    NotificationProcessor,
  ],
  exports: [
    NotificationsService,
    MailService,
    ScheduledJobsService,
    BullModule,
  ],
})
export class NotificationsModule {}
