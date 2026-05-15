import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationStatus,
  NotificationChannel,
} from '../../../domain/entities/notification.entity';
import { INotificationRepository } from '../../../domain/repositories/notification.repository.interface';
import {
  NotificationSchemaClass,
  NotificationDocument,
} from '../schemas/notification.schema';

@Injectable()
export class NotificationMongooseRepository implements INotificationRepository {
  constructor(
    @InjectModel(NotificationSchemaClass.name)
    private readonly model: Model<NotificationDocument>,
  ) {}

  async create(
    notification: Omit<Notification, 'id' | 'retryCount'>,
  ): Promise<Notification> {
    const doc = await this.model.create({ ...notification, retryCount: 0 });
    return this.toEntity(doc);
  }

  async findByOrderId(orderId: string): Promise<Notification[]> {
    const docs = await this.model
      .find({ orderId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async findByCustomerCpf(cpf: string): Promise<Notification[]> {
    const docs = await this.model
      .find({ customerCpf: cpf })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async findById(id: string): Promise<Notification | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async existsByEventIdAndChannel(
    eventId: string,
    channel: string,
  ): Promise<boolean> {
    return !!(await this.model.exists({ eventId, channel }));
  }

  async incrementRetry(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(id, { $inc: { retryCount: 1 } }).exec();
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
    errorMessage?: string,
  ): Promise<void> {
    await this.model.findByIdAndUpdate(id, { status, errorMessage }).exec();
  }

  private toEntity(doc: NotificationDocument): Notification {
    return new Notification({
      id: doc._id.toString(),
      eventId: doc.eventId,
      orderId: doc.orderId,
      customerCpf: doc.customerCpf,
      channel: doc.channel as NotificationChannel,
      template: doc.template,
      variables: doc.variables,
      status: doc.status as NotificationStatus,
      sentAt: doc.sentAt,
      deliveredAt: doc.deliveredAt,
      errorMessage: doc.errorMessage,
      retryCount: doc.retryCount,
      correlationId: doc.correlationId,
    });
  }
}
