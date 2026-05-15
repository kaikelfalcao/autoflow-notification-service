import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Schemas
import {
  NotificationSchemaClass,
  NotificationSchema,
} from './infrastructure/database/schemas/notification.schema';
import {
  TemplateSchemaClass,
  TemplateSchema,
} from './infrastructure/database/schemas/template.schema';

// Repositories (interface → implementation binding)
import { INotificationRepository } from './domain/repositories/notification.repository.interface';
import { ITemplateRepository } from './domain/repositories/template.repository.interface';
import { NotificationMongooseRepository } from './infrastructure/database/repositories/notification.mongoose.repository';
import { TemplateMongooseRepository } from './infrastructure/database/repositories/template.mongoose.repository';

// Application
import { TemplateRendererService } from './application/services/template-renderer.service';
import { HandleEventUseCase } from './application/use-cases/handle-event.use-case';
import { RetryNotificationUseCase } from './application/use-cases/retry-notification.use-case';
import { ListNotificationsByOrderUseCase } from './application/use-cases/list-notifications-by-order.use-case';
import { ListNotificationsByCustomerUseCase } from './application/use-cases/list-notifications-by-customer.use-case';

// Infrastructure
import { IChannelFactory } from './domain/ports/channel-factory.port';
import { SendGridChannel } from './infrastructure/channels/sendgrid.channel';
import { TwilioChannel } from './infrastructure/channels/twilio.channel';
import { PushChannel } from './infrastructure/channels/push.channel';
import { ChannelFactory } from './infrastructure/channels/channel.factory';
import { RabbitMQConsumer } from './infrastructure/messaging/rabbitmq.consumer';
import { MongoHealth } from './infrastructure/health/mongo.health';

// Presentation
import { NotificationController } from './presentation/controllers/notification.controller';
import { TemplateController } from './presentation/controllers/template.controller';
import { HealthController } from './presentation/controllers/health.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationSchemaClass.name, schema: NotificationSchema },
      { name: TemplateSchemaClass.name, schema: TemplateSchema },
    ]),
  ],
  controllers: [NotificationController, TemplateController, HealthController],
  providers: [
    // Repository bindings
    {
      provide: INotificationRepository,
      useClass: NotificationMongooseRepository,
    },
    { provide: ITemplateRepository, useClass: TemplateMongooseRepository },

    // Application
    TemplateRendererService,
    HandleEventUseCase,
    RetryNotificationUseCase,
    ListNotificationsByOrderUseCase,
    ListNotificationsByCustomerUseCase,

    // Infrastructure — channel adapters + factory binding
    SendGridChannel,
    TwilioChannel,
    PushChannel,
    { provide: IChannelFactory, useClass: ChannelFactory },
    RabbitMQConsumer,
    MongoHealth,
  ],
})
export class NotificationModule {}
