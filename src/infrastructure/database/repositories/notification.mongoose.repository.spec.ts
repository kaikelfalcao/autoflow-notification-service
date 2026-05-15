import { NotificationMongooseRepository } from './notification.mongoose.repository';
import {
  NotificationStatus,
  NotificationChannel,
  Notification,
} from '../../../domain/entities/notification.entity';

const makeDoc = (overrides = {}) => ({
  _id: { toString: () => 'notif-1' },
  eventId: 'evt-1',
  orderId: 'order-1',
  customerCpf: '12345678900',
  channel: 'EMAIL',
  template: 'BUDGET_GENERATED',
  variables: { customerName: 'João' },
  status: 'PENDING',
  sentAt: new Date('2024-01-01'),
  deliveredAt: undefined,
  errorMessage: undefined,
  retryCount: 0,
  correlationId: 'corr-1',
  ...overrides,
});

const makeQueryChain = (resolvedValue: unknown) => ({
  sort: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(resolvedValue),
  }),
  exec: jest.fn().mockResolvedValue(resolvedValue),
});

describe('NotificationMongooseRepository', () => {
  let repository: NotificationMongooseRepository;
  let mockModel: {
    create: jest.Mock;
    find: jest.Mock;
    findById: jest.Mock;
    findByIdAndUpdate: jest.Mock;
    exists: jest.Mock;
  };

  beforeEach(() => {
    mockModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      exists: jest.fn(),
    };

    repository = new NotificationMongooseRepository(mockModel as any);
  });

  describe('create', () => {
    it('should persist the notification and return a domain entity', async () => {
      const doc = makeDoc();
      mockModel.create.mockResolvedValue(doc);

      const result = await repository.create({
        eventId: 'evt-1',
        orderId: 'order-1',
        customerCpf: '12345678900',
        channel: NotificationChannel.EMAIL,
        template: 'BUDGET_GENERATED',
        variables: {},
        status: NotificationStatus.PENDING,
        sentAt: new Date(),
        correlationId: 'corr-1',
      });

      expect(result).toBeInstanceOf(Notification);
      expect(result.id).toBe('notif-1');
      expect(result.status).toBe(NotificationStatus.PENDING);
    });

    it('should always create with retryCount 0', async () => {
      mockModel.create.mockResolvedValue(makeDoc());

      await repository.create({
        eventId: 'evt-1',
        orderId: 'order-1',
        customerCpf: '123',
        channel: NotificationChannel.EMAIL,
        template: 'TEST',
        variables: {},
        status: NotificationStatus.PENDING,
        sentAt: new Date(),
      });

      expect(mockModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ retryCount: 0 }),
      );
    });
  });

  describe('findByOrderId', () => {
    it('should query by orderId and return domain entities', async () => {
      const docs = [
        makeDoc(),
        makeDoc({ _id: { toString: () => 'notif-2' }, eventId: 'evt-2' }),
      ];
      mockModel.find.mockReturnValue(makeQueryChain(docs));

      const result = await repository.findByOrderId('order-1');

      expect(mockModel.find).toHaveBeenCalledWith({ orderId: 'order-1' });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Notification);
    });

    it('should return empty array when no notifications found', async () => {
      mockModel.find.mockReturnValue(makeQueryChain([]));

      const result = await repository.findByOrderId('nonexistent');

      expect(result).toHaveLength(0);
    });
  });

  describe('findByCustomerCpf', () => {
    it('should query by customerCpf', async () => {
      mockModel.find.mockReturnValue(makeQueryChain([makeDoc()]));

      await repository.findByCustomerCpf('12345678900');

      expect(mockModel.find).toHaveBeenCalledWith({
        customerCpf: '12345678900',
      });
    });
  });

  describe('findById', () => {
    it('should return the notification when found', async () => {
      const doc = makeDoc();
      mockModel.findById.mockReturnValue(makeQueryChain(doc));

      const result = await repository.findById('notif-1');

      expect(result).toBeInstanceOf(Notification);
      expect(result!.id).toBe('notif-1');
    });

    it('should return null when not found', async () => {
      mockModel.findById.mockReturnValue(makeQueryChain(null));

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('existsByEventIdAndChannel', () => {
    it('should return true when notification exists', async () => {
      mockModel.exists.mockResolvedValue({ _id: 'notif-1' });

      const result = await repository.existsByEventIdAndChannel(
        'evt-1',
        'EMAIL',
      );

      expect(mockModel.exists).toHaveBeenCalledWith({
        eventId: 'evt-1',
        channel: 'EMAIL',
      });
      expect(result).toBe(true);
    });

    it('should return false when notification does not exist', async () => {
      mockModel.exists.mockResolvedValue(null);

      const result = await repository.existsByEventIdAndChannel(
        'evt-1',
        'EMAIL',
      );

      expect(result).toBe(false);
    });
  });

  describe('incrementRetry', () => {
    it('should call findByIdAndUpdate with $inc', async () => {
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await repository.incrementRetry('notif-1');

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('notif-1', {
        $inc: { retryCount: 1 },
      });
    });
  });

  describe('updateStatus', () => {
    it('should update status and errorMessage', async () => {
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await repository.updateStatus(
        'notif-1',
        NotificationStatus.FAILED,
        'API error',
      );

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('notif-1', {
        status: NotificationStatus.FAILED,
        errorMessage: 'API error',
      });
    });

    it('should update status without errorMessage when not provided', async () => {
      mockModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await repository.updateStatus('notif-1', NotificationStatus.SENT);

      expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith('notif-1', {
        status: NotificationStatus.SENT,
        errorMessage: undefined,
      });
    });
  });
});
