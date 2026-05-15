import { NotFoundException } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { ListNotificationsByOrderUseCase } from '../../application/use-cases/list-notifications-by-order.use-case';
import { ListNotificationsByCustomerUseCase } from '../../application/use-cases/list-notifications-by-customer.use-case';
import { RetryNotificationUseCase } from '../../application/use-cases/retry-notification.use-case';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from '../../domain/entities/notification.entity';

const makeNotification = (): Notification =>
  new Notification({
    id: 'notif-1',
    eventId: 'evt-1',
    orderId: 'order-1',
    customerCpf: '12345678900',
    channel: NotificationChannel.EMAIL,
    template: 'BUDGET_GENERATED',
    variables: {},
    status: NotificationStatus.SENT,
    sentAt: new Date(),
  });

describe('NotificationController', () => {
  let controller: NotificationController;
  let listByOrder: jest.Mocked<ListNotificationsByOrderUseCase>;
  let listByCustomer: jest.Mocked<ListNotificationsByCustomerUseCase>;
  let retry: jest.Mocked<RetryNotificationUseCase>;

  beforeEach(() => {
    listByOrder = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListNotificationsByOrderUseCase>;
    listByCustomer = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ListNotificationsByCustomerUseCase>;
    retry = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<RetryNotificationUseCase>;

    controller = new NotificationController(listByOrder, listByCustomer, retry);
  });

  describe('getByOrder', () => {
    it('should return notifications for the given orderId', async () => {
      const notifications = [makeNotification()];
      listByOrder.execute.mockResolvedValue(notifications);

      const result = await controller.getByOrder('order-1');

      expect(listByOrder.execute).toHaveBeenCalledWith('order-1');
      expect(result).toEqual(notifications);
    });
  });

  describe('getByCustomer', () => {
    it('should return notifications for the given CPF', async () => {
      const notifications = [makeNotification()];
      listByCustomer.execute.mockResolvedValue(notifications);

      const result = await controller.getByCustomer('12345678900');

      expect(listByCustomer.execute).toHaveBeenCalledWith('12345678900');
      expect(result).toEqual(notifications);
    });
  });

  describe('retryNotification', () => {
    it('should return success message when retry works', async () => {
      retry.execute.mockResolvedValue(undefined);

      const result = await controller.retryNotification('notif-1');

      expect(retry.execute).toHaveBeenCalledWith('notif-1');
      expect(result.message).toContain('success');
    });

    it('should propagate NotFoundException from use case', async () => {
      retry.execute.mockRejectedValue(
        new NotFoundException('Notification not found'),
      );

      await expect(controller.retryNotification('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
