import { Nack } from '@golevelup/nestjs-rabbitmq';

import { NotificationService } from '../notification.service';
import { CatalogAlertsConsumer } from './catalog-alerts.consumer';

describe('CatalogAlertsConsumer', () => {
  let svc: jest.Mocked<NotificationService>;
  let consumer: CatalogAlertsConsumer;

  beforeEach(() => {
    svc = {
      handleLowStockAlert: jest.fn(async () => undefined),
    } as unknown as jest.Mocked<NotificationService>;
    consumer = new CatalogAlertsConsumer(svc);
  });

  it('delega onLowStock para o service', async () => {
    await consumer.onLowStock({ payload: { partId: 'p1' } });
    expect(svc.handleLowStockAlert).toHaveBeenCalled();
  });

  it('devolve Nack(false) em falha', async () => {
    svc.handleLowStockAlert.mockRejectedValue(new Error('x'));
    const result = await consumer.onLowStock({ payload: {} });
    expect(result).toBeInstanceOf(Nack);
  });
});
