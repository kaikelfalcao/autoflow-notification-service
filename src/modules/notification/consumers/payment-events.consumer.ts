import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';

import { NotificationService } from '../notification.service';

interface PaymentEventPayload {
  orderId: string;
  reason?: string;
}

@Injectable()
export class PaymentEventsConsumer {
  private readonly logger = new Logger(PaymentEventsConsumer.name);

  constructor(private readonly service: NotificationService) {}

  @RabbitSubscribe({
    exchange: 'payment.events',
    routingKey: 'payment.confirmed',
    queue: 'notification.payment.confirmed',
    queueOptions: { durable: true },
  })
  async onConfirmed(payload: PaymentEventPayload): Promise<Nack | void> {
    try {
      await this.service.handlePaymentConfirmed({ orderId: payload.orderId });
    } catch (err) {
      this.logger.error(`payment.confirmed failed: ${(err as Error).message}`);
      return new Nack(false);
    }
  }

  @RabbitSubscribe({
    exchange: 'payment.events',
    routingKey: 'payment.failed',
    queue: 'notification.payment.failed',
    queueOptions: { durable: true },
  })
  async onFailed(payload: PaymentEventPayload): Promise<Nack | void> {
    try {
      await this.service.handlePaymentFailed({
        orderId: payload.orderId,
        reason: payload.reason,
      });
    } catch (err) {
      this.logger.error(`payment.failed failed: ${(err as Error).message}`);
      return new Nack(false);
    }
  }
}
