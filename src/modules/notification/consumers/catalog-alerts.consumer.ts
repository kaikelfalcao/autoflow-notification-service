import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';

import { NotificationService } from '../notification.service';
import type { EventEnvelope } from '../notification.service';

@Injectable()
export class CatalogAlertsConsumer {
  private readonly logger = new Logger(CatalogAlertsConsumer.name);

  constructor(private readonly service: NotificationService) {}

  @RabbitSubscribe({
    exchange: 'oficina.alerts',
    routingKey: 'stock.low-stock-alert',
    queue: 'notification.stock.low-stock-alert',
    queueOptions: { durable: true },
  })
  async onLowStock(msg: EventEnvelope): Promise<Nack | void> {
    try {
      await this.service.handleLowStockAlert(msg);
    } catch (err) {
      this.logger.error(`low-stock-alert failed: ${(err as Error).message}`);
      return new Nack(false);
    }
  }
}
