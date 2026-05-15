import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = NotificationSchemaClass & Document;

@Schema({ timestamps: true, collection: 'notifications' })
export class NotificationSchemaClass {
  @Prop({ required: true })
  eventId!: string;

  @Prop({ required: true })
  orderId!: string;

  @Prop({ required: true })
  customerCpf!: string;

  @Prop({ required: true })
  channel!: string;

  @Prop({ required: true })
  template!: string;

  @Prop({ type: Object })
  variables!: Record<string, unknown>;

  @Prop({ default: 'PENDING' })
  status!: string;

  @Prop()
  sentAt!: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  errorMessage?: string;

  @Prop({ default: 0 })
  retryCount!: number;

  @Prop()
  correlationId?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(
  NotificationSchemaClass,
);

// Garante idempotência por canal: mesmo evento pode gerar EMAIL + PUSH separadamente
NotificationSchema.index({ eventId: 1, channel: 1 }, { unique: true });
