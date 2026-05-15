import { INotificationChannelPort } from './notification-channel.port';

export abstract class IChannelFactory {
  abstract getChannel(channel: string): INotificationChannelPort;
}
