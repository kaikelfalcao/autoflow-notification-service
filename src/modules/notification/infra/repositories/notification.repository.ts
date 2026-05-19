import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async create(notification: Partial<Notification>): Promise<Notification> {
    return this.notificationModel.create(notification);
  }

  async findByOrderId(orderId: string): Promise<Notification[]> {
    return this.notificationModel.find({ orderId }).exec();
  }

  async incrementRetry(id: string) {
    return this.notificationModel.findByIdAndUpdate(id, {
      $inc: { retryCount: 1 },
    });
  }
}
