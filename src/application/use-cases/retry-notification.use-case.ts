import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NotificationStatus } from '../../domain/entities/notification.entity';
import { TemplateRendererService } from '../services/template-renderer.service';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { IChannelFactory } from '../../domain/ports/channel-factory.port';

const MAX_RETRIES = 3;

@Injectable()
export class RetryNotificationUseCase {
  private readonly logger = new Logger(RetryNotificationUseCase.name);

  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly templateRepository: ITemplateRepository,
    private readonly templateRenderer: TemplateRendererService,
    private readonly channelFactory: IChannelFactory,
  ) {}

  async execute(id: string): Promise<void> {
    const notification = await this.notificationRepository.findById(id);

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    if (notification.status !== NotificationStatus.FAILED) {
      throw new Error(`Notification ${id} is not in FAILED status`);
    }

    if (notification.retryCount >= MAX_RETRIES) {
      throw new Error(
        `Notification ${id} exceeded max retries (${MAX_RETRIES})`,
      );
    }

    const [template] = await this.templateRepository.findAllActiveByCode(
      notification.template,
    );

    if (!template) {
      throw new Error(
        `Template ${notification.template} not found or inactive`,
      );
    }

    const content = this.templateRenderer.render(
      template.body,
      notification.variables,
    );

    try {
      const channelAdapter = this.channelFactory.getChannel(
        notification.channel,
      );
      await channelAdapter.send({
        to: this.resolveRecipient(notification.channel, notification.variables),
        subject: template.subject,
        content,
        channel: notification.channel,
      });

      await this.notificationRepository.updateStatus(
        id,
        NotificationStatus.SENT,
      );
      await this.notificationRepository.incrementRetry(id);

      this.logger.log(`Retry successful for notification ${id}`);
    } catch (error) {
      await this.notificationRepository.incrementRetry(id);
      await this.notificationRepository.updateStatus(
        id,
        NotificationStatus.FAILED,
        (error as Error).message,
      );
      throw error;
    }
  }

  private resolveRecipient(
    channel: string,
    variables: Record<string, unknown>,
  ): string {
    switch (channel) {
      case 'EMAIL':
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return String(variables.customerEmail ?? '');
      case 'SMS':
      case 'WHATSAPP':
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return String(variables.customerPhone ?? '');
      default:
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return String(variables.customerCpf ?? '');
    }
  }
}
