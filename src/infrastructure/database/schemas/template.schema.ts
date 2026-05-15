import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TemplateDocument = TemplateSchemaClass & Document;

@Schema({ timestamps: true, collection: 'templates' })
export class TemplateSchemaClass {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  channel: string;

  @Prop()
  subject?: string;

  @Prop({ required: true })
  body: string;

  @Prop({ default: true })
  active: boolean;
}

export const TemplateSchema = SchemaFactory.createForClass(TemplateSchemaClass);

TemplateSchema.index({ code: 1, channel: 1 }, { unique: true });
