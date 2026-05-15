import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sgMail from '@sendgrid/mail';
import {
  INotificationChannelPort,
  SendMessageInput,
} from '../../domain/ports/notification-channel.port';

@Injectable()
export class SendGridChannel implements INotificationChannelPort {
  private readonly logger = new Logger(SendGridChannel.name);
  private initialized = false;

  constructor(private readonly config: ConfigService) {}

  supports(channel: string): boolean {
    return channel === 'EMAIL';
  }

  async send(input: SendMessageInput): Promise<void> {
    this.ensureInitialized();

    await sgMail.send({
      to: input.to,
      from: this.config.getOrThrow<string>('SENDGRID_FROM_EMAIL'),
      subject: input.subject ?? 'Notificação AutoFlow',
      html: input.content,
    });

    this.logger.log(`Email sent to ${input.to}`);
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      sgMail.setApiKey(this.config.getOrThrow<string>('SENDGRID_API_KEY'));
      this.initialized = true;
    }
  }
}
