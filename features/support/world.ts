import { setWorldConstructor, World } from '@cucumber/cucumber';

import type { NotificationRepository } from '../../src/modules/notification/infra/repositories/notification.repository';
import type { Notification } from '../../src/modules/notification/infra/schemas/notification.schema';
import { NotificationService } from '../../src/modules/notification/notification.service';

class InMemoryRepo {
  rows: Array<Partial<Notification>> = [];

  async create(n: Partial<Notification>): Promise<Notification> {
    this.rows.push(n);
    return n as Notification;
  }

  async findByOrderId(orderId: string): Promise<Notification[]> {
    return this.rows.filter((r) => r.orderId === orderId) as Notification[];
  }

  async incrementRetry(): Promise<void> {
    /* not used in BDD */
  }

  byOrder(orderId: string): Partial<Notification> | undefined {
    return [...this.rows].reverse().find((r) => r.orderId === orderId);
  }

  byCpf(cpf: string): Partial<Notification> | undefined {
    return [...this.rows].reverse().find((r) => r.customerCpf === cpf);
  }
}

export class NotificationWorld extends World {
  repo = new InMemoryRepo();
  service = new NotificationService(
    this.repo as unknown as NotificationRepository,
  );
}

setWorldConstructor(NotificationWorld);
