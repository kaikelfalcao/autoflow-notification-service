import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Template } from '../../../domain/entities/template.entity';
import { ITemplateRepository } from '../../../domain/repositories/template.repository.interface';
import {
  TemplateSchemaClass,
  TemplateDocument,
} from '../schemas/template.schema';

@Injectable()
export class TemplateMongooseRepository implements ITemplateRepository {
  constructor(
    @InjectModel(TemplateSchemaClass.name)
    private readonly model: Model<TemplateDocument>,
  ) {}

  async findAllActiveByCode(code: string): Promise<Template[]> {
    const docs = await this.model.find({ code, active: true }).exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async findAll(): Promise<Template[]> {
    const docs = await this.model.find().exec();
    return docs.map((doc) => this.toEntity(doc));
  }

  async update(
    code: string,
    data: Partial<Template>,
  ): Promise<Template | null> {
    const doc = await this.model
      .findOneAndUpdate({ code }, data, { new: true })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }

  async create(template: Omit<Template, 'id'>): Promise<Template> {
    const doc = await this.model.create(template);
    return this.toEntity(doc);
  }

  private toEntity(doc: TemplateDocument): Template {
    const t = new Template();
    t.id = doc._id.toString();
    t.code = doc.code;
    t.channel = doc.channel;
    t.subject = doc.subject;
    t.body = doc.body;
    t.active = doc.active;
    return t;
  }
}
