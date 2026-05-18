import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CatalogAlertsConsumer } from './consumers/catalog-alerts.consumer';
import { OrderEventsConsumer } from './consumers/order-events.consumer';
import { PaymentEventsConsumer } from './consumers/payment-events.consumer';
import { NotificationRepository } from './infra/repositories/notification.repository';
import { Notification, NotificationSchema } from './infra/schemas/notification.schema';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  providers: [
    NotificationService,
    NotificationRepository,
    OrderEventsConsumer,
    PaymentEventsConsumer,
    CatalogAlertsConsumer,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
