import { Injectable } from '@nestjs/common';
import { IChannelFactory } from '../../domain/ports/channel-factory.port';
import { INotificationChannelPort } from '../../domain/ports/notification-channel.port';
import { SendGridChannel } from './sendgrid.channel';
import { TwilioChannel } from './twilio.channel';
import { PushChannel } from './push.channel';

@Injectable()
export class ChannelFactory implements IChannelFactory {
  private readonly channels: INotificationChannelPort[];

  constructor(
    sendGrid: SendGridChannel,
    twilio: TwilioChannel,
    push: PushChannel,
  ) {
    this.channels = [sendGrid, twilio, push];
  }

  getChannel(channel: string): INotificationChannelPort {
    const adapter = this.channels.find((c) => c.supports(channel));

    if (!adapter) {
      throw new Error(`No channel adapter found for: ${channel}`);
    }

    return adapter;
  }
}
