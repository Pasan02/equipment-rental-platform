import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from '../services/mail.service';

@Processor('emails')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing email job "${job.name}" [ID: ${job.id}]`);

    switch (job.name) {
      case 'reservation-approved':
        return this.mailService.sendReservationApprovedEmail(
          job.data.to,
          job.data,
        );

      case 'reservation-rejected':
        return this.mailService.sendReservationRejectedEmail(
          job.data.to,
          job.data,
        );

      case 'upcoming-return':
        return this.mailService.sendUpcomingReturnEmail(job.data.to, job.data);

      case 'reservation-expired':
        return this.mailService.sendReservationExpiredEmail(
          job.data.to,
          job.data,
        );

      case 'password-reset':
        return this.mailService.sendPasswordResetEmail(
          job.data.to,
          job.data.resetUrl,
        );

      case 'send-email':
        return this.mailService.sendEmail(
          job.data.to,
          job.data.subject,
          job.data.html,
        );

      default:
        this.logger.warn(`Unknown email job type: ${job.name}`);
        return null;
    }
  }
}
