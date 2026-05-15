import { Injectable, Logger } from '@nestjs/common';
import {
  INotificationChannelPort,
  SendMessageInput,
} from '../../domain/ports/notification-channel.port';

// Stub — integrate with FCM/APNs when push tokens are available in the system
@Injectable()
export class PushChannel implements INotificationChannelPort {
  private readonly logger = new Logger(PushChannel.name);

  supports(channel: string): boolean {
    return channel === 'PUSH';
  }

  send(input: SendMessageInput): Promise<void> {
    this.logger.log(`[PUSH stub] To: ${input.to} | Content: ${input.content}`);
    return Promise.resolve();
  }
}
