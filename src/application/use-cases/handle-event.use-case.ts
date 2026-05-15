import { Injectable, Logger } from '@nestjs/common';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { IChannelFactory } from '../../domain/ports/channel-factory.port';
import {
  NotificationStatus,
  NotificationChannel,
} from '../../domain/entities/notification.entity';
import {
  IncomingEvent,
  EventPayload,
} from '../../domain/events/incoming-event.interface';
import { TemplateRendererService } from '../services/template-renderer.service';

@Injectable()
export class HandleEventUseCase {
  private readonly logger = new Logger(HandleEventUseCase.name);

  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly templateRepository: ITemplateRepository,
    private readonly templateRenderer: TemplateRendererService,
    private readonly channelFactory: IChannelFactory,
  ) {}

  async execute(event: IncomingEvent): Promise<void> {
    const templates = await this.templateRepository.findAllActiveByCode(
      event.eventType,
    );

    if (!templates.length) {
      this.logger.debug(
        `No template for event type: ${event.eventType} — skipping`,
      );
      return;
    }

    await Promise.allSettled(
      templates.map((template) =>
        this.sendNotification(
          event,
          template.channel,
          template.code,
          template.body,
          template.subject,
        ),
      ),
    );
  }

  private async sendNotification(
    event: IncomingEvent,
    channel: string,
    templateCode: string,
    templateBody: string,
    subject?: string,
  ): Promise<void> {
    // Idempotência por canal: BUDGET_GENERATED pode gerar EMAIL e PUSH separados
    if (
      await this.notificationRepository.existsByEventIdAndChannel(
        event.eventId,
        channel,
      )
    ) {
      this.logger.warn(
        `Duplicate event+channel ignored: ${event.eventId} / ${channel}`,
      );
      return;
    }

    const to = this.resolveRecipient(channel, event.payload);

    if (!to) {
      this.logger.warn(
        `Cannot resolve recipient for channel ${channel}, event ${event.eventId}`,
      );
      return;
    }

    const content = this.templateRenderer.render(templateBody, event.payload);
    const renderedSubject = subject
      ? this.templateRenderer.render(subject, event.payload)
      : undefined;

    const notification = await this.notificationRepository.create({
      eventId: event.eventId,
      orderId: event.payload.orderId ?? '',
      customerCpf: event.payload.customerCpf ?? '',
      channel: channel as NotificationChannel,
      template: templateCode,
      variables: event.payload,
      status: NotificationStatus.PENDING,
      sentAt: new Date(),
      correlationId: event.correlationId,
    });

    try {
      const adapter = this.channelFactory.getChannel(channel);
      await adapter.send({ to, subject: renderedSubject, content, channel });

      await this.notificationRepository.updateStatus(
        notification.id!,
        NotificationStatus.SENT,
      );

      this.logger.log(
        `[${event.correlationId}] ${channel} sent for ${event.eventType}`,
      );
    } catch (error) {
      await this.notificationRepository.updateStatus(
        notification.id!,
        NotificationStatus.FAILED,
        (error as Error).message,
      );
      this.logger.error(
        `[${event.correlationId}] Failed to send ${channel} for ${event.eventId}`,
        error,
      );
    }
  }

  private resolveRecipient(channel: string, payload: EventPayload): string {
    switch (channel as NotificationChannel) {
      case NotificationChannel.EMAIL:
        return payload.customerEmail ?? '';
      case NotificationChannel.SMS:
      case NotificationChannel.WHATSAPP:
        return payload.customerPhone ?? '';
      case NotificationChannel.PUSH:
        return payload.customerCpf ?? '';
      default:
        return '';
    }
  }
}
