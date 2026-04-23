import { Injectable, Logger } from '@nestjs/common';
import { NotificationRepository } from './infra/repositories/notification.repository';

@Injectable()
export class NotificationService {
    constructor(private notificationRepository: NotificationRepository) {}
    private readonly logger = new Logger(NotificationService.name);

    handleEvent(event: any) {
        this.logger.log(`Processing Event: ${event.eventType}`);
    }

    // async onModuleInit() {
    //     await this.notificationRepository.create({
    //         orderId: '1',
    //         customerCpf: '11111111111',
    //         channel: 'teste@teste.com',
    //         template: '1',
    //         status: 'SENT',
    //     });

    //     this.logger.log('✅ Write test succeeded');
    // }
}
