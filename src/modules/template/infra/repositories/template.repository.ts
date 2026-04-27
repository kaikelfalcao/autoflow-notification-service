import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Template, TemplateDocument } from '../schemas/template.schema';

@Injectable()
export class TemplateRepository {
  constructor(
    @InjectModel(Template.name)
    private model: Model<TemplateDocument>,
  ) {}

  async findActiveByCode(code: string) {
    return this.model.findOne({ code, active: true });
  }

  async create(template: Partial<Template>): Promise<Template> {
    return this.model.create(template);
  }
}