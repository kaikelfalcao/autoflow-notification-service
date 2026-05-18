import { Nack } from '@golevelup/nestjs-rabbitmq';

import { NotificationService } from '../notification.service';
import { OrderEventsConsumer } from './order-events.consumer';

describe('OrderEventsConsumer', () => {
  let svc: jest.Mocked<NotificationService>;
  let consumer: OrderEventsConsumer;

  beforeEach(() => {
    svc = {
      handleOrderCreated: jest.fn(async () => undefined),
      handleBudgetGenerated: jest.fn(async () => undefined),
      handleBudgetApproved: jest.fn(async () => undefined),
      handlePaymentRequested: jest.fn(async () => undefined),
      handleOrderCancelled: jest.fn(async () => undefined),
    } as unknown as jest.Mocked<NotificationService>;
    consumer = new OrderEventsConsumer(svc);
  });

  const envelope = { payload: { orderId: 'o1' } };

  it('delega onCreated para o service', async () => {
    await consumer.onCreated(envelope);
    expect(svc.handleOrderCreated).toHaveBeenCalledWith(envelope);
  });

  it('delega onBudgetGenerated', async () => {
    await consumer.onBudgetGenerated(envelope);
    expect(svc.handleBudgetGenerated).toHaveBeenCalled();
  });

  it('delega onBudgetApproved', async () => {
    await consumer.onBudgetApproved(envelope);
    expect(svc.handleBudgetApproved).toHaveBeenCalled();
  });

  it('delega onPaymentRequested', async () => {
    await consumer.onPaymentRequested(envelope);
    expect(svc.handlePaymentRequested).toHaveBeenCalled();
  });

  it('delega onCancelled', async () => {
    await consumer.onCancelled(envelope);
    expect(svc.handleOrderCancelled).toHaveBeenCalled();
  });

  it('devolve Nack(false) se service lançar', async () => {
    svc.handleOrderCreated.mockRejectedValue(new Error('boom'));
    const result = await consumer.onCreated(envelope);
    expect(result).toBeInstanceOf(Nack);
  });

  it('devolve Nack(false) em qualquer outro handler que falhe', async () => {
    svc.handleBudgetApproved.mockRejectedValue(new Error('x'));
    const result = await consumer.onBudgetApproved(envelope);
    expect(result).toBeInstanceOf(Nack);
  });
});
