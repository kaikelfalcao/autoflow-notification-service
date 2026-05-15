import { Template } from '../entities/template.entity';

export abstract class ITemplateRepository {
  abstract findAllActiveByCode(code: string): Promise<Template[]>;
  abstract findAll(): Promise<Template[]>;
  abstract update(
    code: string,
    data: Partial<Template>,
  ): Promise<Template | null>;
  abstract create(template: Omit<Template, 'id'>): Promise<Template>;
}
