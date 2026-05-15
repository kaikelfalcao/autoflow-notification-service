import { loadFeature, defineFeature } from 'jest-cucumber';
import { HandleEventUseCase } from '../application/use-cases/handle-event.use-case';
import { INotificationRepository } from '../domain/repositories/notification.repository.interface';
import { ITemplateRepository } from '../domain/repositories/template.repository.interface';
import { IChannelFactory } from '../domain/ports/channel-factory.port';
import { INotificationChannelPort } from '../domain/ports/notification-channel.port';
import { TemplateRendererService } from '../application/services/template-renderer.service';
import {
  Notification,
  NotificationChannel,
  NotificationStatus,
} from '../domain/entities/notification.entity';
import { Template } from '../domain/entities/template.entity';
import { IncomingEvent } from '../domain/events/incoming-event.interface';

const feature = loadFeature(
  './src/bdd/features/notification-event-processing.feature',
);

// --- Helpers ---

const buildTemplate = (code: string, channel: string): Template =>
  Object.assign(new Template(), {
    id: `tmpl-${channel}`,
    code,
    channel,
    subject: channel === 'EMAIL' ? 'Seu orçamento - OS #{orderId}' : undefined,
    body:
      channel === 'EMAIL'
        ? 'Olá {customerName}, orçamento: R$ {totalAmount}.'
        : 'Orçamento pronto. Acesse o app.',
    active: true,
  });

const buildNotification = (
  id: string,
  channel: NotificationChannel,
): Notification =>
  new Notification({
    id,
    eventId: 'evt-budget-001',
    orderId: 'order-1',
    customerCpf: '12345678900',
    channel,
    template: 'BUDGET_GENERATED',
    variables: {},
    status: NotificationStatus.PENDING,
    sentAt: new Date(),
  });

const buildEvent = (
  eventId: string,
  eventType: string,
  email: string,
): IncomingEvent => ({
  eventId,
  eventType,
  timestamp: new Date().toISOString(),
  source: 'order-service',
  correlationId: 'corr-bdd-001',
  payload: {
    orderId: 'order-1',
    customerCpf: '12345678900',
    customerEmail: email,
    customerPhone: '+5511999999999',
    customerName: 'João',
    totalAmount: 1500,
  },
});

// --- Step definitions ---

defineFeature(feature, (test) => {
  let useCase: HandleEventUseCase;
  let notificationRepo: jest.Mocked<INotificationRepository>;
  let templateRepo: jest.Mocked<ITemplateRepository>;
  let mockEmailChannel: jest.Mocked<INotificationChannelPort>;
  let mockPushChannel: jest.Mocked<INotificationChannelPort>;
  let channelFactory: jest.Mocked<IChannelFactory>;
  let createCallCount: number;

  beforeEach(() => {
    createCallCount = 0;

    notificationRepo = {
      create: jest.fn().mockImplementation((_data: unknown) => {
        const index = createCallCount++;
        const channel =
          index === 0 ? NotificationChannel.EMAIL : NotificationChannel.PUSH;
        const id = `notif-${channel.toLowerCase()}`;
        return Promise.resolve(buildNotification(id, channel));
      }),
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

    mockEmailChannel = {
      supports: jest.fn(),
      send: jest.fn().mockResolvedValue(undefined),
    };
    mockPushChannel = {
      supports: jest.fn(),
      send: jest.fn().mockResolvedValue(undefined),
    };

    channelFactory = {
      getChannel: jest
        .fn()
        .mockImplementation((ch: string) =>
          ch === 'EMAIL' ? mockEmailChannel : mockPushChannel,
        ),
    };

    useCase = new HandleEventUseCase(
      notificationRepo,
      templateRepo,
      new TemplateRendererService(),
      channelFactory,
    );
  });

  test('Budget generated event triggers multi-channel notifications', ({
    given,
    and,
    when,
    then,
  }) => {
    given(
      /^active templates exist for "(.*)" on channels "(.*)" and "(.*)"$/,
      (eventType, ch1, ch2) => {
        templateRepo.findAllActiveByCode.mockResolvedValue([
          buildTemplate(eventType, ch1),
          buildTemplate(eventType, ch2),
        ]);
      },
    );

    and(
      /^no notification has been sent for event "(.*)" on any channel$/,
      (_eventId) => {
        notificationRepo.existsByEventIdAndChannel.mockResolvedValue(false);
      },
    );

    when(
      /^the "(.*)" event is processed for customer "(.*)"$/,
      async (eventType, email) => {
        await useCase.execute(buildEvent('evt-budget-001', eventType, email));
      },
    );

    then(
      /^a notification should be persisted as PENDING for the (.*) channel$/,
      (_channel) => {
        expect(notificationRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({ status: NotificationStatus.PENDING }),
        );
      },
    );

    and(
      /^a notification should be persisted as PENDING for the (.*) channel$/,
      (_channel) => {
        expect(notificationRepo.create).toHaveBeenCalledTimes(2);
      },
    );

    and(
      /^the email adapter should be called with recipient "(.*)"$/,
      (email) => {
        expect(mockEmailChannel.send).toHaveBeenCalledWith(
          expect.objectContaining({ to: email }),
        );
      },
    );

    and(/^both notifications should be updated to SENT status$/, () => {
      expect(notificationRepo.updateStatus).toHaveBeenCalledTimes(2);
      expect(notificationRepo.updateStatus).toHaveBeenCalledWith(
        expect.any(String),
        NotificationStatus.SENT,
      );
    });
  });

  test('Duplicate event on the same channel is silently ignored', ({
    given,
    and,
    when,
    then,
  }) => {
    given(
      /^active templates exist for "(.*)" on channels "(.*)" and "(.*)"$/,
      (eventType, ch1, ch2) => {
        templateRepo.findAllActiveByCode.mockResolvedValue([
          buildTemplate(eventType, ch1),
          buildTemplate(eventType, ch2),
        ]);
      },
    );

    and(
      /^a notification already exists for event "(.*)" on channel "(.*)"$/,
      (_eventId, channel) => {
        notificationRepo.existsByEventIdAndChannel.mockImplementation(
          (_eid, ch) => Promise.resolve(ch === channel),
        );
      },
    );

    when(
      /^the "(.*)" event is processed again with event ID "(.*)"$/,
      async (eventType, eventId) => {
        await useCase.execute(buildEvent(eventId, eventType, 'joao@test.com'));
      },
    );

    then(/^no new notification should be created for the (.*) channel$/, () => {
      const emailCalls = (
        notificationRepo.create as jest.Mock
      ).mock.calls.filter(
        ([data]: [{ channel: string }]) => data.channel === 'EMAIL',
      );
      expect(emailCalls).toHaveLength(0);
    });

    and(/^the email adapter should not be called for the (.*) channel$/, () => {
      expect(mockEmailChannel.send).not.toHaveBeenCalled();
    });
  });

  test('Event without a matching template is silently ignored', ({
    given,
    when,
    then,
  }) => {
    given(/^no templates exist for event type "(.*)"$/, (_eventType) => {
      templateRepo.findAllActiveByCode.mockResolvedValue([]);
    });

    when(/^the "(.*)" event is processed$/, async (eventType) => {
      await useCase.execute(
        buildEvent('evt-unknown-001', eventType, 'joao@test.com'),
      );
    });

    then(/^no notification should be created at all$/, () => {
      expect(notificationRepo.create).not.toHaveBeenCalled();
    });
  });
});
