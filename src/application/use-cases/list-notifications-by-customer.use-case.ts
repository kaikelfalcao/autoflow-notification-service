import { Injectable } from '@nestjs/common';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { Notification } from '../../domain/entities/notification.entity';

@Injectable()
export class ListNotificationsByCustomerUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(cpf: string): Promise<Notification[]> {
    return this.notificationRepository.findByCustomerCpf(cpf);
  }
}
