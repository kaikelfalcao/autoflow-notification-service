import {
  Notification,
  NotificationStatus,
} from '../entities/notification.entity';

export abstract class INotificationRepository {
  abstract create(
    notification: Omit<Notification, 'id' | 'retryCount'>,
  ): Promise<Notification>;
  abstract findByOrderId(orderId: string): Promise<Notification[]>;
  abstract findByCustomerCpf(cpf: string): Promise<Notification[]>;
  abstract findById(id: string): Promise<Notification | null>;
  abstract existsByEventIdAndChannel(
    eventId: string,
    channel: string,
  ): Promise<boolean>;
  abstract incrementRetry(id: string): Promise<void>;
  abstract updateStatus(
    id: string,
    status: NotificationStatus,
    errorMessage?: string,
  ): Promise<void>;
}
