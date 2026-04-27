import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './infra/schemas/notification.schema';
import { NotificationRepository } from './infra/repositories/notification.repository';
import { Template, TemplateSchema } from '../template/infra/schemas/template.schema';
import { TemplateRepository } from '../template/infra/repositories/template.repository';
import { TemplateService } from '../template/template.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Template.name, schema: TemplateSchema }
    ]),
  ],
  controllers: [],
  providers: [NotificationService, NotificationRepository, TemplateRepository, TemplateService],
  exports: [NotificationService, TemplateService],
})
export class NotificationModule {}
