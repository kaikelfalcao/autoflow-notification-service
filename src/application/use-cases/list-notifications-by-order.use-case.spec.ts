import { ListNotificationsByOrderUseCase } from './list-notifications-by-order.use-case';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from '../../domain/entities/notification.entity';

const makeNotification = (id: string): Notification =>
  new Notification({
    id,
    eventId: `evt-${id}`,
    orderId: 'order-1',
    customerCpf: '12345678900',
    channel: NotificationChannel.EMAIL,
    template: 'BUDGET_GENERATED',
    variables: {},
    status: NotificationStatus.SENT,
    sentAt: new Date(),
  });

describe('ListNotificationsByOrderUseCase', () => {
  let useCase: ListNotificationsByOrderUseCase;
  let notificationRepo: jest.Mocked<INotificationRepository>;

  beforeEach(() => {
    notificationRepo = {
      create: jest.fn(),
      findByOrderId: jest.fn(),
      findByCustomerCpf: jest.fn(),
      findById: jest.fn(),
      existsByEventIdAndChannel: jest.fn(),
      incrementRetry: jest.fn(),
      updateStatus: jest.fn(),
    };

    useCase = new ListNotificationsByOrderUseCase(notificationRepo);
  });

  it('should return notifications for the given orderId', async () => {
    const notifications = [makeNotification('1'), makeNotification('2')];
    notificationRepo.findByOrderId.mockResolvedValue(notifications);

    const result = await useCase.execute('order-1');

    expect(notificationRepo.findByOrderId).toHaveBeenCalledWith('order-1');
    expect(result).toEqual(notifications);
  });

  it('should return empty array when no notifications exist', async () => {
    notificationRepo.findByOrderId.mockResolvedValue([]);

    const result = await useCase.execute('order-x');

    expect(result).toHaveLength(0);
  });
});
