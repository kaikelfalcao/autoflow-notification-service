import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { Notification } from '../../domain/entities/notification.entity';

@Injectable()
export class ListNotificationsByOrderUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(orderId: string): Promise<Notification[]> {
    return this.notificationRepository.findByOrderId(orderId);
  }
}
