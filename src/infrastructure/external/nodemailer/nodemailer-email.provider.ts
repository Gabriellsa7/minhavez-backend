import nodemailer, { Transporter } from 'nodemailer';
import { Logger } from 'traceability';
import {
  IEmailPayload,
  IEmailProvider,
} from '../../../domain/auth/interfaces/email-provider.interface';

export class NodemailerEmailProvider implements IEmailProvider {
  private transporter?: Transporter;

  private getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }

    return this.transporter;
  }

  async sendMail(payload: IEmailPayload): Promise<void> {
    try {
      await this.getTransporter().sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      Logger.info('Email sent', { to: payload.to, subject: payload.subject });
    } catch (error) {
      Logger.error('Failed to send email', {
        to: payload.to,
        error: (error as Error).message,
      });
      throw new Error(`Error sending email: ${(error as Error).message}`);
    }
  }
}
