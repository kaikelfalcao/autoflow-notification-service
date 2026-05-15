import { ListNotificationsByCustomerUseCase } from './list-notifications-by-customer.use-case';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from '../../domain/entities/notification.entity';

const makeNotification = (cpf: string): Notification =>
  new Notification({
    id: 'notif-1',
    eventId: 'evt-1',
    orderId: 'order-1',
    customerCpf: cpf,
    channel: NotificationChannel.SMS,
    template: 'OS_CREATED',
    variables: {},
    status: NotificationStatus.SENT,
    sentAt: new Date(),
  });

describe('ListNotificationsByCustomerUseCase', () => {
  let useCase: ListNotificationsByCustomerUseCase;
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

    useCase = new ListNotificationsByCustomerUseCase(notificationRepo);
  });

  it('should return notifications for the given CPF', async () => {
    const notifications = [makeNotification('12345678900')];
    notificationRepo.findByCustomerCpf.mockResolvedValue(notifications);

    const result = await useCase.execute('12345678900');

    expect(notificationRepo.findByCustomerCpf).toHaveBeenCalledWith(
      '12345678900',
    );
    expect(result).toEqual(notifications);
  });

  it('should return empty array when customer has no notifications', async () => {
    notificationRepo.findByCustomerCpf.mockResolvedValue([]);

    const result = await useCase.execute('00000000000');

    expect(result).toHaveLength(0);
  });
});
