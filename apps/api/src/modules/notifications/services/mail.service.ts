import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('smtp.host');
    const port = this.configService.get<number>('smtp.port') || 587;
    const user = this.configService.get<string>('smtp.user');
    const pass = this.configService.get<string>('smtp.pass');
    this.fromEmail =
      this.configService.get<string>('smtp.from') ||
      'Equipment Rental <noreply@equipmentrental.com>';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log(`SMTP Mail Transporter initialized (${host}:${port})`);
    } else {
      this.logger.warn(
        'SMTP credentials not fully configured — falling back to Logger email delivery',
      );
    }
  }

  /**
   * Generic email dispatcher
   */
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromEmail,
          to,
          subject,
          html,
        });
        this.logger.log(
          `Email successfully sent to ${to} [Subject: ${subject}]`,
        );
        return true;
      } catch (error) {
        this.logger.error(
          `Failed to send email via SMTP to ${to}: ${error.message}`,
          error.stack,
        );
      }
    }

    // Logger Fallback for development/testing environments
    this.logger.log(`[SIMULATED EMAIL DISPATCH]
TO: ${to}
SUBJECT: ${subject}
BODY:
${html.replace(/<[^>]*>/g, '')}`);
    return true;
  }

  /**
   * Reservation Approved Email
   */
  async sendReservationApprovedEmail(
    to: string,
    data: {
      customerName: string;
      reservationNumber: string;
      totalAmount: number;
      pickupDate: string;
      returnDate: string;
    },
  ) {
    const subject = `Reservation Approved — ${data.reservationNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2e7d32;">🎉 Reservation Approved!</h2>
        <p>Dear ${data.customerName},</p>
        <p>We are pleased to inform you that your equipment reservation <strong>${data.reservationNumber}</strong> has been approved by our team.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Reservation #:</strong> ${data.reservationNumber}</p>
          <p style="margin: 5px 0;"><strong>Pickup Date:</strong> ${data.pickupDate}</p>
          <p style="margin: 5px 0;"><strong>Return Date:</strong> ${data.returnDate}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> $${data.totalAmount.toFixed(2)}</p>
        </div>
        <p>Please remember to bring your identification document when picking up your equipment.</p>
        <p>Thank you for choosing Equipment Rental Platform!</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  /**
   * Reservation Rejected Email
   */
  async sendReservationRejectedEmail(
    to: string,
    data: {
      customerName: string;
      reservationNumber: string;
      rejectionReason: string;
    },
  ) {
    const subject = `Reservation Status Update — ${data.reservationNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #c62828;">Reservation Update</h2>
        <p>Dear ${data.customerName},</p>
        <p>Regrettably, your reservation <strong>${data.reservationNumber}</strong> could not be approved at this time.</p>
        <div style="background-color: #ffebee; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #c62828;">
          <p style="margin: 5px 0;"><strong>Reason:</strong> ${data.rejectionReason}</p>
        </div>
        <p>If you have questions or would like to select alternative equipment, please contact our support team.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  /**
   * Upcoming Return Reminder Email
   */
  async sendUpcomingReturnEmail(
    to: string,
    data: {
      customerName: string;
      reservationNumber: string;
      returnDate: string;
    },
  ) {
    const subject = `Reminder: Equipment Return Due Tomorrow (${data.reservationNumber})`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #f57c00;">⏰ Upcoming Equipment Return Reminder</h2>
        <p>Dear ${data.customerName},</p>
        <p>This is a friendly reminder that your equipment rental for reservation <strong>${data.reservationNumber}</strong> is due for return tomorrow, <strong>${data.returnDate}</strong>.</p>
        <p>Please ensure all items and accessories are returned in good working condition to avoid late fees.</p>
        <p>Thank you!</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  /**
   * Reservation Expired Email
   */
  async sendReservationExpiredEmail(
    to: string,
    data: {
      customerName: string;
      reservationNumber: string;
    },
  ) {
    const subject = `Reservation Expired — ${data.reservationNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #616161;">Reservation Expired</h2>
        <p>Dear ${data.customerName},</p>
        <p>Your pending reservation <strong>${data.reservationNumber}</strong> has expired because it was not approved within the required 48-hour window.</p>
        <p>You may submit a new reservation request at any time through our catalog.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }

  /**
   * Password Reset Email
   */
  async sendPasswordResetEmail(to: string, resetUrl: string) {
    const subject = 'Password Reset Request';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2>Password Reset</h2>
        <p>You requested a password reset for your Equipment Rental Platform account.</p>
        <p>Please click the button below to reset your password. This link is valid for 1 hour:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If you did not request this reset, you can safely ignore this email.</p>
      </div>
    `;
    return this.sendEmail(to, subject, html);
  }
}
