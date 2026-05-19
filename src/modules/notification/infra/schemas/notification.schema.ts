import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  customerCpf: string;

  @Prop({ required: true })
  channel: string; // EMAIL | SMS | WHATSAPP | PUSH

  @Prop({ required: true })
  template: string;

  @Prop({ type: Object })
  variables: Record<string, any>;

  @Prop({ default: 'SENT' })
  status: 'SENT' | 'FAILED' | 'DELIVERED';

  @Prop()
  sentAt: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  errorMessage?: string;

  @Prop({ default: 0 })
  retryCount: number;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
