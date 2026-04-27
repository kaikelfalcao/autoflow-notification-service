import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from './infra/repositories/notification.repository';
import { TemplateRenderer } from './application/template.renderer';
import { TemplateRepository } from '../template/infra/repositories/template.repository';
import { channel } from 'diagnostics_channel';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private readonly renderer = new TemplateRenderer();
    
    constructor(
        private notificationRepository: NotificationRepository,
        private templateRepository: TemplateRepository,
    ) {}

    async handleEvent(event: any) {
        const template = await this.templateRepository.findActiveByCode(event.eventType);

        console.log(template);
        console.log(event.eventType);


        if (!template) {
            this.logger.error(`Template not found for code: ${event.eventType}`);
            return;
        }

        const content = this.renderer.render(template.body, event.payload);

        this.logger.log(`Rendered content: ${content}`);

        await this.notificationRepository.create({
            orderId: event.payload.orderId,
            customerCpf: event.payload.customerCpf,
            channel: template.channel,
            template: template.code,
            variables: event.payload,
            status: 'SENT',
            sentAt: new Date(),
         });
    }
}
