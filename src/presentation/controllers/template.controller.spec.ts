import { TemplateController } from './template.controller';
import { ITemplateRepository } from '../../domain/repositories/template.repository.interface';
import { Template } from '../../domain/entities/template.entity';

const makeTemplate = (): Template =>
  Object.assign(new Template(), {
    id: 'tmpl-1',
    code: 'BUDGET_GENERATED',
    channel: 'EMAIL',
    subject: 'Orçamento pronto',
    body: 'Olá {customerName}',
    active: true,
  });

describe('TemplateController', () => {
  let controller: TemplateController;
  let templateRepo: jest.Mocked<ITemplateRepository>;

  beforeEach(() => {
    templateRepo = {
      findAllActiveByCode: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    };

    controller = new TemplateController(templateRepo);
  });

  describe('findAll', () => {
    it('should return all templates from repository', async () => {
      const templates = [makeTemplate()];
      templateRepo.findAll.mockResolvedValue(templates);

      const result = await controller.findAll();

      expect(templateRepo.findAll).toHaveBeenCalled();
      expect(result).toEqual(templates);
    });
  });

  describe('update', () => {
    it('should update template by code and return updated entity', async () => {
      const updated = Object.assign(makeTemplate(), { active: false });
      templateRepo.update.mockResolvedValue(updated);

      const result = await controller.update('BUDGET_GENERATED', {
        active: false,
      });

      expect(templateRepo.update).toHaveBeenCalledWith('BUDGET_GENERATED', {
        active: false,
      });
      expect(result!.active).toBe(false);
    });

    it('should return null when template is not found', async () => {
      templateRepo.update.mockResolvedValue(null);

      const result = await controller.update('NONEXISTENT', {
        body: 'new body',
      });

      expect(result).toBeNull();
    });
  });
});
