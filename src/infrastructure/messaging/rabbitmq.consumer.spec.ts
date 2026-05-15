import { ConfigService } from '@nestjs/config';
import { RabbitMQConsumer } from './rabbitmq.consumer';
import { HandleEventUseCase } from '../../application/use-cases/handle-event.use-case';

const mockChannel = {
  prefetch: jest.fn(),
  assertExchange: jest.fn().mockResolvedValue({}),
  assertQueue: jest.fn().mockResolvedValue({ queue: 'test-queue' }),
  bindQueue: jest.fn().mockResolvedValue({}),
  consume: jest.fn().mockResolvedValue({}),
  ack: jest.fn(),
  nack: jest.fn(),
  close: jest.fn().mockResolvedValue({}),
};

const mockConnection = {
  createChannel: jest.fn().mockResolvedValue(mockChannel),
  close: jest.fn().mockResolvedValue({}),
};

jest.mock('amqplib', () => ({
  connect: jest.fn().mockImplementation(() => Promise.resolve(mockConnection)),
}));

import amqp from 'amqplib';

const makeConfig = () =>
  ({
    getOrThrow: jest.fn().mockReturnValue('amqp://localhost'),
  }) as unknown as ConfigService;

describe('RabbitMQConsumer', () => {
  let consumer: RabbitMQConsumer;
  let handleEvent: jest.Mocked<HandleEventUseCase>;
  let config: ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockChannel.assertExchange.mockResolvedValue({});
    mockChannel.assertQueue.mockResolvedValue({ queue: 'test-queue' });
    mockChannel.bindQueue.mockResolvedValue({});
    mockChannel.consume.mockResolvedValue({});
    mockConnection.createChannel.mockResolvedValue(mockChannel);
    (amqp.connect as jest.Mock).mockResolvedValue(mockConnection);

    handleEvent = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<HandleEventUseCase>;
    config = makeConfig();
    consumer = new RabbitMQConsumer(handleEvent, config);
  });

  describe('onModuleInit', () => {
    it('should connect to RabbitMQ and set up consumers', async () => {
      await consumer.onModuleInit();

      expect(amqp.connect).toHaveBeenCalledWith('amqp://localhost');
      expect(mockConnection.createChannel).toHaveBeenCalled();
      expect(mockChannel.prefetch).toHaveBeenCalledWith(10);
    });

    it('should assert all 3 main exchanges', async () => {
      await consumer.onModuleInit();

      const exchangeNames = mockChannel.assertExchange.mock.calls.map(
        ([name]) => name,
      );
      expect(exchangeNames).toContain('order.events');
      expect(exchangeNames).toContain('payment.events');
      expect(exchangeNames).toContain('customer.events');
    });

    it('should assert all 3 main queues', async () => {
      await consumer.onModuleInit();

      const queueNames = mockChannel.assertQueue.mock.calls.map(
        ([name]) => name,
      );
      expect(queueNames).toContain('notification.order.all');
      expect(queueNames).toContain('notification.payment.all');
      expect(queueNames).toContain('notification.customer.all');
    });

    it('should configure DLQ for each queue', async () => {
      await consumer.onModuleInit();

      const dlqQueues = mockChannel.assertQueue.mock.calls
        .map(([name]) => name)
        .filter((name: string) => name.endsWith('.dlq'));

      expect(dlqQueues).toHaveLength(3);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close channel and connection gracefully', async () => {
      await consumer.onModuleInit();
      await consumer.onModuleDestroy();

      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });
  });

  describe('message processing', () => {
    let consumeCallback: (msg: unknown) => Promise<void>;

    beforeEach(async () => {
      mockChannel.consume.mockImplementation((_queue, cb) => {
        consumeCallback = cb;
        return Promise.resolve({});
      });

      await consumer.onModuleInit();
    });

    const makeMsg = (payload: object, headers = {}) => ({
      content: Buffer.from(JSON.stringify(payload)),
      properties: { headers },
    });

    it('should call handleEvent and ack on successful processing', async () => {
      const msg = makeMsg({
        eventId: 'evt-1',
        eventType: 'OS_CREATED',
        timestamp: new Date().toISOString(),
        source: 'order-service',
        correlationId: 'corr-1',
        payload: {},
      });

      await consumeCallback(msg);

      expect(handleEvent.execute).toHaveBeenCalled();
      expect(mockChannel.ack).toHaveBeenCalledWith(msg);
    });

    it('should nack (without requeue) when handleEvent throws', async () => {
      handleEvent.execute.mockRejectedValueOnce(new Error('Processing error'));

      const msg = makeMsg({
        eventId: 'evt-fail',
        eventType: 'ERROR',
        timestamp: '',
        source: '',
        correlationId: '',
        payload: {},
      });

      await consumeCallback(msg);

      expect(mockChannel.nack).toHaveBeenCalledWith(msg, false, false);
      expect(mockChannel.ack).not.toHaveBeenCalled();
    });

    it('should ignore null messages', async () => {
      await consumeCallback(null);

      expect(handleEvent.execute).not.toHaveBeenCalled();
    });
  });
});
