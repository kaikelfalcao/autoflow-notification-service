import { TemplateMongooseRepository } from './template.mongoose.repository';
import { Template } from '../../../domain/entities/template.entity';

const makeDoc = (overrides = {}) => ({
  _id: { toString: () => 'tmpl-1' },
  code: 'BUDGET_GENERATED',
  channel: 'EMAIL',
  subject: 'Orçamento pronto',
  body: 'Olá {customerName}',
  active: true,
  ...overrides,
});

const makeQueryChain = (resolvedValue: unknown) => ({
  exec: jest.fn().mockResolvedValue(resolvedValue),
});

describe('TemplateMongooseRepository', () => {
  let repository: TemplateMongooseRepository;
  let mockModel: {
    find: jest.Mock;
    findOne: jest.Mock;
    findOneAndUpdate: jest.Mock;
    create: jest.Mock;
  };

  beforeEach(() => {
    mockModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      create: jest.fn(),
    };

    repository = new TemplateMongooseRepository(mockModel as any);
  });

  describe('findAllActiveByCode', () => {
    it('should query active templates by code and return domain entities', async () => {
      const docs = [
        makeDoc(),
        makeDoc({ channel: 'PUSH', _id: { toString: () => 'tmpl-2' } }),
      ];
      mockModel.find.mockReturnValue(makeQueryChain(docs));

      const result = await repository.findAllActiveByCode('BUDGET_GENERATED');

      expect(mockModel.find).toHaveBeenCalledWith({
        code: 'BUDGET_GENERATED',
        active: true,
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Template);
    });

    it('should return empty array when no active templates exist', async () => {
      mockModel.find.mockReturnValue(makeQueryChain([]));

      const result = await repository.findAllActiveByCode('UNKNOWN_EVENT');

      expect(result).toHaveLength(0);
    });
  });

  describe('findAll', () => {
    it('should return all templates', async () => {
      mockModel.find.mockReturnValue(makeQueryChain([makeDoc()]));

      const result = await repository.findAll();

      expect(mockModel.find).toHaveBeenCalledWith();
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update template by code and return updated entity', async () => {
      const updatedDoc = makeDoc({ active: false });
      mockModel.findOneAndUpdate.mockReturnValue(makeQueryChain(updatedDoc));

      const result = await repository.update('BUDGET_GENERATED', {
        active: false,
      });

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { code: 'BUDGET_GENERATED' },
        { active: false },
        { new: true },
      );
      expect(result).toBeInstanceOf(Template);
      expect(result!.active).toBe(false);
    });

    it('should return null when template not found', async () => {
      mockModel.findOneAndUpdate.mockReturnValue(makeQueryChain(null));

      const result = await repository.update('NONEXISTENT', { active: false });

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return domain entity', async () => {
      mockModel.create.mockResolvedValue(makeDoc());

      const result = await repository.create({
        code: 'BUDGET_GENERATED',
        channel: 'EMAIL',
        body: 'Olá {customerName}',
        active: true,
      });

      expect(result).toBeInstanceOf(Template);
      expect(result.code).toBe('BUDGET_GENERATED');
    });
  });
});
