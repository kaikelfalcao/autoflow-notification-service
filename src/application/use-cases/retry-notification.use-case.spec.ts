import { NotFoundException } from '@nestjs/common';
import { RetryNotificationUseCase } from './retry-notification.use-case';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { IChannelFactory } from '../../domain/ports/channel-factory.port';
import { INotificationChannelPort } from '../../domain/ports/notification-channel.port';
import { TemplateRendererService } from '../services/template-renderer.service';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from '../../domain/entities/notification.entity';
import { Template } from '../../domain/entities/template.entity';

const makeNotification = (
  overrides: Partial<Notification> = {},
): Notification =>
  new Notification({
    id: 'notif-1',
    eventId: 'evt-1',
    orderId: 'order-1',
    customerCpf: '12345678900',
    channel: NotificationChannel.EMAIL,
    template: 'BUDGET_GENERATED',
    variables: { customerEmail: 'joao@test.com', customerName: 'João' },
    status: NotificationStatus.FAILED,
    sentAt: new Date(),
    retryCount: 0,
    ...overrides,
  });

const makeTemplate = (overrides: Partial<Template> = {}): Template =>
  Object.assign(new Template(), {
    id: 'tmpl-1',
    code: 'BUDGET_GENERATED',
    channel: 'EMAIL',
    subject: 'Orçamento pronto',
    body: 'Olá {customerName}',
    active: true,
    ...overrides,
  });

describe('RetryNotificationUseCase', () => {
  let useCase: RetryNotificationUseCase;
  let notificationRepo: jest.Mocked<INotificationRepository>;
  let templateRepo: jest.Mocked<ITemplateRepository>;
  let renderer: TemplateRendererService;
  let channelFactory: jest.Mocked<IChannelFactory>;
  let mockChannel: jest.Mocked<INotificationChannelPort>;

  beforeEach(() => {
    notificationRepo = {
      create: jest.fn(),
      findByOrderId: jest.fn(),
      findByCustomerCpf: jest.fn(),
      findById: jest.fn(),
      existsByEventIdAndChannel: jest.fn(),
      incrementRetry: jest.fn().mockResolvedValue(undefined),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };

    templateRepo = {
      findAllActiveByCode: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    };

    renderer = new TemplateRendererService();

    mockChannel = {
      supports: jest.fn(),
      send: jest.fn().mockResolvedValue(undefined),
    };

    channelFactory = {
      getChannel: jest.fn().mockReturnValue(mockChannel),
    };

    useCase = new RetryNotificationUseCase(
      notificationRepo,
      templateRepo,
      renderer,
      channelFactory,
    );
  });

  it('should throw NotFoundException when notification does not exist', async () => {
    notificationRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('non-existent-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw when notification status is not FAILED', async () => {
    notificationRepo.findById.mockResolvedValue(
      makeNotification({ status: NotificationStatus.SENT }),
    );

    await expect(useCase.execute('notif-1')).rejects.toThrow(
      'is not in FAILED status',
    );
  });

  it('should throw when max retries (3) are exceeded', async () => {
    notificationRepo.findById.mockResolvedValue(
      makeNotification({ retryCount: 3 }),
    );

    await expect(useCase.execute('notif-1')).rejects.toThrow(
      'exceeded max retries',
    );
  });

  it('should throw when template is not found or inactive', async () => {
    notificationRepo.findById.mockResolvedValue(makeNotification());
    templateRepo.findAllActiveByCode.mockResolvedValue([]);

    await expect(useCase.execute('notif-1')).rejects.toThrow(
      'not found or inactive',
    );
  });

  describe('on successful retry', () => {
    beforeEach(() => {
      notificationRepo.findById.mockResolvedValue(makeNotification());
      templateRepo.findAllActiveByCode.mockResolvedValue([makeTemplate()]);
    });

    it('should call the channel adapter with rendered content', async () => {
      await useCase.execute('notif-1');

      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'joao@test.com',
          content: 'Olá João',
        }),
      );
    });

    it('should update status to SENT', async () => {
      await useCase.execute('notif-1');

      expect(notificationRepo.updateStatus).toHaveBeenCalledWith(
        'notif-1',
        NotificationStatus.SENT,
      );
    });

    it('should increment retry count', async () => {
      await useCase.execute('notif-1');

      expect(notificationRepo.incrementRetry).toHaveBeenCalledWith('notif-1');
    });
  });

  describe('on failed retry', () => {
    beforeEach(() => {
      notificationRepo.findById.mockResolvedValue(makeNotification());
      templateRepo.findAllActiveByCode.mockResolvedValue([makeTemplate()]);
      mockChannel.send.mockRejectedValue(new Error('Channel error'));
    });

    it('should increment retry count before re-throwing', async () => {
      await expect(useCase.execute('notif-1')).rejects.toThrow('Channel error');

      expect(notificationRepo.incrementRetry).toHaveBeenCalledWith('notif-1');
    });

    it('should update status to FAILED with error message', async () => {
      await expect(useCase.execute('notif-1')).rejects.toThrow();

      expect(notificationRepo.updateStatus).toHaveBeenCalledWith(
        'notif-1',
        NotificationStatus.FAILED,
        'Channel error',
      );
    });
  });
});
