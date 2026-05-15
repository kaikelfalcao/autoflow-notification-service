export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  DELIVERED = 'DELIVERED',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PUSH = 'PUSH',
}

export class Notification {
  id?: string;
  eventId: string;
  orderId: string;
  customerCpf: string;
  channel: NotificationChannel;
  template: string;
  variables: Record<string, any>;
  status: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
  retryCount: number;
  correlationId?: string;

  constructor(
    props: Omit<Notification, 'retryCount'> & { retryCount?: number },
  ) {
    Object.assign(this, props);
    this.retryCount = props.retryCount ?? 0;
  }
}
