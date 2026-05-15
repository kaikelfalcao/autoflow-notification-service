/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// amqplib 1.x exports via channel_api.js (ESM/nodenext) without bundled .d.ts —
// unsafe-* rules disabled for this file; runtime behaviour is fully tested.
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp from 'amqplib';
import { HandleEventUseCase } from '../../application/use-cases/handle-event.use-case';
import { IncomingEvent } from '../../domain/events/incoming-event.interface';

interface QueueBinding {
  exchange: string;
  routingKey: string;
  queue: string;
}

const QUEUE_BINDINGS: QueueBinding[] = [
  {
    exchange: 'order.events',
    routingKey: 'order.#',
    queue: 'notification.order.all',
  },
  {
    exchange: 'payment.events',
    routingKey: 'payment.#',
    queue: 'notification.payment.all',
  },
  {
    exchange: 'customer.events',
    routingKey: 'customer.#',
    queue: 'notification.customer.all',
  },
];

@Injectable()
export class RabbitMQConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQConsumer.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;

  constructor(
    private readonly handleEvent: HandleEventUseCase,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
    await this.setupConsumers();
  }

  async onModuleDestroy(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  private async connect(): Promise<void> {
    const url = this.config.getOrThrow<string>('RABBITMQ_URL');
    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    void this.channel.prefetch(10);
    this.logger.log('RabbitMQ connected');
  }

  private async setupConsumers(): Promise<void> {
    await Promise.all(QUEUE_BINDINGS.map((binding) => this.consume(binding)));
  }

  private async consume({
    exchange,
    routingKey,
    queue,
  }: QueueBinding): Promise<void> {
    const dlqExchange = `${exchange}.dlq`;
    const dlqQueue = `${queue}.dlq`;

    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertExchange(dlqExchange, 'fanout', { durable: true });

    await this.channel.assertQueue(queue, {
      durable: true,
      arguments: { 'x-dead-letter-exchange': dlqExchange },
    });
    await this.channel.bindQueue(queue, exchange, routingKey);

    await this.channel.assertQueue(dlqQueue, { durable: true });
    await this.channel.bindQueue(dlqQueue, dlqExchange, '');

    await this.channel.consume(queue, (msg) => {
      void (async () => {
        if (!msg) return;

        const correlationId =
          (msg.properties.headers as Record<string, string>)?.[
            'x-correlation-id'
          ] ?? 'unknown';

        try {
          const event: IncomingEvent = JSON.parse(
            msg.content.toString(),
          ) as IncomingEvent;

          this.logger.log({
            message: `Event received: ${event.eventType}`,
            eventId: event.eventId,
            correlationId: event.correlationId ?? correlationId,
          });

          await this.handleEvent.execute(event);

          this.channel.ack(msg);
        } catch (error) {
          this.logger.error({
            message: 'Error processing message',
            correlationId,
            error: (error as Error).message,
          });

          this.channel.nack(msg, false, false);
        }
      })();
    });

    this.logger.log(`Consumer listening on ${queue} | DLQ: ${dlqQueue}`);
  }
}
