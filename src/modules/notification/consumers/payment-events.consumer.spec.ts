import { Nack } from '@golevelup/nestjs-rabbitmq';

import { NotificationService } from '../notification.service';
import { PaymentEventsConsumer } from './payment-events.consumer';

describe('PaymentEventsConsumer', () => {
  let svc: jest.Mocked<NotificationService>;
  let consumer: PaymentEventsConsumer;

  beforeEach(() => {
    svc = {
      handlePaymentConfirmed: jest.fn(async () => undefined),
      handlePaymentFailed: jest.fn(async () => undefined),
    } as unknown as jest.Mocked<NotificationService>;
    consumer = new PaymentEventsConsumer(svc);
  });

  it('confirmed delega para o service', async () => {
    await consumer.onConfirmed({ orderId: 'o1' });
    expect(svc.handlePaymentConfirmed).toHaveBeenCalledWith({ orderId: 'o1' });
  });

  it('failed delega para o service com reason', async () => {
    await consumer.onFailed({ orderId: 'o1', reason: 'declined' });
    expect(svc.handlePaymentFailed).toHaveBeenCalledWith({
      orderId: 'o1',
      reason: 'declined',
    });
  });

  it('confirmed devolve Nack(false) em falha', async () => {
    svc.handlePaymentConfirmed.mockRejectedValue(new Error('x'));
    const result = await consumer.onConfirmed({ orderId: 'o1' });
    expect(result).toBeInstanceOf(Nack);
  });

  it('failed devolve Nack(false) em falha', async () => {
    svc.handlePaymentFailed.mockRejectedValue(new Error('x'));
    const result = await consumer.onFailed({ orderId: 'o1' });
    expect(result).toBeInstanceOf(Nack);
  });
});
