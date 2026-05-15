export interface SendMessageInput {
  to: string;
  subject?: string;
  content: string;
  channel: string;
}

export abstract class INotificationChannelPort {
  abstract supports(channel: string): boolean;
  abstract send(input: SendMessageInput): Promise<void>;
}
