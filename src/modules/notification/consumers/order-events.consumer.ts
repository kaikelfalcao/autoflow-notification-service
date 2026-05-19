import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';

import { NotificationService } from '../notification.service';
import type { EventEnvelope } from '../notification.service';

@Injectable()
export class OrderEventsConsumer {
  private readonly logger = new Logger(OrderEventsConsumer.name);

  constructor(private readonly service: NotificationService) {}

  @RabbitSubscribe({
    exchange: 'order.events',
    routingKey: 'order.created',
    queue: 'notification.order.created',
    queueOptions: { durable: true },
  })
  async onCreated(msg: EventEnvelope): Promise<Nack | void> {
    try {
      await this.service.handleOrderCreated(msg);
    } catch (err) {
      this.logger.error(`order.created failed: ${(err as Error).message}`);
      return new Nack(false);
    }
  }

  @RabbitSubscribe({
    exchange: 'order.events',
    routingKey: 'order.budget.generated',
    queue: 'notification.order.budget-generated',
    queueOptions: { durable: true },
  })
  async onBudgetGenerated(msg: EventEnvelope): Promise<Nack | void> {
    try {
      await this.service.handleBudgetGenerated(msg);
    } catch (err) {
      this.logger.error(
        `order.budget.generated failed: ${(err as Error).message}`,
      );
      return new Nack(false);
    }
  }

  @RabbitSubscribe({
    exchange: 'order.events',
    routingKey: 'order.budget.approved',
    queue: 'notification.order.budget-approved',
    queueOptions: { durable: true },
  })
  async onBudgetApproved(msg: EventEnvelope): Promise<Nack | void> {
    try {
      await this.service.handleBudgetApproved(msg);
    } catch (err) {
      this.logger.error(
        `order.budget.approved failed: ${(err as Error).message}`,
      );
      return new Nack(false);
    }
  }

  @RabbitSubscribe({
    exchange: 'order.events',
    routingKey: 'order.payment.requested',
    queue: 'notification.order.payment-requested',
    queueOptions: { durable: true },
  })
  async onPaymentRequested(msg: EventEnvelope): Promise<Nack | void> {
    try {
      await this.service.handlePaymentRequested(msg);
    } catch (err) {
      this.logger.error(
        `order.payment.requested failed: ${(err as Error).message}`,
      );
      return new Nack(false);
    }
  }

  @RabbitSubscribe({
    exchange: 'order.events',
    routingKey: 'order.cancelled',
    queue: 'notification.order.cancelled',
    queueOptions: { durable: true },
  })
  async onCancelled(msg: EventEnvelope): Promise<Nack | void> {
    try {
      await this.service.handleOrderCancelled(msg);
    } catch (err) {
      this.logger.error(`order.cancelled failed: ${(err as Error).message}`);
      return new Nack(false);
    }
  }
}
