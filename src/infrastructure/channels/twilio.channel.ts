import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
import {
  INotificationChannelPort,
  SendMessageInput,
} from '../../domain/ports/notification-channel.port';

@Injectable()
export class TwilioChannel implements INotificationChannelPort {
  private readonly logger = new Logger(TwilioChannel.name);
  private client: ReturnType<typeof Twilio> | null = null;

  constructor(private readonly config: ConfigService) {}

  supports(channel: string): boolean {
    return channel === 'SMS' || channel === 'WHATSAPP';
  }

  async send(input: SendMessageInput): Promise<void> {
    const isWhatsapp = input.channel === 'WHATSAPP';
    const from = isWhatsapp
      ? this.config.get<string>(
          'TWILIO_WHATSAPP_NUMBER',
          'whatsapp:+14155238886',
        )
      : this.config.getOrThrow<string>('TWILIO_PHONE_NUMBER');
    const to = isWhatsapp ? `whatsapp:${input.to}` : input.to;

    await this.getClient().messages.create({ body: input.content, from, to });

    this.logger.log(`${input.channel} sent to ${input.to}`);
  }

  private getClient(): ReturnType<typeof Twilio> {
    if (!this.client) {
      this.client = Twilio(
        this.config.getOrThrow<string>('TWILIO_ACCOUNT_SID'),
        this.config.getOrThrow<string>('TWILIO_AUTH_TOKEN'),
      );
    }
    return this.client;
  }
}
