import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TemplateDocument = Template & Document;

@Schema({ timestamps: true })
export class Template {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  channel: string; // EMAIL | SMS | WHATSAPP | PUSH

  @Prop()
  subject?: string;

  @Prop({ required: true })
  body: string;

  @Prop({ default: true })
  active: boolean;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);