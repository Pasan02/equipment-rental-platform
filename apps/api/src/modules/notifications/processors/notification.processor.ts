import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationsService } from '../notifications.service';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing notification job "${job.name}" [ID: ${job.id}]`);

    switch (job.name) {
      case 'create-inapp-notification':
        return this.notificationsService.createNotification(
          job.data.userId,
          job.data.title,
          job.data.message,
          job.data.type,
          job.data.data,
        );

      default:
        this.logger.warn(`Unknown notification job type: ${job.name}`);
        return null;
      }
  }
}
