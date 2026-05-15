import { HandleEventUseCase } from './handle-event.use-case';
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
import { IncomingEvent } from '../../domain/events/incoming-event.interface';

// --- Test fixtures ---

const makeTemplate = (overrides: Partial<Template> = {}): Template =>
  Object.assign(new Template(), {
    id: 'tmpl-1',
    code: 'BUDGET_GENERATED',
    channel: 'EMAIL',
    subject: 'Orçamento pronto - OS #{orderId}',
    body: 'Olá {customerName}, seu orçamento ficou em R$ {totalAmount}.',
    active: true,
    ...overrides,
  });

const makeNotification = (
  overrides: Partial<Notification> = {},
): Notification =>
  new Notification({
    id: 'notif-1',
    eventId: 'evt-001',
    orderId: 'order-1',
    customerCpf: '12345678900',
    channel: NotificationChannel.EMAIL,
    template: 'BUDGET_GENERATED',
    variables: {},
    status: NotificationStatus.PENDING,
    sentAt: new Date(),
    correlationId: 'corr-1',
    ...overrides,
  });

const makeEvent = (overrides: Partial<IncomingEvent> = {}): IncomingEvent => ({
  eventId: 'evt-001',
  eventType: 'BUDGET_GENERATED',
  timestamp: new Date().toISOString(),
  source: 'order-service',
  correlationId: 'corr-1',
  payload: {
    orderId: 'order-1',
    customerCpf: '12345678900',
    customerEmail: 'joao@test.com',
    customerPhone: '+5511999999999',
    customerName: 'João',
    totalAmount: 1500,
  },
  ...overrides,
});

// --- Spec ---

describe('HandleEventUseCase', () => {
  let useCase: HandleEventUseCase;
  let notificationRepo: jest.Mocked<INotificationRepository>;
  let templateRepo: jest.Mocked<ITemplateRepository>;
  let renderer: TemplateRendererService;
  let channelFactory: jest.Mocked<IChannelFactory>;
  let mockChannel: jest.Mocked<INotificationChannelPort>;

  beforeEach(() => {
    notificationRepo = {
      create: jest.fn().mockResolvedValue(makeNotification()),
      findByOrderId: jest.fn(),
      findByCustomerCpf: jest.fn(),
      findById: jest.fn(),
      existsByEventIdAndChannel: jest.fn().mockResolvedValue(false),
      incrementRetry: jest.fn(),
      updateStatus: jest.fn().mockResolvedValue(undefined),
    };

    templateRepo = {
      findAllActiveByCode: jest.fn().mockResolvedValue([]),
      findAll: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    };

    renderer = new TemplateRendererService();

    mockChannel = {
      supports: jest.fn().mockReturnValue(true),
      send: jest.fn().mockResolvedValue(undefined),
    };

    channelFactory = {
      getChannel: jest.fn().mockReturnValue(mockChannel),
    };

    useCase = new HandleEventUseCase(
      notificationRepo,
      templateRepo,
      renderer,
      channelFactory,
    );
  });

  describe('when no templates are found for the event type', () => {
    it('should not create any notification', async () => {
      templateRepo.findAllActiveByCode.mockResolvedValue([]);

      await useCase.execute(makeEvent());

      expect(notificationRepo.create).not.toHaveBeenCalled();
      expect(mockChannel.send).not.toHaveBeenCalled();
    });
  });

  describe('when a template is found', () => {
    it('should create notification as PENDING and then update to SENT on success', async () => {
      const template = makeTemplate({ channel: 'EMAIL' });
      templateRepo.findAllActiveByCode.mockResolvedValue([template]);

      await useCase.execute(makeEvent());

      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: NotificationStatus.PENDING }),
      );
      expect(mockChannel.send).toHaveBeenCalledTimes(1);
      expect(notificationRepo.updateStatus).toHaveBeenCalledWith(
        'notif-1',
        NotificationStatus.SENT,
      );
    });

    it('should update notification to FAILED when channel send throws', async () => {
      const template = makeTemplate({ channel: 'EMAIL' });
      templateRepo.findAllActiveByCode.mockResolvedValue([template]);
      mockChannel.send.mockRejectedValue(new Error('SendGrid unavailable'));

      await useCase.execute(makeEvent()); // must not throw

      expect(notificationRepo.updateStatus).toHaveBeenCalledWith(
        'notif-1',
        NotificationStatus.FAILED,
        'SendGrid unavailable',
      );
    });

    it('should render template body with event payload variables', async () => {
      const template = makeTemplate({
        channel: 'EMAIL',
        body: 'Olá {customerName}!',
      });
      templateRepo.findAllActiveByCode.mockResolvedValue([template]);

      await useCase.execute(makeEvent());

      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Olá João!' }),
      );
    });

    it('should render template subject with event payload variables', async () => {
      const template = makeTemplate({
        channel: 'EMAIL',
        subject: 'OS #{orderId}',
      });
      templateRepo.findAllActiveByCode.mockResolvedValue([template]);

      await useCase.execute(makeEvent());

      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({ subject: 'OS #order-1' }),
      );
    });
  });

  describe('idempotency', () => {
    it('should skip channel when event+channel combination already exists', async () => {
      const template = makeTemplate({ channel: 'EMAIL' });
      templateRepo.findAllActiveByCode.mockResolvedValue([template]);
      notificationRepo.existsByEventIdAndChannel.mockResolvedValue(true);

      await useCase.execute(makeEvent());

      expect(notificationRepo.create).not.toHaveBeenCalled();
      expect(mockChannel.send).not.toHaveBeenCalled();
    });

    it('should process EMAIL even when PUSH was already sent for same event', async () => {
      const emailTemplate = makeTemplate({ channel: 'EMAIL' });
      const pushTemplate = makeTemplate({ channel: 'PUSH' });
      templateRepo.findAllActiveByCode.mockResolvedValue([
        emailTemplate,
        pushTemplate,
      ]);

      notificationRepo.existsByEventIdAndChannel.mockImplementation(
        (_eventId, channel) => Promise.resolve(channel === 'PUSH'),
      );

      notificationRepo.create.mockResolvedValue(
        makeNotification({ id: 'notif-email' }),
      );

      await useCase.execute(makeEvent());

      expect(notificationRepo.create).toHaveBeenCalledTimes(1);
      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ channel: NotificationChannel.EMAIL }),
      );
    });
  });

  describe('recipient resolution', () => {
    it('should use customerEmail for EMAIL channel', async () => {
      templateRepo.findAllActiveByCode.mockResolvedValue([
        makeTemplate({ channel: 'EMAIL' }),
      ]);

      await useCase.execute(makeEvent());

      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'joao@test.com' }),
      );
    });

    it('should use customerPhone for SMS channel', async () => {
      templateRepo.findAllActiveByCode.mockResolvedValue([
        makeTemplate({ channel: 'SMS' }),
      ]);
      notificationRepo.create.mockResolvedValue(
        makeNotification({ channel: NotificationChannel.SMS }),
      );

      await useCase.execute(makeEvent());

      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: '+5511999999999' }),
      );
    });

    it('should use customerPhone for WHATSAPP channel', async () => {
      templateRepo.findAllActiveByCode.mockResolvedValue([
        makeTemplate({ channel: 'WHATSAPP' }),
      ]);
      notificationRepo.create.mockResolvedValue(
        makeNotification({ channel: NotificationChannel.WHATSAPP }),
      );

      await useCase.execute(makeEvent());

      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: '+5511999999999' }),
      );
    });

    it('should use customerCpf for PUSH channel', async () => {
      templateRepo.findAllActiveByCode.mockResolvedValue([
        makeTemplate({ channel: 'PUSH' }),
      ]);
      notificationRepo.create.mockResolvedValue(
        makeNotification({ channel: NotificationChannel.PUSH }),
      );

      await useCase.execute(makeEvent());

      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({ to: '12345678900' }),
      );
    });

    it('should skip channel when recipient cannot be resolved', async () => {
      templateRepo.findAllActiveByCode.mockResolvedValue([
        makeTemplate({ channel: 'EMAIL' }),
      ]);

      const event = makeEvent({
        payload: { orderId: 'order-1', customerCpf: '123' },
      });

      await useCase.execute(event);

      expect(notificationRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('multi-channel events', () => {
    it('should send one notification per template channel', async () => {
      templateRepo.findAllActiveByCode.mockResolvedValue([
        makeTemplate({ channel: 'EMAIL' }),
        makeTemplate({ channel: 'PUSH' }),
      ]);
      notificationRepo.create
        .mockResolvedValueOnce(
          makeNotification({
            id: 'notif-email',
            channel: NotificationChannel.EMAIL,
          }),
        )
        .mockResolvedValueOnce(
          makeNotification({
            id: 'notif-push',
            channel: NotificationChannel.PUSH,
          }),
        );

      await useCase.execute(makeEvent());

      expect(notificationRepo.create).toHaveBeenCalledTimes(2);
      expect(mockChannel.send).toHaveBeenCalledTimes(2);
    });

    it('should continue processing other channels when one fails', async () => {
      templateRepo.findAllActiveByCode.mockResolvedValue([
        makeTemplate({ channel: 'EMAIL' }),
        makeTemplate({ channel: 'PUSH' }),
      ]);
      notificationRepo.create
        .mockResolvedValueOnce(makeNotification({ id: 'notif-email' }))
        .mockResolvedValueOnce(makeNotification({ id: 'notif-push' }));
      mockChannel.send
        .mockRejectedValueOnce(new Error('Email error'))
        .mockResolvedValueOnce(undefined);

      await expect(useCase.execute(makeEvent())).resolves.not.toThrow();

      expect(notificationRepo.updateStatus).toHaveBeenCalledWith(
        'notif-email',
        NotificationStatus.FAILED,
        'Email error',
      );
      expect(notificationRepo.updateStatus).toHaveBeenCalledWith(
        'notif-push',
        NotificationStatus.SENT,
      );
    });
  });
});
